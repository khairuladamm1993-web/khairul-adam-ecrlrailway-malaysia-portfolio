'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),assert=require('node:assert/strict');
module.exports=async function({api,anon,service,call,must,sql,mail,results}){
 const {chromium,webkit}=require(process.env.R22_PLAYWRIGHT_MODULE),origin='https://127.0.0.1:8767';
 const sdk=path.join(path.dirname(process.env.R22_PLAYWRIGHT_MODULE),'@supabase/supabase-js/dist/umd/supabase.js');
 assert(fs.existsSync(sdk),'PINNED_REAL_SDK_REQUIRED');
 sql("create table if not exists public.member_profiles (user_id uuid primary key, email text, role text, enabled boolean, activity_consent_at timestamptz, privacy_version text); alter table public.member_profiles enable row level security; create policy recovery_own_profile on public.member_profiles for select to authenticated using (user_id = auth.uid()); grant select on public.member_profiles to authenticated; notify pgrst,'reload schema'");
 await new Promise(r=>setTimeout(r,1000));
 const app=fs.readFileSync('dist-auth-recovery/assets/access.js','utf8').replace("const PROJECT_URL='https://kfudisbzdgsefdjoopzu.supabase.co';",'const PROJECT_URL='+JSON.stringify(origin+'/sb')+';').replace(/const PUBLISHABLE_KEY='[^']+';/,'const PUBLISHABLE_KEY='+JSON.stringify(anon)+';');
 let otpRequests=0;
 const server=https.createServer({key:fs.readFileSync('/tmp/r22-https-key.pem'),cert:fs.readFileSync('/tmp/r22-https-cert.pem')},async(q,r)=>{
  if(q.url.startsWith('/sb/')){
   if(q.method==='POST'&&q.url.startsWith('/sb/auth/v1/otp'))otpRequests++;
   // HTTPS browser transport to the REAL local GoTrue/PostgREST, never a mocked response.
   try{let raw='';for await(const chunk of q)raw+=chunk;const upstream=await fetch(api+q.url.slice(3),{method:q.method,headers:{apikey:q.headers.apikey||anon,...(q.headers.authorization?{Authorization:q.headers.authorization}:{}),'Content-Type':q.headers['content-type']||'application/json'},...(raw?{body:raw}:{}),redirect:'manual'});r.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store',...(upstream.headers.get('location')?{Location:upstream.headers.get('location')}:{})});r.end(await upstream.text())}catch{r.writeHead(502);r.end('TEST_TRANSPORT_FAILED')}return;
  }
  r.setHeader('Cache-Control','no-store');
  if(q.url==='/sdk.js'){r.setHeader('Content-Type','text/javascript');r.end(fs.readFileSync(sdk));return}
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
  }}finally{await b.close()}
 }}finally{await new Promise(r=>server.close(r))}
};
