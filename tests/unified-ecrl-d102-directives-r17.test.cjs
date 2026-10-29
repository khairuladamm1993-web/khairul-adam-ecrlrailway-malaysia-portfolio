'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function setup(){
 const dom=new JSDOM('<!doctype html>',{url:'https://localhost.example'}),
 ctx={window:dom.window,document:dom.window.document};
 for(const f of ['assets/unified-ecrl/chainage-manifest.js','assets/unified-ecrl/route-lab-d102-directive-executor-r17.js'])
   vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
 const m=new Map(),store={getItem:key=>m.get(key)||null,setItem:(key,v)=>m.set(key,v)};
 return {dom,D:dom.window.MRS10D102DirectiveExecutor,store};
}
function example(ops=[
 {id:'A001',op:'SELECT_ASSET',payload:{assetCode:'STN01'}},
 {id:'A002',op:'RECORD_GEOMETRY_GAP',payload:{assetCode:'PL04',CH:377950,description:'Exact surveyed loop turnout unknown',source:'Owner CH manifest reference'}},
 {id:'A003',op:'ASSISTANT_ASSIGNMENT',payload:{assetCode:'STN01',source:'Source review assignment',title:'Verify STN01 track geometry',
 checklist:['Match rail source geometry and CH','Verify platform and turnout evidence']}}
]){return {schema:'mrs10-d102-owner-directives-v1',scope:'MR_S10_P01_D102_LAB',
  assignmentId:'STN01_REVIEW_R17',title:'ECRL STN01 geometry research',commands:ops};}
test('valid file plans 23-asset instructions but executes none before Owner approves',()=>{
 const x=setup(),calls=[],D=x.D;
 const model=D.create(x.store,{SELECT_ASSET:async p=>{calls.push(p.assetCode);return {selected:p.assetCode}},
  RECORD_GEOMETRY_GAP:async()=>({pendingEvidence:true}),
  ASSISTANT_ASSIGNMENT:async()=>({tasks:2})});
 const v=model.review(example());
 assert.equal(v.imported,true);assert.equal(v.commands.length,3);
 assert.equal(v.commands.filter(c=>c.status==='COMPLETED').length,0);
 assert.equal(v.approval,'PER_COMMAND_OWNER_CLICK_REQUIRED');
 assert.equal(v.geometrySurveyVerified,false);assert.equal(v.geographicTrainRunAllowed,false);
 assert.equal(v.cloudSync,false);
 assert.equal(calls.length,0);x.dom.window.close();
});
test('each action requires individual consent and local journal remains after reload',async()=>{
 const x=setup(),calls=[],handlers={SELECT_ASSET:p=>{calls.push(p.assetCode);return {selected:p.assetCode}},
 RECORD_GEOMETRY_GAP:p=>({CH:p.CH,source:p.source})};
 const model=x.D.create(x.store,handlers);
 const pack=example().commands.slice(0,2);model.review(example(pack));
 let r=await model.approveAndRun('A001');assert.equal(r.status,'COMPLETED');
 assert.deepEqual(calls,['STN01']);
 r=await model.approveAndRun('A001');assert.equal(r.status,'ALREADY_COMPLETED');
 assert.deepEqual(calls,['STN01']);
 assert.equal(model.snapshot().pending,'A002');
 r=await model.approveAndRun('A002');assert.equal(r.status,'COMPLETED');
 const restored=x.D.create(x.store,handlers);
 assert.equal(restored.snapshot().commands.filter(x=>x.status==='COMPLETED').length,2);
 assert.equal(restored.snapshot().history.length,3);
 x.dom.window.close();
});
test('reject code execution, privilege escalation, bad scope, false survey and faked PL CH',()=>{
 const x=setup(),v=x.D.validate;
 assert.throws(()=>v(example([{id:'A003',op:'EXECUTE_JS',payload:{source:'Public info',assetCode:'STN01',script:'alert(1)'}}])),/OP_NOT_ALLOWLISTED/);
 assert.throws(()=>v({...example(),productionTarget:'main'}),/PRIVILEGED_ACTIONS_REJECTED/);
 assert.throws(()=>v({...example(),scope:'MR_S10_PRODUCTION'}),/SCOPE_NOT_LAB/);
 assert.throws(()=>v(example([{id:'B001',op:'REGISTER_INFRA_CANDIDATE',payload:{
 assetCode:'STN01',type:'BRIDGE',CH:5000,source:'Public source',script:'curl...'}}])),/EXECUTABLE_OR_PRIVILEGED/);
 assert.throws(()=>v(example([{id:'C001',op:'IMPORT_LAYOUT_DRAFT',payload:{
 assetCode:'STN01',source:'Source evidence',tracks:[{points:[[0,0],[200,50]]}]}}])),/SCHEMATIC_0_TO_100/);
 assert.throws(()=>v(example([{id:'D001',op:'QUEUE_CHECKPOINT',payload:{assetCode:'PL01',CH:100000}}])),/CH_MISMATCH/);
 assert.throws(()=>v(example([{id:'E001',op:'RECORD_GEOMETRY_GAP',payload:{
 assetCode:'PL01',CH:115180,source:'Railway source',description:'Missing geology',surveyVerified:true}}])),/CANNOT_CLAIM/);
 x.dom.window.close();
});
test('failed command does not get automatically rerun, missing permission blocks action',async()=>{
 const x=setup(),m=x.D.create(x.store,{SELECT_ASSET:()=>{throw Error('UI_NOT_READY')}});
 m.review(example([{id:'A001',op:'SELECT_ASSET',payload:{assetCode:'STN01'}}]));
 const r=await m.approveAndRun('A001');assert.equal(r.status,'FAILED_REVIEW_REQUIRED');
 assert.equal(m.snapshot().commands[0].status,'FAILED_REVIEW_REQUIRED');
 await assert.rejects(m.approveAndRun('A001'),/NOT_PENDING/);x.dom.window.close();
});
test('HTML contains supported directive importer separate from original image and backups',()=>{
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 assert(html.includes('lab-r17-assistant'));
 assert(html.includes('route-lab-d102-directive-executor-r17.js'));
 assert(html.includes('route-lab-d102-assistant-r17.js'));
 assert(ui.includes('MRS10D102AssistantInbox?.connect()'));
 assert(ui.includes('MRS10D102AssistantInbox?.snapshot()'));
});
