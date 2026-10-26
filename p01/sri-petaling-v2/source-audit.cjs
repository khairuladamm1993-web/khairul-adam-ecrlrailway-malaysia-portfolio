/* Read-only external GIS evidence audit. Run in CI/build; never fabricates coordinates.
 * Failure of public endpoint does not imply zero stations or approve any geometry.
 */
'use strict';
const api=require('./catalogue.js'),gis=require('./gis.js');
(async()=>{
 try{
  const ctrl=new AbortController();
  const id=setTimeout(()=>ctrl.abort(),14000);
  let response;try{response=await fetch(gis.queryUrl,{signal:ctrl.signal,headers:{Accept:'application/json'}})}
  finally{clearTimeout(id)}
  if(!response.ok)throw new Error('HTTP '+response.status);
  const payload=await response.json();
  if(!Array.isArray(payload.features))throw new Error('NO_FEATURES '+JSON.stringify(payload.error||{}).slice(0,160));
  const result=gis.decode(payload.features,api);
  console.log('SOURCE_AUDIT_LAYER: '+gis.sourceUrl);
  console.log('SOURCE_AUDIT_RAW_RECORDS: '+payload.features.length);
  console.log('SOURCE_AUDIT_MATCHED: '+result.matched+'/29');
  console.log('SOURCE_AUDIT_REJECTED: '+result.rejected);
  console.log('SOURCE_AUDIT_MISSING: '+api.stations.filter(s=>!result.data.find(p=>p.stationId===s.id)).map(s=>s.serviceCode+':'+s.name).join(' | '));
  console.log('SOURCE_AUDIT_REASONS: '+JSON.stringify(result.failures||[]));
  console.log('SOURCE_AUDIT_RAW_REJECTS: '+JSON.stringify(payload.features.filter(f=>(result.failures||[]).some(r=>r.sourceId===(f?.attributes?.FID??f?.attributes?.OBJECTID??f?.attributes?.id))).map(f=>({FID:f.attributes?.FID,name:f.attributes?.STN_NAME,code:f.attributes?.STN_CODE}))));
  console.log('SOURCE_AUDIT_CLASSIFICATION: PUBLIC_POI_NOT_OPERATING_SURVEY');
  if(result.matched!==29)process.exitCode=3;
 }catch(e){
  console.error('SOURCE_AUDIT_UNAVAILABLE: '+String(e.message||e));
  process.exitCode=4;
 }
})();
