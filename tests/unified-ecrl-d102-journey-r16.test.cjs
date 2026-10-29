'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const E=require('../assets/unified-ecrl/route-lab-engine.js'),C=require('../assets/unified-ecrl/chainage-manifest.js');
const J=require('../assets/unified-ecrl/route-lab-d102-journey-control.js');
function store(){const m=new Map();return {getItem:x=>m.get(x)||null,setItem:(x,v)=>m.set(x,v)}}
function confirm(j,s,CH=null){return j.confirm(s,{CH:CH??j.pending().CH,note:'Owner checks CH reference only; not surveyed'})}
test('D102 R1.6 confirms departure -> next checkpoint -> arrival before advancing',()=>{
 const st=store(),j=J.create(st,C.records);let s=E.start(C.records);
 assert.equal(j.snapshot().ledgerCount,0);assert.equal(s.currentCH,670);
 assert.equal(j.request(s,33700).phase,'DEPARTURE');
 assert.equal(s.currentCH,670);
 let action=confirm(j,s);assert.equal(action.action,'SHOW_NEXT');assert.equal(action.pending.CH,33700);
 assert.equal(s.currentCH,670);assert.equal(j.pending().phase,'NEXT');
 action=confirm(j,s);assert.equal(action.action,'ADVANCE_CH_ONLY');assert.equal(action.moveTo,33700);
 assert.equal(j.pending().phase,'ARRIVAL');
 s=E.advance(s,C.records,action.moveTo);
 assert.equal(s.currentCH,33700);
 action=confirm(j,s);assert.equal(action.action,'CONFIRMED_STOP');assert.equal(j.pending(),null);
 assert(j.snapshot().confirmedArrivals.includes('STN02'));
 assert(j.snapshot().confirmedDepartures.includes(670));
 assert.equal(j.snapshot().ledger.filter(x=>x.type==='OWNER_POPUP_ACK').length,3);
 const resumed=J.create(st,C.records);assert.equal(resumed.snapshot().ledgerCount,j.snapshot().ledgerCount);
 assert.equal(resumed.snapshot().confirmedArrivals.length,1);
});
test('QZ and bridge stop by source-provided CH, then automatically stage next CH after acknowledgement',()=>{
 const j=J.create(store(),C.records);let s=E.start(C.records);
 const ev=j.registerInfrastructure({type:'QZ_CURVE',CH:12500,name:'QZ candidate',source:'Source drawing QZ testing only'});
 assert.equal(ev.latitude,null);assert.equal(ev.longitude,null);assert.equal(ev.geometryVerified,false);
 assert.equal(j.snapshot().ledger[0].type,'INFRASTRUCTURE_REFERENCE_IMPORTED');
 assert.equal(j.request(s,33700).phase,'DEPARTURE');
 let next=confirm(j,s);assert.equal(next.pending.phase,'NEXT');assert.equal(next.pending.CH,12500);
 let action=confirm(j,s);assert.equal(action.action,'ADVANCE_CH_ONLY');assert.equal(action.moveTo,12500);
 s=E.advance(s,C.records,action.moveTo);assert.equal(j.pending().phase,'INFRASTRUCTURE');
 const continuation=confirm(j,s);assert.equal(continuation.action,'RESUME_NEXT_CH_CHECKPOINT');
 assert.equal(continuation.pending.CH,33700);
 const resume=confirm(j,s);assert.equal(resume.action,'ADVANCE_CH_ONLY');
 s=E.advance(s,C.records,resume.moveTo);assert.equal(s.currentCH,33700);
 assert.equal(j.pending().phase,'ARRIVAL');
 assert.equal(j.snapshot().confirmedEvents.includes(ev.id),true);
 confirm(j,s);assert.equal(j.pending(),null);
 assert.equal(j.snapshot().liveGPS,false);
 assert.equal(j.snapshot().cloudSynced,false);
});
test('manual forward move cannot skip intermediate station/PL or imported infrastructure',()=>{
 const j=J.create(store(),C.records),s=E.start(C.records);
 j.registerInfrastructure({type:'BRIDGE',CH:20000,source:'Public railway reference'});
 j.registerInfrastructure({type:'TUNNEL',CH:24000,source:'Public railway reference'});
 j.request(s,88220);
 const afterDeparture=confirm(j,s);
 assert.equal(afterDeparture.pending.CH,20000);
 assert.equal(afterDeparture.pending.type,'BRIDGE');
 assert.equal(j.request(s,90000).CH,20000); // cannot override existing popup before confirmation
});
test('owner CH correction is retained as residual but never rewrites manifest or actual map coordinates',()=>{
 const j=J.create(store(),C.records),s=E.start(C.records);
 j.request(s,33700);
 const result=j.confirm(s,{CH:675,latitude:'',longitude:'',note:'Reference CH difference 5m'});
 assert.equal(result.action,'SHOW_NEXT');
 const rec=j.snapshot().ledger.at(-1);
 assert.equal(rec.CH,670);assert.equal(rec.observedCH,675);assert.equal(rec.residualM,5);
 assert.equal(rec.latitude,null);assert.equal(rec.longitude,null);
 assert.equal(C.records[0].metres,670);assert.equal(j.snapshot().asBuilt,false);
});
test('schematic layouts are source-based; no arbitrary station geometry or unsafe SVG markup',()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://preview.example'}),w=dom.window;
 const ctx={window:w,document:w.document};
 for(const f of ['assets/unified-ecrl/chainage-manifest.js','assets/unified-ecrl/route-lab-imported-layouts.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
 const layouts=w.MRS10AssetLayoutRegistry.create(store());
 const d={code:'STN01',source:'Owner allowed station drawing',tracks:[{id:'L1',role:'mainline',points:[[5,30],[90,30]]},{id:'L2',role:'loop',points:[[10,70],[85,70]]}]};
 const x=layouts.ingest(d);assert.equal(x[0].tracks,2);
 assert.equal(layouts.get('STN01').status,'IMPORTED_UNVERIFIED_LAYOUT');
 const svg=layouts.renderSVG('STN01');assert.equal(svg.tagName,'svg');
 assert.equal(svg.querySelectorAll('polyline').length,2);
 assert.equal(layouts.snapshot().publicPublished,false);
 assert.equal(layouts.get('STN02'),null);
 assert.throws(()=>layouts.ingest({code:'PL04',source:'Owner source',tracks:[{id:'NO',points:[[500,3],[2,3]]}]}),/NORMALIZED/);
 assert.throws(()=>layouts.ingest({code:'STN02',tracks:[{id:'TEST',points:[[1,1],[2,2]]}]}),/PROVENANCE_REQUIRED/);
 dom.window.close();
});
test('route UI cannot bypass owner confirmation via slider, Set CH or Next',()=>{
 const s=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 assert(s.includes('root.MRS10D102JourneyUI.request(Number(slider.value))'));
 assert(s.includes('root.MRS10D102JourneyUI.request(Number(input.value))'));
 assert(s.includes('root.MRS10D102JourneyUI.request(p.next.metres)'));
 assert(s.includes('root.confirm('));
 assert(s.includes('root.MRS10D102JourneyUI?.importPayload(g)'));
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 assert(html.includes('route-lab-d102-journey-control.js'));
 assert(html.includes('route-lab-imported-layouts.js'));
 assert(html.includes('route-lab-d102-journey-ui.js'));
});
