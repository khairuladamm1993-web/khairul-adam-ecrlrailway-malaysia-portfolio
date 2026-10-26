/* Read-only ArcGIS provenance audit. Only source metadata and station names in logs. */
const core=require('../assets/unified-v4-registry.js');
const kl=require('../assets/railway-track-registry-kl.js');
const am=require('../assets/mrs10-r219-ampang-service.js');
const gis=require('../assets/mrs10-r219-ampang-gis.js');
(async()=>{
for(const route of core.loadManifest(kl,am)){
 const response=await fetch(route.source,{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error('GIS_HTTP_'+response.status);
 const payload=await response.json();
 const result=core.decodeArcgis(route,payload,gis,am);
 const matching=new Set(result.points.map(p=>p.id));
 const missing=route.stops.filter(s=>!matching.has(s.id));
 console.log('GIS_PROVENANCE_AUDIT',JSON.stringify({
  route:route.id,layer:route.layer,sourceRecords:payload.features?.length,
  matched:result.matched,expected:route.expected,missing, 
  srcFeatures:missing.length?payload.features.map(f=>({id:core.sourceFields(f).objectId,name:core.sourceFields(f).name,code:core.sourceFields(f).code})):undefined
 }));
}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
