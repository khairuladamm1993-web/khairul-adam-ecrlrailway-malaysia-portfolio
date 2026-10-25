/* MR-S10 R2.16 Kuala Lumpur railway SERVICE reference registry.
 * Not a surveyed physical-track registry or real-time operations feed.
 * No invented alignment, coordinates, way IDs, track IDs or station sequence.
 */
(function(root){
 'use strict';
 const sourceCatalogue=Object.freeze({
  rapid:'https://myrapid.com.my/rodjejakplat/',
  mot:'https://www.mot.gov.my/en/land/infrastructure/current-rail-services',
  ktm:'https://www.ktmb.com.my/Komuter.html',
  erl:'https://www.kliaekspres.com/products-fares/klia-transit/'
 });
 const route=(id,name,mode,operator,sourceKeys,stationSequence=[])=>Object.freeze({
  id,name,mode,operator,sourceUrls:sourceKeys.map(k=>sourceCatalogue[k]),
  confidence:'OPERATOR_SERVICE_CONFIRMED',
  // These IDs are software registry IDs, NOT railway track or signal IDs.
  physicalTrackIds:[],vectorFeatureIds:[],geometry:null,
  geometryStatus:'UNVERIFIED',physicalTrackStatus:'UNVERIFIED',
  stationSequence:stationSequence.slice(),
  stationSequenceStatus:stationSequence.length?'SOURCE_CONFIRMED':'NOT_YET_VERIFIED'
 });
 const stations=Object.freeze([
  {id:'kl-sentral',name:'KL Sentral',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'bandar-tasik-selatan',name:'Bandar Tasik Selatan',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'putrajaya-cyberjaya',name:'Putrajaya & Cyberjaya',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'salak-tinggi',name:'Salak Tinggi',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'klia-t1',name:'KLIA T1',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'klia-t2',name:'KLIA T2',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  // Owner Safari screenshot confirms cartographic POI name only; no service attachment.
  {id:'poi-maharajalela',name:'Maharajalela',originalName:'MR3 Maharajalela',
   sourceUrls:['https://openmaptiles.org/docs/schema/'],confidence:'OWNER_SAFARI_VECTOR_POI',linkedRouteId:null},
  {id:'poi-pasar-seni',name:'Pasar Seni',originalName:'KG16 Pasar Seni',
   sourceUrls:['https://openmaptiles.org/docs/schema/'],confidence:'OWNER_SAFARI_VECTOR_POI',linkedRouteId:null}
 ].map(s=>Object.freeze(Object.assign({geometry:null,geometryStatus:'UNVERIFIED',physicalTrackIds:[]},s))));
 const routes=Object.freeze([
  route('ktm-batu-caves-pulau-sebang','KTM Komuter · Batu Caves – Pulau Sebang','rail','KTMB',['ktm','mot']),
  route('ktm-tanjung-malim-pelabuhan-klang','KTM Komuter · Tanjung Malim – Pelabuhan Klang','rail','KTMB',['ktm','mot']),
  route('lrt-kelana-jaya','LRT · Kelana Jaya Line','light_rail','Rapid Rail',['rapid','mot']),
  route('lrt-ampang','LRT · Ampang Line','light_rail','Rapid Rail',['rapid','mot']),
  route('lrt-sri-petaling','LRT · Sri Petaling Line','light_rail','Rapid Rail',['rapid','mot']),
  route('mrt-kajang','MRT · Kajang Line','subway','Rapid Rail',['rapid','mot']),
  route('mrt-putrajaya','MRT · Putrajaya Line','subway','Rapid Rail',['rapid']),
  route('monorail-kl','KL Monorail','monorail','Rapid Rail',['rapid','mot']),
  route('erl-klia-transit','ERL · KLIA Transit','rail','Express Rail Link',['erl'],
   ['kl-sentral','bandar-tasik-selatan','putrajaya-cyberjaya','salak-tinggi','klia-t1','klia-t2']),
  route('erl-klia-ekspres','ERL · KLIA Ekspres','rail','Express Rail Link',
   ['https://www.kliaekspres.com/products-fares/klia-ekspres/'])
 ]);
 const catalog=Object.freeze({
  schema:'mrs10-railway-registry/1',version:'R2.16-PHASE1',
  checkedOn:'2026-10-26',region:'Kuala Lumpur / Klang Valley service audit',
  regionScope:'Service reference inventory; some terminus stations are outside Kuala Lumpur.',
  warning:'Not a surveyed network, route geometry, platform, operational track identity, chainage or signal plan.',
  sources:sourceCatalogue,routes,stations,physicalSegments:Object.freeze([])
 });
 function validateRegistry(data=catalog){
  if(!data||!Array.isArray(data.routes)||!Array.isArray(data.stations)||!Array.isArray(data.physicalSegments))return false;
  const ids=new Set,stationIds=new Set;
  for(const s of data.stations){
   if(!s.id||stationIds.has(s.id)||s.geometry!==null||s.geometryStatus!=='UNVERIFIED'||s.physicalTrackIds?.length)return false;
   stationIds.add(s.id);
  }
  for(const r of data.routes){
   if(!r.id||ids.has(r.id)||!r.sourceUrls.length||r.geometry!==null||r.geometryStatus!=='UNVERIFIED'||r.physicalTrackIds.length||r.vectorFeatureIds.length)return false;
   ids.add(r.id);
   if(r.stationSequenceStatus==='SOURCE_CONFIRMED' && (!r.stationSequence.length || r.stationSequence.some(id=>!stationIds.has(id))))return false;
   if(r.stationSequenceStatus==='NOT_YET_VERIFIED'&&r.stationSequence.length)return false;
  }
  return data.physicalSegments.length===0;
 }
 function findRoute(id){return catalog.routes.find(r=>r.id===id)||null}
 const api=Object.freeze({catalog,validateRegistry,findRoute});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10KLRegistry=api;
})(typeof window!=='undefined'?window:null);
