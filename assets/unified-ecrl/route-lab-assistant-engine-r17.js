/* Deterministic assignment authority; host actions are a fixed interface, never file-supplied code. */
(function(root){'use strict';
const Schema=typeof module==='object'?require('./route-lab-assistant-schema-r17.js'):root.MRS10AssistantSchema;
const clone=x=>JSON.parse(JSON.stringify(x));
function create({repo,host,rows,ownerToken='LOCAL_OWNER_TAB',onChange=()=>{}}){
 let state=null,definition=null,queue=Promise.resolve();
 const run=fn=>{const task=queue.then(fn);queue=task.catch(()=>{});return task};
 const currentCH=()=>host.session().currentCH;
 async function transition(type,patch={},details={}){const next={...state,...patch,updatedAt:new Date().toISOString(),audit:[...state.audit,{seq:state.audit.length+1,type,time:new Date().toISOString(),...details}]};state=await repo.save(next,state.version);onChange(clone(state));return state}
 const command=()=>definition.commands[state.cursor];
 async function complete(outcome){const c=command();await transition('COMMAND_COMPLETED',{receipts:{...state.receipts,[c.id]:{status:'COMPLETED',outcome,at:new Date().toISOString()}},cursor:state.cursor+1,pending:null,status:'RUNNING',reason:null},{commandId:c.id,outcome})}
 function phase(){const j=host.journey();return j.pending?{phase:j.pending.phase,CH:j.pending.CH,id:j.pending.id||j.pending.code}:null}
 async function missing(){const result=[];for(const r of definition.requirements)if(r.required&&!await host.hasImport(r.kind,r.code))result.push('MISSING_'+r.kind+'_'+r.code);for(const c of definition.commands){if(c.type==='CONNECTOR_TASK')result.push('RUNTIME_CONNECTOR_NOT_CONFIGURED_'+c.params.connector);if(c.type==='REQUIRE_IMPORT'&&c.params.required&&!await host.hasImport(c.params.kind,c.params.code))result.push('MISSING_'+c.params.kind+'_'+c.params.code)}return [...new Set(result)]}
 function routeCheck(){const s=host.session(),a=rows.find(r=>r.code===s.origin),b=rows.find(r=>r.code===s.destination);if(!a||!b||!['D102','D102-SIM'].includes(s.trainId))throw Error('D102_SESSION_NOT_READY');for(const c of definition.commands.filter(c=>c.type==='MOVE_CH'))if(c.params.targetCH<Math.min(a.metres,b.metres)||c.params.targetCH>Math.max(a.metres,b.metres))throw Error('ASSIGNMENT_OUTSIDE_CURRENT_JOURNEY');}
 async function drive(){
  while(state.status==='RUNNING'){
   const c=command();if(!c){await transition('ASSIGNMENT_COMPLETED',{status:'COMPLETED',pending:null,completedAt:new Date().toISOString()},{meaning:'COMMAND_SEQUENCE_ONLY_NOT_PHYSICAL_GEOMETRY_VERIFIED'});await repo.release(state.key,ownerToken);return}
   if(state.receipts[c.id]?.status==='COMPLETED'){await transition('RECEIPT_RECOVERED',{cursor:state.cursor+1});continue}
   const p=c.params;
   if(c.type==='REVIEW_CHECKPOINT'){
    if(currentCH()!==p.CH){await transition('CURRENT_CH_MISMATCH',{status:'BLOCKED',reason:'CURRENT_CH_NOT_AT_REVIEW_CHECKPOINT',pending:{kind:'REVIEW',commandId:c.id,expectedCH:p.CH,code:p.code}});return}
    await transition('OWNER_REVIEW_REQUIRED',{status:'PAUSED',reason:'OWNER_CHECKPOINT_CONFIRMATION',pending:{kind:'REVIEW',commandId:c.id,expectedCH:p.CH,code:p.code}});return;
   }
   if(c.type==='REVIEW_GEOMETRY'){await transition('GEOMETRY_REVIEW_REQUIRED',{status:'PAUSED',reason:'OWNER_GEOMETRY_REVIEW',pending:{kind:'GEOMETRY',commandId:c.id,expectedCH:currentCH(),scopeCodes:p.scopeCodes}});return}
   if(c.type==='REQUIRE_IMPORT'){
    if(await host.hasImport(p.kind,p.code)){await complete('IMPORT_PRESENT_UNVERIFIED');continue}
    await transition('SOURCE_DATA_GAP',{status:p.required?'BLOCKED':'PAUSED',reason:'MISSING_'+p.kind,pending:{kind:'IMPORT',commandId:c.id,expectedCH:currentCH(),code:p.code,required:p.required}});return;
   }
   if(c.type==='REGISTER_INFRASTRUCTURE'){await transition('INFRASTRUCTURE_IMPORT_APPROVAL',{status:'PAUSED',reason:'OWNER_IMPORT_APPROVAL',pending:{kind:'INFRASTRUCTURE',commandId:c.id,expectedCH:p.CH,code:null}});return}
   if(c.type==='CONNECTOR_TASK'){await transition('CONNECTOR_BLOCKED',{status:'BLOCKED',reason:'RUNTIME_CONNECTOR_NOT_CONFIGURED_'+p.connector,pending:null});return}
   if(c.type==='OPEN_LAYOUT'){try{host.openLayout(p.code)}catch(e){await transition('HOST_ACTION_FAILED',{status:'FAILED',reason:String(e.message||e)});return}await complete('LOCAL_LAYOUT_VIEW_ONLY');continue}
   if(c.type==='EXPORT_REPORT'){await complete('PRIVATE_REPORT_PREPARED_'+p.report);continue}
   if(c.type==='MOVE_CH'){
    const s=host.session();if(currentCH()===p.targetCH&&!phase()){await complete('ALREADY_AT_CONFIRMED_CH_NO_DUPLICATE_MOVE');continue}
    const dir=Math.sign(rows.find(r=>r.code===s.destination).metres-rows.find(r=>r.code===s.origin).metres);if(dir*(p.targetCH-currentCH())<=0){await transition('MOVE_BLOCKED',{status:'BLOCKED',reason:'TARGET_NOT_FORWARD_IN_CURRENT_JOURNEY'});return}
    if(phase()){await transition('EXISTING_JOURNEY_CONFIRMATION',{status:'BLOCKED',reason:'FINISH_EXISTING_R16_CONFIRMATION_FIRST'});return}
    await transition('MOVEMENT_INTENT_SAVED',{status:'PAUSED',reason:'R16_CONFIRMATION',receipts:{...state.receipts,[c.id]:{status:'INTENT',fromCH:currentCH(),targetCH:p.targetCH}},pending:{kind:'JOURNEY',commandId:c.id,fromCH:currentCH(),targetCH:p.targetCH,expectedCH:currentCH(),hostPhase:null}});
    try{host.requestMove(p.targetCH)}catch(e){await transition('HOST_MOVE_REJECTED',{status:'BLOCKED',reason:String(e.message||e)});return}
    await observeInternal();return;
   }
  }
 }
 async function observeInternal(){
  if(!state||state.pending?.kind!=='JOURNEY'||!['RUNNING','PAUSED'].includes(state.status)||['OWNER_HOLD','RECOVERY_CONFIRM_REQUIRED','INTERMEDIATE_CHECKPOINT'].includes(state.reason))return;
  const p=state.pending,at=currentCH(),low=Math.min(p.fromCH,p.targetCH),high=Math.max(p.fromCH,p.targetCH),j=phase();
  if(at<low||at>high){await transition('SESSION_DIVERGED',{status:'BLOCKED',reason:'CURRENT_CH_OUTSIDE_ASSIGNMENT_MOVE'},{actualCH:at});return}
  if(j){const fingerprint=j.phase+'|'+j.CH+'|'+at;if(p.hostPhase!==fingerprint)await transition('JOURNEY_OWNER_GATE',{status:'PAUSED',reason:'R16_CONFIRMATION',pending:{...p,hostPhase:fingerprint,expectedCH:j.CH}},{phase:j.phase,CH:j.CH,actualCH:at});return}
  if(at===p.targetCH){await complete('R16_TARGET_CONFIRMED_CH_ONLY');await drive();return}
  await transition('INTERMEDIATE_STOP',{status:'PAUSED',reason:'INTERMEDIATE_CHECKPOINT',pending:{...p,expectedCH:at}},{CH:at});
 }
 async function openInternal(key){const doc=await repo.get('definitions',key);if(!doc)throw Error('ASSIGNMENT_NOT_FOUND');definition=Schema.validate(doc.document,rows);state=await repo.get('executions',key);if(!state)throw Error('EXECUTION_NOT_FOUND');if(['RUNNING','PAUSED'].includes(state.status))await transition('RECOVERY_HOLD',{status:'PAUSED',reason:'RECOVERY_CONFIRM_REQUIRED'});onChange(clone(state));return clone(state)}
 const api={
  load:raw=>run(async()=>{const doc=Schema.validate(raw,rows),saved=await repo.definition(doc);await repo.put('settings',{key:'selected-assignment',assignmentKey:saved.key});const old=await repo.get('executions',saved.key);if(old)return openInternal(saved.key);definition=doc;state={key:saved.key,schemaVersion:'1.0.0',version:0,status:'QUEUED',reason:null,cursor:0,pending:null,receipts:{},audit:[],createdAt:new Date().toISOString(),scope:'PRIVATE_OWNER',publicPublished:false,cloudSynced:false};await transition('ASSIGNMENT_QUEUED');return clone(state)}),
  open:key=>run(()=>openInternal(key)),
  validate:()=>run(async()=>{if(!state)throw Error('NO_ASSIGNMENT');if(!['QUEUED','BLOCKED','READY'].includes(state.status)||state.cursor!==0)throw Error('USE_RESUME_FOR_EXISTING_EXECUTION');await transition('VALIDATION_STARTED',{status:'VALIDATING'});const gaps=await missing();try{routeCheck()}catch(e){gaps.push(e.message)}if(currentCH()!==definition.currentCheckpoint.CH)gaps.push('CURRENT_CHECKPOINT_MISMATCH_NO_AUTOMATIC_RESET');await transition('VALIDATION_FINISHED',{status:gaps.length?'BLOCKED':'READY',reason:gaps.join(' · ')||null},{gaps});return clone(state)}),
  start:owner=>run(async()=>{if(state?.status!=='READY')throw Error('ASSIGNMENT_NOT_READY');if(owner!==true)throw Error('OWNER_CONFIRMATION_REQUIRED');if(currentCH()!==definition.currentCheckpoint.CH)throw Error('CURRENT_CHECKPOINT_CHANGED_REVALIDATE');routeCheck();await repo.claim(state.key,ownerToken);await transition('OWNER_START_CONFIRMED',{status:'RUNNING',startedAt:new Date().toISOString()},{CH:currentCH(),authorization:'LOCAL_OWNER_UI_NOT_AUTHENTICATION'});await drive();return clone(state)}),
  pause:()=>run(async()=>{if(!state||!['RUNNING','PAUSED'].includes(state.status))throw Error('NOT_RUNNING');await transition('OWNER_HOLD',{status:'PAUSED',reason:'OWNER_HOLD'});return clone(state)}),
  resume:owner=>run(async()=>{if(owner!==true)throw Error('OWNER_CONFIRMATION_REQUIRED');if(!state||!['PAUSED','BLOCKED'].includes(state.status))throw Error('NOT_PAUSED');await repo.claim(state.key,ownerToken);const gaps=await missing();if(gaps.length){await transition('RESUME_BLOCKED',{status:'BLOCKED',reason:gaps.join(' · ')});return clone(state)}
   if(state.pending?.kind==='JOURNEY'){const p=state.pending;if(currentCH()<Math.min(p.fromCH,p.targetCH)||currentCH()>Math.max(p.fromCH,p.targetCH))throw Error('SESSION_CHANGED_OUTSIDE_PLAN');await transition('OWNER_RESUME_CONFIRMED',{status:'PAUSED',reason:'R16_CONFIRMATION'});if(phase())host.showJourneyPending();else if(currentCH()!==p.targetCH)host.requestMove(p.targetCH);await observeInternal()}
   else if(state.pending){await transition('OWNER_RESUME_REVIEW',{status:'PAUSED',reason:state.pending.kind==='GEOMETRY'?'OWNER_GEOMETRY_REVIEW':'OWNER_CHECKPOINT_CONFIRMATION'})}
   else{await transition('OWNER_RESUME_CONFIRMED',{status:'RUNNING',reason:null});await drive()}return clone(state)}),
  confirm:observed=>run(async()=>{if(state?.status!=='PAUSED'||!state.pending||state.pending.kind==='JOURNEY'||['OWNER_HOLD','RECOVERY_CONFIRM_REQUIRED'].includes(state.reason))throw Error('NO_ASSIGNMENT_OWNER_REVIEW');if(observed?.ownerConfirmed!==true)throw Error('OWNER_CONFIRMATION_REQUIRED');await repo.claim(state.key,ownerToken);const p=state.pending,c=command(),actual=observed.CH==null||observed.CH===''?p.expectedCH:Number(observed.CH),lat=observed.latitude==null||observed.latitude===''?null:Number(observed.latitude),lon=observed.longitude==null||observed.longitude===''?null:Number(observed.longitude);
   if(!Number.isInteger(actual)||actual<0||actual>600000)throw Error('INVALID_OBSERVED_CH');if((lat!=null||lon!=null)&&!(Number.isFinite(lat)&&lat>=1&&lat<=7&&Number.isFinite(lon)&&lon>=99&&lon<=105))throw Error('INVALID_OBSERVED_COORDINATE');if(p.kind==='REVIEW'&&currentCH()!==p.expectedCH)throw Error('CURRENT_CH_CHANGED_NO_MANIFEST_REWRITE');
   const observation={commandId:c.id,code:p.code||null,expectedCH:p.expectedCH,observedCH:actual,residualM:actual-p.expectedCH,latitude:lat,longitude:lon,source:String(observed.source||'UNKNOWN').slice(0,500),note:String(observed.note||'').slice(0,2000),officialSurveyVerified:false,publicApproved:false};
   if(p.kind==='IMPORT'&&p.required&&!await host.hasImport(c.params.kind,c.params.code))throw Error('REQUIRED_IMPORT_STILL_MISSING');
   await transition('OWNER_OBSERVATION_RECORDED',{},observation);
   if(p.kind==='INFRASTRUCTURE'){const params=c.params,source=definition.source.references.find(s=>s.id===params.sourceId),existing=host.journey().infrastructure.find(x=>x.id===params.eventId);if(existing&&existing.CH!==params.CH)throw Error('EXISTING_EVENT_ID_CONFLICT');if(!existing)try{host.registerInfrastructure({id:params.eventId,type:params.type,CH:params.CH,name:params.name,source:source.url||source.note,latitude:params.latitude??null,longitude:params.longitude??null});}catch(e){await transition('INFRASTRUCTURE_ACTION_FAILED',{status:'FAILED',reason:String(e.message||e)});return clone(state)}}
   if(p.kind==='GEOMETRY'&&observed.approveModel===true)await host.reviewGeometry(observation);
   await complete('OWNER_CONFIRMED_MODEL_ONLY');await drive();return clone(state)}),
  observe:()=>run(()=>observeInternal()),
  snapshot:()=>state?clone(state):null,definition:()=>definition?clone(definition):null,
  report:()=>({schema:'mrs10-assignment-execution-report-r17',exportedAt:new Date().toISOString(),definition:definition?clone(definition):null,execution:state?clone(state):null,journey:host.journey(),currentCH:currentCH(),scope:'PRIVATE_OWNER',cloudSynced:false,publicPublished:false,geometrySurveyVerified:false,acceptanceCriteriaStatus:'OWNER_REVIEW_REQUIRED',geometryQA:host.geometryQA()})
 };
 return Object.freeze(api);
}
const api={create};if(typeof module==='object')module.exports=api;if(root)root.MRS10AssistantEngine=api;
})(typeof window!=='undefined'?window:null);
