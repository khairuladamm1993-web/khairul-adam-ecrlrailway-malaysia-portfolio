import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html',out='artifacts/ecrl-orm-r12',report=[];
await fs.mkdir(out,{recursive:true});
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(engineName==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.name!=='desktop'}),checks=[],errors=[];let tileRequests=0,tileOk=0;
  page.on('pageerror',x=>errors.push(x.message));
  page.on('request',x=>{if(x.url().includes('tiles.openrailwaymap.org/standard'))tileRequests++});
  page.on('response',x=>{if(x.url().includes('tiles.openrailwaymap.org/standard')&&x.ok())tileOk++});
  try{
   assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.railVisual?.installed===true,null,{timeout:60000});
   const state=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(state.railVisual.visible,true);assert.equal(state.railVisual.classification,'OSM_RASTER_VISUAL_REFERENCE_ONLY');
   assert.notEqual(state.railVisual.tileStatus,'WAITING_FOR_STYLE');
   assert.equal(state.trackSpecification.gaugeMm,1435);
   assert.equal(state.mapPinAvailability,false);assert.equal(state.alignmentStatus,'NO_GEOMETRY');
   assert(tileRequests>0,'ORM overlay registered but 0 railway tile HTTP requests were made');
   checks.push('orm-railway-overlay-installed-gauge-spec-separate-no-train-pin','railway-tile-http-request-attempted');
   const input=page.locator('#lab-orm-toggle');
   await input.uncheck();assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).railVisual.visible,false);
   await input.check();assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).railVisual.visible,true);
   checks.push('overlay-toggle-functional');
   await page.locator('#lab-focus-kerteh').click();await page.locator('#lab-fit-corridor').click();
   checks.push('map-navigation-independent');
   await page.getByRole('button',{name:'Ke checkpoint seterusnya'}).click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,33700);
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).mapPinAvailability,false);
   checks.push('ch-only-simulation-no-unsafe-rail-pin');
   assert.equal(errors.length,0,errors.join('; '));
   report.push({engine:engineName,viewport:viewport.name,status:'PASS',tileRequests,tileOk,checks});
   await page.screenshot({path:`${out}/${engineName}-${viewport.name}.png`,fullPage:true});
  }catch(e){report.push({engine:engineName,viewport:viewport.name,status:'FAIL',tileRequests,tileOk,checks,error:String(e.stack||e),pageErrors:errors,railVisual:await page.evaluate(()=>window.MRS10ECRLRouteLab?.snapshot()?.railVisual||null).catch(()=>null)});await page.screenshot({path:`${out}/${engineName}-${viewport.name}-fail.png`,fullPage:true}).catch(()=>{});}
  await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
