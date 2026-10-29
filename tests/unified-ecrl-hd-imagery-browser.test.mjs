import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html';
const out='artifacts/d102-hd-imagery',report=[];
await fs.mkdir(out,{recursive:true});
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(engineName==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const screen of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
 const page=await browser.newPage({viewport:screen,hasTouch:screen.name!=='desktop'}),checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
   assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.stationMap?.installed&&window.MRS10ECRLHDImagery?.snapshot(),null,{timeout:60000});
   const state=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(state.stationMap.stationCount,16);
   assert.equal(state.session.currentCH,670);
   assert.equal(state.mapPinAvailability,false);
   assert.equal(state.hdImagery.requiresOwnAPIKey,true);
   assert.equal(state.hdImagery.loaded,false);
   checks.push('STN01 original and safe no-key HD default');
   await page.locator('#lab-basemap-hd').click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLHDImagery.snapshot())).tileState,'KEY_REQUIRED');
   assert.equal((await page.evaluate(()=>window.MRS10ECRLHDImagery.snapshot())).loaded,false);
   checks.push('HD does not show false imagery without authorized MapTiler key');
   await page.locator('#lab-basemap-street').click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLSatelliteBasemap.snapshot())).mode,'street');
   await page.locator('#lab-basemap-satellite').click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLSatelliteBasemap.snapshot())).mode,'satellite');
   checks.push('street and 2016 satellite preserved');
   assert.equal(await page.locator('#lab-station-intelligence').count(),1);
   assert.equal(await page.locator('#lab-d102-preflight').count(),1);
   const appErrors=errors.filter(e=>!(/openrailwaymap|tiles.maps.eox.at/.test(e)&&/access control|network error|failed to load/i.test(e)));
   assert.equal(appErrors.length,0,appErrors.join(' ; '));
   await page.screenshot({path:`${out}/${engineName}-${screen.name}.png`,fullPage:true});
   report.push({engine:engineName,viewport:screen.name,status:'PASS',checks});
 }catch(e){
   report.push({engine:engineName,viewport:screen.name,status:'FAIL',checks,error:String(e.stack||e),errors});
   await page.screenshot({path:`${out}/${engineName}-${screen.name}-fail.png`,fullPage:true}).catch(()=>{});
 }
 await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(report));if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
