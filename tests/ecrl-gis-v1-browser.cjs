/* Actual desktop/iPad/iPhone MapLibre smoke; network-dependent. Never infer PASS from static data alone. */
'use strict';
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const TARGET=process.env.ECRL_TEST_URL||'http://127.0.0.1:8765/ecrl-gis-v1.html';
const cases=[{name:'desktop',width:1440,height:900,isMobile:false,hasTouch:false},
 {name:'ipad',width:1024,height:768,isMobile:true,hasTouch:true},
 {name:'iphone',width:390,height:844,isMobile:true,hasTouch:true}];
(async()=>{
 fs.mkdirSync('qa-ecrl-screens',{recursive:true});
 const rows=[];
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const vp of cases){
   let browser,context,page;
   const name=engine+'-'+vp.name;
   const row={name,status:'FAIL',languages:[],markers:0,mapReady:false,errors:[]};
   try{
    browser=await type.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-angle=swiftshader','--disable-web-security']:[]});
    context=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.isMobile,hasTouch:vp.hasTouch,deviceScaleFactor:1});
    page=await context.newPage();
    page.on('pageerror',e=>row.errors.push('JS:'+e.message));
    await page.goto(TARGET,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>!!window.MRS10ECRLV1QA,{timeout:15000});
    await page.waitForFunction(()=>window.MRS10ECRLV1QA.getSnapshot().mapReady,{timeout:25000});
    const before=await page.evaluate(()=>({map:document.querySelector('#ecrl-map canvas')?.isConnected,
      snap:window.MRS10ECRLV1QA.getSnapshot()}));
    assert.equal(before.map,true,'MapLibre canvas not mounted');
    assert.ok(before.snap.styleLoaded,'Map style not ready');assert.ok(before.snap.sourcePresent,'GIS source missing');assert.ok(before.snap.layerPresent,'GIS layer missing');
    assert.ok(before.snap.referenceMarkers>0,'No reference markers rendered');
    row.mapReady=true;row.markers=before.snap.referenceMarkers;
    await page.locator('#asset-list button[data-asset-id="ecrl-stn-17"]').click();
    const selected=await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot().selectedAssetId);
    assert.equal(selected,'ecrl-stn-17');
    const canvasHandle=await page.locator('#ecrl-map canvas').elementHandle();
    for(const lang of ['ms','en','zh','th']){
      await page.locator('[data-lang="'+lang+'"]').click();
      const snap=await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot());
      assert.equal(snap.language,lang);assert.equal(snap.selectedAssetId,'ecrl-stn-17');
      assert.equal(snap.mapReady,true);
      assert.equal(snap.styleLoaded,true);
      assert.equal(snap.referenceMarkers,before.snap.referenceMarkers);
      assert.equal(await page.locator('#ecrl-map canvas').elementHandle().then(h=>h.evaluate((el,first)=>el.isConnected,1)),true);
      assert.equal(await page.locator('#detail-panel').isVisible(),true);
      row.languages.push(lang);
    }
    await page.locator('#scope-all').click();
    await page.waitForTimeout(450);
    const full=await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot());
    assert.equal(full.referenceMarkers,16,'All-corridor reference count');
    assert.equal(full.physicalTrackFeatures,0);
    const first=page.locator('.ecrl-pin').first();
    const bbox=await first.boundingBox();assert.ok(bbox&&bbox.width>=44&&bbox.height>=44,'marker hit target');
    const square=await page.locator('.loop-demo').evaluate(el=>getComputedStyle(el).borderRadius);
    assert.equal(square,'3px','square crossing-loop sample shape');
    await page.locator('#theme').click();
    const dark=await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot());
    assert.equal(dark.theme,'dark');assert.ok(dark.mapReady);
    await page.screenshot({path:'qa-ecrl-screens/'+name+'.png',fullPage:false});
    if(row.errors.length)throw Error('Browser console exceptions: '+row.errors.join('; '));
    row.status='PASS';
   }catch(err){row.errors.push(String(err?.message||err));try{await page?.screenshot({path:'qa-ecrl-screens/'+name+'-fail.png'});}catch{}}
   finally{try{await context?.close();await browser?.close();}catch{}}
   rows.push(row);console.log(JSON.stringify(row));
  }
 }
 fs.writeFileSync('qa-ecrl-screens/report.json',JSON.stringify(rows,null,2));
 assert.ok(rows.every(r=>r.status==='PASS'),'At least one real browser/viewport QA case failed');
})().catch(e=>{console.error(e);process.exitCode=1;});
