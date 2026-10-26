/* MR-S10 P01 SPL V2 public GIS candidate POIs.
 * Runtime source: ArcGIS FeatureServer/2. Station point != physical rail alignment.
 * Name AND (when present) SP code checked; reject duplicates/out-of-range.
 */
(function(root){
'use strict';
const sourceUrl='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/2';
const queryUrl=sourceUrl+'/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';
const bbox=Object.freeze({minLon:101.57,maxLon:101.73,minLat:2.98,maxLat:3.20});
function norm(s){return String(s||'').toLowerCase().normalize('NFKC')
 .replace(/\b(lrt|line|station|stesen|laluan|sri petaling line)\b/g,'')
 .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function attrs(f){return f?.attributes||f?.properties||{}}
function decode(features,catalogue){
 if(!catalogue?.validate?.()||!Array.isArray(features))
  return {ok:false,reason:'INVALID_SOURCE',data:[],matched:0,missing:29,rejected:0};
 const byName=new Map(catalogue.stations.map(s=>[norm(s.name),s]));
 const accepted=new Map(),duplicates=new Set(),reasons=[];
 for(const f of features){
  const p=attrs(f),g=f?.geometry||{};
  const name=String(p.STN_NAME||p.StationNam||p.STATION_NAME||p.name||p.NAME||'').trim();
  const rawCode=String(p.STN_CODE||p.StationCode||p.STATION_CODE||p.code||'').trim();
  const codeMatch=rawCode.match(/\bSP\s*0*(\d{1,2})\b/i);
  // Exact observed 2026-10-26 feature: FID=3, TITWANGSA, SP03.
  // This is an audited source spelling correction ONLY, not a fabricated POI.
  const observedSourceTypo=Number(p.FID??p.OBJECTID??p.id)===3 &&
    name.toUpperCase()==='TITWANGSA' && rawCode.toUpperCase()==='SP03';
  const station=byName.get(norm(name.replace(/^SP\s*\d+\s*/i,''))) ||
    (observedSourceTypo?catalogue.findByCode('SP3'):null);
  const point=g.type==='Point'&&Array.isArray(g.coordinates)?
    {x:g.coordinates[0],y:g.coordinates[1]}:g;
  const x=point.x,y=point.y,sourceId=p.FID??p.OBJECTID??p.id??null;
  let why='';
  if(!station)why='NAME_UNKNOWN';
  else if(codeMatch&&Number(codeMatch[1])!==Number(station.serviceCode.slice(2)))why='CODE_MISMATCH';
  else if(!Number.isFinite(x)||!Number.isFinite(y)||x<bbox.minLon||x>bbox.maxLon||y<bbox.minLat||y>bbox.maxLat)
    why='COORD_OUTSIDE_SOURCE_EXTENT';
  else if(accepted.has(station.id))why='DUPLICATE_STATION';
  if(why){
   reasons.push({sourceId,reason:why});
   if(why==='DUPLICATE_STATION')duplicates.add(station.id);
   continue;
  }
  accepted.set(station.id,Object.freeze({
   stationId:station.id,name:station.name,serviceCode:station.serviceCode,
   pairedAmpangCode:station.pairedAmpangCode,order:station.order,
   sharedStationKey:station.sharedStationKey,sharedService:station.sharedService,
   coordinates:Object.freeze([x,y]),sourceId,
   sourceName:name,sourceCode:rawCode,
   matchMethod:observedSourceTypo?'OBSERVED_GIS_FID3_TITWANGSA_SP03':'EXACT_SOURCE_NAME',
   provenance:'PUBLIC_ARCGIS_STATION_POI_NOT_OPERATING_SURVEY',
   serviceVerifiedFromGIS:false,trackGeometry:null
  }));
 }
 for(const d of duplicates)accepted.delete(d);
 const points=catalogue.stations.map(s=>accepted.get(s.id)).filter(Boolean);
 if(new Set(points.map(p=>p.coordinates.join(','))).size!==points.length)
  return {ok:false,reason:'COORDINATE_COLLISION',data:[],matched:0,missing:29,rejected:reasons.length};
 return Object.freeze({ok:true,reason:points.length===29?'MATCHED_ALL_PUBLIC_GIS_POINTS':'PARTIAL_GIS_MATCH',
  data:Object.freeze(points),matched:points.length,missing:29-points.length,
  rejected:reasons.length,failures:Object.freeze(reasons),sourceUrl});
}
function geojson(result){
 return {type:'FeatureCollection',features:(result?.ok?result.data:[]).map(p=>({
  type:'Feature',id:p.stationId,
  geometry:{type:'Point',coordinates:[...p.coordinates]},
  properties:{stationId:p.stationId,code:p.serviceCode,name:p.name,
   pairedAmpangCode:p.pairedAmpangCode||'',sharedStationKey:p.sharedStationKey||'',
   sharedService:p.sharedService,sourceId:String(p.sourceId??'')}
 }))};
}
function checkAmpangOverlap(result,ampangGeo){
 if(!result?.ok||!ampangGeo?.ok)return {status:'NOT_VERIFIED',compared:0};
 // Different public GIS layers may supply differing station centroids.
 // Do NOT shift or snap coordinates to fabricate equality.
 const byName=new Map(ampangGeo.data.map(p=>[p.name,p]));
 const diffs=[];
 for(const p of result.data.filter(s=>s.sharedService)){
  const a=byName.get(p.name);
  if(a)diffs.push({name:p.name,identical:p.coordinates[0]===a.coordinates[0]&&p.coordinates[1]===a.coordinates[1]});
 }
 return {status:'READ_ONLY_SOURCE_CROSSCHECK',compared:diffs.length,
  note:'Service identity shared; source positions may differ. Do not duplicate physical station.'};
}
const api=Object.freeze({sourceUrl,queryUrl,bbox,norm,decode,geojson,checkAmpangOverlap});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10SriPetalingGISV2=api;
})(typeof window!=='undefined'?window:null);
