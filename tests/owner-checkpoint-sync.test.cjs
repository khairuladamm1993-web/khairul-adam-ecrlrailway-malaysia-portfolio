const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const policy=require('../assets/owner-checkpoint-policy.js');
const registry=JSON.parse(read('data/owner-project-registry.json'));
const repo='khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio';
const branch='feature/owner-r23-verified-checkpoint-sync';
const now='2026-10-25T03:00:00Z';
const evidence=[
 {type:'QA',url:'https://github.com/example/project/actions/runs/42',result:'PASS',checkedAt:now},
 {type:'UAT',url:'https://github.com/example/project/issues/5',result:'PASS',checkedAt:now},
 {type:'DEPLOYMENT',url:'https://vercel.com/example/updated-deployment',result:'PASS',checkedAt:now}
];
const mockIssue=()=>({
 id:'test-issue',kind:'BLOCKED',resolution:{state:'OPEN',tests:'NOT_PASS',verifiedAt:null,evidence:[],
 releaseGates:{ci:'NOT_PASS',safariUat:'NOT_PASS',security:'NOT_PASS',deployment:'NOT_PASS',ownerApproval:'NOT_APPROVED'}}
});
test('R2.3 lifecycle policy never upgrades diagnostics just because a checkpoint exists',()=>{
 const issues=registry.projects.flatMap(p=>p.issues||[]);
 assert.equal(issues.length,7);
 assert(issues.every(x=>policy.classifyIssue(x).state==='OPEN'));
 assert.equal(policy.summary(registry).unresolved,7);
 assert.equal(policy.summary(registry).solved,0);
 assert.equal(policy.summary(registry).readyForGo,0);
 const slice=registry.projects.find(p=>p.id==='web-simulator').issues.find(x=>x.id==='slice1-preview');
 assert.equal(slice.latestDiagnosis.releaseDecision,'NO-GO');
 assert.equal(slice.resolution.state,'OPEN');
});
test('claim of SOLVED without date, PASS test and proof stays OPEN',()=>{
 const issue=mockIssue();issue.resolution.state='SOLVED';
 assert.equal(policy.classifyIssue(issue).state,'OPEN');
 issue.resolution.verifiedAt=now;issue.resolution.evidence=evidence;
 assert.equal(policy.classifyIssue(issue).state,'OPEN');
 issue.resolution.tests='PASS';
 assert.equal(policy.classifyIssue(issue).state,'SOLVED');
 assert.equal(policy.classifyIssue(issue).isResolved,true);
});
test('READY_FOR_GO requires Owner approval, CI, Safari, security, deployment, independent proof',()=>{
 const issue=mockIssue();
 issue.resolution={state:'READY_FOR_GO',verifiedAt:now,tests:'PASS',evidence:[evidence[0]],releaseGates:{}};
 assert.equal(policy.classifyIssue(issue).state,'SOLVED');
 issue.resolution.releaseGates={ci:'PASS',safariUat:'PASS',security:'PASS',deployment:'PASS',ownerApproval:'APPROVED'};
 assert.equal(policy.classifyIssue(issue).state,'SOLVED'); // UAT+deployment evidence are absent
 issue.resolution.evidence=evidence;
 assert.equal(policy.classifyIssue(issue).state,'READY_FOR_GO');
 delete issue.resolution.releaseGates.ownerApproval;
 assert.equal(policy.classifyIssue(issue).state,'SOLVED');
});
test('proof URL excludes credential-bearing query strings and local hosts',()=>{
 const issue=mockIssue();
 issue.resolution={state:'SOLVED',verifiedAt:now,tests:'PASS',evidence:[{
  type:'QA',url:'https://example.com/verify?token=abc',result:'PASS',checkedAt:now
 }]};
 assert.equal(policy.classifyIssue(issue).state,'OPEN');
 assert.equal(policy.cleanUrl('http://example.com/evidence'),false);
 assert.equal(policy.cleanUrl('https://example.com/evidence'),true);
});
test('resolved issues are excluded from unresolved counters but preserved in history',()=>{
 const clone=JSON.parse(JSON.stringify(registry));
 const target=clone.projects[1].issues[0];
 target.resolution={state:'SOLVED',verifiedAt:now,tests:'PASS',evidence:[evidence[0]]};
 const count=policy.summary(clone);
 assert.equal(count.total,7);
 assert.equal(count.unresolved,6);
 assert.equal(count.solved,1);
});
test('handoff prompt instructs authorized new ChatGPT chat to write verified Registry checkpoint',()=>{
 const source=read('assets/owner-issue-handoff.js');
 const fakeWindow={MRLCheckpointPolicy:policy};
 const fakeDocument={createElement:tag=>({tagName:tag,childNodes:[],dataset:{},listeners:{},
  textContent:'',value:'',append(...xs){this.childNodes.push(...xs)},
  setAttribute(n,v){this[n]=v},addEventListener(n,f){this.listeners[n]=f}})};
 vm.runInNewContext(source,{window:fakeWindow,document:fakeDocument,encodeURIComponent,console});
 const p=registry.projects[1],issue=p.issues.find(x=>x.id==='slice1-preview');
 const prompt=fakeWindow.MRLIssueHandoff.promptFor(p,issue,fakeWindow.MRLIssueHandoff.evidence(p,issue));
 assert(prompt.includes(branch));
 assert(prompt.includes('data/owner-project-registry.json'));
 assert(prompt.includes('fetch_file'));
 assert(prompt.includes('update_file'));
 assert(prompt.includes('JANGAN suruh Owner menyalin'));
 assert(prompt.includes('READY_FOR_GO'));
 assert(prompt.includes('ownerApproval=APPROVED'));
 assert(prompt.includes('SYNC BLOCKED'));
 assert(prompt.includes('Jangan ubah Production'));
 const action=fakeWindow.MRLIssueHandoff.issueActions(p,issue);
 const href=action.childNodes.find(x=>x.className==='chatgpt-issue').href;
 assert.equal(new URL(href).origin,'https://chatgpt.com');
});
test('dashboard live-reads GitHub registry and clearly marks snapshot fallback',()=>{
 const js=read('assets/owner-command-center.js');
 const html=read('owner-command-center.html');
 assert(js.includes('api.github.com/repos/'));
 assert(js.includes('contents/'));
 assert(js.includes('GITHUB_LIVE')||js.includes('GitHub LIVE'));
 assert(js.includes('SNAPSHOT / NOT LIVE'));
 assert(js.includes('data/owner-project-registry.json'));
 assert(html.includes('assets/owner-checkpoint-policy.js'));
 assert(html.includes('R2.3'));
 assert.equal(registry.checkpointSynchronization.branch,branch);
 assert.equal(registry.checkpointSynchronization.directAllChatHistory,false);
});
test('R2.3 does not silently authorize production / forced release',()=>{
 const p=JSON.stringify(registry.checkpointSynchronization);
 assert.match(p,/no main\/Production/);
 assert.equal(registry.projects[1].overall,'BLOCKED');
 const m=JSON.stringify(registry);
 assert.doesNotMatch(m,/sb_secret_|eyJhbGciOi/);
});
