const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const handlerPromise=import(pathToFileURL(path.resolve(__dirname,'../api/owner-project-status.mjs')).href).then(m=>m.default);
const oldFetch=global.fetch,oldKey=process.env.SUPABASE_PUBLISHABLE_KEY,oldToken=process.env.VERCEL_API_TOKEN;
function mockResponse(){
 let body='',headers={};
 return{statusCode:200,setHeader(n,v){headers[n]=v;},end(v){body=v;},
  result(){return{status:this.statusCode,body:JSON.parse(body),headers}}};
}
function mockRequest(header,method='GET'){return{headers:{authorization:header||''},method};}
async function request(auth,opts={}){
 const handler=await handlerPromise;
 let called=0,vercelCalled=0;
 const {role='admin',userVerified=true,vercelEnabled=true}=opts;
 process.env.SUPABASE_PUBLISHABLE_KEY='public-test-key';
 if(vercelEnabled)process.env.VERCEL_API_TOKEN='private-test-token';else delete process.env.VERCEL_API_TOKEN;
 global.fetch=async (url,init={})=>{
  called++;const u=String(url);
  if(u.includes('supabase.co/auth/v1/user')){
   assert(!u.includes('private-test-token'));
   return {ok:true,json:async()=>({id:'auth-user',email_confirmed_at:userVerified?'2026-10-25':null})};
  }
  if(u.includes('supabase.co/rest/v1/rpc/account_role')){
   assert.equal(init.method,'POST');
   return {ok:true,json:async()=>role};
  }
  if(u.startsWith('https://api.vercel.com/')){
   vercelCalled++;
   assert.equal(init.headers.Authorization,'Bearer private-test-token');
   return u.includes('/v9/projects/')?{ok:true,json:async()=>({live:false})}:
    {ok:true,json:async()=>({deployments:[{id:'dpl-synthetic',state:'BLOCKED',created:123}]})};
  }
  throw new Error('unrecognized network request '+u);
 };
 const res=mockResponse();
 try{await handler(mockRequest(auth),res);return {...res.result(),called,vercelCalled};}
 finally{
  global.fetch=oldFetch;
  if(oldKey===undefined)delete process.env.SUPABASE_PUBLISHABLE_KEY;else process.env.SUPABASE_PUBLISHABLE_KEY=oldKey;
  if(oldToken===undefined)delete process.env.VERCEL_API_TOKEN;else process.env.VERCEL_API_TOKEN=oldToken;
 }
}
test('bridge refuses missing bearer before touching Supabase or Vercel',async()=>{
 const data=await request(null);
 assert.equal(data.status,401);assert.equal(data.called,0);
 assert.equal(data.body.status,'AUTH_REQUIRED');
});
test('bridge denies unverified email and ordinary Member, never calls Vercel',async()=>{
 const unverified=await request('Bearer fake-test-jwt',{userVerified:false});
 assert.equal(unverified.status,403);assert.equal(unverified.vercelCalled,0);
 const member=await request('Bearer fake-test-jwt',{role:'member'});
 assert.equal(member.status,403);assert.equal(member.vercelCalled,0);
});
test('bridge must not leak or call Vercel without secret server-side token',async()=>{
 const r=await request('Bearer fake-test-jwt',{vercelEnabled:false});
 assert.equal(r.status,503);assert.equal(r.body.status,'VERCEL_NOT_CONNECTED');
 assert.equal(r.vercelCalled,0);
});
test('backend authorizes Owner then fetches exactly allowlisted Vercel projects',async()=>{
 const r=await request('Bearer fake-test-jwt');
 assert.equal(r.status,200);assert.equal(r.vercelCalled,6);
 assert.equal(r.body.status,'OK');assert.equal(r.body.projects.length,3);
 assert.equal(r.body.projects[1].status,'BLOCKED');
 assert.equal(r.body.projects[1].live,false);
 assert(!JSON.stringify(r.body).includes('private-test-token'));
 assert.equal(r.headers['Cache-Control'],'no-store');
});
test('Owner registry/frontend scripts present read-only CI and Vercel fallback',async()=>{
 const fs=require('node:fs');
 const js=fs.readFileSync(path.resolve(__dirname,'../assets/owner-command-center.js'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../owner-command-center.html'),'utf8');
 assert(js.includes('fetchGitHubCI'));
 assert(js.includes('ownerDashboardAccessToken'));
 assert(js.includes('NOT CONNECTED'));
 assert(html.includes('id="vercel-live"'));
 assert(!js.includes('VERCEL_API_TOKEN'));
});
