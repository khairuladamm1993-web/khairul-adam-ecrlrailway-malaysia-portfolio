/* STN markers are public LOCALITY REFERENCES, not surveyed station points.
 * Marker layer and station details are P01 training aids, not track coordinates. */
(function(root){'use strict';
const POINTS='mrs10-lab-stations-locality',MARKER='mrs10-lab-station-circles',LABEL='mrs10-lab-station-labels';
const rows=(root.MRS10ECRLChainage?.records||[]).filter(x=>x.code.startsWith('STN'));
const intel=root.MRS10ECRLStationIntelligence;
const stations=rows.map(x=>intel?.getStation(x.code)).filter(x=>x&&Array.isArray(x.referencePoint));
const geo={type:'FeatureCollection',features:stations.map(s=>({type:'Feature',properties:{code:s.code,name:s.displayName,CH:s.CH,confidence:'LOCALITY_REFERENCE_NOT_SURVEYED'},geometry:{type:'Point',coordinates:s.referencePoint}}))};
let map=null,selected='STN01',installed=false,locale='ms',handlerBound=false;
const T={
 ms:{title:'Station Intelligence · Rujukan ECRL',confidence:'Lokasi rujukan kawasan · BUKAN koordinat tepat stesen',section:'Seksyen',service:'Perkhidmatan',operation:'Status aset',source:'Sumber',gauge:'Gauge projek',formation:'Formasi projek',track:'Susun atur trek',platform:'Bilangan platform',turnout:'Turnout',elevation:'Elevasi',reference:'Status geometri',unknown:'BELUM DISAHKAN',empty:'Tiada titik survei stesen dalam data awam',focus:'Fokus stesen'},
 en:{title:'Station Intelligence · ECRL Reference',confidence:'Locality reference · NOT exact station coordinates',section:'Section',service:'Service',operation:'Asset status',source:'Source',gauge:'Project gauge',formation:'Project formation',track:'Track layout',platform:'Platform count',turnout:'Turnouts',elevation:'Elevation',reference:'Geometry status',unknown:'UNVERIFIED',empty:'No public surveyed station position available',focus:'Focus station'},
 zh:{title:'ECRL 车站信息 · 参考',confidence:'区域参考点 · 并非精确站址',section:'区段',service:'服务',operation:'资产状态',source:'来源',gauge:'项目轨距',formation:'项目路基',track:'轨道布局',platform:'站台数量',turnout:'道岔',elevation:'高程',reference:'几何状态',unknown:'尚未核实',empty:'无公开测绘的站址',focus:'聚焦车站'},
 th:{title:'ข้อมูลสถานี ECRL · อ้างอิง',confidence:'จุดอ้างอิงพื้นที่ · ไม่ใช่พิกัดสถานีจริง',section:'ช่วง',service:'บริการ',operation:'สถานะทรัพย์สิน',source:'แหล่งข้อมูล',gauge:'ขนาดรางโครงการ',formation:'รูปแบบทาง',track:'ผังทาง',platform:'จำนวนชานชาลา',turnout:'ประแจ',elevation:'ระดับ',reference:'สถานะเรขาคณิต',unknown:'ยังไม่ยืนยัน',empty:'ไม่มีพิกัดสถานีที่สำรวจแล้ว',focus:'ดูสถานี'}
};
function install(m){
 map=m;if(!m?.getStyle?.())return false;
 try{
 if(!m.getSource(POINTS))m.addSource(POINTS,{type:'geojson',data:geo});
 if(!m.getLayer(MARKER))m.addLayer({id:MARKER,type:'circle',source:POINTS,paint:{'circle-radius':['interpolate',['linear'],['zoom'],5,6,10,9,13,11],'circle-color':'#f5ffff','circle-stroke-color':'#008e97','circle-stroke-width':3,'circle-opacity':0.97}});
 if(!m.getLayer(LABEL))m.addLayer({id:LABEL,type:'symbol',source:POINTS,minzoom:7,layout:{'text-field':['get','code'],'text-size':11,'text-offset':[0,-2.1],'text-allow-overlap':false},paint:{'text-color':'#083740','text-halo-color':'#ffffff','text-halo-width':2}});
 if(!handlerBound){m.on('click',MARKER,e=>{const code=e.features?.[0]?.properties?.code;if(code)select(code,false)});
  m.on('mouseenter',MARKER,()=>{m.getCanvas().style.cursor='pointer'});
  m.on('mouseleave',MARKER,()=>{m.getCanvas().style.cursor=''});
  handlerBound=true;
 }
 installed=true;return true;
 }catch(e){installed=false;return false}
}
function focus(code,zoom=11){const s=intel.getStation(code);if(s?.referencePoint&&map)map.flyTo({center:s.referencePoint,zoom,duration:400})}
function select(code,fly=false){const s=intel.getStation(code);if(!s)return false;selected=code;render();if(fly)focus(code);return true}
function setLocale(lang){locale=T[lang]?lang:'ms';render()}
function render(){
 const host=document.getElementById('lab-station-intelligence');if(!host)return;
 const s=intel.getStation(selected),t=T[locale];if(!s)return;
 host.replaceChildren();
 const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined&&value!==null)n.textContent=String(value);if(cls)n.className=cls;return n};
 host.append(el('h2',t.title),el('h3',s.code+' · '+s.displayName+' · '+s.CHLabel));
 host.append(el('p',t.confidence,'lab-warning'));
 const grid=el('dl',null,'lab-station-grid');
 for(const [label,value] of [
  [t.section,s.section],[t.service,s.services],[t.operation,s.assetStatus],
  [t.gauge,s.trackGaugeMm==null?t.unknown:s.trackGaugeMm.toLocaleString('en-US')+' mm · project spec'],
  [t.formation,s.trackFormation],[t.track,s.verifiedTrackLayout||t.unknown],
  [t.platform,s.verifiedPlatformCount??t.unknown],
  [t.turnout,s.verifiedTurnouts??t.unknown],[t.elevation,s.verifiedElevation??t.unknown],
  [t.reference,s.referenceKind]
 ]){grid.append(el('dt',label),el('dd',value))}
 host.append(grid);
 const src=el('details');src.append(el('summary',t.source+' · '+s.sourceIds.join(' / ')));
 for(const link of s.sourceLinks){const a=el('a',link);a.href=link;a.rel='noopener noreferrer';a.target='_blank';src.append(a)}
 host.append(src);
 const controls=el('div',null,'lab-row'),button=el('button',t.focus+' '+s.code);
 button.type='button';button.onclick=()=>focus(s.code);controls.append(button);host.append(controls);
}
function connect(m){map=m;const retry=()=>install(m);m.on('style.load',retry);m.on('load',retry);m.on('styledata',retry);retry();render()}
const api=Object.freeze({connect,select,focus,setLocale,snapshot:()=>({selected,stationCount:stations.length,plCount:root.MRS10ECRLChainage?.records?.filter(x=>x.code.startsWith('PL')).length||0,installed,geometryVerified:false,referenceOnly:true,stn01:intel?.getStation('STN01')})});
root.MRS10ECRLStationMap=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
