/* MR-S10 P01 Unified V4 — service registries + third-party sourced POINT GIS.
   Operator sequence is authoritative; third-party ArcGIS locations are REFERENCES,
   never surveys, physical tracks, or inferred alignments. No authored coordinates. */
(function(root){
'use strict';
const arcgis='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer';
const defs=Object.freeze([
 Object.freeze({id:'mrt-kajang',category:'MRT',label:'MRT Kajang',color:'#087D43',layer:6,expected:29}),
 Object.freeze({id:'lrt-kelana-jaya',category:'LRT',label:'LRT Kelana Jaya',color:'#D50032',layer:3,expected:37}),
 Object.freeze({id:'lrt-ampang',category:'LRT',label:'LRT Ampang',color:'#A65100',layer:1,expected:18}),
 Object.freeze({id:'mrt-putrajaya',category:'MRT',label:'MRT Putrajaya',color:'#FBCD20',layer:8,expected:36})
]);
const interchangeRegistry=Object.freeze([
 Object.freeze({id:'ic-kwasa',station:'Kwasa Damansara',relation:'SAME_FACILITY_PASSENGER_INTERCHANGE',routes:['mrt-kajang','mrt-putrajaya']}),
 Object.freeze({id:'ic-trx',station:'Tun Razak Exchange (TRX)',relation:'SAME_FACILITY_PASSENGER_INTERCHANGE',routes:['mrt-kajang','mrt-putrajaya']}),
 Object.freeze({id:'ic-pasar-seni',station:'Pasar Seni',relation:'PASSENGER_TRANSFER_CONNECTION',routes:['mrt-kajang','lrt-kelana-jaya']}),
 Object.freeze({id:'ic-ampang-park',station:'Ampang Park',relation:'PASSENGER_TRANSFER_CONNECTION',routes:['lrt-kelana-jaya','mrt-putrajaya']}),
 Object.freeze({id:'ic-titiwangsa',station:'Titiwangsa',relation:'PASSENGER_TRANSFER_CONNECTION',routes:['lrt-ampang','mrt-putrajaya']})
]);
function normalise(value){
 return String(value||'').normalize('NFKC').toLowerCase()
  .replace(/\([^)]*\)/g,'').replace(/\b(mrt|lrt|station|stesen|rapid kl)\b/g,' ')
  .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function sourceUrl(layer){
 return arcgis+'/'+layer+'/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';
}
function safePoint(feature){
 const g=feature?.geometry||{};
 const xy=g.type==='Point'&&Array.isArray(g.coordinates)?g.coordinates:[g.x,g.y];
 const x=Number(xy[0]),y=Number(xy[1]);
 return Number.isFinite(x)&&Number.isFinite(y)&&x>=100.4&&x<=102.3&&y>=2.25&&y<=4.0?[x,y]:null;
}
function value(obj,keys){
 for(const k of keys){if(obj?.[k]!=null&&String(obj[k]).trim())return String(obj[k]).trim()}
 return '';
}
function sourceFields(feature){
 const p=feature?.attributes||feature?.properties||{};
 return {
  name:value(p,['STN_NAME','STATION_NAME','Station_Name','station_name','STATION','Station','NAME','Name','name','NAMA_STESEN']),
  code:value(p,['STN_CODE','STATION_CODE','Station_Code','station_code','CODE','Code','code']),
  objectId:value(p,['OBJECTID','ObjectID','FID','objectid','id'])
 };
}
function stationsFor(id,kl,ampang){
 if(id==='lrt-ampang')return (ampang?.stations||[]).map(s=>({id:s.id,name:s.name,code:s.serviceCode,order:s.order}));
 const route=kl?.findRoute?.(id);
 if(!route)return [];
 return route.stationSequence.map((stationId,i)=>{
  const s=kl.catalog.stations.find(x=>x.id===stationId);
  return s?{id:s.id,name:s.name,code:s.code||'',order:i+1}:null;
 }).filter(Boolean);
}
function loadManifest(kl,ampang){
 if(!kl?.validateRegistry?.()||!ampang?.validate?.())throw new Error('BASELINE_REGISTRY_INVALID');
 return defs.map(d=>{
  const stops=stationsFor(d.id,kl,ampang);
  if(stops.length!==d.expected||new Set(stops.map(s=>s.id)).size!==stops.length)throw new Error('STATION_SEQUENCE_INVALID:'+d.id);
  return Object.freeze({...d,stops:Object.freeze(stops),source:sourceUrl(d.layer),
   coordinateStatus:'LIVE_SECONDARY_GIS_UNVERIFIED_UNTIL_MATCHED',alignment:null});
 });
}
// Two exact FID/name/code source corrections observed on live ArcGIS layer 6.
// The GIS geometry is untouched. Evidence: GitHub Actions 40402990961.
// These are NOT blanket fuzzy-match rules or inferred source coordinates.
const kajangCorrections=Object.freeze([
 Object.freeze({fid:'21',rawName:'TAMAN CONNAUGH',rawCode:'KG26',stationId:'mrt-taman-connaught',
   evidence:'https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40402990961'}),
 Object.freeze({fid:'25',rawName:'BATU 11 CHERAS',rawCode:'KG3O',stationId:'mrt-batu-sebelas-cheras',
   evidence:'https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/40402990961'})
]);
function exactKajangCorrection(route,props){
 if(route.id!=='mrt-kajang'||route.layer!==6)return null;
 const hit=kajangCorrections.find(c=>props.objectId===c.fid&&
  props.name.trim().toUpperCase()===c.rawName&&props.code.trim().toUpperCase()===c.rawCode);
 return hit?route.stops.find(s=>s.id===hit.stationId)||null:null;
}
function decodeArcgis(route,payload,ampangGIS,ampangService){
 if(!Array.isArray(payload?.features)||payload?.error)return {ok:false,reason:'INVALID_GIS_RESPONSE',points:[],matched:0,expected:route.expected};
 if(route.id==='lrt-ampang'){
  const decoded=ampangGIS?.decode?.(payload.features,ampangService);
  if(!decoded?.ok)return {ok:false,reason:decoded?.reason||'AMPANG_DECODER_MISSING',points:[],matched:0,expected:route.expected};
  return {ok:true,reason:decoded.reason,points:decoded.data.map(p=>({id:p.id,name:p.name,code:p.code||'',routeId:route.id,coordinates:[...p.coordinates],sourceId:p.sourceId})),matched:decoded.matched,expected:route.expected};
 }
 const names=new Map(),codes=new Map();
 for(const s of route.stops){
  const key=normalise(s.name);
  if(names.has(key))return {ok:false,reason:'AMBIGUOUS_REGISTRY_NAME',points:[],matched:0,expected:route.expected};
  names.set(key,s);
  if(s.code)codes.set(normalise(s.code),s);
 }
 const found=new Map(),ambiguous=new Set();
 for(const f of payload.features){
  const props=sourceFields(f),coords=safePoint(f);
  if(!coords||!props.name)continue;
  const clean=normalise(props.name.replace(/^(?:KG|PY|KJ|AG)0?\d{1,2}\s+/i,''));
  const nameCandidate=names.get(clean);
  const codeCandidate=codes.get(normalise(props.code));
  // A source code must never override a contradictory matched name.
  if(nameCandidate&&codeCandidate&&nameCandidate.id!==codeCandidate.id)continue;
  const corrected=exactKajangCorrection(route,props);
  if(corrected&&((nameCandidate&&nameCandidate.id!==corrected.id)||(codeCandidate&&codeCandidate.id!==corrected.id)))continue;
  const s=nameCandidate||codeCandidate||corrected;
  if(!s)continue;
  // Code-only reconciliation requires registered code; correction requires exact source tuple.
  if(!nameCandidate&&!corrected&&!s.code)continue;
  if(found.has(s.id)){ambiguous.add(s.id);continue}
  found.set(s.id,{id:s.id,name:s.name,code:s.code||'',routeId:route.id,
   coordinates:coords,sourceId:props.objectId,sourceName:props.name});
 }
 for(const id of ambiguous)found.delete(id);
 const points=route.stops.map(s=>found.get(s.id)).filter(Boolean);
 return {ok:true,reason:points.length===route.expected?'MATCHED_ALL':'PARTIAL_SOURCE_MATCH',
  points,matched:points.length,expected:route.expected,rejectedAmbiguous:ambiguous.size};
}
function toGeoJSON(routeResults){
 const features=[];
 for(const r of routeResults){
  for(const s of (r?.points||[])){
   features.push({type:'Feature',id:s.routeId+':'+s.id,
    properties:{id:s.id,routeId:s.routeId,name:s.name,code:s.code,
     provenance:'ARCGIS_PUBLIC_THIRD_PARTY_GIS_REFERENCE'},
    geometry:{type:'Point',coordinates:s.coordinates}});
  }
 }
 return {type:'FeatureCollection',features};
}
const api=Object.freeze({arcgis,defs,interchangeRegistry,normalise,sourceUrl,safePoint,sourceFields,stationsFor,loadManifest,decodeArcgis,toGeoJSON});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10UnifiedV4Registry=api;
})(typeof window!=='undefined'?window:null);
