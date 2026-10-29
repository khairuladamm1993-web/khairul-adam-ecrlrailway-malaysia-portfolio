/* ECRL D102 Owner pre-run control register.
 * Owner review is a MODEL confirmation, NOT a certified physical survey.
 * No PL coordinate is interpolated from chainage or guessed from a city.
 * Isolated browser storage only; no server/cloud writes. */
(function(root){'use strict';
const rows=root.MRS10ECRLChainage?.records||[],gis=root.MRS10ECRLGISV1||{},pls=root.MRS10ECRLAlignmentEvidence?.passingLoops||[];
if(rows.length!==23||pls.length!==7)throw Error('D102_PREFLIGHT_REGISTER_MISSING');
const REV=1,KEY='mrs10-p01-d102-owner-preflight-v1',MALAYSIA={lat:[1,7],lon:[99,105]};
const fixed=(n)=>Math.round(n*1e7)/1e7;
const format=ch=>'CH'+String(Math.floor(ch/1000)).padStart(3,'0')+'+'+String(ch%1000).padStart(3,'0');
const rad=x=>x*Math.PI/180,dist=(a,b)=>{const x=rad(b[0]-a[0]),y=rad(b[1]-a[1]),q=Math.sin(x/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(y/2)**2;return 6371.0088*2*Math.asin(Math.min(1,Math.sqrt(q)))};
const valid=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=MALAYSIA.lat[0]&&lat<=MALAYSIA.lat[1]&&lon>=MALAYSIA.lon[0]&&lon<=MALAYSIA.lon[1];
const controls=Object.freeze(rows.map((r,i)=>{const station=r.code.startsWith('STN')?gis.stations?.find(x=>x.assetId===r.assetId):null,pl=pls.find(x=>x.code===r.code);
 const ref=station?.point?.length===2&&valid(station.point[1],station.point[0])?{latitude:station.point[1],longitude:station.point[0],confidence:'PUBLIC_LOCALITY_REFERENCE_ONLY'}:null;
 return Object.freeze({code:r.code,assetId:r.assetId,CH:r.metres,CHLabel:format(r.metres),type:pl?'PASSING_LOOP':'STATION',
  name:station?.officialName||pl?.name||r.code,section:station?.section||pl?.section||'UNKNOWN',
  publicReference:ref,publicSource:station?.sourceId||null,
  previous:rows[i-1]?.code||null,next:rows[i+1]?.code||null,
  deltaPreviousKm:i>0?Math.round((r.metres-rows[i-1].metres)/10)/100:null,
  datum:r.datum,status:'MODEL_OWNER_CONFIRMATION_PENDING',surveyVerified:false,
  sourceClass:pl?.evidenceClass||'STATION_PUBLIC_REFERENCE',physicalTrackGeometry:null});
}));
const keys=new Set(controls.map(x=>x.code));
function sanitize(raw){
 if(!raw||raw.version!==REV||!Array.isArray(raw.entries))return [];
 const seen=new Set(),output=[];
 for(const e of raw.entries){
  if(!keys.has(e.code)||seen.has(e.code))continue;
  const lat=Number(e.latitude),lon=Number(e.longitude);
  if(!valid(lat,lon)||typeof e.source!=='string'||e.source.trim().length<8)continue;
  seen.add(e.code);output.push({...e,latitude:fixed(lat),longitude:fixed(lon),status:'OWNER_SIMULATION_CANDIDATE_NOT_SURVEYED',surveyVerified:false});
 }
 return output;
}
function load(storage){
 try{return sanitize(JSON.parse(storage.getItem(KEY)||'null'))}catch(_){return []}
}
function create(storage){let entries=load(storage),history=[],persistStatus='NOT_WRITTEN';
 function persist(){
  try{storage.setItem(KEY,JSON.stringify({version:REV,entries}));persistStatus='LOCAL_DEVICE_ONLY';}
  catch(e){persistStatus='STORAGE_FAILED_'+String(e.message||e).slice(0,55)}
  return persistStatus;
 }
 function candidate(code){return entries.find(x=>x.code===code)||null}
 function check(code,latitude,longitude,source,note){
  const c=controls.find(x=>x.code===code),lat=Number(latitude),lon=Number(longitude);
  if(!c)throw Error('UNKNOWN_ASSET');
  if(!valid(lat,lon))throw Error('INVALID_WGS84_MALAYSIA_COORDINATES');
  if(typeof source!=='string'||source.trim().length<8)throw Error('EVIDENCE_SOURCE_REQUIRED_8_CHARACTERS');
  if(typeof note!=='string'||note.trim().length<10)throw Error('OWNER_REVIEW_NOTE_REQUIRED_10_CHARACTERS');
  const p={code,latitude:fixed(lat),longitude:fixed(lon),source:source.trim().slice(0,250),note:note.trim().slice(0,500),confirmedAt:new Date().toISOString(),
   reviewerClass:'OWNER_SIMULATION_MODEL_ONLY',status:'OWNER_SIMULATION_CANDIDATE_NOT_SURVEYED',surveyVerified:false};
  const at=entries.findIndex(x=>x.code===code);if(at<0)entries=[...entries,p];else entries=entries.map(x=>x.code===code?p:x);
  history=[...history,{code,action:at<0?'CANDIDATE_CONFIRMED':'CANDIDATE_REVISED',at:p.confirmedAt}].slice(-500);
  persist();return p;
 }
 function revoke(code){const count=entries.length;entries=entries.filter(e=>e.code!==code);if(entries.length!==count){history.push({code,action:'OWNER_CANDIDATE_REVOKED',at:new Date().toISOString()});persist()}return count!==entries.length}
 function checks(){
  const by=new Map(entries.map(e=>[e.code,e])),issues=[],pairs=[];
  for(let i=1;i<controls.length;i++){
   const a=controls[i-1],b=controls[i],pa=by.get(a.code),pb=by.get(b.code);
   if(pa&&pb){const crow=(b.CH-a.CH)/1000,geo=dist([pa.latitude,pa.longitude],[pb.latitude,pb.longitude]);
    const discrepancy=geo>crow*1.03+0.05;
    pairs.push({from:a.code,to:b.code,referenceCHKm:crow,directAirKm:Math.round(geo*1000)/1000,
     lowerBoundCheck:discrepancy?'REVIEW_INCOMPATIBLE_CH':'LOWER_BOUND_PLAUSIBLE_NOT_SURVEYED'});
    if(discrepancy)issues.push(a.code+' → '+b.code+': AIR_DISTANCE_EXCEEDS_CH');
   }
  }
  const completed=entries.length,missing=controls.filter(x=>!by.has(x.code)).map(x=>x.code);
  return {total:controls.length,stations:controls.filter(x=>x.type==='STATION').length,passingLoops:7,completed,missing,
   adjacentPairsChecked:pairs.length,pairedComparisons:pairs,issues,
   readyForOwnerModelWalkthrough:missing.length===0&&issues.length===0,
   readyForGeographicRailMovement:false,fullRunReleaseStatus:'BLOCKED_NO_COMPLETE_AUTHORIZED_RAIL_GEOMETRY',
   surveyedGeometryVerified:false,origin:'OWNER_SIMULATION_ONLY',persistence:persistStatus};
 }
 function serialize(){return {version:REV,createdFor:'MR_S10_D102_PREFLIGHT_LOCAL_ONLY',savedAt:new Date().toISOString(),
   entries:entries.map(e=>({...e,certifiedSurvey:false})),history:history.slice(),summary:checks(),
   redistributionApproved:false,coordinateDisclosure:'LOCAL_EXPORT_PRIVATE_OWNER_REVIEW'};}
 function snapshot(){return {controls:controls.map(c=>({...c,candidate:candidate(c.code)})),summary:checks(),history:history.slice(),persistence:persistStatus}}
 return Object.freeze({check,revoke,candidate,checks,serialize,snapshot,get controls(){return controls},get key(){return KEY}})
}
const api=Object.freeze({create,controls,format,valid,dist,KEY});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLD102Preflight=api;
})(typeof window!=='undefined'?window:null);
