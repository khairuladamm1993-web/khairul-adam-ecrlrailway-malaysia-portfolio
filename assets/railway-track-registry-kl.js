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
 // R2.17: sourced passenger-service branding, NOT an infrastructure-way style.
 const kajangLineVisual=Object.freeze({
  name:'Kajang Line Green',light:'#087D43',dark:'#50E2A0',
  use:'SERVICE_AND_VERIFIED_STATION_REFERENCE_ONLY',
  physicalAlignmentStatus:'UNVERIFIED'
 });
 const route=(id,name,mode,operator,sourceKeys,stationSequence=[])=>Object.freeze({
  id,name,mode,operator,sourceUrls:sourceKeys.map(k=>sourceCatalogue[k]||k),
  visualIdentity:id==='mrt-kajang'?kajangLineVisual:null,
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
 // The two exact source strings below were observed in Owner Safari POI
 // screenshots and cross-checked against the operator-ordered 29-stop list.
 // They are NOT OSM way IDs, operator equipment codes, or precise station
 // coordinates. Do not match a generic "Kajang" / "Pasar Seni" POI alone:
 // interchange names are ambiguous and transport-mode tags are imperfect.
 const observedPoiLabels=Object.freeze([
  Object.freeze({raw:'KG16 Pasar Seni',officialName:'Pasar Seni',stationId:'mrt-pasar-seni',
   evidence:'OWNER_SAFARI_R216_PASAR_SENI_POI'}),
  Object.freeze({raw:'KG35 Kajang',officialName:'Kajang',stationId:'mrt-kajang',
   evidence:'OWNER_SAFARI_R216_KAJANG_POI'})
 ]);
 function matchSourcedKajangPoi(props){
  // OpenMapTiles POI railway station class may be tagged station OR subway.
  // Accept subway only with an exact Owner-observed code+name; never infer from category alone.
  if(!props||props.class!=='railway'||!['station','subway'].includes(props.subclass))return null;
  const sourceName=typeof props.name==='string'?props.name.trim():'';
  const recognized=observedPoiLabels.find(x=>x.raw===sourceName);
  if(!recognized)return null;
  // Optional Latin/English name must not contradict the exact raw source.
  const en=String(props['name:en']||props.name_en||'').trim();
  if(en && en.toLowerCase()!==recognized.officialName.toLowerCase() &&
      en.toLowerCase()!==recognized.raw.toLowerCase())return null;
  const service=findRoute('mrt-kajang'),order=service?.stationSequence?.indexOf(recognized.stationId);
  const entry=catalog.stations.find(x=>x.id===recognized.stationId);
  if(!entry||order<0||entry.name!==recognized.officialName)return null;
  return Object.freeze({
   routeId:service.id,routeName:service.name,stationId:entry.id,
   stationName:entry.name,stopPosition:order+1,stopCount:service.stationSequence.length,
   status:'CANDIDATE_EXACT_CARTOGRAPHIC_LABEL_MATCH',
   evidence:recognized.evidence,physicalTrackId:null,geometry:null,
   // Rendering a match does not establish an OSM route relation or way.
   relationId:null,routeGeometryStatus:'UNVERIFIED'
  });
 }
 const osmRelationAudit=Object.freeze({
  relationCandidateIds:Object.freeze([]),acceptedRelationIds:Object.freeze([]),
  acceptedWayIds:Object.freeze([]),verifiedPhysicalTracks:0,
  routeRelationsNote:'OSM PTv2 route/route_master can describe variants/directions, stop/platform relations and member ways; source relation membership and way continuity require separate verification before using geometry.',
  guidanceUrls:Object.freeze(['https://wiki.openstreetmap.org/wiki/Public_transport',
   'https://wiki.openstreetmap.org/wiki/Relation:route']),
  currentStatus:'NO_OSM_RELATION_OR_TRACK_WAY_MATCH_VERIFIED'
 });
 const api=Object.freeze({catalog,validateRegistry,findRoute,matchSourcedKajangPoi,osmRelationAudit});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10KLRegistry=api;
})(typeof window!=='undefined'?window:null);
