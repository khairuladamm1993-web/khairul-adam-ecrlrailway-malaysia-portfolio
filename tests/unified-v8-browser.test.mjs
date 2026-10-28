import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const url=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html';
const report=[];await fs.mkdir('artifacts/unified-v8-browser',{recursive:true});
for(const engine of ['chromium','webkit'].filter(e=>!process.env.V8_QA_ENGINES||process.env.V8_QA_ENGINES.split(',').includes(e))){
 const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 try{for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}].filter(v=>!process.env.V8_QA_VIEWPORTS||process.env.V8_QA_VIEWPORTS.split(',').includes(v.name))){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const snap=()=>page.evaluate(()=>window.MRS10V8Diagnostics.snapshot());
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics?.snapshot();return s?.stage==='DONE'&&s.styleLoaded&&s.webglReady&&s.layerCount===33},null,{timeout:90000});
   await page.locator('#details-toggle').click();
   const s=await snap();assert.equal(s.mapInstances,1);assert.equal(s.singaporeSourceRecords,273);assert.equal(s.borderRecords,4);
   const baseline={'mrt-kajang':29,'lrt-kelana-jaya':37,'lrt-ampang':18,'mrt-putrajaya':36,'lrt-sri-petaling':29,'kl-monorail':11,'erl-klia-ekspres':3,'erl-klia-transit':6,'ktmb-ets-v1':38,'ktmb-ert':23};
   for(const [id,n] of Object.entries(baseline))assert.equal(s.perRoute[id].matched,n,id);
   assert(s.sourceMatched>=596);assert.equal(s.perRoute['sg-RTS'].matched,2);assert.equal(s.perRoute['sg-SHUTTLE_TEBRAU'].matched,2);assert.equal(s.geometry.osm,75);assert(s.geometry.sourcePresent);
   await page.locator('#filters button').getByText('Singapore',{exact:true}).click();assert.equal((await snap()).perRoute['mrt-kajang'].visible,false);
   await page.locator('#route-buttons button').getByText('East–West Line',{exact:true}).click();assert.equal(await page.locator('#path-select option').count(),4);
   await page.locator('#path-select').selectOption({index:2});assert.equal(await page.locator('#lineup li').count(),3);
   await page.locator('#lineup button').first().click();await page.locator('.maplibregl-popup').waitFor({state:'visible',timeout:15000});assert.equal(await page.locator('.maplibregl-popup').count(),1);
   await page.locator('#route-buttons button').filter({hasText:'RTS'}).first().click();await page.locator('#lineup button').first().click();await page.locator('.maplibregl-popup').waitFor({state:'visible',timeout:15000});assert((await page.locator('.maplibregl-popup').innerText()).includes('Bukit Chagar'));
   for(let i=0;i<4;i++){await page.locator('#language').click();assert.equal((await snap()).layerCount,33);assert.equal(await page.locator('#lineup li').count(),2)}
   for(let i=0;i<2;i++){await page.locator('#theme').click();await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics.snapshot();return s.styleLoaded&&s.layerCount===33&&s.geometry.sourcePresent},null,{timeout:45000});}
   await page.locator('#reset').click();assert.equal((await snap()).category,'All');
   await page.locator('#approximate').check();
   await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics.snapshot();return s.styleLoaded&&s.tilesLoaded&&s.renderedFeatureCount>=596},null,{timeout:60000});
   const fullSnapshot=await snap();
   await page.locator('#route-buttons button').filter({hasText:'RTS'}).first().click();
   // Inspect genuine RTS-tagged OSM segments at a usable map scale; verify
   // a real pointer click, not a synthetic call to the popup implementation.
   // Scroll first. Scrolling AFTER sampling hit coordinates can trigger a
   // responsive canvas resize and invalidate projected targets on iPad.
   await page.locator('#map').scrollIntoViewIfNeeded();
   await page.evaluate(()=>{if(!window.MRS10V8Diagnostics.focusTrackInspection())throw Error('RTS_TRACK_CAMERA_UNAVAILABLE')});
   await page.waitForFunction(()=>{
    const d=window.MRS10V8Diagnostics;
    return d.snapshot().geometry.rendered>0&&d.trackHitTargets().length>0;
   },null,{timeout:30000});
   const targets=await page.evaluate(()=>window.MRS10V8Diagnostics.trackHitTargets());
   const box=await page.locator('#map').boundingBox();
   let trackClicked=false;
   for(const target of targets.slice(0,40)){
    await page.mouse.click(box.x+target.x,box.y+target.y);
    if((await page.locator('.maplibregl-popup').allTextContents()).join(' ').includes('OSM_TOPOLOGY_MATCHED')){trackClicked=true;break}
   }
   assert(trackClicked,'OSM_TRACK_POPUP_MISSING:'+JSON.stringify({targets:targets.length,box,popup:await page.locator('.maplibregl-popup').allTextContents()}));
   await page.waitForFunction(()=>{const s=window.MRS10V8Diagnostics.snapshot();return s.mapReady&&s.styleLoaded&&s.tilesLoaded},null,{timeout:45000});
   await page.screenshot({animations:'disabled',path:`artifacts/unified-v8-browser/${engine}-${vp.name}-track.png`});
   await page.locator('#reset').click();
   await page.waitForFunction(()=>window.MRS10V8Diagnostics.snapshot().renderedFeatureCount>=596,null,{timeout:45000});
   await page.screenshot({path:`artifacts/unified-v8-browser/${engine}-${vp.name}.png`,fullPage:false});
   assert.equal(errors.length,0,errors.join(';'));
   report.push({engine,viewport:vp.name,status:'PASS',snapshot:await snap(),fullSnapshot,trackClicked,errors});
  }catch(e){report.push({engine,viewport:vp.name,status:'FAIL',error:e.stack||String(e),snapshot:await snap().catch(()=>null),errors});await page.screenshot({path:`artifacts/unified-v8-browser/${engine}-${vp.name}-fail.png`,fullPage:false}).catch(()=>{});}finally{await page.close()}
 }}finally{await browser.close();await fs.writeFile('artifacts/unified-v8-browser/report.json',JSON.stringify(report,null,2));}
}
console.log(JSON.stringify(report,null,2));if(report.some(r=>r.status!=='PASS'))process.exitCode=1;
