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
    await page.waitForFunction(()=>!!window.MRS10ECRLV1QA,null,{timeout:15000});
    await page.waitForFunction(()=>window.MRS10ECRLV1QA.getSnapshot().mapReady,null,{timeout:20000});
    await page.waitForFunction(()=>{
      const s=window.MRS10ECRLV1QA.getSnapshot();
      return s.mapReady&&s.styleLoaded&&s.sourcePresent&&s.layerPresent;
    },null,{timeout:12000}).catch(async e=>{
      row.errors.push('DIAGNOSTIC:'+JSON.stringify(await page.evaluate(()=>{
       const ss=window.MRS10ECRLV1QA.getSnapshot();
       return {...ss,mapErrorText:document.getElementById('map-status')?.textContent,
         canvasSize:[document.querySelector('#ecrl-map canvas')?.width,document.querySelector('#ecrl-map canvas')?.height]};
      })));
      throw e;
    });
    await page.waitForTimeout(700); // allow initial fitBounds animation and tile/style transitions to settle
     await page.waitForFunction(()=>{const s=window.MRS10ECRLV1QA.getSnapshot();return s.mapReady&&s.styleLoaded&&s.sourcePresent&&s.layerPresent;},null,{timeout:20000});
     const before=await page.evaluate(()=>({map:document.querySelector('#ecrl-map canvas')?.isConnected,
      snap:window.MRS10ECRLV1QA.getSnapshot()}));
    assert.equal(before.map,true,'MapLibre canvas not mounted');
    assert.ok(before.snap.styleLoaded,'Map style not ready');assert.ok(before.snap.sourcePresent,'GIS source missing');assert.ok(before.snap.layerPresent,'GIS layer missing');
    assert.equal(before.snap.referenceMarkers,7,'C2 needs four EIA 2017 site references + two port maritime references + Gombak');
     assert.equal(before.snap.c2PlanningReferences,4);assert.equal(before.snap.portAreaReferences,2);
     assert.equal(before.snap.verifiedLoops,0);
    row.mapReady=true;row.markers=before.snap.referenceMarkers;
    await page.locator('#asset-list button[data-asset-id="ecrl-stn-17"]').click();
    const selected=await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot().selectedAssetId);
    assert.equal(selected,'ecrl-stn-17');
     await page.locator('#detail-close').click(); // close the original selection before the multi-item C2 tap matrix
    for(const id of ['ecrl-stn-17','ecrl-stn-18','ecrl-stn-19','ecrl-stn-20','ecrl-yard-puncak-alam','ecrl-port-northport','ecrl-port-westports']){
       await page.locator('#asset-list button[data-asset-id="'+id+'"]').click();
       assert.equal(await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot().selectedAssetId),id);
       assert.equal(await page.locator('#detail-panel').isVisible(),true);
       const note=await page.locator('#detail-content').innerText();
       if(id.includes('port-'))assert.ok(/PKA|港务|PKA/.test(note),id+' PKA maritime provenance');
       if(id==='ecrl-yard-puncak-alam')assert.ok(/2017/.test(note),'Yard reference is proxy, not actual site');
       await page.locator('#detail-close').click();
     }
     await page.locator('#asset-list button[data-asset-id="ecrl-stn-17"]').click();
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
    assert.equal(full.referenceMarkers,22,'All-corridor reference count');
    assert.equal(full.physicalTrackFeatures,0);
    const targets=await page.locator('.ecrl-pin').evaluateAll(els=>els.map(el=>{
      const r=el.getBoundingClientRect();
      return {assetId:el.dataset.assetId,x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height};
    }));
    assert.equal(targets.length,22,'All-corridor marker count in DOM');
    assert.ok(targets.every(t=>t.width>=43.9&&t.height>=43.9),
      '44px marker hit-target CSS dimensions '+JSON.stringify(targets.filter(t=>t.width<43.9||t.height<43.9)));
    await page.locator('#show-list').click(); // remove list overlay before testing real map marker tap
    const accessible=await page.locator('.ecrl-pin').evaluateAll(els=>{
      for(const el of els){
        const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        if(x<23||x>innerWidth-23||y<56||y>innerHeight-60)continue;
        const hit=document.elementFromPoint(x,y);
        if(hit&&(hit===el||el.contains(hit)))return el.dataset.assetId;
      }
      return null;
    });
    assert.ok(accessible,'At least one marker must be visually tappable within the map');
    await page.locator('.ecrl-pin[data-asset-id="'+accessible+'"]').click({timeout:4000});
    assert.equal(await page.evaluate(()=>window.MRS10ECRLV1QA.getSnapshot().selectedAssetId),accessible,
      'MapLibre station-marker tap must select matching asset');
    assert.equal(await page.locator('.ecrl-pin[data-shape="historical-reference"]').count(),4);
     assert.equal(await page.locator('.ecrl-pin[data-shape="port-reference"]').count(),2);
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
