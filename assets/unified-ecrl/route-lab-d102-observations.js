/* D102 event instrumentation / schema V1. No browser GPS or track survey claims.
 * Numeric CH events, manual engineering observation, provenance, QA export.
 * Never infer altitude, speed limit, geometry, signal or interlocking state. */
(function(root){'use strict';
const TYPES=Object.freeze(['STATION_ARRIVAL','STATION_DEPARTURE','PASSING_LOOP','MAINLINE','SPUR_JUNCTION','TUNNEL_ENTRY','TUNNEL_EXIT','BRIDGE_ENTRY','BRIDGE_EXIT','GRADIENT_CHANGE','CURVE_REFERENCE','TURNOUT_REFERENCE','SIGNAL_REFERENCE','SPEED_REFERENCE','ELECTRIFICATION_REFERENCE','TRACK_GAUGE_REFERENCE','WEATHER_ENVIRONMENT','WATER_CROSSING','CUT_FILL','ROAD_CROSSING','GPS_OBSERVATION_MANUAL','CH_GEOMETRY_DISCREPANCY','DATA_GAP','OTHER']);
const KEY='mrs10-p01-d102-observations-v1',LIMIT=1200;
function create(storage){
 let observations=[];
 try{const raw=JSON.parse(storage.getItem(KEY)||'null');if(Array.isArray(raw?.observations))observations=raw.observations.slice(-LIMIT).filter(e=>e?.schema===1&&Number.isInteger(e.CH)&&e.CH>=670&&e.CH<=524160)}catch(_){}
 let persistence='NOT_SAVED';
 function log(value,currentCH){
  const type=String(value.type||'OTHER');
  if(!TYPES.includes(type))throw Error('UNKNOWN_OBSERVATION_TYPE');
  if(!Number.isInteger(currentCH)||currentCH<670||currentCH>524160)throw Error('OUT_OF_CORRIDOR_CH');
  const observationSource=String(value.source||'OWNER_SIMULATED_OBSERVATION');
  if(observationSource.length<8)throw Error('MISSING_OBSERVATION_SOURCE');
  const title=String(value.title||'').trim(),notes=String(value.notes||'').trim();
  if(title.length<3||notes.length<8)throw Error('OBSERVATION_DESCRIPTION_REQUIRED');
  const evidenceClass=String(value.evidenceClass||'SIMULATED').toUpperCase();
  if(!['SIMULATED','PUBLIC_REFERENCE','OWNER_FIELD_NOTE_UNVERIFIED'].includes(evidenceClass))throw Error('INVALID_EVIDENCE_CLASS');
  const obj={
   schema:1,id:'D102-'+Date.now()+'-'+observations.length,type,
   train:'D102-SIM',CH:currentCH,CHLabel:'CH'+String(Math.floor(currentCH/1000)).padStart(3,'0')+'+'+String(currentCH%1000).padStart(3,'0'),
   createdAt:new Date().toISOString(),title:title.slice(0,140),notes:notes.slice(0,1200),
   evidenceClass,source:observationSource.slice(0,250),
   trackId:null,trackGaugeVerified:false,absoluteLatitude:null,absoluteLongitude:null,
   geometryAccuracyMetres:null,asBuilt:false,
   designSpeedKmh:null,permittedSpeedKmh:null,TSRKmh:null,
   gradientPerMille:null,curveRadiusM:null,elevationM:null,
   infrastructureId:null,occupancy:null,
   photoEvidencePointer:null,photoEmbedded:false,
   externalWeatherServiceData:null,liveTelemetry:false,
   qa:'PENDING_OWNER_REVIEW'
  };
  observations=[...observations,obj].slice(-LIMIT);
  try{storage.setItem(KEY,JSON.stringify({version:1,observations}));persistence='LOCAL_DEVICE_ONLY'}
  catch(e){persistence='STORAGE_FAILED_'+String(e.message||e).slice(0,50)}
  return obj;
 }
 function snapshot(){const byType={};for(const e of observations)byType[e.type]=(byType[e.type]||0)+1;
  return {schema:1,observationCount:observations.length,byType,observations:[...observations],persistence,
   trackGeometryVerified:false,actualGPSCaptured:false,actualMeasurementCaptured:false,cloudSynced:false};}
 function exportLog(){return {...snapshot(),schema:'mrs10-d102-telemetry-v1',license:'OWNER_LOCAL_SIMULATION_DATA',publicRelease:false}}
 return Object.freeze({log,snapshot,exportLog,TYPES});
}
const api=Object.freeze({create,TYPES,KEY});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLD102Observations=api;
})(typeof window!=='undefined'?window:null);
