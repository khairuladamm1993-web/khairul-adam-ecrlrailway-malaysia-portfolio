/* V7 KTM integration adapter: read-only official GTFS points and optional secondary GIS for Komuter gaps. */
(function(root){
'use strict';
const source='https://api.data.gov.my/gtfs-static/ktmb';
const secondary='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';
const data=root?.MRS10UnifiedV7KTMData||(typeof module==='object'?require('./ktm-dataset.js'):null);
const canonical=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');
const validLatLon=(lon,lat)=>Number.isFinite(lon)&&Number.isFinite(lat)&&lon>=99.5&&lon<=105&&lat>=1&&lat<=7.5;
function validate(d=data){
 if(!d||d.schema!=='MRS10_UNIFIED_V7_SAFE_KTM_ONLY'||d.sourceUrl!==source||
  !d.zipSha256||d.noPhysicalTrackGeometry!==true||d.komuterRegistry?.services?.length!==6||
  d.komuterStations?.length!==77||d.tripServices?.length!==2||
  d.tripServices[0].id!=='ktmb-ets-v1'||d.tripServices[1].id!=='ktmb-ert'||
  d.tripServices[0].routeId!=='ETS'||d.tripServices[1].routeId!=='ERT'||
  d.tripServices[0].stops.length!==38||d.tripServices[1].stops.length!==23||
  d.komuterRegistry.services.some(x=>x.geometry!==null)||
  d.tripServices.some(x=>x.serviceStatus!=='REPRESENTATIVE_OFFICIAL_GTFS_TRIP_NOT_ALL_SERVICE_VARIANTS'))return false;
 const ids=d.komuterRegistry.services.map(x=>x.id);
 if(new Set(ids).size!==6||d.komuterRegistry.services.reduce((n,s)=>n+s.stationSequence.length,0)!==96)return false;
 const membership=new Map(d.komuterStations.map(x=>[canonical(x.name),x]));
 return d.komuterStations.every(x=>Array.isArray(x.serviceIds)&&validLatLon(x.lon,x.lat))&&
 d.tripServices.every(x=>x.stops.every(p=>validLatLon(p.lon,p.lat)))&&
 d.komuterRegistry.services.every(x=>x.stationSequence.every(s=>s.coordinates===null))&&
 d.komuterRegistry.services.some(x=>x.stationSequence.some(s=>membership.get(canonical(s.name))?.serviceIds.includes(x.id)));
}
function routes(d=data){
 if(!validate(d))throw Error('V7_KTM_DATA_INVALID');
 const komuter=d.komuterRegistry.services.map(r=>Object.freeze({
  id:r.id,category:'KTM',label:'KTM · '+r.displayName,
  color:r.displayColor,decoder:'KTM_KOMUTER_OFFICIAL',expected:r.stationSequence.length,
  sector:r.sector,source:source,alignment:null,
  stops:Object.freeze(r.stationSequence.map(s=>({id:s.id,name:s.name,code:'',order:s.order})))
 }));
 const express=d.tripServices.map(t=>Object.freeze({
  id:t.id,category:t.routeId==='ETS'?'ETS':'Intercity',
  label:t.routeId==='ETS'?'KTM ETS · Contoh Perjalanan':'Ekspres Rakyat Timuran · Contoh Perjalanan',
  color:t.color,decoder:'KTM_TRIP_OFFICIAL',expected:t.stops.length,
  tripId:t.tripId,routeId:t.routeId,source:source,alignment:null,
  stops:Object.freeze(t.stops.map(s=>({id:t.id+':'+s.id,name:s.name,code:'',order:s.order})))
 }));
 const all=[...komuter,...express];
 if(all.length!==8||all.reduce((n,r)=>n+r.expected,0)!==157||new Set(all.map(r=>r.id)).size!==8)throw Error('V7_KTM_ROUTE_LIST_INVALID');
 return all;
}
let secondaryRequest;
async function getSecondary(){
 if(!secondaryRequest)secondaryRequest=fetch(secondary,{credentials:'omit',mode:'cors',cache:'no-store'})
   .then(r=>{if(!r.ok)throw Error('SECONDARY_HTTP_'+r.status);return r.json()})
   .catch(()=>({features:[]}));
 return secondaryRequest;
}
function decodeSecondary(raw){
 const found=new Map(),duplicates=new Set();
 for(const f of raw?.features||[]){
  const p=f.attributes||f.properties||{},g=f.geometry||{};
  const rawName=String(p.STN_NAME||p.STATION_NAME||p.station_name||p.NAMA_STESEN||p.NAMA||p.NAME||p.Name||p.name||'');
  const key=canonical(rawName),lon=Number(g.x??g.coordinates?.[0]),lat=Number(g.y??g.coordinates?.[1]);
  if(!key||!validLatLon(lon,lat)||lon<101.36||lon>102.27||lat<2.44||lat>3.71)continue;
  if(found.has(key)){duplicates.add(key);continue}
  found.set(key,{coordinates:[lon,lat],sourceId:p.FID??p.OBJECTID??null});
 }
 for(const key of duplicates)found.delete(key);
 return found;
}
async function fetchRoute(route,d=data){
 if(!validate(d))throw Error('V7_KTM_DATA_INVALID');
 if(route.decoder==='KTM_TRIP_OFFICIAL'){
  const service=d.tripServices.find(s=>s.id===route.id);
  if(!service)throw Error('UNKNOWN_TRIP');
  const points=service.stops.map(s=>({id:route.id+':'+s.id,name:s.name,
   code:'',routeId:route.id,coordinates:[s.lon,s.lat],sourceId:s.id,
   provenance:'OFFICIAL_KTMB_GTFS_REPRESENTATIVE_TRIP',tripId:service.tripId}));
  return {ok:true,matched:points.length,expected:route.expected,points,reason:'OFFICIAL_GTFS_REPRESENTATIVE_TRIP'};
 }
 if(route.decoder!=='KTM_KOMUTER_OFFICIAL')throw Error('V7_BAD_KTM_DECODER');
 const official=new Map(d.komuterStations.map(s=>[canonical(s.name),s]));
 const points=[],missing=[];
 for(const s of route.stops){
  const hit=official.get(canonical(s.name));
  if(hit&&hit.serviceIds.includes(route.id)&&validLatLon(hit.lon,hit.lat)){
   points.push({id:s.id,name:s.name,code:'',routeId:route.id,coordinates:[hit.lon,hit.lat],
    sourceId:hit.gtfsStopId,provenance:'OFFICIAL_KTMB_GTFS_STATION_STOP'});
  }else missing.push(s);
 }
 if(route.sector==='central'&&missing.length){
  const secondaryByName=decodeSecondary(await getSecondary());
  for(const s of missing){
   const hit=secondaryByName.get(canonical(s.name));
   if(hit)points.push({id:s.id,name:s.name,code:'',routeId:route.id,
    coordinates:hit.coordinates,sourceId:hit.sourceId,
    provenance:'SECONDARY_ARCGIS_KTM_STATION_POI_NOT_SURVEYED'});
  }
 }
 const indexed=new Map(points.map(p=>[p.id,p]));
 const ordered=route.stops.map(s=>indexed.get(s.id)).filter(Boolean);
 return {ok:true,matched:ordered.length,expected:route.expected,points:ordered,
  reason:ordered.length===route.expected?'KTM_SOURCE_MATCHED_ALL':'KTM_PARTIAL_SOURCE_MATCH'};
}
const api=Object.freeze({source,secondary,validate,routes,fetchRoute,canonical,decodeSecondary});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10UnifiedV7KTM=api;
})(typeof window!=='undefined'?window:null);
