/* MR-S10 P01 ERL V2 secondary-GIS source reconciler.
 * Read-only live station markers; no local coordinates or physical track polyline.
 * The ArcGIS station layer has KE01–KE03 + KT01–KT06 (9 *service* POIs,
 * 6 unique passenger stations). Codes below are SECONDARY GIS IDs, not
 * operator-certified station, platform, signalling or track identifiers.
 */
(function(root){
 'use strict';
 const sourceUrl='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/4';
 const requestUrl=sourceUrl+'/query?where=1%3D1&outFields=FID%2CSTN_NAME%2CSTN_CODE&returnGeometry=true&outSR=4326&f=json';
 const bbox=Object.freeze({minLon:101.62,maxLon:101.76,minLat:2.69,maxLat:3.18});
 const catalogue=Object.freeze([
  ['KE01','kl-sentral',['kl sentral']],
  ['KE02','klia-t1',['klia t1']],
  ['KE03','klia-t2',['klia t2']],
  ['KT01','kl-sentral',['kl sentral']],
  ['KT02','bandar-tasik-selatan',['bandar tasik selatan']],
  ['KT03','putrajaya-cyberjaya',['putrajaya','putrajaya cyberjaya','putrajaya and cyberjaya']],
  ['KT04','salak-tinggi',['salak tinggi']],
  ['KT05','klia-t1',['klia t1']],
  ['KT06','klia-t2',['klia t2']]
 ].map(([code,id,names])=>Object.freeze({code,id,names:Object.freeze(names)})));
 const codeRegistry=Object.freeze(Object.fromEntries(catalogue.map(x=>[x.code,x])));
 const maxSharedReferenceSeparationMeters=300;
 const aliases=Object.freeze(Object.fromEntries(catalogue.flatMap(x=>x.names.map(name=>[name,x.id]))));
 function canonical(value){return String(value||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
 function meters(a,b){
  const rad=Math.PI/180,R=6371000,p1=a[1]*rad,p2=b[1]*rad;
  const dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dlon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
 }
 function decode(features,model){
  if(!model?.validate?.()||!Array.isArray(features))return Object.freeze({ok:false,reason:'INVALID_INPUT',points:[],matched:0,missing:6,rejected:0,ambiguous:[]});
  const groups=new Map(),duplicates=new Set(),ambiguous=new Set();
  let rejected=0;
  for(const f of features){
   const p=f?.attributes??f?.properties??{}, geo=f?.geometry??{};
   const rawName=String(p.STN_NAME??'').trim(), rawCode=String(p.STN_CODE??'').trim().toUpperCase();
   const expected=codeRegistry[rawCode];
   const [lon,lat]=Array.isArray(geo.coordinates)?geo.coordinates:[geo.x,geo.y];
   if(!expected||!expected.names.includes(canonical(rawName))||!model.stationById(expected.id)||
    !Number.isFinite(lon)||!Number.isFinite(lat)||lon<bbox.minLon||lon>bbox.maxLon||
    lat<bbox.minLat||lat>bbox.maxLat){rejected++;continue}
   const perStation=groups.get(expected.id)||new Map();
   if(perStation.has(rawCode)){duplicates.add(expected.id);rejected++;continue}
   perStation.set(rawCode,{id:expected.id,code:rawCode,coordinates:[lon,lat],sourceId:p.FID??p.OBJECTID??null,rawName});
   groups.set(expected.id,perStation);
  }
  const points=[];
  for(const s of model.stops){
   const group=groups.get(s.id);
   if(!group||duplicates.has(s.id)){if(duplicates.has(s.id))ambiguous.add(s.id);continue}
   const entries=[...group.values()];
   if(entries.length>2){ambiguous.add(s.id);continue}
   const pairMeters=entries.length===2?meters(entries[0].coordinates,entries[1].coordinates):null;
   if(pairMeters!==null&&pairMeters>maxSharedReferenceSeparationMeters){ambiguous.add(s.id);continue}
   // Use the actual source's KT station point for a shared service, never a new midpoint.
   const point=entries.find(x=>x.code.startsWith('KT'))||entries[0];
   points.push(Object.freeze({
    stationId:s.id,stationName:s.name,coordinates:Object.freeze([...point.coordinates]),
    sourceId:point.sourceId,rawName:point.rawName,
    rawCode:point.code,codeStatus:'SECONDARY_GIS_RAW_UNVERIFIED',
    evidenceCodes:Object.freeze(entries.map(x=>x.code).sort()),
    separateServiceSourceFeatures:entries.length,
    pairSeparationMeters:pairMeters==null?null:Math.round(pairMeters),
    geometryStatus:'SECONDARY_GIS_POINT_NOT_TRACK',
    reuseLicence:'NOT_ESTABLISHED'
   }));
  }
  const unique=new Set(points.map(p=>p.coordinates.join(',')));
  if(unique.size!==points.length)return Object.freeze({ok:false,reason:'COORDINATE_COLLISION',points:[],matched:0,missing:6,rejected,ambiguous:[...ambiguous]});
  return Object.freeze({ok:true,reason:points.length===6?'SIX_SOURCE_MATCHES':'PARTIAL_MATCH',
   points:Object.freeze(points),matched:points.length,missing:6-points.length,
   rejected:rejected+ambiguous.size,ambiguous:Object.freeze([...ambiguous]),sourceUrl,
   redistributionLicence:'UNVERIFIED'});
 }
 const api=Object.freeze({sourceUrl,requestUrl,bbox,aliases,catalogue,codeRegistry,
  maxSharedReferenceSeparationMeters,canonical,meters,decode});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10ERLV2GIS=api;
})(typeof window!=='undefined'?window:null);
