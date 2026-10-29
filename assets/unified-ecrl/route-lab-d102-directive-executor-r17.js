/* MR-S10 D102 R1.7: reviewable declarative instruction package from ChatGPT Adam.
   This is NOT a sandbox for JavaScript, SQL, shell, arbitrary tool calls or web
   automations. No remote assistant or backend is implied. Explicit Owner approval
   gates each individual allowlisted operation. */
(function(root){'use strict';
const FORMAT='mrs10-d102-owner-directives-v1',KEY='mrs10-p01-d102-directives-r17';
const MAX=30,MAX_BYTES=500000;
const OPS=Object.freeze([
 'SELECT_ASSET','QUEUE_CHECKPOINT','IMPORT_LAYOUT_DRAFT',
 'REGISTER_INFRA_CANDIDATE','RECORD_GEOMETRY_GAP','ADD_SOURCE_REFERENCE',
 'ASSISTANT_ASSIGNMENT'
]);
const VALID_ASSETS=new Set(root.MRS10ECRLChainage?.records?.map(r=>r.code)||[]);
const ROWS=root.MRS10ECRLChainage?.records||[];
const KNOWN_TYPES=new Set(['BRIDGE','TUNNEL','QZ_CURVE','CURVE','TURNOUT','SIGNAL','CROSSING','OTHER']);
const safeString=(v,max=450)=>String(v??'').trim().slice(0,max);
function ensure(cond,msg){if(!cond)throw Error(msg)}
function isObj(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function validateCmd(c,i){
 ensure(isObj(c),'COMMAND_'+i+'_INVALID_OBJECT');
 const op=safeString(c.op,70).toUpperCase(),id=safeString(c.id,90);
 ensure(OPS.includes(op),'COMMAND_'+i+'_OP_NOT_ALLOWLISTED');
 ensure(/^[A-Za-z0-9_:-]{3,90}$/.test(id),'COMMAND_'+i+'_ID_REQUIRED');
 const x=c.payload;
 ensure(isObj(x),'COMMAND_'+i+'_PAYLOAD_REQUIRED');
 const asset=safeString(x.assetCode||x.code,18).toUpperCase();
 const codeRequired=!['ASSISTANT_ASSIGNMENT'].includes(op);
 if(codeRequired)ensure(VALID_ASSETS.has(asset),'COMMAND_'+i+'_INVALID_ASSET_CODE');
 const source=safeString(x.source,280);
 if(!['SELECT_ASSET','QUEUE_CHECKPOINT'].includes(op))ensure(source.length>=8,'COMMAND_'+i+'_EVIDENCE_SOURCE_REQUIRED');
 let ch=null;
 if(x.CH!==undefined&&x.CH!==null&&x.CH!==''){
  ch=Number(x.CH);
  ensure(Number.isInteger(ch)&&ch>=670&&ch<=524160,'COMMAND_'+i+'_CH_RANGE_ERROR');
 }
 if(op==='QUEUE_CHECKPOINT'){
   ensure(x.CH===undefined||ch===ROWS.find(r=>r.code===asset)?.metres,
     'COMMAND_'+i+'_CH_MISMATCH_ACCEPTED_MANIFEST');
 }
 if(op==='IMPORT_LAYOUT_DRAFT'){
   ensure(Array.isArray(x.tracks)&&x.tracks.length>0&&x.tracks.length<=24,'COMMAND_'+i+'_LAYOUT_TRACKS_REQUIRED');
   ensure(x.tracks.every(t=>Array.isArray(t.points)&&t.points.length>=2&&t.points.length<=80&&
    t.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100))),
     'COMMAND_'+i+'_LAYOUT_SCHEMATIC_0_TO_100_REQUIRED');
 }
 if(op==='REGISTER_INFRA_CANDIDATE'){
  ensure(KNOWN_TYPES.has(safeString(x.type).toUpperCase()),'COMMAND_'+i+'_INFRA_TYPE_INVALID');
  ensure(ch!==null,'COMMAND_'+i+'_INFRA_CH_REQUIRED');
 }
 if(op==='RECORD_GEOMETRY_GAP'||op==='ADD_SOURCE_REFERENCE'){
  ensure(ch!==null,'COMMAND_'+i+'_CH_REQUIRED');
  ensure(safeString(x.description||x.title,600).length>=12,'COMMAND_'+i+'_DESCRIPTIVE_EVIDENCE_REQUIRED');
 }
 if(op==='ASSISTANT_ASSIGNMENT'){
  ensure(safeString(x.title,160).length>=8,'COMMAND_'+i+'_ASSIGNMENT_TITLE_REQUIRED');
  ensure(Array.isArray(x.checklist)&&x.checklist.length>=1&&x.checklist.length<=20&&
   x.checklist.every(z=>typeof z==='string'&&z.trim().length>=5&&z.length<=250),
   'COMMAND_'+i+'_CHECKLIST_REQUIRED');
  if(asset)ensure(VALID_ASSETS.has(asset),'COMMAND_'+i+'_INVALID_ASSET_CODE');
 }
 const payload=JSON.parse(JSON.stringify(x));
 // Reject masquerading as a surveyed or public dataset; preserve source text only.
 ensure(payload.asBuiltVerified!==true&&payload.surveyVerified!==true&&
  payload.publicPublished!==true&&payload.autoApprove!==true&&payload.liveGPS!==true,
  'COMMAND_'+i+'_CANNOT_CLAIM_SURVEY_PUBLICATION_OR_LIVE_GPS');
 return {id,op,payload,assetCode:asset||null,CH:ch,source:source||null,
  safetyClass:'OWNER_REVIEW_SIMULATION_ONLY',publicPublished:false};
}
function validate(data){
 ensure(isObj(data),'DIRECTIVE_ROOT_NOT_OBJECT');
 ensure(data.schema===FORMAT,'DIRECTIVE_SCHEMA_MISMATCH');
 ensure(data.scope==='MR_S10_P01_D102_LAB','DIRECTIVE_SCOPE_NOT_LAB');
 const assignmentId=safeString(data.assignmentId,100);
 ensure(/^[A-Za-z0-9_:-]{6,100}$/.test(assignmentId),'ASSIGNMENT_ID_INVALID');
 ensure(Array.isArray(data.commands)&&data.commands.length>=1&&data.commands.length<=MAX,
  'COMMAND_COUNT_1_TO_30');
 // Explicitly ignore no file-level "execute", "authorization" or "trusted" claims.
 const commands=data.commands.map(validateCmd);
 ensure(new Set(commands.map(x=>x.id)).size===commands.length,'DUPLICATE_COMMAND_IDS');
 return {schema:FORMAT,scope:data.scope,assignmentId,
  title:safeString(data.title||'D102 Assignment',160),
  originLabel:safeString(data.originLabel||'ChatGPT Adam instruction file',120),
  receivedAt:new Date().toISOString(),
  commands:commands.map(x=>({...x,status:'AWAITING_OWNER_APPROVAL',approved:false,result:null,error:null})),
  approvedByOwner:false,sourceTrust:'UNTRUSTED_IMPORT_PENDING_OWNER_REVIEW',
  codeExecutionEnabled:false,physicalRailMovementEnabled:false,
  cloudSyncEnabled:false,productionChangesEnabled:false};
}
function create(storage,handlers={}){
 let pkg=null,history=[],lastError='';
 try{
  const saved=JSON.parse(storage.getItem(KEY)||'null');
  if(saved?.pkg?.schema===FORMAT&&Array.isArray(saved.pkg.commands)&&saved.pkg.commands.length<=MAX)
   pkg=saved.pkg;
  if(Array.isArray(saved?.history))history=saved.history.slice(-500);
 }catch(_){}
 function persist(){
  try{storage.setItem(KEY,JSON.stringify({schema:1,pkg,history:history.slice(-500)}));return 'LOCAL_SAVED'}
  catch(e){lastError='LOCAL_STORAGE_FAILED';return 'LOCAL_SAVE_FAILED'}
 }
 function review(data){
  const candidate=validate(data);
  // Do not automatically overwrite a running assignment with unsaved progress.
  if(pkg&&pkg.commands.some(x=>x.status==='AWAITING_OWNER_APPROVAL')&&pkg.assignmentId!==candidate.assignmentId)
   throw Error('CURRENT_ASSIGNMENT_PENDING_EXPORT_OR_REVIEW');
  pkg=candidate;history.push({event:'IMPORTED_FOR_REVIEW',assignmentId:pkg.assignmentId,time:new Date().toISOString()});
  persist();return snapshot();
 }
 function command(id){return pkg?.commands?.find(c=>c.id===id)||null}
 function nextPending(){return pkg?.commands?.find(c=>c.status==='AWAITING_OWNER_APPROVAL')||null}
 async function approveAndRun(id){
  ensure(pkg,'NO_DIRECTIVE_FILE_LOADED');
  const c=command(id);ensure(c,'UNKNOWN_COMMAND_ID');
  if(c.status==='COMPLETED')return {status:'ALREADY_COMPLETED',id};
  ensure(c.status==='AWAITING_OWNER_APPROVAL','COMMAND_NOT_PENDING');
  // Callback is static internal code, never user-supplied code or dynamic import.
  const fn=handlers[c.op];ensure(typeof fn==='function','UNSUPPORTED_OPERATION_RUNTIME');
  c.approved=true;c.status='APPLYING';persist();
  try{
   const result=await fn(c.payload,{id:c.id,assetCode:c.assetCode,CH:c.CH,source:c.source});
   c.result=JSON.parse(JSON.stringify(result??{status:'APPLIED'}));
   c.status='COMPLETED';c.error=null;
   history.push({event:'OWNER_APPROVED_AND_APPLIED',assignmentId:pkg.assignmentId,
    commandId:id,op:c.op,time:new Date().toISOString()});
  }catch(e){
   c.status='FAILED_REVIEW_REQUIRED';c.error=safeString(e?.message||e,180);lastError=c.error;
   history.push({event:'COMMAND_FAILED_NO_AUTO_RETRY',commandId:id,op:c.op,time:new Date().toISOString(),reason:c.error});
  }
  persist();
  return {id,status:c.status,error:c.error,result:c.result};
 }
 function skip(id){
  const c=command(id);ensure(c&&c.status==='AWAITING_OWNER_APPROVAL','CANNOT_SKIP_COMPLETED_COMMAND');
  c.status='SKIPPED_BY_OWNER';c.approved=false;
  history.push({event:'OWNER_SKIPPED',commandId:id,time:new Date().toISOString()});persist();return snapshot();
 }
 function snapshot(){
  return {assignmentId:pkg?.assignmentId||null,title:pkg?.title||null,
    imported:!!pkg,commands:pkg?.commands?.map(x=>({id:x.id,op:x.op,assetCode:x.assetCode,CH:x.CH,
     status:x.status,source:x.source,error:x.error,result:x.result}))||[],
    pending:nextPending()?.id||null,history:history.slice(-120),lastError,
    execution:'DECLARATIVE_ALLOWLIST_ONLY',approval:'PER_COMMAND_OWNER_CLICK_REQUIRED',
    geometrySurveyVerified:false,geographicTrainRunAllowed:false,
    assistantMode:'LOCAL_TASK_ORCHESTRATOR_NOT_REMOTE_CHATGPT',
    cloudSync:false,productionProtected:true};
 }
 return Object.freeze({review,approveAndRun,skip,snapshot,command,nextPending});
}
const api=Object.freeze({create,validate,OPS,FORMAT,KEY,MAX_BYTES});
if(root)root.MRS10D102DirectiveExecutor=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
