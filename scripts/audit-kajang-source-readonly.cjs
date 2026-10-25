'use strict';
/*
 * MR-S10 P01 R2.17.3 — READ-ONLY current-source diagnostic.
 * No credentials, mutations, secrets, map paint, deployment promotion or physical track approval.
 * Source responses remain third-party evidence requiring independent reconciliation.
 */
const baseOSM='https://api.openstreetmap.org/api/0.6';
const dbkl='https://cps.dbkl.gov.my/server/rest/services/CPS_Public/CPS_Public/FeatureServer/13/query';
const selangor='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/15/query';
const overpass='https://overpass.private.coffee/api/interpreter';
const withQuery=(base,query)=>base+'?'+new URLSearchParams(query).toString();
const endpoints=Object.freeze([
 Object.freeze({id:'osm_relation_8000326',kind:'osm-relation',url:baseOSM+'/relation/8000326'}),
 Object.freeze({id:'osm_way_778403716',kind:'osm-way',url:baseOSM+'/way/778403716/full'}),
 Object.freeze({id:'dbkl_mrt1_segments',kind:'arcgis',url:withQuery(dbkl,{
  where:'1=1',outFields:'OBJECTID_1,dari_stese,hingga_ste,jenis_trek,Operator,sistem',
  returnGeometry:'true',outSR:'4326',resultRecordCount:'75',f:'json'})}),
 Object.freeze({id:'overpass_osm_candidates',kind:'overpass',url:withQuery(overpass,{
  data:'[out:json][timeout:8];(relation(8000326);way(778403716););out body;'})}),
 Object.freeze({id:'selangor_mrt_kajang',kind:'arcgis',url:withQuery(selangor,{
  where:'1=1',outFields:'*',returnGeometry:'true',outSR:'4326',resultRecordCount:'75',f:'json'})})
]);
function tags(xml){
 const out={};for(const m of xml.matchAll(/<tag\s+k="([^"]+)"\s+v="([^"]*)"\s*\/>/g)){
  if(['name','name:en','type','route','network','ref','operator','railway','usage','gauge','electrified'].includes(m[1]))out[m[1]]=m[2];
 }return out;
}
function osmSummary(xml,kind,id){
 if(typeof xml!=='string'||xml.length>3000000)throw Error('INVALID_OR_LARGE_XML');
 const pattern=kind==='osm-relation'?/<relation\b([^>]*)>([\s\S]*?)<\/relation>/g:/<way\b([^>]*)>([\s\S]*?)<\/way>/g;
 let found=null;for(const m of xml.matchAll(pattern)){if(new RegExp('\\bid="'+id+'"').test(m[1])){found=m;break}}
 if(!found)return {status:'NO_EXACT_ELEMENT',kind,id};
 const attrs=found[1],body=found[2];const values=tags(body);
 const version=attrs.match(/\bversion="(\d+)"/)?.[1]||null;
 if(kind==='osm-relation'){
  const ms=Array.from(body.matchAll(/<member\s+[^>]*type="([^"]+)"[^>]*ref="(\d+)"[^>]*role="([^"]*)"[^>]*\/>/g));
  const members=ms.length,ways=ms.filter(m=>m[1]==='way').length,stops=ms.filter(m=>m[3].includes('stop')).length;
  return {status:'LIVE_ENTITY_READ',kind,id,version,tags:values,members,ways,stops,
   candidateOnly:true,geometryVerified:false,wayContinuityVerified:false};
 }
 const refs=Array.from(body.matchAll(/<nd\s+ref="(\d+)"\s*\/>/g));
 const nodeSet=new Set(Array.from(xml.matchAll(/<node\b[^>]*id="(\d+)"[^>]*\/?>/g),m=>m[1]));
 return {status:'LIVE_ENTITY_READ',kind,id,version,tags:values,nodeRefs:refs.length,
  returnedNodes:nodeSet.size,allReferencedNodesPresent:refs.length>1&&refs.every(x=>nodeSet.has(x[1])),
  candidateOnly:true,geometryVerified:false,relationMembershipVerified:false};
}
function haversineKm(a,b){
 const rad=Math.PI/180,R=6371.0088;
 const dLat=(b[1]-a[1])*rad,dLon=(b[0]-a[0])*rad,latA=a[1]*rad,latB=b[1]*rad;
 const q=Math.sin(dLat/2)**2+Math.cos(latA)*Math.cos(latB)*Math.sin(dLon/2)**2;
 return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));
}
function overpassSummary(payload,id){
 if(payload?.remark&&/runtime error|too many requests|rate limit/i.test(payload.remark))
  return {id,status:'OVERPASS_UNAVAILABLE',reason:String(payload.remark).slice(0,110),candidateOnly:true,geometryVerified:false};
 const els=payload?.elements;
 if(!Array.isArray(els))return {id,status:'OVERPASS_NO_ELEMENTS',candidateOnly:true,geometryVerified:false};
 const relation=els.find(e=>e.type==='relation'&&e.id===8000326);
 const way=els.find(e=>e.type==='way'&&e.id===778403716);
 const membership=Array.isArray(relation?.members)&&relation.members.some(m=>m.type==='way'&&m.ref===778403716);
 return {id,status:'OVERPASS_RESPONSE_READ',foundRelation:!!relation,relationVersion:relation?.version??null,
  relationTags:relation?.tags?Object.fromEntries(Object.entries(relation.tags).filter(([k])=>['type','route','network','name','operator','ref'].includes(k))):null,
  relationMemberCount:relation?.members?.length??null,relationWayCount:relation?.members?.filter(m=>m.type==='way').length??null,
  foundWay:!!way,wayVersion:way?.version??null,
  wayTags:way?.tags?Object.fromEntries(Object.entries(way.tags).filter(([k])=>['railway','name','operator','ref','usage'].includes(k))):null,
  candidateWayInRelation:membership,candidateOnly:true,geometryVerified:false,continuityVerified:false};
}
function arcgisSummary(payload,id){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('NON_JSON_GIS');
 if(payload.error)return {status:'GIS_ERROR',id,errorCode:payload.error.code||null,message:String(payload.error.message||'').slice(0,120)};
 if(!Array.isArray(payload.features))return {status:'GIS_NO_FEATURE_COLLECTION',id};
 const features=payload.features;
 const geometryFeatures=features.filter(f=>Array.isArray(f.geometry?.paths)&&f.geometry.paths.length>0);
 const pointCounts=geometryFeatures.map(f=>f.geometry.paths.reduce((n,p)=>n+(Array.isArray(p)?p.length:0),0));
 const sample=features.slice(0,3).map(f=>({from:f.attributes?.dari_stese??null,to:f.attributes?.hingga_ste??null,
  operator:f.attributes?.Operator??null,system:f.attributes?.sistem??null,trackType:f.attributes?.jenis_trek??null}));
 const keys=Object.keys(features[0]?.attributes||{}).sort();
 const selected=keys.filter(k=>/name|route|operator|sistem|line|type|jenis|kajang|track|status|laluan|length|panjang|Shape/i.test(k)).slice(0,16);
 // The GIS layer index 15 is a MULTI-ROUTE collection despite its advertised
 // name. Never infer that its entire collection belongs to MRT Kajang.
 const kajangNames=new Set([
  'Laluan Kajang (Kwasa Damansara → Kajang)',
  'Laluan Kajang (Kajang → Kwasa Damansara)'
 ]);
 const directedKajang=features.filter(f=>kajangNames.has(String(f.attributes?.name||'').trim()));
 const nonKajangRouteExamples=[...new Set(features.map(f=>String(f.attributes?.name||'').trim())
  .filter(n=>n&&!kajangNames.has(n)))].slice(0,6);
 let kajangLengthKm=0,kajangVertices=0,minKLon=Infinity,minKLat=Infinity,maxKLon=-Infinity,maxKLat=-Infinity;
 for(const f of directedKajang){
  for(const p of f.geometry?.paths||[]){
   if(!Array.isArray(p))continue;
   for(let i=0;i<p.length;i++){
    const c=p[i];if(!Array.isArray(c)||c.length<2||!Number.isFinite(c[0])||!Number.isFinite(c[1]))continue;
    minKLon=Math.min(minKLon,c[0]);minKLat=Math.min(minKLat,c[1]);
    maxKLon=Math.max(maxKLon,c[0]);maxKLat=Math.max(maxKLat,c[1]);kajangVertices++;
    if(i>0&&Array.isArray(p[i-1])&&Number.isFinite(p[i-1][0])&&Number.isFinite(p[i-1][1]))
     kajangLengthKm+=haversineKm(p[i-1],c);
   }
  }
 }
 const kajangDirectedCandidates=directedKajang.slice(0,10).map(f=>({
  name:String(f.attributes?.name||'').slice(0,110),osmType:String(f.attributes?.osm_type||'').slice(0,20),
  osmId:String(f.attributes?.osm_id??'').slice(0,28),fullId:String(f.attributes?.full_id??'').slice(0,40),
  paths:f.geometry?.paths?.length??0,
  vertices:f.geometry?.paths?.reduce((n,p)=>n+(Array.isArray(p)?p.length:0),0)??0
 }));
 const distinct={};for(const key of selected){
  const values=[...new Set(features.map(f=>String(f.attributes?.[key]??'').trim()).filter(Boolean))];
  distinct[key]=values.slice(0,8).map(x=>x.slice(0,60));
 }
 let lengthKm=0,vertices=0,minLon=Infinity,minLat=Infinity,maxLon=-Infinity,maxLat=-Infinity;
 for(const f of geometryFeatures){for(const p of f.geometry.paths){
  if(!Array.isArray(p))continue;
  for(let i=0;i<p.length;i++){
   const c=p[i];if(!Array.isArray(c)||c.length<2||!Number.isFinite(c[0])||!Number.isFinite(c[1])||
    c[0]<99||c[0]>120||c[1]<0||c[1]>8)continue;
   minLon=Math.min(minLon,c[0]);minLat=Math.min(minLat,c[1]);
   maxLon=Math.max(maxLon,c[0]);maxLat=Math.max(maxLat,c[1]);vertices++;
   if(i>0&&Array.isArray(p[i-1])&&Number.isFinite(p[i-1][0])&&Number.isFinite(p[i-1][1]))
    lengthKm+=haversineKm(p[i-1],c);
  }
 }}
 return {status:'LIVE_FEATURE_COLLECTION_READ',id,featureCount:features.length,geometryFeatureCount:geometryFeatures.length,
  pointCountTotal:pointCounts.reduce((a,b)=>a+b,0),validatedVertices:vertices,
  bounds:vertices?[minLon,minLat,maxLon,maxLat].map(n=>Number(n.toFixed(5))):null,
  undeduplicatedFeatureLengthKm:Number(lengthKm.toFixed(2)),
  lengthCaveat:'Sum of all GIS feature paths, NOT operator service length or verified physical single-track kilometres',
  attrKeys:keys.slice(0,25),distinctRelevantAttributes:distinct,
  containsOtherRoutes:nonKajangRouteExamples.length>0,
  nonKajangRouteExamples,
  kajangDirectedCandidateCount:directedKajang.length,
  kajangDirectedCandidates,
  kajangDirectedUndeduplicatedLengthKm:Number(kajangLengthKm.toFixed(2)),
  kajangDirectedVertices:kajangVertices,
  kajangDirectedBounds:kajangVertices?[minKLon,minKLat,maxKLon,maxKLat].map(n=>Number(n.toFixed(5))):null,
  gisKajangCaveat:'Direction-specific service route geometry, NOT distinct survey tracks; cannot draw physical Kajang alignment without source/rights/topology review',
  exceededTransferLimit:!!payload.exceededTransferLimit,
  sample,candidateOnly:true,geometryVerified:false,sourceLicenseVerified:false,fullCorridorCovered:false};
}
async function fetchBounded(url){
 const r=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(9000),
  headers:{Accept:'application/json,application/xml,text/xml'}});
 if(!r.ok)throw Error('HTTP_'+r.status);
 const chunks=[];let size=0;const reader=r.body?.getReader();if(!reader)throw Error('NO_BODY');
 try{
  while(true){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;
   if(size>3000000)throw Error('RESPONSE_TOO_LARGE');chunks.push(x.value);
  }
 }finally{try{await reader.cancel()}catch{}}
 return Buffer.concat(chunks).toString('utf8');
}
async function probe(e,fetcher=fetchBounded){
 try{
  const body=await fetcher(e.url);
  const result=e.kind==='arcgis'?arcgisSummary(JSON.parse(body),e.id):
   e.kind==='overpass'?overpassSummary(JSON.parse(body),e.id):
   osmSummary(body,e.kind,e.id.replace('osm_relation_','').replace('osm_way_',''));
  return {...result,source:e.url};
 }catch(err){return {id:e.id,status:'SOURCE_UNAVAILABLE',reason:String(err?.message||err).slice(0,90),source:e.url,
  candidateOnly:true,geometryVerified:false};}
}
async function main(){
 const results=await Promise.all(endpoints.map(x=>probe(x)));
 for(const r of results)console.log('KAJANG_SOURCE_AUDIT '+JSON.stringify(r));
 console.log('KAJANG_ALIGNMENT_DECISION '+JSON.stringify({
  review:'UNVERIFIED',acceptedWayIds:[],verifiedPhysicalTracks:0,
  fullGreenPhysicalAlignmentAllowed:false,requestedLayer:'mrt-kajang',
  reason:'Source observations cannot alone certify full track way membership, network continuity, KTM exclusion and reuse rights.'
 }));
}
if(require.main===module)main().catch(e=>{console.error('KAJANG_AUDIT_INTERNAL_ERROR',e.message);process.exitCode=1});
module.exports={endpoints,tags,osmSummary,arcgisSummary,overpassSummary,probe};
