/* R2.7 isolated visitor-map vector label prototype; no ECRL coordinate edits. */
(()=>{
'use strict';
const locales=['ms','en','zh','th'];
const centers={malaysia:[[102.75,4.4],5.4],thailand:[[101,15.3],4.9],china:[[106.7,32.3],3.6]};
const copy={
 ms:['Peta pelawat pelbagai bahasa · BETA','Pilih bahasa bagi nama tempat jika data tersedia.','Nama tempat mungkin tiada terjemahan.','Peta pelawat sahaja, bukan peta operasi ECRL.'],
 en:['Multilingual visitor map · BETA','Choose the language of place names when source data exists.','Not every location has a translated name.','Visitor reference only, not an ECRL operational map.'],
 zh:['多语言旅行地图 · 测试版','选择地名语言（如有源数据）。','部分地点没有相应的译名。','仅供旅行参考，并非 ECRL 运营地图。'],
 th:['แผนที่ท่องเที่ยวหลายภาษา · รุ่นทดสอบ','เลือกภาษาของชื่อสถานที่เมื่อมีข้อมูล','บางสถานที่ไม่มีชื่อที่แปลแล้ว','สำหรับการเดินทางเท่านั้น ไม่ใช่แผนที่เดินรถ ECRL']
};
const uiText={
 ms:{railOn:'Butiran railway: AKTIF',railOff:'Butiran railway: MATI',railNote:'Mod pelawat menyembunyikan lapisan teknikal OpenRailwayMap. Aktifkan butiran railway untuk melihat laluan dan kod rujukan landasan.',themeLight:'Tukar ke Mod Cerah',themeDark:'Tukar ke Mod Gelap',labelLayers:'lapisan label dengan sokongan bahasa'},
 en:{railOn:'Railway details: ON',railOff:'Railway details: OFF',railNote:'Visitor mode hides the technical OpenRailwayMap overlay. Turn on railway details to view rail routes and reference numbers.',themeLight:'Switch to Light Mode',themeDark:'Switch to Dark Mode',labelLayers:'language-enabled label layers'},
 zh:{railOn:'铁路详情：开启',railOff:'铁路详情：关闭',railNote:'游客模式隐藏 OpenRailwayMap 技术图层。开启铁路详情可查看线路和参考编号。',themeLight:'切换至浅色模式',themeDark:'切换至深色模式',labelLayers:'支持语言切换的标签图层'},
 th:{railOn:'รายละเอียดรถไฟ: เปิด',railOff:'รายละเอียดรถไฟ: ปิด',railNote:'โหมดนักท่องเที่ยวซ่อนชั้นข้อมูลทางเทคนิคของ OpenRailwayMap เปิดรายละเอียดรถไฟเพื่อดูเส้นทางและรหัสอ้างอิง',themeLight:'เปลี่ยนเป็นโหมดสว่าง',themeDark:'เปลี่ยนเป็นโหมดมืด',labelLayers:'ชั้นป้ายชื่อที่รองรับภาษา'}
};
const readableRailLanguage={
 ms:{guide:'Liuzhou · nama railway dwibahasa',guideHint:'Rujukan nama daripada tangkap layar Owner; bukan pin lokasi stesen yang disahkan.',railLines:'Mod pelawat: garisan railway vektor tanpa nombor trek',railMissing:'Garisan railway vektor tidak tersedia dalam gaya peta ini.',technical:'Butiran teknikal ON: nombor trek dan nama pada imej OpenRailwayMap kekal dalam bahasa asal.'},
 en:{guide:'Liuzhou · bilingual railway names',guideHint:'Names identified from the Owner screenshot; not verified station coordinates.',railLines:'Visitor mode: vector railway lines without track numbers',railMissing:'Vector railway lines are unavailable in this map style.',technical:'Technical railway mode ON: track numbers and names on the OpenRailwayMap image remain in their original language.'},
 zh:{guide:'柳州 · 铁路地名对照',guideHint:'名称来自用户提供的截图，不代表经过核实的站点坐标。',railLines:'游客模式：铁路矢量线条，不显示股道编号',railMissing:'此地图样式不支持铁路矢量线条。',technical:'铁路详情开启：OpenRailwayMap 影像上的股道编号与地名仍使用原始语言。'},
 th:{guide:'หลิ่วโจว · ชื่อสถานที่รถไฟสองภาษา',guideHint:'ชื่อจากภาพหน้าจอของเจ้าของ ไม่ใช่พิกัดสถานีที่ผ่านการยืนยัน',railLines:'โหมดนักท่องเที่ยว: เส้นทางรถไฟแบบเวกเตอร์ ไม่มีหมายเลขราง',railMissing:'แผนที่นี้ไม่มีข้อมูลเส้นทางรถไฟแบบเวกเตอร์',technical:'เปิดรายละเอียดรถไฟ: หมายเลขรางและชื่อบนภาพ OpenRailwayMap ยังคงเป็นภาษาต้นฉบับ'}
};
// Campus reference centroid from OpenStreetMap way 631232606 (WGS84).
// This is NOT a verified gate, building, or trainee accommodation position.
const LRVTC_CAMPUS=Object.freeze({
 id:'lrvtc-guantang-campus',name:'Liuzhou Railway Vocational Technical College',
 alternate:'柳州铁道职业技术学院',campus:'Guantang Campus',
 lngLat:Object.freeze([109.52917,24.39864]),osmWay:'631232606',
 address:'No. 2 Wenyuan Road, Yufeng District, Liuzhou, Guangxi, China',
 positionClass:'OSM campus-area reference, not surveyed entrance'
});
const campusText={
 ms:{button:'🎓 LRVTC · Kampus Guantang',title:'LRVTC · Kampus Guantang',
  note:'Pin rujukan kawasan kampus, bukan pintu masuk atau bangunan penginapan yang disahkan.'},
 en:{button:'🎓 LRVTC · Guantang Campus',title:'LRVTC · Guantang Campus',
  note:'Campus-area reference pin; not a verified gate or accommodation building.'},
 zh:{button:'🎓 柳州铁道职业技术学院 · 官塘校区',title:'柳州铁道职业技术学院 · 官塘校区',
  note:'仅供定位校区区域；不是经过核实的校门或住宿楼位置。'},
 th:{button:'🎓 LRVTC · วิทยาเขตกวนถัง',title:'LRVTC · วิทยาเขตกวนถัง',
  note:'หมุดอ้างอิงบริเวณวิทยาเขต ไม่ใช่ทางเข้าหรืออาคารที่พักที่ยืนยันตำแหน่งแล้ว'}
};
const el=id=>document.getElementById(id);
let lang='ms',map=null,ready=false,railDetails=false,activeRegion='malaysia',campusMarker=null;
const railVisibility=on=>on?'visible':'none';
function makeCampusPopup(){
 const root=document.createElement('div');root.className='campus-popup';
 const heading=document.createElement('strong');heading.textContent=campusText[lang].title;root.appendChild(heading);
 const original=document.createElement('p');original.textContent=LRVTC_CAMPUS.alternate+' · Liǔzhōu Tiědào Zhíyè Jìshù Xuéyuàn';root.appendChild(original);
 const address=document.createElement('p');address.textContent=LRVTC_CAMPUS.address;root.appendChild(address);
 const note=document.createElement('small');note.textContent=campusText[lang].note;root.appendChild(note);
 return root;
}
function syncCampusPin(){
 const box=el('campus-location'),button=el('campus-focus');
 const china=activeRegion==='china';
 if(box)box.hidden=!china;
 if(button)button.textContent=campusText[lang].button;
 if(!china){
  if(campusMarker){campusMarker.remove();campusMarker=null;}
  return;
 }
 if(!map||!window.maplibregl?.Marker||!window.maplibregl?.Popup)return;
 if(!campusMarker){
  const pin=document.createElement('button');pin.type='button';pin.className='lrvtc-pin';
  pin.textContent='🎓';pin.title=campusText[lang].title;
  pin.setAttribute('aria-label',campusText[lang].title);
  campusMarker=new maplibregl.Marker({element:pin,anchor:'bottom'})
   .setLngLat(LRVTC_CAMPUS.lngLat)
   .setPopup(new maplibregl.Popup({offset:22,maxWidth:'290px'}).setDOMContent(makeCampusPopup()))
   .addTo(map);
 }else{
  const pin=campusMarker.getElement?.();
  if(pin){pin.title=campusText[lang].title;pin.setAttribute('aria-label',campusText[lang].title);}
  campusMarker.setPopup(new maplibregl.Popup({offset:22,maxWidth:'290px'}).setDOMContent(makeCampusPopup()));
 }
}
function setRailVisibility(){
 if(map?.getLayer?.('mrl-railway'))map.setLayoutProperty('mrl-railway','visibility',railVisibility(railDetails));
 const button=el('railway-btn');
 if(button){button.setAttribute('aria-pressed',String(railDetails));button.textContent=railDetails?uiText[lang].railOn:uiText[lang].railOff;}
 const note=el('railway-note');if(note)note.textContent=railDetails?readableRailLanguage[lang].technical:uiText[lang].railNote;
 const quick=el('rail-mode-status');
 if(quick)quick.textContent=railDetails?readableRailLanguage[lang].technical:readableRailLanguage[lang].railLines;

}
try{const v=localStorage.getItem('railway-language');if(locales.includes(v))lang=v;}catch{}
function nameExpression(locale){
 const keys=locale==='ms'?['name:ms','name:en','name:latin','name']:
 locale==='en'?['name:en','name:latin','name']:['name:'+locale,'name:en','name:latin','name'];
 return ['coalesce',...keys.map(key=>['get',key])];
}
const isNameLayer=layer=>layer?.type==='symbol'&&layer.layout?.['text-field']!=null&&
 /^(label_|water_name_|waterway_line_label|poi_|poi_transit|airport$|highway-name-)/.test(layer.id);
function applyLabels(){
 if(!map||!map.isStyleLoaded())return 0;
 let n=0;
 for(const layer of map.getStyle().layers||[])
  if(isNameLayer(layer)){map.setLayoutProperty(layer.id,'text-field',nameExpression(lang));n++;}
 el('label-status').textContent=(n?n+' '+uiText[lang].labelLayers+' · ':'')+copy[lang][2];
 return n;
}
function render(){
 document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
 el('lab-title').textContent=copy[lang][0];
 el('lab-info').textContent=copy[lang][1];
 el('place-status').textContent=copy[lang][3];
 el('label-status').textContent=copy[lang][2];
 document.querySelectorAll('[data-locale]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.locale===lang)));
 const guideTitle=el('liuzhou-title');if(guideTitle)guideTitle.textContent=readableRailLanguage[lang].guide;
 const guideHint=el('liuzhou-hint');if(guideHint)guideHint.textContent=readableRailLanguage[lang].guideHint;
 syncCampusPin();
 setRailVisibility();
 const countryNames={
  ms:['Malaysia','Thailand','China'],en:['Malaysia','Thailand','China'],
  zh:['马来西亚','泰国','中国'],th:['มาเลเซีย','ประเทศไทย','จีน']
 };
 document.querySelectorAll('[data-region]').forEach((b,i)=>{
  const flag=['🇲🇾','🇹🇭','🇨🇳'][i];
  if(countryNames[lang][i])b.textContent=flag+' '+countryNames[lang][i];
 });
}
function setLanguage(v){
 if(!locales.includes(v))return;lang=v;
 try{localStorage.setItem('railway-language',lang)}catch{}
 render();applyLabels();
 const status=el('rail-vector-note');if(status&&map?.isStyleLoaded())status.textContent=
  map.getLayer('mrl-readable-rail-lines')?readableRailLanguage[lang].railLines:readableRailLanguage[lang].railMissing;
}
function theme(){
 try{return localStorage.getItem('railway-theme')==='dark'?'dark':'light'}catch{return 'light'}
}
function updateTheme(){
 const dark=theme()==='dark';
 document.documentElement.dataset.theme=dark?'dark':'light';
 el('theme-btn').textContent=dark?'☀':'☾';
 el('theme-btn').setAttribute('aria-label',dark?uiText[lang].themeLight:uiText[lang].themeDark);
 el('theme-btn').textContent=dark?uiText[lang].themeLight:uiText[lang].themeDark;
}
function transportationSource(style){
 // Source ID is derived from real OpenFreeMap style; no invented track geometry.
 if(!style?.layers||!style?.sources)return null;
 const layer=style.layers.find(l=>l['source-layer']==='transportation' &&
   style.sources[l.source]?.type==='vector');
 return layer?.source||null;
}
function railVectorLayer(source,dark){
 return {id:'mrl-readable-rail-lines',type:'line',source,'source-layer':'transportation',
  minzoom:8,filter:['==',['get','class'],'rail'],
  layout:{'line-cap':'round','line-join':'round'},
  paint:{'line-color':dark?'#87d8e8':'#247a97','line-opacity':0.87,
    'line-width':['interpolate',['linear'],['zoom'],8,0.8,14,1.9,18,3]}};
}
function readableRails(){
 const style=map.getStyle(),source=transportationSource(style);
 if(!source)return false;
 if(map.getLayer('mrl-readable-rail-lines'))return true;
 const first=style.layers.find(x=>x.type==='symbol');
 map.addLayer(railVectorLayer(source,theme()==='dark'),first?.id);
 return true;
}
function overlay(){
 if(map.getSource('mrl-railway'))return;
 map.addSource('mrl-railway',{type:'raster',tiles:['https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'© OpenRailwayMap contributors'});
 const first=map.getStyle().layers.find(x=>x.type==='symbol');
 map.addLayer({id:'mrl-railway',type:'raster',source:'mrl-railway',layout:{visibility:railVisibility(railDetails)},paint:{'raster-opacity':0.60}},first?.id);
}
function init(){
 render();updateTheme();
 if(!window.maplibregl?.Map){el('label-status').textContent='Vector map engine unavailable';return;}
 map=new maplibregl.Map({
  container:'visitor-map',style:'https://tiles.openfreemap.org/styles/'+(theme()==='dark'?'dark':'positron'),
  center:centers.malaysia[0],zoom:centers.malaysia[1],minZoom:1,attributionControl:true,
  pitchWithRotate:false,dragRotate:false,touchPitch:false
 });
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');
 map.on('style.load',()=>{
  try{
   const rails=readableRails();
   overlay();applyLabels();setRailVisibility();ready=true;
   el('label-status').dataset.ready='true';
   el('rail-vector-note').textContent=rails?readableRailLanguage[lang].railLines:readableRailLanguage[lang].railMissing;
  }
  catch(e){el('label-status').textContent='Map style unavailable';}
 });
 map.on('error',()=>{if(!ready)el('label-status').textContent='Vector map unavailable';});
 document.querySelectorAll('[data-locale]').forEach(b=>b.addEventListener('click',()=>{setLanguage(b.dataset.locale);updateTheme();}));
 el('railway-btn').addEventListener('click',()=>{railDetails=!railDetails;setRailVisibility();});
 document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>{
  const target=centers[b.dataset.region];
  if(target)map.flyTo({center:target[0],zoom:target[1],duration:600});
  activeRegion=b.dataset.region;
  el('liuzhou-guide').hidden=activeRegion!=='china';
  syncCampusPin();
 }));
 el('campus-focus').addEventListener('click',()=>{
  activeRegion='china';syncCampusPin();
  if(map)map.flyTo({center:LRVTC_CAMPUS.lngLat,zoom:13,duration:700});
  if(campusMarker&&campusMarker.getPopup?.()&&!campusMarker.getPopup().isOpen?.())
   campusMarker.togglePopup();
 });
 el('theme-btn').addEventListener('click',()=>{
  const next=theme()==='dark'?'light':'dark';
  try{localStorage.setItem('railway-theme',next)}catch{}
  updateTheme();
  map.setStyle('https://tiles.openfreemap.org/styles/'+(next==='dark'?'dark':'positron'));
 });
 window.addEventListener('storage',e=>{
  if(e.key==='railway-language'&&locales.includes(e.newValue))setLanguage(e.newValue);
 });
}
if(typeof module==='object'&&module.exports)module.exports={nameExpression,isNameLayer,centers,copy,railVisibility,uiText,transportationSource,railVectorLayer,LRVTC_CAMPUS,campusText};
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
}
})();