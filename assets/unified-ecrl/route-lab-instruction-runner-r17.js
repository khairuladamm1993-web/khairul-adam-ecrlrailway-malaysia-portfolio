/* MR-S10 P01 R1.7: owner-reviewed declarative instruction bundle interpreter.
 * NEVER eval/Function/import script/execute shell/fetch remote instructions.
 * All actions remain local CH-model operations, gated by one Owner click each.
 * No georeferenced train movement, no cloud sync, no autonomous LLM backend. */
(function(root){'use strict';
const SCHEMA='mrs10-d102-instruction-bundle-v1',KEY='mrs10-p01-d102-reviewed-instructions-r17';
const ACTIONS=Object.freeze(['FOCUS_ASSET','QUEUE_CH_TARGET','REGISTER_INFRASTRUCTURE','IMPORT_TRACK_LAYOUT','FLAG_GEOMETRY_GAP','ADD_CH_OBSERVATION','SET_CAMERA_VIEW']);
const FIELDS=Object.freeze(['TRACK_CENTERLINE','CH_ANCHOR','LAT_LON','STATION_LAYOUT','PL_LAYOUT','BRIDGE','TUNNEL','QZ_CURVE','TURNOUT','GAUGE','GRADIENT','CURVE_RADIUS','SUPERELEVATION','ELECTRIFICATION','SPEED_REFERENCE','SOURCE_LICENSE','SEGMENT_TOPOLOGY','OTHER']);
const MAX_COMMANDS=30,MAX_BYTES=128*1024;
const rows=root.MRS10ECRLChainage?.records||[];
if(rows.length!==23)throw Error('D102_R17_CORRIDOR_RECORDS_NOT_READY');
const codeSet=new Set(rows.map(x=>x.code));
const isRecord=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const plain=(x)=>typeof x==='string'&&x.trim().length>0;
const string=(x,max=500)=>String(x??'').trim().slice(0,max);
const chLabel=ch=>'CH'+String(Math.floor(ch/1000)).padStart(3,'0')+'+'+String(ch%1000).padStart(3,'0');
function fail(msg){throw new Error(msg)}
function scan(x,depth=0){
 if(depth>12)fail('INSTRUCTION_NESTING_TOO_DEEP');
 if(!x||typeof x!=='object')return;
 for(const k of Object.keys(x)){
  if(['__proto__','prototype','constructor'].includes(k))fail('UNSAFE_INSTRUCTION_FIELD');
  scan(x[k],depth+1);
 }
}
function validate(raw){
 if(!isRecord(raw)||raw.schema!==SCHEMA)fail('INVALID_INSTRUCTION_SCHEMA');
 scan(raw);
 if(!Array.isArray(raw.commands)||!raw.commands.length||raw.commands.length>MAX_COMMANDS)fail('INSTRUCTION_COUNT_1_TO_30_REQUIRED');
 if(!plain(raw.bundleId)||String(raw.bundleId).length>70||!/^[a-zA-Z0-9_-]+$/.test(raw.bundleId))fail('INVALID_BUNDLE_ID');
 if(raw.issuedBy!=='ChatGPT-Adam')fail('EXPECTED_DECLARED_ISSUER_CHATGPT_ADAM');
 if(!plain(raw.purpose)||raw.purpose.length>250)fail('INSTRUCTION_PURPOSE_REQUIRED');
 const found=new Set();
 const commands=raw.commands.map((cmd,i)=>{
  if(!isRecord(cmd)||!ACTIONS.includes(cmd.action))fail('UNSUPPORTED_INSTRUCTION_ACTION_'+i);
  const id=string(cmd.id||'CMD-'+String(i+1).padStart(2,'0'),70);
  if(!/^[a-zA-Z0-9_-]+$/.test(id)||found.has(id))fail('INVALID_OR_DUPLICATE_INSTRUCTION_ID');
  found.add(id);
  const v={id,action:cmd.action,note:string(cmd.note,450),status:'PENDING_OWNER'};
  switch(cmd.action){
   case 'FOCUS_ASSET':{
    if(!codeSet.has(cmd.assetCode))fail('UNKNOWN_ASSET_CODE');
    v.assetCode=cmd.assetCode;break;
   }
   case 'QUEUE_CH_TARGET':{
    const CH=Number(cmd.CH);
    if(!Number.isInteger(CH)||CH<670||CH>524160||!codeSet.has(cmd.assetCode)||rows.find(x=>x.code===cmd.assetCode)?.metres!==CH)
      fail('TARGET_CH_MUST_MATCH_REGISTERED_STN_OR_PL');
    v.assetCode=cmd.assetCode;v.CH=CH;break;
   }
   case 'REGISTER_INFRASTRUCTURE':{
    const item=cmd.infrastructure;
    if(!isRecord(item)||!root.MRS10D102JourneyControl.EVENT_TYPES.includes(item.type))fail('INVALID_INFRASTRUCTURE_TYPE');
    if(!Number.isInteger(item.CH)||item.CH<670||item.CH>524160)fail('INFRA_CH_OUTSIDE_CORRIDOR');
    if(!plain(item.source)||item.source.length<8)fail('INFRA_SOURCE_REQUIRED');
    const lat=item.latitude??null,lon=item.longitude??null;
    if((lat!==null||lon!==null)&&(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<1||lat>7||lon<99||lon>105))fail('INFRA_INVALID_WGS84');
    v.infrastructure={id:string(item.id,80)||undefined,type:item.type,CH:item.CH,name:string(item.name||item.type,100),
      source:string(item.source,280),latitude:lat,longitude:lon,notes:string(item.notes,500)};
    break;
   }
   case 'IMPORT_TRACK_LAYOUT':{
    if(!isRecord(cmd.layout))fail('SOURCE_LAYOUT_OBJECT_REQUIRED');
    const approved=root.MRS10AssetLayoutRegistry.validate(cmd.layout);
    v.layout={code:approved.code,title:approved.title,source:approved.source,tracks:approved.tracks.map(t=>({id:t.id,role:t.role,points:t.points}))};
    break;
   }
   case 'FLAG_GEOMETRY_GAP':{
    if(!codeSet.has(cmd.assetCode)||!FIELDS.includes(cmd.field)||!plain(cmd.reason)||cmd.reason.length<10)fail('INVALID_GEOMETRY_GAP');
    v.assetCode=cmd.assetCode;v.field=cmd.field;v.reason=string(cmd.reason,500);
    v.source=string(cmd.source||'OWNER_GAP_REVIEW_PENDING',250);break;
   }
   case 'ADD_CH_OBSERVATION':{
    const x=cmd.observation;if(!isRecord(x)||!root.MRS10ECRLD102Observations.TYPES.includes(x.type))fail('UNKNOWN_OBSERVATION_TYPE');
    if(!Number.isInteger(x.CH)||x.CH<670||x.CH>524160)fail('OBSERVATION_INVALID_CH');
    if(!plain(x.title)||x.title.length<3||!plain(x.notes)||x.notes.length<8||!plain(x.source)||x.source.length<8)fail('OBSERVATION_SOURCE_AND_NOTES_REQUIRED');
    v.observation={CH:x.CH,type:x.type,title:string(x.title,140),notes:string(x.notes,800),
      source:string(x.source,250),evidenceClass:'SIMULATED'};break;
   }
   case 'SET_CAMERA_VIEW':{
    if(!['2d','3d'].includes(cmd.view))fail('UNSUPPORTED_CAMERA_VIEW');v.view=cmd.view;break;
   }
  }
  return v;
 });
 return {schema:SCHEMA,bundleId:raw.bundleId,issuedBy:'ChatGPT-Adam',purpose:string(raw.purpose,250),
  commands,reviewStatus:'WAITING_EXPLICIT_OWNER_APPROVAL',sourceClass:'DECLARATIVE_USER_SUPPLIED_UNTRUSTED',
  physicalGeometryApproved:false,automaticPublish:false};
}
function create(storage,deps){
 let saved={version:1,active:null,log:[],gaps:[]},status='NOT_SAVED';
 try{
  const raw=JSON.parse(storage.getItem(KEY)||'null');
  if(raw?.version===1&&Array.isArray(raw.log)&&Array.isArray(raw.gaps)){
   saved.log=raw.log.slice(-500);saved.gaps=raw.gaps.slice(-250);
   if(raw.active){
    const cleaned=validate({...raw.active,commands:raw.active.commands?.map(c=>({...c,status:undefined}))});
    cleaned.commands.forEach((c,i)=>{const prior=raw.active.commands[i];c.status=['PENDING_OWNER','WAITING_OWNER_POPUP','COMPLETED','FAILED'].includes(prior.status)?prior.status:'PENDING_OWNER'});
    cleaned.reviewStatus=raw.active.reviewStatus==='OWNER_APPROVED'?'OWNER_APPROVED':'WAITING_EXPLICIT_OWNER_APPROVAL';
    saved.active=cleaned;
   }
  }
 }catch(_){}
 const persist=()=>{try{storage.setItem(KEY,JSON.stringify(saved));status='SAVED_LOCAL_BROWSER'}catch(e){status='SAVE_FAILED_'+String(e.message||e).slice(0,90)}};
 function audit(type,details={}){saved.log.push({at:new Date().toISOString(),type,...details});if(saved.log.length>500)saved.log=saved.log.slice(-500);persist()}
 function load(raw){const accepted=validate(raw);if(saved.active?.commands.some(x=>x.status==='WAITING_OWNER_POPUP'))fail('CANNOT_REPLACE_BUNDLE_WHILE_POPUP_PENDING');
  saved.active=accepted;audit('BUNDLE_LOADED_UNTRUSTED',{bundleId:accepted.bundleId,commands:accepted.commands.length});return snapshot();}
 function approve(){if(!saved.active)fail('NO_BUNDLE_LOADED');saved.active.reviewStatus='OWNER_APPROVED';audit('OWNER_APPROVED_BUNDLE',{bundleId:saved.active.bundleId});}
 function sync(){
  const active=saved.active;if(!active)return;
  const pending=active.commands.find(x=>x.status==='WAITING_OWNER_POPUP');if(!pending)return;
  const journey=deps.getJourney(),session=deps.getSession();
  if(!journey?.pending()&&session?.currentCH===pending.CH){
   pending.status='COMPLETED';audit('OWNER_CH_POPUP_CONFIRMED',{commandId:pending.id,CH:pending.CH});
  }
 }
 function next(){
  sync();if(!saved.active)return null;
  return saved.active.commands.find(x=>x.status==='PENDING_OWNER'||x.status==='WAITING_OWNER_POPUP')||null;
 }
 function execute(id){
  const a=saved.active;if(!a||a.reviewStatus!=='OWNER_APPROVED')fail('OWNER_APPROVAL_REQUIRED');
  const cmd=a.commands.find(x=>x.id===id);if(!cmd||cmd.status!=='PENDING_OWNER')fail('COMMAND_NOT_PENDING');
  if(a.commands.some(x=>x.status==='WAITING_OWNER_POPUP'))fail('COMPLETE_D102_OWNER_POPUP_FIRST');
  const session=deps.getSession();if(!session)fail('NO_D102_SESSION');
  let result;
  try{
   switch(cmd.action){
    case 'FOCUS_ASSET':
     deps.showAsset(cmd.assetCode);result='FOCUS_ASSET_ONLY';break;
    case 'QUEUE_CH_TARGET':
     deps.queueCH(cmd.CH);result='WAIT_OWNER_CH_POPUPS';cmd.status='WAITING_OWNER_POPUP';break;
    case 'REGISTER_INFRASTRUCTURE':
     result=deps.registerInfrastructure(cmd.infrastructure)?.id||'REGISTERED_UNVERIFIED';break;
    case 'IMPORT_TRACK_LAYOUT':
     result=deps.importLayout(cmd.layout)?.[0]?.code||'IMPORTED_UNVERIFIED';break;
    case 'FLAG_GEOMETRY_GAP':
     if(!saved.gaps.some(g=>g.bundleId===a.bundleId&&g.commandId===cmd.id))
      saved.gaps.push({bundleId:a.bundleId,commandId:cmd.id,assetCode:cmd.assetCode,
       field:cmd.field,reason:cmd.reason,source:cmd.source,status:'OPEN_NEEDS_EVIDENCE',
       reviewedAt:new Date().toISOString(),surveyVerified:false});
     result='GEOMETRY_GAP_RECORDED_NOT_VERIFIED';break;
    case 'ADD_CH_OBSERVATION':
     if(session.currentCH!==cmd.observation.CH)fail('OBSERVATION_CH_MUST_MATCH_CURRENT_D102');
     result=deps.addObservation(cmd.observation,session.currentCH)?.id||'OBSERVATION_RECORDED';break;
    case 'SET_CAMERA_VIEW':
     deps.setCameraView(cmd.view);result='CAMERA_DISPLAY_ONLY';break;
   }
   if(cmd.status!=='WAITING_OWNER_POPUP')cmd.status='COMPLETED';
   audit('OWNER_EXECUTED_DECLARATIVE_COMMAND',{bundleId:a.bundleId,commandId:cmd.id,action:cmd.action,
    result,physicalGeometryVerified:false});
   return {action:cmd.action,status:cmd.status,result};
  }catch(e){
   audit('COMMAND_REJECTED',{commandId:cmd.id,action:cmd.action,error:String(e?.message||e).slice(0,180)});
   throw e;
  }
 }
 function dismiss(id){const c=saved.active?.commands.find(x=>x.id===id);if(!c||c.status!=='PENDING_OWNER')fail('NOT_PENDING');c.status='SKIPPED_OWNER';audit('OWNER_SKIPPED_COMMAND',{commandId:id})}
 function snapshot(){syncSafe();return {
  active:saved.active?JSON.parse(JSON.stringify(saved.active)):null,
  logCount:saved.log.length,gapCount:saved.gaps.length,gaps:saved.gaps.map(x=>({...x})),
  storage:status,engine:'DETERMINISTIC_LOCAL_ALLOWED_ACTIONS_ONLY',LLMBackend:false,remoteCodeExecution:false,
  publicPublish:false,liveTrainTelemetry:false,fullCorridorVerified:false,sessionContinues:true
 }}
 function syncSafe(){/* no side effects: status is synchronized explicitly by the journey UI */ }
 function exportData(){return {schema:'mrs10-d102-instruction-audit-v1',exportedAt:new Date().toISOString(),...snapshot(),audit:saved.log.map(x=>({...x}))}}
 return Object.freeze({load,approve,next,sync,execute,dismiss,snapshot,exportData});
}
const api=Object.freeze({SCHEMA,ACTIONS,FIELDS,MAX_BYTES,validate,create,KEY});
root.MRS10D102InstructionRunner=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
