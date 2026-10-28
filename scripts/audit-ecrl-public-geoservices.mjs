/* P01 public GIS source audit. READ-ONLY. Never downloads/publishes feature geometry.
 * Network failure is recorded as unavailable. Metadata alone never passes survey QA.
 * Outputs only provider description, field names, counts and query status. */
import fs from 'node:fs/promises';
const SOURCES=Object.freeze([
 {id:'MOT_MYGEOPORTAL_RAIL',agency:'MOT / MyGeoportal',url:'https://mygos.mygeoportal.gov.my/gisserver/rest/services/MOT/MOT_MyLogistik_Public/MapServer/16',type:'OFFICIAL_PUBLIC_GIS',identity:'RAIL_GENERIC_NOT_PROVEN_ECRL',license:'VERIFY_REUSE_TERMS'},
 {id:'SELANGOR_RSN_ECRL',agency:'ArcGIS RSN map (publisher identity to be verified)',url:'https://services-ap1.arcgis.com/25GhUqvPnzPICV7I/ArcGIS/rest/services/RSN_6_3_WFL1/FeatureServer/22',type:'PLANNING_GIS_CANDIDATE',identity:'LAYER_NAMED_ECRL_UNVERIFIED_AS_BUILT',license:'UNKNOWN'},
 {id:'SELANGOR_RSN_ECRL_ALT',agency:'ArcGIS RSN alternate edition (publisher identity to be verified)',url:'https://services-ap1.arcgis.com/25GhUqvPnzPICV7I/ArcGIS/rest/services/Map_RSN_6_1_WFL1/FeatureServer/17',type:'PLANNING_GIS_CANDIDATE',identity:'LAYER_NAMED_ECRL_UNVERIFIED_AS_BUILT',license:'UNKNOWN'},
 {id:'MPKLANG_RAIL',agency:'Majlis Klang public GIS',url:'https://gis.mpklang.gov.my/server/rest/services/TRANSPORTATION_NETWORK/FeatureServer/9',type:'OFFICIAL_LOCAL_RAIL_GIS',identity:'RAIL_GENERIC_NOT_PROVEN_ECRL',license:'VERIFY_REUSE_TERMS'}
]);
function classify(meta,source){
 if(!meta||meta.error)return 'UNAVAILABLE';
 if(!/Polyline|Line/i.test(meta.geometryType||''))return 'NOT_A_TRACK_LINE';
 if(source.id==='MOT_MYGEOPORTAL_RAIL'){
  const labels=(meta.drawingInfo?.renderer?.uniqueValueInfos||[]).map(v=>String(v.label||'')).join(' ');
  return /\bECRL\b/i.test(labels)?'ECRL_LABELED_NEEDS_ASBUILT_PROOF':'GENERIC_RAIL_WITHOUT_ECRL_CLASS';
 }
 return /ECRL/i.test([meta.name,meta.description].join(' '))?'ECRL_NAMED_PLANNING_NEEDS_PROOF':'RAIL_IDENTITY_UNVERIFIED';
}
async function getJson(url,timeout=10000){
 const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),timeout);
 try{
  const res=await fetch(url,{signal:ctl.signal,headers:{'accept':'application/json','user-agent':'MR-S10-P01-Research-Audit/1.0'}});
  if(!res.ok)throw Error('HTTP_'+res.status);
  const data=await res.json();if(data.error)throw Error('ARCGIS_'+String(data.error.code||'ERROR'));
  return data;
 }finally{clearTimeout(timer)}
}
async function inspect(source){
 const summary={id:source.id,sourceType:source.type,url:source.url,identity:source.identity,license:source.license,
  metadata:'UNAVAILABLE',featureCount:null,identityMatchingCount:null,recordStatus:'NO_GEOMETRY_RELEASE',
  coordinateSystem:null,asBuiltVerified:false,plGeoreferenced:0,spurEndPointsVerified:0,
  suitabilityParcelsVerified:false,geometryExported:false};
 try{
  const meta=await getJson(source.url+'?f=pjson',12000);
  summary.metadata='AVAILABLE';
  summary.layerName=String(meta.name||'').slice(0,120);
  summary.geometryType=meta.geometryType||null;
  summary.coordinateSystem=meta.extent?.spatialReference?.latestWkid||meta.extent?.spatialReference?.wkid||null;
  summary.fieldNames=(meta.fields||[]).map(f=>f.name).filter(Boolean).slice(0,50);
  summary.hasChainageControlField=summary.fieldNames.some(n=>/^(CH|chainage|chainage_km|km_marker|km_post)$/i.test(n));
  summary.identityAssessment=classify(meta,source);
  if(summary.identityAssessment==='NOT_A_TRACK_LINE')return summary;
  try{
   const q=await getJson(source.url+'/query?where=1%3D1&returnCountOnly=true&f=json',12000);
   summary.featureCount=Number.isInteger(q.count)?q.count:null;
  }catch(e){summary.countQueryError=String(e.message).slice(0,120)}
  if(source.id.startsWith('SELANGOR_RSN_ECRL')&&['jenis','nama','jarak','status'].every(x=>summary.fieldNames.includes(x))){
   try{
    const fields='jenis,nama,jarak,status';
    const q=await getJson(source.url+'/query?where=1%3D1&outFields='+encodeURIComponent(fields)+'&returnGeometry=false&resultRecordCount=5&f=json',12000);
    summary.publicClassification=(q.features||[]).slice(0,5).map(f=>{
     const a=f.attributes||{};return Object.fromEntries(fields.split(',').map(k=>[k,typeof a[k]==='string'?a[k].slice(0,90):a[k]??null]));
    });
   }catch(e){summary.attributeQueryError=String(e.message).slice(0,120)}
  }
  if(source.id==='MOT_MYGEOPORTAL_RAIL'&&summary.fieldNames.includes('NAM')){
   try{
    const q=await getJson(source.url+'/query?where='+encodeURIComponent("NAM LIKE '%ECRL%'")+'&returnCountOnly=true&f=json',12000);
    summary.identityMatchingCount=Number.isInteger(q.count)?q.count:null;
   }catch(e){summary.identityQueryError=String(e.message).slice(0,120)}
  }
 }catch(e){summary.metadataError=String(e.message).slice(0,140)}
 return summary;
}
const summary=Object.freeze({
 runScope:'PUBLIC_GIS_METADATA_ONLY',publishedTrackGeometry:false,permittedNewPLPins:0,permittedRailEndPins:0,
 evidenceConfidence:'PRELIMINARY_NO_SURVEY',sourceReleaseApproval:'PENDING',chChainageToGeoMapping:'BLOCKED_NO_LINEAR_REFERENCING_CONTROL',
 roadResidentialParcelAudit:'NOT_RUN_NO_APPROVED_GEOMETRY'
});
async function run(){
 const sources=[];for(const s of SOURCES)sources.push(await inspect(s));
 const output={checkedAt:new Date().toISOString(),summary,sources};
 await fs.mkdir('artifacts/ecrl-gis-source-audit',{recursive:true});
 await fs.writeFile('artifacts/ecrl-gis-source-audit/source-metadata.json',JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify(output,null,2));
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)await run();
export {SOURCES,summary,classify,inspect,run};
