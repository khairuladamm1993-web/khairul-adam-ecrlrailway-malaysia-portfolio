/* MR-S10 P01 Sri Petaling V2 — independent MapLibre visitor renderer.
 * No physical track line is rendered without independently verified way geometry.
 * No modification to Ampang R2.19 or the shared map shell.
 */
(async function(){
'use strict';
const api=window.MRS10SriPetalingV2,gis=window.MRS10SriPetalingGISV2;
if(!api?.validate?.()||!gis)throw new Error('SPL_CATALOGUE_UNAVAILABLE');
const el=id=>document.getElementById(id);
const words={
 ms:{title:'LRT Sri Petaling · 29 stesen',desc:'Sentul Timur → Putra Heights. 11 stesen dikongsi bersama Ampang.',
 themeDark:'Mod Gelap',themeLight:'Mod Cerah',focus:'Fokus',all:'Semua',reset:'Reset',
 category:'Sri Petaling',legend:'Petunjuk',line:'Sri Petaling (skema)',shared:'Stesen bersama Ampang',
 lineup:'Lineup stesen ke stesen',schematic:'Sambungan menegak ini skematik, bukan jajaran geografi trek.',
 detail:'Maklumat stesen',source:'Sumber & had ketepatan',disclaimer:'Titik ialah calon berasaskan GIS awam, bukan data operasi. Geometri landasan belum disahkan.',
 select:'Tekan stesen pada peta atau lineup.',matched:'stesen mempunyai titik padanan GIS awam',
 missing:'tanpa titik yang disahkan',noSource:'GIS tidak tersedia: hanya lineup skematik dipaparkan.',
 pending:'Memuatkan calon stesen daripada GIS awam…',services:'Perkhidmatan',connections:'Sambungan penumpang',
 sharedText:'Stesen bersama Ampang dan Sri Petaling',poi:'Koordinat calon daripada GIS awam',noPoi:'Lokasi GIS belum dipadankan',
 notRail:'Bukan pengesahan jajaran landasan atau bilangan trek',footer:'Rujukan kereta api awam · BUKAN geometri operasi/ukur · Production tidak diubah.'},
 en:{title:'LRT Sri Petaling · 29 stations',desc:'Sentul Timur → Putra Heights. 11 stations also serve Ampang.',
 themeDark:'Dark Mode',themeLight:'Light Mode',focus:'Focus',all:'All',reset:'Reset',
 category:'Sri Petaling',legend:'Legend',line:'Sri Petaling (schematic)',shared:'Shared with Ampang',
 lineup:'Station-to-station lineup',schematic:'The vertical connector is a schematic, NOT geographic railway alignment.',
 detail:'Station information',source:'Sources & limitations',disclaimer:'Points are public GIS candidates, not operating data. Physical track geometry unverified.',
 select:'Tap a station on the map or lineup.',matched:'stations matched public GIS POIs',
 missing:'without confirmed points',noSource:'GIS unavailable; schematic lineup only.',
 pending:'Loading sourced GIS station candidates…',services:'Services',connections:'Passenger connections',
 sharedText:'Both Ampang and Sri Petaling services',poi:'Candidate position from public GIS',noPoi:'GIS location not matched',
 notRail:'Does not verify track alignment or track count',footer:'Public railway reference · NOT operational/survey geometry · Production unchanged.'},
 zh:{title:'大城堡轻快铁线 · 29 站',desc:'冼都东站 → 布特拉高原站；其中 11 站与安邦线共用。',
 themeDark:'深色模式',themeLight:'浅色模式',focus:'聚焦',all:'全部',reset:'重置',
 category:'大城堡线',legend:'图例',line:'大城堡线（示意）',shared:'与安邦线共用',
 lineup:'车站顺序',schematic:'垂直连线仅为示意，并非地理轨道走向。',
 detail:'车站信息',source:'资料来源与限制',disclaimer:'站点位置来自公共 GIS 候选数据，非运营坐标；实体轨道尚未核实。',
 select:'点击地图或列表中的车站。',matched:'个站点与公共 GIS 数据匹配',
 missing:'个站点缺少核实坐标',noSource:'GIS 暂不可用；仅显示示意站点列表。',
 pending:'正在获取公共 GIS 数据…',services:'服务线路',connections:'乘客换乘',
 sharedText:'安邦线与大城堡线共用车站',poi:'公共 GIS 候选坐标',noPoi:'GIS 位置尚未匹配',
 notRail:'不代表轨道走向或轨道数量已验证',footer:'仅供公共参考 · 非运营测绘坐标 · 生产环境未更改。'},
 th:{title:'LRT สายศรีเปตาลิง · 29 สถานี',desc:'Sentul Timur → Putra Heights · มี 11 สถานีร่วมกับสาย Ampang',
 themeDark:'โหมดมืด',themeLight:'โหมดสว่าง',focus:'โฟกัส',all:'ทั้งหมด',reset:'รีเซ็ต',
 category:'Sri Petaling',legend:'คำอธิบาย',line:'Sri Petaling (ผัง)',shared:'สถานีร่วม Ampang',
 lineup:'ลำดับสถานี',schematic:'เส้นแนวตั้งเป็นผังประกอบ ไม่ใช่แนวรางทางภูมิศาสตร์',
 detail:'ข้อมูลสถานี',source:'แหล่งข้อมูลและข้อจำกัด',disclaimer:'จุดสถานีเป็นข้อมูลอ้างอิง GIS สาธารณะ ไม่ใช่พิกัดเดินรถ',
 select:'แตะสถานีบนแผนที่หรือรายการ',matched:'สถานีที่ตรงกับ GIS สาธารณะ',
 missing:'สถานีไม่มีพิกัดยืนยัน',noSource:'ไม่สามารถโหลด GIS ได้ แสดงรายการสถานีแบบผัง',
 pending:'กำลังโหลดข้อมูล GIS สาธารณะ…',services:'เส้นทางบริการ',connections:'การเชื่อมต่อผู้โดยสาร',
 sharedText:'ใช้ร่วมกันระหว่าง Ampang และ Sri Petaling',poi:'ตำแหน่งอ้างอิงจาก GIS สาธารณะ',noPoi:'ยังไม่จับคู่พิกัด GIS',
 notRail:'ไม่ยืนยันแนวรางหรือจำนวนราง',footer:'อ้างอิงสาธารณะ · ไม่ใช่พิกัดการปฏิบัติงาน · ไม่แก้ Production'}
};
const initial={center:[101.653,3.099],zoom:11.2};
let lang='ms',dark=false,map=null,lib=null,loaded=null,selected=null,showCategory=true,fullscreen=false,popup=null;
function w(k){return(words[lang]||words.ms)[k]}
function txt(parent,tag,string,klass){
 const n=document.createElement(tag);n.textContent=String(string);if(klass)n.className=klass;parent.append(n);return n;
}
function setStatus(message){el('status').textContent=message}
function labelColor(){return dark?api.color.dark:api.color.light}
function updateLabels(){
 document.documentElement.lang=lang;document.documentElement.dataset.theme=dark?'dark':'light';
 for(const id of ['title','description','theme-label','focus','all','reset','category','legend-label','legend-spline','legend-shared','lineup-heading','lineup-desc','detail-heading','source-heading','disclaimer','footer']){
  const k={title:'title',description:'desc','theme-label':dark?'themeLight':'themeDark',focus:'focus',all:'all',reset:'reset',category:'category','legend-label':'legend','legend-spline':'line','legend-shared':'shared','lineup-heading':'lineup','lineup-desc':'schematic','detail-heading':'detail','source-heading':'source',disclaimer:'disclaimer',footer:'footer'}[id];
  const node=el(id);if(node)node.textContent=w(k);
 }
 el('category').textContent='● '+w('category');
 el('theme').setAttribute('aria-pressed',String(dark));
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 if(loaded){setStatus(loaded.matched+'/29 '+w('matched')+' · '+loaded.missing+' '+w('missing'))}
 renderLineup();renderDetails();
}
function renderLineup(){
 const ol=el('lineup');ol.replaceChildren();
 for(const s of api.stations){
  const li=document.createElement('li');li.dataset.shared=String(s.sharedService);
  const b=document.createElement('button');b.type='button';
  b.setAttribute('aria-label',s.serviceCode+' '+s.name+(s.pairedAmpangCode?' '+s.pairedAmpangCode:''));
  txt(b,'span',s.serviceCode,'num');
  const name=document.createElement('span');name.className='sname';txt(name,'span',s.name);
  txt(name,'small',s.serviceCode+(s.pairedAmpangCode?' · '+s.pairedAmpangCode:''),'scode');
  b.append(name);
  if(s.sharedService)txt(b,'span','AG','shared');
  b.addEventListener('click',()=>choose(s.id,true));
  li.append(b);ol.append(li);
 }
}
function renderDetails(){
 const host=el('detail');host.replaceChildren();
 const s=api.stations.find(x=>x.id===selected);
 if(!s){txt(host,'p',w('select'));return}
 txt(host,'h2',s.serviceCode+' · '+s.name);
 txt(host,'p',w('services')+': '+(s.sharedService?'Sri Petaling + Ampang':'Sri Petaling'));
 if(s.pairedAmpangCode)txt(host,'p',w('sharedText')+' · '+s.pairedAmpangCode);
 if(s.connectionServiceIds.length)txt(host,'p',w('connections')+': '+s.connectionServiceIds.join(', '));
 const point=loaded?.data.find(p=>p.stationId===s.id);
 txt(host,'p',point?w('poi')+': '+point.coordinates.join(', '):w('noPoi'));
 txt(host,'p',w('notRail'));
 const a=document.createElement('a');a.href=point?gis.sourceUrl:api.sources.operatorMap;
 a.rel='noopener noreferrer';a.target='_blank';a.textContent=w('source');host.append(a);
}
function featureCollection(){return gis.geojson(loaded)}
function addLayers(){
 if(!map?.getStyle?.()?.sources)return;
 const source='mrs10-spl-v2-source',halo='mrs10-spl-v2-halo',
 dots='mrs10-spl-v2-dots',labels='mrs10-spl-v2-labels';
 if(!map.getSource(source))map.addSource(source,{type:'geojson',data:featureCollection()});
 else map.getSource(source).setData(featureCollection());
 if(!map.getLayer(halo))map.addLayer({id:halo,type:'circle',source,
  paint:{'circle-radius':['interpolate',['linear'],['zoom'],9,9,12,12,15,15],
    'circle-color':dark?'#0f2230':'#ffffff','circle-opacity':0.96}});
 if(!map.getLayer(dots))map.addLayer({id:dots,type:'circle',source,
  paint:{'circle-radius':['interpolate',['linear'],['zoom'],9,6.5,12,9.5,15,12],
   'circle-color':labelColor(),'circle-stroke-color':['case',['get','sharedService'],dark?'#FFBB7B':'#A65100',dark?'#f4faff':'#fff'],
   'circle-stroke-width':['case',['get','sharedService'],3,2]}});
 if(!map.getLayer(labels))map.addLayer({id:labels,type:'symbol',source,minzoom:10,
  layout:{'text-field':['get','code'],'text-size':['interpolate',['linear'],['zoom'],10,11,14,13],
   'text-offset':[0,1.65],'text-allow-overlap':false},
  paint:{'text-color':labelColor(),'text-halo-color':dark?'#0f2230':'#fff','text-halo-width':2}});
 for(const id of [halo,dots,labels])map.setLayoutProperty(id,'visibility',showCategory?'visible':'none');
}
function fitPoints(points,padding=45){
 if(!map||!points.length)return;
 const lons=points.map(p=>p.coordinates[0]),lats=points.map(p=>p.coordinates[1]);
 map.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]],
  {padding,maxZoom:13.5,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:350});
}
function choose(id,fly){
 const s=api.stations.find(x=>x.id===id);if(!s)return;
 selected=id;renderDetails();
 const p=loaded?.data.find(d=>d.stationId===id);
 if(!p||!map||!fly)return;
 map.flyTo({center:p.coordinates,zoom:Math.max(12.9,map.getZoom()),duration:350});
 if(popup)popup.remove();
 const box=document.createElement('div');box.className='popup';
 txt(box,'strong',s.serviceCode+' · '+s.name);
 if(s.pairedAmpangCode)txt(box,'p','Sri Petaling + Ampang · '+s.pairedAmpangCode);
 txt(box,'p',w('poi'));txt(box,'p',w('notRail'));
 popup=new lib.Popup({offset:16,maxWidth:'310px'}).setLngLat(p.coordinates).setDOMContent(box).addTo(map);
}
function toggleTheme(){
 dark=!dark;updateLabels();
 if(map){map.setStyle('https://tiles.openfreemap.org/styles/'+(dark?'dark':'positron'))}
}
el('theme').addEventListener('click',toggleTheme);
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;updateLabels()}));
el('focus').addEventListener('click',()=>{showCategory=true;el('category').setAttribute('aria-pressed','true');addLayers();
 if(selected){const p=loaded?.data.find(s=>s.stationId===selected);if(p){map?.flyTo({center:p.coordinates,zoom:13.8});return}}
 if(loaded?.data.length)fitPoints(loaded.data,35)});
el('all').addEventListener('click',()=>{showCategory=true;el('category').setAttribute('aria-pressed','true');addLayers();
 if(loaded?.data.length)fitPoints(loaded.data,50)});
el('reset').addEventListener('click',()=>{selected=null;showCategory=true;el('category').setAttribute('aria-pressed','true');
 renderDetails();addLayers();if(popup){popup.remove();popup=null}map?.flyTo({...initial,duration:350})});
el('category').addEventListener('click',()=>{showCategory=!showCategory;el('category').setAttribute('aria-pressed',String(showCategory));addLayers()});
el('expand').addEventListener('click',()=>{
 fullscreen=!fullscreen;el('map-shell').classList.toggle('expanded',fullscreen);
 el('expand').setAttribute('aria-expanded',String(fullscreen));el('expand').textContent=fullscreen?'×':'⛶';
 document.documentElement.style.overflow=fullscreen?'hidden':'';map?.resize();
});
updateLabels();setStatus(w('pending'));
async function requestPoints(){
 try{
  const response=await fetch(gis.queryUrl,{credentials:'omit',mode:'cors',cache:'no-store'});
  if(!response.ok)throw new Error('HTTP_'+response.status);
  const result=await response.json();
  if(result.error||!Array.isArray(result.features))throw new Error('INVALID_GIS_DATA');
  const out=gis.decode(result.features,api);
  if(!out.ok)throw new Error(out.reason);
  loaded=out;setStatus(out.matched+'/29 '+w('matched')+' · '+out.missing+' '+w('missing'));
  addLayers();renderDetails();
  if(out.data.length)fitPoints(out.data);
 }catch(e){
  loaded=null;setStatus(w('noSource'));
  addLayers();
 }
}
try{
 lib=await import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs');
 map=new lib.Map({container:'map',style:'https://tiles.openfreemap.org/styles/positron',center:initial.center,zoom:initial.zoom,
  dragRotate:false,pitchWithRotate:false,touchPitch:false,attributionControl:true});
 map.addControl(new lib.NavigationControl({showCompass:false}),'top-left');
 map.on('style.load',addLayers);
 map.on('click',e=>{
  if(!showCategory||!map.getLayer('mrs10-spl-v2-dots'))return;
  const p=e.point,rect=[[p.x-14,p.y-14],[p.x+14,p.y+14]];
  let hits=[];try{hits=map.queryRenderedFeatures(rect,{layers:['mrs10-spl-v2-dots']})||[]}catch{}
  if(hits.length)choose(hits[0].properties.stationId,true);
 });
}catch(e){setStatus(w('noSource')+' · MapLibre unavailable')}
await requestPoints();
})();