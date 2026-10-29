import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const base=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html',path='artifacts/ecrl-d102-gate',results=[];
await fs.mkdir(path,{recursive:true});
for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch(name==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const v of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},hasTouch:v.name!=='desktop'}),checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   assert.equal((await page.goto(base,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.d102Preflight?.preflight?.total===23,null,{timeout:60000});
   let initial=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(initial.d102Preflight.preflight.completed,0);
   assert.equal(initial.d102Preflight.preflight.stations,16);
   assert.equal(initial.d102Preflight.preflight.passingLoops,7);
   assert.equal(initial.d102Preflight.fullGeographicRunAllowed,false);
   assert.equal(initial.mapPinAvailability,false);
   assert.equal(await page.locator('#lab-preflight-asset option').count(),23);
   checks.push('23 Owner preflight assets and blocked physical movement');
   assert.equal(await page.locator('#lab-preflight-asset').inputValue(),'STN01');
   assert(await page.locator('#lab-preflight-lat').inputValue());
   assert(await page.locator('#lab-preflight-lon').inputValue());
   await page.locator('#lab-preflight-asset').selectOption('PL01');
   assert.equal(await page.locator('#lab-preflight-lat').inputValue(),'');
   assert.equal(await page.locator('#lab-preflight-lon').inputValue(),'');
   checks.push('no synthetic PL01 coordinates from CH');
   await page.locator('#lab-preflight-asset').selectOption('STN01');
   await page.locator('#lab-preflight-source').fill('MR-S10 verified locality reference model');
   await page.locator('#lab-preflight-note').fill('Owner reference-only model checkpoint not surveyed.');
   await page.locator('#lab-preflight-owner-ack').check();
   await page.getByRole('button',{name:'Sahkan calon koordinat model'}).click();
   let state=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(state.d102Preflight.preflight.completed,1);
   assert.equal(state.d102Preflight.preflight.readyForGeographicRailMovement,false);
   assert.equal(state.mapPinAvailability,false);
   checks.push('explicit model-only owner WGS84 confirmation');
   await page.getByRole('button',{name:'Ke checkpoint seterusnya'}).click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,33700);
   await page.locator('#lab-obs-type').selectOption('TUNNEL_ENTRY');
   await page.locator('#lab-obs-title').fill('Tunnel geometry candidate');
   await page.locator('#lab-obs-notes').fill('This is a model-only D102 observation; entrance not surveyed');
   await page.getByRole('button',{name:'Rekod pemerhatian pada CH semasa'}).click();
   let e=await page.evaluate(()=>window.MRS10ECRLD102PreflightUI.getObservations().snapshot());
   assert.equal(e.observationCount,1);assert.equal(e.observations[0].CH,33700);
   assert.equal(e.observations[0].absoluteLatitude,null);
   checks.push('captured CH33+700 engineering observation without fake GPS');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.d102Preflight?.preflight?.completed===1,null,{timeout:60000});
   state=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(state.session.currentCH,33700);
   assert.equal(state.d102Preflight.observationCount,1);
   assert.equal(state.mapPinAvailability,false);
   checks.push('Owner model and CH event local restore after reload');
   assert.equal(errors.length,0,errors.join(' ; '));
   await page.screenshot({path:`${path}/${name}-${v.name}.png`,fullPage:true});
   results.push({engine:name,viewport:v.name,status:'PASS',checks});
  }catch(e){
   results.push({engine:name,viewport:v.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});
   await page.screenshot({path:`${path}/${name}-${v.name}-fail.png`,fullPage:true}).catch(()=>{});
  }
  await fs.writeFile(path+'/report.json',JSON.stringify(results,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(results));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
