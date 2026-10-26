'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ktm-komuter-v2.html'),'utf8');
const catalogue=require('../assets/mrs10-r223-ktm-catalogue.json');
const api=require('../assets/mrs10-r223-ktm-service.js');
const rows=[
 ['Padang Besar',6.662205,100.319514,['ktm-padang-besar']],
 ['Bukit Ketri',6.588,100.25,['ktm-padang-besar']],
 ['Butterworth',5.393343,100.366201,['ktm-padang-besar','ktm-ipoh']],
 ['Ipoh',4.597526,101.07333,['ktm-ipoh']],
 ['Paloh',2.186932,103.193987,['ktm-shuttle-selatan-paloh']],
 ['Kluang',2.033666,103.31773,['ktm-shuttle-selatan-paloh']],
 ['Kempas Baru',1.535744,103.721801,['ktm-shuttle-selatan-paloh','ktm-shuttle-selatan-pasirgudang']],
 ['Pasir Gudang',1.444783,103.92152,['ktm-shuttle-selatan-pasirgudang']]
];
const official={schemaVersion:1,source:'KTMB_GTFS_STATIC_STOP_COORDINATES',sourceUrl:api.OFFICIAL_GTFS_SOURCE,stops:rows.map(([name,lat,lon,serviceIds],i)=>({name,lat,lon,serviceIds,gtfsStopId:String(900+i)}))};
class FakePopup {
 setLngLat(x){this.coordinates=x;return this;}
 setDOMContent(x){this.content=x;return this;}
 addTo(map){map.popup=this;return this;}
 remove(){}
}
test('authenticated browser GIS: source → MapLibre → category → reset → popup → theme',async()=>{
 const dom=new JSDOM(html,{url:'https://isolated.example.test/',runScripts:'outside-only'});
 const {window}=dom,{document}=window;
 let map;
 class FakeMap{
  constructor(){this.sources={};this.layers={'basemap-place':{id:'basemap-place',type:'symbol',layout:{'text-field':['get','name']}}};this.handlers={};this.camera=[];map=this;}
  addControl(){}
  on(event,callback){this.handlers[event]=callback;if(event==='style.load')queueMicrotask(callback);}
  getStyle(){return {sources:{base:{}},layers:Object.values(this.layers)};}
  addSource(id,opts){this.sources[id]={data:opts.data,setData(data){this.data=data;}};}
  getSource(id){return this.sources[id]||null;}
  addLayer(spec){this.layers[spec.id]={...spec,layout:{...(spec.layout||{})}};}
  getLayer(id){return this.layers[id]||null;}
  setLayoutProperty(id,k,v){this.layers[id].layout[k]=v;}
  fitBounds(bounds,options){this.camera.push({type:'bounds',bounds,options});}
  flyTo(options){this.camera.push({type:'fly',options});}
  getContainer(){return document.getElementById('map');}
  queryRenderedFeatures(){return [];}
  setStyle(){this.sources={};this.layers={'basemap-place':{id:'basemap-place',type:'symbol',layout:{'text-field':['get','name']}}};queueMicrotask(()=>this.handlers['style.load']());}
  resize(){}
 }
 window.__fakeMaplibre={Map:FakeMap,Popup:FakePopup,NavigationControl:class {}};
 window.MRS10KTMV2=api;
 const accesses=[];
 window.fetch=async (url,opts={})=>{
  accesses.push({url:String(url),credentials:opts.credentials});
  if(String(url).includes('catalogue.json'))return {ok:true,status:200,json:async()=>catalogue};
  if(String(url).includes('gtfs-stations.json')){
   // Protected deployment: the same-origin session is mandatory. Without it the server denies JSON.
   if(opts.credentials!=='same-origin')return {ok:false,status:401,headers:{get:()=> 'text/html'},json:async()=>({})};
   return {ok:true,status:200,headers:{get:()=> 'application/json; charset=utf-8'},json:async()=>official};
  }
  throw Error('Secondary external CORS source unavailable in this deterministic fixture');
 };
 const start=html.indexOf('<script>')+'<script>'.length;
 const end=html.lastIndexOf('</script>');
 assert(start>8&&end>start,'expected standalone inline application script');
 const script=html.slice(start,end).replace(
  "import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs')",
  'Promise.resolve(window.__fakeMaplibre)'
 );
 await window.eval(script);
 assert(map,'MapLibre constructor reached');
 assert(accesses.some(x=>x.url.includes('gtfs-stations.json')&&x.credentials==='same-origin'),'public GTFS was requested with protected preview session');
 const count=id=>map.getSource('ktmv2-'+id).data.features.length;
 assert.equal(count('ktm-padang-besar'),3);
 assert.equal(count('ktm-ipoh'),2);
 assert.equal(count('ktm-shuttle-selatan-paloh'),3);
 assert.equal(count('ktm-shuttle-selatan-pasirgudang'),2);
 assert.equal(map.getSource('ktmv2-unique-source').data.features.length,8);
 assert.match(document.getElementById('evidence').textContent,/GTFS rasmi/,'GTFS coordinates must not be labelled secondary GIS');
 assert.equal(map.getLayer('ktmv2-ktm-padang-besar-points').paint['circle-color'],'#008658');
 assert.equal(map.getLayer('ktmv2-ktm-shuttle-selatan-paloh-points').paint['circle-color'],'#7853A6');
 assert.equal(map.camera.at(-1).type,'bounds','default all view fits nationwide markers');
 const select=id=>document.querySelector('[data-route="'+id+'"]').click();
 select('ktm-padang-besar');
 assert.equal(map.getSource('ktmv2-unique-source').data.features.length,3);
 assert.equal(map.getLayer('ktmv2-ktm-ipoh-points').layout.visibility,'none');
 assert.equal(map.camera.at(-1).type,'bounds');
 assert(Number(map.camera.at(-1).bounds[1][1])>5,'north category refocuses in north');
 assert(!document.getElementById('map-status').textContent.includes('Tiada lokasi GIS'));
 select('ktm-shuttle-selatan-paloh');
 assert.equal(map.getSource('ktmv2-unique-source').data.features.length,3);
 assert(Number(map.camera.at(-1).bounds[1][1])<3,'south category refocuses in south');
 const paloh=[...document.querySelectorAll('.station-name')].find(n=>n.textContent==='Paloh');
 paloh.closest('button').click();
 assert(map.popup.content.textContent.includes('Paloh'));
 assert(map.popup.content.textContent.includes('Paloh – JB Sentral')||map.popup.content.textContent.includes('Paloh'));
 assert(map.popup.content.textContent.includes('GTFS'));
 assert(map.popup.content.textContent.includes('data.gov.my'),'popup must cite real GTFS source, not secondary GIS');
 // Language changes must immediately update map-owned text, basemap source fields, route UI,
 // status and an open popup, without recentering or changing source-backed station coordinates.
 const lang=document.getElementById('lang');
 const originalPoints=JSON.stringify(map.getSource('ktmv2-unique-source').data);
 const originalCameraCalls=map.camera.length;
 lang.value='zh';lang.dispatchEvent(new window.Event('change'));
 assert.equal(document.documentElement.lang,'zh-Hans');
 assert(document.getElementById('map-locale-note').textContent.includes('中文'));
 assert.match(document.querySelector('#filters [data-route="ktm-padang-besar"]').textContent,/北部通勤/);
 assert.match(map.getLayer('ktmv2-unique-label').layout['text-field'][2],/车站/);
 assert.match(map.popup.content.textContent,/南部通勤/,'open station popup rerenders in Chinese');
 assert.equal(map.getLayer('basemap-place').layout['text-field'][1][1],'name:zh');
 assert.equal(map.camera.length,originalCameraCalls,'changing language must not pan or zoom');
 assert.equal(JSON.stringify(map.getSource('ktmv2-unique-source').data),originalPoints);
 lang.value='th';lang.dispatchEvent(new window.Event('change'));
 assert.equal(document.documentElement.lang,'th');
 assert(document.getElementById('map-locale-note').textContent.includes('ไทย'));
 assert.match(document.querySelector('#filters [data-route="ktm-padang-besar"]').textContent,/สายเหนือ/);
 assert.match(map.getLayer('ktmv2-unique-label').layout['text-field'][2],/สถานี/);
 assert.match(map.popup.content.textContent,/สายใต้/,'open popup rerenders in Thai');
 assert.equal(map.getLayer('basemap-place').layout['text-field'][1][1],'name:th');
 assert.equal(map.camera.length,originalCameraCalls);
 lang.value='en';lang.dispatchEvent(new window.Event('change'));
 assert.equal(document.documentElement.lang,'en');
 assert.equal(document.getElementById('map-locale-note').hidden,true);
 assert.deepEqual(map.getLayer('basemap-place').layout['text-field'],['get','name'],'English restores provider label expression');
 assert.deepEqual(map.getLayer('ktmv2-unique-label').layout['text-field'],['get','name']);
 assert.equal(JSON.stringify(map.getSource('ktmv2-unique-source').data),originalPoints);
 select('all');
 assert.equal(map.getSource('ktmv2-unique-source').data.features.length,8);
 assert.equal(map.getLayer('ktmv2-ktm-ipoh-points').layout.visibility,'visible');
 document.getElementById('theme').click();
 await Promise.resolve();
 assert.equal(map.getSource('ktmv2-unique-source').data.features.length,8,'theme switch restores marker layers');
 assert.equal(map.getLayer('ktmv2-ktm-ipoh-points').paint['circle-color'],'#2071C4');
 dom.window.close();
});
test('official request and style-layer loading never silently lose protected GTFS or all-stations focus',()=>{
 assert.match(html,/gtfs-stations\.json',\{cache:'no-store',credentials:'same-origin'\}/);
 assert.match(html,/if\(!styleReady\|\|!map\?\.getStyle/);
 assert.match(html,/map\.on\('style\.load',\(\)=>\{styleReady=true;updateLayers\(\);focusSelectedRoute\(\);\}\)/);
 assert.match(html,/maxZoom:focus==='all'\?9:10\.5/);
 assert.match(html,/INVALID_CONTENT_TYPE/);
 assert.match(html,/officialError=String\(error/);
 assert.match(html,/function updateEvidence\(\)/);
 assert.match(html,/sourceOfficial/);
 assert.match(html,/function localizeBaseMap\(\)/);
 assert.match(html,/function stationTextExpression\(\)/);
 assert.match(html,/activePopupFeature\)popup\(activePopupFeature\)/);
});
