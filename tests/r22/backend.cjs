'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),https=require('node:https');
const {createHandler,pack,COOKIE}=require('../../server/auth-r2/core.cjs');
const status=JSON.parse(cp.execFileSync(process.env.SUPABASE_BINARY,['status','--output','json'],{cwd:process.env.R22_STACK_DIR,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const api=status.API_URL,anon=status.ANON_KEY,service=status.SERVICE_ROLE_KEY,db=status.DB_URL,mail=status.INBUCKET_URL||status.MAILPIT_URL||'http://127.0.0.1:54324';
assert(api?.startsWith('http://127.0.0.1:')&&db?.includes('127.0.0.1'),'LOCAL_ONLY');assert(anon&&service,'LOCAL_KEYS_NOT_AVAILABLE');
const results=[];const check=(name,fn)=>Promise.resolve().then(fn).then(()=>{results.push({name,status:'PASS'});console.log('PASS '+name)});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function call(path,token,body,key=anon){const r=await fetch(api+path,{method:body?'POST':'GET',headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=null}return {status:r.status,data}}
const must=r=>{if(r.status<200||r.status>=300)throw Object.assign(Error('REAL_PROVIDER_REQUEST_REJECTED'),{status:r.status,code:'REAL_PROVIDER_REQUEST_REJECTED'});return r.data};
const sql=text=>{try{return cp.execFileSync('psql',[db,'-v','ON_ERROR_STOP=1','-q','-c',text],{stdio:['ignore','pipe','pipe']})}catch(e){throw Error('LOCAL_SQL_FAILED: '+String(e.stderr||'').slice(0,350))}};
function totp(secret){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=/g,''))bits+=alphabet.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from((bits.match(/.{8}/g)||[]).map(b=>parseInt(b,2))),counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=crypto.createHmac('sha1',bytes).update(counter).digest(),o=h.at(-1)&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
async function otp(email){must(await call('/auth/v1/otp',null,{email,create_user:false}));for(let n=0;n<40;n++){const list=await (await fetch(mail+'/api/v1/messages')).json();for(const m of list.messages||[]){if(!(m.To||[]).some(t=>t.Address===email))continue;const item=await (await fetch(mail+'/api/v1/message/'+m.ID)).json();const code=(item.Text||item.HTML||'').match(/MR-S10-OTP:\s*(\d{6})/);if(code)return code[1]}await wait(250)}throw Error('LOCAL_MAIL_OTP_NOT_FOUND')}
const verify=(email,code)=>call('/auth/v1/verify',null,{email,token:code,type:'email'});
async function mfa(session){const factor=must(await call('/auth/v1/factors',session.access_token,{factor_type:'totp',friendly_name:'R22 synthetic'})),c=must(await call('/auth/v1/factors/'+factor.id+'/challenge',session.access_token,{}));return must(await call('/auth/v1/factors/'+factor.id+'/verify',session.access_token,{challenge_id:c.id,code:totp(factor.totp.secret)}))}
const provider={user:async t=>must(await call('/auth/v1/user',t)),role:async t=>must(await call('/rest/v1/rpc/account_role',t,{})),ownerContext:async t=>must(await call('/rest/v1/rpc/owner_private_context_r2',t,{})),privateOp:async(t,b)=>must(await call('/rest/v1/rpc/owner_private_operation_r2',t,{request:b})),refresh:async refresh_token=>must(await call('/auth/v1/token?grant_type=refresh_token',null,{refresh_token})),logout:async t=>must(await call('/auth/v1/logout?scope=local',t,{}))};
const key=crypto.randomBytes(32),origin='https://127.0.0.1:8767',handler=createHandler({provider,key,origin,enabled:true});
const req=(s,op)=>({url:'/api/auth-r2?action=private',method:'POST',headers:{origin,'content-type':'application/json',cookie:s?COOKIE+'='+pack(s,key):''},body:op});
async function browserQA(member){
 const {chromium,webkit}=require(process.env.R22_PLAYWRIGHT_MODULE);
 const server=https.createServer({key:fs.readFileSync('/tmp/r22-https-key.pem'),cert:fs.readFileSync('/tmp/r22-https-cert.pem')},async(q,r)=>{
  const url=new URL(q.url,origin);
  if(url.pathname==='/api/auth-r2'){let raw='';for await(const c of q)raw+=c;const out=await handler({url:q.url,method:q.method,headers:q.headers,body:raw?JSON.parse(raw):{}});r.writeHead(out.status,{...out.headers,...(out.cookies?.length?{'Set-Cookie':out.cookies}:{})});r.end(JSON.stringify(out.body));return}
  const path=require('node:path'),file=path.resolve('dist-auth-r2','.'+url.pathname);if(!file.startsWith(path.resolve('dist-auth-r2')+path.sep)||!fs.existsSync(file)){r.writeHead(404);r.end();return}r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');r.setHeader('Cache-Control','no-store');r.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(8767,'127.0.0.1',resolve));let n=0;
 try{for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch(name==='chromium'?{executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']}:{headless:true});
  try{for(const [device,width,height] of [['desktop',1180,820],['ipad',820,1100],['iphone',390,844]]){
   const email='owner-browser-'+(++n)+'@r22.example.test',u=must(await call('/auth/v1/admin/users',service,{email,email_confirm:true,password:crypto.randomBytes(24).toString('base64url')},service));assert(/^[0-9a-f-]{36}$/.test(u.id));sql("insert into app_private.r22_roles values('"+u.id+"','admin')");
   const session=await mfa(must(await verify(email,await otp(email))));
   const ctx=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height},hasTouch:device!=='desktop'});
   const seed=s=>ctx.addCookies([{name:COOKIE,value:pack(s,key),url:origin,httpOnly:true,secure:true,sameSite:'Lax'}]);
   try{await seed(session);const page=await ctx.newPage();await page.goto(origin+'/auth-private-r2.html');await page.locator('#room').waitFor({state:'visible'});
    const rpc=b=>page.evaluate(async b=>{const r=await fetch('/api/auth-r2?action=private',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return {status:r.status,data:await r.json(),cache:r.headers.get('Cache-Control')}},b);
    assert.equal((await rpc({op:'put',store:'settings',key:'browser-canary',value:{note:'SYNTHETIC_BROWSER_OWNER'}})).status,200);
    await page.reload();await page.locator('#room').waitFor({state:'visible'});assert.equal((await rpc({op:'get',store:'settings',key:'browser-canary'})).data.value.note,'SYNTHETIC_BROWSER_OWNER');
    assert.deepEqual(await page.evaluate(async()=>({db:(await indexedDB.databases()).length,local:Object.keys(localStorage).filter(k=>k!=='railway-theme'),cache:await caches.keys()})),{db:0,local:[],cache:[]});
    const otherTab=await ctx.newPage();await otherTab.goto(origin+'/auth-private-r2.html');await otherTab.locator('#room').waitFor({state:'visible'});await page.locator('#logout').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Sesi ditutup'));await otherTab.locator('#room').waitFor({state:'hidden'});
    assert.equal((await rpc({op:'get',store:'settings',key:'browser-canary'})).status,401);
    await seed(member);await page.reload();await page.waitForFunction(()=>window.MRS10AuthR2.snapshot()?.role==='member');assert.equal(await page.locator('#room').isVisible(),false);const denied=await rpc({op:'get',store:'settings',key:'browser-canary'});assert.equal(denied.status,403);assert(!JSON.stringify(denied.data).includes('SYNTHETIC_BROWSER_OWNER'));assert.match(denied.cache,/no-store/);
    results.push({name:'REAL_BROWSER_PRIVACY_'+name+'_'+device,status:'PASS',credentialSetup:'Real email OTP and GoTrue MFA; validated session inserted as encrypted HttpOnly test cookie; login form submission not covered'});console.log('PASS REAL_BROWSER_PRIVACY_'+name+'_'+device);
   }finally{await ctx.close()}
  }}finally{await browser.close()}
 }}finally{await new Promise(resolve=>server.close(resolve))}
}
(async()=>{try{
 sql(fs.readFileSync('tests/r22/baseline.sql','utf8'));sql(fs.readFileSync('db/proposals/p01-auth-private-r2.sql','utf8'));
 sql("notify pgrst,'reload schema'");await wait(1000);
 const users={};for(const role of ['owner','member','otherowner']){const email=role+'@r22.example.test';users[role]=must(await call('/auth/v1/admin/users',service,{email,email_confirm:true,password:crypto.randomBytes(24).toString('base64url')},service));}
 sql("insert into app_private.r22_roles select id,case when email='member@r22.example.test' then 'member' else 'admin' end from auth.users where email like '%@r22.example.test'");
 let owner,member,other;
 await check('REAL_EMAIL_OTP_WRONG_AND_REPLAY_REJECTED',async()=>{const email=users.owner.email,code=await otp(email);assert.equal((await verify(email,code.slice(0,5)+(code[5]==='0'?'1':'0'))).status,403);owner=must(await verify(email,code));assert((await verify(email,code)).status>=400)});
 await check('REAL_EMAIL_OTP_EXPIRED_REJECTED',async()=>{const email=users.member.email,code=await otp(email);await wait(6100);assert((await verify(email,code)).status>=400);await wait(1100);member=must(await verify(email,await otp(email)))});
 other=must(await verify(users.otherowner.email,await otp(users.otherowner.email)));
 const ownerFirst=owner;owner=await mfa(owner);other=await mfa(other);
 await check('REAL_MFA_AAL2_AND_ACTIVE_SESSION',async()=>{assert.equal(must(await call('/rest/v1/rpc/owner_private_context_r2',owner.access_token,{})),true)});
 const record={op:'put',store:'settings',key:'owner-canary',value:{classification:'OWNER_PRIVATE',note:'SYNTHETIC_R22_CANARY'}};assert.equal((await handler(req(owner,record))).status,200);
 const read={op:'get',store:'settings',key:'owner-canary'};
 await check('ISOLATION_1_PUBLIC_API_DENIED',async()=>assert.equal((await handler(req(null,read))).status,401));
 await check('ISOLATION_2_MEMBER_API_DENIED',async()=>assert.equal((await handler(req(member,read))).status,403));
 await check('ISOLATION_3_OWNER_AAL1_DENIED',async()=>assert.equal((await handler(req(ownerFirst,read))).status,403));
 await check('ISOLATION_4_OTHER_OWNER_RLS_DENIED',async()=>assert.equal((await handler(req(other,read))).body.value,null));
 await check('ISOLATION_5_DIRECT_DATABASE_API_RLS',async()=>{for(const token of [null,member.access_token,ownerFirst.access_token,other.access_token]){const r=await call('/rest/v1/p01_owner_private_r2?select=body',token);assert(!JSON.stringify(r.data).includes('SYNTHETIC_R22_CANARY'));assert(r.status>=200&&r.status<300||r.status===401||r.status===403)}});
 await check('REAL_REFRESH_RECOVERS_SAME_OWNER_DATA',async()=>{owner=await provider.refresh(owner.refresh_token);const r=await handler(req(owner,read));assert.equal(r.body.value.note,'SYNTHETIC_R22_CANARY');assert.match(r.headers['Cache-Control'],/no-store/)});
 await check('ISOLATION_6_LOGOUT_AND_MEMBER_SWITCH_DENIED',async()=>{await provider.logout(owner.access_token);const r=await handler(req(owner,read));assert([401,403].includes(r.status));assert.equal((await handler(req(member,read))).status,403)});
 await browserQA(member);
 const report={backend:'REAL_LOCAL_SUPABASE_DOCKER',mock:false,results,physicalSafari:'NOT_RUN',browser:'REAL_BACKEND_6_SCENARIOS',release:'NO-GO_PHYSICAL_OWNER_UAT_PENDING'};
 fs.writeFileSync('/tmp/r22-real-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## P01 R2.2 real backend\n'+results.map(x=>'- PASS '+x.name).join('\n')+'\nNo mock provider. Physical Safari NOT RUN.\n');
 }catch(e){console.error('REAL_BACKEND_QA_FAIL: '+(e.code||e.message||e.name).replace(/eyJ[\w.-]+/g,'[REDACTED]').slice(0,200));process.exitCode=1}})();
