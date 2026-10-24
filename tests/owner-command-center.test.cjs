const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(base,f),'utf8');
const registry=JSON.parse(read('data/owner-project-registry.json'));
const source=read('assets/owner-command-center.js');
const page=read('owner-command-center.html');

test('registry has exactly three independent project tracks and future two-product state',()=>{
 assert.equal(registry.schemaVersion,'1.0.0');
 assert.deepEqual(registry.projects.map(p=>p.id),['portfolio','web-simulator','swift-app']);
 assert.equal(registry.consolidation.currentProducts,3);
 assert.equal(registry.consolidation.futureProducts,2);
 assert.match(registry.consolidation.threshold,/only after/i);
});
test('Owner registry contains evidence provenance and never claims every source live',()=>{
 for(const p of registry.projects){
  assert(p.nextDecision);
  for(const f of p.facts)assert(f.verifiedOn && f.confidence);
 }
 assert.equal(registry.sources.find(s=>s.id==='github').sync,'live-on-open');
 assert.equal(registry.sources.find(s=>s.id==='vercel').sync,'snapshot');
 assert.equal(registry.sources.find(s=>s.id==='swift').sync,'checkpoint');
 assert.equal(registry.sources.find(s=>s.id==='chatgpt').sync,'verified-checkpoint');
 assert.equal(registry.projects.find(p=>p.id==='web-simulator').overall,'BLOCKED');
});
test('public registry does not contain credentials, login identities or auth tokens',()=>{
 const payload=JSON.stringify(registry);
 assert.doesNotMatch(payload,/"(?:service_role|secret|password|token|apiKey|privateKey)"\s*:/i);
 assert.doesNotMatch(payload,/eyJhbGciOiJ|sb_secret_/);
});
test('Owner dashboard loads real access layer, no mock role selector',()=>{
 assert.match(page,/<script src="assets\/access\.js"><\/script>/);
 assert.match(page,/<script defer src="assets\/owner-command-center\.js"><\/script>/);
 assert.match(source,/A\.canAdmin/);
 assert.match(source,/A\.status==='authenticated'/);
 assert.doesNotMatch(source,/localStorage|sessionStorage|role=admin|user_metadata/);
});
test('dashboard offers read-only refresh and never writes or deploys',()=>{
 assert.match(source,/fetch\('data\/owner-project-registry\.json'/);
 assert.match(source,/https:\/\/api\.github\.com\/repos\//);
 assert.doesNotMatch(source,/\bPOST\b|\bPATCH\b|\bDELETE\b|deployments\/create|create_deployment/);
});
function fixture(level='public'){
 const nodes=new Map(),listeners={};let requests=0;
 const element=()=>({
  hidden:false,disabled:false,textContent:'',dataset:{},childNodes:[],classList:{add(){}},
  addEventListener(name,cb){this['on'+name]=cb;},append(...a){this.childNodes.push(...a);},
  replaceChildren(...a){this.childNodes=a;},setAttribute(){},
 });
 const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},
  createElement:element,addEventListener(n,cb){listeners['document:'+n]=cb},hidden:false};
 const access={status:level==='admin'?'authenticated':'public',canAdmin:level==='admin'};
 const window={RailwayAccess:access,addEventListener(n,cb){listeners[n]=cb}};
 const fetch=async url=>{
  requests++;
  if(String(url).includes('owner-project-registry.json'))return{ok:true,json:async()=>registry};
  return{ok:true,json:async()=>({sha:'a'.repeat(40),html_url:'https://github.com/example/commit',commit:{committer:{date:'2026-10-25T00:00:00Z'},message:'Commit check'}})};
 };
 vm.runInNewContext(source,{window,document:doc,fetch,Intl,Date,console,URL,Promise});
 return {doc,nodes,access,listeners,get requests(){return requests}};
}
test('Public and ordinary Member do not trigger project registry or GitHub fetch',async()=>{
 for(const level of ['public','member']){
  const f=fixture(level);
  await new Promise(r=>setTimeout(r,5));
  assert.equal(f.requests,0);
  assert.equal(f.nodes.get('dashboard').hidden,true);
  assert.equal(f.nodes.get('auth-gate').hidden,false);
 }
});
test('Admin fetches evidence, never grants or modifies backend role',async()=>{
 const f=fixture('admin');
 await new Promise(r=>setTimeout(r,20));
 assert.equal(f.nodes.get('dashboard').hidden,false);
 assert(f.requests>=3); // registry + two public GitHub refs
 assert.equal(f.nodes.get('project-count').textContent,'3');
 assert.equal(f.nodes.get('future-count').textContent,'2');
 f.access.canAdmin=false;f.access.status='public';f.listeners['railway-access-change']();
 assert.equal(f.nodes.get('dashboard').hidden,true);
});
test('Admin link only appears behind server-authorized canAdmin rendering',()=>{
 const ui=read('assets/member-gateway.js');
 assert.match(ui,/A\.canAdmin\?'<button class="primary" data-admin-dashboard>/);
 assert.match(ui,/owner-command-center\.html/);
});
