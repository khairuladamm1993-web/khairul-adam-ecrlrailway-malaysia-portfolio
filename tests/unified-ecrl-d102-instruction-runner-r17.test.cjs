'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
function store(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}}
function setup(){
 const dom=new JSDOM('<!doctype html><div id="lab-r17-instruction-runner"></div>',{url:'https://preview.example'});
 const w=dom.window,ctx={window:w,document:w.document,localStorage:w.localStorage};
 const load=f=>vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
 [
 'assets/unified-ecrl/chainage-manifest.js',
 'assets/unified-ecrl/source/data.js',
 'assets/unified-ecrl/alignment-evidence-r2.js',
 'assets/unified-ecrl/route-lab-d102-preflight.js',
 'assets/unified-ecrl/route-lab-d102-observations.js',
 'assets/unified-ecrl/route-lab-imported-layouts.js',
 'assets/unified-ecrl/route-lab-d102-journey-control.js',
 'assets/unified-ecrl/route-lab-instruction-runner-r17.js',
 'assets/unified-ecrl/route-lab-engineering-assistant-r17.js'
 ].forEach(load);
 const D=w.MRS10D102InstructionRunner,st=store(),rows=w.MRS10ECRLChainage.records,
 J=w.MRS10D102JourneyControl.create(store(),rows),L=w.MRS10AssetLayoutRegistry.create(store()),
 O=w.MRS10ECRLD102Observations.create(store());
 let CH=670;const calls=[],deps={
  getSession:()=>({currentCH:CH,origin:'STN01',destination:'STN17'}),
  getJourney:()=>J,getLayouts:()=>L,getAttachments:()=>[],
  showAsset:code=>calls.push(['focus',code]),
  queueCH:target=>{calls.push(['queue',target]);J.request({currentCH:CH,origin:'STN01',destination:'STN17'},target)},
  registerInfrastructure:obj=>J.registerInfrastructure(obj),
  importLayout:doc=>L.ingest(doc),
  addObservation:(item,ch)=>O.log(item,ch),
  setCameraView:view=>calls.push(['camera',view])
 };
 return {w,dom,D,st,rows,J,L,O,calls,deps,getCH:()=>CH,setCH:c=>{CH=c}};
}
const manifest={
 schema:'mrs10-d102-instruction-bundle-v1',bundleId:'unit-owner-example',
 issuedBy:'ChatGPT-Adam',purpose:'Research and model review, no physical train claims',
 commands:[
 {id:'FOCUS',action:'FOCUS_ASSET',assetCode:'STN01'},
 {id:'FLAG',action:'FLAG_GEOMETRY_GAP',assetCode:'PL01',field:'TRACK_CENTERLINE',reason:'No authoritative surveyed geometry for this passing loop',source:'MR-S10 owner learning notes'},
 {id:'QZ',action:'REGISTER_INFRASTRUCTURE',infrastructure:{type:'QZ_CURVE',CH:12500,source:'Example owner review source',name:'Unverified educational QZ candidate'}},
 {id:'NEXT',action:'QUEUE_CH_TARGET',assetCode:'STN02',CH:33700},
 {id:'CAMERA',action:'SET_CAMERA_VIEW',view:'2d'}
 ]};
test('untrusted manifests are inert until explicit Owner approval and each command is clicked',()=>{
 const h=setup(),r=h.D.create(h.st,h.deps);
 r.load(manifest);
 assert.equal(r.snapshot().active.reviewStatus,'WAITING_EXPLICIT_OWNER_APPROVAL');
 assert.equal(h.calls.length,0);
 assert.throws(()=>r.execute('FOCUS'),/OWNER_APPROVAL_REQUIRED/);
 r.approve();
 assert.equal(r.execute('FOCUS').status,'COMPLETED');
 assert.deepEqual(h.calls,[['focus','STN01']]);
 assert.equal(r.execute('FLAG').status,'COMPLETED');
 assert.equal(r.snapshot().gapCount,1);
 assert.equal(r.execute('QZ').status,'COMPLETED');
 assert.equal(h.J.snapshot().infrastructure.length,1);
 assert.equal(r.execute('NEXT').status,'WAITING_OWNER_POPUP');
 assert.equal(h.J.pending().phase,'DEPARTURE');
 assert.equal(h.getCH(),670);
 assert.throws(()=>r.execute('CAMERA'),/COMPLETE_D102_OWNER_POPUP_FIRST/);
 assert.equal(r.snapshot().liveTrainTelemetry,false);
 assert.equal(r.snapshot().fullCorridorVerified,false);
 h.dom.window.close();
});
test('malicious actions / wrong CH / duplicate / prototype keys cannot run',()=>{
 const h=setup();const invalid=(cmd)=>({...manifest,bundleId:'security-example',commands:[cmd]});
 for(const action of ['EXEC_JS','RUN_SHELL','EVAL','PUBLISH_PRODUCTION','SUPABASE_QUERY','FETCH_URL']){
  assert.throws(()=>h.D.validate(invalid({id:'EVIL',action,code:'alert(1)'})),/UNSUPPORTED/);
 }
 assert.throws(()=>h.D.validate(invalid({id:'WRONG',action:'QUEUE_CH_TARGET',assetCode:'STN02',CH:33701})),/MATCH_REGISTERED/);
 assert.throws(()=>h.D.validate({...manifest,commands:[manifest.commands[0],manifest.commands[0]]}),/DUPLICATE/);
 const poison=JSON.parse('{"schema":"mrs10-d102-instruction-bundle-v1","bundleId":"attack","issuedBy":"ChatGPT-Adam","purpose":"unsafe","commands":[{"id":"bad","action":"FOCUS_ASSET","assetCode":"STN01","__proto__":{"admin":true}}]}');
 assert.throws(()=>h.D.validate(poison),/UNSAFE_INSTRUCTION_FIELD/);
 assert.equal(({}).admin,undefined);
 h.dom.window.close();
});
test('CH authority never inferred from asset string or unverified map geometry',()=>{
 const h=setup(),r=h.D.create(h.st,h.deps);r.load(manifest);r.approve();
 r.execute('FOCUS');r.execute('FLAG');r.execute('QZ');r.execute('NEXT');
 assert.equal(h.J.pending().CH,670);
 h.J.confirm(h.deps.getSession(),{});assert.equal(h.J.pending().phase,'NEXT');
 h.J.confirm(h.deps.getSession(),{});assert.equal(h.J.pending().phase,'INFRASTRUCTURE');
 h.setCH(12500);
 h.J.confirm(h.deps.getSession(),{});h.J.confirm(h.deps.getSession(),{});h.setCH(33700);
 h.J.confirm(h.deps.getSession(),{});
 r.sync();
 assert.equal(r.snapshot().active.commands.find(x=>x.id==='NEXT').status,'COMPLETED');
 assert.equal(r.execute('CAMERA').status,'COMPLETED');
 assert.deepEqual(h.calls.at(-1),['camera','2d']);
 assert.equal(r.exportData().publicPublish,false);
 h.dom.window.close();
});
test('deterministic assistant reports incomplete 23-point ECRL evidence truthfully',()=>{
 const h=setup();
 const report=h.w.MRS10D102EngineeringAssistant.report(h.deps);
 assert.equal(report.recordedCHAnchors,23);assert.equal(report.stations,16);assert.equal(report.loops,7);
 assert.equal(report.entireCorridorVectorConnected,false);
 assert.equal(report.physicalTrainReleased,false);
 assert.equal(report.assets.find(x=>x.code==='PL01').physicalChainageMatched,false);
 assert(report.nextEngineeringActions.some(x=>x.includes('1435')));
 h.dom.window.close();
});
test('isolated Preview integration includes imported instruction panel and no privileged execution',()=>{
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-d102-journey-ui.js','utf8');
 const source=fs.readFileSync('assets/unified-ecrl/route-lab-instruction-runner-r17.js','utf8');
 assert(html.includes('lab-r17-instruction-runner'));
 assert(html.includes('route-lab-instruction-runner-r17.js'));
 assert(html.includes('route-lab-engineering-assistant-r17.js'));
 assert(html.includes('route-lab-instruction-ui-r17.js'));
 assert(ui.includes('MRS10D102InstructionUI?.connect('));
 for(const bad of ['new Function(','eval(','document.write(','importScripts('])assert(!source.includes(bad));
 assert(source.includes('DETERMINISTIC_LOCAL_ALLOWED_ACTIONS_ONLY'));
});
