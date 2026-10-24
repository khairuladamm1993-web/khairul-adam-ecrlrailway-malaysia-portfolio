/* R2.3: deterministic, fail-closed issue lifecycle.
 * Registry status and ChatGPT prose alone NEVER authorize SOLVED / READY_FOR_GO.
 * This module is read-only; only an approved GitHub registry update can record evidence.
 */
((root)=>{
 'use strict';
 const cleanUrl=(value)=>{
  try{const u=new URL(String(value||''));return u.protocol==='https:'&&Boolean(u.hostname)&&!u.username&&!u.password&&
   !/^(localhost|127\.|0\.0\.0\.0)/i.test(u.hostname)&&!/[?&](token|key|code|otp|secret|auth|access_token)=/i.test(u.search);}
  catch{return false;}
 };
 const evidenceVerified=(resolution)=>{
  if(!resolution||typeof resolution!=='object')return false;
  if(!Number.isFinite(Date.parse(resolution.verifiedAt||'')))return false;
  return Array.isArray(resolution.evidence)&&resolution.evidence.some(e=>
   e && cleanUrl(e.url) && ['TEST','QA','SOURCE','DEPLOYMENT','UAT'].includes(e.type)&&
   (e.result==='PASS'||e.result==='CONFIRMED') &&
   Number.isFinite(Date.parse(e.checkedAt||''))
  );
 };
 const checksPassed=(r)=>{
  if(!evidenceVerified(r))return false;
  if(r.tests!=='PASS')return false;
  return true;
 };
 const releasePassed=(r)=>{
  const gates=r.releaseGates||{};
  return checksPassed(r) &&
   ['ci','safariUat','security','deployment'].every(k=>gates[k]==='PASS') &&
   gates.ownerApproval==='APPROVED' &&
   Array.isArray(r.evidence)&&r.evidence.some(e=>e.type==='UAT'&&e.result==='PASS')&&
   r.evidence.some(e=>e.type==='DEPLOYMENT'&&e.result==='PASS');
 };
 function classifyIssue(issue){
  if(!issue||typeof issue!=='object')return {state:'OPEN',label:'UNVERIFIED',isResolved:false};
  const claimed=issue.resolution?.state;
  if(claimed==='READY_FOR_GO' && releasePassed(issue.resolution)){
   return {state:'READY_FOR_GO',label:'READY FOR GO',isResolved:true};
  }
  if((claimed==='SOLVED'||claimed==='READY_FOR_GO')&&checksPassed(issue.resolution)){
   return {state:'SOLVED',label:'SOLVED · technical QA',isResolved:true};
  }
  return {state:'OPEN',label:String(issue.kind||'UNVERIFIED'),isResolved:false};
 }
 function summary(registry){
  const all=(registry.projects||[]).flatMap(p=>p.issues||[]);
  const open=all.filter(i=>!classifyIssue(i).isResolved);
  return {total:all.length,unresolved:open.length,solved:all.filter(i=>classifyIssue(i).state==='SOLVED').length,
   readyForGo:all.filter(i=>classifyIssue(i).state==='READY_FOR_GO').length};
 }
 root.MRLCheckpointPolicy=Object.freeze({classifyIssue,summary,evidenceVerified,checksPassed,releasePassed,cleanUrl});
 if(typeof module==='object'&&module.exports)module.exports=root.MRLCheckpointPolicy;
})(typeof window!=='undefined'?window:globalThis);
