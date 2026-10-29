import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html',path='artifacts/ecrl-lab-r14',results=[];
await fs.mkdir(path,{recursive:true});
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(engineName==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const screen of [{name:'desktop',width:1180,height:800},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height},hasTouch:screen.name!=='desktop'}),checks=[],errors=[];
  let ormTileRequests=0,satelliteRequests=0,ormSuccess=0,satelliteSuccess=0;
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('tiles.openrailwaymap.org/standard/'))ormTileRequests++;if(r.url().includes('s2cloudless_3857'))satelliteRequests++});
  page.on('response',r=>{if(r.url().includes('tiles.openrailwaymap.org/standard/')&&r.ok())ormSuccess++;if(r.url().includes('s2cloudless_3857')&&r.ok())satelliteSuccess++});
  try{
   assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.stationMap?.installed&&window.MRS10ECRLRouteLab?.snapshot()?.freightReferences?.installed,null,{timeout:90000});
   const initial=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(initial.stationMap.stationCount,16);assert.equal(initial.stationMap.plCount,7);
   assert.equal(initial.stationMap.selected,'STN01');assert.equal(initial.freightReferences.count,5);
   assert.equal(initial.freightReferences.ports,4);assert.equal(initial.freightReferences.yards,1);
   assert.equal(initial.session.currentCH,670);
   assert.equal(initial.mapPinAvailability,false);
   checks.push('STN01 CH000+670 and 16 station localities + 7 PL CH references');
   assert.match(await page.locator('#lab-station-intelligence').innerText(),/STN01/);
   assert.match(await page.locator('#lab-station-intelligence').innerText(),/CH000\+670/);
   assert(await page.locator('#lab-map').isVisible());
   assert.equal((await page.evaluate(()=>window.MRS10ECRLSatelliteBasemap.snapshot())).mode,'satellite');
   await page.locator('#lab-basemap-street').click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLSatelliteBasemap.snapshot())).mode,'street');
   await page.locator('#lab-basemap-satellite').click();
   checks.push('satellite and street modes toggle');
   await page.locator('#lab-freight-select').selectOption('ecrl-port-kemaman');
   assert.match(await page.locator('#lab-freight-intelligence').innerText(),/Kemaman Port/);
   await page.locator('#lab-freight-select').selectOption('ecrl-yard-kerteh-petronas');
   assert.match(await page.locator('#lab-freight-intelligence').innerText(),/Kerteh Railway Yard/);
   checks.push('port purple and historic yard amber reference intelligence');
   await page.getByRole('button',{name:'Ke checkpoint seterusnya'}).click();
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,33700);
   const trail=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().chTrail);
   assert(trail.pointCount>300);assert.equal(trail.geographicCoordinates,null);
   assert.equal(trail.trackGeometryVerified,false);
   checks.push('100-metre CH-only breadcrumb and no road/GPS movement');
   if(errors.length)throw Error('Page JS: '+errors.join(' ; '));
   await page.screenshot({path:`${path}/${engineName}-${screen.name}.png`,fullPage:true});
   results.push({engine:engineName,viewport:screen.name,status:'PASS',checks,ormTileRequests,ormSuccess,satelliteRequests,satelliteSuccess});
  }catch(e){
   await page.screenshot({path:`${path}/${engineName}-${screen.name}-fail.png`,fullPage:true}).catch(()=>{});
   results.push({engine:engineName,viewport:screen.name,status:'FAIL',checks,errors,ormTileRequests,ormSuccess,satelliteRequests,satelliteSuccess,error:String(e.stack||e)});
  }
  await fs.writeFile(path+'/report.json',JSON.stringify(results,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(results));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
