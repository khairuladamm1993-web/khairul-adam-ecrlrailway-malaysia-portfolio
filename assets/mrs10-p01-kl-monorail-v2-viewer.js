/* MR-S10 KL Monorail V2 | no writes to shared shell. Source-only GIS points. */
(async function(){
'use strict';
const api=window.MRS10MonorailV2;
if(!api?.validate?.())return;
const el=id=>document.getElementById(id),state={lang:'ms',theme:'light',mode:'all',selected:null,source:null,map:null,popup:null};
const T={
 ms:{title:'KL Monorail · 11 stesen',intro:'KL Sentral → Titiwangsa · Laluan 8 · Pratonton terasing P01',all:'Semua',focus:'Fokus',reset:'Set semula',map:'Peta GIS · POI bersumber sahaja',legend:'Monorel KL · Hijau muda',list:'Susunan 11 stesen (skematik)',notice:'Garisan hijau pada senarai ialah susunan perkhidmatan, BUKAN geometri guideway/trek. Titik peta hanya daripada POI OSM yang mempunyai pengenalan Monorail. Nama stesen kekal dalam ejaan sumber asal.',wait:'Menyemak POI OSM awam…',none:'Tiada POI Monorail yang dapat disahkan. Susunan stesen kekal tersedia; tiada koordinat rekaan.',matched:'POI Monorail bersumber disahkan sebagai calon kartografi (bukan ukuran operasi)',failed:'Sumber GIS tidak dapat dicapai. Tiada pin/trek rekaan.',interchange:'Sambungan',source:'Buka sumber OSM',fallback:'Nama stesen: ejaan sumber asal',selected:'Stesen tiada POI bersumber; paparan skematik sahaja'},
 en:{title:'KL Monorail · 11 stations',intro:'KL Sentral → Titiwangsa · Line 8 · P01 isolated preview',all:'All',focus:'Focus',reset:'Reset',map:'GIS map · source-backed POIs only',legend:'KL Monorail · Light green',list:'11-stop schematic lineup',notice:'The green lineup is service order, NOT physical guideway/track geometry. GIS markers require monorail-tagged OSM POIs. Station names retain their verified source spelling.',wait:'Checking public OSM POIs…',none:'No Monorail POIs verified. Station list remains available; no invented coordinates.',matched:'Source-backed Monorail POIs: cartographic candidates, not operational survey',failed:'GIS source unavailable. No invented pins or tracks.',interchange:'Connection',source:'Open OSM evidence',fallback:'Station names: original source spelling',selected:'No sourced POI for this stop; schematic list only'},
 zh:{title:'吉隆坡单轨列车 · 11站',intro:'KL Sentral → Titiwangsa · 8号线 · P01独立预览',all:'全部',focus:'聚焦',reset:'重置',map:'GIS 地图 · 仅显示有来源的站点',legend:'吉隆坡单轨 · 浅绿色',list:'11站示意顺序',notice:'绿色站序仅代表客运停站顺序，并非实体轨道/导轨。地图点必须来自有单轨标签的 OSM 来源。车站名称保留原文。',wait:'正在查找 OSM 站点…',none:'尚未核实单轨车站 POI；保留站序且不编造坐标。',matched:'有来源的 OSM 站点（非运营测绘）',failed:'GIS 来源暂不可用；不生成虚假站点。',interchange:'换乘/步行连接',source:'查看 OSM 来源',fallback:'站名：采用原始来源名称',selected:'此站没有核实的 POI；仅显示示意站序'},
 th:{title:'โมโนเรลกัวลาลัมเปอร์ · 11 สถานี',intro:'KL Sentral → Titiwangsa · สาย 8 · พรีวิว P01 แยกอิสระ',all:'ทั้งหมด',focus:'โฟกัส',reset:'รีเซ็ต',map:'แผนที่ GIS · จุดสถานีมีแหล่งอ้างอิงเท่านั้น',legend:'KL Monorail · เขียวอ่อน',list:'ลำดับ 11 สถานี (แผนผัง)',notice:'เส้นสีเขียวในรายการแสดงลำดับบริการ ไม่ใช่แนวรางหรือ guideway จุดบนแผนที่ใช้เฉพาะ POI จาก OSM ที่ระบุ monorail ชื่อสถานีใช้รูปสะกดจากต้นฉบับ',wait:'กำลังตรวจสอบ OSM…',none:'ยังไม่พบ POI ที่ตรวจสอบได้ จะแสดงรายการสถานีโดยไม่สมมติพิกัด',matched:'จุด OSM ที่มีหลักฐาน ไม่ใช่พิกัดสำรวจจริง',failed:'แหล่ง GIS ไม่พร้อมใช้งาน ไม่สร้างพิกัดหรือรางเทียม',interchange:'จุดเชื่อมต่อ',source:'เปิดหลักฐาน OSM',fallback:'ชื่อสถานีจากต้นฉบับ',selected:'ไม่มี POI ที่ยืนยันได้สำหรับสถานีนี้'}
};
const label=()=>T[state.lang];
function setStatus(text){el('status').textContent=text;}
function texts(){
 document.documentElement.lang=state.lang;const t=label();
 for(const [id,key] of [['title','title'],['intro','intro'],['map-title','map'],['legend','legend'],['list-title','list'],['notice','notice'],['all','all'],['focus','focus'],['reset','reset']])el(id).textContent=t[key];
 if(state.source)status();else setStatus(t.wait);
 renderList();
 if(state.popup)state.popup.remove();
}
function status(){
 const s=state.source,t=label();
 setStatus(!s?t.wait:s.error?t.failed:s.matched?t.matched+': '+s.matched+'/11 · '+s.missing+' unmatched':t.none);
}
function renderList(){
 const list=el('list');list.replaceChildren();
 for(const s of api.stations){
  const b=document.createElement('button');b.type='button';b.className='stop'+(state.selected===s.code?' active':'');
  b.setAttribute('role','listitem');b.setAttribute('aria-pressed',String(state.selected===s.code));
  const n=document.createElement('span');n.className='number';n.textContent=s.code;
  const name=document.createElement('span');name.className='station';name.textContent=s.name;
  b.append(n,name);
  if(s.interchangeServices.length){const tag=document.createElement('span');tag.className='changes';tag.textContent=s.interchangeServices.join(' · ');b.append(tag);}
  b.addEventListener('click',()=>selectStation(s.code));list.append(b);
 }
}
function mode(next){state.mode=next;for(const id of ['all','focus'])el(id).setAttribute('aria-pressed',String(id===next));paintVisibility();}
function selectStation(code){
 state.selected=code;renderList();mode('focus');
 const s=state.source?.stations?.find(x=>x.code===code);
 if(!s){setStatus(label().selected);return;}
 state.map?.flyTo({center:s.coordinates,zoom:15.2,essential:true});
 if(state.map)popupFor(s);
}
function popupFor(s){
 const item=api.stations.find(x=>x.code===s.code),p=document.createElement('div');p.className='popup';
 const heading=document.createElement('strong');heading.textContent=s.code+' · '+s.name;p.append(heading);
 const note=document.createElement('p');note.textContent='KL Monorail · Line 8 · '+label().fallback;p.append(note);
 if(item?.interchangeServices?.length){const x=document.createElement('p');x.textContent=label().interchange+': '+item.interchangeServices.join(', ')+(item.interchangeType?.startsWith('PEDESTRIAN')?' (walk)':'');p.append(x);}
 const proof=document.createElement('p');proof.textContent='POI: '+s.osmType+'/'+s.osmId+' · public cartography, not physical guideway';p.append(proof);
 const a=document.createElement('a');a.href=s.osmUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label().source;p.append(a);
 if(state.popup)state.popup.remove();
 state.popup=new state.maplib.Popup({offset:18,maxWidth:'290px',closeOnMove:false}).setLngLat(s.coordinates).setDOMContent(p).addTo(state.map);
}
function visible(){const src=state.map?.getSource('mr-sourced-poi');if(!src)return;
 const raw=api.geoJSON(state.source);
 src.setData({type:'FeatureCollection',features:raw.features.filter(f=>state.mode!=='focus'||!state.selected||f.properties.code===state.selected)});
}
function paintVisibility(){visible();}
function paint(){
 const map=state.map;if(!map?.getStyle?.()?.sources)return;
 const geo=api.geoJSON(state.source);
 if(!map.getSource('mr-sourced-poi'))map.addSource('mr-sourced-poi',{type:'geojson',data:geo});
 else map.getSource('mr-sourced-poi').setData(geo);
 const halo=state.theme==='dark'?'#152534':'#FFFFFF';
 if(!map.getLayer('mr-poi-halo'))map.addLayer({id:'mr-poi-halo',type:'circle',source:'mr-sourced-poi',
  paint:{'circle-color':'#76B936','circle-radius':['interpolate',['linear'],['zoom'],10,6.2,13,8.5,16,11.5],
   'circle-stroke-color':halo,'circle-stroke-width':3,'circle-opacity':1}});
 if(!map.getLayer('mr-poi-label'))map.addLayer({id:'mr-poi-label',type:'symbol',source:'mr-sourced-poi',minzoom:11.2,
  layout:{'text-field':['concat',['get','code'],' · ',['get','name']],'text-size':['interpolate',['linear'],['zoom'],11,10,15,12],
   'text-font':['Noto Sans Regular'], 'text-variable-anchor':['top','bottom','left','right'],
   'text-radial-offset':1.25,'text-optional':true,'text-allow-overlap':false,
   'text-sort-key':['case',['==',['get','important'],1],0,10]},
  paint:{'text-color':state.theme==='dark'?'#B7F070':'#315F0C','text-halo-color':halo,'text-halo-width':2}});
 if(!map.getLayer('mr-poi-hit'))map.addLayer({id:'mr-poi-hit',type:'circle',source:'mr-sourced-poi',
  paint:{'circle-radius':18,'circle-color':'#76B936','circle-opacity':0}});
 paintVisibility();
}
function query(){
 const stations=api.stations.map(x=>x.name.replace(/[.*+?^$()|[\]{}]/g,'\\$&')).join('|');
 const bbox=api.bbox;
 return '[out:json][timeout:20];(nwr["name"~"^('+stations+')$",i]["railway"~"^(station|halt|monorail)$"]('+bbox.s+','+bbox.w+','+bbox.n+','+bbox.e+');nwr["name"~"^('+stations+')$",i]["public_transport"="station"]('+bbox.s+','+bbox.w+','+bbox.n+','+bbox.e+'););out center tags;';
}
async function source(){
 const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),22000);
 try{
  const endpoint='https://overpass.kumi.systems/api/interpreter';
  const r=await fetch(endpoint,{method:'POST',body:'data='+encodeURIComponent(query()),headers:{'Content-Type':'application/x-www-form-urlencoded'},mode:'cors',credentials:'omit',signal:ac.signal});
  if(!r.ok)throw Error('OSM_'+r.status);
  const json=await r.json();
  const data=api.sourceBacked(json?.elements);
  if(!data.ok)throw Error(data.reason);
  state.source=data;status();paint();
  if(data.matched){const p=data.stations.map(s=>s.coordinates);
   state.map.fitBounds([[Math.min(...p.map(x=>x[0])),Math.min(...p.map(x=>x[1]))],[Math.max(...p.map(x=>x[0])),Math.max(...p.map(x=>x[1]))]],{padding:55,maxZoom:13.3,duration:450});}
 }catch(err){state.source={error:String(err),stations:[],matched:0,missing:11};status();paint();}
 finally{clearTimeout(timeout);}
}
function changeStyle(){if(state.map)state.map.setStyle('https://tiles.openfreemap.org/styles/'+(state.theme==='dark'?'dark':'positron'));}
el('lang').addEventListener('change',e=>{if(T[e.target.value]){state.lang=e.target.value;texts();}});
el('theme').addEventListener('click',()=>{state.theme=state.theme==='light'?'dark':'light';document.documentElement.dataset.theme=state.theme;el('theme').textContent=state.theme==='dark'?'☀':'☾';changeStyle();});
el('all').addEventListener('click',()=>{state.selected=null;renderList();mode('all');status();});
el('focus').addEventListener('click',()=>{if(!state.selected)state.selected='MR1';renderList();mode('focus');status();});
el('reset').addEventListener('click',()=>{state.selected=null;renderList();mode('all');status();state.map?.flyTo({center:[101.699,3.158],zoom:12.3,essential:true});});
texts();
try{
 const lib=await import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs');state.maplib=lib;
 state.map=new lib.Map({container:'mr-map',style:'https://tiles.openfreemap.org/styles/positron',
  center:[101.699,3.158],zoom:12.3,minZoom:9,pitchWithRotate:false,dragRotate:false,touchPitch:false});
 state.map.addControl(new lib.NavigationControl({showCompass:false}),'top-left');
 state.map.on('style.load',paint);
 state.map.on('click',e=>{
  if(!state.map.getLayer('mr-poi-hit'))return;
  const {x,y}=e.point,hits=state.map.queryRenderedFeatures([[x-18,y-18],[x+18,y+18]],{layers:['mr-poi-hit']});
  const item=state.source?.stations?.find(s=>s.code===hits?.[0]?.properties?.code);
  if(item){state.selected=item.code;renderList();popupFor(item);}
 });
 await source();
}catch{state.source={error:'MAPLIBRE_UNAVAILABLE',stations:[],matched:0,missing:11};status();}
})();
