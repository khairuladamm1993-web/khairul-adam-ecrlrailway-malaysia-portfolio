/* R2.2 — Public-safe issue handoff; this is navigation, not an agent or backend privilege. */
(()=>{
 'use strict';
 const PROJECT_REPO='khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio';
 const REGISTRY_REF='feature/owner-r23-verified-checkpoint-sync';
 const registryLink='https://github.com/'+PROJECT_REPO+'/blob/'+REGISTRY_REF+'/data/owner-project-registry.json';
 const element=(tag,className,text)=>{
  const e=document.createElement(tag);
  if(className)e.className=className;
  if(text!=null)e.textContent=String(text);
  return e;
 };
 const link=(label,url,className='')=>{
  const e=element('a',className,label+' ↗');
  e.href=url;e.target='_blank';e.rel='noopener noreferrer';
  return e;
 };
 function evidence(project,issue){
  const fact=(project.facts||[]).find(f=>f.label===issue.basis);
  if(fact&&typeof fact.evidence==='string'&&/^https:\/\//.test(fact.evidence)){
   return {url:fact.evidence,label:'Bukti ujian berkaitan'};
  }
  const deployment=(project.deployments||[]).find(d=>
    issue.id==='slice1-preview'&&d.name==='Slice 1'
  );
  if(deployment?.url&&/^https:\/\//.test(deployment.url)){
   return {url:deployment.url,label:'Periksa URL deployment (belum PASS)'};
  }
  return null;
 }
 function promptFor(project,issue,proof){
  const lifecycle=window.MRLCheckpointPolicy?.classifyIssue(issue);
  const text=[
   'MRL’S10 — SAMBUNG PENYELESAIAN ISU TANPA RESTART',
   'Projek: '+project.name+' ('+project.code+')',
   'ID isu: '+issue.id,
   'Isu: '+issue.label+' ['+(lifecycle?.isResolved?lifecycle.label:issue.kind)+']',
   'Status terkini: '+(lifecycle?.isResolved?
    (issue.resolution?.summary||lifecycle.label+' — validated proof in Registry'):
    issue.detail),
   ...(issue.latestDiagnosis&&!lifecycle?.isResolved?[
    'Checkpoint ('+issue.latestDiagnosis.checkedOn+'): '+issue.latestDiagnosis.releaseDecision+'; '+issue.latestDiagnosis.rootCause,
    'Tindakan seterusnya: '+issue.latestDiagnosis.nextAction,
    'Sumber SHA Slice 1 belum disahkan; SHA dashboard jangan dianggap commit Slice 1.'
   ]:[]),
   'Bukti khusus: '+(proof?.url||'Belum ada bukti teknikal langsung yang disahkan'),
   'Registry projek (snapshot): '+registryLink,
   'Buka sumber projek yang disambungkan jika tersedia. Semak commit, deployment dan ujian semasa; jangan menganggap snapshot sebagai status live.',
   'Mula dengan diagnosis baca sahaja. Buat pembaikan yang selamat hanya dalam development branch terasing jika dibenarkan. Jangan ubah Production, Supabase Auth/RLS, unpause, redeploy, merge atau memadam apa-apa tanpa kelulusan khusus.',
   'Jangan minta atau paparkan token, OTP, Magic Link atau rahsia. Untuk Swift, jangan mengandaikan fail pada iPad boleh diakses tanpa checkpoint.',
   'R2.3: Selepas diagnosis, kemas kini checkpoint terus dalam Registry melalui GitHub connector yang dibenarkan. JANGAN suruh Owner menyalin laporan antara chat. Ini izin menulis checkpoint bukan izin deploy.',
   ...(window.MRLTwoWayWorkflow?[window.MRLTwoWayWorkflow.composeContract(project,issue)]:[]),
   'GitHub repo: '+PROJECT_REPO+'; branch terasing: '+REGISTRY_REF+'; path: data/owner-project-registry.json.',
   'Baca fail dan blob SHA terkini dengan GitHub fetch_file(ref=branch). Semak sumber/ujian sebenar, kemudian gunakan update_file pada branch SASARAN sahaja dengan sha terkini. Tulis hanya rekod isu ID yang tepat dan kekalkan semua projek/isu lain. Sahkan commit dan pembacaan selepas write. Jangan tulis secret atau email ke repo awam.',
   'Untuk diagnosis BLOCKED/NO-GO, kekalkan resolution.state=OPEN; rekod latestDiagnosis dan sebab, bukti, masa semakan, nextAction yang tepat.',
   'SOLVED hanya jika issue fix telah dibuktikan, resolution.state=SOLVED, tests=PASS, verifiedAt ISO dan evidence array mengandungi bukti HTTPS bertarikh yang PASS atau CONFIRMED.',
   'READY_FOR_GO hanya jika bukti SOLVED sah, releaseGates ci/safariUat/security/deployment semuanya PASS, ownerApproval=APPROVED, serta bukti UAT PASS dan DEPLOYMENT PASS. READY_FOR_GO tidak bermaksud deploy dibenarkan.',
   'Jika tools GitHub tidak boleh diakses atau penulisan gagal, nyatakan SYNC BLOCKED tanpa mendakwa Registry updated.',
   'Jangan ubah Production, Supabase Auth/RLS, unpause, redeploy, merge atau memadam tanpa kelulusan khusus. Jangan minta token/OTP.',
   'Akhirnya berikan status, rujukan bukti sebenar, dan SHA commit yang telah disahkan jika berjaya tulis checkpoint.'
  ].join('\n');
  return text;
 }
 function issueActions(project,issue){
  const proof=evidence(project,issue);
  const life=window.MRLCheckpointPolicy?.classifyIssue(issue);
  const container=element('div','issue-actions');
  const evidenceRow=element('div','issue-evidence');
  if(proof)evidenceRow.append(link(proof.label,proof.url));
  else evidenceRow.append(element('span','meta','Bukti teknikal khusus belum disahkan'));
  evidenceRow.append(link('Lihat rekod isu',registryLink));
  container.append(evidenceRow);
  if(issue.latestDiagnosis&&!life?.isResolved){
   const diagnosis=issue.latestDiagnosis;
   const result=element('div','issue-latest-diagnosis');
   result.append(element('strong','', 'Latest diagnosis · '+diagnosis.checkedOn+' · '+diagnosis.releaseDecision));
   result.append(element('p','meta',diagnosis.rootCause));
   result.append(element('p','meta','Next: '+diagnosis.nextAction));
   if(diagnosis.slice1SourceSha==null)
    result.append(element('p','meta','Slice 1 source SHA: not verified. Dashboard SHA is a separate project.'));
   container.append(result);
  }
  if(life?.isResolved){
   const summary=element('div','issue-latest-diagnosis');
   summary.append(element('strong','',life.label+' · '+(issue.resolution?.verifiedAt||'date unverified')));
   summary.append(element('p','meta',issue.resolution?.summary||'Closure verified by QA evidence; see proof links.'));
   for(const e of issue.resolution?.evidence||[]){
    if(e.url&&/^https:\/\//.test(e.url))summary.append(link('Bukti '+e.type,e.url));
   }
   container.append(summary);
  }
  const prompt=promptFor(project,issue,proof);
  const action=link(life?.isResolved?'Semak semula dengan ChatGPT':'Selesaikan dengan ChatGPT','https://chatgpt.com/?q='+encodeURIComponent(prompt),'chatgpt-issue');
  action.dataset.issueId=issue.id;
  action.addEventListener('click',()=>{
   // Safari/ChatGPT clients may ignore URL-prefill. Clipboard is an optional fallback.
   if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText)
    void navigator.clipboard.writeText(prompt).catch(()=>{});
  });
  container.append(action);
  if(window.MRLTwoWayWorkflow){
    const observed=window.MRLTwoWayWorkflow.auditEvent(issue);
    container.append(element('p','meta','Cross-chat: '+observed.label+
      (observed.updated?' · '+observed.updated:'')+
      ' · GitHub Registry is the return channel, not a private-chat live feed.'));
  }
  container.append(element('p','meta','Pautan cuba memasukkan konteks isu. Jika tidak muncul, Paste. Jika salinan automatik tidak tersedia, buka teks isu di bawah. Semak sebelum hantar; tiada pembaikan Production automatik.'));
  const fallback=element('details','issue-prompt-fallback');
  fallback.append(element('summary','','Lihat / salin teks isu secara manual'));
  const textarea=element('textarea','issue-prompt-text');
  textarea.value=prompt;textarea.readOnly=true;textarea.rows=7;
  textarea.setAttribute('aria-label','Prompt ChatGPT untuk isu '+issue.label);
  textarea.addEventListener('focus',()=>{if(typeof textarea.select==='function')textarea.select();});
  fallback.append(textarea);
  container.append(fallback);
  return container;
 }
 function renderActionHub(registry,host){
  if(!host)return;
  const policy=window.MRLCheckpointPolicy;
  host.replaceChildren();
  host.append(element('h2','','Ringkasan terbaru'));
  host.append(element('p','support','Lihat kemajuan → buka isu → semak bukti → teruskan di ChatGPT'));
  const cards=element('div','progress-overview');
  for(const p of registry.projects){
   const a=element('article','progress-entry');
   a.append(element('span','project-code',p.code+' · '+p.name));
   const verified=(p.issues||[]).filter(i=>policy?.classifyIssue(i).isResolved)
    .sort((a,b)=>Date.parse(b.resolution.verifiedAt)-Date.parse(a.resolution.verifiedAt));
   const newest=verified[0];
   const latest=(p.facts||[])[0];
   a.append(element('strong','',newest?
    (policy.classifyIssue(newest).label+' · '+newest.label):
    (latest?.value||'BELUM DISAHKAN')));
   a.append(element('span','meta',newest?
    ('Verified '+newest.resolution.verifiedAt+' · UAT & evidence retained'):
    ('Rekod '+(latest?.verifiedOn||'tidak diketahui')+' · checkpoint, bukan bukti live')));
   cards.append(a);
  }
  host.append(cards);
  const count=policy?policy.summary(registry).unresolved:registry.projects.reduce((n,p)=>n+(p.issues?.length||0),0);
  host.append(element('h3','action-head','Perlu tindakan · '+count+' isu'));
  const groups=element('div','action-groups');
  const completed=element('div','action-groups');
  for(const p of registry.projects){
   if(!p.issues?.length)continue;
   const open=p.issues.filter(i=>!policy?.classifyIssue(i).isResolved);
   const closed=p.issues.filter(i=>policy?.classifyIssue(i).isResolved);
   if(open.length){
   const group=element('details','action-project');
   group.append(element('summary','',p.code+' · '+p.name+' ('+open.length+')'));
   for(const issue of open){
    const details=element('details','action-issue');
    details.dataset.issueId=issue.id;
    details.append(element('summary','',issue.kind+' · '+issue.label));
    details.append(element('p','issue-description',issue.detail));
    details.append(issueActions(p,issue));
    group.append(details);
   }
   groups.append(group);
   }
   if(closed.length){
    const group=element('details','action-project');
    group.append(element('summary','',p.code+' · '+p.name+' ('+closed.length+' selesai)'));
    for(const issue of closed){
     const details=element('details','action-issue');
     details.dataset.issueId=issue.id;
     details.append(element('summary','',policy.classifyIssue(issue).label+' · '+issue.label));
     details.append(element('p','issue-description',issue.resolution?.summary||'Verified closure; see evidence.'),issueActions(p,issue));
     group.append(details);
    }
    completed.append(group);
   }
  }
  host.append(groups);
  if(policy){
   const total=policy.summary(registry);
   if(total.solved+total.readyForGo>0){
    const section=element('details','completed-checks');
    section.append(element('summary','', 'SOLVED / READY FOR GO · '+(total.solved+total.readyForGo)));
    section.append(completed);host.append(section);
   }
  }
 }
 window.MRLIssueHandoff=Object.freeze({promptFor,evidence,issueActions,renderActionHub});
})();
