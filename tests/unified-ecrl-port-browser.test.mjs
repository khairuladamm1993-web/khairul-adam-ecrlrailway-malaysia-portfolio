import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html',out='artifacts/unified-ecrl-ports',report=[];await fs.mkdir(out,{recursive:true});
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},hasTouch:vp.name!=='desktop'});const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.mapReady&&d.ecrl?.layersPresent},null,{timeout:90000});
   await page.locator('#filters button').getByText('ECRL',{exact:true}).click();
   await page.locator('#ecrl-reference-maritime').check();
   const s=await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot());
   assert.equal(s.ecrl.referenceKinds.MARITIME,4);
   assert.equal(s.ecrl.physicalSegments,0);assert.equal(s.ecrl.verifiedLoopPoints,0);
   checks.push('four-sourced-maritime-reference-pins-with-zero-track-geometry');
   for(const [search,id,term] of [['Kuantan Port','ecrl-port-kuantan','KP1'],['Kemaman Port','ecrl-port-kemaman','KEMAMAN_PORT_ECRL']]){
    await page.locator('#search').fill(search);
    await page.locator('#search-results button').filter({hasText:id}).click();
    await page.waitForFunction(id=>window.MRS10ECRLCandidateQA.snapshot().focus.assetId===id,id,{timeout:30000});
    const popup=page.locator('.maplibregl-popup .ecrl-intelligence');await popup.waitFor();
    assert.match(await popup.innerText(),new RegExp(search));
    assert.match(await popup.innerText(),new RegExp(term));
    assert.match(await popup.innerText(),/bukan titik hujung rel/);
    await popup.locator('.ecrl-engineering>summary').click();
    assert.match(await popup.locator('.ecrl-engineering').innerText(),/PENDING_GEOMETRY/);
    await page.screenshot({path:`${out}/${engine}-${vp.name}-${id}.png`,fullPage:true});
    await page.locator('.maplibregl-popup-close-button').click();
    checks.push(id+'-operator-provenance-and-unverified-bay');
   }
   assert.equal(errors.length,0,errors.join(' ; '));
   report.push({engine,viewport:vp.name,status:'PASS',checks});
  }catch(e){report.push({engine,viewport:vp.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});await page.screenshot({path:`${out}/${engine}-${vp.name}-fail.png`,fullPage:true}).catch(()=>{});}
  await page.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
 }await browser.close();
}
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
