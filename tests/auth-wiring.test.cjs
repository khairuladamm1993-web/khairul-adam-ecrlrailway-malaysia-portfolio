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
function makeClient({session={access_token:'x'},exchangeSession=null,exchangeError=null,user={id:'11111111-1111-4111-8111-111111111111',email:'member@example.com'},role='member',profile={data:{email:'member@example.com',enabled:true,activity_consent_at:null},error:null},rpcError=null,otpError=null}={}){
 const calls=[];let activeSession=session,authHandler=null;
 const client={
  calls,
  auth:{
   async getSession(){return {data:{session:activeSession},error:null}},
   async getUser(){return user?{data:{user},error:null}:{data:{user:null},error:{message:'invalid'}}},
   onAuthStateChange(cb){authHandler=cb;calls.push(['onAuthStateChange']);return {data:{subscription:{unsubscribe(){}}}}},
   async exchangeCodeForSession(code){calls.push(['exchangeCodeForSession',code]);if(exchangeError)return {data:{session:null},error:exchangeError};activeSession=exchangeSession||{access_token:'callback',expires_at:Math.floor(Date.now()/1000)+3600};return {data:{session:activeSession},error:null}},
   async signInWithOtp(args){calls.push(['signInWithOtp',args]);return {error:otpError}},
   async signOut(args){calls.push(['signOut',args]);activeSession=null;authHandler?.('SIGNED_OUT',null);return {error:null}},
   emit(event,nextSession=activeSession){authHandler?.(event,nextSession)}
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
 const location={origin:options.origin||'https://preview.example',pathname:options.pathname||'/gateway.html',search:options.locationSearch||'',hash:options.locationHash||''};
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


test('concurrent Magic Link requests are deduplicated',async()=>{
 const {A,client}=await load({session:null,user:null});
 const p1=A.sendMagicLink('member@example.com');
 const p2=A.sendMagicLink('member@example.com');
 await Promise.all([p1,p2]);
 assert.equal(client.calls.filter(x=>x[0]==='signInWithOtp').length,1);
 assert.equal(A.status,'verification-sent');
});

test('precise Supabase retry hint is preserved when provided',async()=>{
 const {A}=await load({session:null,user:null,otpError:{status:429,message:'For security purposes, you can only request this after 16 seconds.'}});
 await assert.rejects(()=>A.sendMagicLink('member@example.com'));
 assert.equal(A.status,'rate-limited');
 assert.equal(A.retryAfterSeconds,16);
 assert.match(A.error,/16 seconds/);
 await A.refresh();
 assert.equal(A.status,'rate-limited');
 assert.equal(A.retryAfterSeconds,16);
});

test('generic email quota 429 does not invent a retry countdown',async()=>{
 const {A}=await load({session:null,user:null,otpError:{status:429,message:'email rate limit exceeded',code:'over_email_send_rate_limit'}});
 await assert.rejects(()=>A.sendMagicLink('member@example.com'));
 assert.equal(A.status,'rate-limited');
 assert.equal(A.retryAfterSeconds,null);
 assert.equal(A.error,'Too many verification requests. Please wait before requesting another link.');
});

test('stale or expired Magic Link callback fails closed with useful message',async()=>{
 const {A}=await load({session:null,user:null,locationSearch:'?error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'});
 assert.equal(A.level,'public');
 assert.equal(A.status,'verification-failed');
 assert.equal(A.canReadMemberContent,false);
 assert.match(A.error,/expired|already been used/i);
});


test('Public and Member cannot read Admin analytics while Admin can reach protected read path',async()=>{
 const pub=await load({session:null});
 await assert.rejects(()=>pub.A.adminSummary(),/Admin access required/);
 await assert.rejects(()=>pub.A.fetchAdminData(),/Admin access required/);
 const member=await load({role:'member'});
 await assert.rejects(()=>member.A.adminSummary(),/Admin access required/);
 await assert.rejects(()=>member.A.fetchAdminData(),/Admin access required/);
 const admin=await load({role:'admin'});
 const summary=await admin.A.adminSummary();
 assert.equal(summary.members,1);
 await admin.A.fetchAdminData();
 assert(admin.client.calls.some(x=>x[0]==='from'&&x[1]==='public_analytics_snapshots'));
});

test('client-side role tampering cannot mutate frozen RailwayAccess authorization state',async()=>{
 const member=await load({role:'member'});
 assert.equal(Object.isFrozen(member.A),true);
 assert.equal(member.A.canAdmin,false);
 try{member.A.canAdmin=true;}catch{}
 try{member.A.level='admin';}catch{}
 assert.equal(member.A.canAdmin,false);
 assert.equal(member.A.level,'member');
 await assert.rejects(()=>member.A.adminSummary(),/Admin access required/);
});


test('Magic Link uses the exact runtime-origin gateway callback with no Production hardcode',async()=>{
 const {A,client}=await load({session:null,user:null,origin:'https://khairul-adam-portfolio-preview-safe-g02iyscec.vercel.app'});
 await A.sendMagicLink('owner@example.com');
 const call=client.calls.find(x=>x[0]==='signInWithOtp');
 assert(call);
 assert.equal(call[1].options.emailRedirectTo,'https://khairul-adam-portfolio-preview-safe-g02iyscec.vercel.app/gateway.html');
 assert(!call[1].options.emailRedirectTo.includes('github.io'));
});

test('PKCE callback exchanges code before role hydration and resolves Owner as Admin',async()=>{
 const {A,client}=await load({session:null,exchangeSession:{access_token:'callback',expires_at:Math.floor(Date.now()/1000)+3600},role:'admin',locationSearch:'?code=fresh-preview-code'});
 assert.equal(A.level,'admin');
 assert.equal(A.status,'authenticated');
 assert.equal(A.canAdmin,true);
 const exchangeIndex=client.calls.findIndex(x=>x[0]==='exchangeCodeForSession');
 const roleIndex=client.calls.findIndex(x=>x[0]==='rpc'&&x[1]==='account_role');
 assert(exchangeIndex>=0&&roleIndex>exchangeIndex);
});

test('PKCE callback failure is distinct and fail-closed',async()=>{
 const {A}=await load({session:null,user:null,exchangeError:{message:'PKCE code verifier not found'},locationSearch:'?code=bad-code'});
 assert.equal(A.level,'public');
 assert.equal(A.canAdmin,false);
 assert.equal(A.status,'pkce-exchange-failed');
 assert.match(A.error,/callback|verification link/i);
});

test('Admin session refresh persistence re-runs backend role resolution without new Magic Link',async()=>{
 const {A,client}=await load({role:'admin'});
 const beforeOtp=client.calls.filter(x=>x[0]==='signInWithOtp').length;
 const beforeRole=client.calls.filter(x=>x[0]==='rpc'&&x[1]==='account_role').length;
 await A.refresh();
 assert.equal(A.level,'admin');
 assert.equal(A.canAdmin,true);
 assert.equal(client.calls.filter(x=>x[0]==='signInWithOtp').length,beforeOtp);
 assert(client.calls.filter(x=>x[0]==='rpc'&&x[1]==='account_role').length>beforeRole);
});

test('auth state events hydrate signed-in sessions and SIGNED_OUT removes Admin',async()=>{
 const {A,client}=await load({role:'admin'});
 assert.equal(A.level,'admin');
 client.auth.emit('TOKEN_REFRESHED');
 await new Promise(r=>setTimeout(r,5));
 assert.equal(A.level,'admin');
 client.auth.emit('SIGNED_OUT',null);
 assert.equal(A.level,'public');
 assert.equal(A.status,'signed-out');
 assert.equal(A.canAdmin,false);
});

test('Verified Member login copy is secure and contains no IC/passport wording',()=>{
 const member=fs.readFileSync(path.join(root,'assets/member-gateway.js'),'utf8');
 assert(member.includes('Secure email verification'));
 assert(member.includes('Enter your email to receive a secure verification link.'));
 assert(member.includes('SEND VERIFICATION LINK'));
 assert(member.includes('Access is granted after successful email verification.'));
 assert(!/IC or passport|passport is required/i.test(member));
});


test('post-verify hydration keeps authenticated callback pending until role resolution completes',()=>{
 const member=fs.readFileSync(path.join(root,'assets/member-gateway.js'),'utf8');
 const access=fs.readFileSync(path.join(root,'assets/access.js'),'utf8');
 assert(member.includes("['initializing','exchanging-code','restoring-session','validating-user','role-pending'].includes(A.status)"));
 assert(member.includes('CHECKING VERIFIED SESSION…'));
 assert(access.includes("set({status:'validating-user'"));
 assert(access.includes("set({status:'role-pending'"));
 assert(access.indexOf("getUser(liveSession.access_token)")<access.indexOf("rpc('account_role')"));
});

test('public gateway renderer cannot overwrite authenticated role status',()=>{
 const publicGateway=fs.readFileSync(path.join(root,'assets/public-gateway.js'),'utf8');
 assert(publicGateway.includes("if(!window.RailwayAccess)document.querySelector('#gateway-status').innerHTML"));
});

test('disabled profile fails closed even when backend role string is admin',async()=>{
 const {A}=await load({role:'admin',profile:{data:{email:'owner@example.com',enabled:false,activity_consent_at:null},error:null}});
 assert.equal(A.level,'public');
 assert.equal(A.canAdmin,false);
 assert.equal(A.status,'role-denied');
});

test('session hydration is serialized to avoid concurrent role races',()=>{
 assert(source.includes('hydrationPromise'));
 assert(source.includes('if(hydrationPromise)return hydrationPromise'));
 assert(source.includes('finally{hydrationPromise=null;}'));
});
