const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/owner-command-center.js'),'utf8');
const registry=JSON.parse(fs.readFileSync(path.join(root,'data/owner-project-registry.json'),'utf8'));
const policy=require('../assets/owner-checkpoint-policy.js');
const modern=JSON.parse(JSON.stringify(registry));
const p=modern.projects.find(p=>p.id==='web-simulator');
const issue=p.issues.find(i=>i.id==='slice1-preview');
p.nextDecision='Owner already reviewed Activity Log and Billing; no repeat diagnosis.';
issue.detail='Latest owner-review verified checkpoint, not old snapshot.';
issue.latestDiagnosis.nextAction='No repeat; only missing original pause event evidence.';
function fixture(fetchMode){
 const nodes=new Map(),events={};let rawCalls=0,apiCalls=0,localCalls=0,hubCalls=0;
 const element=()=>({
  hidden:false,disabled:false,textContent:'',dataset:{},style:{},childNodes:[],
  classList:{add(){}},
  addEventListener(n,f){this['on'+n]=f},append(...x){this.childNodes.push(...x)},
  replaceChildren(...x){this.childNodes=x;},
  setAttribute(){}
 });
 const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},
  createElement:element,addEventListener(n,f){events['doc:'+n]=f},hidden:false};
 const access={status:'authenticated',canAdmin:true};
 const handoff={renderActionHub(_data,host){hubCalls++;host.replaceChildren(element());},issueActions(){return element();}};
 const win={RailwayAccess:access,MRLCheckpointPolicy:policy,MRLIssueHandoff:handoff,addEventListener(n,f){events[n]=f}};
 const fetch=async url=>{
  const u=String(url);
  if(u.startsWith('https://api.github.com/repos/')&&u.includes('/contents/')){
   apiCalls++;
   if(fetchMode==='api')return {ok:true,json:async()=>({
    encoding:'base64',content:Buffer.from(JSON.stringify(modern)).toString('base64'),sha:'a'.repeat(40)
   })};
   return {ok:false,status:403};
  }
  if(u.startsWith('https://raw.githubusercontent.com/')){
   rawCalls++;
   return fetchMode==='raw'?{ok:true,json:async()=>modern}:{ok:false,status:503};
  }
  if(u==='data/owner-project-registry.json'){
   localCalls++;
   return {ok:true,json:async()=>registry};
  }
  if(u.includes('/commits/'))return {ok:true,json:async()=>({
   sha:'f'.repeat(40),html_url:'https://github.com/owner/repo/commit/example',
   commit:{committer:{date:'2026-10-25T00:00:00Z'},message:'Example'}
  })};
  if(u.includes('/actions/runs'))return {ok:true,json:async()=>({workflow_runs:[]})};
  throw Error('Unexpected '+u);
 };
 vm.runInNewContext(source,{window:win,document:doc,fetch,console,Promise,Date,Intl,URL,Uint8Array,TextDecoder,
  Buffer,atob,encodeURIComponent,setTimeout,clearTimeout});
 return {nodes,get apiCalls(){return apiCalls},get rawCalls(){return rawCalls},
  get localCalls(){return localCalls},get hubCalls(){return hubCalls}};
}
const settle=()=>new Promise(r=>setTimeout(r,50));
test('GitHub Contents LIVE loads newest checkpoint instead of packaged stale Registry',async()=>{
 const f=fixture('api');await settle();
 assert.equal(f.apiCalls,1);assert.equal(f.rawCalls,0);assert.equal(f.localCalls,0);
 const x=f.nodes.get('registry-sync-status');
 assert.equal(x.dataset.mode,'live');assert.match(x.textContent,/Contents API/);
 const projects=f.nodes.get('project-grid').childNodes;
 assert.equal(projects.length,3);
 const p02=projects.find(x=>x.childNodes.some(n=>n.textContent==='ECRL Web Simulator'));
 assert(p02);
 const txt=JSON.stringify(p02,(_key,val)=>typeof val==='function'?undefined:val);
 assert(txt.includes('Owner already reviewed'));
 assert(!txt.includes('Read Vercel project-paused Activity Log and account/spend status'));
});
test('GitHub API blocked: RAW backup loads updated checkpoint without bundled stale data',async()=>{
 const f=fixture('raw');await settle();
 assert.equal(f.apiCalls,1);assert.equal(f.rawCalls,1);assert.equal(f.localCalls,0);
 assert.equal(f.nodes.get('registry-sync-status').dataset.mode,'live');
 assert.match(f.nodes.get('registry-sync-status').textContent,/RAW/);
 assert.equal(f.hubCalls,1);
});
test('Both GitHub sources blocked: fallback is flagged stale and actions are suppressed',async()=>{
 const f=fixture('snapshot');await settle();
 assert.equal(f.apiCalls,1);assert.equal(f.rawCalls,1);assert.equal(f.localCalls,1);
 assert.equal(f.nodes.get('registry-sync-status').dataset.mode,'snapshot');
 assert.match(f.nodes.get('registry-sync-status').textContent,/SNAPSHOT STALE/);
 assert.equal(f.hubCalls,0);
 const cards=f.nodes.get('project-grid').childNodes;
 assert.equal(cards.length,3);
 assert(cards.every(card=>card.childNodes.some(n=>String(n.textContent).includes('SNAPSHOT ONLY'))));
 assert(cards.every(card=>!JSON.stringify(card,(_k,v)=>typeof v==='function'?undefined:v).includes('Selesaikan dengan ChatGPT')));
});
test('Snapshot stale handling does not mutate registry, deploy or create authorizations',()=>{
 assert.match(source,/raw\.githubusercontent\.com/);
 assert.match(source,/Live Registry temporarily unavailable/);
 assert.match(source,/if\(isLive\)window\.MRLIssueHandoff/);
 assert.doesNotMatch(source,/\bPOST\b|\bPATCH\b|\bDELETE\b/);
});
