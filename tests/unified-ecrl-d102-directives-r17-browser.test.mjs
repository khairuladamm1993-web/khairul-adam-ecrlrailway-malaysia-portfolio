import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const base=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html';
const out='artifacts/d102-r17-directives',report=[];
await fs.mkdir(out,{recursive:true});
const pack={schema:'mrs10-d102-owner-directives-v1',scope:'MR_S10_P01_D102_LAB',
 assignmentId:'D102_R17_BROWSER_QA',title:'STN01 source-based review',originLabel:'ChatGPT Adam QA specimen',
 commands:[
 {id:'QA001',op:'SELECT_ASSET',payload:{assetCode:'STN01'}},
 {id:'QA002',op:'RECORD_GEOMETRY_GAP',payload:{
  assetCode:'STN01',CH:670,source:'Owner-accepted corridor CH registry',
  description:'Station turnout georeferenced coordinates and track connection remain unknown.'}},
 {id:'QA003',op:'IMPORT_LAYOUT_DRAFT',payload:{
  assetCode:'STN01',title:'QA visual schematic only',
  source:'Public licensed source schematic QA specimen, not as built',
  tracks:[{id:'L1',role:'mainline',points:[[4,35],[96,35]]}]}},
 {id:'QA004',op:'ASSISTANT_ASSIGNMENT',payload:{
  assetCode:'STN01',title:'Verify STN01 alignment candidate',
  source:'MR-S10 owner laboratory checkpoint audit',
  checklist:['Review railway vector source and date','Record mismatch without inventing turnout']}},
 {id:'QA005',op:'QUEUE_CHECKPOINT',payload:{assetCode:'STN02'}}
]};
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(engineName==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const viewport of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.name!=='desktop'}),checks=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  try{
   assert.equal((await page.goto(base,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.assistantR17&&window.MRS10D102JourneyUI?.snapshot(),null,{timeout:60000});
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot())).session.currentCH,670);
   assert.equal(await page.locator('#lab-r17-directive-file').getAttribute('accept'),'.json,.txt,application/json,text/plain');
   checks.push('D102 STN01 and explicit .json/.txt ChatGPT owner instruction picker');
   const unsafe={...pack,commands:[{id:'BAD001',op:'EXECUTE_JS',payload:{assetCode:'STN01',script:'alert(1)'}}]};
   await page.locator('#lab-r17-directive-file').setInputFiles({name:'unsafe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(unsafe))});
   assert.match(await page.locator('#lab-r17-assistant').innerText(),/FILE REJECTED/);
   checks.push('untrusted arbitrary command rejected');
   await page.locator('#lab-r17-directive-file').setInputFiles({name:'chatgpt-adam-d102.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pack))});
   await page.waitForFunction(()=>window.MRS10D102AssistantInbox.snapshot().commands.length===5);
   assert.equal((await page.evaluate(()=>window.MRS10D102AssistantInbox.snapshot())).commands.filter(x=>x.status==='COMPLETED').length,0);
   checks.push('import only plans, no silent execution');
   for(const id of ['QA001','QA002','QA003','QA004','QA005']){
    await page.locator('#lab-r17-approve-'+id).click();
    await page.waitForFunction(id=>window.MRS10D102AssistantInbox.snapshot().commands.find(x=>x.id===id)?.status==='COMPLETED',id);
   }
   assert.equal((await page.evaluate(()=>window.MRS10D102AssistantInbox.snapshot())).commands.filter(x=>x.status==='COMPLETED').length,5);
   assert.equal(await page.locator('#lab-r16-layout-panel svg polyline').count(),1);
   assert.equal((await page.evaluate(()=>window.MRS10D102JourneyUI.pending())).phase,'DEPARTURE');
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().session.currentCH)),670);
   checks.push('all 5 allowlisted tasks executed by explicit Owner clicks without moving D102');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MRS10D102AssistantInbox?.snapshot()?.commands?.length===5);
   const after=await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot());
   assert.equal(after.assistantR17.commands.filter(x=>x.status==='COMPLETED').length,5);
   assert.equal(after.session.currentCH,670);
   assert.equal(after.assistantR17.cloudSync,false);
   assert.equal(after.assistantR17.productionProtected,true);
   checks.push('approved local task history resumes and Production remains protected');
   const irrelevant=errors.filter(e=>(/tiles\.openrailwaymap\.org|tiles\.maps\.eox\.at/i.test(e)&&/access control|failed to load|network error/i.test(e)));
   const appErrors=errors.filter(e=>!irrelevant.includes(e));
   assert.equal(appErrors.length,0,appErrors.join('; '));
   report.push({engine:engineName,viewport:viewport.name,status:'PASS',checks});
   await page.screenshot({path:`${out}/${engineName}-${viewport.name}.png`,fullPage:true});
  }catch(e){report.push({engine:engineName,viewport:viewport.name,status:'FAIL',checks,error:String(e.stack||e),errors});
   await page.screenshot({path:`${out}/${engineName}-${viewport.name}-fail.png`,fullPage:true}).catch(()=>{})}
  await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await page.close();
 }
 await browser.close();
}
console.log(JSON.stringify(report));if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
