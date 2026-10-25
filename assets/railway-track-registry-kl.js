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
  mrtKajangShortList:'https://www.mymrt.com.my/projects/kajang-line/stations/',
  kelanaOperatorMap:'https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf',
  kelanaCodesCrosscheck:'https://www.mtrec.name.my/network/kjl.html',
  pylStations:'https://www.mymrt.com.my/projects/putrajaya-line/stations/',
  pylOverview:'https://www.mymrt.com.my/projects/putrajaya-line/',
  pylCodeCrosscheck:'https://www.transportmalaysia.com/services/mrt-putrajaya-line/',
  pylHexCrosscheck:'https://www.transportmalaysia.com/hex-codes-for-public-transport-services/'
 });
 // R2.17: sourced passenger-service branding, NOT an infrastructure-way style.
 const kajangLineVisual=Object.freeze({
  name:'Kajang Line Green',light:'#087D43',dark:'#50E2A0',
  use:'SERVICE_AND_VERIFIED_STATION_REFERENCE_ONLY',
  physicalAlignmentStatus:'UNVERIFIED'
 });
 // R2.18: distinct ruby service identity. Rapid KL official service status lists D50032.
 const kelanaLineServiceIdentity=Object.freeze({
  name:'Kelana Jaya Ruby',light:'#D50032',dark:'#FF8CA5',
  use:'SERVICE_AND_SOURCE_CODED_POI_ONLY',physicalAlignmentStatus:'UNVERIFIED',
  sourceUrl:sourceCatalogue.rapid
 });
 // R2.20: operator YELLOW hue; hexadecimal cross-checked with secondary directory,
// not a formally certified MRT Corp colour specification.
 const putrajayaIdentity=Object.freeze({name:'Putrajaya Line Yellow',light:'#FBCD20',dark:'#FFE36C',
  use:'SERVICE_AND_SOURCE_CODED_POI_CANDIDATES_ONLY',physicalAlignmentStatus:'UNVERIFIED',
  colourAuthority:'OFFICIAL_YELLOW_HUE_SECONDARY_HEX_CROSSCHECK_NOT_OPERATOR_CERTIFIED',
  sourceUrl:sourceCatalogue.pylOverview,colourCrosscheckUrl:sourceCatalogue.pylHexCrosscheck});
 const route=(id,name,mode,operator,sourceKeys,stationSequence=[])=>Object.freeze({
  id,name,mode,operator,sourceUrls:sourceKeys.map(k=>sourceCatalogue[k]||k),
  visualIdentity:id==='mrt-kajang'?kajangLineVisual:null,
  serviceIdentity:id==='lrt-kelana-jaya'?kelanaLineServiceIdentity:
   id==='mrt-putrajaya'?putrajayaIdentity:null,
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
  // R2.18: 37 official service stops; KJ labels are cross-checked with independent
  // station directory, not individually certified operator equipment identifiers.
  {id:'lrt-kj1',name:"Gombak",code:'KJ1',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj2',name:"Taman Melati",code:'KJ2',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj3',name:"Wangsa Maju",code:'KJ3',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj4',name:"Sri Rampai",code:'KJ4',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj5',name:"Setiawangsa",code:'KJ5',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj6',name:"Jelatek",code:'KJ6',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj7',name:"Dato' Keramat",code:'KJ7',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj8',name:"Damai",code:'KJ8',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj9',name:"Ampang Park",code:'KJ9',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj10',name:"KLCC",code:'KJ10',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj11',name:"Kampung Baru",code:'KJ11',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj12',name:"Dang Wangi",code:'KJ12',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj13',name:"Masjid Jamek",code:'KJ13',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj14',name:"Pasar Seni",code:'KJ14',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj15',name:"KL Sentral",code:'KJ15',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj16',name:"Bangsar",code:'KJ16',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj17',name:"Abdullah Hukum",code:'KJ17',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj18',name:"Kerinchi",code:'KJ18',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj19',name:"Universiti",code:'KJ19',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj20',name:"Taman Jaya",code:'KJ20',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj21',name:"Asia Jaya",code:'KJ21',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj22',name:"Taman Paramount",code:'KJ22',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj23',name:"Taman Bahagia",code:'KJ23',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj24',name:"Kelana Jaya",code:'KJ24',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj25',name:"Lembah Subang",code:'KJ25',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj26',name:"Ara Damansara",code:'KJ26',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj27',name:"Glenmarie",code:'KJ27',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj28',name:"Subang Jaya",code:'KJ28',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj29',name:"SS15",code:'KJ29',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj30',name:"SS18",code:'KJ30',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj31',name:"USJ7",code:'KJ31',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj32',name:"Taipan",code:'KJ32',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj33',name:"Wawasan",code:'KJ33',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj34',name:"USJ21",code:'KJ34',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj35',name:"Alam Megah",code:'KJ35',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj36',name:"Subang Alam",code:'KJ36',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  {id:'lrt-kj37',name:"Putra Heights",code:'KJ37',sourceUrls:[sourceCatalogue.kelanaOperatorMap,sourceCatalogue.kelanaCodesCrosscheck],confidence:'SERVICE_SEQUENCE_MAP_WITH_SECONDARY_CODE_CROSSCHECK'},
  // R2.20: MRT Corp's 36 operational stops only (five provisionals excluded).
  {id:'mrt-py01',name:"Kwasa Damansara",code:'PY01',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py03',name:"Kampung Selamat",code:'PY03',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py04',name:"Sungai Buloh",code:'PY04',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py05',name:"Damansara Damai",code:'PY05',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py06',name:"Sri Damansara Barat",code:'PY06',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py07',name:"Sri Damansara Sentral",code:'PY07',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py08',name:"Sri Damansara Timur",code:'PY08',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py09',name:"Metro Prima",code:'PY09',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py10',name:"Kepong Baru",code:'PY10',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py11',name:"Jinjang",code:'PY11',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py12',name:"Sri Delima",code:'PY12',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py13',name:"Kampung Batu",code:'PY13',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py14',name:"Kentonmen",code:'PY14',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py15',name:"Jalan Ipoh",code:'PY15',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py16',name:"Sentul Barat",code:'PY16',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py17',name:"Titiwangsa",code:'PY17',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py18',name:"Hospital Kuala Lumpur",code:'PY18',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py19',name:"Raja Uda",code:'PY19',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py20',name:"Ampang Park",code:'PY20',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py21',name:"Persiaran KLCC",code:'PY21',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py22',name:"Conlay",code:'PY22',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py23',name:"Tun Razak Exchange (TRX)",code:'PY23',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py24',name:"Chan Sow Lin",code:'PY24',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py27',name:"Kuchai",code:'PY27',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py28',name:"Taman Naga Emas",code:'PY28',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py29',name:"Sungai Besi",code:'PY29',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py31',name:"Serdang Raya Utara",code:'PY31',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py32',name:"Serdang Raya Selatan",code:'PY32',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py33',name:"Serdang Jaya",code:'PY33',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py34',name:"UPM",code:'PY34',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py36',name:"Taman Equine",code:'PY36',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py37',name:"Putra Permai",code:'PY37',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py38',name:"16 Sierra",code:'PY38',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py39',name:"Cyberjaya Utara",code:'PY39',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py40',name:"Cyberjaya City Centre",code:'PY40',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  {id:'mrt-py41',name:"Putrajaya Sentral",code:'PY41',sourceUrls:[sourceCatalogue.pylStations,sourceCatalogue.pylCodeCrosscheck],confidence:'MRT_CORP_ORDER_SECONDARY_PY_CODE_CROSSCHECK'},
  // Owner Safari screenshot confirms cartographic POI name only; no service attachment.
  {id:'poi-maharajalela',name:'Maharajalela',originalName:'MR3 Maharajalela',
   sourceUrls:['https://openmaptiles.org/docs/schema/'],confidence:'OWNER_SAFARI_VECTOR_POI',linkedRouteId:null},
  {id:'poi-pasar-seni',name:'Pasar Seni',originalName:'KG16 Pasar Seni',
   sourceUrls:['https://openmaptiles.org/docs/schema/'],confidence:'OWNER_SAFARI_VECTOR_POI',linkedRouteId:null}
 ].map(s=>Object.freeze(Object.assign({geometry:null,geometryStatus:'UNVERIFIED',physicalTrackIds:[]},s))));
 const routes=Object.freeze([
  route('ktm-batu-caves-pulau-sebang','KTM Komuter · Batu Caves – Pulau Sebang','rail','KTMB',['ktm','mot']),
  route('ktm-tanjung-malim-pelabuhan-klang','KTM Komuter · Tanjung Malim – Pelabuhan Klang','rail','KTMB',['ktm','mot']),
  route('lrt-kelana-jaya','LRT · Kelana Jaya Line','light_rail','Rapid Rail',
   ['rapid','mot','kelanaOperatorMap','kelanaCodesCrosscheck'],
   ['lrt-kj1','lrt-kj2','lrt-kj3','lrt-kj4','lrt-kj5','lrt-kj6','lrt-kj7','lrt-kj8','lrt-kj9','lrt-kj10','lrt-kj11','lrt-kj12','lrt-kj13','lrt-kj14','lrt-kj15','lrt-kj16','lrt-kj17','lrt-kj18','lrt-kj19','lrt-kj20','lrt-kj21','lrt-kj22','lrt-kj23','lrt-kj24','lrt-kj25','lrt-kj26','lrt-kj27','lrt-kj28','lrt-kj29','lrt-kj30','lrt-kj31','lrt-kj32','lrt-kj33','lrt-kj34','lrt-kj35','lrt-kj36','lrt-kj37']),
  route('lrt-ampang','LRT · Ampang Line','light_rail','Rapid Rail',['rapid','mot']),
  route('lrt-sri-petaling','LRT · Sri Petaling Line','light_rail','Rapid Rail',['rapid','mot']),
  route('mrt-kajang','MRT · Kajang Line','subway','Rapid Rail',
   ['mrtKajangStations29','mrtKajangOverview','rapid'],
   [
    'mrt-kwasa-damansara','mrt-kwasa-sentral','mrt-kota-damansara','mrt-surian','mrt-mutiara-damansara','mrt-bandar-utama','mrt-taman-tun-dr-ismail','mrt-phileo-damansara','mrt-pusat-bandar-damansara','mrt-semantan',
    'mrt-muzium-negara','mrt-pasar-seni','mrt-merdeka','mrt-bukit-bintang','mrt-tun-razak-exchange','mrt-cochrane','mrt-maluri','mrt-taman-pertama','mrt-taman-midah','mrt-taman-mutiara',
    'mrt-taman-connaught','mrt-taman-suntex','mrt-sri-raya','mrt-bandar-tun-hussein-onn','mrt-batu-sebelas-cheras','mrt-bukit-dukung','mrt-sungai-jernih','mrt-stadium-kajang','mrt-kajang'
   ]),
  route('mrt-putrajaya','MRT · Putrajaya Line','subway','Rapid Rail',
   ['pylStations','pylOverview','pylCodeCrosscheck','rapid'],
   ['mrt-py01','mrt-py03','mrt-py04','mrt-py05','mrt-py06','mrt-py07','mrt-py08','mrt-py09','mrt-py10','mrt-py11','mrt-py12','mrt-py13','mrt-py14','mrt-py15','mrt-py16','mrt-py17','mrt-py18','mrt-py19','mrt-py20','mrt-py21','mrt-py22','mrt-py23','mrt-py24','mrt-py27','mrt-py28','mrt-py29','mrt-py31','mrt-py32','mrt-py33','mrt-py34','mrt-py36','mrt-py37','mrt-py38','mrt-py39','mrt-py40','mrt-py41']),
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
  provisionalStations:Object.freeze([{"code":"PY02","name":"Rubber Research Institute (RRI)","serviceStatus":"NOT_OPERATIONAL","geometry":null},{"code":"PY25","name":"Bandar Malaysia Utara","serviceStatus":"NOT_OPERATIONAL","geometry":null},{"code":"PY26","name":"Bandar Malaysia Selatan","serviceStatus":"NOT_OPERATIONAL","geometry":null},{"code":"PY30","name":"Taman Teknologi","serviceStatus":"NOT_OPERATIONAL","geometry":null},{"code":"PY35","name":"Taman Universiti","serviceStatus":"NOT_OPERATIONAL","geometry":null}].map(s=>Object.freeze(s))),
  sourceAudit:Object.freeze({
   mrtPutrajaya:{
    operationalStops:36,provisionalStops:5,serviceAdjacencies:35,
    codeStatus:'SECONDARY_DIRECTORY_CROSSCHECK_NOT_OFFICIAL_CODE_CERTIFICATION',
    serviceColour:'YELLOW_OPERATOR_HUE_SECONDARY_HEX_CROSSCHECK_FBCD20',physicalTrackGeometry:'UNVERIFIED',
    colourCrosscheckUrl:sourceCatalogue.pylHexCrosscheck,
    provisionalBasis:'MRT Corp overview confirms five provisional locations; station page includes two inactive names.',
    officialReferences:[sourceCatalogue.pylStations,sourceCatalogue.pylOverview],
    secondaryReferences:[sourceCatalogue.pylCodeCrosscheck]
   },
   kelanaJaya:{
    stationCount:37,orderedServiceAdjacencies:36,
    stationOrderSource:'Rapid KL integrated transit map; operator service identity cross-checked with Ministry of Transport 37-stop Gombak–Putra Heights scope.',
    codeStatus:'SECONDARY_DIRECTORY_CROSSCHECK_PENDING_OPERATOR_INDIVIDUAL_CODE_CONFIRMATION',
    serviceColour:'#D50032',colourSource:sourceCatalogue.rapid,
    physicalTrackGeometry:'UNVERIFIED',
    poiMatching:'EXACT_KJ_CODE_PLUS_OFFICIAL_NAME_CANDIDATE_ONLY',
    officialReferences:[sourceCatalogue.rapid,sourceCatalogue.mot,sourceCatalogue.kelanaOperatorMap],
    secondaryReferences:[sourceCatalogue.kelanaCodesCrosscheck]
   },
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
  const pyl=data.routes.find(r=>r.id==='mrt-putrajaya');
   if(pyl){
    if(pyl.stationSequence.length!==36||pyl.serviceAdjacencies.length!==35)return false;
    const reserved=new Set((data.provisionalStations||[]).map(s=>s.code));
    if(reserved.size!==5||pyl.stationSequence.some(id=>reserved.has(data.stations.find(s=>s.id===id)?.code)))return false;
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
 // R2.18: only an exact code-prefixed vector feature can become a candidate.
 // No matching on name alone: KL Sentral and Pasar Seni are multimodal interchanges.
 const kelanaLabels=Object.freeze([
  Object.freeze({raw:"KJ1 Gombak",stationId:'lrt-kj1',name:"Gombak"}),
  Object.freeze({raw:"KJ2 Taman Melati",stationId:'lrt-kj2',name:"Taman Melati"}),
  Object.freeze({raw:"KJ3 Wangsa Maju",stationId:'lrt-kj3',name:"Wangsa Maju"}),
  Object.freeze({raw:"KJ4 Sri Rampai",stationId:'lrt-kj4',name:"Sri Rampai"}),
  Object.freeze({raw:"KJ5 Setiawangsa",stationId:'lrt-kj5',name:"Setiawangsa"}),
  Object.freeze({raw:"KJ6 Jelatek",stationId:'lrt-kj6',name:"Jelatek"}),
  Object.freeze({raw:"KJ7 Dato' Keramat",stationId:'lrt-kj7',name:"Dato' Keramat"}),
  Object.freeze({raw:"KJ8 Damai",stationId:'lrt-kj8',name:"Damai"}),
  Object.freeze({raw:"KJ9 Ampang Park",stationId:'lrt-kj9',name:"Ampang Park"}),
  Object.freeze({raw:"KJ10 KLCC",stationId:'lrt-kj10',name:"KLCC"}),
  Object.freeze({raw:"KJ11 Kampung Baru",stationId:'lrt-kj11',name:"Kampung Baru"}),
  Object.freeze({raw:"KJ12 Dang Wangi",stationId:'lrt-kj12',name:"Dang Wangi"}),
  Object.freeze({raw:"KJ13 Masjid Jamek",stationId:'lrt-kj13',name:"Masjid Jamek"}),
  Object.freeze({raw:"KJ14 Pasar Seni",stationId:'lrt-kj14',name:"Pasar Seni"}),
  Object.freeze({raw:"KJ15 KL Sentral",stationId:'lrt-kj15',name:"KL Sentral"}),
  Object.freeze({raw:"KJ16 Bangsar",stationId:'lrt-kj16',name:"Bangsar"}),
  Object.freeze({raw:"KJ17 Abdullah Hukum",stationId:'lrt-kj17',name:"Abdullah Hukum"}),
  Object.freeze({raw:"KJ18 Kerinchi",stationId:'lrt-kj18',name:"Kerinchi"}),
  Object.freeze({raw:"KJ19 Universiti",stationId:'lrt-kj19',name:"Universiti"}),
  Object.freeze({raw:"KJ20 Taman Jaya",stationId:'lrt-kj20',name:"Taman Jaya"}),
  Object.freeze({raw:"KJ21 Asia Jaya",stationId:'lrt-kj21',name:"Asia Jaya"}),
  Object.freeze({raw:"KJ22 Taman Paramount",stationId:'lrt-kj22',name:"Taman Paramount"}),
  Object.freeze({raw:"KJ23 Taman Bahagia",stationId:'lrt-kj23',name:"Taman Bahagia"}),
  Object.freeze({raw:"KJ24 Kelana Jaya",stationId:'lrt-kj24',name:"Kelana Jaya"}),
  Object.freeze({raw:"KJ25 Lembah Subang",stationId:'lrt-kj25',name:"Lembah Subang"}),
  Object.freeze({raw:"KJ26 Ara Damansara",stationId:'lrt-kj26',name:"Ara Damansara"}),
  Object.freeze({raw:"KJ27 Glenmarie",stationId:'lrt-kj27',name:"Glenmarie"}),
  Object.freeze({raw:"KJ28 Subang Jaya",stationId:'lrt-kj28',name:"Subang Jaya"}),
  Object.freeze({raw:"KJ29 SS15",stationId:'lrt-kj29',name:"SS15"}),
  Object.freeze({raw:"KJ30 SS18",stationId:'lrt-kj30',name:"SS18"}),
  Object.freeze({raw:"KJ31 USJ7",stationId:'lrt-kj31',name:"USJ7"}),
  Object.freeze({raw:"KJ32 Taipan",stationId:'lrt-kj32',name:"Taipan"}),
  Object.freeze({raw:"KJ33 Wawasan",stationId:'lrt-kj33',name:"Wawasan"}),
  Object.freeze({raw:"KJ34 USJ21",stationId:'lrt-kj34',name:"USJ21"}),
  Object.freeze({raw:"KJ35 Alam Megah",stationId:'lrt-kj35',name:"Alam Megah"}),
  Object.freeze({raw:"KJ36 Subang Alam",stationId:'lrt-kj36',name:"Subang Alam"}),
  Object.freeze({raw:"KJ37 Putra Heights",stationId:'lrt-kj37',name:"Putra Heights"})
 ]);
 function matchSourcedKelanaPoi(props){
  if(!props||props.class!=='railway'||!['station','subway'].includes(props.subclass))return null;
  const raw=typeof props.name==='string'?props.name.trim():'';
  const recognized=kelanaLabels.find(x=>x.raw===raw);
  if(!recognized)return null;
  const en=String(props['name:en']||props.name_en||'').trim();
  if(en && en.toLowerCase()!==recognized.name.toLowerCase() && en.toLowerCase()!==recognized.raw.toLowerCase())return null;
  const service=findRoute('lrt-kelana-jaya');
  const index=service.stationSequence.indexOf(recognized.stationId);
  if(index<0)return null;
  return Object.freeze({routeId:service.id,routeName:service.name,stationId:recognized.stationId,
   stationName:recognized.name,stationCode:'KJ'+(index+1),stopPosition:index+1,stopCount:37,
   status:'CANDIDATE_EXACT_CODE_NAME_VECTOR_MATCH_NOT_OWNER_OBSERVED',
   physicalTrackId:null,geometry:null,relationId:null,routeGeometryStatus:'UNVERIFIED'});
 }

 // OSM way 460387856 approximate station centre, NOT surveyed platform/track geometry.
 const kwasaSource=Object.freeze({name:'KG04 PY01 Kwasa Damansara',
  coords:Object.freeze([101.5724,3.17631]),osmWayId:460387856,
  url:'https://www.openstreetmap.org/way/460387856',status:'OSM_SOURCE_REFERENCE_ONLY'});
 // Only exact code+name, NEVER generic shared interchange name. POI unverified until observed.
 function matchSourcedPutrajayaPoi(props){
  if(!props||props.class!=='railway'||!['station','subway'].includes(props.subclass))return null;
  const raw=typeof props.name==='string'?props.name.trim():'';
  const shared=raw===kwasaSource.name;
  const m=shared?[raw,'PY01','Kwasa Damansara']:/^(PY(?:0?[1-9]|[1-3][0-9]|4[01])) (.+)$/.exec(raw);
  if(!m)return null;
  const code='PY'+String(Number(m[1].slice(2))).padStart(2,'0');
  const entry=catalog.stations.find(s=>s.code===code&&s.id.startsWith('mrt-py'));
  if(!entry||entry.name!==m[2])return null;
  const english=String(props['name:en']||props.name_en||'').trim();
  if(english&&english.toLowerCase()!==entry.name.toLowerCase()&&english.toLowerCase()!==raw.toLowerCase())return null;
  const route=findRoute('mrt-putrajaya'),index=route?.stationSequence?.indexOf(entry.id);
  if(index<0)return null;
  return Object.freeze({routeId:route.id,routeName:route.name,stationId:entry.id,
    stationName:entry.name,stationCode:code,stopPosition:index+1,stopCount:36,
    status:shared?'CANDIDATE_OSM_SHARED_KG04_PY01':'CANDIDATE_EXACT_PY_CODE_NAME_NOT_OWNER_TILE_CONFIRMED',sharedCode:shared?'KG04':null,
    physicalTrackId:null,geometry:null,relationId:null,routeGeometryStatus:'UNVERIFIED'});
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
 const api=Object.freeze({catalog,validateRegistry,findRoute,matchSourcedKajangPoi,kajangPoiSourceNames,kajangServicePoiCandidates,matchSourcedKelanaPoi,matchSourcedPutrajayaPoi,kwasaSource,osmRelationAudit});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10KLRegistry=api;
})(typeof window!=='undefined'?window:null);
