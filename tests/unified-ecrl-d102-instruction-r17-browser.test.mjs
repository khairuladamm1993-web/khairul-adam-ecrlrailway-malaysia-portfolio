import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const url=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html',dir='artifacts/d102-instruction-r17',results=[];await fs.mkdir(dir,{recursive:true});
const bundle={schema:'mrs10-d102-instruction-bundle-v1',bundleId:'qa-stn01-r17',issuedBy:'ChatGPT-Adam',
 purpose:'Owner-approved CH-only test without physical railway geolocation',
 commands:[
  {id:'FOCUS',action:'FOCUS_ASSET',assetCode:'STN01'},
  {id:'GAP',action:'FLAG_GEOMETRY_GAP',assetCode:'STN01',field:'TRACK_CENTERLINE',
   reason:'No full source-backed railway centreline verified at STN01 for physical movement',source:'MR-S10 owner review notes'},
  {id:'CAM',action:'SET_CAMERA_VIEW',view:'3d'}
 ]};
for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch(engine==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.name!=='desktop'}),checks=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10D102InstructionUI?.snapshot()?.engine==='DETERMINISTIC_LOCAL_ALLOWED_ACTIONS_ONLY',null,{timeout:70000});
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().session.currentCH)),670);
   assert.equal(await page.locator('#lab-r17-master-export').isDisabled(),true);
   assert.equal((await page.evaluate(()=>window.MRS10D102InstructionUI.snapshot().assistantAudit.anchors)),23);
   checks.push('Owner instruction runner initialized, master export gated and 23 assets audited');
   await page.locator('#lab-r17-instruction-file').setInputFiles({name:'chatgpt-adam.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});
   await page.waitForFunction(()=>window.MRS10D102InstructionUI.snapshot().active?.bundleId==='qa-stn01-r17');
   assert.equal((await page.evaluate(()=>window.MRS10D102InstructionUI.snapshot().active.commands[0].status)),'PENDING_OWNER');
   checks.push('uploaded JSON is inert until Owner approval');
   page.once('dialog',d=>d.accept());
   await page.getByRole('button',{name:'Saya semak & luluskan bundle untuk simulasi CH sahaja'}).click();
   await page.waitForFunction(()=>window.MRS10D102InstructionUI.snapshot().active.reviewStatus==='OWNER_APPROVED');
   for(let i=0;i<3;i++){
     await page.locator('.lab-r17-command').nth(i).getByRole('button',{name:'Jalankan arahan ini'}).click();
     await page.waitForFunction(index=>window.MRS10D102InstructionUI.snapshot().active.commands[index].status==='COMPLETED',i,{timeout:20000});
   }
   assert.equal((await page.evaluate(()=>window.MRS10D102InstructionUI.snapshot().gapCount)),1);
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().camera.view)),'3d');
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().session.currentCH)),670);
   checks.push('three approved actions complete, gap recorded, camera 3D only, CH unaffected');
   await page.waitForFunction(()=>!document.getElementById('lab-r17-master-export').disabled);
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#lab-r17-master-export').click()]);
   const filepath=await download.path(),master=JSON.parse(await fs.readFile(filepath,'utf8'));
   assert.equal(master.schema,'mrs10-ecrl-d102-master-handoff-v1');
   assert.equal(master.assetRegistry.length,23);
   assert.equal(master.acceptance.stationCount,16);assert.equal(master.acceptance.passingLoopCount,7);
   assert.equal(master.assetRegistry[0].CHLabel,'CH000+670');
   assert.equal(master.assetRegistry.at(-1).CHLabel,'CH524+160');
   assert.equal(master.acceptance.allInstructionCommandsCompleted,true);
   assert.equal(master.acceptance.geographicD102TrainRelease,false);
   checks.push('single portable JSON master includes 23 CH STN/PL, audit and no false surveyed data');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MRS10D102InstructionUI?.snapshot()?.active?.commands?.every(x=>x.status==='COMPLETED'),null,{timeout:60000});
   assert.equal((await page.evaluate(()=>window.MRS10D102InstructionUI.snapshot().gapCount)),1);
   checks.push('Owner instruction progress and audit persist after refresh');
   const appErrors=errors.filter(e=>!(/openrailwaymap|tiles.maps.eox.at|127\.0\.0\.1:\d+\/[0-9a-f-]{32,}/i.test(e)&&/access control|failed to load|network error/i.test(e)));
   assert.equal(appErrors.length,0,appErrors.join('; '));
   results.push({engine,viewport:viewport.name,status:'PASS',checks});await page.screenshot({path:`${dir}/${engine}-${viewport.name}.png`,fullPage:true});
  }catch(e){results.push({engine,viewport:viewport.name,status:'FAIL',checks,error:String(e.stack||e),pageErrors:errors});
   await page.screenshot({path:`${dir}/${engine}-${viewport.name}-fail.png`,fullPage:true}).catch(()=>{})}
  await fs.writeFile(dir+'/report.json',JSON.stringify(results,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(results));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
