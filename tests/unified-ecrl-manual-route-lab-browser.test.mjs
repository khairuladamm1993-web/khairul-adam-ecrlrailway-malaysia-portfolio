import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const URL=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html',result=[];
for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch(name==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
 const page=await browser.newPage({viewport,hasTouch:viewport.name!=='desktop'}),checks=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  assert.equal((await page.goto(URL,{waitUntil:'domcontentloaded'})).status(),200);
  await page.waitForFunction(()=>!!window.MRS10ECRLRouteLab?.snapshot(),null,{timeout:30000});
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,670);
  assert.equal((await page.locator('#route-lab').innerText()).includes('CH000+670'),true);
  assert.equal(await page.locator('#lab-origin option').first().innerText(),'STN01 · CH000+670');
  assert.equal(await page.locator('#lab-destination option').last().innerText(),'STN17 · CH524+160');
  assert.match(await page.locator('#route-lab').innerText(),/STN02 · CH033\+700/);
  checks.push('one-train-initial-CH','padded-CH-labels');
  await page.getByRole('button',{name:'Ke checkpoint seterusnya'}).click();
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,33700);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot().session.currentCH===33700,null,{timeout:30000});
  checks.push('local-resume-after-reload');
  await page.locator('textarea').fill('Owner model UAT: manual arrival at STN02, simulation only');
  await page.getByRole('button',{name:'Semak checkpoint Owner'}).click();
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.reviews.length,1);
  checks.push('owner-review-not-survey');
  const before=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
  assert.equal(before.mapPinAvailability,false);assert.equal(before.alignmentStatus,'NO_GEOMETRY');
  checks.push('no-invented-route-pin');
  if(errors.length)throw Error(errors.join('; '));
  await fs.mkdir('artifacts/ecrl-route-lab',{recursive:true});
  await page.screenshot({path:`artifacts/ecrl-route-lab/${name}-${viewport.name}.png`,fullPage:true});
  result.push({engine:name,viewport:viewport.name,status:'PASS',checks});
 }catch(e){result.push({engine:name,viewport:viewport.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});await fs.mkdir('artifacts/ecrl-route-lab',{recursive:true});await page.screenshot({path:`artifacts/ecrl-route-lab/${name}-${viewport.name}-fail.png`,fullPage:true}).catch(()=>{})}
 await page.close();await fs.writeFile('artifacts/ecrl-route-lab/report.json',JSON.stringify(result,null,2));
 }await browser.close();
}
console.log(JSON.stringify(result));if(result.some(x=>x.status==='FAIL'))process.exitCode=1;
