/* MR-S10 Owner-only project oversight UI (no write/deploy privileges).
 * PUBLIC data registry contains non-secret evidence ONLY, never Owner/private data.
 * Server-validated RailwayAccess.canAdmin gates dashboard rendering and data reads.
 */
(()=>{
 'use strict';
 const A=window.RailwayAccess;
 const gate=document.getElementById('auth-gate');
 const message=document.getElementById('gate-message');
 const dashboard=document.getElementById('dashboard');
 const refreshButton=document.getElementById('refresh-dashboard');
 const $=id=>document.getElementById(id);
 let pending=false,lastAuthorized=false;
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
  $('issues-count').textContent=String(registry.projects.filter(p=>p.overall==='BLOCKED'||p.overall==='UNVERIFIED').length);
  $('registry-date').textContent='Snapshot '+dateLabel(registry.capturedOn);
  const host=$('project-grid');host.replaceChildren();
  for(const project of registry.projects){
   const card=el('article','project');
   const top=el('div','project-top');top.append(el('span','project-code',project.code),badge(project.overall));
   card.append(top,el('h3','',project.name),el('p','phase',project.phase));
   const facts=el('ul','facts');
   for(const f of project.facts){
    const row=el('li','fact');
    row.append(el('span','name',f.label+' · '+dateLabel(f.verifiedOn)),el('span','value',f.value));
    facts.append(row);
   }
   card.append(facts);
   for(const d of project.deployments){
    const row=el('div','fact');
    row.append(el('span','name',d.name+' · Vercel snapshot '+dateLabel(d.verifiedOn)));
    const label=el('span','value',d.status);
    if(d.status.startsWith('BLOCKED'))label.style.color='var(--bad)';
    row.append(label);
    card.append(row);
   }
   const next=el('div','next');next.append(el('div','label','NEXT VERIFIED ACTION'),el('p','',project.nextDecision));card.append(next);
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
   const left=el('div','');
   left.append(el('strong','',s.label),el('p','meta',s.notes));
   const status=s.sync==='live-on-open'?'LIVE CHECK':s.sync==='snapshot'?'DATED SNAPSHOT':s.sync==='checkpoint'?'MANUAL CHECKPOINT':s.sync==='verified-checkpoint'?'VERIFIED ENTRY':'NOT CONNECTED';
   const right=el('span','state',status);
   if(s.sync==='live-on-open')right.classList.add('live');
   row.append(left,right);host.append(row);
  }
 }
 async function loadRegistry(){
  const response=await fetch('data/owner-project-registry.json',{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw new Error('Registry unavailable (HTTP '+response.status+')');
  return validateRegistry(await response.json());
 }
 async function fetchPublicGitHub(item){
  const url='https://api.github.com/repos/'+item.repo+'/commits/'+encodeURIComponent(item.ref);
  const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw new Error('GitHub HTTP '+response.status);
  const body=await response.json();
  if(!body.sha||!body.html_url)throw new Error('GitHub commit incomplete');
  return {sha:body.sha,source:body.html_url,time:body.commit?.committer?.date||null,subject:body.commit?.message?.split('\n')[0]||''};
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
    right.textContent='LIVE CHECK';right.classList.add('live');
   }catch{
    left.append(el('p','meta','Last observed SHA: '+item.lastObservedSha.slice(0,12)+' — not current-verified'));
    right.textContent='UNVERIFIED';
   }
  }
 }
 async function refresh(){
  if(pending||!A?.canAdmin||A.status!=='authenticated')return;
  pending=true;refreshButton.disabled=true;
  $('refresh-state').textContent='Reading evidence register…';
  try{
   const r=await loadRegistry();
   if(!A.canAdmin)return;
   renderProjects(r);renderSourceCoverage(r);
   $('refresh-state').textContent='Registry snapshot: '+dateLabel(r.capturedOn)+' · GitHub check in progress · Vercel and Swift are not live-linked';
   await renderGitHub(r);
   if(A.canAdmin)$('refresh-state').textContent='GitHub checked on open · Vercel = dated snapshot · Swift = user-reviewed checkpoint · No ChatGPT conversation auto-feed';
  }catch(error){
   $('refresh-state').textContent='UNVERIFIED: '+String(error?.message||error)+' — old snapshots are not treated as live.';
  }finally{pending=false;refreshButton.disabled=false;}
 }
 refreshButton.addEventListener('click',()=>void refresh());
 window.addEventListener('railway-access-change',guard);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)guard();});
 if(A){guard();} // access.js manages its own initialization; event will update this view.
 else{message.textContent='MR-S10 authentication library unavailable. Return to Gateway.';}
})();
