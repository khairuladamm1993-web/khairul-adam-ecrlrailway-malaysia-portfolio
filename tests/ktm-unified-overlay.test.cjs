'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../ktm-komuter-v2.html'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'../assets/ktm-unified-preview-overlay.js'),'utf8');
const ids=['ktmb-ets-v1','ktmb-ert','ktmb-shuttle-timuran'];
function fixture(){
 return {schemaVersion:1,source:'KTMB_OFFICIAL_GTFS_TRIP_PATTERNS',
 sourceUrl:'https://api.data.gov.my/gtfs-static/ktmb',snapshotUtc:'2026-10-27T00:00:00Z',
 physicalTrackGeometry:null,
 services:ids.map((id,index)=>({id,routeId:['ETS','ERT','SH'][index],tripId:['9442','26','51'][index],
 name:id,color:['#3157C8','#A15B29','#A8772F'][index],
 stops:[{id:id+'-1',name:'Station A',lat:3+index,lon:101,order:1},
        {id:id+'-2',name:'Station B',lat:3.5+index,lon:102,order:2}]}))};
}
class Popup{
 setLngLat(v){this.xy=v;return this;}
 setDOMContent(v){this.content=v;return this;}
 addTo(m){m.popup=this;return this;}
 remove(){}
}
test('GTFS trips validate exact route identity, source and coordinate evidence',()=>{
 const w=new JSDOM('').window;w.eval(script);
 assert(w.KTMUnifiedOverlay.validate(fixture()));
 assert.equal(w.KTMUnifiedOverlay.validate({...fixture(),physicalTrackGeometry:{}}),false);
 assert.equal(w.KTMUnifiedOverlay.validate({...fixture(),sourceUrl:'https://untrusted.invalid'}),false);
 const bad=fixture();bad.services[0].stops[0].lat=99;assert.equal(w.KTMUnifiedOverlay.validate(bad),false);
});
test('ETS and Intercity are selectable on Komuter V3 map without modifying Komuter data',async()=>{
 const w=new JSDOM('<select id="lang"><option value="ms">BM</option><option value="zh">中文</option><option value="th">ไทย</option></select><div id="filters"></div><section id="services"></section><p id="map-status"></p>',{url:'https://preview.example/',runScripts:'outside-only'}).window;
 w.eval(script);w.fetch=async(url,options)=>{assert.equal(options.credentials,'same-origin');return {ok:true,json:async()=>fixture()}};
 let oldSelected=0;
 const m={sources:{},layers:{'ktmv2-ktm-seremban-points':{id:'ktmv2-ktm-seremban-points',type:'circle',layout:{}}},handlers:{},camera:[],
 getStyle(){return {sources:{base:{}},layers:Object.values(this.layers)};},
 on(event,cb){this.handlers[event]=cb;},
 getSource(id){return this.sources[id]},
 addSource(id,opts){this.sources[id]={data:opts.data,setData(data){this.data=data}}},
 getLayer(id){return this.layers[id]},
 addLayer(layer){this.layers[layer.id]={...layer,layout:layer.layout||{}}},
 setLayoutProperty(id,key,value){this.layers[id].layout[key]=value},
 fitBounds(b,o){this.camera.push({b,o})},
 flyTo(){},
 queryRenderedFeatures(){return []}};
 const ext=w.KTMUnifiedOverlay.mount({map:m,lib:{Popup},selectKomuter:()=>{oldSelected++}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(w.document.querySelectorAll('[data-unified-service]').length,3);
 w.document.querySelector('[data-unified-service="ktmb-ets-v1"]').click();
 assert.equal(oldSelected,1);
 assert.equal(m.getSource('ktm-unified-source').data.features.length,2);
 assert.equal(m.getLayer('ktmv2-ktm-seremban-points').layout.visibility,'none');
 assert.equal(w.document.getElementById('services').hidden,true);
 assert.equal(m.camera.length,1);
 w.document.getElementById('lang').value='zh';ext.refresh();
 assert.match(w.document.getElementById('ktm-unified-lineup').textContent,/车次/);
 w.document.querySelector('[data-unified-service="ktmb-ert"]').click();
 assert.equal(m.getSource('ktm-unified-source').data.features[0].properties.serviceId,'ktmb-ert');
 w.document.getElementById('lang').value='th';ext.refresh();
 assert.match(w.document.getElementById('ktm-unified-lineup').textContent,/เที่ยวรถ/);
 m.sources={};m.layers={'ktmv2-ktm-seremban-points':{id:'ktmv2-ktm-seremban-points',type:'circle',layout:{}}};
 m.handlers['style.load']();
 assert.equal(m.getSource('ktm-unified-source').data.features.length,2,'style switch recovers overlay');
 ext.clear();
 assert.equal(w.document.getElementById('services').hidden,false);
 assert.equal(m.getLayer('ktm-unified-circles').layout.visibility,'none');
 w.close();
});
test('verified Komuter V3 locale, data and focus hooks remain connected',()=>{
 assert.match(html,/ktm-unified-preview-overlay\.js/);
 assert.match(html,/extension=window\.KTMUnifiedOverlay\?\.mount/);
 assert.match(html,/extension\?\.clear\(\)/);
 assert.match(html,/extension\?\.refresh\(\)/);
 assert.match(html,/mrs10-r225-ktm-gtfs-stations\.json/);
 assert.doesNotMatch(script,/LineString|supabase|service_role|credentials:'omit'/i);
});
