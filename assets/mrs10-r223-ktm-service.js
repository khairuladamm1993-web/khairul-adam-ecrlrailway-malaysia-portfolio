(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MRS10KTMV2=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const GIS_BASE='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/0';
const GIS_URL=GIS_BASE+'/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';
// Malaysian government station POI layer; runtime candidate matches only, not KTMB surveyed coordinates.
// Source availability and CORS have not yet been proven in Safari: failure must preserve the Klang Valley map.
const NATIONAL_GIS_BASE='https://service.mygeomap.gov.my/arcgis/rest/services/Transportation_services/1MM_Template_Servis_Pengangkutan/MapServer/2';
const NATIONAL_GIS_URL=NATIONAL_GIS_BASE+'/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';
const SECTOR_BOUNDS=Object.freeze({north:[99.5,4.0,101.8,6.95],south:[102.0,1.2,104.5,2.95]});
function normal(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/\\([^)]*\\)/g,'').replace(/[^a-z0-9]/g,'');}
function validateCatalogue(c){if(!c||c.version!=='R2.23-KTM-V2'||c.scope!=='KTMB_PASSENGER_SERVICE_REGISTRY_ONLY'||c.physicalTrackGeometry!==null||!Array.isArray(c.services)||c.services.length!==6)return false;
const ids=new Set(),stops=new Set();for(const r of c.services){if(ids.has(r.id)||!/^#[a-fA-F0-9]{6}$/.test(r.displayColor)||r.geometry!==null||r.stationSequence.length<2)return false;ids.add(r.id);
for(const [i,s] of r.stationSequence.entries()){if(stops.has(s.id)||s.order!==i+1||!s.name||s.code!==null||s.coordinates!==null||!s.sourceUrl?.startsWith('https://www.ktmb.com.my/'))return false;stops.add(s.id);}}return true;}
function decodeGis(payload,c){if(!validateCatalogue(c)||!Array.isArray(payload?.features))return {ok:false,features:[],matched:0,reason:'INVALID_SOURCE_DATA'};
const known=new Map();for(const r of c.services)for(const s of r.stationSequence){const k=normal(s.name),matches=known.get(k)||[];matches.push({serviceId:r.id,color:r.displayColor,station:s});known.set(k,matches);}
const found=new Map(),rejected=[];for(const f of payload.features){const a=f?.attributes||f?.properties||{},geo=f?.geometry||{};
const raw=String(a.STN_NAME||a.STATION_NAME||a.station_name||a.NAMA_STESEN||a.NAMA||a.NAME||a.Name||a.name||a.Nama_Terminal||'').trim();
const k=normal(raw),matches=known.get(k),lon=Number(Array.isArray(geo.coordinates)?geo.coordinates[0]:geo.x),lat=Number(Array.isArray(geo.coordinates)?geo.coordinates[1]:geo.y),fid=a.OBJECTID??a.FID??null;
if(!matches||typeof lon!=='number'||typeof lat!=='number'||!Number.isFinite(lon)||!Number.isFinite(lat)||lon<101.36||lon>102.27||lat<2.44||lat>3.71){rejected.push({fid,reason:'UNMATCHED_OR_INVALID_LOCATION'});continue;}
if(found.has(k)){found.set(k,{duplicate:true});rejected.push({fid,reason:'DUPLICATE'});continue;}found.set(k,{raw,matches,lon,lat,fid});}
const features=[];for(const [key,x] of found){if(x.duplicate)continue;
features.push({type:'Feature',id:'ktm-'+key,properties:{name:x.matches[0].station.name,serviceIds:x.matches.map(y=>y.serviceId).join('|'),colors:x.matches.map(y=>y.color).join('|'),status:'SECONDARY_GIS_NAME_MATCH_NOT_SURVEYED',sourceId:String(x.fid??'')},geometry:{type:'Point',coordinates:[x.lon,x.lat]}});}
return {ok:true,features,matched:features.length,rejected};}

function decodeNationalGis(payload,c){
 if(!validateCatalogue(c)||!Array.isArray(payload?.features)||payload.error)
  return {ok:false,features:[],matched:0,reason:'INVALID_NATIONAL_SOURCE'};
 const known=new Map();
 for(const r of c.services){
  if(!SECTOR_BOUNDS[r.sector])continue;
  for(const s of r.stationSequence){
   const key=normal(s.name),matches=known.get(key)||[];
   matches.push({serviceId:r.id,color:r.displayColor,station:s,sector:r.sector});
   known.set(key,matches);
  }
 }
 const found=new Map(),rejected=[];
 for(const f of payload.features){
  const a=f?.attributes||f?.properties||{},g=f?.geometry||{};
  const label=String(a.Nama_Terminal||a.NAMA_TERMINAL||a.nama_terminal||a.STN_NAME||a.STATION_NAME||a.name||a.NAME||'').trim();
  // Remove only recognized generic prefixes. Never infer a station from proximity or a fuzzy substring.
  const raw=label.replace(/^stesen\\s+(?:keretapi\\s+|ktm\\s+)/i,'').trim();
  const k=normal(raw),matches=known.get(k)||[];
  const lon=Number(Array.isArray(g.coordinates)?g.coordinates[0]:g.x);
  const lat=Number(Array.isArray(g.coordinates)?g.coordinates[1]:g.y);
  const fid=a.OBJECTID??a.FID??'';
  if(!matches.length||!Number.isFinite(lon)||!Number.isFinite(lat)){
   rejected.push({fid,reason:'UNKNOWN_OR_INVALID_COORDINATES'});continue;
  }
  const accepted=matches.filter(m=>{
   const [west,south,east,north]=SECTOR_BOUNDS[m.sector];
   return lon>=west&&lon<=east&&lat>=south&&lat<=north;
  });
  if(!accepted.length){rejected.push({fid,reason:'OUTSIDE_SERVICE_SECTOR'});continue;}
  if(found.has(k)){found.set(k,{duplicate:true});rejected.push({fid,reason:'DUPLICATE_NAME'});continue;}
  found.set(k,{raw,matches:accepted,lon,lat,fid});
 }
 const features=[];
 for(const [key,x] of found){
  if(x.duplicate)continue; // ambiguous source records fail closed
  features.push({type:'Feature',id:'ktm-'+key,properties:{
   name:x.matches[0].station.name,
   serviceIds:x.matches.map(y=>y.serviceId).join('|'),
   colors:x.matches.map(y=>y.color).join('|'),
   status:'NATIONAL_GIS_NAME_MATCH_NOT_SURVEYED',
   sourceUrl:NATIONAL_GIS_BASE,sourceId:String(x.fid)
  },geometry:{type:'Point',coordinates:[x.lon,x.lat]}});
 }
 return {ok:true,features,matched:features.length,rejected,source:'MYGEOMAP_NATIONAL_SECONDARY'};
}
function mergeGis(central,national){
 const valid=[central,national].filter(x=>x?.ok&&Array.isArray(x.features));
 if(!valid.length)return {ok:false,features:[],matched:0,rejected:[],reason:'ALL_GIS_SOURCES_UNAVAILABLE'};
 const found=new Map(),conflicts=new Set(),rejected=[];
 for(const data of valid){
  rejected.push(...(data.rejected||[]));
  for(const f of data.features){
   const key=normal(f.properties.name);
   if(found.has(key)){conflicts.add(key);rejected.push({name:f.properties.name,reason:'CROSS_SOURCE_DUPLICATE'});}
   else found.set(key,f);
  }
 }
 for(const k of conflicts)found.delete(k); // ambiguous cross-source identity: never draw a phantom pin
 const features=[...found.values()];
 return {ok:true,features,matched:features.length,rejected,source:'MULTI_SECONDARY_GIS'};
}
function stationServices(c,name){const k=normal(name),out=[];for(const r of c.services){if(r.stationSequence.some(s=>normal(s.name)===k))out.push(r.id);}return out;}
function visibleStations(d,id='all'){return {type:'FeatureCollection',features:(d?.features||[]).filter(f=>id==='all'||f.properties.serviceIds.split('|').includes(id))};}
function featuresForRoute(d,id){return {type:'FeatureCollection',features:(d?.features||[]).filter(f=>f.properties.serviceIds.split('|').includes(id)).map(f=>({...f,properties:{...f.properties,serviceId:id,color:f.properties.colors.split('|')[f.properties.serviceIds.split('|').indexOf(id)]}}))};}
return Object.freeze({GIS_BASE,GIS_URL,NATIONAL_GIS_BASE,NATIONAL_GIS_URL,SECTOR_BOUNDS,normal,validateCatalogue,decodeGis,decodeNationalGis,mergeGis,featuresForRoute,stationServices,visibleStations});
});