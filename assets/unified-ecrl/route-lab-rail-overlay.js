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
let on=true,locale='ms',installed=false,map=null;
function available(){return !!(map&&map.isStyleLoaded&&map.isStyleLoaded())}
function install(m){
 map=m;
 if(!available())return false;
 if(!map.getSource(SOURCE))map.addSource(SOURCE,{
   type:'raster',tiles:[TILE],tileSize:256,minzoom:0,maxzoom:19,
   attribution:'Railway data <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors (ODbL)</a> · Style <a href="https://www.openrailwaymap.org/" target="_blank" rel="noopener noreferrer">OpenRailwayMap (CC BY-SA 2.0)</a>'
 });
 if(!map.getLayer(LAYER))map.addLayer({id:LAYER,type:'raster',source:SOURCE,
    layout:{visibility:on?'visible':'none'},
    paint:{'raster-opacity':0.95,'raster-fade-duration':0}});
 else map.setLayoutProperty(LAYER,'visibility',on?'visible':'none');
 installed=true;update();
 return true;
}
function toggle(value){on=Boolean(value);if(available()&&map.getLayer(LAYER))map.setLayoutProperty(LAYER,'visibility',on?'visible':'none');update()}
function focus(){if(map)map.easeTo({center:KERTEH,zoom:10.3,duration:500})}
function corridor(){if(map)map.fitBounds(MALAYSIA_ECRL_BOUNDS,{padding:24,duration:500,maxZoom:7})}
function setLocale(next){locale=TRANSLATIONS[next]?next:'ms';update()}
function update(){
 const t=TRANSLATIONS[locale],ck=document.getElementById('lab-orm-toggle'),
 label=document.getElementById('lab-orm-toggle-label'),f=document.getElementById('lab-focus-kerteh'),all=document.getElementById('lab-fit-corridor'),note=document.getElementById('lab-orm-note'),state=document.getElementById('lab-orm-status');
 if(ck)ck.checked=on;
 if(label)label.textContent=t.rail;
 if(f)f.textContent=t.focus;
 if(all)all.textContent=t.all;
 if(note)note.textContent=t.warning;
 if(state)state.textContent=(on?t.on:t.off)+' · '+t.fallback;
}
function connect(m){
 map=m;const ck=document.getElementById('lab-orm-toggle'),f=document.getElementById('lab-focus-kerteh'),all=document.getElementById('lab-fit-corridor');
 if(ck)ck.addEventListener('change',()=>toggle(ck.checked));
 if(f)f.addEventListener('click',focus);
 if(all)all.addEventListener('click',corridor);
 m.on('style.load',()=>install(m));m.on('zoomend',update);
 if(m.isStyleLoaded())install(m);
 update();
}
const api=Object.freeze({connect,install,toggle,focus,corridor,setLocale,
 snapshot:()=>({sourceId:SOURCE,layerId:LAYER,visible:on,installed:!!(map?.getLayer?.(LAYER)),tileTemplate:TILE,classification:'OSM_RASTER_VISUAL_REFERENCE_ONLY',asBuiltVerified:false,trainGeometryAvailable:false})});
root.MRS10ECRLRailOverlay=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
