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
   if(!result.mapReady)await page.waitForFunction(()=>window.MRS10V8Diagnostics?.snapshot()?.mapReady===true,{timeout:30000}).catch(()=>{});
   const ready=await page.evaluate(()=>window.MRS10V8Diagnostics?.snapshot()?.mapReady);
   assert.equal(ready,true,JSON.stringify({result,networkFailures:networkFailures.slice(0,12),consoleErrors:consoleErrors.slice(0,12)}));assert.equal(result.count,2,JSON.stringify(result));
   assert.equal(result.provenance,true,JSON.stringify(result));assert.equal(result.legend,true,JSON.stringify(result));
   assert.deepEqual(errors,[]);
   report.push({engine,viewport:viewport.name,status:'PASS',result});
  }catch(e){report.push({engine,viewport:viewport.name,status:'FAIL',error:String(e),pageErrors:errors,networkFailures:networkFailures.slice(0,12),consoleErrors:consoleErrors.slice(0,12)});
   await page.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-fail.png`}).catch(()=>{});}
  await page.close();
 }await browser.close();
}
await fs.writeFile('artifacts/p01-signature-port/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
