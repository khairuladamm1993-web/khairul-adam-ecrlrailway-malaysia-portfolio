import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const base=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html';
const report=[];await fs.mkdir('artifacts/p01-signature-port',{recursive:true});
const warning=/bukan titik hujung rel atau sambungan ECRL yang disahkan/i;
async function hitTarget(page,selector,id){
 const handle=await page.waitForFunction(([selector,id])=>{
  const qa=selector==='portHitTarget'?window.MRS10V8Diagnostics:window.MRS10ECRLCandidateQA;
  return qa[selector](id);
 },[selector,id],{timeout:15000}).catch(error=>{
  throw new Error(`No visible map hit target for ${id} (${selector}): ${error.message}`);
 });
 return handle.jsonValue();
}
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const touch=viewport.name!=='desktop';
  const page=await browser.newPage({viewport,hasTouch:touch,isMobile:touch}),errors=[],networkFailures=[],consoleErrors=[];
  page.on('requestfailed',r=>networkFailures.push({url:r.url(),failure:r.failure()?.errorText}));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('pageerror',e=>errors.push(e.message));
  try{
   const response=await page.goto(base,{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.MRS10V8Diagnostics?.snapshot()?.stage==='DONE',null,{timeout:90000});
   const result=await page.evaluate(()=>{
    const map=window.MRS10V8Diagnostics?.snapshot();
    const port=window.MRS10SignaturePortLayer;
    return {stage:map?.stage,mapReady:map?.mapReady,
      count:port?.references().filter(r=>r.sourceRegistry==='port-klang-references').length,
      provenance:port?.references().filter(r=>r.sourceRegistry==='port-klang-references').every(r=>r.sourceIds.length===1),
      legend:!!document.getElementById('mrs10-port-reference-key'),
      styleLoaded:map?.styleLoaded,webglReady:map?.webglReady,
      canvas:map?.rect,ecrlLayers:map?.ecrl?.layersPresent};
   });
   // Only final MapLibre state counts: the initial snapshot can precede style loading.
   const ready=await page.waitForFunction(()=>{
     const d=window.MRS10V8Diagnostics?.snapshot();
     if(!d?.mapReady||!d.styleLoaded||!d.webglReady||!d.ecrl?.layersPresent)return false;
     return {mapReady:d.mapReady,styleLoaded:d.styleLoaded,webglReady:d.webglReady,
       ecrlLayers:d.ecrl.layersPresent,canvas:d.rect};
   },null,{timeout:45000});
   const final=await ready.jsonValue();
   assert.equal(final.mapReady,true,JSON.stringify({final,networkFailures:networkFailures.slice(0,12),consoleErrors:consoleErrors.slice(0,12)}));
   assert.equal(final.styleLoaded,true);
   assert.equal(final.webglReady,true);
   assert.equal(final.ecrlLayers,true);
   assert(final.canvas.width>0&&final.canvas.height>0);
   assert.equal(result.count,2,JSON.stringify(result));
   assert.equal(result.provenance,true,JSON.stringify(result));
   assert.equal(result.legend,true,JSON.stringify(result));
   const legend=page.locator('#mrs10-port-reference-key');
   await legend.waitFor({state:'visible'});
   assert.match(await legend.innerText(),/Ungu:.*Northport dan Westports/);
   assert.match(await legend.innerText(),warning);
   await legend.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-legend.png`});
   const canvas=page.locator('#map .maplibregl-canvas');
   await canvas.scrollIntoViewIfNeeded();
   const activate=position=>touch?canvas.tap({position}):canvas.click({position});
   const allPopups=page.locator('#map .maplibregl-popup');
   const portPopupChecks=[];
   for(const [id,label] of [
     ['mrs10-port-klang-northport','Northport'],
     ['mrs10-port-klang-westports','Westports']
   ]){
     assert.equal(await page.evaluate(id=>window.MRS10V8Diagnostics.focusPortReference(id),id),true);
     await activate(await hitTarget(page,'portHitTarget',id));
     const popup=allPopups.filter({has:page.locator(`[data-port-reference-id="${id}"]`)});
     await popup.waitFor({state:'visible',timeout:15000});
     assert.equal(await allPopups.count(),1);
     assert.equal(await popup.locator('strong').innerText(),`Port Klang — ${label}`);
     assert.match(await popup.innerText(),warning);
     assert.equal(new URL(await popup.locator('a').getAttribute('href')).hostname,'www.pka.gov.my');
     await page.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-${id}.png`});
     const planning=popup.getByRole('button',{name:'Lihat rekod perancangan ECRL'});
     if(touch)await planning.tap();else await planning.click();
     const planningPopup=allPopups.filter({has:page.locator('.ecrl-intelligence')});
     await planningPopup.waitFor({state:'visible',timeout:15000});
     assert.match(await planningPopup.innerText(),new RegExp(label));
     assert.equal(await allPopups.count(),1);
     portPopupChecks.push({id,status:'PASS',disclaimer:true,coLocatedPlanningPopup:true});
     await planningPopup.locator('.maplibregl-popup-close-button').click();
     await allPopups.waitFor({state:'detached'});
   }
   // At this zoom the two real source references fall within each other's hit radius.
   const north='mrs10-port-klang-northport',rail='ecrl-stn-20';
   assert.equal(await page.evaluate(id=>window.MRS10V8Diagnostics.focusPortReference(id,7),north),true);
   const portPoint=await hitTarget(page,'portHitTarget',north);
   const ecrlPoint=await hitTarget(page,'assetHitTarget',rail);
   const separation=Math.hypot(portPoint.x-ecrlPoint.x,portPoint.y-ecrlPoint.y);
   assert(separation>2&&separation<14,`Expected overlapping targets, got ${separation}px`);
   await activate(portPoint);
   await page.locator(`[data-port-reference-id="${north}"]`).waitFor({state:'visible',timeout:15000});
   await activate(ecrlPoint);
   const railPopup=allPopups.filter({hasText:'Jalan Kastam (Port Klang)'});
   await railPopup.waitFor({state:'visible',timeout:15000});
   assert.equal(await allPopups.count(),1);
   await page.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-ecrl-overlap.png`});
   await railPopup.locator('.maplibregl-popup-close-button').click();
   await allPopups.waitFor({state:'detached'});
   assert.deepEqual(errors,[]);
   report.push({engine,viewport:viewport.name,input:touch?'tap':'click',status:'PASS',result:final,portPopupChecks,
    overlap:{port:north,ecrl:rail,separation,status:'PASS'}});
  }catch(e){report.push({engine,viewport:viewport.name,status:'FAIL',error:String(e),pageErrors:errors,networkFailures:networkFailures.slice(0,12),consoleErrors:consoleErrors.slice(0,12)});
   await page.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-fail.png`}).catch(()=>{});}
  await page.close();
 }await browser.close();
}
await fs.writeFile('artifacts/p01-signature-port/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
