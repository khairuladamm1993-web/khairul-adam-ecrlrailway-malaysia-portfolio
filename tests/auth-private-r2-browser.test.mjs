import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const base='https://127.0.0.1:8767',out='artifacts/auth-private-r2',results=[];await fs.mkdir(out,{recursive:true});
for(const [engine,driver]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch(engine==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}:{headless:true});
 for(const [device,width,height]of [['desktop',1180,820],['ipad',820,1100],['iphone',390,844]]){
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height},hasTouch:device!=='desktop'}),page=await context.newPage(),checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fixture=async email=>(await context.request.post(base+'/__test__/code',{data:{email}})).json();
  const rpc=async body=>page.evaluate(async body=>{const r=await fetch('/api/auth-r2?action=private',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json(),cache:r.headers.get('Cache-Control')}},body);
  async function login(email){await page.locator('#email').fill(email);await page.locator('#request').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Semak e-mel'));const f=await fixture(email);await page.locator('#code').fill(f.otp);await page.locator('#verify').click();await page.waitForFunction(()=>window.MRS10AuthR2.snapshot()?.authenticated);}
  try{
   await context.request.post(base+'/__test__/reset');await page.goto(base+'/auth-private-r2.html');await page.waitForFunction(()=>document.getElementById('status').textContent==='AUTH_REQUIRED');
   assert.equal((await rpc({op:'list',store:'definitions'})).status,401);checks.push('PUBLIC_API_DENIED');
   await page.goto(base+'/ecrl-alignment-lab.html');await page.waitForURL('**/auth-private-r2.html');await page.waitForFunction(()=>document.getElementById('status').textContent==='AUTH_REQUIRED');assert.equal(await page.evaluate(()=>Boolean(window.MRS10AssistantUI)),false);checks.push('PUBLIC_LAB_MODULES_NOT_EXECUTED');
   await login('owner@example.test');assert.equal(await page.locator('#room').isVisible(),false);assert.equal((await rpc({op:'list',store:'definitions'})).status,403);checks.push('OWNER_FIRST_FACTOR_DENIED');
   await page.locator('#enroll').click();await page.waitForFunction(()=>!document.getElementById('mfa-qr').hidden);const otp=await fixture('owner@example.test');await page.locator('#mfa-code').fill(otp.mfa);await page.locator('#mfa-verify').click();await page.locator('#room').waitFor({state:'visible'});checks.push('OWNER_MFA_ROOM_OPEN');
   await page.evaluate(()=>new Promise((resolve,reject)=>{localStorage.setItem('mrs10-p01-qa-legacy','SYNTHETIC_OWNER_LEGACY');const r=indexedDB.open('mrs10-p01-d102-command-center-r17',1);r.onupgradeneeded=()=>r.result.createObjectStore('settings',{keyPath:'key'});r.onerror=reject;r.onsuccess=()=>{const db=r.result,tx=db.transaction('settings','readwrite');tx.objectStore('settings').put({key:'legacy',note:'SYNTHETIC_OWNER_LEGACY'});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}}));
   page.once('dialog',d=>d.accept());await page.locator('#migration').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Pemindahan diterima backend'));checks.push('LEGACY_ARCHIVE_VERIFIED_BEFORE_INDEXEDDB_PURGE');
   const canary={key:'qa-private-canary',classification:'OWNER_PRIVATE',note:'SYNTHETIC_OWNER_NOTE'};assert.equal((await rpc({op:'put',store:'settings',key:canary.key,value:canary})).status,200);
   await page.reload();await page.locator('#room').waitFor({state:'visible'});assert.deepEqual((await rpc({op:'get',store:'settings',key:canary.key})).body.value,canary);checks.push('REFRESH_RECOVERS_SERVER_RECORD');
   const stored=await page.evaluate(async()=>({local:Object.keys(localStorage).filter(k=>!['railway-theme'].includes(k)),session:Object.keys(sessionStorage),dbs:(await indexedDB.databases()).map(d=>d.name)}));assert.deepEqual(stored,{local:[],session:[],dbs:[]});checks.push('OWNER_DATA_ABSENT_FROM_INDEXEDDB_AND_WEB_STORAGE');
   const tab=await context.newPage();await tab.goto(base+'/auth-private-r2.html');await tab.locator('#room').waitFor({state:'visible'});
   await page.locator('#logout').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Sesi ditutup'));await tab.locator('#room').waitFor({state:'hidden'});
   assert.equal((await rpc({op:'get',store:'settings',key:canary.key})).status,401);assert.equal(await page.locator('#room').isVisible(),false);checks.push('LOGOUT_INVALIDATES_SECOND_TAB_AND_BACKEND');
   await login('member@example.test');assert.equal(await page.locator('#room').isVisible(),false);const denied=await rpc({op:'get',store:'settings',key:canary.key});assert.equal(denied.status,403);assert(!JSON.stringify(denied).includes('SYNTHETIC_OWNER_NOTE'));checks.push('MEMBER_ACCOUNT_SWITCH_OWNER_DATA_DENIED');
   const cookies=await context.cookies();assert(cookies.filter(c=>c.name.startsWith('__Host-mrs10-r2')).every(c=>c.httpOnly&&c.secure));assert.equal(errors.length,0,errors.join(';'));
   await page.screenshot({path:`${out}/${engine}-${device}.png`});results.push({engine,device,status:'PASS',checks,privacyRegression:'PASS',backend:'MOCK_PROVIDER_AND_TEST_STORE',liveSupabase:'NOT_RUN',physicalSafari:'NOT_RUN'});await tab.close();
  }catch(e){results.push({engine,device,status:'FAIL',checks,error:String(e.stack||e),errors});await page.screenshot({path:`${out}/${engine}-${device}-fail.png`}).catch(()=>{})}
  await context.close();await fs.writeFile(out+'/report.json',JSON.stringify(results,null,2));
 }
 await browser.close();
}
console.log(JSON.stringify(results));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
