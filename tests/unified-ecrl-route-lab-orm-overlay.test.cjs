'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function mock(){
 const dom=new JSDOM('<!doctype html><div id="lab-rail-overlay-controls"><label><input type="checkbox" id="lab-orm-toggle" checked><span id="lab-orm-toggle-label"></span></label><button id="lab-focus-kerteh"></button><button id="lab-fit-corridor"></button><p id="lab-orm-note"></p><p id="lab-orm-status"></p></div>',{url:'https://preview.example.test'});
 const w=dom.window;vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/route-lab-rail-overlay.js','utf8'),{window:w,document:w.document});
 const layers=new Map(),sources=new Map(),events=new Map();let lastCamera=null;
 const map={isStyleLoaded:()=>true,getLayer:id=>layers.get(id),getSource:id=>sources.get(id),
  addSource(id,value){sources.set(id,value)},addLayer(value){layers.set(value.id,{...value})},
  setLayoutProperty(id,key,value){layers.get(id).layout[key]=value},
  on(name,fn){events.set(name,fn)},easeTo(x){lastCamera=x},fitBounds(a,b){lastCamera={bounds:a,...b}}};
 return {dom,w,map,layers,sources,events,get camera(){return lastCamera}};
}
test('railway tiles use the published OpenRailwayMap raster, no synthetic rails',()=>{
 const h=mock();h.w.MRS10ECRLRailOverlay.connect(h.map);
 const state=h.w.MRS10ECRLRailOverlay.snapshot();
 assert.equal(state.installed,true);assert.equal(state.visible,true);
 assert.equal(state.classification,'OSM_RASTER_VISUAL_REFERENCE_ONLY');
 assert.equal(state.trainGeometryAvailable,false);assert.equal(state.asBuiltVerified,false);
 assert.equal(h.sources.size,1);assert.equal(h.layers.size,1);
 const source=h.sources.get(state.sourceId),layer=h.layers.get(state.layerId);
 assert.equal(source.type,'raster');assert.match(source.tiles[0],/^https:\/\/tiles\.openrailwaymap\.org\/standard\/\{z\}\/\{x\}\/\{y\}\.png$/);
 assert.match(source.attribution,/OpenStreetMap contributors/);
 assert.match(source.attribution,/CC BY-SA 2\.0/);
 assert.equal(layer.type,'raster');assert.equal(layer.layout.visibility,'visible');
 assert(!fs.readFileSync('assets/unified-ecrl/route-lab-rail-overlay.js','utf8').includes('type:\'LineString\''));
 h.dom.window.close();
});
test('visibility toggle and context focus preserve map identity and CH simulation',()=>{
 const h=mock();const api=h.w.MRS10ECRLRailOverlay;api.connect(h.map);
 h.w.document.getElementById('lab-orm-toggle').checked=false;
 h.w.document.getElementById('lab-orm-toggle').dispatchEvent(new h.w.Event('change'));
 assert.equal(api.snapshot().visible,false);
 assert.equal(h.layers.get(api.snapshot().layerId).layout.visibility,'none');
 api.toggle(true);assert.equal(api.snapshot().visible,true);
 h.w.document.getElementById('lab-focus-kerteh').click();assert.equal(h.camera.zoom,10.3);
 h.w.document.getElementById('lab-fit-corridor').click();assert.equal(h.camera.maxZoom,7);
 assert.equal(h.sources.size,1);
 h.dom.window.close();
});
test('BM/EN/ZH/TH content and safety label are available',()=>{
 const h=mock();const api=h.w.MRS10ECRLRailOverlay;api.connect(h.map);
 for(const [lang,term] of [['ms','BUKAN'],['en','NOT surveyed'],['zh','ECRL'],['th','ECRL']]){
   api.setLocale(lang);
   const warning=h.w.document.getElementById('lab-orm-note').textContent;
   assert(warning.includes(term));assert(warning.length>25);
 }
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 assert(html.includes('lab-orm-toggle'));assert(html.includes('route-lab-rail-overlay.js'));
 assert(html.includes('not a secured Owner portal'));
 h.dom.window.close();
});
