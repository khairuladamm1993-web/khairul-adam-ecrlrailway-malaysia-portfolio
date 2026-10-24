/* MRL'S10 R2.5 — read-only verified two-way workflow contract.
 * The browser never writes GitHub, starts ChatGPT work, or sees private chat data.
 * ChatGPT in a separate, authorized session may commit public-safe checkpoints.
 */
((root)=>{
 'use strict';
 const target=Object.freeze({
  repository:'khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio',
  branch:'feature/owner-r23-verified-checkpoint-sync',
  path:'data/owner-project-registry.json'
 });
 const verifiedSource=Object.freeze(['LIVE_GITHUB_API','LIVE_GITHUB_RAW']);
 const normalized=(v)=>String(v||'').trim();
 function dateIsValid(value){
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d(?:T[^\s]+)?$/.test(value))return false;
  return Number.isFinite(Date.parse(value));
 }
 function trustedLink(input){
  if(typeof input!=='string')return false;
  try{
   const u=new URL(input);
   return u.protocol==='https:'&&!u.username&&!u.password&&
    !/^(localhost|127\.|0\.0\.0\.0)/i.test(u.hostname)&&
    !/(?:token|code|otp|key|secret|password|access_token|refresh_token|authorization|magic|session)/i.test(u.search);
  }catch{return false;}
 }
 function outcome(issue){
  const diagnostic=issue?.latestDiagnosis;
  const resolution=issue?.resolution;
  const state=resolution?.state||'OPEN';
  if(state==='OPEN'&&diagnostic?.releaseDecision==='NO-GO'){
   return {label:'NO-GO · checkpoint recorded',updated:diagnostic.checkedOn||null,
    type:'diagnosis',result:'NO-GO'};
  }
  if(state==='OPEN'&&diagnostic?.checkedOn){
   return {label:'OPEN · checkpoint recorded',updated:diagnostic.checkedOn,type:'diagnosis',result:'OPEN'};
  }
  if(state==='SOLVED'||state==='READY_FOR_GO'){
   return {label:state,updated:resolution.verifiedAt||null,type:'resolution',result:state};
  }
  return {label:'OPEN · no verified closure',updated:null,type:'unverified',result:'OPEN'};
 }
 function audit(registry,source){
  const projects=Array.isArray(registry?.projects)?registry.projects:[];
  const total=projects.reduce((n,p)=>n+(Array.isArray(p.issues)?p.issues.length:0),0);
  const live=verifiedSource.includes(source);
  return {live,source:live?source:'SNAPSHOT',total,roundTrip:'NOT_PROVEN_BY_BROWSER_ALONE'};
 }
 function composeContract(project,issue){
  if(!project?.id||!issue?.id)throw Error('Missing project or issue');
  return [
   'R2.5 CROSS-CHAT VERIFIED TWO-WAY WORKFLOW — only for '+project.id+' / '+issue.id+'.',
   'Workflow direction A: Dashboard supplied issue ID and current public Registry context, NOT access to other private ChatGPT conversations.',
   'Workflow direction B: If connected GitHub write permission is available, read fresh Registry by exact repo/branch/file below, inspect live proof, update only this issue and optionally its project summary, then verify the new GitHub file and commit. No report-pasting by Owner.',
   'REPO '+target.repository,
   'BRANCH '+target.branch,
   'FILE '+target.path,
   'Preserve all unrelated issue IDs and history. Use fetch_file first; only update_file on matching branch with current blob SHA. On SHA conflict, re-fetch and reconcile, never force overwrite.',
   'Document latestDiagnosis with checkedOn, status, releaseDecision, rootCause, evidence source and nextAction when unresolved. Retain previous verified decisions; never delete unrelated records.',
   'Before SOLVED or READY_FOR_GO, independently verify the fix, PASS tests, dated nonsecret HTTPS evidence, and all required release gates. Owner approval is separate. A chat summary is not direct evidence.',
   'Never send credentials, OTP, Magic Link, user email, or private chat transcript into the public Registry.',
   'No production deploy, unpause, merge, database/RLS/auth modification or Swift app mutation without explicit separate approval.',
   'After a successful GitHub write, re-read Registry and report the real commit SHA plus issue ID, result and source. If not written, say SYNC BLOCKED. Never claim automatic synchronization from conversation text alone.',
   'Return-to-dashboard: https://mrs10-r24-single-gateway-preview.vercel.app/owner-command-center.html ; Safari Refresh reads latest GitHub Registry once Owner access is authorized.'
  ].join('\n');
 }
 function auditEvent(issue){
  const item=outcome(issue);
  if(!dateIsValid(item.updated))return {status:'NO_DATE',label:item.label};
  return {status:'RECORDED',label:item.label,updated:item.updated};
 }
 root.MRLTwoWayWorkflow=Object.freeze({target,outcome,audit,composeContract,auditEvent,trustedLink,dateIsValid});
 if(typeof module==='object'&&module.exports)module.exports=root.MRLTwoWayWorkflow;
})(typeof window!=='undefined'?window:globalThis);
