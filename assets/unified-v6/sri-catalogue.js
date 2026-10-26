/* MR-S10 P01 Sri Petaling V2: isolated public service catalogue.
 * Service sequence != track geometry. SP23/SP30 are not active station stops.
 * Code/order crosscheck: operator transit map + station directories, not train control identifiers.
 */
(function(root){
'use strict';
const sources=Object.freeze({
 operatorMap:'https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf',
 mot:'https://www.mot.gov.my/en/land/infrastructure/current-rail-services',
 names:'https://www.mrt.com.my/stations.htm',
 codes:'https://www.transportmalaysia.com/services/lrt-sri-petaling-line/',
 codesTerminus:'https://mrt.com.my/lrt_sri_petaling/Putra_Heights.htm',
 gis:'https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/2',
 gisAlignment:'https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/11'
});
const nameOrder=Object.freeze([
'Sentul Timur','Sentul','Titiwangsa','PWTC','Sultan Ismail','Bandaraya','Masjid Jamek',
'Plaza Rakyat','Hang Tuah','Pudu','Chan Sow Lin','Cheras','Salak Selatan',
'Bandar Tun Razak','Bandar Tasik Selatan','Sungai Besi','Bukit Jalil','Sri Petaling',
'Awan Besar','Muhibbah','Alam Sutera','Kinrara BK5','IOI Puchong Jaya',
'Pusat Bandar Puchong','Taman Perindustrian Puchong','Bandar Puteri',
'Puchong Perdana','Puchong Prima','Putra Heights'
]);
const codeNumbers=Object.freeze([...Array.from({length:22},(_,i)=>i+1),24,25,26,27,28,29,31]);
const connections=Object.freeze({
 Titiwangsa:['mrt-putrajaya','kl-monorail'],
 Bandaraya:['ktm-komuter'],
 'Masjid Jamek':['lrt-kelana-jaya'],
 'Plaza Rakyat':['mrt-kajang'],
 'Hang Tuah':['kl-monorail'],
 'Chan Sow Lin':['mrt-putrajaya'],
 'Salak Selatan':['ktm-komuter'],
 'Bandar Tasik Selatan':['ktm-komuter','erl-klia-transit'],
 'Sungai Besi':['mrt-putrajaya'],
 'Putra Heights':['lrt-kelana-jaya']
});
const color=Object.freeze({
 family:'MAROON',operatorIdentity:'SERVICE_COLOR_FAMILY_SOURCE_BACKED',
 exactOperatorHexVerified:false,light:'#862448',dark:'#F2A6C0',
 markerLight:'#862448',markerDark:'#F2A6C0',
 scope:'PASSENGER_SERVICE_ONLY',physicalTrackColourAuthorised:false
});
const stations=Object.freeze(nameOrder.map((name,i)=>{
 const n=codeNumbers[i],shared=i<11,sp='SP'+n,ag=shared?'AG'+(i+1):null;
 return Object.freeze({
  id:'mrs10-spl-'+sp.toLowerCase(),name,order:i+1,serviceCode:sp,
  pairedAmpangCode:ag,sharedPassengerServices:shared?Object.freeze(['lrt-ampang','lrt-sri-petaling']):Object.freeze(['lrt-sri-petaling']),
  sharedService:shared,sharedStationKey:shared?'agsp-'+(i+1):null,
  connectionServiceIds:Object.freeze(connections[name]||[]),
  connectionClassification:'PASSENGER_REFERENCE_NOT_PROOF_OF_SAME_PLATFORM',
  sourceUrls:Object.freeze([sources.operatorMap,sources.names,sources.codes]),
  nameTranslations:Object.freeze({ms:name,en:name,zh:null,th:null}),
  geometry:null,sourcePoiStatus:'RUNTIME_GIS_VERIFICATION_REQUIRED',
  platformIds:Object.freeze([]),railwayWayIds:Object.freeze([]),physicalTrackIds:Object.freeze([]),
  trackCount:'UNVERIFIED',physicalTrackStatus:'UNVERIFIED'
 });
}));
const route=Object.freeze({
 id:'lrt-sri-petaling',lineNumber:4,name:'LRT Sri Petaling Line',operator:'Rapid Rail / Rapid KL',
 fromStationId:stations[0].id,toStationId:stations.at(-1).id,
 stationCount:29,stationSequence:Object.freeze(stations.map(s=>s.id)),
 serviceAdjacencies:Object.freeze(stations.slice(1).map((s,i)=>Object.freeze({
  from:stations[i].id,to:s.id,type:'PASSENGER_SERVICE_SEQUENCE_ONLY',
  geometry:null,physicalWayId:null
 }))),
 sharedPassengerSection:Object.freeze({
  with:'lrt-ampang',from:'Sentul Timur',through:'Chan Sow Lin',stationCount:11,
  serviceRelationship:'SHARED_SERVICE_CORRIDOR',tracks:'UNVERIFIED',
  physicalGeometry:null,physicalWayIds:Object.freeze([])
 }),
 branch:Object.freeze({divergenceStation:'Chan Sow Lin',
  ampangDestination:'Ampang',sriPetalingDestination:'Putra Heights',
  junctionPosition:null,turnoutIds:Object.freeze([])}),
 stationGeometry:null,railwayAlignment:null,acceptedRailWayIds:Object.freeze([]),
 physicalGeometryStatus:'UNVERIFIED'
});
function validate(){
 if(stations.length!==29||route.serviceAdjacencies.length!==28)return false;
 if(stations[0].name!=='Sentul Timur'||stations.at(-1).name!=='Putra Heights')return false;
 if(stations.filter(s=>s.sharedService).length!==11)return false;
 if(stations[10].name!=='Chan Sow Lin'||stations[11].name!=='Cheras')return false;
 if(new Set(stations.map(s=>s.serviceCode)).size!==29)return false;
 if(stations.some((s,i)=>s.order!==i+1||s.serviceCode!=='SP'+codeNumbers[i]||
  s.geometry!==null||s.physicalTrackIds.length!==0||s.railwayWayIds.length!==0||
  (s.sharedService&&s.pairedAmpangCode!=='AG'+(i+1))||
  (!s.sharedService&&s.pairedAmpangCode!==null)))return false;
 return route.railwayAlignment===null&&route.acceptedRailWayIds.length===0&&
  !color.physicalTrackColourAuthorised;
}
function findByName(name){return stations.find(s=>s.name===name)||null}
function findByCode(code){return stations.find(s=>s.serviceCode===code)||null}
function sharedFixture(ampang){
 if(!ampang?.validate?.())return Object.freeze({ok:false,reason:'AMPANG_UNAVAILABLE'});
 const a=ampang.stations.slice(0,11);
 const matches=stations.slice(0,11).every((s,i)=>s.name===a[i].name&&s.pairedAmpangCode===a[i].serviceCode);
 return Object.freeze({ok:matches,shared:matches?11:0,ampStations:ampang.stations.length});
}
const api=Object.freeze({sources,nameOrder,codeNumbers,stations,route,color,validate,findByName,findByCode,sharedFixture});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10SriPetalingV2=api;
})(typeof window!=='undefined'?window:null);
