import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const addr=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html';
const out='artifacts/d102-r16',results=[];await fs.mkdir(out,{recursive:true});
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(engineName==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const v of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
 const page=await browser.newPage({viewport:{width:v.width,height:v.height},hasTouch:v.name!=='desktop'}),checks=[],pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 try{
  assert.equal((await page.goto(addr,{waitUntil:'domcontentloaded'})).status(),200);
  await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.journeyR16?.journey&&window.MRS10ECRLRouteLab?.snapshot()?.stationMap?.installed,null,{timeout:60000});
  let snap=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
  assert.equal(snap.session.currentCH,670);assert.equal(snap.journeyR16.journey.ledgerCount,0);
  checks.push('migration preserves original STN01 CH000+670');
  // Existing button now uses R1.6 checkpoint authority instead of directly advancing.
  await page.getByRole('button',{name:'Ke checkpoint seterusnya'}).click();
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'DEPARTURE');
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,670);
  await page.locator('#lab-r16-ack').click();
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'NEXT');
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).CH,33700);
  await page.locator('#lab-r16-ack').click();
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'ARRIVAL');
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,33700);
  await page.locator('#lab-r16-ack').click();
  assert.equal(await page.locator('#lab-r16-dialog').evaluate(el=>el.open),false);
  checks.push('three popups: departure/next/arrival, no CH bypass');
  const layout={code:'STN02',title:'QA-only track schematic',source:'Owner allowed source test fixture',tracks:[
    {id:'M',role:'mainline',points:[[5,35],[95,35]]},
    {id:'L',role:'loop',points:[[15,72],[88,72]]}
  ]};
  await page.locator('#lab-r16-layout-file').setInputFiles({name:'qa-only-layout.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(layout))});
  await page.waitForFunction(()=>window.MRS10D102JourneyUI.snapshot().layouts.count===1);
  assert.equal(await page.locator('#lab-r16-layout-panel svg polyline').count(),2);
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.snapshot())).layouts.publicPublished,false);
  checks.push('structured file generates STN02 source-only SVG and map overlay without public publication');
  await page.locator('#lab-r16-infra-type').selectOption('QZ_CURVE');
  await page.locator('#lab-r16-infra-ch').fill('39000');
  await page.locator('#lab-r16-infra-source').fill('QA imported geometry reference not surveyed');
  await page.locator('#lab-r16-infra-name').fill('Test QZ curve');
  await page.getByRole('button',{name:'Rekod peristiwa infrastruktur'}).click();
  await page.waitForFunction(()=>window.MRS10D102JourneyUI.snapshot().journey.infrastructure.length===1);
  await page.getByRole('button',{name:'Ke checkpoint seterusnya'}).click();
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'DEPARTURE');
  await page.locator('#lab-r16-ack').click();
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).CH,39000);
  await page.locator('#lab-r16-ack').click();
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'INFRASTRUCTURE');
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,39000);
  await page.locator('#lab-r16-ack').click(); // auto resume CH to STN03
  assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'ARRIVAL');
  assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,51450);
  await page.locator('#lab-r16-ack').click();
  checks.push('QZ triggered on source CH, stop and automatic CH-only resume');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.journeyR16?.journey);
  snap=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
  assert.equal(snap.session.currentCH,51450);
  assert.equal(snap.journeyR16.layouts.count,1);
  assert.equal(snap.journeyR16.journey.infrastructure.length,1);
  assert(snap.journeyR16.journey.ledgerCount>=10);
  assert.equal(snap.mapPinAvailability,false);
  assert.equal(snap.journeyR16.journey.liveGPS,false);
  checks.push('restore CH, confirmed events, layout after refresh; no invented physical train GPS');
  const oldBackup={schema:1,session:{schema:1,mode:'SIMULATION',trainId:'D102-SIM',
   origin:'STN01',destination:'STN17',currentCH:88220,events:[],reviews:[],verifiedAsBuilt:false,gpsUsed:false}};
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#lab-r16-backup-file').setInputFiles({
   name:'qa-old-private-session.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(oldBackup))});
  await page.waitForFunction(()=>window.MRS10ECRLRouteLab.snapshot().session.currentCH===88220);
  const restored=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
  assert.equal(restored.journeyR16.journey.ledgerCount>=10,true);
  assert.equal(restored.mapPinAvailability,false);
  checks.push('safe private R1.5 backup import resumes CH across Preview origin without invented geometry');
  const errors=pageErrors.filter(e=>!(/openrailwaymap|tiles.maps.eox.at/i.test(e)&&/access control|network error|failed to load/i.test(e)));
  assert.equal(errors.length,0,errors.join('; '));
  results.push({engine:engineName,viewport:v.name,status:'PASS',checks});
  await page.screenshot({path:`${out}/${engineName}-${v.name}.png`,fullPage:true});
 }catch(e){results.push({engine:engineName,viewport:v.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors});
 await page.screenshot({path:`${out}/${engineName}-${v.name}-fail.png`,fullPage:true}).catch(()=>{});}
 await fs.writeFile(out+'/report.json',JSON.stringify(results,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(results));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
