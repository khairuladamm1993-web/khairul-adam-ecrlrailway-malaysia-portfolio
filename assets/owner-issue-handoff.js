/* R2.2 — Public-safe issue handoff; this is navigation, not an agent or backend privilege. */
(()=>{
 'use strict';
 const PROJECT_REPO='khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio';
 const REGISTRY_REF='feature/owner-command-center-r22-chatgpt-actions';
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
  const text=[
   'MRL’S10 — SAMBUNG PENYELESAIAN ISU TANPA RESTART',
   'Projek: '+project.name+' ('+project.code+')',
   'ID isu: '+issue.id,
   'Isu: '+issue.label+' ['+issue.kind+']',
   'Rekod terakhir (mungkin snapshot): '+issue.detail,
   'Bukti khusus: '+(proof?.url||'Belum ada bukti teknikal langsung yang disahkan'),
   'Registry projek (snapshot): '+registryLink,
   'Buka sumber projek yang disambungkan jika tersedia. Semak commit, deployment dan ujian semasa; jangan menganggap snapshot sebagai status live.',
   'Mula dengan diagnosis baca sahaja. Buat pembaikan yang selamat hanya dalam development branch terasing jika dibenarkan. Jangan ubah Production, Supabase Auth/RLS, unpause, redeploy, merge atau memadam apa-apa tanpa kelulusan khusus.',
   'Jangan minta atau paparkan token, OTP, Magic Link atau rahsia. Untuk Swift, jangan mengandaikan fail pada iPad boleh diakses tanpa checkpoint.',
   'Berikan punca, tindakan/hasil yang benar-benar dilaksanakan, bukti PASS/FAIL/BLOCKED, dan checkpoint untuk Registry.'
  ].join('\n');
  return text;
 }
 function issueActions(project,issue){
  const proof=evidence(project,issue);
  const container=element('div','issue-actions');
  const evidenceRow=element('div','issue-evidence');
  if(proof)evidenceRow.append(link(proof.label,proof.url));
  else evidenceRow.append(element('span','meta','Bukti teknikal khusus belum disahkan'));
  evidenceRow.append(link('Lihat rekod isu',registryLink));
  container.append(evidenceRow);
  const prompt=promptFor(project,issue,proof);
  const action=link('Selesaikan dengan ChatGPT','https://chatgpt.com/?q='+encodeURIComponent(prompt),'chatgpt-issue');
  action.dataset.issueId=issue.id;
  action.addEventListener('click',()=>{
   // Safari/ChatGPT clients may ignore URL-prefill. Clipboard is an optional fallback.
   if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText)
    void navigator.clipboard.writeText(prompt).catch(()=>{});
  });
  container.append(action);
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
  host.replaceChildren();
  host.append(element('h2','','Ringkasan terbaru'));
  host.append(element('p','support','Lihat kemajuan → buka isu → semak bukti → teruskan di ChatGPT'));
  const cards=element('div','progress-overview');
  for(const p of registry.projects){
   const a=element('article','progress-entry');
   a.append(element('span','project-code',p.code+' · '+p.name));
   const latest=(p.facts||[])[0];
   a.append(element('strong','',latest?.value||'BELUM DISAHKAN'));
   a.append(element('span','meta','Rekod '+(latest?.verifiedOn||'tidak diketahui')+' · checkpoint, bukan bukti live'));
   cards.append(a);
  }
  host.append(cards);
  const count=registry.projects.reduce((n,p)=>n+(p.issues?.length||0),0);
  host.append(element('h3','action-head','Perlu tindakan · '+count+' isu'));
  const groups=element('div','action-groups');
  for(const p of registry.projects){
   if(!p.issues?.length)continue;
   const group=element('details','action-project');
   group.append(element('summary','',p.code+' · '+p.name+' ('+p.issues.length+')'));
   for(const issue of p.issues){
    const details=element('details','action-issue');
    details.dataset.issueId=issue.id;
    details.append(element('summary','',issue.kind+' · '+issue.label));
    details.append(element('p','issue-description',issue.detail));
    details.append(issueActions(p,issue));
    group.append(details);
   }
   groups.append(group);
  }
  host.append(groups);
 }
 window.MRLIssueHandoff=Object.freeze({promptFor,evidence,issueActions,renderActionHub});
})();
