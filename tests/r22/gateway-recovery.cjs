'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),assert=require('node:assert/strict');
module.exports=async function({api,anon,service,call,must,sql,mail,results}){
 const {chromium,webkit}=require(process.env.R22_PLAYWRIGHT_MODULE),origin='https://127.0.0.1:8767';
 const sdk=path.join(path.dirname(process.env.R22_PLAYWRIGHT_MODULE),'@supabase/supabase-js/dist/umd/supabase.js');
 assert(fs.existsSync(sdk),'PINNED_REAL_SDK_REQUIRED');
 sql("create table if not exists public.member_profiles (user_id uuid primary key, email text, role text, enabled boolean, activity_consent_at timestamptz, privacy_version text); alter table public.member_profiles enable row level security; create policy recovery_own_profile on public.member_profiles for select to authenticated using (user_id = auth.uid()); grant select on public.member_profiles to authenticated; notify pgrst,'reload schema'");
 await new Promise(r=>setTimeout(r,1000));
 const app=fs.readFileSync('dist-auth-recovery/assets/access.js','utf8').replace("const PROJECT_URL='https://kfudisbzdgsefdjoopzu.supabase.co';",'const PROJECT_URL='+JSON.stringify(origin+'/sb')+';').replace(/const PUBLISHABLE_KEY='[^']+';/,'const PUBLISHABLE_KEY='+JSON.stringify(anon)+';').replace("u.origin!==PROJECT_URL","u.origin!==new URL(PROJECT_URL).origin").replace("u.pathname!=='/auth/v1/verify'","!['/auth/v1/verify','/sb/auth/v1/verify'].includes(u.pathname)");
 let otpRequests=0,proofRequests=0;
 sql("alter table public.member_profiles add column display_name text, add column last_member_activity timestamptz; create table public.member_content(id text,kind text,title jsonb,body jsonb,evidence text,approved boolean,updated_at timestamptz); create table public.quiz_banks(id text,title jsonb,bank jsonb,approved boolean,updated_at timestamptz); create table public.member_files(id text,bucket_id text,object_path text,approved boolean,artwork_signature text); create table public.member_progress(resource_id text,position numeric,completed boolean,updated_at timestamptz); create table public.quiz_attempts(id text,client_attempt_id uuid,modules text[],score integer,passed boolean,attempted_at timestamptz);");
 for(const table of ['member_content','quiz_banks','member_files','member_progress','quiz_attempts'])sql('alter table public.'+table+' enable row level security; grant select on public.'+table+' to authenticated');
 sql("notify pgrst,'reload schema'");await new Promise(r=>setTimeout(r,500));
 const server=https.createServer({key:fs.readFileSync('/tmp/r22-https-key.pem'),cert:fs.readFileSync('/tmp/r22-https-cert.pem')},async(q,r)=>{
  if(q.url.startsWith('/sb/')){
   if(q.method==='POST'&&q.url.startsWith('/sb/auth/v1/otp'))otpRequests++;
   if(q.method==='POST'&&q.url.startsWith('/sb/auth/v1/verify'))proofRequests++;
   // HTTPS browser transport to the REAL local GoTrue/PostgREST, never a mocked response.
   try{let raw='';for await(const chunk of q)raw+=chunk;const upstream=await fetch(api+q.url.slice(3),{method:q.method,headers:{apikey:q.headers.apikey||anon,...(q.headers.authorization?{Authorization:q.headers.authorization}:{}),'Content-Type':q.headers['content-type']||'application/json'},...(raw?{body:raw}:{}),redirect:'manual'});r.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store',...(upstream.headers.get('location')?{Location:upstream.headers.get('location')}:{})});r.end(await upstream.text())}catch{r.writeHead(502);r.end('TEST_TRANSPORT_FAILED')}return;
  }
  r.setHeader('Cache-Control','no-store');
  if(q.url==='/sdk.js'){r.setHeader('Content-Type','text/javascript');r.end(fs.readFileSync(sdk));return}
  if(q.url==='/member.js'){r.setHeader('Content-Type','text/javascript');r.end(fs.readFileSync('assets/member-gateway.js'));return}
  if(q.url==='/gateway.css'){r.setHeader('Content-Type','text/css');r.end(fs.readFileSync('assets/gateway.css'));return}
  if(q.url==='/recovery-ui.html'){r.setHeader('Content-Type','text/html');r.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/gateway.css"></head><body><div id="gateway-status"></div><nav id="categories"><button data-category="practical" aria-selected="true">Practical</button></nav><div id="gateway-content"></div><script>window.Railway={language:'en',html:s=>s,escape:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;'),onLanguage:()=>{}};window.RailwayTheme={value:'dark',toggle:()=>{}};</script><script src="/sdk.js"></script><script src="/access.js"></script><script src="/member.js"></script></body></html>`);return}
  if(q.url==='/access.js'){r.setHeader('Content-Type','text/javascript');r.end(app);return}
  r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body><p>Real SDK + GoTrue callback integration fixture</p><script src="/sdk.js"></script><script src="/access.js"></script></body></html>');
 });await new Promise(r=>server.listen(8767,'127.0.0.1',r));
 async function latestLink(email){
  for(let i=0;i<20;i++){
   const list=await(await fetch(mail+'/api/v1/messages')).json();
   for(const m of list.messages||[]){if(!(m.To||[]).some(x=>x.Address===email))continue;
    const item=await(await fetch(mail+'/api/v1/message/'+m.ID)).json(),link=(item.HTML||'').match(/href="([^"]+)"/);
    if(link)return link[1].replaceAll('&amp;','&');
   }await new Promise(r=>setTimeout(r,100));
  }throw Error('SYNTHETIC_LINK_NOT_FOUND');
 }
 let count=0;
 try{for(const [name,driver]of [['chromium',chromium],['webkit',webkit]]){
  const b=await driver.launch(name==='chromium'?{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}:{headless:true});
  try{for(const [device,width,height]of [['ipad',820,1100],['iphone',390,844]]){
   const email='gateway-recovery-'+(++count)+'@r23.example.test',u=must(await call('/auth/v1/admin/users',service,{email,email_confirm:true},service));assert(/^[0-9a-f-]{36}$/.test(u.id));
   sql("insert into app_private.r22_roles values('"+u.id+"','admin'); insert into public.member_profiles(user_id,email,role,enabled)values('"+u.id+"','"+email+"','admin',true)");
   const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width,height},hasTouch:true});
   try{const p=await ctx.newPage();const beforeSend=otpRequests;
    await p.goto(origin+'/gateway.html');await p.waitForFunction(()=>window.RailwayAccess?.status==='public');
    await p.evaluate(e=>RailwayAccess.sendMagicLink(e),email);assert.equal(otpRequests-beforeSend,1,'ONE_REAL_OTP_REQUEST');
    const tab=await ctx.newPage();await tab.goto(origin+'/gateway.html');await tab.waitForFunction(()=>window.RailwayAccess?.status==='public');
    const beforeDuplicate=otpRequests;
    await tab.evaluate(e=>RailwayAccess.sendMagicLink(e),email);assert.equal(otpRequests,beforeDuplicate,'CROSS_TAB_PENDING_REQUEST_MUST_NOT_RESEND');
    // Follow the actual one-time GoTrue verification in the ORIGINAL browser context.
    const mailLink=await latestLink(email);assert(mailLink.startsWith(api+'/'));await p.goto(origin+'/sb'+mailLink.slice(api.length));await p.waitForFunction(()=>window.RailwayAccess?.canAdmin===true&&window.RailwayAccess.status==='authenticated');
    assert.equal(new URL(p.url()).origin,origin,'CALLBACK_ORIGIN');assert.equal(new URL(p.url()).search,'','CALLBACK_CREDENTIALS_CLEARED');
    await p.evaluate(()=>Promise.all([RailwayAccess.init(),RailwayAccess.init()]));
    await p.reload();await p.waitForFunction(()=>window.RailwayAccess?.canAdmin===true&&window.RailwayAccess.status==='authenticated');
    assert.equal(await p.evaluate(()=>RailwayAccess.status),'authenticated','RESTORED_STATUS');
    await p.evaluate(()=>RailwayAccess.logout());assert.equal(await p.evaluate(()=>RailwayAccess.canAdmin),false,'LOGOUT_REVOKES_ADMIN');
    await tab.waitForFunction(()=>window.RailwayAccess?.canReadMemberContent===false);
    const item={name:'REAL_GATEWAY_PKCE_'+name+'_'+device,status:'PASS',scope:'real SDK, original browser Magic Link, duplicate tab suppression, backend role/profile RLS, reload and logout; synthetic identity'};results.push(item);console.log('PASS '+item.name);
   }finally{await ctx.close()}
   // A fresh email is requested in context A; actual UI in context B has NO PKCE verifier.
   for(const mode of ['link','otp']){
    const proofEmail='proof-'+name+'-'+device+'-'+mode+'@r25.example.test';
    const proofUser=must(await call('/auth/v1/admin/users',service,{email:proofEmail,email_confirm:true},service));assert(/^[0-9a-f-]{36}$/.test(proofUser.id));
    const role=mode==='link'?'admin':'member';sql("insert into app_private.r22_roles values('"+proofUser.id+"','"+role+"'); insert into public.member_profiles(user_id,email,role,enabled)values('"+proofUser.id+"','"+proofEmail+"','"+role+"',true)");
    const requestContext=await b.newContext({ignoreHTTPSErrors:true});const recoveryContext=await b.newContext({ignoreHTTPSErrors:true,viewport:{width,height},hasTouch:true});
    try{
     const originPage=await requestContext.newPage();await originPage.goto(origin+'/recovery-ui.html');await originPage.waitForFunction(()=>window.RailwayAccess?.status==='public');await originPage.locator('[data-member]').click();assert.equal(await originPage.locator('[name=email_confirm]').count(),0);await originPage.locator('#member-auth-form [name=email]').fill(proofEmail);const beforeUIRequest=otpRequests;await originPage.locator('#member-auth-form button').click();await originPage.locator('#member-email-proof-form').waitFor({state:'visible'});assert.equal(otpRequests-beforeUIRequest,1,'ONE_REAL_UI_EMAIL_REQUEST');assert.equal(await originPage.locator('[name=proof_email]').inputValue(),proofEmail,'EMAIL_PREFILLED');
     const link=await latestLink(proofEmail);let proof=link.replace(api,origin+'/sb');
     if(mode==='otp'){
      const list=await(await fetch(mail+'/api/v1/messages')).json();const message=list.messages.find(m=>(m.To||[]).some(t=>t.Address===proofEmail));const content=await(await fetch(mail+'/api/v1/message/'+message.ID)).json();proof=(content.Text||content.HTML).match(/MR-S10-OTP:\s*(\d{6})/)[1];
     }
     const recovery=await recoveryContext.newPage();await recovery.goto(origin+'/recovery-ui.html');await recovery.waitForFunction(()=>window.RailwayAccess?.status==='public');
     await recovery.locator('[data-member]').click();await recovery.locator('[data-auth-proof]').click();await recovery.locator('#member-email-proof-form').waitFor({state:'visible'});
     const before=proofRequests;await recovery.locator('[name=proof_email]').fill(proofEmail);await recovery.locator('[name=email_proof]').fill(proof);await recovery.locator('#member-email-proof-form button').click();
     await recovery.waitForFunction(()=>window.RailwayAccess?.status==='authenticated');assert.equal(proofRequests-before,1,'ONE_REAL_EMAIL_PROOF_VERIFY');
     assert.equal(await recovery.evaluate(()=>RailwayAccess.level),role);assert.equal(await recovery.evaluate(()=>RailwayAccess.canAdmin),role==='admin');
     await recovery.locator('[data-auth-refresh]').click();await recovery.waitForFunction(()=>document.querySelector('#session-check-result')?.textContent.includes('Sesi disahkan:'));assert.equal(await recovery.locator('[name=email_proof]').count(),0,'PROOF_REMOVED_FROM_DOM');assert.equal(await recovery.evaluate(s=>JSON.stringify(localStorage).includes(s),proof),false,'PROOF_NOT_PERSISTED');
     await recovery.reload();await recovery.waitForFunction(()=>window.RailwayAccess?.status==='authenticated');await recovery.locator('[data-member]').click();await recovery.locator('[data-logout]').click();await recovery.waitForFunction(()=>!window.RailwayAccess?.canReadMemberContent);await recovery.locator('[data-auth-proof]').click();const beforeSessionCheck=otpRequests;await recovery.locator('[data-auth-refresh]').click();await recovery.waitForFunction(()=>document.querySelector('#session-check-result')?.textContent.includes('Belum ada sesi login sah'));assert.equal(otpRequests,beforeSessionCheck,'SESSION_CHECK_NEVER_SENDS_EMAIL');
     await recovery.evaluate(async({email,proof})=>{try{await RailwayAccess.verifyEmailProof(email,proof)}catch{}},{email:proofEmail,proof});assert.equal(await recovery.evaluate(()=>RailwayAccess.canReadMemberContent),false,'REPLAY_DENIED');
     const item={name:'REAL_CROSS_BROWSER_EMAIL_'+mode+'_'+name+'_'+device,status:'PASS',scope:'actual recovery form, real GoTrue OTP/hash verification, independent browser context, backend identity/role, reload/logout/replay'};results.push(item);console.log('PASS '+item.name);proof=null;
    }finally{await requestContext.close();await recoveryContext.close()}
   }
  }}finally{await b.close()}
 }}finally{await new Promise(r=>server.close(r))}
};
