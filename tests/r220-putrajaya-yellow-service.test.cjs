const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const api=require('../assets/railway-track-registry-kl.js');
const html=read('map-language-lab.html'),script=read('assets/map-language-lab.js');

test('R2.20 official 36-station sequence, five provisional stations excluded, no fabricated track geometry',()=>{
 const c=api.catalog,r=api.findRoute('mrt-putrajaya');
 assert.equal(r.stationSequenceStatus,'SOURCE_CONFIRMED');
 assert.equal(r.stationSequence.length,36);
 assert.equal(r.serviceAdjacencies.length,35);
 assert.equal(c.sourceAudit.mrtPutrajaya.operationalStops,36);
 assert.deepEqual(c.provisionalStations.map(s=>s.code),['PY02','PY25','PY26','PY30','PY35']);
 const stops=r.stationSequence.map(id=>c.stations.find(s=>s.id===id));
 assert.deepEqual(stops.slice(0,3).map(s=>s.code),['PY01','PY03','PY04']);
 assert.deepEqual(stops.slice(-2).map(s=>s.code),['PY40','PY41']);
 assert.equal(stops[0].name,'Kwasa Damansara');
 assert.equal(stops.at(-1).name,'Putrajaya Sentral');
 assert(stops.every(s=>s&&!c.provisionalStations.some(p=>p.code===s.code)));
 assert(r.serviceAdjacencies.every(e=>e.geometry===null&&e.physicalTrackId===null));
 assert.equal(c.physicalSegments.length,0);
 assert(api.validateRegistry());
});
test('R2.20 yellow theme identity and candidate matching never asserts actual track geometry',()=>{
 const r=api.findRoute('mrt-putrajaya'),match=api.matchSourcedPutrajayaPoi;
 assert.equal(r.serviceIdentity.light,'#FBCD20');
 assert.equal(r.serviceIdentity.dark,'#FFE36C');
 assert.match(r.serviceIdentity.colourAuthority,/SECONDARY_HEX_CROSSCHECK_NOT_OPERATOR_CERTIFIED/);
 assert.equal(r.geometry,null);
 for(const [raw,pos] of [['PY01 Kwasa Damansara',1],['PY3 Kampung Selamat',2],
   ['PY23 Tun Razak Exchange (TRX)',22],['PY41 Putrajaya Sentral',36]]){
  const candidate=match({class:'railway',subclass:'station',name:raw});
  assert.equal(candidate?.stopPosition,pos,raw);
  assert.equal(candidate?.geometry,null);
 }
 const shared=match({class:'railway',subclass:'station',name:'KG04 PY01 Kwasa Damansara','name:en':'Kwasa Damansara'});
  assert.equal(shared?.stationCode,'PY01');assert.equal(shared?.stopPosition,1);
  assert.equal(shared?.sharedCode,'KG04');assert.equal(shared?.geometry,null);
  assert.deepEqual(api.kwasaSource.coords,[101.5724,3.17631]);
  assert.equal(api.kwasaSource.osmWayId,460387856);
  for(const props of [null,{}, {class:'railway',subclass:'station',name:'Kwasa Damansara'},
   {class:'railway',subclass:'station',name:'KG04 Kwasa Damansara'},
   {class:'railway',subclass:'station',name:'KG04 PY01 Kwasa Damansara','name:en':'Wrong'},
  {class:'railway',subclass:'station',name:'PY25 Bandar Malaysia Utara'},
  {class:'railway',subclass:'station',name:'PY26 Bandar Malaysia Selatan'},
  {class:'railway',subclass:'station',name:'PY02 Rubber Research Institute (RRI)'},
  {class:'railway',subclass:'station',name:'PY23 Kwasa Damansara'},
  {class:'railway',subclass:'station',name:'PY20 Ampang Park','name:en':'KJ9 Ampang Park'}]){
  assert.equal(match(props),null);
 }
 assert.match(html,/--py-yellow:#FBCD20/);
 assert.match(html,/--py-text:#FFE36C/);
 assert(!script.includes('mrl-putrajaya-alignment'));
});
function boot(){
 const w=new JSDOM(html,{url:'https://qa.example/map-language-lab.html?railPilot=1',runScripts:'outside-only'}).window;
 w.scrollTo=()=>{};let map;
 class Map{
  constructor(){map=this;this.handlers={};this.layers=[];this.sources={osm:{type:'vector'}};}
  addControl(){}on(e,fn){(this.handlers[e]??=[]).push(fn)}fire(e,p){for(const fn of this.handlers[e]||[])fn(p||{})}
  isStyleLoaded(){return true}
  getStyle(){return{sources:this.sources,layers:[
   {id:'rail',type:'line',source:'osm','source-layer':'transportation'},
   {id:'poi',type:'circle',source:'osm','source-layer':'poi'},...this.layers]}}
  getLayer(id){return this.layers.find(l=>l.id===id)||null}
  getSource(id){return this.sources[id]||null}
  addSource(id,x){this.sources[id]=x}
  addLayer(x){this.layers.push(x)}
  setLayoutProperty(id,k,v){const l=this.getLayer(id);if(l){l.layout||={};l.layout[k]=v}}
  queryRenderedFeatures(_b,opt){return opt?.layers?.includes('mrl-pilot-stations')?
   [{layer:{id:'mrl-pilot-stations'},properties:{class:'railway',subclass:'subway',name:'KJ14 Pasar Seni','name:en':'Pasar Seni'}}]:[]}
  resize(){}flyTo(){}setStyle(){this.layers=[];this.fire('style.load')}
  getCanvasContainer(){return w.document.getElementById('visitor-map')}
 }
 class Popup{setLngLat(){return this}setDOMContent(n){this.node=n;return this}
  addTo(){map.popup=this;return this}remove(){}isOpen(){return false}}
 class Marker{
  constructor({element}){this.element=element}setLngLat(){return this}setPopup(){return this}
  addTo(){return this}remove(){}getElement(){return this.element}getPopup(){return{isOpen:()=>false}}
 }
 w.maplibregl={Map,Popup,Marker,NavigationControl:class{}};
 w.eval(read('assets/railway-track-registry-kl.js'));
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 map.fire('style.load');return{w,map,doc:w.document};
}

test('R2.20 mobile UI: yellow 36 numbered stops and isolated source POIs in all locales',()=>{
 const {w,map,doc}=boot(),sel=doc.getElementById('kl-registry-route');
 const py=map.getLayer('mrl-putrajaya-code-poi'),kj=map.getLayer('mrl-kelana-code-poi'),kg=map.getLayer('mrl-kajang-known-poi');
 assert(py&&kj&&kg);
 assert.equal(py.layout.visibility,'none');
 assert.equal(py.paint['circle-color'],'#FBCD20');
 assert.equal(py.filter[3][2][1].length,73);
  assert(py.filter[3][2][1].includes('KG04 PY01 Kwasa Damansara'));
 sel.value='mrt-putrajaya';sel.dispatchEvent(new w.Event('change'));
 assert.equal(py.layout.visibility,'visible');
 assert.equal(kj.layout.visibility,'none');
 assert.equal(kg.layout.visibility,'none');
 assert.equal(doc.querySelectorAll('#kl-registry-station-order li').length,36);
 assert.match(doc.querySelector('#kl-registry-station-order li').textContent,/PY01 · Kwasa Damansara/);
 assert.match(doc.querySelector('#kl-registry-station-order li:last-child').textContent,/PY41 · Putrajaya Sentral/);
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/5 provisional/);
 doc.querySelector('[data-locale="en"]').click();
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/36 operating/);
 doc.querySelector('[data-locale="zh"]').click();
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/36站/);
 doc.querySelector('[data-locale="th"]').click();
 assert.match(doc.getElementById('kl-registry-route-status').textContent,/36 สถานี/);
 doc.getElementById('theme-btn').click();
 assert.equal(sel.value,'mrt-putrajaya');
 doc.querySelector('[data-region="thailand"]').click();
 assert.equal(map.getLayer('mrl-putrajaya-code-poi').layout.visibility,'none');
 doc.querySelector('[data-region="malaysia"]').click();
 assert.equal(map.getLayer('mrl-putrajaya-code-poi').layout.visibility,'visible');
 w.close();
});

test('R2.20.1: sourced Kwasa station locator button is route-scoped and uses OSM centre',()=>{
 const {w,doc,map}=boot(),s=doc.getElementById('kl-registry-route'),b=doc.getElementById('putrajaya-kwasa-focus');
 assert.equal(b.hidden,true);
 s.value='mrt-putrajaya';s.dispatchEvent(new w.Event('change'));
 assert.equal(b.hidden,false);b.click();
 assert.match(b.textContent,/PY01/);
 s.value='mrt-kajang';s.dispatchEvent(new w.Event('change'));
 assert.equal(b.hidden,true);
 w.close();
});
