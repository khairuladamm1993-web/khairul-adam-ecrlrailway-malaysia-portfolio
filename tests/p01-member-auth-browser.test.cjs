const assert=require('node:assert/strict');
const { createHash }=require('node:crypto');
const { chromium, webkit }=require('playwright');
const base='http://127.0.0.1:8765';
const origin='https://kfudisbzdgsefdjoopzu.supabase.co';
const sdk=process.env.P01_AUTH_SDK;
assert.ok(sdk,'Set P01_AUTH_SDK to the verified Supabase SDK bundle');
const email='member-fixture@example.invalid';
const user={id:'11111111-1111-4111-8111-111111111111',email,aud:'authenticated',role:'authenticated',email_confirmed_at:'2026-11-27T00:00:00Z',app_metadata:{},user_metadata:{},created_at:'2026-11-27T00:00:00Z'};
const session={access_token:'fixture-only-token',refresh_token:'fixture-only-refresh',expires_in:3600,token_type:'bearer',user};
async function setup(browser,viewport){
 const context=await browser.newContext({viewport,hasTouch:true});
 const stats={otp:0,verify:0,pkce:0};
 let challenge='';
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin===base){
   if(url.pathname==='/assets/analytics.js')return route.fulfill({contentType:'application/javascript',body:''});
   return route.continue();
  }
  if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('@supabase/supabase-js@2.117.2'))return route.fulfill({path:sdk,contentType:'application/javascript'});
  if(url.origin!==origin)return route.abort();
  const headers={'access-control-allow-origin':base,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'};
  const json=(value,status=200)=>route.fulfill({status,headers,json:value});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/auth/v1/otp'){
   stats.otp++;
   challenge=req.postDataJSON().code_challenge;
   assert.ok(challenge);
   assert.equal(url.searchParams.get('redirect_to'),base+'/gateway.html');
   return json({});
  }
  if(url.pathname==='/auth/v1/verify'){
   stats.verify++;
   const proof=req.postDataJSON();
   if(proof.type==='email'&&proof.email===email&&proof.token==='01234567')return json(session);
   return json({code:'otp_expired',message:'Token has expired'},403);
  }
  if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='pkce'){
   stats.pkce++;
   const proof=req.postDataJSON();
   if(proof.auth_code==='fixture-callback'&&createHash('sha256').update(proof.code_verifier).digest('base64url')===challenge)return json(session);
   return json({code:'bad_code_verifier',message:'invalid code verifier'},400);
  }
  if(url.pathname==='/auth/v1/user')return json(user);
  if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,headers});
  if(url.pathname==='/rest/v1/rpc/account_role')return json('member');
  if(url.pathname==='/rest/v1/member_profiles')return json({email,enabled:true,role:'member',activity_consent_at:null});
  if(url.pathname.startsWith('/rest/v1/'))return json([]);
  return route.abort();
 });
 return {context,stats};
}
async function role(page,level){
 const audience=level==='member'?'member':'public';
 const map=level==='member'?'unified-map-v8.html':'unified-map-v7.html';
 await page.locator('[data-map-audience="'+audience+'"] iframe[src^="'+map+'"]').waitFor();
 await page.waitForFunction(expected=>window.RailwayAccess.level===expected,level);
}
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const [device,viewport] of [['ipad',{width:810,height:1080}],['iphone',{width:390,height:844}]]){
    const {context,stats}=await setup(browser,viewport);
    try{
     const page=await context.newPage();
     await page.goto(base+'/gateway.html#map');
     await role(page,'public');
     await page.locator('#gateway-status [data-member]').click();
     await page.locator('[data-auth-proof]').click();
     const form=page.locator('#member-email-proof-form');
     await form.locator('[name=proof_email]').fill(email);
     await form.locator('[name=email_proof]').fill('01234567');
     await form.locator('button[type=submit]').click();
     await role(page,'member');
     assert.equal(stats.verify,1);
     assert.equal(await page.locator('[name=email_proof]').count(),0);
     assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('01234567')),false);
     await page.reload(); await role(page,'member');
     await page.evaluate(()=>RailwayAccess.logout());await role(page,'public');
     await page.evaluate(email=>RailwayAccess.sendMagicLink(email),email);
     assert.equal(stats.otp,1);
     // New tab on the same origin retains the verifier, as the SDK requires.
     const callback=await context.newPage();
     await callback.goto(base+'/gateway.html?code=fixture-callback#map');
     await callback.waitForFunction(()=>window.RailwayAccess?.status==='authenticated');
     assert.equal(new URL(callback.url()).searchParams.has('code'),false);
     assert.equal(stats.pkce,1);
     await callback.goto(base+'/gateway.html#map');await role(callback,'member');
     console.log(JSON.stringify({engine:name,device,status:'PASS',otp:true,pkceSameOrigin:true,reload:true,roleSwitch:true,backend:'fixture'}));
    }finally{await context.close();}
   }
   const isolated=await setup(browser,{width:390,height:844});
   try{
    const page=await isolated.context.newPage();
    await page.goto(base+'/gateway.html?code=fixture-without-verifier#map');
    await page.waitForFunction(()=>window.RailwayAccess?.status==='pkce-exchange-failed');
    await role(page,'public');
    assert.equal(new URL(page.url()).searchParams.has('code'),false);
    assert.equal(isolated.stats.pkce,0);
    console.log(JSON.stringify({engine:name,status:'PASS',missingVerifier:'fail closed',tokenRequests:0,backend:'fixture'}));
   }finally{await isolated.context.close();}
  } finally {await browser.close();}
 }
})().catch(error=>{console.error(error.name, error.message);process.exitCode=1});
