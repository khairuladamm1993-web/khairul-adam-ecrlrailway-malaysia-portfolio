/* MR-S10 P01 ERL V2 — isolated, operator-backed PASSENGER SERVICE model.
 * No physical alignment, railway ways, platform topology, or fabricated station codes.
 */
(function(root){
 'use strict';
 const references=Object.freeze({
  operatorExpress:'https://www.kliaekspres.com/products-fares/klia-ekspres/',
  operatorTransit:'https://www.kliaekspres.com/products-fares/klia-transit/',
  operatorSchedule:'https://www.kliaekspres.com/schedule',
  operatorMap:'https://www.kliaekspres.com/media/wkxnzajm/erl_kv-integrated-transit-map_updated-mar23.pdf',
  ministry:'https://www.mot.gov.my/en/land/infrastructure/current-rail-services',
  gis:'https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/4'
 });
 const stops=Object.freeze([
  ['kl-sentral','KL Sentral', ['erl-klia-ekspres','erl-klia-transit'],['lrt-kelana-jaya','ktm-komuter','kl-monorail'],'INTERCHANGE_COMPLEX'],
  ['bandar-tasik-selatan','Bandar Tasik Selatan',['erl-klia-transit'],['lrt-sri-petaling','ktm-komuter'],'INTERCHANGE_COMPLEX'],
  ['putrajaya-cyberjaya','Putrajaya & Cyberjaya',['erl-klia-transit'],['mrt-putrajaya'],'CONNECTED_PUTRAJAYA_SENTRAL'],
  ['salak-tinggi','Salak Tinggi',['erl-klia-transit'],[],'NO_CONFIRMED_RAIL_INTERCHANGE'],
  ['klia-t1','KLIA T1',['erl-klia-ekspres','erl-klia-transit'],[],'AIRPORT_TERMINAL'],
  ['klia-t2','KLIA T2',['erl-klia-ekspres','erl-klia-transit'],[],'AIRPORT_TERMINAL']
 ].map((s,i)=>Object.freeze({
  id:s[0],name:s[1],order:i+1,serviceIds:Object.freeze(s[2]),
  interchangeServices:Object.freeze(s[3]),interchangeRelation:s[4],
  // ERL service code is NOT published in the operator sources reviewed.
  officialStationCode:null,codeStatus:'NOT_OPERATOR_VERIFIED',
  geometry:null,geometryStatus:'UNVERIFIED',physicalTrackIds:Object.freeze([]),
  sourceUrls:Object.freeze([references.operatorTransit,references.operatorMap])
 })));
 const ids=Object.freeze({
  express:Object.freeze(['kl-sentral','klia-t1','klia-t2']),
  transit:Object.freeze(stops.map(x=>x.id))
 });
 const colour=Object.freeze({
  express:Object.freeze({light:'#8C279C',dark:'#E7A8F2',family:'PURPLE_MAGENTA',isOfficialHex:false}),
  transit:Object.freeze({light:'#008C9D',dark:'#60DDE5',family:'CYAN_TEAL',isOfficialHex:false}),
  basis:'ERL_OFFICIAL_SCHEMATIC_COLOR_FAMILIES_UI_HEX_NOT_CERTIFIED'
 });
 function service(id,list){
  return Object.freeze({id,name:id==='erl-klia-ekspres'?'KLIA Ekspres':'KLIA Transit',
   operator:'Express Rail Link Sdn Bhd',stationSequence:Object.freeze(list),
   serviceAdjacencies:Object.freeze(list.slice(1).map((to,i)=>Object.freeze({
    fromStationId:list[i],toStationId:to,relation:'PASSENGER_SERVICE_STOP_ADJACENCY_NOT_RAIL_WAY',
    geometry:null,physicalTrackId:null
   }))),
   servicePattern:id==='erl-klia-ekspres'?'REGULAR_EXPRESS_THREE_STOPS':'ALL_STOPS',
   geometry:null,geometryStatus:'UNVERIFIED',acceptedPhysicalTrackWays:Object.freeze([]),
   references:Object.freeze([references.operatorExpress,references.operatorTransit,references.ministry])
  });
 }
 const services=Object.freeze({
  express:service('erl-klia-ekspres',ids.express),
  transit:service('erl-klia-transit',ids.transit)
 });
 const infrastructure=Object.freeze({
  sharedCorridorConfirmed:true,authority:references.ministry,
  // Sharing corridor does not prove same track throughout nor two separate tracks.
  routeToWayRelations:Object.freeze([]),physicalPolyline:null,
  topologyContinuity:'UNVERIFIED',licenceForRepublishingThirdPartyGis:'NOT_ESTABLISHED',
  mapHighlightPolicy:'SOURCE_MATCHED_STATION_POINTS_ONLY_NO_COLOURED_PHYSICAL_POLYLINES'
 });
 const schedule=Object.freeze({
  regularExpressStops:ids.express,
  lateNightExpressNote:'Operator states KLIA Ekspres trains stop at all stations from 23:00; consult live timetable for individual departures.',
  lateNightAdditionalStops:Object.freeze(['bandar-tasik-selatan','putrajaya-cyberjaya','salak-tinggi']),
  effectiveFromHourLocal:23,
  // Not an automated train-specific stop decision; schedule changes are possible.
  perTrainStopPatternVerified:false,sourceUrl:references.operatorExpress
 });
 const stationById=id=>stops.find(s=>s.id===id)||null;
 function regularServiceStopsAt(serviceId,stationId){
  const s=Object.values(services).find(s=>s.id===serviceId);
  return !!s&&s.stationSequence.includes(stationId);
 }
 function validate(){
  return stops.length===6 && new Set(ids.transit).size===6 &&
   ids.express.length===3 && stops.every(s=>s.geometry===null&&
   s.officialStationCode===null&&s.serviceIds.length>=1&&
   new Set(s.serviceIds).size===s.serviceIds.length) &&
   services.express.stationSequence.every(x=>ids.transit.includes(x)) &&
   services.express.stationSequence.join('|')==='kl-sentral|klia-t1|klia-t2' &&
   services.transit.stationSequence.join('|')===ids.transit.join('|') &&
   Object.values(services).every(s=>s.geometry===null&&s.serviceAdjacencies.length===s.stationSequence.length-1) &&
   infrastructure.physicalPolyline===null&&infrastructure.routeToWayRelations.length===0;
 }
 const api=Object.freeze({references,stops,services,colour,schedule,infrastructure,stationById,regularServiceStopsAt,validate});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10ERLV2=api;
})(typeof window!=='undefined'?window:null);
