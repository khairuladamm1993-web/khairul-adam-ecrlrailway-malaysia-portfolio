import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const url=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html';
const out='artifacts/ecrl-chainage-pl',results=[];await fs.mkdir(out,{recursive:true});
for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await browserType.launch(name==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.name!=='desktop'});
  const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__locationRequests=0;for(const method of ['getCurrentPosition','watchPosition'])if(navigator.geolocation)navigator.geolocation[method]=()=>{window.__locationRequests++;throw Error('UNEXPECTED_GPS_REQUEST')}});
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.ecrl?.layersPresent},{timeout:90000});
   await page.locator('#filters button').getByText('ECRL',{exact:true}).click();
   assert.equal(await page.locator('.ecrl-pl-guide-item').count(),7);
   checks.push('seven-pl-records-accessible');
   await page.locator('.ecrl-chainage-guide>summary').click();
   const pl=page.locator('.ecrl-pl-guide-item').filter({hasText:'PL05'});
   assert.match(await pl.innerText(),/CH415\\+180/);
   await pl.click();
   assert(await page.locator('#ecrl-no-point').isVisible());
   assert.match(await page.locator('#ecrl-no-point').innerText(),/PL05/);
   assert.match(await page.locator('#ecrl-no-point').innerText(),/CH415\\+180/);
   checks.push('pl05-list-only-with-CH-no-fake-map-pin');
   await page.locator('#ecrl-no-point>button').click();
   await page.locator('#search').fill('STN14');
   const station=page.locator('#search-results button').filter({hasText:'ecrl-stn-13'});
   await station.click();
   await page.waitForFunction(()=>window.MRS10ECRLCandidateQA.snapshot().focus.assetId==='ecrl-stn-13');
   assert.match(await page.locator('.maplibregl-popup .ecrl-key-facts').innerText(),/CH396\\+900/);
   assert.match(await page.locator('.maplibregl-popup .ecrl-accuracy').innerText(),/rujukan kawasan/);
   await page.locator('.maplibregl-popup .ecrl-engineering>summary').click();
   assert.match(await page.locator('.maplibregl-popup .ecrl-engineering').innerText(),/MR_S10_OWNER_ACCEPTED_CORRIDOR_MANIFEST/);
   checks.push('station-CH-and-provenance-visible');
   assert.equal((await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot())).ecrl.verifiedLoopPoints,0);
   assert.equal(await page.evaluate(()=>window.__locationRequests),0);
   assert.equal(errors.length,0,errors.join(';'));
   await page.screenshot({path:`${out}/${name}-${viewport.name}-pl-chainage.png`,fullPage:true});
   results.push({engine:name,viewport:viewport.name,status:'PASS',checks});
  }catch(e){
   results.push({engine:name,viewport:viewport.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});
   await page.screenshot({path:`${out}/${name}-${viewport.name}-fail.png`,fullPage:true}).catch(()=>{});
  }
  await page.close();await fs.writeFile(out+'/report.json',JSON.stringify(results,null,2));
 }
 await browser.close();
}
console.log(JSON.stringify(results));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
