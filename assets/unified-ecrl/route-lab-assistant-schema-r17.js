/* Structured data validator. No executable expressions or arbitrary actions. */
(function(root){'use strict';
const COMMANDS=Object.freeze({REVIEW_CHECKPOINT:['code','CH','sourceIds'],MOVE_CH:['targetCH'],REQUIRE_IMPORT:['code','kind','required'],REGISTER_INFRASTRUCTURE:['eventId','type','CH','name','sourceId','latitude','longitude'],OPEN_LAYOUT:['code'],REVIEW_GEOMETRY:['scopeCodes'],CONNECTOR_TASK:['connector','task'],EXPORT_REPORT:['report']});
const TYPES=['BRIDGE','TUNNEL','QZ_CURVE','CURVE','TURNOUT','SIGNAL','CROSSING','JUNCTION','SPURLINE','OTHER'];
const top=['schemaVersion','assignmentId','revision','source','project','trainId','scope','currentCheckpoint','targetCH','instructions','requirements','ownerCheckpoints','expectedOutcome','qa','acceptanceCriteria','commands'];
const safeId=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(s)&&!['constructor','prototype','__proto__'].includes(s);
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function fields(x,allowed){if(!plain(x)||Object.keys(x).some(k=>!allowed.includes(k)))throw Error('SCHEMA_UNKNOWN_OR_UNSAFE_FIELD')}
function text(x,max=2000){return typeof x==='string'&&x.length>0&&x.length<=max}
function safety(x,depth=0){if(depth>20)throw Error('DOCUMENT_TOO_DEEP');if(Array.isArray(x)){if(x.length>2000)throw Error('ARRAY_TOO_LARGE');for(const v of x)safety(v,depth+1)}else if(plain(x)){for(const [k,v]of Object.entries(x)){if(['__proto__','constructor','prototype'].includes(k))throw Error('UNSAFE_OBJECT_KEY');safety(v,depth+1)}}else if(!['string','number','boolean'].includes(typeof x)&&x!==null)throw Error('DATA_ONLY_DOCUMENT_REQUIRED')}
function validate(raw,rows){
 if(JSON.stringify(raw).length>524288)throw Error('ASSIGNMENT_MAX_512KB');safety(raw);fields(raw,top);
 if(raw.schemaVersion!=='1.0.0'||!safeId(raw.assignmentId)||!Number.isInteger(raw.revision)||raw.revision<1||raw.revision>100000)throw Error('INVALID_SCHEMA_ID_OR_REVISION');
 if(raw.project!=='MR-S10-P01'||raw.trainId!=='D102')throw Error('PROJECT_OR_TRAIN_NOT_AUTHORIZED');
 const codes=new Map(rows.map(r=>[r.code,r.metres])),validCH=n=>Number.isInteger(n)&&n>=rows[0].metres&&n<=rows.at(-1).metres;
 fields(raw.source,['name','kind','references']);if(!text(raw.source.name,200)||!['CHATGPT_MRS10','OWNER_DOCUMENT','OWNER_ASSIGNMENT'].includes(raw.source.kind)||!Array.isArray(raw.source.references)||raw.source.references.length>100)throw Error('INVALID_DECLARED_SOURCE');
 const sourceIds=new Set();for(const s of raw.source.references){fields(s,['id','url','date','licence','note']);if(!safeId(s.id)||sourceIds.has(s.id)||!text(s.note,2000))throw Error('INVALID_SOURCE_REFERENCE');sourceIds.add(s.id);if(s.url!=null){let u;try{u=new URL(s.url)}catch{throw Error('INVALID_SOURCE_URL')}if(u.protocol!=='https:'||u.username||u.password)throw Error('UNSAFE_SOURCE_URL')}if(s.date!=null&&!text(s.date,80))throw Error('INVALID_SOURCE_DATE');if(s.licence!=null&&!text(s.licence,200))throw Error('INVALID_SOURCE_LICENCE')}
 if(!Array.isArray(raw.scope)||!raw.scope.length||raw.scope.length>23||new Set(raw.scope).size!==raw.scope.length||raw.scope.some(c=>!codes.has(c)))throw Error('INVALID_STN_PL_SCOPE');
 const scoped=c=>raw.scope.includes(c);fields(raw.currentCheckpoint,['code','CH']);if(!validCH(raw.currentCheckpoint.CH)||(raw.currentCheckpoint.code!==null&&(!scoped(raw.currentCheckpoint.code)||codes.get(raw.currentCheckpoint.code)!==raw.currentCheckpoint.CH))||!validCH(raw.targetCH))throw Error('INVALID_CHECKPOINT_OR_CH');
 for(const key of ['instructions','expectedOutcome'])if(!text(raw[key],16000))throw Error('MISSING_'+key.toUpperCase());
 for(const key of ['ownerCheckpoints','qa','acceptanceCriteria'])if(!Array.isArray(raw[key])||raw[key].length>100||raw[key].some(v=>!text(v,2000)))throw Error('INVALID_'+key.toUpperCase());
 if(!Array.isArray(raw.requirements)||raw.requirements.length>100)throw Error('INVALID_DATA_REQUIREMENTS');for(const r of raw.requirements){fields(r,['kind','code','required','sourceIds']);if(!['SOURCE_MEDIA','TRACK_LAYOUT','RAIL_GEOMETRY'].includes(r.kind)||!scoped(r.code)||typeof r.required!=='boolean'||!Array.isArray(r.sourceIds)||r.sourceIds.some(id=>!sourceIds.has(id)))throw Error('INVALID_DATA_REQUIREMENT')}
 if(!Array.isArray(raw.commands)||!raw.commands.length||raw.commands.length>100)throw Error('COMMAND_COUNT_1_TO_100');const ids=new Set();
 for(const c of raw.commands){fields(c,['id','type','params']);if(!safeId(c.id)||ids.has(c.id))throw Error('INVALID_OR_DUPLICATE_COMMAND_ID');ids.add(c.id);if(!Object.hasOwn(COMMANDS,c.type))throw Error('COMMAND_NOT_ALLOWLISTED');fields(c.params,COMMANDS[c.type]);const p=c.params;
  if(p.code!==undefined&&!scoped(p.code))throw Error('COMMAND_OUTSIDE_SCOPE');
  if(c.type==='REVIEW_CHECKPOINT'&&(!scoped(p.code)||codes.get(p.code)!==p.CH||!Array.isArray(p.sourceIds)||p.sourceIds.some(id=>!sourceIds.has(id))))throw Error('REVIEW_REFERENCE_INVALID');
  if(c.type==='MOVE_CH'&&(!validCH(p.targetCH)||p.targetCH<Math.min(...raw.scope.map(c=>codes.get(c)))||p.targetCH>Math.max(...raw.scope.map(c=>codes.get(c)))))throw Error('MOVE_TARGET_OUTSIDE_SCOPE');
  if(c.type==='REQUIRE_IMPORT'&&(!scoped(p.code)||!['SOURCE_MEDIA','TRACK_LAYOUT'].includes(p.kind)||typeof p.required!=='boolean'))throw Error('INVALID_IMPORT_REQUIREMENT');
  if(c.type==='OPEN_LAYOUT'&&!scoped(p.code))throw Error('INVALID_LAYOUT_SCOPE');
  if(c.type==='REGISTER_INFRASTRUCTURE'){if((!safeId(p.eventId)||!/^[A-Za-z0-9_:-]+$/.test(p.eventId))||!TYPES.includes(p.type)||(!validCH(p.CH)||p.CH<Math.min(...raw.scope.map(c=>codes.get(c)))||p.CH>Math.max(...raw.scope.map(c=>codes.get(c))))||!text(p.name,140)||!sourceIds.has(p.sourceId))throw Error('INVALID_INFRASTRUCTURE_REFERENCE');if((p.latitude!=null||p.longitude!=null)&&!(Number.isFinite(p.latitude)&&p.latitude>=1&&p.latitude<=7&&Number.isFinite(p.longitude)&&p.longitude>=99&&p.longitude<=105))throw Error('INVALID_SOURCE_COORDINATE')}
  if(c.type==='REVIEW_GEOMETRY'&&(!Array.isArray(p.scopeCodes)||!p.scopeCodes.length||p.scopeCodes.some(c=>!scoped(c))))throw Error('INVALID_GEOMETRY_SCOPE');
  if(c.type==='CONNECTOR_TASK'&&(!['GITHUB','SUPABASE','RESEARCH'].includes(p.connector)||!text(p.task,4000)))throw Error('INVALID_CONNECTOR_TASK');
  if(c.type==='EXPORT_REPORT'&&!['EXECUTION','GEOMETRY'].includes(p.report))throw Error('INVALID_REPORT_KIND');
 }
 const moves=raw.commands.filter(c=>c.type==='MOVE_CH');if(moves.length&&moves.at(-1).params.targetCH!==raw.targetCH)throw Error('FINAL_MOVE_TARGET_MISMATCH');
 return JSON.parse(JSON.stringify(raw));
}
function documentDraft(text,session,rows){if(!text||text.length>16000)throw Error('DOCUMENT_INSTRUCTIONS_MAX_16000_CHARACTERS');const row=rows.find(r=>r.metres===session.currentCH);if(!row)throw Error('DOCUMENT_CONVERSION_REQUIRES_CURRENT_CONTROL_POINT');return {schemaVersion:'1.0.0',assignmentId:'OWNER-DOCUMENT-'+Date.now(),revision:1,source:{name:'Owner reviewed text document',kind:'OWNER_DOCUMENT',references:[{id:'OWNER_TEXT',url:null,date:null,licence:'OWNER_PRIVATE',note:'Document instructions are unverified plain text; no commands were parsed from prose.'}]},project:'MR-S10-P01',trainId:'D102',scope:[row.code],currentCheckpoint:{code:row.code,CH:row.metres},targetCH:row.metres,instructions:text,requirements:[],ownerCheckpoints:[row.code],expectedOutcome:'Review current checkpoint only. No movement or external task is generated from text.',qa:['DATA_ONLY_NO_CODE_EXECUTION'],acceptanceCriteria:['Owner confirms the structured draft before starting'],commands:[{id:'review-document',type:'REVIEW_CHECKPOINT',params:{code:row.code,CH:row.metres,sourceIds:['OWNER_TEXT']}}]}}
const api={validate,documentDraft,COMMANDS,TYPES,safety};if(typeof module==='object')module.exports=api;if(root)root.MRS10AssistantSchema=api;
})(typeof window!=='undefined'?window:null);
