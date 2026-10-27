import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const url=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html';
const out='artifacts/unified-v81-browser';await fs.mkdir(out,{recursive:true});const report=[];
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844},{name:'android',width:412,height:915}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},hasTouch:vp.name!=='desktop'});const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
  const snapshot=()=>page.evaluate(()=>window.MRS10V8Diagnostics.focusSnapshot());
  async function canvasTap(target){const box=await page.locator('#map').boundingBox();if(vp.name==='desktop')await page.mouse.click(box.x+target.x,box.y+target.y);else await page.touchscreen.tap(box.x+target.x,box.y+target.y)}
  async function tapStation(route,id){await page.locator('#map').scrollIntoViewIfNeeded();await page.evaluate(([r,id])=>window.MRS10V8Diagnostics.inspectStation(r,id),[route,id]);await page.waitForTimeout(600);const target=await page.evaluate(([r,id])=>window.MRS10V8Diagnostics.stationHitTarget(r,id),[route,id]);assert(target);await canvasTap(target);await page.waitForFunction(id=>window.MRS10V8Diagnostics.focusSnapshot().current.stationId===id,id,{timeout:10000});await page.locator('.maplibregl-popup').waitFor();}
  async function close(){await page.locator('.maplibregl-popup-close-button').click();await page.waitForFunction(()=>window.MRS10V8Diagnostics.focusSnapshot().current.mode==='NORMAL');assert.equal((await snapshot()).current.mode,'NORMAL')}
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics?.snapshot();return s?.stage==='DONE'&&s.styleLoaded&&s.webglReady&&s.layerCount===33},null,{timeout:90000});
   const initial=await snapshot();assert(await page.locator('#map-details').isHidden());
   await page.locator('#details-toggle').click();assert(await page.locator('#map-details').isVisible());assert.deepEqual((await snapshot()).layers,initial.layers);
   await page.locator('#details-toggle').focus();await page.keyboard.press('Enter');assert(await page.locator('#map-details').isHidden());assert.deepEqual((await snapshot()).layers,initial.layers);checks.push('disclosure-no-map-mutation');
   await tapStation('lrt-kelana-jaya','lrt-kj1');let f=await snapshot();assert.equal(f.current.mode,'STATION_FOCUS');assert.deepEqual(f.current.routeIds,['lrt-kelana-jaya']);assert.match(await page.locator('.maplibregl-popup').innerText(),/PLANNED_CONNECTION/);assert.equal(await page.locator('.intelligence-lineup li').count(),37);checks.push('station-real-canvas');
   await close();assert.deepEqual((await snapshot()).layers,initial.layers);checks.push('station-exact-restore');
   await tapStation('mrt-putrajaya','mrt-py08');f=await snapshot();assert.equal(f.current.mode,'INTERCHANGE_FOCUS');assert.deepEqual(f.current.routeIds.slice().sort(),['ktm-port-klang','mrt-putrajaya']);const first=f.original;
   // Second direct interchange on the same visible Putrajaya route, no external route control.
   await tapStation('mrt-putrajaya','mrt-py17');f=await snapshot();assert.equal(f.current.mode,'INTERCHANGE_FOCUS');assert.deepEqual(f.original,first);assert(!f.current.routeIds.includes('ktm-port-klang'));checks.push('interchange-replacement-no-recursion');
   await page.locator('#map').screenshot({path:`${out}/${engine}-${vp.name}-interchange.png`});await close();assert.deepEqual((await snapshot()).layers,initial.layers);
   await page.locator('#filters button').getByText('LRT',{exact:true}).click();const filtered=await snapshot();assert.equal(filtered.layers.find(l=>l.id==='mrs10-v8-mrt-kajang').visibility,'none');await tapStation('lrt-kelana-jaya','lrt-kj1');await close();assert.deepEqual((await snapshot()).layers,filtered.layers);checks.push('filtered-restore');
   await page.locator('#reset').click();await page.locator('#details-toggle').click();await page.locator('#approximate').check();const secondary=await snapshot();await page.locator('#details-toggle').click();
   await page.locator('#map').scrollIntoViewIfNeeded();await page.evaluate(()=>window.MRS10V8Diagnostics.focusTrackInspection());await page.waitForFunction(()=>window.MRS10V8Diagnostics.trackHitTargets().length>0,null,{timeout:30000});
   const targets=await page.evaluate(()=>window.MRS10V8Diagnostics.trackHitTargets());let track=false;for(const t of targets.slice(0,40)){await canvasTap(t);await page.waitForFunction(()=>window.MRS10V8Diagnostics.focusSnapshot().current.mode==='TRACK_FOCUS',null,{timeout:1200}).catch(()=>{});if((await snapshot()).current.mode==='TRACK_FOCUS'){track=true;break}}assert(track);f=await snapshot();assert(f.current.segmentIds.length>0);assert.match(await page.locator('.maplibregl-popup').innerText(),/OSM_TOPOLOGY_MATCHED/);assert.match(await page.locator('.maplibregl-popup').innerText(),/UNKNOWN/);checks.push('physical-track-real-canvas');
   await page.locator('#map').screenshot({path:`${out}/${engine}-${vp.name}-track.png`});const trackOriginal=(await snapshot()).original;await tapStation('sg-RTS','MY-BUKIT-CHAGAR');assert.equal((await snapshot()).current.mode,'STATION_FOCUS');assert.deepEqual((await snapshot()).original,trackOriginal);checks.push('marker-priority-and-track-to-station');await close();assert.deepEqual((await snapshot()).layers,secondary.layers);assert.equal((await snapshot()).approximate,true);checks.push('physical-and-secondary-restore');
   for(let i=0;i<4;i++)await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'ms');
   for(let i=0;i<2;i++){await page.locator('#theme').click();await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics.snapshot();return s.styleLoaded&&s.layerCount===33},null,{timeout:45000})}
   await tapStation('mrt-putrajaya','mrt-py08');await page.locator('#details-toggle').click();assert.equal((await snapshot()).current.mode,'INTERCHANGE_FOCUS');await close();checks.push('theme-language-disclosure-regression');
   assert.equal(errors.length,0,errors.join(';'));report.push({engine,viewport:vp.name,status:'PASS',checks,snapshot:await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot())});
  }catch(e){report.push({engine,viewport:vp.name,status:'FAIL',checks,error:String(e.stack),focus:await snapshot().catch(()=>null),errors});await page.screenshot({path:`${out}/${engine}-${vp.name}-fail.png`,fullPage:true}).catch(()=>{})}
  await page.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
 }
 await browser.close();
}
console.log(JSON.stringify(report,null,2));if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
