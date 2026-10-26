'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(require('node:path').join(__dirname,'../assets/ktm-unified-preview-overlay.js'),'utf8');
const ids=['ktmb-ets-v1','ktmb-ert','ktmb-shuttle-timuran'];
function fixture(){
 return {schemaVersion:1,source:'KTMB_OFFICIAL_GTFS_TRIP_PATTERNS',sourceUrl:'https://api.data.gov.my/gtfs-static/ktmb',
  snapshotUtc:'2026-10-27T00:00:00Z',zipSha256:'source-sha',physicalTrackGeometry:null,
  services:ids.map((id,i)=>({id,routeId:['ETS','ERT','SH'][i],tripId:['9442','26','51'][i],color:'#A8772F',
   stops:[{order:1,id:id+'-1',name:'FIRST',lat:4+i,lon:102},{order:2,id:id+'-2',name:'SECOND',lat:4.2+i,lon:102.2}]}))};
}
function review(data){
 const stops=data.services[2].stops;
 return {schemaVersion:2,sourceUrl:data.sourceUrl,zipSha256:data.zipSha256,tripId:'51',qualityGate:'PARTIAL_REVIEW_REQUIRED',
  decisions:{SUSPECTED_MISMATCH:0,UNRESOLVED:1,APPROXIMATE:1},stops:stops.map((s,i)=>({
   order:i+1,stopId:s.id,originalCoordinates:{lat:s.lat,lon:s.lon},
   effectiveCoordinates:{lat:s.lat,lon:i===1?102.02:s.lon},coordinatesChanged:i===1,
   replacementSourceUrl:i===1?'https://www.openstreetmap.org/node/2630752130':null,
   offsetMeters:i===1?35:null,confidence:i===1?'MEDIUM':'LOW',
   decision:i===1?'APPROXIMATE':'UNRESOLVED',reason:'Railway verification pending',
   railwayAlignmentEvidence:{osmRailwayUrl:null}
  }))};
}
class Popup{setLngLat(v){this.pos=v;return this}setDOMContent(v){this.dom=v;return this}addTo(map){map.popup=this;return this}remove(){}}
function mapFake(){
 return {sources:{},layers:{'ktmv2-old-points':{id:'ktmv2-old-points',type:'circle',layout:{}}},handlers:{},cameras:[],
  getStyle(){return {sources:{base:{}},layers:Object.values(this.layers)}},
  getSource(id){return this.sources[id]},addSource(id,opts){this.sources[id]={data:opts.data,setData(x){this.data=x}}},
  getLayer(id){return this.layers[id]},addLayer(p){this.layers[p.id]={...p,layout:p.layout||{}}},
  setLayoutProperty(id,k,val){this.layers[id].layout[k]=val},fitBounds(a,b){this.cameras.push({a,b})},
  flyTo(o){this.cameras.push(o)},on(e,cb){this.handlers[e]=cb},queryRenderedFeatures(){return []}
 };
}
test('source-backed Shuttle marker reconciliation preserves all original GTFS positions for audit, ETS and ERT unchanged',async()=>{
 const dom=new JSDOM('<select id="lang"><option value="ms">BM</option><option value="zh">中文</option><option value="th">ไทย</option></select><div id="filters"></div><section id="services"></section><p id="map-status"></p>',{url:'https://preview.example/',runScripts:'outside-only'});
 const w=dom.window;w.eval(script);
 const data=fixture(),audit=review(data),m=mapFake();
 let selectKomuterCalls=0;
 w.fetch=async path=>({ok:true,json:async()=>path.includes('alignment-review')?audit:data});
 const ext=w.KTMUnifiedOverlay.mount({map:m,lib:{Popup},selectKomuter:()=>{selectKomuterCalls++}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(w.document.querySelectorAll('[data-unified-service]').length,3);
 w.document.querySelector('[data-unified-service="ktmb-shuttle-timuran"]').click();
 const pts=m.sources['ktm-unified-source'].data.features;
 assert.equal(pts.length,2);
 assert.deepEqual([...pts[1].geometry.coordinates],[102.02,6.2]);
 assert.equal(pts[1].properties.gisDecision,'APPROXIMATE');
 assert.equal(selectKomuterCalls,1);
 assert.equal(m.layers['ktm-unified-circles'].type,'circle');
 assert.equal(w.document.getElementById('ktm-unified-lineup').querySelectorAll('li').length,2);
 w.document.querySelectorAll('#ktm-unified-lineup li button')[1].click();
 assert.match(m.popup.dom.textContent,/Original KTMB GTFS:/);
 assert.match(m.popup.dom.textContent,/Stop ID/);
 assert.match(m.popup.dom.textContent,/source|OSM|G[Ii]S/);
 assert.match(m.popup.dom.textContent,/102\.2/);
 w.document.querySelector('[data-unified-service="ktmb-ets-v1"]').click();
 assert.equal(m.sources['ktm-unified-source'].data.features[1].geometry.coordinates[0],102.2,'ETS not corrected');
 w.document.querySelector('[data-unified-service="ktmb-ert"]').click();
 assert.equal(m.sources['ktm-unified-source'].data.features[1].geometry.coordinates[0],102.2,'ERT not corrected');
 w.document.getElementById('lang').value='zh';ext.refresh();assert.match(w.document.querySelector('#ktm-unified-lineup').textContent,/车次/);
 w.document.getElementById('lang').value='th';ext.refresh();assert.match(w.document.querySelector('#ktm-unified-lineup').textContent,/เที่ยวรถ/);
 m.sources={};m.layers={'ktmv2-old-points':{id:'ktmv2-old-points',type:'circle',layout:{}}};
 m.handlers['style.load']();assert.equal(m.sources['ktm-unified-source'].data.features.length,2);
 ext.clear();assert.equal(w.document.getElementById('services').hidden,false);
});
