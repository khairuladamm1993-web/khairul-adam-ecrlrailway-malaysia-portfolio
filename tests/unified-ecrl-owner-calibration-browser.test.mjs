import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html',out='artifacts/owner-calibration-ux';await fs.mkdir(out,{recursive:true});const report=[];
for(const engine of ['chromium','webkit']){const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
 const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},hasTouch:vp.name!=='desktop'}),checks=[];
 try{
  assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
  await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics?.snapshot();return s?.stage==='DONE'&&s.ecrl?.layersPresent},null,{timeout:90000});
  await page.locator('#filters button').getByText('ECRL',{exact:true}).click();
  assert.equal(await page.locator('.ecrl-source-policy').count(),0);
  assert.equal(await page.locator('.ecrl-chainage-guide').count(),1);checks.push('accuracy-control-removed-CH-retained');
  assert.equal(await page.evaluate(()=>Boolean(window.RailwayAccess?.canAdmin)),false);
  assert.equal(await page.evaluate(()=>Boolean(window.MRS10V8Diagnostics.snapshot().ecrl.verifiedLoopPoints)),false);
  assert.equal(await page.evaluate(()=>window.MRS10ECRLOwnerCalibration!==undefined),true);
  checks.push('public-preview-no-admin-data');
  await page.locator('.ecrl-chainage-guide>summary').click();
  assert.equal(await page.locator('.ecrl-pl-guide-item').count(),7);
  await page.locator('.ecrl-pl-guide-item').filter({hasText:'PL05'}).click();
  const details=page.locator('#ecrl-no-point');await details.waitFor();
  assert.match(await details.innerText(),/PL05/);assert.match(await details.innerText(),/CH415\+180/);
  assert.match(await details.innerText(),/bukan|belum/i);
  checks.push('PL05-CH-reference-without-pretend-GIS-marker');
  await page.screenshot({path:`${out}/${engine}-${vp.name}.png`,fullPage:true});
  report.push({engine,viewport:vp.name,status:'PASS',checks});
 }catch(e){report.push({engine,viewport:vp.name,status:'FAIL',checks,error:String(e.stack||e)});await page.screenshot({path:`${out}/${engine}-${vp.name}-fail.png`,fullPage:true}).catch(()=>{})}
 await page.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
 }await browser.close();}
console.log(JSON.stringify(report));if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
