import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const base=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html',out='artifacts/ecrl-alignment-r2',report=[];
await fs.mkdir(out,{recursive:true});
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(engineName==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const v of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
 const page=await browser.newPage({viewport:{width:v.width,height:v.height},hasTouch:v.name!=='desktop'}),checks=[],errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  assert.equal((await page.goto(base,{waitUntil:'domcontentloaded'})).status(),200);
  await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d?.ecrl?.layersPresent},null,{timeout:90000});
  await page.locator('#filters button').getByText('ECRL',{exact:true}).click();
  const audit=page.locator('.ecrl-alignment-readiness');await audit.locator(':scope > summary').click();
  assert.equal(await audit.locator('.ecrl-evidence-row').count(),14);
  assert.match(await audit.innerText(),/CH415\+180/);
  assert.match(await audit.innerText(),/SCHEMATIC_ONLY/);
  checks.push('seven-PL-seven-spurline-audit-visible-no-fake-point');
  const s=await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl);
  assert.equal(s.verifiedLoopPoints,0);assert.equal(s.physicalSegments,0);
  assert.equal(s.referenceCount,25);
  checks.push('map-has-no-synthetic-ECRL-LineString');
  await page.locator('#ecrl-reference-yard').check();
  await page.locator('#search').fill('Kerteh Railway Yard');
  await page.locator('#search-results button').filter({hasText:'ecrl-yard-kerteh-petronas'}).click();
  const popup=page.locator('.maplibregl-popup.ecrl-popup');
  await popup.waitFor({timeout:15000});
  const target=popup.locator('.ecrl-engineering>summary');
  await target.click({timeout:15000});
  assert.match(await popup.locator('.ecrl-engineering').innerText(),/NO_END_LANE_COORDINATE/);
  checks.push('webkit-tappable-engineering-details-not-obscured');
  assert.equal(errors.length,0,errors.join(' / '));
  await page.screenshot({path:`${out}/${engineName}-${v.name}.png`,fullPage:true});
  report.push({engine:engineName,viewport:v.name,status:'PASS',checks});
 }catch(e){
  report.push({engine:engineName,viewport:v.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});
  await page.screenshot({path:`${out}/${engineName}-${v.name}-fail.png`,fullPage:true}).catch(()=>{});
 }
 await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
