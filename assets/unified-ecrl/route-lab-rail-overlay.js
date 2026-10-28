/* MR-S10 P01 Railway Alignment Lab R1.2 — visible OSM-derived railway context.
   Raster tiles are a third-party MAP VISUALIZATION, never source geometry for
   CH calibration, survey claims, simulated train snapping or track operations.
   OpenRailwayMap standard tiles: CC BY-SA 2.0 style, OSM data ODbL. */
(function(root){'use strict';
const SOURCE='mrs10-lab-openrailwaymap-standard-raster',LAYER=SOURCE+'-layer';
const TILE='https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png';
const KERTEH=[103.435,4.56],MALAYSIA_ECRL_BOUNDS=[[101.16,2.78],[104.02,6.30]];
const TRANSLATIONS={
 ms:{rail:'Papar jajaran rel OpenRailwayMap',focus:'Fokus Kerteh',all:'Paparan koridor',warning:'Jalur berwarna ialah rujukan OSM/OpenRailwayMap, BUKAN geometri ECRL yang disahkan. Zoom ≥9 untuk melihat rel dalam pembinaan.',on:'Rujukan rel diaktifkan',off:'Rujukan rel dimatikan',fallback:'Cuba zum masuk jika garisan belum kelihatan.'},
 en:{rail:'Show OpenRailwayMap railway tracks',focus:'Focus Kerteh',all:'Corridor overview',warning:'Colored lines are OSM/OpenRailwayMap reference, NOT surveyed ECRL track. Zoom ≥9 for construction railway detail.',on:'Railway reference enabled',off:'Railway reference disabled',fallback:'Zoom in if the railway lines are not visible.'},
 zh:{rail:'显示 OpenRailwayMap 铁路线',focus:'聚焦 Kerteh',all:'走廊概览',warning:'彩色线条仅供 OSM/OpenRailwayMap 参考，并非已测绘的 ECRL 轨道。放大至 ≥9 级查看施工铁路。',on:'铁路参考已开启',off:'铁路参考已关闭',fallback:'如未显示铁路，请放大地图。'},
 th:{rail:'แสดงแนวรถไฟ OpenRailwayMap',focus:'ดู Kerteh',all:'ภาพรวมแนวเส้นทาง',warning:'เส้นสีเป็นข้อมูลอ้างอิง OSM/OpenRailwayMap ไม่ใช่ทางรถไฟ ECRL ที่สำรวจยืนยันแล้ว ซูม ≥9 เพื่อดูรางที่กำลังก่อสร้าง',on:'เปิดข้อมูลรางอ้างอิง',off:'ปิดข้อมูลรางอ้างอิง',fallback:'ขยายแผนที่หากยังไม่เห็นทางรถไฟ'}
};
let on=true,locale='ms',installed=false,map=null,installAttempts=0,tileStatus='NOT_INITIALIZED',lastError=null;
function available(){return !!(map&&map.getStyle&&map.getStyle())}
function install(m){
 map=m;installAttempts++;
 if(!available()){tileStatus='WAITING_FOR_STYLE';update();return false;}
 try{
  if(!map.getSource(SOURCE))map.addSource(SOURCE,{
   type:'raster',tiles:[TILE],tileSize:256,minzoom:0,maxzoom:19,
   attribution:'Railway data <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors (ODbL)</a> · Style <a href="https://www.openrailwaymap.org/" target="_blank" rel="noopener noreferrer">OpenRailwayMap (CC BY-SA 2.0)</a>'
  });
  if(!map.getLayer(LAYER))map.addLayer({id:LAYER,type:'raster',source:SOURCE,
     layout:{visibility:on?'visible':'none'},
     paint:{'raster-opacity':0.95,'raster-fade-duration':0}});
  else map.setLayoutProperty(LAYER,'visibility',on?'visible':'none');
  installed=!!map.getLayer(LAYER);
  if(installed&&tileStatus!=='SOURCE_FINISHED_CHECK_VISUAL'&&tileStatus!=='SOURCE_ERROR')
   tileStatus='LAYER_REGISTERED_TILES_PENDING';
  update();return installed;
 }catch(err){
  lastError=String(err?.message||err).slice(0,160);
  tileStatus='INSTALL_ERROR';
  update();return false;
 }
}
function toggle(value){on=Boolean(value);if(!installed&&available())install(map);
 if(available()&&map.getLayer(LAYER))map.setLayoutProperty(LAYER,'visibility',on?'visible':'none');
 update();}
function focus(){if(map)map.easeTo({center:KERTEH,zoom:10.3,duration:500})}
function corridor(){if(map)map.fitBounds(MALAYSIA_ECRL_BOUNDS,{padding:24,duration:500,maxZoom:7})}
function setLocale(next){locale=TRANSLATIONS[next]?next:'ms';update()}
const STATUS={
 ms:{waiting:'Menunggu peta',ready:'Overlay didaftarkan · tile belum disahkan',loaded:'Data tile diproses · semak garisan secara visual',error:'Tile rel gagal dimuat · semak rangkaian/akses pelayan',hidden:'Rujukan rel dimatikan'},
 en:{waiting:'Waiting for map',ready:'Overlay registered · tile not verified',loaded:'Tile data processed · visually check tracks',error:'Railway tiles failed · check network/provider access',hidden:'Rail reference disabled'},
 zh:{waiting:'等待地图',ready:'图层已注册 · 瓦片未验证',loaded:'瓦片数据已处理 · 请目视检查',error:'铁路瓦片加载失败 · 检查连接',hidden:'铁路参考已关闭'},
 th:{waiting:'กำลังรอแผนที่',ready:'ลงทะเบียนชั้นข้อมูลแล้ว · ยังไม่ยืนยันไทล์',loaded:'ประมวลผลข้อมูลไทล์แล้ว · โปรดตรวจสอบเส้นราง',error:'โหลดไทล์รถไฟไม่สำเร็จ · ตรวจสอบเครือข่าย',hidden:'ปิดข้อมูลอ้างอิงทางรถไฟ'}
};
function update(){
 const t=TRANSLATIONS[locale],ck=document.getElementById('lab-orm-toggle'),
 label=document.getElementById('lab-orm-toggle-label'),f=document.getElementById('lab-focus-kerteh'),all=document.getElementById('lab-fit-corridor'),note=document.getElementById('lab-orm-note'),state=document.getElementById('lab-orm-status');
 if(ck)ck.checked=on;
 if(label)label.textContent=t.rail;
 if(f)f.textContent=t.focus;
 if(all)all.textContent=t.all;
 if(note)note.textContent=t.warning;
 if(state){const st=STATUS[locale];state.textContent= !on?st.hidden:tileStatus==='SOURCE_ERROR'||tileStatus==='INSTALL_ERROR'?st.error:tileStatus==='SOURCE_FINISHED_CHECK_VISUAL'?st.loaded:installed?st.ready:st.waiting;
  const zoom=map?.getZoom?.();
  if(on&&Number.isFinite(zoom)&&zoom<9&&tileStatus!=='SOURCE_ERROR'&&tileStatus!=='INSTALL_ERROR'){
   const hint={ms:' · Paparan koridor; tekan Fokus Kerteh untuk melihat rel (zum ≥9).',
    en:' · Corridor view; choose Focus Kerteh for railway detail (zoom ≥9).',
    zh:' · 走廊总览；选择 Kerteh 聚焦以查看铁路（缩放 ≥9）。',
    th:' · ภาพรวมแนวเส้นทาง; กดดู Kerteh เพื่อดูราง (ซูม ≥9)'};
   state.textContent+=hint[locale];
  }
  if(lastError&&on)state.title=lastError;
  state.dataset.tileStatus=tileStatus;
 }
}
function connect(m){
 map=m;const ck=document.getElementById('lab-orm-toggle'),f=document.getElementById('lab-focus-kerteh'),all=document.getElementById('lab-fit-corridor');
 if(ck)ck.addEventListener('change',()=>toggle(ck.checked));
 if(f)f.addEventListener('click',focus);
 if(all)all.addEventListener('click',corridor);
 const retry=()=>{if(!map.getLayer(LAYER))install(m);else if(!installed){installed=true;update()}};
 // Crucial WebKit/MapLibre issue: style.load can precede isStyleLoaded()=true.
 // Reattempt on load and styledata, without asserting tiles are downloadable.
 m.on('style.load',retry);m.on('load',retry);m.on('styledata',retry);
 m.on('sourcedata',e=>{if(e?.sourceId===SOURCE&&e.isSourceLoaded){tileStatus='SOURCE_FINISHED_CHECK_VISUAL';update()}});
 m.on('error',e=>{if(e?.sourceId===SOURCE||/openrailwaymap/i.test(String(e?.error?.message||e?.message||''))){
  tileStatus='SOURCE_ERROR';lastError=String(e?.error?.message||e?.message||'tile error').slice(0,160);update();
 }});
 m.on('zoomend',update);
 retry();update();
}
const api=Object.freeze({connect,install,toggle,focus,corridor,setLocale,
 snapshot:()=>({sourceId:SOURCE,layerId:LAYER,visible:on,installed:!!(map?.getLayer?.(LAYER)),tileStatus,lastError,installAttempts,zoom:map?.getZoom?.()??null,tileTemplate:TILE,classification:'OSM_RASTER_VISUAL_REFERENCE_ONLY',asBuiltVerified:false,trainGeometryAvailable:false})});
root.MRS10ECRLRailOverlay=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
