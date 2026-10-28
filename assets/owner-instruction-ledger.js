/* P01 R1 secure instruction ledger. Owner-only UI; never holds a GitHub/Vercel secret or executes coding jobs. */
(()=>{
 'use strict';
 const A=window.RailwayAccess;
 const panel=document.getElementById('instruction-ledger');
 if(!panel)return;
 const $=id=>document.getElementById(id);
 const state=$('ledger-state'),list=$('ledger-items'),form=$('ledger-form');
 const summary=$('ledger-summary'),acceptance=$('ledger-acceptance'),scope=$('ledger-scope');
 const button=$('ledger-submit'),refresh=$('ledger-refresh');
 let inFlight=false,serial=0,nonce=null,items=[];
 const node=(tag,cls,label)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(label!=null)e.textContent=String(label);
  return e;
 };
 const authorized=()=>Boolean(A?.canAdmin&&A.status==='authenticated');
 function setState(message,mode='pending'){
  state.textContent=message;state.dataset.mode=mode;
 }
 function safeError(error){
  const msg=String(error?.message||'Unavailable');
  if(/network|fetch|timeout/i.test(msg))return 'Network unavailable. Existing instructions were not modified.';
  if(/migration|PGRST202|function.*not found/i.test(msg))return 'NOT CONNECTED · Database migration has not been applied.';
  return 'NOT VERIFIED · '+msg.slice(0,180);
 }
 function reflectAuth(){
  const allowed=authorized();
  panel.hidden=!allowed;
  if(!allowed){serial++;list.replaceChildren();items=[];nonce=null;setState('Owner session required','blocked');}
  else if(!inFlight&&list.childNodes.length===0)void load();
 }
 function labelDate(s){
  const d=new Date(s);
  return Number.isNaN(+d)?'Date not verified':new Intl.DateTimeFormat('en-MY',{
   day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',
   timeZone:'Asia/Kuala_Lumpur',hour12:false
  }).format(d);
 }
 async function showHistory(item,host){
  host.replaceChildren(node('p','support','Reading private checkpoint history…'));
  try{
   const events=await A.adminInstructionHistory(item.instruction_id);
   if(!authorized())return;
   const history=Array.isArray(events)?events:[];
   host.replaceChildren();
   if(!history.length){host.append(node('p','support','No verified events returned.'));return;}
   for(const e of history){
    const row=node('p','ledger-history-line');
    row.append(node('strong','',e.event_type+' · R'+e.revision+' · '),
       node('span','',labelDate(e.created_at)+' — '+e.summary));
    host.append(row);
   }
  }catch(err){if(authorized())host.replaceChildren(node('p','support',safeError(err)));}
 }
 function render(rows){
  items=rows;list.replaceChildren();
  if(!rows.length){list.append(node('p','support','No saved P01 instructions. The mirror is not an autonomous executor.'));return;}
  for(const item of rows){
   const box=node('article','ledger-record');
   const heading=node('div','ledger-record-head');
   heading.append(node('strong','',item.directive_summary),node('span','pill',item.state+' · R'+item.revision));
   const meta=node('p','support','P01 · '+labelDate(item.created_at)+' · '+String(item.instruction_id).slice(0,8));
   const criteria=node('p','ledger-criteria','Acceptance: '+item.acceptance_criteria);
   const paths=node('p','support','Scope: '+(Array.isArray(item.scope_paths)&&item.scope_paths.length?item.scope_paths.join(', '):'Read-only discovery / no code paths defined'));
   const details=node('details','ledger-checkpoints');
   const label=node('summary','', 'Checkpoint history & Owner notes');details.append(label);
   const history=node('div','ledger-history');
   const checkForm=node('form','ledger-checkpoint-form');
   const type=node('select','');
   for(const [value,name] of [['NOTE','Note only'],['DIAGNOSED','Diagnosis recorded'],['BLOCKED','Blocked (needs action)']]){
    const option=node('option','',name);option.value=value;type.append(option);
   }
   const note=node('textarea','');
   note.rows=2;note.maxLength=1500;note.minLength=12;note.required=true;
   note.placeholder='Checkpoint with traceable evidence; never enter credentials or private messages';
   note.setAttribute('aria-label','Checkpoint note');
   const save=node('button','ledger-action','Record checkpoint');
   save.type='submit';
   checkForm.append(type,note,save);
   checkForm.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!authorized()||save.disabled)return;
    save.disabled=true;
    try{
     const out=await A.adminInstructionCheckpoint({
      id:item.instruction_id,revision:item.revision,type:type.value,summary:note.value.trim()
     });
     if(!authorized())return;
     note.value='';
     setState('Checkpoint recorded · R'+out.revision+'. Refresh to verify the latest revision.','live');
     await load();
    }catch(error){if(authorized())setState(safeError(error),'blocked');}
    finally{save.disabled=false;}
   });
   details.addEventListener('toggle',()=>{if(details.open&&history.childNodes.length===0)void showHistory(item,history);});
   details.append(history,checkForm);
   box.append(heading,meta,criteria,paths,details);list.append(box);
  }
 }
 async function load(){
  if(!authorized()||inFlight)return;
  const ticket=++serial;
  setState('Validating Owner session and reading private ledger…');
  refresh.disabled=true;
  try{
   const result=await A.adminInstructionList(15);
   if(ticket!==serial||!authorized())return;
   if(!Array.isArray(result))throw new Error('Unexpected ledger response');
   render(result);
   setState('PRIVATE LEDGER LIVE · '+result.length+' recent instruction(s) · Source: Supabase Owner RPC','live');
  }catch(error){
   if(ticket===serial&&authorized()){list.replaceChildren();setState(safeError(error),'blocked');}
  }finally{refresh.disabled=false;}
 }
 for(const field of [summary,acceptance,scope])field.addEventListener('input',()=>{nonce=null;});
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!authorized()||button.disabled)return;
  const s=summary.value.trim(),a=acceptance.value.trim();
  const paths=scope.value.split(/[\n,]+/).map(v=>v.trim()).filter(Boolean);
  if(s.length<12||a.length<12||paths.length>8){setState('Provide a summary, acceptance criteria and no more than 8 scope paths.','blocked');return;}
  if(!window.crypto?.randomUUID){setState('Secure nonce generator unavailable.','blocked');return;}
  nonce=nonce||window.crypto.randomUUID();
  button.disabled=true;
  try{
   const out=await A.adminInstructionSubmit({nonce,summary:s,acceptance:a,scope:paths});
   if(!authorized())return;
   setState((out.created?'Instruction received':'Idempotent retry confirmed')+' · '+out.instruction_id+' · R'+out.revision+'. NOT an execution authorization.','live');
   form.reset();nonce=null;
   await load();
  }catch(error){if(authorized())setState(safeError(error),'blocked');}
  finally{button.disabled=false;}
 });
 refresh.addEventListener('click',()=>void load());
 document.getElementById('refresh-dashboard')?.addEventListener('click',()=>void load());
 window.addEventListener('railway-access-change',reflectAuth);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&authorized())void load();});
 reflectAuth();
})();
