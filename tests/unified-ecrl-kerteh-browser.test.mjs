import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html',out='artifacts/ecrl-kerteh-freight',report=[];
await fs.mkdir(out,{recursive:true});
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(name==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},hasTouch:vp.name!=='desktop'}),checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.ecrl?.layersPresent},null,{timeout:90000});
   await page.locator('#filters button').getByText('ECRL',{exact:true}).click();
   const initial=await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl);
   assert.equal(initial.referenceKinds.MARITIME,4);assert.equal(initial.referenceKinds.YARD,1);assert.equal(initial.physicalSegments,0);
   await page.locator('#ecrl-reference-yard').check();
   assert.equal(await page.locator('#ecrl-reference-yard').isChecked(),true);
   checks.push('yard-square-reference-toggle');
   await page.locator('#search').fill('Kerteh Railway Yard');
   await page.locator('#search-results button').filter({hasText:'ecrl-yard-kerteh-petronas'}).click();
   await page.waitForFunction(()=>window.MRS10ECRLCandidateQA.snapshot().focus.assetId==='ecrl-yard-kerteh-petronas',null,{timeout:20000});
   const popup=page.locator('.maplibregl-popup .ecrl-intelligence');
   await popup.waitFor();
   assert.match(await popup.innerText(),/Kerteh Railway Yard/);
   assert.match(await popup.innerText(),/UNKNOWN/);
   assert.match(await popup.locator('.ecrl-accuracy').innerText(),/OSM/);
   checks.push('historical-railway-landuse-point-not-exact-end-lane');
   await page.screenshot({path:`${out}/${name}-${vp.name}-kerteh-reference.png`,fullPage:true});
   await page.locator('.maplibregl-popup-close-button').click();
   await page.locator('#search').fill('PETRONAS Kerteh — Loading');
   await page.locator('#search-results button').filter({hasText:'ecrl-kerteh-petronas-loading-interface'}).click();
   const list=page.locator('#ecrl-no-point');await list.waitFor({timeout:15000});
   assert.match(await list.innerText(),/PETRONAS Kerteh/);
   assert.match(await list.innerText(),/UNKNOWN/);
   checks.push('end-loading-concept-list-only-no-rail-geometry');
   const final=await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl);
   assert.equal(final.physicalSegments,0);assert.equal(final.verifiedLoopPoints,0);
   assert.equal(errors.length,0,errors.join(';'));
   report.push({engine:name,viewport:vp.name,status:'PASS',checks});
  }catch(e){report.push({engine:name,viewport:vp.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});await page.screenshot({path:`${out}/${name}-${vp.name}-fail.png`,fullPage:true}).catch(()=>{})}
  await page.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
 }await browser.close();
}
console.log(JSON.stringify(report));if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
