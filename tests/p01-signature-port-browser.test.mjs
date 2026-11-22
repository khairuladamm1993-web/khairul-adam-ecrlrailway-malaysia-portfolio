import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const base=process.env.V8_URL||'http://127.0.0.1:8765/unified-map-v8.html';
const report=[];await fs.mkdir('artifacts/p01-signature-port',{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.name!=='desktop'}),errors=[];
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
      legend:!!document.getElementById('mrs10-port-reference-key')};
   });
   assert.equal(result.mapReady,true);assert.equal(result.count,2);
   assert.equal(result.provenance,true);assert.equal(result.legend,true);
   assert.deepEqual(errors,[]);
   report.push({engine,viewport:viewport.name,status:'PASS',result});
  }catch(e){report.push({engine,viewport:viewport.name,status:'FAIL',error:String(e),pageErrors:errors});
   await page.screenshot({path:`artifacts/p01-signature-port/${engine}-${viewport.name}-fail.png`}).catch(()=>{});}
  await page.close();
 }await browser.close();
}
await fs.writeFile('artifacts/p01-signature-port/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(report.some(r=>r.status==='FAIL'))process.exitCode=1;
