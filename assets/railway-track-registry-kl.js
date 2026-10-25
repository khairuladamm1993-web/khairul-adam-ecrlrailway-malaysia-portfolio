/* MR-S10 R2.16 Kuala Lumpur railway SERVICE reference registry.
 * Not a surveyed physical-track registry or real-time operations feed.
 * No invented alignment, coordinates, way IDs, track IDs or unverified station sequence.
 */
(function(root){
 'use strict';
 const sourceCatalogue=Object.freeze({
  rapid:'https://myrapid.com.my/rodjejakplat/',
  mot:'https://www.mot.gov.my/en/land/infrastructure/current-rail-services',
  ktm:'https://www.ktmb.com.my/Komuter.html',
  erl:'https://www.kliaekspres.com/products-fares/klia-transit/',
  mrtKajangStations29:'https://www.mymrt.com.my/ms/ruang-acara/kajang/',
  mrtKajangOverview:'https://www.mymrt.com.my/projects/kajang-line/',
  mrtKajangShortList:'https://www.mymrt.com.my/projects/kajang-line/stations/'
 });
 const route=(id,name,mode,operator,sourceKeys,stationSequence=[])=>Object.freeze({
  id,name,mode,operator,sourceUrls:sourceKeys.map(k=>sourceCatalogue[k]||k),
  confidence:'OPERATOR_SERVICE_CONFIRMED',
  // These IDs are software registry IDs, NOT railway track or signal IDs.
  physicalTrackIds:[],vectorFeatureIds:[],geometry:null,
  geometryStatus:'UNVERIFIED',physicalTrackStatus:'UNVERIFIED',
  stationSequence:stationSequence.slice(),
  stationSequenceStatus:stationSequence.length?'SOURCE_CONFIRMED':'NOT_YET_VERIFIED',
  // Each edge is *only* sequential passenger service adjacency, never a rail way,
  // track, turnout, platform or individual physical line.
  serviceAdjacencies:stationSequence.slice(1).map((to,i)=>Object.freeze({
   fromStationId:stationSequence[i],toStationId:to,relation:'CONSECUTIVE_SERVICE_STOPS',
   physicalTrackId:null,geometry:null
  }))
 });
 const stations=Object.freeze([
  {id:'kl-sentral',name:'KL Sentral',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'bandar-tasik-selatan',name:'Bandar Tasik Selatan',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'putrajaya-cyberjaya',name:'Putrajaya & Cyberjaya',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'salak-tinggi',name:'Salak Tinggi',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'klia-t1',name:'KLIA T1',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  {id:'klia-t2',name:'KLIA T2',sourceUrls:[sourceCatalogue.erl],confidence:'OPERATOR_STATION_CONFIRMED'},
  // Operator-published 29-stop sequence (MRT Corp event-space station selector).
  // IDs are catalogue IDs, NOT station/track equipment codes.
  {id:'mrt-kwasa-damansara',name:"Kwasa Damansara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-kwasa-sentral',name:"Kwasa Sentral",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-kota-damansara',name:"Kota Damansara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-surian',name:"Surian",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-mutiara-damansara',name:"Mutiara Damansara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-bandar-utama',name:"Bandar Utama",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-taman-tun-dr-ismail',name:"Taman Tun Dr Ismail",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-phileo-damansara',name:"Phileo Damansara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-pusat-bandar-damansara',name:"Pusat Bandar Damansara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-semantan',name:"Semantan",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-muzium-negara',name:"Muzium Negara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-pasar-seni',name:"Pasar Seni",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-merdeka',name:"Merdeka",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-bukit-bintang',name:"Bukit Bintang",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-tun-razak-exchange',name:"Tun Razak Exchange (TRX)",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-cochrane',name:"Cochrane",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-maluri',name:"Maluri",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-taman-pertama',name:"Taman Pertama",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-taman-midah',name:"Taman Midah",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-taman-mutiara',name:"Taman Mutiara",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-taman-connaught',name:"Taman Connaught",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-taman-suntex',name:"Taman Suntex",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-sri-raya',name:"Sri Raya",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-bandar-tun-hussein-onn',name:"Bandar Tun Hussein Onn",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-batu-sebelas-cheras',name:"Batu Sebelas Cheras",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-bukit-dukung',name:"Bukit Dukung",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-sungai-jernih',name:"Sungai Jernih",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-stadium-kajang',name:"Stadium Kajang",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
  {id:'mrt-kajang',name:"Kajang",sourceUrls:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview],confidence:'MRT_CORP_STATION_ORDER_CONFIRMED'},
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
  route('mrt-kajang','MRT · Kajang Line','subway','Rapid Rail',
   ['mrtKajangStations29','mrtKajangOverview','rapid'],
   [
    'mrt-kwasa-damansara','mrt-kwasa-sentral','mrt-kota-damansara','mrt-surian','mrt-mutiara-damansara','mrt-bandar-utama','mrt-taman-tun-dr-ismail','mrt-phileo-damansara','mrt-pusat-bandar-damansara','mrt-semantan',
    'mrt-muzium-negara','mrt-pasar-seni','mrt-merdeka','mrt-bukit-bintang','mrt-tun-razak-exchange','mrt-cochrane','mrt-maluri','mrt-taman-pertama','mrt-taman-midah','mrt-taman-mutiara',
    'mrt-taman-connaught','mrt-taman-suntex','mrt-sri-raya','mrt-bandar-tun-hussein-onn','mrt-batu-sebelas-cheras','mrt-bukit-dukung','mrt-sungai-jernih','mrt-stadium-kajang','mrt-kajang'
   ]),
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
  sources:sourceCatalogue,routes,stations,physicalSegments:Object.freeze([]),
  sourceAudit:Object.freeze({
   mrtKajang:{
    stationCount:29,orderedServiceAdjacencies:28,
    acceptedBasis:'MRT Corp current line overview (29 stations; Kwasa Damansara–Kajang) cross-checked against the MRT Corp event-space station selector with 29 sequential entries.',
    conflict:'MRT Corp project station-directory sidebar lists 28 entries, omitting Kwasa Damansara; do not use this historical sidebar for full order.',
    excludedFromKajang:['Kampung Selamat','Sungai Buloh'],
    physicalTrackGeometry:'UNVERIFIED',
    officialReferences:[sourceCatalogue.mrtKajangStations29,sourceCatalogue.mrtKajangOverview,sourceCatalogue.mrtKajangShortList]
   }
  })
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
   if(!Array.isArray(r.serviceAdjacencies)||r.serviceAdjacencies.length!==Math.max(0,r.stationSequence.length-1))return false;
   if(r.serviceAdjacencies.some((e,i)=>e.fromStationId!==r.stationSequence[i]||
      e.toStationId!==r.stationSequence[i+1]||e.relation!=='CONSECUTIVE_SERVICE_STOPS'||
      e.physicalTrackId!==null||e.geometry!==null))return false;
  }
  return data.physicalSegments.length===0;
 }
 function findRoute(id){return catalog.routes.find(r=>r.id===id)||null}
 const api=Object.freeze({catalog,validateRegistry,findRoute});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10KLRegistry=api;
})(typeof window!=='undefined'?window:null);
