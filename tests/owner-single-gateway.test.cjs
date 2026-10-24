const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const script=read('assets/owner-center-shortcut.js');
const gateway=read('gateway.html');
const dashboard=read('owner-command-center.html');
function setup(initial){
 const listeners={};
 const shortcut={
  hidden:true,attrs:{'aria-hidden':'true',tabindex:'-1'},
  setAttribute(n,v){this.attrs[n]=v;},
  removeAttribute(n){delete this.attrs[n];}
 };
 const window={RailwayAccess:initial||{canAdmin:false,status:'public'},
  addEventListener(n,f){listeners[n]=f;}};
 const document={hidden:false,getElementById(id){return id==='owner-center-shortcut'?shortcut:null},
  addEventListener(n,f){listeners[n]=f;}};
 vm.runInNewContext(script,{window,document,console});
 return {window,shortcut,listeners};
}
test('MR-S10 Gateway includes only same-origin Owner Dashboard path and no demo domain',()=>{
 assert.match(gateway,/id="owner-center-shortcut"[^>]*href="owner-command-center\.html"/);
 assert.match(gateway,/assets\/owner-center-shortcut\.js/);
 assert.match(gateway,/assets\/member-gateway\.js/);
 assert(gateway.indexOf('assets/member-gateway.js')<gateway.indexOf('assets/owner-center-shortcut.js'));
 assert.doesNotMatch(gateway,/mrls10-command-center-r1-demo\.vercel\.app/);
 assert.match(dashboard,/assets\/access\.js/);
 assert.match(dashboard,/id="auth-gate"/);
 assert.match(dashboard,/id="dashboard" hidden/);
});
test('Public, Member and initializing Owner never see or focus Owner shortcut',()=>{
 for(const state of [
  {canAdmin:false,status:'public'},
  {canAdmin:false,status:'authenticated'},
  {canAdmin:true,status:'initializing'}
 ]){
  const f=setup(state);
  assert.equal(f.shortcut.hidden,true);
  assert.equal(f.shortcut.attrs.tabindex,'-1');
 }
});
test('Only live Supabase Admin role exposes shortcut and revokes it on logout',()=>{
 const f=setup({canAdmin:true,status:'authenticated'});
 assert.equal(f.shortcut.hidden,false);
 assert.equal(f.shortcut.attrs['aria-hidden'],'false');
 assert.equal(f.shortcut.attrs.tabindex,undefined);
 f.window.RailwayAccess={canAdmin:false,status:'public'};
 f.listeners['railway-access-change']();
 assert.equal(f.shortcut.hidden,true);
 assert.equal(f.shortcut.attrs.tabindex,'-1');
 f.window.RailwayAccess={canAdmin:true,status:'authenticated'};
 f.listeners.pageshow();
 assert.equal(f.shortcut.hidden,false);
});
test('Owner Dashboard independently denies non-Admin users and keeps source evidence public-safe',()=>{
 const owner=read('assets/owner-command-center.js');
 assert.match(owner,/A\.canAdmin&&A\.status==='authenticated'/);
 assert.match(owner,/dashboard\.hidden=true/);
 assert.match(owner,/Registry LIVE from/);
 const production=read('scripts/build-production.py');
 const preview=read('scripts/build-preview.py');
 assert(production.includes('"owner-center-shortcut.js"'));
 assert(preview.includes("'owner-center-shortcut.js'"));
 assert(read('assets/gateway.css').includes('.owner-center-shortcut[hidden]'));
});
test('Owner module is within MR-S10 repository and does not provide auto deploy or Supabase changes',()=>{
 const js=read('assets/owner-center-shortcut.js');
 assert.doesNotMatch(js,/signInWithOtp|service_role|sb_secret_|deploy|supabase\.auth/);
 assert.match(read('assets/owner-issue-handoff.js'),/owner-r23-verified-checkpoint-sync/);
 assert.match(dashboard,/No deploy, database writes or approval actions/);
});
