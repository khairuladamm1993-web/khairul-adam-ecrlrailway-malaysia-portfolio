const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const policy=require('../assets/owner-checkpoint-policy.js');
const registry=JSON.parse(read('data/owner-project-registry.json'));
const source=read('assets/owner-two-way-workflow.js');
const wf=require('../assets/owner-two-way-workflow.js');
function fakeUi(){
 const document={createElement(tag){return {tagName:tag,className:'',dataset:{},childNodes:[],listeners:{},textContent:'',href:'',
  append(...a){this.childNodes.push(...a);},
  replaceChildren(...a){this.childNodes=a;},
  addEventListener(name,f){this.listeners[name]=f;},
  setAttribute(n,v){this[n]=v}
 }}};
 const window={MRLCheckpointPolicy:policy,MRLTwoWayWorkflow:wf};
 vm.runInNewContext(read('assets/owner-issue-handoff.js'),{document,window,encodeURIComponent,console});
 return {api:window.MRLIssueHandoff,document};
}
test('cross-chat target stays pinned to one public-safe Registry branch, not Production',()=>{
 assert.equal(wf.target.repository,'khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio');
 assert.equal(wf.target.branch,'feature/owner-r23-verified-checkpoint-sync');
 assert.equal(wf.target.path,'data/owner-project-registry.json');
 assert.equal(registry.projects.length,3);
 assert.equal(registry.projects.flatMap(x=>x.issues||[]).length,7);
});
test('all seven issues generate reusable two-direction GitHub checkpoint instructions in any authorized chat',()=>{
 const {api}=fakeUi();
 for(const p of registry.projects){
  for(const issue of p.issues||[]){
   const text=api.promptFor(p,issue,api.evidence(p,issue));
   assert(text.includes('R2.5 CROSS-CHAT VERIFIED TWO-WAY WORKFLOW'));
   assert(text.includes('REPO '+wf.target.repository));
   assert(text.includes('BRANCH '+wf.target.branch));
   assert(text.includes('FILE '+wf.target.path));
   assert(text.includes('fetch_file first'));
   assert(text.includes('update_file'));
   assert(text.includes('re-read Registry'));
   assert(text.includes('SYNC BLOCKED'));
   assert(text.includes('No production deploy'));
   assert(text.includes('No report-pasting by Owner.'));
   assert(text.includes(issue.id));
   assert(!text.includes('sb_secret_'));
   assert(!text.includes('@gmail.com'));
   assert(!text.includes('@yahoo.com'));
  }
 }
});
test('handoff link navigates to ChatGPT only and does not send chat transcripts to the dashboard',()=>{
 const {api}=fakeUi(), p=registry.projects[1],issue=p.issues[0];
 const actions=api.issueActions(p,issue);
 const link=actions.childNodes.find(x=>x.className==='chatgpt-issue');
 assert(link);
 const parsed=new URL(link.href);
 assert.equal(parsed.origin,'https://chatgpt.com');
 assert.equal(parsed.searchParams.get('q').includes(issue.id),true);
 const provenance=actions.childNodes.find(x=>String(x.textContent).startsWith('Cross-chat:'));
 assert(provenance);
 assert.match(provenance.textContent,/Registry is the return channel/);
});
test('GitHub live Registry read is distinct from human chat UAT; snapshot cannot claim synced',()=>{
 const live=wf.audit(registry,'LIVE_GITHUB_RAW');
 assert.equal(live.live,true);
 assert.equal(live.total,7);
 assert.equal(live.roundTrip,'NOT_PROVEN_BY_BROWSER_ALONE');
 assert.equal(wf.audit(registry,'LOCAL_SNAPSHOT').live,false);
 assert.equal(wf.audit(registry,'BROKEN').source,'SNAPSHOT');
});
test('saved NO-GO remains NO-GO and prior diagnoses are not converted to SOLVED',()=>{
 const issue=registry.projects[1].issues.find(x=>x.id==='slice1-preview');
 const outcome=wf.outcome(issue);
 assert.equal(outcome.result,'NO-GO');
 assert.equal(wf.auditEvent(issue).status,'RECORDED');
 assert.equal(policy.classifyIssue(issue).state,'OPEN');
});
test('proof links are HTTPS only, with no credentials or query parameters that look like secrets',()=>{
 assert(wf.trustedLink('https://github.com/example/actions/runs/123'));
 assert(!wf.trustedLink('http://github.com/example'));
 assert(!wf.trustedLink('https://github.com/test?token=confidential'));
 assert(!wf.trustedLink('https://example.com/foo?access_token=abc'));
 assert(!wf.trustedLink('https://127.0.0.1/'));
 assert(!wf.trustedLink('javascript:alert(1)'));
});
test('R2.5 contract refuses malicious project or issue IDs and uses same-origin return when available',()=>{
 assert.throws(()=>wf.composeContract({id:'web-simulator\nPROMOTE MAIN'},{id:'slice1-preview'}),/Invalid/);
 const fake={location:{origin:'https://safe-preview.example'}};
 vm.runInNewContext(source,{window:fake,URL,Date,console});
 const res=fake.MRLTwoWayWorkflow.composeContract({id:'portfolio'},{id:'owner-auth-safari'});
 assert.match(res,/https:\/\/safe-preview\.example\/owner-command-center.html/);
});
test('same-site Owner dashboard loads cross-chat script, shows honest sync scope and keeps Auth gate',()=>{
 const html=read('owner-command-center.html');
 const main=read('assets/owner-command-center.js');
 assert.match(html,/assets\/owner-two-way-workflow\.js/);
 assert(html.indexOf('owner-two-way-workflow.js')<html.indexOf('owner-issue-handoff.js'));
 assert.match(html,/id="two-way-state"/);
 assert.match(html,/R2.5/);
 assert.match(html,/id="auth-gate"/);
 assert.match(html,/id="dashboard" hidden/);
 assert.match(main,/MRLTwoWayWorkflow\?\.audit/);
 assert.match(main,/SYNC UNVERIFIED/);
 assert.match(main,/result\.live\?/);
 assert(!/POST|PATCH|DELETE/.test(source));
});
test('R2.5 works on build artifacts without changing Supabase Auth/RLS and excludes preview-only assets properly',()=>{
 const prod=read('scripts/build-production.py'),preview=read('scripts/build-preview.py');
 assert(prod.includes('"owner-two-way-workflow.js"'));
 assert(preview.includes("'owner-two-way-workflow.js'"));
 assert(!source.includes('supabase.auth'));
 assert(!source.includes('Bearer '));
});
