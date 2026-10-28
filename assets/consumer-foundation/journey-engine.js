/* Pure consumer domain model. No GPS, ticketing, live timetable or inferred track. */
(function(root){'use strict';
const modes=Object.freeze(['SIMULATION','UNAVAILABLE']);
function create(stations,originId,destinationId){
 const ordered=[...stations].sort((a,b)=>a.stationOrder-b.stationOrder);
 if(new Set(ordered.map(s=>s.stationOrder)).size!==ordered.length||ordered.some(s=>!Number.isInteger(s.stationOrder)))throw Error('UNRESOLVED_STATION_ORDER');
 const a=ordered.findIndex(s=>s.assetId===originId),b=ordered.findIndex(s=>s.assetId===destinationId);
 if(a<0||b<0)throw Error('UNKNOWN_STATION');if(a===b)throw Error('SAME_STATION');
 const lineup=(a<b?ordered.slice(a,b+1):ordered.slice(b,a+1).reverse()).map(s=>({stationId:s.assetId,name:s.officialName,operationalStatus:s.assetStatus,chainageLabel:s.chainageLabel||null,chainageKm:Number.isFinite(s.chainageKm)?s.chainageKm:null,chainageDatum:s.chainageDatum||null}));
 return Object.freeze({schemaVersion:'1.0.0',mode:'SIMULATION',originId,destinationId,lineup:Object.freeze(lineup.map(Object.freeze)),currentIndex:0,location:Object.freeze({permission:'NOT_REQUESTED',position:null,mapMatch:'UNKNOWN',reason:'NO_VERIFIED_TRACK_GEOMETRY'}),timetable:Object.freeze({status:'UNAVAILABLE',sourceUrl:null,observedAt:null}),eta:Object.freeze({status:'UNKNOWN',arrivalAt:null,reason:'NO_OPERATIONAL_TIMETABLE'}),network:'UNKNOWN',evidence:'SOURCE_STATION_ORDER_ONLY_NOT_SERVICE_OR_TRACK'});
}
function progress(journey){
 const i=journey.currentIndex,current=journey.lineup[i],destination=journey.lineup[journey.lineup.length-1];
 const comparable=Number.isFinite(current.chainageKm)&&Number.isFinite(destination.chainageKm)&&
  current.chainageDatum&&current.chainageDatum===destination.chainageDatum;
 const referenceRemainingKm=comparable?Math.round(Math.abs(destination.chainageKm-current.chainageKm)*1000)/1000:null;
 return {currentStation:current,nextStation:journey.lineup[i+1]||null,completedLegs:i,totalLegs:journey.lineup.length-1,
 percentage:Math.round(i/(journey.lineup.length-1)*100),arrived:i===journey.lineup.length-1,
 referenceRemainingKm,referenceDistanceStatus:comparable?'SIMULATED_CH_STATION_ANCHOR_DIFFERENCE':'UNAVAILABLE',
 isLiveDistance:false,currentTrainChainage:null};
}
function advance(journey){if(journey.mode!=='SIMULATION')throw Error('SIMULATION_ONLY');return Object.freeze({...journey,currentIndex:Math.min(journey.currentIndex+1,journey.lineup.length-1)})}
function network(journey,online){return Object.freeze({...journey,network:online?'ONLINE':'OFFLINE'})}
function mapMatch(){return Object.freeze({status:'UNKNOWN',stationId:null,segmentId:null,reason:'NO_VERIFIED_TRACK_GEOMETRY'})}
const api={modes,create,progress,advance,network,mapMatch};if(typeof module==='object')module.exports=api;if(root)root.MRS10JourneyFoundation=api;
})(typeof window!=='undefined'?window:null);
