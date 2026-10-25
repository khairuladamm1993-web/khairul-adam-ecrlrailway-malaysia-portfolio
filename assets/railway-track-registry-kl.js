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
 // R2.17.2: operator-confirmed 29 station names + independently sourced KG
 // codes are candidate visual identities ONLY, not physical-track or POI-location
 // certifications. Three raw strings are evidenced by Owner Safari screenshots.
 // All other candidate labels must still be emitted by the live POI source to
 // appear on the map. No station coordinates are derived or fabricated.
 const kajangPoiStationCodes=Object.freeze([
  ['KG04','mrt-kwasa-damansara'],['KG05','mrt-kwasa-sentral'],
  ['KG06','mrt-kota-damansara'],['KG07','mrt-surian'],
  ['KG08','mrt-mutiara-damansara'],['KG09','mrt-bandar-utama'],
  ['KG10','mrt-taman-tun-dr-ismail'],['KG12','mrt-phileo-damansara'],
  ['KG13','mrt-pusat-bandar-damansara'],['KG14','mrt-semantan'],
  ['KG15','mrt-muzium-negara'],['KG16','mrt-pasar-seni'],
  ['KG17','mrt-merdeka'],['KG18A','mrt-bukit-bintang'],
  ['KG20','mrt-tun-razak-exchange'],['KG21','mrt-cochrane'],
  ['KG22','mrt-maluri'],['KG23','mrt-taman-pertama'],
  ['KG24','mrt-taman-midah'],['KG25','mrt-taman-mutiara'],
  ['KG26','mrt-taman-connaught'],['KG27','mrt-taman-suntex'],
  ['KG28','mrt-sri-raya'],['KG29','mrt-bandar-tun-hussein-onn'],
  ['KG30','mrt-batu-sebelas-cheras'],['KG31','mrt-bukit-dukung'],
  ['KG33','mrt-sungai-jernih'],['KG34','mrt-stadium-kajang'],
  ['KG35','mrt-kajang']
 ].map(([code,stationId])=>Object.freeze({code,stationId})));
 const observedPoiLabels=Object.freeze([
  Object.freeze({raw:'KG13 Pusat Bandar Damansara',officialName:'Pusat Bandar Damansara',
    stationId:'mrt-pusat-bandar-damansara',evidence:'OWNER_SAFARI_R2171_KG13_SOURCE_POI'}),
  Object.freeze({raw:'KG16 Pasar Seni',officialName:'Pasar Seni',
    stationId:'mrt-pasar-seni',evidence:'OWNER_SAFARI_R216_PASAR_SENI_POI'}),
  Object.freeze({raw:'KG35 Kajang',officialName:'Kajang',
    stationId:'mrt-kajang',evidence:'OWNER_SAFARI_R216_KAJANG_POI'})
 ]);
 // Alias strings are conservative cartographic label variants, not a claim
 // that a particular label or coordinate actually occurs in a current tile.
 const nameAlternates=Object.freeze({
  'mrt-tun-razak-exchange':Object.freeze(['Tun Razak Exchange']),
  'mrt-batu-sebelas-cheras':Object.freeze(['Batu 11 Cheras'])
 });
 const kajangServicePoiCandidates=Object.freeze(kajangPoiStationCodes.flatMap(({code,stationId})=>{
  const entry=catalog.stations.find(s=>s.id===stationId);
  if(!entry)throw new Error('Kajang POI candidate missing station '+stationId);
  const variants=[entry.name,...(nameAlternates[stationId]||[])];
  return variants.map(name=>{
   const raw=code+' '+name;
   const owner=observedPoiLabels.find(p=>p.raw===raw&&p.stationId===stationId);
   return Object.freeze({
    raw,stationId,officialName:entry.name,code,
    confidence:owner?'OWNER_SAFARI_SOURCE_LABEL_OBSERVED':'SOURCE_LABEL_CANDIDATE_NOT_OBSERVED',
    evidence:owner?.evidence||'SECONDARY_KG_CODE_OPERATOR_STATION_NAME_CROSSCHECK'
   });
  });
 }));
 const kajangPoiSourceNames=Object.freeze(kajangServicePoiCandidates.map(x=>x.raw));
 function matchSourcedKajangPoi(props){
  // Only an exact observed/candidate KG code+name in an actual rendered source
  // feature may trigger a service overlay. Reject generic nearby KTM/LRT POIs.
  if(!props||props.class!=='railway'||!['station','subway'].includes(props.subclass))return null;
  const sourceName=typeof props.name==='string'?props.name.trim():'';
  const recognized=kajangServicePoiCandidates.find(x=>x.raw===sourceName);
  if(!recognized)return null;
  const english=String(props['name:en']||props.name_en||'').trim();
  const allowedEnglish=[recognized.officialName,recognized.raw,sourceName,
    ...kajangServicePoiCandidates.filter(x=>x.stationId===recognized.stationId).map(x=>x.raw.slice(x.code.length+1))];
  if(english&&!allowedEnglish.some(v=>v.toLowerCase()===english.toLowerCase()))return null;
  const service=findRoute('mrt-kajang'),order=service?.stationSequence?.indexOf(recognized.stationId);
  const entry=catalog.stations.find(x=>x.id===recognized.stationId);
  if(!entry||order<0||entry.name!==recognized.officialName)return null;
  return Object.freeze({
   routeId:service.id,routeName:service.name,stationId:entry.id,
   stationName:entry.name,stationCode:recognized.code,
   stopPosition:order+1,stopCount:service.stationSequence.length,
   status:recognized.confidence==='OWNER_SAFARI_SOURCE_LABEL_OBSERVED'?
    'CANDIDATE_EXACT_CARTOGRAPHIC_LABEL_MATCH':'CANDIDATE_UNOBSERVED_SOURCE_CODE_NAME_MATCH',
   confidence:recognized.confidence,evidence:recognized.evidence,
   physicalTrackId:null,geometry:null,relationId:null,routeGeometryStatus:'UNVERIFIED'
  });
 }
 // R2.17.1: discovery references only. Neither a Wikidata P402 reference
 // nor a third-party OSM mirror is an authoritative way-membership proof.
 // A route relation can model passenger service without modelling physical tracks.
 // Do not render or import these candidate IDs as physical geometry.
 const osmRelationAudit=Object.freeze({
  relationCandidateIds:Object.freeze(['8000326']),
  wayCandidateIds:Object.freeze(['778403716']),
  candidates:Object.freeze([
   Object.freeze({
    type:'relation',id:'8000326',status:'DISCOVERED_UNVERIFIED',
    source:'WIKIDATA_P402_UNREFERENCED',
    sourceUrl:'https://www.wikidata.org/wiki/Q6717618',
    osmUrl:'https://www.openstreetmap.org/relation/8000326',
    geometry:null,memberWayIds:Object.freeze([]),topologyVerified:false,
    caveat:'Wikidata identifier has no cited claim reference; direct current OSM relation members and type were not retrieved.'
   }),
   Object.freeze({
    type:'way',id:'778403716',status:'THIRD_PARTY_OSM_SNAPSHOT_UNVERIFIED',
    source:'GEOVIEW_OSM_DERIVED_SNAPSHOT',
    sourceUrl:'https://my.geoview.info/laluan_kajang%2C10778403716w',
    osmUrl:'https://www.openstreetmap.org/way/778403716',
    snapshotDate:'2025-07-14',geometry:null,memberWayIds:Object.freeze([]),
    topologyVerified:false,
    caveat:'Third-party snapshot labels a 4.193km subway way; live OSM way geometry, relation membership, neighbouring way continuity and KTM separation not confirmed.'
   })
  ]),
  externalGeometryLayerCandidates:Object.freeze([
   Object.freeze({
    source:'SELANGOR_RAILWAY_MAP_ARCGIS',
    serviceUrl:'https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer',
    layerIndex:15,label:'MRT KAJANG LINE',status:'DISCOVERED_SCHEMA_ONLY',
    geometry:null,licenseVerified:false,topologyVerified:false,
    caveat:'Directory advertises route-themed layer; dataset features, currency, license and physical precision were not fetched or validated.'
   })
  ]),
  operatorAlignmentContext:Object.freeze({
   sourceUrl:'https://www.mymrt.com.my/projects/kajang-line/',
   publishedServiceLengthKm:46,undergroundKm:9.5,
   stations:29,geometry:null,status:'OPERATOR_AGGREGATE_ONLY',
   caveat:'Operator summary does not supply OSM way geometry, junction locations or track topology.'
  }),
  acceptedRelationIds:Object.freeze([]),acceptedWayIds:Object.freeze([]),
  verifiedPhysicalTracks:0,acceptedGeometry:null,
  evidenceGates:Object.freeze([
   'FETCH_LIVE_OSM_RELATION_AND_WAY_ATTRIBUTES',
   'VERIFY_RELATION_TYPE_SERVICE_DIRECTION_AND_MEMBERS',
   'VERIFY_WAY_GEOMETRY_AND_TOPOLOGICAL_CONTINUITY',
   'SEPARATE_KTM_AND_NON_KAJANG_RAIL_INFRASTRUCTURE',
   'VERIFY_CURRENT_ALIGNMENT_AND_SOURCE_LICENSE',
   'QA_PREVIEW_THEN_OWNER_SAFARI_UAT'
  ]),
  routeRelationsNote:'OSM route/route_master may describe passenger service or directions, not surveyed physical tracks. Candidates cannot colour full physical alignment without member-way and way-geometry verification.',
  guidanceUrls:Object.freeze(['https://wiki.openstreetmap.org/wiki/Public_transport',
   'https://wiki.openstreetmap.org/wiki/Relation:route']),
  currentStatus:'OSM_CANDIDATES_FOUND_GEOMETRY_AND_MEMBERSHIP_UNVERIFIED'
 });
 const api=Object.freeze({catalog,validateRegistry,findRoute,matchSourcedKajangPoi,kajangPoiSourceNames,kajangServicePoiCandidates,osmRelationAudit});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10KLRegistry=api;
})(typeof window!=='undefined'?window:null);
