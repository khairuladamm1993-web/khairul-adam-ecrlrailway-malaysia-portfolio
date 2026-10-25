/* MR-S10 R2.19 — defensive source-backed GIS station reconciliation.
 * Public hosted ArcGIS feature layer 1 enumerates 18 Ampang station POIs.
 * All coordinates originate ONLY from a returned source feature, never generated.
 * Third-party cartography is not an official survey, physical track or OSM relation.
 * Attribution: https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/1
 */
(function(root){
 'use strict';
 const base='https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/1';
 const requestUrl=base+'/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';
 // Bounds reflect published source layer 1 extent, with a small validation margin.
 const bbox=Object.freeze({minLon:101.67,maxLon:101.79,minLat:3.10,maxLat:3.22});
 function canonical(v){
  return typeof v==='string'?v.trim().toLowerCase()
   .replace(/\b(lrt|station|stesen|rapidkl|rapid kl)\b/g,'')
   .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '):'';
 }
 function value(o,keys){
  for(const k of keys){if(typeof o?.[k]==='string'&&o[k].trim())return o[k].trim()}
  return '';
 }
 function decode(features,service){
  if(!service?.validate?.()||!Array.isArray(features))return Object.freeze({ok:false,reason:'INVALID_INPUT',data:[],matched:0,missing:service?.stations?.length||18,rejected:0});
  const stations=service.stations;
  const accepted=new Map(),ambiguous=new Set(),rejected=[];
  const known=new Map(stations.map(s=>[canonical(s.name),s]));
  for(const f of features){
   const p=f?.attributes??f?.properties??{},geo=f?.geometry??{};
   const rawName=value(p,['STN_NAME','STATION_NAME','station_name','Station_Name','Station','STATION','NAME','Name','name','NAMA','NAMA_STESEN']);
   const rawCode=value(p,['STN_CODE','STATION_CODE','station_code','Station_Code','CODE','Code','code']);
   const geometry=Array.isArray(geo.coordinates)&&geo.type==='Point'?{x:geo.coordinates[0],y:geo.coordinates[1]}:geo;
   const lon=geometry?.x,lat=geometry?.y;
   const cleanName=canonical(rawName.replace(/^AG(?:1[0-8]|[1-9])\s+/i,''));
   const station=known.get(cleanName)||null;
   const explicitCode=rawCode.match(/\bAG(?:1[0-8]|[1-9])\b/i)?.[0]?.toUpperCase()||'';
   const nameCode=rawName.match(/^AG(?:1[0-8]|[1-9])\b/i)?.[0]?.toUpperCase()||'';
   const sourceId=p.OBJECTID??p.FID??p.objectid??p.ObjectID??p.id??null;
   if(!station||!Number.isFinite(lon)||!Number.isFinite(lat)||
      lon<bbox.minLon||lon>bbox.maxLon||lat<bbox.minLat||lat>bbox.maxLat||
      (explicitCode&&explicitCode!==station.serviceCode)||(nameCode&&nameCode!==station.serviceCode)){
     rejected.push({sourceId,reason:'NAME_CODE_OR_COORDINATE_NOT_VALIDATED'});
     continue;
   }
   if(accepted.has(station.id)){ambiguous.add(station.id);rejected.push({sourceId,reason:'DUPLICATE_STATION'});continue}
   accepted.set(station.id,Object.freeze({
    id:station.id,name:station.name,code:station.serviceCode,order:station.order,
    sharedPassengerService:station.sharedPassengerService,sourceId,
    coordinates:Object.freeze([lon,lat]),
    sourceLayer:base,confidence:'SECONDARY_GIS_CANDIDATE_SOURCE_BACKED_NOT_SURVEYED',
    physicalTrackStatus:'UNVERIFIED'
   }));
  }
  for(const id of ambiguous)accepted.delete(id);
  const data=Object.freeze(stations.map(s=>accepted.get(s.id)).filter(Boolean));
  const keys=new Set(data.map(d=>d.coordinates.join(',')));
  if(keys.size!==data.length)return Object.freeze({ok:false,reason:'COORDINATE_COLLISION',data:[],matched:0,missing:18,rejected:rejected.length});
  return Object.freeze({
   ok:true,reason:data.length===18?'SOURCE_MATCH_18_OF_18':data.length?'PARTIAL_SOURCE_MATCH':'NO_SOURCE_MATCH',
   data,matched:data.length,missing:18-data.length,rejected:rejected.length+ambiguous.size,
   sourceUrl:base
  });
 }
 function toFeatureCollection(result){
  const features=(result?.ok?result.data:[]).map(s=>({
   type:'Feature',id:s.id,properties:{stationId:s.id,stationName:s.name,
    code:s.code,order:s.order,sharedPassengerService:s.sharedPassengerService,
    sourceId:s.sourceId==null?'':String(s.sourceId),verificationStatus:s.confidence},
   geometry:{type:'Point',coordinates:[...s.coordinates]}
  }));
  return {type:'FeatureCollection',features};
 }
 const api=Object.freeze({sourceUrl:base,requestUrl,bbox,decode,toFeatureCollection,canonical});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10AmpangGISR219=api;
})(typeof window!=='undefined'?window:null);
