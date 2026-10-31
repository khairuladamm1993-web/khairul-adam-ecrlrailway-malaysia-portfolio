'use strict';
const crypto=require('node:crypto');
const PROD='https://kfudisbzdgsefdjoopzu.supabase.co';
const COOKIE='__Host-mrs10-r2',PKCE='__Host-mrs10-r2-pkce';
const error=(status,code)=>Object.assign(new Error(code),{status,code});
const pack=(value,key)=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv),body=Buffer.concat([c.update(JSON.stringify(value)),c.final()]);return Buffer.concat([iv,c.getAuthTag(),body]).toString('base64url')};
const unpack=(value,key)=>{try{const b=Buffer.from(value,'base64url'),c=crypto.createDecipheriv('aes-256-gcm',key,b.subarray(0,12));c.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([c.update(b.subarray(28)),c.final()]))}catch{return null}};
const cookies=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
const cookie=(name,value,clear=false)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax${clear?'; Max-Age=0':''}`;
const jwt=token=>{try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url'))}catch{return {}}};
function createHandler({provider,key,origin,enabled=false,now=()=>Date.now()}){
 const seal=value=>cookie(COOKIE,pack(value,key)),clear=()=>[cookie(COOKIE,'',true),cookie(PKCE,'',true)];
 const session=req=>unpack(cookies(req)[COOKIE]||'',key);
 async function identityRaw(req){
  const s=session(req);if(!s?.access_token)throw error(401,'AUTH_REQUIRED');
  // Never authorize decoded claims until the same token has been verified by Auth.
  const user=await provider.user(s.access_token);if(!user?.id||!user.email_confirmed_at)throw error(401,'SESSION_REJECTED');
  const claims=jwt(s.access_token);if(claims.sub!==user.id||claims.exp*1000<=now())throw error(401,'SESSION_EXPIRED');
  const role=await provider.role(s.access_token);if(!['admin','member'].includes(role))throw error(403,'ACCOUNT_NOT_APPROVED');
  return {s,user,role,aal:claims.aal==='aal2'?'aal2':'aal1'};
 }
 async function identity(req){
  try{return await identityRaw(req)}catch(e){
   const old=session(req);if(e.status!==401||!old?.refresh_token)throw e;
   const next=await provider.refresh(old.refresh_token);if(!next?.access_token||!next.refresh_token)throw error(401,'SESSION_REJECTED');
   const renewed={access_token:next.access_token,refresh_token:next.refresh_token};
   const verified=await identityRaw({...req,headers:{...req.headers,cookie:COOKIE+'='+pack(renewed,key)}});
   req.rotationCookie=seal(renewed);return verified;
  }
 }
 const view=i=>({authenticated:true,role:i.role,ownerPrivate:i.role==='admin'&&i.aal==='aal2',mfaRequired:i.role==='admin'&&i.aal!=='aal2',email:i.user.email||null});
 async function execute(req){
  const action=new URL(req.url,origin).searchParams.get('action')||'session';
  if(req.method!=='GET'&&req.method!=='POST')throw error(405,'METHOD_NOT_ALLOWED');
  if(req.method==='POST'&&(req.headers.origin!==origin||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')))throw error(403,'SAME_ORIGIN_JSON_REQUIRED');
  if(action==='logout'){
   if(req.method!=='POST')throw error(405,'POST_REQUIRED');
   try{const s=session(req);if(s?.access_token)await provider.logout(s.access_token)}catch{}
   return {status:200,body:{status:'SIGNED_OUT'},cookies:clear()};
  }
  if(!enabled||!provider||!Buffer.isBuffer(key)||key.length!==32)throw error(503,'ISOLATED_AUTH_NOT_CONFIGURED');
  const b=req.body||{};
  if(['otp-request','magic-request'].includes(action)){
   if(req.method!=='POST')throw error(405,'POST_REQUIRED');
   if(typeof b.email!=='string'||b.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))throw error(400,'INVALID_EMAIL');
   const verifier=crypto.randomBytes(32).toString('base64url');
   await provider.request({email:b.email.trim().toLowerCase(),redirectTo:origin+'/api/auth-r2?action=callback',challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),mode:action==='magic-request'?'magic':'otp'});
   return {status:200,body:{status:'CHECK_EMAIL',expiresIn:300,rateLimit:'PROVIDER_ENFORCED'},cookies:[cookie(PKCE,pack({verifier,createdAt:now()},key))]};
  }
  if(action==='otp-verify'||action==='callback'){
   let s;
   if(action==='otp-verify'){
    if(req.method!=='POST')throw error(405,'POST_REQUIRED');
    if(typeof b.email!=='string'||!/^\d{6}$/.test(b.code||''))throw error(400,'INVALID_OTP_FORMAT');
    s=await provider.verify({email:b.email.trim().toLowerCase(),token:b.code});
   }else{
    const params=new URL(req.url,origin).searchParams,p=unpack(cookies(req)[PKCE]||'',key);
    if(!p?.verifier||now()-p.createdAt>300000||!params.get('code'))throw error(401,'PKCE_CALLBACK_REJECTED');
    s=await provider.exchange(params.get('code'),p.verifier);
   }
   if(!s?.access_token||!s.refresh_token)throw error(401,'SESSION_REJECTED');
   // Reject late sign-in responses after logout/account switch in the browser client.
   const result={status:200,body:{status:'VERIFIED'},cookies:[seal({access_token:s.access_token,refresh_token:s.refresh_token}),cookie(PKCE,'',true)]};
   if(action==='callback'){result.status=303;result.location='/auth-private-r2.html';result.body={status:'REDIRECT'}}
   return result;
  }
  if(action==='refresh'){
   if(req.method!=='POST')throw error(405,'POST_REQUIRED');const s=session(req);if(!s?.refresh_token)throw error(401,'AUTH_REQUIRED');
   const next=await provider.refresh(s.refresh_token);if(!next?.access_token||!next.refresh_token)throw error(401,'SESSION_REJECTED');
   return {status:200,body:{status:'REFRESHED'},cookies:[seal({access_token:next.access_token,refresh_token:next.refresh_token})]};
  }
  const i=await identity(req);
  if(action==='session'){if(i.role==='admin'&&i.aal==='aal2'&&await provider.ownerContext(i.s.access_token)!==true)throw error(403,'OWNER_SESSION_REJECTED');return {status:200,body:view(i)}};
  if(action.startsWith('mfa-')){
   if(i.role!=='admin')throw error(403,'OWNER_ONLY');
   if(action!=='mfa-factors'&&req.method!=='POST')throw error(405,'POST_REQUIRED');
   if(action==='mfa-factors')return {status:200,body:await provider.factors(i.s.access_token)};
   if(action==='mfa-enroll')return {status:200,body:await provider.enroll(i.s.access_token)};
   if(action==='mfa-verify'){
    if(!/^[A-Za-z0-9-]{1,100}$/.test(b.factorId||'')||!/^\d{6}$/.test(b.code||''))throw error(400,'INVALID_MFA_INPUT');
    const s=await provider.mfaVerify(i.s.access_token,b.factorId,b.code);
    if(!s?.access_token||!s.refresh_token)throw error(401,'MFA_REJECTED');
    return {status:200,body:{status:'MFA_VERIFIED'},cookies:[seal({access_token:s.access_token,refresh_token:s.refresh_token})]};
   }
   throw error(404,'UNKNOWN_ACTION');
  }
  if(action==='private'){
   if(i.role!=='admin'||i.aal!=='aal2')throw error(403,'OWNER_MFA_REQUIRED');
   // Backend RPC independently checks role, AAL and active session again in RLS.
   if(await provider.ownerContext(i.s.access_token)!==true)throw error(403,'OWNER_SESSION_REJECTED');
   if(req.method!=='POST')throw error(405,'POST_REQUIRED');
   const ops=['get','list','put','definition','save','claim','release','archive','migrate','bootstrap'];
   if(!ops.includes(b.op)||JSON.stringify(b).length>3000000)throw error(400,'INVALID_PRIVATE_OPERATION');
   const value=await provider.privateOp(i.s.access_token,b);return {status:200,body:{value}};
  }
  throw error(404,'UNKNOWN_ACTION');
 }
 return async function handle(req){
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  try{const result=await execute(req);if(req.rotationCookie)result.cookies=[...(result.cookies||[]),req.rotationCookie];return {...result,headers}}
  catch(e){const code=e.code||'UPSTREAM_UNAVAILABLE',status=e.status||503;return {status,headers,body:{status:code},cookies:[401].includes(status)?clear():[]}}
 };
}
function providerFromEnv(env,fetchImpl=fetch){
 const url=String(env.P01_R2_SUPABASE_URL||'').replace(/\/$/,'');
 if(!url||url===PROD||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!env.P01_R2_PUBLISHABLE_KEY)return null;
 async function call(path,token,body,method=body?'POST':'GET'){
  const r=await fetchImpl(url+path,{method,headers:{apikey:env.P01_R2_PUBLISHABLE_KEY,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw error(r.status===429?429:r.status===400||r.status===401?401:r.status===403?403:503,r.status===429?'PROVIDER_RATE_LIMITED':r.status===400||r.status===401?'VERIFICATION_REJECTED':r.status===403?'ACCESS_DENIED':'BACKEND_UNAVAILABLE');
  return r.status===204?{}:r.json();
 }
 return {
  request:({email,redirectTo,challenge})=>call('/auth/v1/otp?redirect_to='+encodeURIComponent(redirectTo),null,{email,create_user:false,code_challenge:challenge,code_challenge_method:'s256'}),
  verify:({email,token})=>call('/auth/v1/verify',null,{email,token,type:'email'}),
  exchange:(auth_code,code_verifier)=>call('/auth/v1/token?grant_type=pkce',null,{auth_code,code_verifier}),
  refresh:refresh_token=>call('/auth/v1/token?grant_type=refresh_token',null,{refresh_token}),
  user:t=>call('/auth/v1/user',t),role:t=>call('/rest/v1/rpc/account_role',t,{}),logout:t=>call('/auth/v1/logout?scope=local',t,{}),
  ownerContext:t=>call('/rest/v1/rpc/owner_private_context_r2',t,{}),privateOp:(t,b)=>call('/rest/v1/rpc/owner_private_operation_r2',t,{request:b}),
  factors:async t=>{const u=await call('/auth/v1/user',t);return {factors:(u.factors||[]).filter(f=>f.factor_type==='totp').map(f=>({id:f.id,status:f.status}))}},
  enroll:t=>call('/auth/v1/factors',t,{factor_type:'totp',friendly_name:'MR-S10 Owner R2'}),
  mfaVerify:async(t,id,code)=>{const c=await call('/auth/v1/factors/'+id+'/challenge',t,{});return call('/auth/v1/factors/'+id+'/verify',t,{challenge_id:c.id,code})}
 };
}
module.exports={createHandler,providerFromEnv,pack,unpack,COOKIE,PKCE};
