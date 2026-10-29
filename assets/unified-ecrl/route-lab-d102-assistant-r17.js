/* R1.7 MR-S10 local assistant instruction inbox.
 * NO arbitrary code/JSON command eval, no access to ChatGPT chat session,
 * GitHub, Vercel, restricted drawings, Supabase or Production. */
(function(root){'use strict';
const E=root.MRS10D102DirectiveExecutor;
if(!E)throw Error('DIRECTIVE_EXECUTOR_NOT_LOADED');
let message='',session=()=>root.MRS10ECRLRouteLab?.snapshot()?.session||null;
const $=(tag,value,cls)=>{const x=document.createElement(tag);if(value!==undefined&&value!==null)x.textContent=String(value);if(cls)x.className=cls;return x};
function storeEvidence(payload,kind){
 return {kind,assetCode:String(payload.assetCode||payload.code||'').toUpperCase()||null,
  CH:payload.CH??null,title:String(payload.title||'').slice(0,160),
  description:String(payload.description||'').slice(0,800),
  source:String(payload.source||'').slice(0,350),
  evidenceClass:'REFERENCE_OR_OWNER_REVIEW_TASK_ONLY',surveyVerified:false,georeferencedTrackGeometry:null,
  approvalForConsumerPublication:false,
  checklist:Array.isArray(payload.checklist)?payload.checklist.map(x=>String(x).slice(0,250)):null};
}
const api=E.create(root.localStorage,{
 SELECT_ASSET:payload=>{
  const code=String(payload.assetCode||payload.code).toUpperCase();
  root.MRS10D102JourneyUI?.showLayout(code,true);
  if(code.startsWith('STN'))root.MRS10ECRLStationMap?.select(code,true);
  return {selectedAsset:code,sourceStatus:'REGISTRY_REFERENCE_ONLY',physicalLocationNotVerified:true};
 },
 QUEUE_CHECKPOINT:payload=>{
  const code=String(payload.assetCode||payload.code).toUpperCase();
  const row=root.MRS10ECRLChainage.records.find(x=>x.code===code);
  if(!row)throw Error('CHECKPOINT_NOT_IN_ACCEPTED_MANIFEST');
  const sess=session();
  if(!sess)throw Error('D102_SESSION_NOT_AVAILABLE');
  const pending=root.MRS10D102JourneyUI?.request(row.metres);
  return {queuedCode:code,CH:row.metres,phase:pending?.phase,
   movementCommitted:false,requiresInteractiveOwnerConfirmation:true};
 },
 IMPORT_LAYOUT_DRAFT:payload=>{
  const code=String(payload.assetCode||payload.code).toUpperCase();
  const result=root.MRS10D102JourneyUI?.importPayload({code,title:payload.title,
   source:payload.source,tracks:payload.tracks});
  if(!result)throw Error('LAYOUT_RENDERER_UNAVAILABLE');
  return {code,imported:result.assets?.length||0,physicalTrackNotVerified:true,
   publicPublished:false,localOnly:true};
 },
 REGISTER_INFRA_CANDIDATE:payload=>{
  const info=root.MRS10D102JourneyUI?.importPayload({infrastructure:[{
   id:payload.id,name:payload.name,type:payload.type,CH:payload.CH,
   source:payload.source,notes:payload.notes||'',
   latitude:payload.latitude??null,longitude:payload.longitude??null
  }]});
  if(!info)throw Error('INFRASTRUCTURE_IMPORT_UNAVAILABLE');
  return {registered:info.events?.length||0,CH:payload.CH,
   eventStopEnabled:true,surveyVerified:false,realGeometryUnknown:true};
 },
 RECORD_GEOMETRY_GAP:p=>storeEvidence(p,'GEOMETRY_GAP_REVIEW_TASK'),
 ADD_SOURCE_REFERENCE:p=>storeEvidence(p,'SOURCE_REFERENCE_PENDING_VALIDATION'),
 ASSISTANT_ASSIGNMENT:p=>storeEvidence(p,'MR_S10_OWNER_ASSIGNMENT_CHECKLIST')
});
function download(name,payload){
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=$('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
const TEMPLATE={
 schema:E.FORMAT,scope:'MR_S10_P01_D102_LAB',
 assignmentId:'D102_STN01_OWNER_REVIEW_R1',title:'STN01 departure and geometry evidence checklist',
 originLabel:'ChatGPT Adam · reviewed draft',
 commands:[
 {id:'A001',op:'SELECT_ASSET',payload:{assetCode:'STN01'}},
 {id:'A002',op:'RECORD_GEOMETRY_GAP',payload:{
   assetCode:'STN01',CH:670,source:'MR-S10 accepted station CH registry',
   description:'STN01 as-built centreline, station turnout connections and exact WGS84 still need independent evidence.'}},
 {id:'A003',op:'ASSISTANT_ASSIGNMENT',payload:{
   assetCode:'STN01',title:'Complete STN01 station intelligence evidence',
   source:'MR-S10 ECRL training data provenance register',
   checklist:['Confirm source date and authorisation for rail centreline',
   'Compare station source CH with Owner accepted manifest',
   'Record turnout, platform and siding source references when permitted',
   'Identify unresolved sections without inventing track geometry']}},
 {id:'A004',op:'QUEUE_CHECKPOINT',payload:{assetCode:'STN02'}}
 ]};
function render(){
 const host=document.getElementById('lab-r17-assistant');if(!host)return;
 const s=api.snapshot();host.replaceChildren();
 host.append($('h2','MR-S10 Assistant · Arahan ChatGPT Adam (R1.7)'));
 host.append($('p','Fail JSON berstruktur diterima sebagai pelan tugas. Setiap arahan memerlukan kelulusan Owner. Tidak melaksanakan kod, tidak menyambung ChatGPT secara langsung dan tidak mengubah Production.','lab-trail-note'));
 const line=$('p',s.imported?
   'Assignment '+s.assignmentId+' · '+s.commands.filter(x=>x.status==='COMPLETED').length+'/'+s.commands.length+' selesai · '+s.commands.filter(x=>x.status==='FAILED_REVIEW_REQUIRED').length+' ralat'
   :'Tiada fail arahan dimuatkan. Boleh cuba template ChatGPT Adam di bawah.','lab-r17-metrics');
 host.append(line);
 const template=$('button','Eksport contoh fail arahan ChatGPT Adam (.json)');template.type='button';
 template.onclick=()=>download('mr-s10-d102-chatgpt-adam-assignment-template.json',TEMPLATE);host.append(template);
 const fileLabel=$('label','Import fail arahan ChatGPT Adam (.json / .txt berformat JSON)'),file=$('input');
 file.type='file';file.accept='.json,.txt,application/json,text/plain';file.id='lab-r17-directive-file';
 file.onchange=async()=>{try{
   const f=file.files?.[0];if(!f||f.size>E.MAX_BYTES)throw Error('FILE_TOO_LARGE_MAX_500KB');
   const text=await f.text(),data=JSON.parse(text);
   api.review(data);message='Fail berjaya dibaca. Belum ada arahan dilaksanakan; semak dan klik Lulus & Jalankan.';
   render();
  }catch(e){message='FILE REJECTED: '+String(e.message||e);render()}};
 fileLabel.append(file);host.append(fileLabel);
 host.append($('p',message,'lab-r17-status'));
 if(!s.imported)return;
 const details=$('details');details.open=true;
 details.append($('summary','Senarai arahan · '+s.title));
 for(const item of s.commands){
  const row=$('div',null,'lab-r17-task');
  row.append($('strong',item.id+' · '+item.op),$('p','Aset: '+(item.assetCode||'GENERAL')+' · '+(item.CH==null?'CH: N/A':E.FORMAT+' · '+item.CH)+' · '+item.status));
  if(item.source)row.append($('p','Sumber: '+item.source,'lab-r16-note'));
  if(item.error)row.append($('p','Ralat: '+item.error,'lab-r16-alert'));
  if(item.result)row.append($('p','Hasil: '+JSON.stringify(item.result).slice(0,450),'lab-r16-note'));
  if(item.status==='AWAITING_OWNER_APPROVAL'){
   const action=$('div',null,'lab-row'),approve=$('button','Lulus & Jalankan'),skip=$('button','Langkau');
   approve.type='button';approve.id='lab-r17-approve-'+item.id;approve.onclick=async()=>{
    if(!root.confirm('Lulus arahan '+item.id+' ('+item.op+')? Hanya perubahan setempat P01, bukan publish Production.'))return;
    const r=await api.approveAndRun(item.id);
    message=r.status==='COMPLETED'?'Arahan '+item.id+' dilaksanakan setempat.':'Arahan '+item.id+' memerlukan semakan: '+r.error;
    render();
   };
   skip.type='button';skip.onclick=()=>{api.skip(item.id);message='Arahan '+item.id+' dilangkau oleh Owner.';render()};
   action.append(approve,skip);row.append(action);
  }
  details.append(row);
 }
 host.append(details);
 const exportButton=$('button','Eksport rekod tugasan Assistant JSON');exportButton.type='button';
 exportButton.onclick=()=>download('mr-s10-d102-directive-audit-'+s.assignmentId+'.json',s);
 host.append(exportButton);
 host.append($('p','Geometri lengkap ECRL belum diimport / diperakui. Arahan yang diproses hanya merekod tugasan, memaparkan layout berasaskan sumber atau meminta popup checkpoint D102.','lab-trail-note'));
}
function connect(){render()}
const expose=Object.freeze({connect,render,review:api.review,snapshot:api.snapshot,approveAndRun:api.approveAndRun,template:()=>JSON.parse(JSON.stringify(TEMPLATE))});
root.MRS10D102AssistantInbox=expose;
if(typeof module==='object'&&module.exports)module.exports=expose;
})(typeof window!=='undefined'?window:null);
