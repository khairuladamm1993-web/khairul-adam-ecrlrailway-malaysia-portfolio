/* MR-S10 D102 R1.6: deterministic, resumable CH-only event authority.
   Never generates train GPS or asserts geometry from owner confirmations. */
(function(root){'use strict';
const KEY='mrs10-p01-d102-journey-control-r16',VERSION=1;
const EVENT_TYPES=['BRIDGE','TUNNEL','QZ_CURVE','CURVE','TURNOUT','SIGNAL','CROSSING','OTHER'];
const validPoint=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=1&&lat<=7&&lon>=99&&lon<=105;
const chLabel=ch=>'CH'+String(Math.floor(ch/1000)).padStart(3,'0')+'+'+String(ch%1000).padStart(3,'0');
function create(storage,rows){
 if(!Array.isArray(rows)||rows.length!==23)throw Error('EXPECTED_23_CH_CONTROL_POINTS');
 const byCode=new Map(rows.map(x=>[x.code,x]));
 let state;
 try{const p=JSON.parse(storage.getItem(KEY)||'null');
   if(p?.version===VERSION&&Array.isArray(p.ledger)&&Array.isArray(p.infrastructure)&&p.ledger.length<20001)
      state=p;
 }catch(_){}
 if(!state)state={version:VERSION,journeyId:'D102-LOCAL-CH-JOURNEY-R16',ledger:[],infrastructure:[],
 pending:null,confirmedDepartures:[],confirmedArrivals:[],confirmedEvents:[],resumeTarget:null,historyMigratedFromR15:true};
 let saved='RESTORED_OR_INITIAL';
 const save=()=>{try{storage.setItem(KEY,JSON.stringify(state));saved='LOCAL_BROWSER_SAVED'}catch(e){saved='SAVE_FAILED_'+String(e.message||e).slice(0,90)}return saved};
 const rowAt=ch=>rows.find(x=>x.metres===ch);
 function record(type,payload={}){
  const e={seq:state.ledger.length+1,type,time:new Date().toISOString(),...payload};
  state.ledger.push(e);if(state.ledger.length>20000)state.ledger=state.ledger.slice(-20000);
  save();return e;
 }
 function infrastructure(){
  return state.infrastructure.map(x=>({...x}));
 }
 function registerInfrastructure(item){
  const type=String(item.type||'').trim().toUpperCase(),ch=Number(item.CH),source=String(item.source||'').trim();
  if(!EVENT_TYPES.includes(type))throw Error('UNKNOWN_INFRASTRUCTURE_TYPE');
  if(!Number.isInteger(ch)||ch<rows[0].metres||ch>rows.at(-1).metres)throw Error('INVALID_INFRASTRUCTURE_CH');
  if(source.length<8)throw Error('INFRASTRUCTURE_SOURCE_REQUIRED');
  const lat=item.latitude==null||item.latitude===''?null:Number(item.latitude),lon=item.longitude==null||item.longitude===''?null:Number(item.longitude);
  if((lat!==null||lon!==null)&&!validPoint(lat,lon))throw Error('INVALID_SOURCE_COORDINATE');
  const name=String(item.name||type).trim().slice(0,140);
  const id=String(item.id||type+'-'+ch+'-'+state.infrastructure.length).replace(/[^A-Z0-9_:-]/gi,'').slice(0,100);
  if(state.infrastructure.some(x=>x.id===id))throw Error('DUPLICATE_INFRASTRUCTURE_ID');
  const data={id,type,CH:ch,name,source:source.slice(0,280),latitude:lat,longitude:lon,
    sourceClass:'OWNER_IMPORTED_UNVERIFIED',surveyVerified:false,
    geometryVerified:false,notes:String(item.notes||'').slice(0,1000)};
  state.infrastructure.push(data);record('INFRASTRUCTURE_REFERENCE_IMPORTED',{id,type,CH:ch,source:source.slice(0,160)});
  save();return {...data};
 }
 function nextStop(current,target){
  const dir=Math.sign(target-current);if(!dir)return null;
  const stops=rows.filter(x=>dir*(x.metres-current)>0&&dir*(target-x.metres)>=0).map(x=>({
    id:x.code,code:x.code,CH:x.metres,type:x.code.startsWith('PL')?'PL':'STATION',name:x.code}));
  for(const ev of state.infrastructure){
    if(dir*(ev.CH-current)>0&&dir*(target-ev.CH)>=0&&!state.confirmedEvents.includes(ev.id))
      stops.push({...ev,code:null,type:ev.type});
  }
  stops.sort((a,b)=>dir*(a.CH-b.CH));
  return stops[0]||{CH:target,id:'CH-'+target,code:null,type:'MANUAL_CH',name:'CH model'};
 }
 function pending(){return state.pending?{...state.pending}:null}
 function request(session,target){
  if(state.pending)return pending();
  const current=session.currentCH,rangeA=byCode.get(session.origin),rangeB=byCode.get(session.destination);
  if(!rangeA||!rangeB||!Number.isInteger(target))throw Error('INVALID_SIMULATION_ROUTE');
  const dir=Math.sign(rangeB.metres-rangeA.metres);
  if(dir*(target-current)<=0||dir*(rangeB.metres-target)<0)throw Error('INVALID_FORWARD_TARGET');
  const currentControl=rowAt(current);
  state.resumeTarget=target;
  if(currentControl&&!state.confirmedDepartures.includes(current)){
    state.pending={phase:'DEPARTURE',CH:current,code:currentControl.code,type:currentControl.code.startsWith('PL')?'PL':'STATION',targetCH:target};
  }else{
    const stop=nextStop(current,target);
    state.pending={phase:'NEXT',CH:stop.CH,code:stop.code||null,id:stop.id,type:stop.type,
     targetCH:target,source:stop.source||null,latitude:stop.latitude??null,longitude:stop.longitude??null,name:stop.name};
  }
  save();return pending();
 }
 function confirm(session,observed={}){
  const p=state.pending;if(!p)throw Error('NO_PENDING_CONFIRMATION');
  const actualCH=observed.CH===''||observed.CH==null?p.CH:Number(observed.CH);
  if(!Number.isInteger(actualCH)||actualCH<0||actualCH>600000)throw Error('INVALID_REVIEW_CH');
  const lat=observed.latitude==null||observed.latitude===''?null:Number(observed.latitude);
  const lon=observed.longitude==null||observed.longitude===''?null:Number(observed.longitude);
  if((lat!==null||lon!==null)&&!validPoint(lat,lon))throw Error('INVALID_REVIEW_COORDINATE');
  const source=String(observed.source||'').trim().slice(0,240);
  const audit={phase:p.phase,code:p.code||null,id:p.id||null,CH:p.CH,observedCH:actualCH,
    residualM:actualCH-p.CH,latitude:lat,longitude:lon,source:source||'NOT_PROVIDED',
    evidenceStatus:'OWNER_SIMULATION_REFERENCE_NOT_SURVEYED',verifiedPhysicalPosition:false,
    note:String(observed.note||'').slice(0,500)};
  record('OWNER_POPUP_ACK',audit);
  if(p.phase==='DEPARTURE'){
    if(!state.confirmedDepartures.includes(p.CH))state.confirmedDepartures.push(p.CH);
    const stop=nextStop(session.currentCH,p.targetCH);
    state.pending={phase:'NEXT',CH:stop.CH,code:stop.code||null,id:stop.id,type:stop.type,
      targetCH:p.targetCH,source:stop.source||null,latitude:stop.latitude??null,longitude:stop.longitude??null,name:stop.name};
    save();return {action:'SHOW_NEXT',pending:pending()};
  }
  if(p.phase==='NEXT'){
    state.pending={phase:p.type==='STATION'||p.type==='PL'?'ARRIVAL':p.type==='MANUAL_CH'?'MANUAL_ARRIVAL':'INFRASTRUCTURE',
     CH:p.CH,code:p.code,id:p.id,type:p.type,name:p.name,targetCH:p.targetCH,
     source:p.source,latitude:p.latitude,longitude:p.longitude};
    save();return {action:'ADVANCE_CH_ONLY',moveTo:p.CH,pending:pending()};
  }
  if(['ARRIVAL','MANUAL_ARRIVAL','INFRASTRUCTURE'].includes(p.phase)){
    if(p.code&&!state.confirmedArrivals.includes(p.code))state.confirmedArrivals.push(p.code);
    if(p.phase==='INFRASTRUCTURE'&&p.id&&!state.confirmedEvents.includes(p.id))state.confirmedEvents.push(p.id);
    const target=state.resumeTarget;state.pending=null;
    if(p.phase==='INFRASTRUCTURE'&&target!=null&&session.currentCH!==target){
      const stop=nextStop(session.currentCH,target);
      state.pending={phase:'NEXT',CH:stop.CH,code:stop.code||null,id:stop.id,type:stop.type,name:stop.name,
       targetCH:target,latitude:stop.latitude??null,longitude:stop.longitude??null,source:stop.source||null};
      save();
      return {action:'RESUME_NEXT_CH_CHECKPOINT',pending:pending()};
    }
    if(rowAt(session.currentCH)&&session.currentCH!==byCode.get(session.destination)?.metres){
      state.confirmedDepartures=state.confirmedDepartures.filter(x=>x!==session.currentCH);
    }
    state.resumeTarget=null;save();return {action:'CONFIRMED_STOP',pending:null};
  }
  throw Error('UNKNOWN_JOURNEY_PHASE');
 }
 function syncSession(session){
  const last=state.pending;if(last&&(last.phase==='ARRIVAL'||last.phase==='INFRASTRUCTURE'||last.phase==='MANUAL_ARRIVAL')&&last.CH!==session.currentCH){
    state.pending=null;state.resumeTarget=null;record('PENDING_INVALIDATED_BY_EXTERNAL_CH_CHANGE',{expectedCH:last.CH,actualCH:session.currentCH});
  }
  return pending();
 }
 function clearPending(){
  if(state.pending){record('PENDING_CANCELLED',{phase:state.pending.phase,CH:state.pending.CH});state.pending=null;state.resumeTarget=null;save()}
 }
 function snapshot(){return {
  pending:pending(),ledgerCount:state.ledger.length,ledger:state.ledger.slice(),
  infrastructure:infrastructure(),confirmedDepartures:state.confirmedDepartures.slice(),confirmedArrivals:state.confirmedArrivals.slice(),
  confirmedEvents:state.confirmedEvents.slice(),resumeTarget:state.resumeTarget,storage:saved,
  modelMode:'MANUAL_CH_ONLY',liveGPS:false,asBuilt:false,cloudSynced:false,journeyId:state.journeyId
 }}
 function exportData(){return {schema:'mrs10-d102-journey-ledger-r16',exportedAt:new Date().toISOString(),...snapshot(),publicDistribution:false}}
 return Object.freeze({request,confirm,pending,syncSession,registerInfrastructure,infrastructure,clearPending,snapshot,exportData});
}
const api=Object.freeze({create,EVENT_TYPES,KEY,chLabel});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10D102JourneyControl=api;
})(typeof window!=='undefined'?window:null);
