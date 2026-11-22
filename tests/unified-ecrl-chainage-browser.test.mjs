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
   await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.ecrl?.layersPresent},null,{timeout:90000});
   await page.locator('#filters button').getByText('ECRL',{exact:true}).click();
   assert.equal(await page.locator('.ecrl-pl-guide-item').count(),7);
   assert.equal(await page.locator('.ecrl-depot-guide-item').count(),2);
   checks.push('seven-pl-records-accessible');
   await page.locator('.ecrl-chainage-guide>summary').click();
   const panel=page.locator('#ecrl-no-point');
   // The ECRL filter can still be completing its initial camera transition.
   const before=await page.evaluate(async()=>{
    let previous='',stable=0;
    while(stable<4){
     await new Promise(resolve=>requestAnimationFrame(resolve));
     const current=JSON.stringify(window.MRS10CompleteQA.camera());
     stable=current===previous?stable+1:0;
     previous=current;
    }
    return JSON.parse(previous);
   });
   for(const row of await page.locator('.ecrl-chainage-guide button').all()){
    const id=await row.getAttribute('data-ecrl-asset');
    if(viewport.name==='desktop')await row.click();else await row.tap();
    await panel.locator(`[data-ecrl-asset="${id}"]`).waitFor();
    const bounds=await panel.boundingBox();
    assert(bounds && bounds.y<viewport.height && bounds.y+bounds.height>0,'Asset card should be in the visible viewport');
    assert.equal(await page.locator('.maplibregl-popup').count(),0);
    assert.deepEqual(await page.evaluate(()=>window.MRS10CompleteQA.camera()),before);
    if(id==='ecrl-loop-historical-05')assert.match(await panel.innerText(),/CH415\+180/);
    if(id==='ecrl-depot-gombak-north')assert.match(await panel.innerText(),/CH519\+750/);
    if(id==='ecrl-depot-kuantan')assert.doesNotMatch(await panel.innerText(),/CH\d+\+\d+/);
    await panel.locator(':scope > button').click();
    await panel.waitFor({state:'hidden'});
   }
   checks.push('all-seven-loops-and-two-depots-open-without-a-map-pin');
   await page.locator('#search').fill('STN14');
   const station=page.locator('#search-results button').filter({hasText:'ecrl-stn-13'});
   await station.click();
   await page.waitForFunction(()=>window.MRS10ECRLCandidateQA.snapshot().focus.assetId==='ecrl-stn-13');
   assert.match(await page.locator('.maplibregl-popup .ecrl-key-facts').innerText(),/CH396\+900/);
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
