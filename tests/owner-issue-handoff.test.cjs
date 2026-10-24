const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const registry=JSON.parse(read('data/owner-project-registry.json'));
function fixture(){
 const make=(tag)=>{
  const el={tagName:tag,childNodes:[],dataset:{},listeners:{},
   textContent:'',href:'',target:'',rel:'',className:'',hidden:false,
   append(...nodes){this.childNodes.push(...nodes);},
   replaceChildren(...nodes){this.childNodes=nodes;},
   setAttribute(n,v){this[n]=v;},
   addEventListener(n,fn){this.listeners[n]=fn}
  };
  return el;
 };
 const window={};const document={createElement:make};
 vm.runInNewContext(read('assets/owner-issue-handoff.js'),{window,document,encodeURIComponent,console});
 return {api:window.MRLIssueHandoff,make};
}
test('all seven tracked R2.2 issues have valid separate contextual ChatGPT handoffs',()=>{
 const {api}=fixture();
 let count=0;
 for(const project of registry.projects){
  for(const issue of project.issues||[]){
   count++;
   const action=api.issueActions(project,issue);
   const deepLink=action.childNodes.find(n=>n.className==='chatgpt-issue');
   assert(deepLink,'Missing ChatGPT button for '+issue.id);
   assert.equal(deepLink.target,'_blank');
   assert.equal(deepLink.rel,'noopener noreferrer');
   const url=new URL(deepLink.href);
   assert.equal(url.origin,'https://chatgpt.com');
   const prompt=url.searchParams.get('q');
   assert(prompt.includes(issue.id));
   assert(prompt.includes(project.name));
   assert(prompt.includes(issue.detail));
   assert(prompt.includes('Jangan ubah Production'));
   assert(prompt.includes('Jangan minta atau paparkan token'));
   assert(prompt.includes('checkpoint'));
   assert(!prompt.includes('sb_secret_'));
   assert(!prompt.includes('eyJhbGci'));
   assert(!prompt.includes('@gmail.com'));
   assert(!prompt.includes('@yahoo.com'));
  }
 }
 assert.equal(count,7);
});
test('issue details have evidence link or clear no-specific-evidence disclosure',()=>{
 const {api}=fixture();
 for(const p of registry.projects){
  for(const issue of p.issues||[]){
   const container=api.issueActions(p,issue);
   const proofRow=container.childNodes[0];
   const registryLink=proofRow.childNodes.find(x=>x.href?.includes('owner-project-registry.json'));
   assert(registryLink,'missing registry proof');
   if(!api.evidence(p,issue))assert(proofRow.childNodes.some(x=>x.textContent.includes('belum disahkan')));
  }
 }
 const web=registry.projects.find(p=>p.id==='web-simulator');
 const slice=web.issues.find(x=>x.id==='slice1-preview');
 assert(api.evidence(web,slice).url.includes('ecrl-slice1'));
});
test('chat link click is a user-driven navigation: clipboard is an optional fallback',()=>{
 const {api}=fixture();const p=registry.projects[0],i=p.issues[0];
 const action=api.issueActions(p,i).childNodes.find(x=>x.className==='chatgpt-issue');
 assert.equal(typeof action.listeners.click,'function');
 assert(action.href.startsWith('https://chatgpt.com/?q='));
 // No browser scripting eval, token extraction, or remote mutation is involved.
});
test('Owner R2.2 presents progress, actions and evidence in that order',()=>{
 const html=read('owner-command-center.html');
 const progress=html.indexOf('id="action-hub"');
 const projects=html.indexOf('id="project-grid"');
 const github=html.indexOf('id="github-live"');
 assert(progress>0&&progress<projects&&projects<github);
 assert(html.includes('assets/owner-issue-handoff.js'));
 assert(html.includes('R2.5'));
 const {api,make}=fixture();
 const host=make('section');
 api.renderActionHub(registry,host);
 const progressItems=host.childNodes.find(x=>x.className==='progress-overview');
 assert.equal(progressItems.childNodes.length,3);
 const groups=host.childNodes.find(x=>x.className==='action-groups');
 assert.equal(groups.childNodes.length,3);
 assert.equal(groups.childNodes.flatMap(group=>group.childNodes.filter(x=>x.className==='action-issue')).length,7);
});

test('Safari fallback exposes a manual copyable, readonly issue prompt',()=>{
 const {api}=fixture();
 const p=registry.projects[0],issue=p.issues[0];
 const action=api.issueActions(p,issue);
 const fallback=action.childNodes.find(x=>x.className==='issue-prompt-fallback');
 assert(fallback);
 const input=fallback.childNodes.find(x=>x.tagName==='textarea');
 assert(input);
 assert.equal(input.readOnly,true);
 assert(input.value.includes(issue.id));
 assert.equal(fallback.childNodes[0].tagName,'summary');
});

test('Slice 1 ChatGPT diagnostic is stored in GitHub registry, is honest about SHA and remains NO-GO',()=>{
 const p=registry.projects.find(x=>x.id==='web-simulator');
 const issue=p.issues.find(x=>x.id==='slice1-preview');
 const d=issue.latestDiagnosis;
 assert.equal(d.status,'BLOCKED');
 assert.equal(d.releaseDecision,'NO-GO');
 assert.equal(d.projectLive,false);
 assert.equal(d.latestDeploymentState,'BLOCKED');
 assert.equal(d.previousDeploymentState.startsWith('READY'),true);
 assert.equal(d.slice1SourceSha,null);
 assert.match(d.ownerDashboardReferenceNote,/NOT the Slice 1 source commit/);
 assert.match(d.nextAction,/Owner separately approves/);
 assert.equal(d.changesMade,false);
 const {api}=fixture();
 const action=api.issueActions(p,issue);
 const detail=action.childNodes.find(x=>x.className==='issue-latest-diagnosis');
 assert(detail);
 const prompt=api.promptFor(p,issue,api.evidence(p,issue));
 assert(prompt.includes('NO-GO'));
 assert(prompt.includes('SHA dashboard jangan dianggap commit Slice 1'));
 assert.equal(registry.projects.flatMap(x=>x.issues||[]).length,7);
});
