'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
function setup(){
 const dom=new JSDOM('<!doctype html><html><body><button id="lab-basemap-satellite"></button><button id="lab-basemap-street"></button><button id="lab-basemap-hd"></button><input id="lab-hd-key"><span id="lab-hd-status"></span><div id="lab-hd-license"></div></body></html>',{url:'https://preview.example'});
 const w=dom.window,ctx={window:w,document:w.document};
 vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/route-lab-hd-imagery.js','utf8'),ctx);
 const sources=new Map(),layers=new Map(),events=[],camera=[];
 layers.set('mrs10-lab-openrailwaymap-standard-raster-layer',{id:'mrs10-lab-openrailwaymap-standard-raster-layer'});
 const map={getStyle:()=>({version:8}),getSource:id=>sources.get(id),getLayer:id=>layers.get(id),
 addSource:(id,obj)=>sources.set(id,obj),addLayer:(obj,before)=>{layers.set(obj.id,{...obj,insertedBefore:before})},
 removeLayer:id=>layers.delete(id),removeSource:id=>sources.delete(id),
 getZoom:()=>10,easeTo:x=>camera.push(x),on:(type,fn)=>events.push({type,fn})};
 w.MRS10ECRLSatelliteBasemap={setMode:x=>{map.base=x}};
 const api=w.MRS10ECRLHDImagery;api.connect(map);
 return {dom,w,map,api,sources,layers,camera};
}
test('HD mode is off without owner supplied API key and no secret hardcoded',()=>{
 const x=setup();
 assert.equal(x.api.snapshot().requiresOwnAPIKey,true);
 assert.equal(x.api.snapshot().loaded,false);
 assert.equal(x.api.enable(),false);
 assert.equal(x.sources.size,0);
 assert.equal(x.api.snapshot().rawKeyExposedInSnapshot,false);
 assert(!fs.readFileSync('assets/unified-ecrl/route-lab-hd-imagery.js','utf8').includes('localStorage.'));
 x.dom.window.close();
});
test('owner key enables tiled MapTiler HD below ORM reference raster, then removes credentials on exit',()=>{
 const x=setup(),key='test_session_key_only_12345';
 x.w.document.getElementById('lab-hd-key').value=key;
 assert.equal(x.api.enable(),true);
 assert.equal(x.api.snapshot().mode,'HD');
 assert.equal(x.api.snapshot().keyStored,false);
 assert.equal(x.map.base,'street');
 assert.equal(x.sources.size,1);
 const val=x.sources.values().next().value;
 assert.equal(val.type,'raster');
 assert.match(val.url,/satellite-v4\/tiles\.json\?key=/);
 assert(val.url.includes(key));
 assert.equal(x.layers.get('mrs10-maptiler-owner-hd-raster').insertedBefore,'mrs10-lab-openrailwaymap-standard-raster-layer');
 assert.equal(x.w.document.getElementById('lab-hd-key').value,'');
 assert(!JSON.stringify(x.api.snapshot()).includes(key));
 assert.equal(x.camera.at(-1).zoom,15.5);
 x.api.hide();
 assert.equal(x.sources.size,0);
 assert(!JSON.stringify(x.api.snapshot()).includes(key));
 x.dom.window.close();
});
test('HD mode retains the original low-resolution fallback, license and geospatial confidence warning',()=>{
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 assert(html.includes('Satelit HD (pilihan)'));
 assert(html.includes('lab-hd-key'));
 assert(html.includes('route-lab-hd-imagery.js'));
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 assert(ui.includes('MRS10ECRLHDImagery?.connect(map)'));
 assert(ui.includes('hdImagery:'));
 const src=fs.readFileSync('assets/unified-ecrl/route-lab-hd-imagery.js','utf8');
 assert(src.includes('imageryGeometryNotSurvey:true'));
 assert(src.includes('sourceDateAtLocation:\'UNKNOWN\''));
 xCheckNoRepoKey(src);
});
function xCheckNoRepoKey(src){
 assert(!src.includes('mNLmXyaTH4gRlwJHSYWp'));
 assert(!src.includes('AIza'));
 assert(!src.includes('maptiler-api-key='));
}
