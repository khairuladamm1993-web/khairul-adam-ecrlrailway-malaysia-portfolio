/* Deterministic CH breadcrumbs; all distances along accepted CH project registry,
   NEVER derived GPS coordinates. CH trail is not surveyed geometry. */
(function(root){'use strict';
function create(session,{intervalM=100}={}){
 if(!session||!Number.isInteger(session.currentCH)||!Array.isArray(session.events))throw Error('INVALID_TRAIN_SESSION');
 if(!Number.isInteger(intervalM)||intervalM<10||intervalM>1000)throw Error('BAD_TRAIL_INTERVAL');
 const moves=session.events.filter(e=>e.type==='MANUAL_CH_MOVE'&&Number.isInteger(e.from)&&Number.isInteger(e.to));
 const origin=Number.isInteger(moves[0]?.from)?moves[0].from:session.currentCH;
 const target=session.currentCH;
 const direction=Math.sign(target-origin)||1;
 // Reconstruct from deterministic events that were already autosaved in session.
 // Do not silently interpolate longitude/latitude between station localities.
 const traces=[{CH:origin,pointType:'SIMULATED_CH_START',source:'OWNER_PROJECT_CHAINAGE_ONLY'}];
 let prev=origin;
 for(const e of moves){
  if(Math.sign(e.to-e.from)!==direction||e.to===e.from||e.from!==prev)continue;
  let next=Math.ceil(e.from/intervalM)*intervalM;
  if(direction<0)next=Math.floor(e.from/intervalM)*intervalM;
  for(let ch=next;direction>0?ch<e.to:ch>e.to;ch+=direction*intervalM){
   if(direction*(ch-e.from)>0)traces.push({CH:ch,pointType:'SIMULATED_CH_SAMPLE',source:'OWNER_PROJECT_CHAINAGE_ONLY'});
  }
  traces.push({CH:e.to,pointType:'SIMULATED_CH_MOVE_END',source:'OWNER_PROJECT_CHAINAGE_ONLY',recordedAt:e.time||null});
  prev=e.to;
 }
 if(traces.at(-1)?.CH!==target)traces.push({CH:target,pointType:'SIMULATED_CH_CURRENT',source:'OWNER_PROJECT_CHAINAGE_ONLY'});
 const unique=traces.filter((p,i)=>!i||p.CH!==traces[i-1].CH);
 return {schema:'mrs10-ecrl-ch-trail-v1',trainId:session.trainId||'D102-SIM',originCH:origin,currentCH:target,direction,
  intervalM,pointCount:unique.length,sampledCH:unique,geographicCoordinates:null,trackGeometryVerified:false,
  roadGeometryUsed:false,source:'OWNER_ACCEPTED_CH_MANIFEST_AND_MANUAL_SIMULATION',persistence:'SESSION_EVENTS_LOCALSTORAGE_ONLY',
  geometryStatus:'NO_PHYSICAL_GEO_TRACE',simulationOnly:true};
}
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLCHTrail=api;
})(typeof window!=='undefined'?window:null);
