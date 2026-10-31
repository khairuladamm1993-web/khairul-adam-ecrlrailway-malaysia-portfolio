'use strict';
// Test process only. Never included in deployable output or Vercel function imports.
const crypto=require('node:crypto');
const {createHandler,COOKIE,pack}=require('../server/auth-r2/core.cjs');
const err=(status,code)=>Object.assign(Error(code),{status,code});
function fixture(origin='https://test.invalid'){
 let clock=Date.now();const key=crypto.randomBytes(32),issued=new Map(),otps=new Map(),records=new Map(),revoked=new Set(),factors=new Map();
 const six=()=>String(crypto.randomInt(100000,1000000));
 function mint(email,aal='aal1') {const uid=email.startsWith('owner')?'11111111-1111-4111-8111-111111111111':'22222222-2222-4222-8222-222222222222',session=crypto.randomUUID(),token='test.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(clock/1000)+3600,aal,session_id:session})).toString('base64url')+'.'+crypto.randomBytes(12).toString('base64url');issued.set(token,{id:uid,email,email_confirmed_at:'2026-10-01',role:email.startsWith('owner')?'admin':'member',aal,session});return {access_token:token,refresh_token:token}}
 function user(t){const u=issued.get(t);if(!u||revoked.has(t))throw err(401,'SESSION_REJECTED');return u}
 const provider={
  async request({email,challenge}){const old=otps.get(email);if(old&&clock-old.sent<60000)throw err(429,'PROVIDER_RATE_LIMITED');let code=six();while(code===old?.code)code=six();otps.set(email,{code,sent:clock,expires:clock+300000,used:false,attempts:0,challenge})},
  async verify({email,token}){const p=otps.get(email);if(!p)throw err(401,'VERIFICATION_REJECTED');if(p.attempts++>=5)throw err(429,'PROVIDER_RATE_LIMITED');if(p.used||clock>=p.expires||p.code!==token)throw err(401,'VERIFICATION_REJECTED');p.used=true;return mint(email)},
  async exchange(code,verifier){const p=otps.get('owner@example.test');if(!p||p.used||code!=='fixture-auth-code'||crypto.createHash('sha256').update(verifier).digest('base64url')!==p.challenge)throw err(401,'PKCE_CALLBACK_REJECTED');p.used=true;return mint('owner@example.test')},
  async user(t){const u=user(t);return {id:u.id,email:u.email,email_confirmed_at:u.email_confirmed_at,user_metadata:{role:'admin'}}},
  async role(t){return user(t).role},async refresh(t){const u=user(t);return mint(u.email,u.aal)},async logout(t){revoked.add(t)},
  async ownerContext(t){const u=user(t);if(u.role!=='admin'||u.aal!=='aal2')throw err(403,'OWNER_MFA_REQUIRED');return true},
  async factors(t){user(t);return {factors:[...factors.values()].map(x=>({id:x.id,status:x.status}))}},
  async enroll(t){user(t);const id=crypto.randomUUID(),code=six();factors.set(id,{id,code,status:'unverified'});return {id,totp:{qr_code:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}}},
  async mfaVerify(t,id,code){const u=user(t),f=factors.get(id);if(!f||f.code!==code)throw err(401,'MFA_REJECTED');f.status='verified';return mint(u.email,'aal2')},
  async privateOp(t,b){const u=user(t);await provider.ownerContext(t);const prefix=u.id+'|';const get=(s,k)=>records.get(prefix+s+'|'+k)||null;const put=(s,k,v)=>{records.set(prefix+s+'|'+k,structuredClone(v));return structuredClone(v)};
   if(b.op==='bootstrap')return Object.fromEntries([...records].filter(([k])=>k.startsWith(prefix+'browserMemory|')).map(([k,v])=>[k.split('|').at(-1),v]));
   if(b.op==='list')return [...records].filter(([k])=>k.startsWith(prefix+b.store+'|')).map(([,v])=>structuredClone(v));
   if(b.op==='get')return structuredClone(get(b.store,b.key));
   if(b.op==='put'){if(b.store==='consumerApprovedGeometry')throw err(403,'PUBLICATION_NOT_AUTHORIZED');return put(b.store,b.key,b.value)}
   if(b.op==='migrate'||b.op==='archive')return put('recoveryArchives',b.key,b.value);
   if(b.op==='definition'){const k=b.document.assignmentId+'@'+b.document.revision,old=get('definitions',k);if(old&&JSON.stringify(old.document)!==JSON.stringify(b.document))throw err(409,'REVISION_CONFLICT_INCREMENT_REVISION');return old||put('definitions',k,{key:k,document:b.document,scope:'PRIVATE_OWNER'})}
   if(b.op==='save'){const old=get('executions',b.state.key);if((old?.version||0)!==b.expectedVersion)throw err(409,'EXECUTION_CHANGED_IN_OTHER_TAB');return put('executions',b.state.key,{...b.state,version:b.expectedVersion+1})}
   if(b.op==='claim'){const old=get('settings','d102-authority');if(old?.assignmentKey&&(old.assignmentKey!==b.assignmentKey||old.ownerToken!==b.ownerToken))throw err(409,'ANOTHER_ASSIGNMENT_OWNS_D102');return put('settings','d102-authority',{assignmentKey:b.assignmentKey,ownerToken:b.ownerToken})}
   if(b.op==='release')return put('settings','d102-authority',{assignmentKey:null});throw err(400,'UNKNOWN_OPERATION');
  }
 };
 return {provider,key,issued,records,otps,factors,origin,handler:createHandler({provider,key,origin,enabled:true,now:()=>clock}),advance:n=>clock+=n,mint,cookie:(email,aal)=>COOKIE+'='+pack(mint(email,aal),key),request:(action,body,cookie='',method=body?'POST':'GET')=>({url:'/api/auth-r2?action='+action,method,headers:{origin,'content-type':'application/json',cookie},body}),readOtp:email=>otps.get(email)?.code,readMfa:id=>factors.get(id)?.code};
}
module.exports={fixture};
