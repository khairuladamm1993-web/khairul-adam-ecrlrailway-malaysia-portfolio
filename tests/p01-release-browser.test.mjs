import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8765';
const results=[],out='artifacts/release-readiness';await fs.mkdir(out,{recursive:true});
for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch(engine==='chromium'?{headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']}:{headless:true});
 for(const [device,width,height] of [['desktop',1180,820],['ipad',820,1100],['iphone',390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:device!=='desktop'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   assert.equal((await page.goto(base+'/gateway.html')).status(),200);
   await page.waitForFunction(()=>document.querySelectorAll('#categories button').length>0);
   const access=await page.evaluate(()=>({level:RailwayAccess.level,admin:RailwayAccess.canAdmin,member:RailwayAccess.canReadMemberContent}));
   assert.deepEqual(access,{level:'public',admin:false,member:false});
   assert.equal(await page.locator('#owner-center-shortcut').isVisible(),false);
   for(const lang of ['ms','en','zh','th']){
    await page.locator(`[data-lang="${lang}"]`).click();
    assert.equal(await page.locator('html').getAttribute('lang'),lang==='zh'?'zh-Hans':lang);
   }
   const destinations=await page.locator('#destinations button').allTextContents();assert.equal(destinations.length,4);
   for(let i=0;i<4;i++)await page.locator('#destinations button').nth(i).click();
   const themes=await page.evaluate(()=>{const t=window.RailwayTheme;return {keys:Object.keys(t||{})}});
   // Use the product theme API only when available; do not simulate a passing toggle.
   const themeStatus=await page.evaluate(()=>{if(typeof window.RailwayTheme?.toggle!=='function')return 'NOT_RUN';const a=document.documentElement.dataset.theme;RailwayTheme.toggle();const b=document.documentElement.dataset.theme;RailwayTheme.toggle();return a!==b&&document.documentElement.dataset.theme===a?'PASS':'FAIL'});
   assert.notEqual(themeStatus,'FAIL');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow');
   await page.screenshot({path:`${out}/${engine}-${device}-gateway.png`});
   assert.equal(errors.length,0,errors.join(';'));
   results.push({engine,device,status:'PASS',publicAccess:access,liveMemberOwner:'NOT_RUN',destinations,themeStatus,themes});
   // Synthetic canary only. A second Public tab on the same origin must not
   // be confused with an independently authenticated Owner account.
   await page.addScriptTag({url:base+'/assets/unified-ecrl/route-lab-assistant-store-r17.js'});
   await page.evaluate(async()=>{const s=MRS10AssistantPrivateStore.create(indexedDB);await s.put('settings',{key:'QA_PRIVATE_CANARY',scope:'OWNER_PRIVATE',value:'SYNTHETIC_NOT_USER_DATA'})});
   const tab=await context.newPage();await tab.goto(base+'/gateway.html');await tab.addScriptTag({url:base+'/assets/unified-ecrl/route-lab-assistant-store-r17.js'});
   const canRead=await tab.evaluate(async()=>Boolean(await MRS10AssistantPrivateStore.create(indexedDB).get('settings','QA_PRIVATE_CANARY')));
   results.push({engine,device,status:canRead?'FAIL':'PASS',test:'OWNER_PRIVATE account isolation',syntheticOnly:true,reason:canRead?'Public tab can read synthetic OWNER_PRIVATE record on the same browser origin; storage is origin-scoped, not account-authorized.':null});
   await tab.close();
  }catch(e){results.push({engine,device,status:'FAIL',test:'gateway',error:String(e),errors})}
  await context.close();
 }
 await browser.close();
}
await fs.writeFile(out+'/browser-report.json',JSON.stringify({results,releaseDecision:'NO-GO',safariPhysical:'NOT_RUN',backendRoleAPI:'NOT_RUN',note:'Public-only preview is not proof of authenticated release readiness.'},null,2));
console.log(JSON.stringify(results));
// Functional QA failures fail this job. Privacy failures are enforced by the
// explicit release gate, preserving screenshots and separate functional results.
if(results.some(r=>r.status==='FAIL'&&r.test!=='OWNER_PRIVATE account isolation'))process.exitCode=1;
