import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const base=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html';
const report=[];await fs.mkdir('artifacts/p01-signature-port',{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.name!=='desktop'}),errors=[],networkFailures=[],consoleErrors=[];
  page.on('requestfailed',r=>networkFailures.push({url:r.url(),failure:r.failure()?.errorText}));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('pageerror',e=>errors.push(e.message));
  try{
   const response=await page.goto(base,{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.MRS10V8Diagnostics?.snapshot()?.stage==='DONE',{timeout:90000});
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
   await page.waitForFunction(()=>{
     const d=window.MRS10V8Diagnostics?.snapshot();
     return d?.mapReady===true&&d?.styleLoaded===true&&d?.webglReady===true&&d?.ecrl?.layersPresent===true;
   },null,{timeout:45000});
   const final=await page.evaluate(()=>{
     const d=window.MRS10V8Diagnostics.snapshot();
     return {mapReady:d.mapReady,styleLoaded:d.styleLoaded,webglReady:d.webglReady,
       ecrlLayers:d.ecrl?.layersPresent,canvas:d.rect};
   });
   assert.equal(final.mapReady,true,JSON.stringify({final,networkFailures:networkFailures.slice(0,12),consoleErrors:consoleErrors.slice(0,12)}));
   assert.equal(final.styleLoaded,true);
   assert.equal(final.webglReady,true);
   assert.equal(final.ecrlLayers,true);
   assert(final.canvas.width>0&&final.canvas.height>0);
   assert.equal(result.count,2,JSON.stringify(result));
   assert.equal(result.provenance,true,JSON.stringify(result));
   assert.equal(result.legend,true,JSON.stringify(result));
   assert.deepEqual(errors,[]);
   report.push({engine,viewport:viewport.name,status:'PASS',result:final});
  }catch(e){report.push({engine,viewport:viewport.name,status:'FAIL',error:String(e),pageErrors:errors,networkFailures:networkFailures.slice(0,12),consoleErrors:consoleErrors.slice(0,12)});
   await page.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-fail.png`}).catch(()=>{});}
  await page.close();
 }await browser.close();
}
await fs.writeFile('artifacts/p01-signature-port/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
