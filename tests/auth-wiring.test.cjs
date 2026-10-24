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
function makeClient({session={access_token:'x'},exchangeSession=null,exchangeError=null,exchangeThrow=null,user={id:'11111111-1111-4111-8111-111111111111',email:'member@example.com'},role='member',profile={data:{email:'member@example.com',enabled:true,activity_consent_at:null},error:null},rpcError=null,otpError=null,otpVerifyError=null}={}){
 const calls=[];let activeSession=session,authHandler=null;
 const client={
  calls,
  auth:{
   async getSession(){return {data:{session:activeSession},error:null}},
   async getUser(){return user?{data:{user},error:null}:{data:{user:null},error:{message:'invalid'}}},
   onAuthStateChange(cb){authHandler=cb;calls.push(['onAuthStateChange']);return {data:{subscription:{unsubscribe(){}}}}},
   async exchangeCodeForSession(code){if(exchangeThrow)throw new Error(exchangeThrow);calls.push(['exchangeCodeForSession',code]);if(exchangeError)return {data:{session:null},error:exchangeError};activeSession=exchangeSession||{access_token:'callback',expires_at:Math.floor(Date.now()/1000)+3600};return {data:{session:activeSession},error:null}},
   async signInWithOtp(args){calls.push(['signInWithOtp',args]);return {error:otpError}},
   async verifyOtp(args){calls.push(['verifyOtp',args]);if(otpVerifyError)return {data:{session:null},error:otpVerifyError};activeSession={access_token:'verified-otp',expires_at:Math.floor(Date.now()/1000)+3600};return {data:{session:activeSession},error:null}},
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
 const client=options.client||makeClient(options);
 const events=[];
 const window={MRS10AuthPilot:options.otpPilot?{emailOtp:true}:undefined,supabase:{createClient(url,key,config){client.calls.push(['createClient',config]);return client}},dispatchEvent(e){events.push(e)},addEventListener(){},removeEventListener(){}};
 const document={readyState:'complete',addEventListener(){}};
 const location={origin:options.origin||'https://preview.example',pathname:options.pathname||'/gateway.html',search:options.locationSearch||'',hash:options.locationHash||''};
 const history={replaceState(){location.search='';location.hash='';}};
 const context={window,document,location,history,URLSearchParams,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},setTimeout,clearTimeout,console};
 vm.createContext(context);vm.runInContext(source,context);
 await new Promise(r=>setTimeout(r,5));
 return {A:window.RailwayAccess,client,events,location};
}
test('no session resolves Public and never unlocks protected content',async()=>{
 const {A}=await load({session:null});
 assert.equal(A.level,'public');assert.equal(A.canReadMemberContent,false);assert.equal(A.canAdmin,false);
});
test('invalid session fails closed to Public',async()=>{
 const {A}=await load({user:null});
 assert.equal(A.level,'public');assert.equal(A.status,'get-user-failed');assert.equal(A.canReadMemberContent,false);
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
 assert(memberSource.includes('Public</span><button class="member-entry"'));
 assert(memberSource.includes('Sign-in could not be completed'));
 assert(memberSource.includes('role="alert"'));
 assert(memberSource.includes('includes(A.status)'));
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
 assert(member.includes("['initializing','exchanging-code','restoring-session','validating-user','role-pending','verifying-otp'].includes(A.status)"));
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


test('thrown exchange errors are sanitized and callback credentials removed',async()=>{
 const {A,location}=await load({session:null,locationSearch:'?code=sensitive-code',exchangeThrow:'unexpected sensitive-code access_token=secret'});
 assert.equal(A.level,'public');
 assert.equal(A.status,'pkce-exchange-failed');
 assert.equal(location.search,'');
 assert(!/sensitive-code|access_token|secret/.test(A.error));
});
test('error-only fragment is visible and removed, with no exchange',async()=>{
 const {A,client,location}=await load({session:null,locationHash:'#error=access_denied'});
 assert.equal(A.status,'verification-failed');
 assert.equal(location.hash,'');
 assert(!client.calls.some(x=>x[0]==='exchangeCodeForSession'));
});
test('unsupported token fragment fails closed and removes credentials',async()=>{
 const {A,location}=await load({session:null,locationHash:'#access_token=secret&refresh_token=private'});
 assert.equal(A.status,'verification-failed');
 assert.equal(A.level,'public');
 assert.equal(location.hash,'');
 assert(!/secret|private/.test(A.error));
});
test('Yahoo-style confirmed signup callback gets Member only and survives refresh in mock',async()=>{
 const {A,client}=await load({session:null,role:'member',locationSearch:'?code=signup-code'});
 assert.equal(A.level,'member');
 await A.refresh();
 assert.equal(A.level,'member');
 assert.equal(A.canAdmin,false);
 await assert.rejects(()=>A.adminSummary(),/Admin access required/);
 assert(!client.calls.some(x=>x[0]==='signInWithOtp'));
});
test('expired callback cannot authorize member',async()=>{
 const {A,location}=await load({session:null,locationSearch:'?code=expired-code',exchangeError:{message:'invalid code: expired'}});
 assert.equal(A.status,'verification-failed');
 assert.equal(A.canReadMemberContent,false);
 assert.equal(location.search,'');
});

const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}};
test('sign-out during role hydration cannot restore stale Admin access',async()=>{
 const {A,client}=await load({role:'admin'}),gate=deferred(),entered=deferred();
 const rpc=client.rpc;
 client.rpc=async(name,args)=>{if(name==='account_role'){entered.resolve();await gate.promise;}return rpc(name,args);};
 const refresh=A.refresh();await entered.promise;await A.logout();gate.resolve();await refresh;
 assert.equal(A.level,'public');assert.equal(A.status,'signed-out');assert.equal(A.cachedData,null);
});
test('protected bundle finishing after sign-out is discarded',async()=>{
 const {A,client}=await load(),gate=deferred();const from=client.from;
 client.from=name=>name==='quiz_banks'?builder(gate.promise):from(name);
 const request=A.fetchMemberBundle();await A.logout();gate.resolve({data:[{id:'private-bank'}],error:null});
 await assert.rejects(()=>request,/session|access/i);assert.equal(A.cachedData,null);
});
test('backend auth errors never expose raw credentials or identity in access state',async()=>{
 for(const stage of ['getSession','getUser','role','profile']){
  const {A,client}=await load();const error={message:'credential=private-token member@example.com'};
  if(stage==='getSession')client.auth.getSession=async()=>({data:{session:null},error});
  if(stage==='getUser')client.auth.getUser=async()=>({data:{user:null},error});
  if(stage==='role')client.rpc=async()=>({data:null,error});
  if(stage==='profile')client.from=()=>builder({data:null,error});
  await A.refresh();assert.equal(A.level,'public');assert.doesNotMatch(A.error,/private-token|member@example/);
 }
});
test('invalid email is visible and makes no OTP request',async()=>{
 const {A,client}=await load({session:null});await assert.rejects(()=>A.sendMagicLink('bad address'));
 assert.equal(A.status,'auth-error');assert.match(A.error,/valid email/i);
 assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,0);
});
test('a repeated sent-link request does not replace the pending PKCE verifier',async()=>{
 const {A,client}=await load({session:null});await A.sendMagicLink('member@example.com');await A.sendMagicLink('member@example.com');
 assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,1);
});
test('rate-limited access-layer requests do not send another OTP',async()=>{
 const {A,client}=await load({session:null,otpError:{status:429,message:'email rate limit exceeded'}});
 await assert.rejects(()=>A.sendMagicLink('member@example.com'));await assert.rejects(()=>A.sendMagicLink('member@example.com'));
 assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,1);
});
test('approved automatic onboarding remains explicit; no email grants a role',async()=>{
 const {A,client}=await load({session:null});await A.sendMagicLink('new@example.com');
 assert.equal(client.calls.find(c=>c[0]==='signInWithOtp')[1].options.shouldCreateUser,true);
 assert.equal(A.level,'public');assert.equal(A.canAdmin,false);
});
test('an expired stored session is refreshed before validating the user',async()=>{
 const {A,client}=await load();let refreshed=0;
 client.auth.getSession=async()=>({data:{session:{access_token:'expired',expires_at:1}},error:null});
 client.auth.refreshSession=async()=>{refreshed++;return {data:{session:{access_token:'renewed'}},error:null}};
 client.auth.getUser=async token=>{assert.equal(token,'renewed');return {data:{user:{id:'member-id'}},error:null}};
 await A.refresh();assert.equal(refreshed,1);assert.equal(A.level,'member');
 client.auth.refreshSession=async()=>({data:{session:null},error:{message:'expired'}});
 await A.refresh();assert.equal(A.status,'session-expired');assert.equal(A.level,'public');
});

async function gateway(options={}){
 const {JSDOM}=require('jsdom');
 const dom=new JSDOM(fs.readFileSync(path.join(root,'gateway.html'),'utf8'),{url:'https://preview.example/gateway.html',runScripts:'outside-only'});
 const w=dom.window,client=makeClient(options);
 w.supabase={createClient:()=>client};w.RailwayTheme={value:'light',toggle(){}};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.Railway={html:s=>String(s),text:s=>String(s),escape:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),language:'en',onLanguage(){}};
 w.RailwayModulePreviews=[];w.RailwayInsights=[];
 for(const file of ['access.js','public-gateway.js','member-gateway.js'])w.eval(fs.readFileSync(path.join(root,'assets',file),'utf8'));
 await new Promise(r=>setTimeout(r,25));
 return {dom,w,client,A:w.RailwayAccess};
}
test('Gateway removes protected DOM and quiz controls immediately on session loss',async()=>{
 const {dom,w,A}=await gateway();
 try{
  assert.match(w.document.querySelector('#gateway-status').textContent,/Verified Member/);
  w.document.querySelector('#gateway-content').innerHTML='<p>PRIVATE-CONTENT</p>';
  await A.logout();
  assert.doesNotMatch(w.document.querySelector('#gateway-content').textContent,/PRIVATE-CONTENT/);
  assert.equal(w.document.querySelector('#start-quiz').hidden,true);
  assert.match(w.document.querySelector('#gateway-status').textContent,/Public/);
 }finally{w.close()}
});
test('mismatched email confirmation sends no OTP and preserves entered address',async()=>{
 const {dom,w,client}=await gateway({session:null});
 try{
  w.document.querySelector('[data-member]').click();
  const form=w.document.querySelector('#member-auth-form');
  form.elements.email.value='member@example.com';
  assert(form.elements.email_confirm,'Confirmation field required before sending');
  form.elements.email_confirm.value='typo@example.com';
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await new Promise(r=>setTimeout(r,10));
  assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,0);
  assert.match(w.document.querySelector('#member-dialog').textContent,/addresses do not match/i);
  assert.equal(w.document.querySelector('[name=email]').value,'member@example.com');
 }finally{w.close()}
});
test('confirmed email retains automatic registration policy and sends once via Gateway',async()=>{
 const {w,client}=await gateway({session:null});
 try{
  w.document.querySelector('[data-member]').click();const form=w.document.querySelector('#member-auth-form');
  form.elements.email.value=' New@Example.com ';assert(form.elements.email_confirm);
  form.elements.email_confirm.value='new@example.com';
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await new Promise(r=>setTimeout(r,10));
  assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,1);
  assert.match(w.document.querySelector('#member-dialog').textContent,/Check your email/);
 }finally{w.close()}
});
test('protected table rejection fails closed and never caches raw error or data',async()=>{
 const {A,client}=await load();const from=client.from;
 client.from=name=>name==='quiz_banks'?builder({data:null,error:{message:'private-token member@example.com'}}):from(name);
 await assert.rejects(()=>A.fetchMemberBundle(),/securely/);
 assert.equal(A.level,'public');assert.equal(A.cachedData,null);assert.doesNotMatch(A.error,/private-token|member@example/);
});
test('thrown OTP transport error leaves sending state with sanitized actionable feedback',async()=>{
 const {A,client}=await load({session:null});
 client.auth.signInWithOtp=async()=>{throw new Error('Network failed: private-token member@example.com')};
 await assert.rejects(()=>A.sendMagicLink('member@example.com'),error=>!error.message.includes('private-token'));
 assert.equal(A.status,'auth-network-error');assert.doesNotMatch(A.error,/private-token|member@example/);
});
test('fresh page restores SDK-held session and revalidates role without another email',async()=>{
 const first=await load({role:'member'});const next=await load({client:first.client});
 const config=first.client.calls.find(c=>c[0]==='createClient')[1].auth;
 assert.equal(config.persistSession,true);assert.equal(config.autoRefreshToken,true);assert.equal(config.flowType,'pkce');
 assert.equal(next.A.level,'member');assert.equal(next.A.canAdmin,false);
 assert.equal(first.client.calls.filter(c=>c[0]==='signInWithOtp').length,0);
 assert.equal(first.client.calls.filter(c=>c[0]==='rpc'&&c[1]==='account_role').length,2);
});
test('profile role or owner-like email cannot elevate server Member role',async()=>{
 const {A}=await load({role:'member',user:{id:'member-id',email:'owner@example.com'},profile:{data:{role:'admin',enabled:true},error:null}});
 assert.equal(A.level,'member');assert.equal(A.canAdmin,false);
 for(const call of [()=>A.adminSummary(),()=>A.fetchAdminData(),()=>A.adminSetMemberEnabled('another-id',true),()=>A.adminSaveContent({}),()=>A.adminPublishLocation({}),()=>A.adminRestoreLocation(1,'test')])await assert.rejects(call,/Admin access required/);
});
test('SIGNED_IN arriving during an older empty-session read is revalidated after it completes',async()=>{
 const {A,client}=await load({session:null}),gate=deferred(),entered=deferred();let reads=0;
 client.auth.getSession=async()=>{if(++reads===1){entered.resolve();await gate.promise;return {data:{session:null},error:null}}return {data:{session:{access_token:'new-session'}},error:null}};
 const older=A.refresh();await entered.promise;client.auth.emit('SIGNED_IN',{access_token:'new-session'});
 await new Promise(r=>setTimeout(r,5));gate.resolve();await older;
 await new Promise(r=>setTimeout(r,10));assert.equal(A.level,'member');assert.equal(A.status,'authenticated');
});
test('a queued auth event cannot rehydrate after a newer sign-out',async()=>{
 const {A,client}=await load({role:'admin'}),gate=deferred(),entered=deferred();let reads=0;
 client.auth.getSession=async()=>{reads++;entered.resolve();await gate.promise;return {data:{session:{access_token:'stale'}},error:null}};
 const pending=A.refresh();await entered.promise;client.auth.emit('TOKEN_REFRESHED',{access_token:'stale'});
 await new Promise(r=>setTimeout(r,5));client.auth.emit('SIGNED_OUT',null);gate.resolve();await pending;
 await new Promise(r=>setTimeout(r,10));assert.equal(reads,1);assert.equal(A.level,'public');assert.equal(A.status,'signed-out');
});


test('OTP pilot is OFF by default on all existing builds',async()=>{
 const {A}=await load({session:null});
 assert.equal(A.emailOtpEnabled,false);
 await assert.rejects(()=>A.verifyEmailOtp('member@example.com','123456'),/not enabled/);
});
test('OTP pilot grants Member only after verified session and backend role',async()=>{
 const {A,client}=await load({session:null,role:'member',otpPilot:true});
 await A.sendMagicLink('newmember@example.com');
 const result=await A.verifyEmailOtp('newmember@example.com','123456');
 assert.equal(result.level,'member');assert.equal(result.canAdmin,false);
 const v=client.calls.find(c=>c[0]==='verifyOtp');assert(v);
 assert.equal(v[1].type,'email');assert.equal(v[1].email,'newmember@example.com');
 assert(client.calls.some(c=>c[0]==='rpc'&&c[1]==='account_role'));
 assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,1);
});
test('OTP pilot gives mapped Owner Admin only via backend role',async()=>{
 const {A,client}=await load({session:null,role:'admin',otpPilot:true});
 await A.sendMagicLink('owner@example.com');
 await A.verifyEmailOtp('owner@example.com','654321');
 assert.equal(A.canAdmin,true);
 assert(client.calls.some(c=>c[0]==='rpc'&&c[1]==='account_role'));
});
test('OTP pilot rejects malformed codes without calling verify endpoint',async()=>{
 const {A,client}=await load({session:null,otpPilot:true});
 await A.sendMagicLink('member@example.com');
 await assert.rejects(()=>A.verifyEmailOtp('member@example.com','1234'),/six-digit/);
 assert.equal(A.level,'public');
 assert.equal(client.calls.filter(c=>c[0]==='verifyOtp').length,0);
});
test('OTP pilot expired code fails closed, preserves email and prevents duplicate send',async()=>{
 const {A,client}=await load({session:null,otpPilot:true,otpVerifyError:{message:'Token invalid'}});
 await A.sendMagicLink('member@example.com');
 await assert.rejects(()=>A.verifyEmailOtp('member@example.com','123456'),/invalid|expired/);
 assert.equal(A.canReadMemberContent,false);assert.equal(A.canAdmin,false);
 assert.equal(A.status,'otp-verification-failed');assert.equal(A.email,'member@example.com');
 assert.equal(client.calls.filter(c=>c[0]==='signInWithOtp').length,1);
});
test('OTP pilot verified email cannot bypass missing server Member role',async()=>{
 const {A}=await load({session:null,role:'public',otpPilot:true});
 await A.sendMagicLink('unapproved@example.com');
 await assert.rejects(()=>A.verifyEmailOtp('unapproved@example.com','123456'),/not authorized/);
 assert.equal(A.level,'public');assert.equal(A.canAdmin,false);
});
test('OTP pilot prevents verification without matching requested email',async()=>{
 const {A,client}=await load({session:null,otpPilot:true});
 await A.sendMagicLink('member@example.com');
 await assert.rejects(()=>A.verifyEmailOtp('other@example.com','123456'),/Request email verification/);
 assert.equal(client.calls.filter(c=>c[0]==='verifyOtp').length,0);
});
