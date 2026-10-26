'use strict';
/* MR-S10 P01 ERL V2 — live read-only GIS evidence check.
   Never print personal data, raw coordinates or bulk feature payloads.
   Network faults do not convert unverified GIS into invented stations.
 */
const api=require('../assets/mrs10-erl-v2-model.js');
const gis=require('../assets/mrs10-erl-v2-gis.js');
(async()=>{
 try{
  const response=await fetch(gis.requestUrl,{signal:AbortSignal.timeout(13000)});
  console.log('ERL_GIS_HTTP',response.status);
  if(!response.ok)return console.log('ERL_GIS_STATUS NETWORK_OR_SOURCE_UNAVAILABLE');
  const json=await response.json();
  if(json.error||!Array.isArray(json.features)){
   console.log('ERL_GIS_STATUS SOURCE_SCHEMA_UNAVAILABLE',json.error?.code||'UNKNOWN');return;
  }
  for(const [index,feature] of json.features.entries()){
   const p=feature?.attributes||feature?.properties||{};
   const geo=feature?.geometry||{},coords=Array.isArray(geo.coordinates)?geo.coordinates:[geo.x,geo.y];
   const [lon,lat]=coords;
   const inBounds=Number.isFinite(lon)&&Number.isFinite(lat)&&lon>=gis.bbox.minLon&&lon<=gis.bbox.maxLon&&lat>=gis.bbox.minLat&&lat<=gis.bbox.maxLat;
   console.log('ERL_GIS_PUBLIC_SOURCE_ROW',JSON.stringify({index:index+1,name:String(p.STN_NAME||'').slice(0,95),code:String(p.STN_CODE||'').slice(0,35),sourceId:p.FID??p.OBJECTID??null,withinBounds:inBounds}));
  }
  const out=gis.decode(json.features,api);
  console.log('ERL_GIS_TOTAL_SOURCE_FEATURES',json.features.length);
  console.log('ERL_GIS_MATCHED_UNIQUE_STATION_IDS',out.matched);
  console.log('ERL_GIS_UNMATCHED_STATIONS',out.missing);
  console.log('ERL_GIS_REJECTED_OR_AMBIGUOUS',out.rejected);
  console.log('ERL_GIS_MATCHED_STATIONS',out.points.map(x=>x.stationId).join(','));
  console.log('ERL_GIS_VERIFICATION',out.matched===6?'SECONDARY_GIS_SIX_MATCHES_NOT_SURVEYED':'PARTIAL_OR_UNVERIFIED');
  if(out.missing)console.log('ERL_GIS_MISSING_STATION_IDS',api.stops.filter(s=>!out.points.some(p=>p.stationId===s.id)).map(x=>x.id).join(','));
 }catch(e){
  console.log('ERL_GIS_STATUS READ_ONLY_AUDIT_UNAVAILABLE',String(e?.message||e).slice(0,125));
 }
})();
