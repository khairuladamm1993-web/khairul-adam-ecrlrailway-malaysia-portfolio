const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/access.js'),'utf8');

function builder(result={data:[],error:null}){
 const b={select(){return b},eq(){return b},order(){return b},limit(){return b},maybeSingle(){return Promise.resolve(result)}};
 b.then=(resolve)=>Promise.resolve(result).then(resolve);
 return b;
}
function makeClient({session={access_token:'x'},user={id:'11111111-1111-4111-8111-111111111111',email:'member@example.com'},role='member',profile={data:{email:'member@example.com',activity_consent_at:null},error:null},rpcError=null}={}){
 const calls=[];
 const client={
  calls,
  auth:{
   async getSession(){return {data:{session},error:null}},
   async getUser(){return user?{data:{user},error:null}:{data:{user:null},error:{message:'invalid'}}},
   onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
   async signInWithOtp(args){calls.push(['signInWithOtp',args]);return {error:null}},
   async signOut(args){calls.push(['signOut',args]);return {error:null}}
  },
  async rpc(name,args){calls.push(['rpc',name,args]);if(rpcError)return {data:null,error:{message:rpcError}};if(name==='account_role')return {data:role,error:null};if(name==='admin_summary')return {data:{members:1},error:null};if(name==='submit_quiz')return {data:{score:12,passed:true},error:null};return {data:null,error:null}},
  from(name){
   calls.push(['from',name]);
   if(name==='member_profiles')return builder(profile);
   return builder({data:[],error:null});
  },
  storage:{from(){return {async createSignedUrl(){return {data:{signedUrl:'https://example.invalid/signed'},error:null}}}}}
 };
 return client;
}
async function load(options={}){
 const client=makeClient(options);
 const events=[];
 const window={supabase:{createClient(){return client}},dispatchEvent(e){events.push(e)},addEventListener(){},removeEventListener(){}};
 const document={readyState:'complete',addEventListener(){}};
 const location={origin:'https://preview.example',pathname:'/gateway.html',search:'',hash:''};
 const history={replaceState(){}};
 const context={window,document,location,history,URLSearchParams,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},setTimeout,clearTimeout,console};
 vm.createContext(context);vm.runInContext(source,context);
 await new Promise(r=>setTimeout(r,5));
 return {A:window.RailwayAccess,client,events};
}
test('no session resolves Public and never unlocks protected content',async()=>{
 const {A}=await load({session:null});
 assert.equal(A.level,'public');assert.equal(A.canReadMemberContent,false);assert.equal(A.canAdmin,false);
});
test('invalid session fails closed to Public',async()=>{
 const {A}=await load({user:null});
 assert.equal(A.level,'public');assert.equal(A.status,'invalid-session');assert.equal(A.canReadMemberContent,false);
});
test('server member role unlocks member only',async()=>{
 const {A}=await load({role:'member'});
 assert.equal(A.level,'member');assert.equal(A.canReadMemberContent,true);assert.equal(A.canAdmin,false);
});
test('server admin role unlocks admin capability',async()=>{
 const {A}=await load({role:'admin'});
 assert.equal(A.level,'admin');assert.equal(A.canReadMemberContent,true);assert.equal(A.canAdmin,true);
});
test('session profile lookup is scoped to authenticated user',async()=>{
 const {client}=await load({role:'admin'});
 assert(source.includes(".eq('user_id',userId).maybeSingle()"));
 assert(client.calls.some(x=>x[0]==='from'&&x[1]==='member_profiles'));
});

test('admin RPC is denied to member and allowed to admin',async()=>{
 const member=await load({role:'member'});
 await assert.rejects(()=>member.A.adminSummary(),/Admin access required/);
 const admin=await load({role:'admin'});
 const summary=await admin.A.adminSummary();
 assert.equal(summary.members,1);
});
test('logout clears access back to Public',async()=>{
 const {A,client}=await load({role:'member'});await A.logout();
 assert.equal(A.level,'public');assert.equal(A.canReadMemberContent,false);
 assert(client.calls.some(x=>x[0]==='signOut'));
});
test('quiz persistence uses submit_quiz RPC and no direct table write',async()=>{
 const {A,client}=await load({role:'member'});
 const result=await A.submitQuiz('00000000-0000-4000-8000-000000000001',['cr200j'],Array.from({length:16},(_,i)=>({module:'cr200j',question:'q'+i,answer:0})));
 assert.equal(result.score,12);
 const call=client.calls.find(x=>x[0]==='rpc'&&x[1]==='submit_quiz');assert(call);assert.equal(call[2].p_answers.length,16);
 assert(!/\.from\(['"]quiz_attempts['"]\)\.(insert|update|upsert)/.test(source));
});
test('saved progress uses save_progress RPC',async()=>{
 const {A,client}=await load({role:'member'});await A.saveProgress('cr200j',8,false);
 const call=client.calls.find(x=>x[0]==='rpc'&&x[1]==='save_progress');assert(call);assert.equal(call[2].p_resource,'cr200j');
});
test('engagement requires explicit consent before record_engagement RPC',async()=>{
 const {A,client}=await load({role:'member'});
 await assert.rejects(()=>A.recordEngagement('00000000-0000-4000-8000-000000000002','practical',0,10,8),/consent/i);
 assert(!client.calls.some(x=>x[0]==='rpc'&&x[1]==='record_engagement'));
 await A.setActivityConsent(true);
 await A.recordEngagement('00000000-0000-4000-8000-000000000002','practical',0,10,8);
 assert(client.calls.some(x=>x[0]==='rpc'&&x[1]==='set_activity_consent'));
 assert(client.calls.some(x=>x[0]==='rpc'&&x[1]==='record_engagement'));
});
test('role RPC error fails closed',async()=>{
 const {A}=await load({role:'member',rpcError:'denied'});
 assert.equal(A.level,'public');assert.equal(A.canReadMemberContent,false);assert.equal(A.canAdmin,false);
});
test('auth wiring uses only publishable browser key and server role resolution',()=>{
 assert(source.includes('sb_publishable_'));assert(!/service_role|service-role|secret_key/.test(source));
 assert(source.includes("rpc('account_role')"));assert(!/localStorage.*role|URLSearchParams.*role/.test(source));
});

test('member gateway resets public header and cleans engagement lifecycle',()=>{
 const memberSource=fs.readFileSync(path.join(root,'assets/member-gateway.js'),'utf8');
 assert(memberSource.includes("else el.innerHTML='<span class=\"access-label\">Public</span>"));
 assert(memberSource.includes("removeEventListener(event,handler)"));
 assert(memberSource.includes("addEventListener('pagehide',state.pagehide)"));
 assert(memberSource.includes("document.addEventListener('visibilitychange',state.visibility)"));
 assert(memberSource.includes("Rolling Stock Library"));
 assert(memberSource.includes("A.saveProgress(save.dataset.saveResource,1,true)"));
 assert(memberSource.includes("await stopTracker(true);await A.logout()"));
});
