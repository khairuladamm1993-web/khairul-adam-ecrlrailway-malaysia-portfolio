/* MR-S10 P01 ERL V2 GIS: transient public source matching, never authored coordinates.
 * ArcGIS FeatureServer layer 4 is secondary GIS, not railway/operator survey.
 * The layer lists 9 records; SIX UNIQUE matched names are required for 6 visible markers.
 * Do not persist or publish its features until data reuse rights are clarified.
 */
(function(root){
 'use strict';
 const sourceUrl='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/4';
 const requestUrl=sourceUrl+'/query?where=1%3D1&outFields=FID%2CSTN_NAME%2CSTN_CODE&returnGeometry=true&outSR=4326&f=json';
 const bbox=Object.freeze({minLon:101.62,maxLon:101.76,minLat:2.69,maxLat:3.18});
 const aliases=Object.freeze({
  'kl sentral':'kl-sentral',
  'kuala lumpur sentral':'kl-sentral',
  'bandar tasik selatan':'bandar-tasik-selatan',
  'putrajaya cyberjaya':'putrajaya-cyberjaya',
  'putrajaya and cyberjaya':'putrajaya-cyberjaya',
  'salak tinggi':'salak-tinggi',
  'klia t1':'klia-t1',
  'klia terminal 1':'klia-t1',
  'klia 1':'klia-t1',
  'klia':'klia-t1',
  'klia t2':'klia-t2',
  'klia terminal 2':'klia-t2',
  'klia 2':'klia-t2',
  'klia2':'klia-t2'
 });
 function canonical(s){
  return String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 }
 function decode(features,model){
  if(!model?.validate?.()||!Array.isArray(features))return Object.freeze({ok:false,reason:'INVALID_INPUT',points:[],matched:0,missing:6,rejected:0});
  const chosen=new Map(), ambiguous=new Set();
  let rejected=0;
  for(const f of features){
   const p=f?.attributes||f?.properties||{},geo=f?.geometry||{};
   const name=String(p.STN_NAME||'').trim();
   const id=aliases[canonical(name)];
   const station=id&&model.stationById(id);
   const coords=Array.isArray(geo.coordinates)?geo.coordinates:[geo.x,geo.y];
   const [x,y]=coords;
   if(!station||!Number.isFinite(x)||!Number.isFinite(y)||
      x<bbox.minLon||x>bbox.maxLon||y<bbox.minLat||y>bbox.maxLat){rejected++;continue}
   // A named feature cannot contradict the official service model.
   const sourceId=p.FID??p.OBJECTID??null;
   const point=Object.freeze({stationId:id,stationName:station.name,coordinates:Object.freeze([x,y]),
     sourceId,rawName:name,rawCode:p.STN_CODE==null?null:String(p.STN_CODE),
     // A GIS code is NOT claimed to be an officially verified operator code.
     codeStatus:'SECONDARY_GIS_RAW_UNVERIFIED',geometryStatus:'SECONDARY_GIS_POINT_NOT_TRACK'});
   if(chosen.has(id)){
    const prev=chosen.get(id);
    // Exact repeated coordinates and identity are duplicate records, not a second station.
    if(prev.coordinates[0]!==x||prev.coordinates[1]!==y)ambiguous.add(id);
    rejected++;
   } else chosen.set(id,point);
  }
  for(const id of ambiguous)chosen.delete(id);
  const points=model.stops.map(s=>chosen.get(s.id)).filter(Boolean);
  const unique=new Set(points.map(p=>p.coordinates.join(',')));
  if(unique.size!==points.length)return Object.freeze({ok:false,reason:'COORDINATE_COLLISION',points:[],matched:0,missing:6,rejected});
  return Object.freeze({ok:true,reason:points.length===6?'SIX_SOURCE_MATCHES':'PARTIAL_MATCH',
    points:Object.freeze(points),matched:points.length,missing:6-points.length,rejected:rejected+ambiguous.size,
    sourceUrl,redistributionLicence:'UNVERIFIED'});
 }
 const api=Object.freeze({sourceUrl,requestUrl,bbox,aliases,canonical,decode});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10ERLV2GIS=api;
})(typeof window!=='undefined'?window:null);
