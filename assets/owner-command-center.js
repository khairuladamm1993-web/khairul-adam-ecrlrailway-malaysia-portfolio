/* MR-S10 Owner-only project oversight UI (no write/deploy privileges).
 * PUBLIC data registry contains non-secret evidence ONLY, never Owner/private data.
 * Server-validated RailwayAccess.canAdmin gates dashboard rendering and data reads.
 */
(()=>{
 'use strict';
 const A=window.RailwayAccess;
 const POLICY=window.MRLCheckpointPolicy;
 const gate=document.getElementById('auth-gate');
 const message=document.getElementById('gate-message');
 const dashboard=document.getElementById('dashboard');
 const refreshButton=document.getElementById('refresh-dashboard');
 const $=id=>document.getElementById(id);
 let pending=false,lastAuthorized=false,refreshCount=0,lastRefreshAt=0;
 const el=(tag,cls,value)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(value!=null)node.textContent=String(value);
  return node;
 };
 const safeLink=(title,url)=>{
  if(typeof url!=='string'||!url.startsWith('https://'))return null;
  const link=el('a','',title+' ↗');
  link.href=url;link.target='_blank';link.rel='noopener noreferrer';
  return link;
 };
 const badge=(text,state)=>{const b=el('span','pill',text);b.dataset.state=state||text;return b;};
 const dateLabel=(date)=>{
  const d=new Date(String(date||''));if(Number.isNaN(d.getTime()))return 'Time unverified';
  return new Intl.DateTimeFormat('en-MY',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(d);
 };
 function guard(){
  const allowed=Boolean(A&&A.canAdmin&&A.status==='authenticated');
  if(!allowed){
   lastAuthorized=false;
   dashboard.hidden=true;gate.hidden=false;
   const status=A?.status||'unavailable';
   message.textContent=['initializing','restoring-session','validating-user','role-pending','exchanging-code'].includes(status)
    ?'Verifying the current Supabase Owner/Admin session…'
    :'Owner access unavailable. This page does not bypass login; return to Gateway after authentication is repaired.';
  }else{
   gate.hidden=true;dashboard.hidden=false;
   if(!lastAuthorized){lastAuthorized=true;void refresh();}
  }
 }
 function validateRegistry(r){
  if(!r||r.schemaVersion!=='1.0.0'||!Array.isArray(r.projects)||r.projects.length!==3||
   !r.projects.every(p=>p.id&&p.name&&Array.isArray(p.facts)&&Array.isArray(p.deployments)))throw new Error('Registry incomplete or invalid');
  return r;
 }
 function renderProjects(registry){
  $('project-count').textContent=String(registry.projects.length);
  $('future-count').textContent=String(registry.consolidation?.futureProducts||'—');
  $('issues-count').textContent=String(POLICY?POLICY.summary(registry).unresolved:registry.projects.reduce((n,p)=>n+(p.issues?.length||0),0));
  $('registry-date').textContent='Snapshot '+dateLabel(registry.capturedOn);
  window.MRLIssueHandoff?.renderActionHub(registry,$('action-hub'));
  const host=$('project-grid');host.replaceChildren();
  for(const project of registry.projects){
   const card=el('article','project');
   const issues=project.issues||[];
   const active=issues.filter(i=>!POLICY?.classifyIssue(i).isResolved);
   const solved=issues.filter(i=>POLICY?.classifyIssue(i).isResolved);
   const stage=active.length?project.overall:
    (solved.length&&solved.every(i=>POLICY.classifyIssue(i).state==='READY_FOR_GO')?'READY_FOR_GO':
    solved.length?'SOLVED':project.overall);
   const top=el('div','project-top');top.append(el('span','project-code',project.code),badge(stage));
   card.append(top,el('h3','',project.name),el('p','phase',project.phase));
   const facts=el('ul','facts');
   for(const f of project.facts.slice(0,1)){
    const row=el('li','fact');
    row.append(el('span','name',f.label+' · '+dateLabel(f.verifiedOn)),el('span','value',f.value));
    facts.append(row);
   }
   card.append(facts);
   if(active.length){
    const list=el('details','open-items');
    const summary=el('summary','',active.length+' unresolved checks · View');
    list.append(summary);
    const items=el('ul','facts');
    for(const issue of active){
     const li=el('li','fact');
     li.append(el('span','name',issue.kind+' · '+issue.label),el('span','value',issue.detail));
     const action=window.MRLIssueHandoff?.issueActions(project,issue);
     if(action)li.append(action);
     items.append(li);
    }
    list.append(items);card.append(list);
   }
   if(solved.length){
    const archive=el('details','completed-checks');
    archive.append(el('summary','', solved.length+' SOLVED / READY FOR GO · Verified'));
    const list=el('ul','facts');
    for(const issue of solved){
     const item=el('li','fact');
     item.append(el('span','name',POLICY.classifyIssue(issue).label+' · '+issue.label));
     item.append(el('span','value',issue.detail));
     const proof=window.MRLIssueHandoff?.issueActions(project,issue);
     if(proof)item.append(proof);
     list.append(item);
    }
    archive.append(list);card.append(archive);
   }
   if(project.facts.length>1){
    const details=el('details','extra-facts');
    details.append(el('summary','', 'Historical QA & all evidence · '+project.facts.length+' entries'));
    const extra=el('ul','facts');
    for(const item of project.facts.slice(1)){
     const entry=el('li','fact');
     entry.append(el('span','name',item.label+' · '+dateLabel(item.verifiedOn)),el('span','value',item.value));
     extra.append(entry);
    }
    details.append(extra);card.append(details);
   }
   for(const d of project.deployments){
    const row=el('div','fact');
    row.append(el('span','name',d.name+' · Vercel snapshot '+dateLabel(d.verifiedOn)));
    const label=el('span','value',d.status);
    if(d.status.startsWith('BLOCKED'))label.style.color='var(--bad)';
    row.append(label);
    card.append(row);
   }
   const next=el('div','next');
   next.append(el('div','label','NEXT VERIFIED ACTION'),
    el('p','',active.length?project.nextDecision:
     'Semua isu direkodkan sebagai SOLVED atau READY FOR GO mengikut bukti. Semak kelulusan Owner sebelum apa-apa pelepasan.'));
   card.append(next);
   const links=el('div','links');
   for(const l of project.links||[]){const link=safeLink(l.name,l.url);if(link)links.append(link);}
   if(links.childNodes.length)card.append(links);
   host.append(card);
  }
  const roadmap=$('roadmap');roadmap.replaceChildren();
  roadmap.append(el('h2','', 'MRL’S10 — future 2-product architecture'));
  const a=el('p','');a.append(el('strong','', 'WEBSITE  '),el('span','',registry.consolidation.futureWeb));
  const b=el('p','');b.append(el('strong','', 'APP  '),el('span','',registry.consolidation.futureApp));
  roadmap.append(a,b,el('p','support','Current state: 3 separate development tracks. Merge the ECRL Web Simulator only after independent QA, security and corridor-data acceptance. Domain '+registry.consolidation.domain+' is proposed, not registered or verified.'));
 }
 function renderSourceCoverage(registry){
  const host=$('source-coverage');host.replaceChildren();
  for(const s of registry.sources||[]){
   const row=el('div','proof');
   row.dataset.source=s.id;
   const left=el('div','');
   left.append(el('strong','',s.label),el('p','meta',s.notes));
   const status=s.sync==='live-on-open'?'LIVE CHECK':s.sync==='snapshot'?'DATED SNAPSHOT':s.sync==='checkpoint'?'MANUAL CHECKPOINT':s.sync==='verified-checkpoint'?'VERIFIED ENTRY':'NOT CONNECTED';
   const right=el('span','state',status);
   if(s.sync==='live-on-open')right.classList.add('live');
   row.append(left,right);host.append(row);
  }
 }
 // GitHub Registry is the source of truth: no redeploy needed for a verified checkpoint commit.
 // Uses only public repository data; never place secrets or sensitive Owner records in the registry.
 async function loadRegistry(){
  const repo='khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio';
  const ref='feature/owner-r23-verified-checkpoint-sync';
  const path='data/owner-project-registry.json';
  const api='https://api.github.com/repos/'+repo+'/contents/'+path+'?ref='+encodeURIComponent(ref);
  try{
   const res=await fetch(api,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
   if(!res.ok)throw new Error('GitHub HTTP '+res.status);
   const payload=await res.json();
   if(payload.encoding!=='base64'||typeof payload.content!=='string'||typeof payload.sha!=='string')
    throw new Error('GitHub Registry payload invalid');
   const buffer=Uint8Array.from(atob(payload.content.replace(/\\s/g,'')),c=>c.charCodeAt(0));
   const parsed=validateRegistry(JSON.parse(new TextDecoder().decode(buffer)));
   if(parsed.checkpointSynchronization?.branch!==ref)
    throw new Error('Incorrect Registry branch');
   return {data:parsed,live:true,sha:payload.sha};
  }catch(error){
   const response=await fetch('data/owner-project-registry.json',{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw new Error('GitHub Registry unavailable; bundled snapshot missing (HTTP '+response.status+')');
   return {data:validateRegistry(await response.json()),live:false,error:String(error?.message||error)};
  }
 }
 async function fetchPublicGitHub(item){
  const url='https://api.github.com/repos/'+item.repo+'/commits/'+encodeURIComponent(item.ref);
  const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw new Error('GitHub HTTP '+response.status);
  const body=await response.json();
  if(!body.sha||!body.html_url)throw new Error('GitHub commit incomplete');
  return {sha:body.sha,source:body.html_url,time:body.commit?.committer?.date||null,subject:body.commit?.message?.split('\n')[0]||''};
 }
 async function fetchGitHubCI(item,sha){
  const url='https://api.github.com/repos/'+item.repo+'/actions/runs?head_sha='+encodeURIComponent(sha)+'&per_page=3';
  const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw new Error('GitHub Actions status unavailable');
  const payload=await response.json();
  const runs=Array.isArray(payload.workflow_runs)?payload.workflow_runs:[];
  const latest=runs.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0];
  if(!latest)return {state:'NO RUN',url:null};
  return {state:latest.status==='completed'?String(latest.conclusion||'UNKNOWN').toUpperCase():'IN PROGRESS',
   url:latest.html_url||null,at:latest.updated_at||null};
 }
 async function renderGitHub(registry){
  const host=$('github-live');host.replaceChildren();
  const configs=registry.projects.flatMap(p=>p.liveGithub||[]);
  for(const item of configs){
   if(!A.canAdmin)break;
   const row=el('div','proof');
   const left=el('div','');left.append(el('strong','',item.label),el('p','meta',item.repo+' · '+item.ref));
   const right=el('span','state','CHECKING…');
   row.append(left,right);host.append(row);
   try{
    const live=await fetchPublicGitHub(item);
    if(!A.canAdmin){host.replaceChildren();return;}
    const commit=safeLink(live.sha.slice(0,10),live.source);
    const meta=el('p','meta');
    meta.append(el('span','',dateLabel(live.time)+' · '));if(commit)meta.append(commit);
    left.append(meta,el('p','meta',live.subject));
    right.textContent='LIVE COMMIT';right.classList.add('live');
    const ci=el('p','meta','CI: CHECKING…');left.append(ci);
    try{
     const run=await fetchGitHubCI(item,live.sha);
     if(!A.canAdmin)return;
     ci.replaceChildren(el('span','',run.state==='NO RUN'?'CI: NO RUN — not a test PASS':('CI: '+run.state+' · ')));
     const link=run.url?safeLink('Run details',run.url):null;
     if(link)ci.append(link);
    }catch{ci.textContent='CI: UNVERIFIED (API or rate limit; no PASS inferred)';}
    
   }catch{
    left.append(el('p','meta','Last observed SHA: '+item.lastObservedSha.slice(0,12)+' — not current-verified'));
    right.textContent='UNVERIFIED';
   }
  }
 }
 async function renderVercel(){
  const host=$('vercel-live');if(!host)return;
  host.replaceChildren(el('p','support','Owner-only read bridge: checking configuration…'));
  if(typeof A.ownerDashboardAccessToken!=='function'){
   host.replaceChildren(el('p','support','NOT CONNECTED · Public demo or no verified Owner session. Vercel status shown above remains a dated snapshot.'));
   return false;
  }
  try{
   const token=await A.ownerDashboardAccessToken();
   if(!token){host.replaceChildren(el('p','support','NOT AUTHORIZED · Vercel live status requires a verified Owner/Admin session.'));return false;}
   const response=await fetch('api/owner-project-status',{
    method:'GET',cache:'no-store',headers:{Authorization:'Bearer '+token,Accept:'application/json'}
   });
   if(!response.ok){
    host.replaceChildren(el('p','support','NOT CONNECTED · Live Vercel bridge unavailable (HTTP '+response.status+'). Existing dated snapshots are preserved.'));
    return false;
   }
   const result=await response.json();
   if(result.status!=='OK'||!Array.isArray(result.projects))throw Error('Unexpected project status response');
   if(!A.canAdmin)return false;
   host.replaceChildren();
   for(const d of result.projects){
    const row=el('div','proof'),left=el('div','');
    left.append(el('strong','',d.name),el('p','meta','Checked '+new Date(result.checkedAt).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})+' MYT · Vercel API'));
    const label=(d.status||'UNVERIFIED')+(d.live===false?' · project not live':'');
    const right=el('span','state',label);
    if(d.status==='READY'&&d.live!==false)right.classList.add('live');
    row.append(left,right);host.append(row);
   }
   const source=$('source-coverage');
   if(source){
    for(const row of source.childNodes||[]){
     if(row.dataset?.source==='vercel'){
      const current=row.childNodes?.[1];
      if(current){current.textContent='LIVE API';current.classList?.add('live');}
     }
    }
   }
   return true;
  }catch{
   host.replaceChildren(el('p','support','UNVERIFIED · Vercel bridge could not complete the safe read. No cached snapshot is presented as live.'));
   return false;
  }
 }
 async function refresh(){
  if(pending||!A?.canAdmin||A.status!=='authenticated')return;
  pending=true;lastRefreshAt=Date.now();refreshButton.disabled=true;
  $('refresh-state').textContent='Reading evidence register…';
  try{
   const result=await loadRegistry();
   const r=result.data;
   if(!A.canAdmin)return;
   renderProjects(r);renderSourceCoverage(r);
   $('refresh-state').textContent=(result.live?'Registry GitHub LIVE (verified file fetched)':'REGISTRY SNAPSHOT (GitHub unavailable)')+' · GitHub commits/CI loading · Vercel and Swift not live-linked';
   await renderGitHub(r);
   const vercelLive=await renderVercel();
   if(A.canAdmin){
    refreshCount++;
    const time=new Date().toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur',hour:'2-digit',minute:'2-digit',hour12:false});
    $('refresh-state').textContent='CHECK #'+refreshCount+' · '+time+' MYT · Registry '+(result.live?'GitHub LIVE':'SNAPSHOT / NOT LIVE')+' · Vercel '+(vercelLive?'live':'snapshot')+' · Swift checkpoint · ChatGPT checkpoint via authorized GitHub connector only';
   }
  }catch(error){
   $('refresh-state').textContent='UNVERIFIED: '+String(error?.message||error)+' — old snapshots are not treated as live.';
  }finally{pending=false;refreshButton.disabled=false;}
 }
 refreshButton.addEventListener('click',()=>void refresh());
 window.addEventListener('railway-access-change',guard);
 function resume(){
  if(document.hidden)return;
  guard();
  if(A?.canAdmin&&A.status==='authenticated'&&Date.now()-lastRefreshAt>120000)void refresh();
 }
 document.addEventListener('visibilitychange',resume);
 window.addEventListener('pageshow',event=>{if(event.persisted)resume();});
 if(A){guard();} // access.js manages its own initialization; event will update this view.
 else{message.textContent='MR-S10 authentication library unavailable. Return to Gateway.';}
})();
