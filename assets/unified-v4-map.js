/* MR-S10 P01 V4. All geographic points arrive from GIS query responses.
   No route alignment is inferred from stop order. */
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs';
const $=id=>document.getElementById(id);
const core=window.MRS10UnifiedV4Registry, kl=window.MRS10KLRegistry,
 ampang=window.MRS10AmpangR219, ampangGIS=window.MRS10AmpangGISR219;
const locales=['ms','en','zh','th'];
const i18n={
 ms:{title:'Peta Rel Bersepadu V4',desc:'Empat laluan bersama. Titik stesen daripada GIS awam pihak ketiga; bukan koordinat operasi atau jajaran trek.',
  all:'Semua',search:'Cari stesen, kod atau laluan',reset:'Set semula',lineup:'Turutan stesen',
  loading:'Memuatkan stesen daripada GIS awam…',offline:'Peta geografi gagal dimuatkan. Senarai stesen masih boleh digunakan.',
  partial:'GIS tidak lengkap: hanya penanda yang dipadankan dipaparkan.',complete:'Semua penanda dipadankan kepada sumber GIS awam.',
  located:'Penanda sumber GIS dipadankan',unlocated:'Tiada lokasi GIS yang disahkan untuk stesen ini.',source:'GIS awam pihak ketiga (bukan pengukuran operasi)',
  transfer:'Pertukaran penumpang',status:'penanda GIS',noResults:'Tiada padanan carian.',pending:'Menunggu sumber GIS',notTrack:'Geometri trek belum disahkan; tiada garisan palsu.',
  rights:'Data sumber GIS: ArcGIS awam pihak ketiga · Turutan stesen: MR-S10 operator references · Basemap: OpenFreeMap / OSM · Bukan untuk operasi.',
  fail:'Ralat GIS',show:'Paparkan laluan',found:'daripada'},
 en:{title:'Unified Railway Map V4',desc:'Four services together. Station points from third-party public GIS; not operational coordinates or track alignments.',
  all:'All',search:'Search station, code or service',reset:'Reset',lineup:'Station lineup',
  loading:'Loading public GIS stations…',offline:'Geographic map unavailable. The station list remains accessible.',
  partial:'GIS incomplete: only source-matched markers are shown.',complete:'All markers matched against public GIS sources.',
  located:'Source GIS marker matched',unlocated:'No verified GIS position for this station.',source:'Third-party public GIS (not an operational survey)',
  transfer:'Passenger interchange',status:'GIS markers',noResults:'No search matches.',pending:'Awaiting GIS source',notTrack:'Track geometry not verified; no fictitious lines.',
  rights:'GIS data: third-party ArcGIS · Station order: MR-S10 operator references · Basemap: OpenFreeMap / OSM · Not for operations.',
  fail:'GIS error',show:'Show route',found:'of'},
 zh:{title:'综合铁路地图 V4',desc:'四条线路同时显示。车站点位来自第三方公共 GIS，并非运营测量坐标或轨道线路。',
  all:'全部',search:'搜索车站、代码或线路',reset:'重置',lineup:'车站顺序',
  loading:'正在加载公共 GIS 车站…',offline:'地理地图不可用，但车站列表仍可使用。',
  partial:'GIS 数据不完整：仅显示来源匹配的标记。',complete:'所有标记已与公共 GIS 来源匹配。',
  located:'已匹配 GIS 标记',unlocated:'该车站尚无已核对的 GIS 位置。',source:'第三方公共 GIS（非运营测量）',
  transfer:'乘客换乘',status:'GIS 标记',noResults:'没有匹配结果。',pending:'等待 GIS 数据',notTrack:'轨道几何未经核实，不绘制虚构线路。',
  rights:'GIS 来源：第三方 ArcGIS · 车站顺序：MR-S10 运营商参考资料 · 底图：OpenFreeMap / OSM · 不作运营用途。',
  fail:'GIS 错误',show:'显示线路',found:'／'},
 th:{title:'แผนที่รถไฟรวม V4',desc:'แสดง 4 เส้นทางพร้อมกัน จุดสถานีจาก GIS สาธารณะของบุคคลที่สาม ไม่ใช่พิกัดปฏิบัติการหรือแนวรางที่ตรวจวัด',
  all:'ทั้งหมด',search:'ค้นหาสถานี รหัส หรือเส้นทาง',reset:'รีเซ็ต',lineup:'ลำดับสถานี',
  loading:'กำลังโหลดสถานีจาก GIS สาธารณะ…',offline:'แผนที่ภูมิศาสตร์ไม่พร้อมใช้งาน แต่ยังดูรายชื่อสถานีได้',
  partial:'GIS ไม่ครบ: แสดงเฉพาะจุดที่จับคู่กับแหล่งข้อมูลได้',complete:'จับคู่หมุดทั้งหมดกับแหล่ง GIS สาธารณะแล้ว',
  located:'จับคู่หมุด GIS แล้ว',unlocated:'ยังไม่มีพิกัด GIS ที่ตรวจสอบแล้วสำหรับสถานีนี้',source:'GIS สาธารณะของบุคคลที่สาม (ไม่ใช่การสำรวจเพื่อปฏิบัติการ)',
  transfer:'จุดเปลี่ยนสายผู้โดยสาร',status:'หมุด GIS',noResults:'ไม่พบผลการค้นหา',pending:'รอข้อมูล GIS',notTrack:'ยังไม่ยืนยันแนวราง จึงไม่สร้างเส้นสมมติ',
  rights:'GIS: ArcGIS บุคคลที่สาม · ลำดับสถานี: MR-S10 ข้อมูลผู้ให้บริการ · แผนที่ฐาน: OpenFreeMap / OSM · ห้ามใช้เพื่อปฏิบัติการ',
  fail:'ข้อผิดพลาด GIS',show:'แสดงเส้นทาง',found:'จาก'}
};
const state={locale:'ms',category:'All',selected:'mrt-kajang',theme:'light',map:null,mapReady:false,zoomDone:false,
 results:new Map(),points:new Map(),pending:0,networkError:false,popup:null,manifest:[]};
function tr(k){return i18n[state.locale][k]}
function say(message){$('qa-note').textContent=message}
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=String(text);return x}
function selectedRoutes(){return state.manifest.filter(r=>state.category==='All'||r.category===state.category)}
function routeStatus(r){const d=state.results.get(r.id);return d?d.matched+'/'+r.expected:r.expected?'0/'+r.expected:'0'}
function currentCount(){return [...state.results.values()].reduce((n,r)=>n+r.matched,0)}
function showStatus(){
 const total=state.manifest.reduce((n,r)=>n+r.expected,0),ready=currentCount(),finished=state.pending===0;
 say((finished&&ready===total?tr('complete'):finished?tr('partial'):tr('loading'))+
  ' · '+ready+'/'+total+' '+tr('status')+' · '+tr('notTrack'));
 $('map-error').textContent=!state.mapReady&&state.networkError?tr('offline'):
  state.pending?tr('loading'):
  ready===total?tr('complete'):tr('partial');
 $('map-error').hidden=state.mapReady&&ready===total;
}
function findGeo(routeId,id){return state.points.get(routeId+':'+id)||null}
function buildFilters(){
 const host=$('filters');host.replaceChildren();
 for(const category of ['All','MRT','LRT']){
  const btn=el('button',null,category==='All'?tr('all'):category);
  btn.type='button';btn.setAttribute('aria-pressed',String(category===state.category));
  btn.onclick=()=>{state.category=category;const allowed=selectedRoutes();if(!allowed.some(x=>x.id===state.selected))state.selected=allowed[0]?.id||state.selected;
    buildFilters();buildLegend();buildRoutes();buildLineup();applyVisibility();};
  host.append(btn);
 }
}
function buildLegend(){
 const host=$('legend');host.replaceChildren();
 for(const r of selectedRoutes()){
  const row=el('div','legend-item'),dot=el('span','swatch'),name=el('span',null,r.label+' · '+routeStatus(r));
  dot.style.background=r.color;row.append(dot,name);host.append(row);
 }
}
function buildRoutes(){
 const host=$('route-buttons');host.replaceChildren();
 for(const r of selectedRoutes()){
  const btn=el('button',null,r.label);
  btn.type='button';btn.setAttribute('aria-pressed',String(r.id===state.selected));
  btn.onclick=()=>{state.selected=r.id;buildRoutes();buildLineup()};
  host.append(btn);
 }
}
function focusStation(routeId,id){
 const route=state.manifest.find(x=>x.id===routeId);if(!route)return;
 state.selected=routeId;
 if(state.category!=='All'&&state.category!==route.category){state.category='All';buildFilters();buildLegend();applyVisibility();}
 buildRoutes();buildLineup();
 const point=findGeo(routeId,id);
 if(!point){say(tr('unlocated'));return}
 say(point.name+' · '+tr('located'));
 if(state.map&&state.mapReady){state.map.easeTo({center:point.coordinates,zoom:Math.max(state.map.getZoom(),12.3),duration:360});showPopup(point)}
}
function buildLineup(){
 const host=$('lineup');host.replaceChildren();
 const route=state.manifest.find(r=>r.id===state.selected);
 if(!route)return;
 for(const s of route.stops){
  const li=el('li'),btn=el('button'),left=el('span'),right=el('span');
  const point=findGeo(route.id,s.id),dot=el('span','dot');
  dot.style.background=point?route.color:'var(--line)';
  left.append(dot,document.createTextNode(s.order+'. '+s.name));
  if(s.code)right.textContent=s.code;
  btn.type='button';btn.append(left,right);btn.onclick=()=>focusStation(route.id,s.id);
  btn.setAttribute('aria-label',s.name+(point?' · GIS':' · '+tr('unlocated')));
  li.append(btn);host.append(li);
 }
}
function updateSearch(){
 const q=core.normalise($('search').value),host=$('search-results');host.replaceChildren();
 if(!q){host.hidden=true;return}
 host.hidden=false;
 const matches=[];
 for(const r of state.manifest){
  for(const s of r.stops){if(core.normalise(s.name).includes(q)||core.normalise(s.code).includes(q)||core.normalise(r.label).includes(q))matches.push({r,s});}
 }
 for(const {r,s} of matches.slice(0,35)){
  const btn=el('button',null,r.label+' · '+s.name+(s.code?' ('+s.code+')':''));
  btn.type='button';btn.onclick=()=>{focusStation(r.id,s.id);host.hidden=true;$('search').value=''};
  host.append(btn);
 }
 if(!matches.length)host.append(el('p',null,tr('noResults')));
}
function applyLanguage(){
 document.documentElement.lang=state.locale;
 $('title').textContent=tr('title');$('description').textContent=tr('desc');
 $('lineup-title').textContent=tr('lineup');$('search').placeholder=tr('search');
 $('reset').textContent=tr('reset');$('language').textContent=state.locale==='ms'?'BM':state.locale==='en'?'EN':state.locale==='zh'?'中文':'ไทย';
 $('attribution').textContent=tr('rights');
 buildFilters();buildLegend();buildRoutes();buildLineup();updateSearch();showStatus();
}
function geoJSON(){
 return core.toGeoJSON(state.manifest.map(r=>state.results.get(r.id)));
}
function updateMapLayer(){
 const map=state.map;
 if(!map||!map.isStyleLoaded())return;
 const id='mrs10-v4-point-source',data=geoJSON();
 try{
  if(!map.getSource(id))map.addSource(id,{type:'geojson',data});
  else map.getSource(id).setData(data);
  for(const r of state.manifest){
   const lid='mrs10-v4-'+r.id;
   if(!map.getLayer(lid))map.addLayer({id:lid,type:'circle',source:id,
     filter:['==',['get','routeId'],r.id],
     paint:{'circle-color':r.color,'circle-radius':['interpolate',['linear'],['zoom'],7,5,11,8,14,10],
      'circle-stroke-color':'#ffffff','circle-stroke-width':2,'circle-opacity':0.99}});
  }
  applyVisibility();
 }catch(e){state.networkError=true;$('map-error').hidden=false;$('map-error').textContent=tr('offline')}
}
function applyVisibility(){
 if(!state.map||!state.map.isStyleLoaded())return;
 for(const r of state.manifest){
  const id='mrs10-v4-'+r.id;
  if(state.map.getLayer(id))state.map.setLayoutProperty(id,'visibility',
   state.category==='All'||state.category===r.category?'visible':'none');
 }
}
function showPopup(point){
 if(!state.map)return;
 if(state.popup)state.popup.remove();
 const route=state.manifest.find(r=>r.id===point.routeId);
 const container=el('div');
 container.append(el('strong',null,point.name),el('p',null,route.label+(point.code?' · '+point.code:'')),
  el('p',null,tr('source')));
 const transfers=core.interchangeRegistry.filter(i=>core.normalise(i.station)===core.normalise(point.name)&&i.routes.includes(point.routeId));
 if(transfers.length)container.append(el('p',null,tr('transfer')+': '+transfers.flatMap(i=>i.routes.filter(id=>id!==point.routeId)).map(id=>state.manifest.find(r=>r.id===id)?.label||id).join(', ')));
 state.popup=new maplibregl.Popup({offset:15,maxWidth:'300px'}).setLngLat(point.coordinates).setDOMContent(container).addTo(state.map);
}
function fitOnce(){
 if(state.zoomDone||!state.mapReady)return;
 const coords=[...state.points.values()].map(p=>p.coordinates);
 if(coords.length<2)return;
 const minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),
 minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1]));
 state.map.fitBounds([[minX,minY],[maxX,maxY]],{padding:45,maxZoom:12,duration:400});
 state.zoomDone=true;
}
function startMap(){
 try{
  state.map=new maplibregl.Map({container:'map',style:styleURL(),center:[101.69,3.13],zoom:10.1,
   attributionControl:true});
  state.map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  state.map.on('style.load',()=>{
   state.mapReady=true;state.networkError=false;
   updateMapLayer();fitOnce();showStatus();
  });
  state.map.on('error',()=>{if(!state.mapReady){state.networkError=true;showStatus()}});
  state.map.on('click',e=>{
   if(!state.mapReady)return;
   const layers=state.manifest.map(r=>'mrs10-v4-'+r.id).filter(id=>state.map.getLayer(id));
   if(!layers.length)return;
   const hits=state.map.queryRenderedFeatures([[e.point.x-11,e.point.y-11],[e.point.x+11,e.point.y+11]],{layers});
   const hit=hits[0];if(!hit)return;
   const point=findGeo(hit.properties.routeId,hit.properties.id);if(!point)return;
   state.selected=point.routeId;buildRoutes();buildLineup();showPopup(point);
  });
 }catch(e){state.networkError=true;showStatus()}
}
function styleURL(){return 'https://tiles.openfreemap.org/styles/'+(state.theme==='dark'?'dark':'positron')}
function reset(){
 state.category='All';state.selected='mrt-kajang';$('search').value='';$('search-results').hidden=true;
 buildFilters();buildLegend();buildRoutes();buildLineup();applyVisibility();
 state.zoomDone=false;fitOnce();
}
async function fetchRoute(route){
 const response=await fetch(route.source,{mode:'cors',credentials:'omit',cache:'no-store'});
 if(!response.ok)throw new Error('HTTP_'+response.status);
 const raw=await response.json();
 return core.decodeArcgis(route,raw,ampangGIS,ampang);
}
async function loadGIS(){
 state.pending=state.manifest.length;showStatus();
 await Promise.all(state.manifest.map(async route=>{
  try{
   const result=await fetchRoute(route);
   state.results.set(route.id,result);
   for(const p of result.points)state.points.set(p.routeId+':'+p.id,p);
  }catch(e){
   state.results.set(route.id,{ok:false,reason:String(e?.message||e),matched:0,expected:route.expected,points:[]});
  }finally{
   state.pending--;buildLegend();buildLineup();updateMapLayer();showStatus();
  }
 }));
 fitOnce();
}
function init(){
 try{state.manifest=core.loadManifest(kl,ampang)}catch(e){$('map-error').textContent='Registry: '+e.message;return}
 $('search').addEventListener('input',updateSearch);
 $('reset').addEventListener('click',reset);
 $('language').addEventListener('click',()=>{state.locale=locales[(locales.indexOf(state.locale)+1)%4];applyLanguage();if(state.popup){state.popup.remove();state.popup=null}});
 $('theme').addEventListener('click',()=>{
  state.theme=state.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=state.theme;
  if(state.map){state.mapReady=false;state.map.setStyle(styleURL())}
  showStatus();
 });
 applyLanguage();startMap();void loadGIS();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
