'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function setup(){
 const dom=new JSDOM('<!doctype html><section id="lab-station-intelligence"></section><section id="lab-freight-intelligence"></section>',{url:'https://test.example'});
 const w=dom.window;
 const ctx={window:w,document:w.document};
 for(const p of [
  'assets/unified-ecrl/chainage-manifest.js',
  'assets/unified-ecrl/source/data.js',
  'assets/unified-ecrl/port-references.js',
  'assets/unified-ecrl/kerteh-freight-reference.js',
  'assets/unified-ecrl/route-lab-station-intelligence.js',
  'assets/unified-ecrl/route-lab-station-map.js',
  'assets/unified-ecrl/route-lab-freight-area-map.js',
  'assets/unified-ecrl/route-lab-ch-trail.js'
 ])vm.runInNewContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
 const layers=new Map(),sources=new Map(),events=new Map(),map={
  getStyle:()=>({version:8,layers:[]}),getSource:id=>sources.get(id),addSource:(id,obj)=>sources.set(id,obj),
  getLayer:id=>layers.get(id),addLayer:o=>layers.set(o.id,o),
  on:(type,layer,cb)=>{if(typeof layer==='function')cb=layer;events.set(type+':'+(typeof layer==='string'?layer:'map'),cb)},
  getCanvas:()=>({style:{}}),flyTo:()=>{}
 };
 return {w,dom,map,layers,sources,events};
}
test('STN01 intelligence starts at CH000+670 and 16 station locality points exist',()=>{
 const h=setup(),st=h.w.MRS10ECRLStationIntelligence.initial();
 assert(st);assert.equal(st.code,'STN01');assert.equal(st.CH,670);assert.equal(st.CHLabel,'CH000+670');
 assert.equal(st.exactStationLocation,null);assert.equal(st.verifiedTrackLayout,null);
 h.w.MRS10ECRLStationMap.connect(h.map);
 const s=h.w.MRS10ECRLStationMap.snapshot();
 assert.equal(s.stationCount,16);assert.equal(s.plCount,7);
 assert.equal(s.referenceOnly,true);assert.equal(s.geometryVerified,false);
 assert(h.w.document.getElementById('lab-station-intelligence').textContent.includes('STN01'));
 const pointSource=h.sources.get('mrs10-lab-stations-locality');
 assert.equal(pointSource.data.features.length,16);
 assert(pointSource.data.features.every(p=>p.properties.confidence==='LOCALITY_REFERENCE_NOT_SURVEYED'));
 h.dom.window.close();
});
test('purple port markers include Klang Northport/Westports and Kemaman/Kuantan; yellow amber PETRONAS Kerteh yard',()=>{
 const h=setup();h.w.MRS10ECRLFreightAreaMap.connect(h.map);
 const p=h.w.MRS10ECRLFreightAreaMap.snapshot();
 assert.deepEqual([p.count,p.ports,p.yards],[5,4,1]);assert.equal(p.trainMovementEligible,false);
 const src=h.sources.get('mrs10-lab-public-freight-areas');
 assert.equal(src.data.features.length,5);
 assert.equal(h.layers.get('mrs10-lab-port-purple').paint['circle-stroke-color'],'#7c3aed');
 assert.equal(h.layers.get('mrs10-lab-kerteh-amber').paint['text-color'],'#d38b21');
 const ids=Array.from(h.w.MRS10ECRLFreightAreaMap.assets,x=>x.id).sort();
 assert.deepEqual(ids,['ecrl-port-kemaman','ecrl-port-kuantan','ecrl-port-northport','ecrl-port-westports','ecrl-yard-kerteh-petronas']);
 assert(h.w.MRS10ECRLFreightAreaMap.assets.every(x=>x.terminalPointVerified===false&&x.loadingBayVerified===false&&x.railLinkVerified===false));
 assert(h.w.MRS10ECRLFreightAreaMap.select('ecrl-port-kemaman'));
 assert(h.w.document.getElementById('lab-freight-intelligence').textContent.includes('Kemaman Port'));
 assert(h.w.MRS10ECRLFreightAreaMap.select('ecrl-yard-kerteh-petronas'));
 assert(h.w.document.getElementById('lab-freight-intelligence').textContent.includes('Kerteh Railway Yard'));
 h.dom.window.close();
});
test('D102 CH breadcrumb sample records mathematical progress only, never roads or invented geospatial locations',()=>{
 const h=setup(),api=h.w.MRS10ECRLCHTrail;
 const s={trainId:'D102-SIM',currentCH:33700,events:[{type:'MANUAL_CH_MOVE',from:670,to:33700,time:'2026-10-29T01:00:00Z'}]};
 const trail=api.create(s,{intervalM:100});
 assert.equal(trail.originCH,670);assert.equal(trail.currentCH,33700);
 assert(trail.sampledCH.length>300);assert.equal(trail.sampledCH.at(-1).CH,33700);
 assert.equal(trail.trackGeometryVerified,false);assert.equal(trail.geographicCoordinates,null);assert.equal(trail.roadGeometryUsed,false);
 h.dom.window.close();
});
test('R1.4 includes separate satellite and road views and loads genuine registry JS before route UI',()=>{
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 for(const src of ['route-lab-station-map.js','route-lab-freight-area-map.js','route-lab-satellite.js','route-lab-ch-trail.js'])assert(html.includes(src));
 const satellite=fs.readFileSync('assets/unified-ecrl/route-lab-satellite.js','utf8');
 assert(satellite.includes('s2cloudless_3857'));
 assert(satellite.includes('CC BY 4.0'));
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 assert(ui.includes('MRS10ECRLFreightAreaMap?.connect(map)'));
 assert(ui.includes('MRS10ECRLStationMap?.connect(map)'));
 assert(ui.includes('CHTrail?.create(session'));
});
