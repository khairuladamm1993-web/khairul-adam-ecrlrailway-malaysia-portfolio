/* MR-S10 ECRL GIS V1 — isolated, no Unified mutation. Physical track remains absent until sourced. */
(function(w,d){'use strict';
const D=w.MRS10ECRLGISV1,I=w.MRS10ECRLI18N,ML=w.maplibregl;
const get=id=>d.getElementById(id);
if(!D||!I){get('map-status').textContent='ECRL data unavailable';return;}
const A=[...D.stations,...D.loops,...D.facilities];
const byId=new Map(A.map(a=>[a.assetId,a]));
const geoPoint=a=>a?.point||a?.referencePoint||null;
const focusPoint=a=>geoPoint(a)||(a?.focusReferenceAssetId?geoPoint(byId.get(a.focusReferenceAssetId)):null);
const geoLabel=a=>a?.referenceKind==='HISTORICAL_EIA2017_PROPOSED_STATION'?T('historicRef'):a?.referenceKind==='PORT_FACILITY_AREA_PKA22'?T('portArea'):a?.focusReferenceAssetId?T('proxyArea'):a?.point?T('referenceOnly'):T('noPoint');
const state={lang:'ms',theme:'light',scope:'C2',search:'',selectedId:null,map:null,markers:new Map(),mapReady:false,listOpen:true};
const keys={
 STATION:'station',HISTORICAL_PL_DESIGNATION:'crossing',FREIGHT_YARD:'yard',PORT_INTERFACE:'ports',DEPOT:'facility',TUNNEL:'tunnel',
 PASSENGER:'passenger',PASSENGER_FREIGHT:'passengerFreight',FUTURE_PASSENGER:'futurePassenger',
 CONFIRMED:'confirmed',PARTIAL:'partial',PENDING_VALIDATION:'pendingStatus',PROPOSED_OFFICIAL:'proposedOfficial',
 PLANNED_NOT_OPERATIONAL:'notOperational',PLANNED_CONNECTION:'planned',CONSTRUCTION_REFERENCE:'partial',
 UNVERIFIED_CONNECTION:'pendingStatus',FREIGHT_INTERFACE:'ports',SCHEMATIC_REFERENCE:'referenceOnly',
 LEGACY_PUBLIC_LOCALITY_REFERENCE:'referenceOnly',NO_PUBLIC_ASSET_GIS:'noPoint',NONE:'noPoint'
};
const typeTitle={STATION:'stationIntel',HISTORICAL_PL_DESIGNATION:'loopIntel',FREIGHT_YARD:'freightIntel',PORT_INTERFACE:'freightIntel',DEPOT:'freightIntel',TUNNEL:'infraIntel'};
const T=k=>(I[state.lang]||I.ms)[k]||I.ms[k]||k;
function status(v){return T(keys[v]||'unknown');}
function n(v){return v===null||v===undefined?T('none'):String(v);}
const noteMap={
 ms:{conflictPuncak:"Sumber bercanggah: rekod Selangor menyatakan Puncak Alam sebagai stesen penumpang, sementara pembentangan MRL Jun 2024 menyebut penumpang dan kargo. Puncak Alam Freight Yard 2025 ialah cadangan aset berasingan; kategori stesen belum diputuskan.",conflictJalan:"Sumber bercanggah: rekod Selangor menggambarkan Jalan Kastam sebagai penumpang dan kargo, tetapi pembentangan MRL Jun 2024 menyebut penumpang sahaja. Jangan anggap stesen dan rangkaian akses pelabuhan adalah aset yang sama.",station:'Identiti stesen bersumber rasmi. Titik peta, jika ada, ialah rujukan kawasan lama dan bukan koordinat peron atau trek.',c2:'Identiti stesen C2 bersumber rasmi. Lokasi trek stesen tepat belum disahkan dan titik rujukan EIA 2017 dipaparkan, bukan koordinat stesen sebenar.',loop:'Label PL sejarah MR-S10 sahaja. Kewujudan, susun atur dan lokasi crossing loop belum disahkan.',yard:'Skim kereta api C2 pindaan Oktober 2025 menyatakan cadangan Puncak Alam Freight Yard; bukan bukti operasi.',port:"Kelulusan MOT 17 Februari 2025: Seksyen D 25 km, satu landasan standard gauge ECRL baharu serta satu landasan metre gauge KTMB sedia ada yang dikekalkan secara berasingan. Cadangan lama satu landasan dwi-tolok telah digantikan. Geometri trek belum disahkan.",depot:'Rekod depoh lama MR-S10 menunggu pengesahan rasmi dan koordinat.',tunnel:'Rujukan kerja terowong tersedia; lokasi portal, panjang dan susunan trek belum disahkan.'},
 en:{conflictPuncak:"Source conflict: Selangor records classify Puncak Alam as a passenger station, while MRL's June 2024 presentation says passenger and freight. The proposed 2025 freight yard is a separate asset; station service classification remains unresolved.",conflictJalan:"Source conflict: Selangor describes Jalan Kastam as passenger and freight, while MRL's June 2024 presentation describes passenger only. Station and port access tracks must not be conflated.",station:'Official station identity. Any map point is an old locality reference, not the platform or track location.',c2:'Official C2 station identity. Exact station track coordinates remain unverified; only a separate historical 2017 EIA reference is shown, not a surveyed current station site.',loop:'Historical MR-S10 PL label only. Crossing-loop existence, layout and location are not independently verified.',yard:'October 2025 revised C2 railway scheme proposes Puncak Alam Freight Yard; not an operating-asset claim.',port:"MOT approval of 17 February 2025: Section D, 25 km, with a new standard-gauge ECRL track alongside the retained separate KTMB metre-gauge track. This supersedes the former single dual-gauge proposal. Exact track geometry remains unverified.",depot:'Legacy MR-S10 depot record pending authoritative location and status verification.',tunnel:'Public tunnel-work reference exists; portals, length and track arrangement remain unverified.'},
 zh:{conflictPuncak:"来源冲突：雪兰莪州资料将 Puncak Alam 列为客运站，而 MRL 2024 年 6 月材料列为客货运站。2025 年拟议货运场是独立设施，车站服务类型仍未定。",conflictJalan:"来源冲突：雪兰莪州资料将 Jalan Kastam 列为客货运，而 MRL 2024 年 6 月材料仅列为客运。不得将车站与港口连接轨道混为一谈。",station:'车站名称有官方来源。地图点位仅为旧区域参考，不代表站台或轨道实测坐标。',c2:'C2 车站名称有官方依据，但车站轨道精确坐标尚未核实，仅显示2017年EIA历史规划参考点，而非实际车站坐标。',loop:'仅为 MR-S10 历史 PL 标注，尚无独立证据证明会让线位置与轨道布局。',yard:'2025 年 10 月 C2 修订铁路方案提出 Puncak Alam 货运场，不代表已经运营。',port:"交通部于 2025 年 2 月 17 日批准：D 段长 25 公里，新建 ECRL 标准轨距轨道并保留独立的 KTMB 米轨，取代原单线双轨距方案。轨道精确坐标尚未核实。",depot:'MR-S10 历史车辆基地资料尚待核实位置与状态。',tunnel:'公开资料提及隧道工程，但洞口、长度和轨道布局未核实。'},
 th:{conflictPuncak:"แหล่งข้อมูลขัดแย้ง: รัฐสลังงอร์ระบุ Puncak Alam เป็นสถานีผู้โดยสาร แต่เอกสาร MRL มิถุนายน 2024 ระบุผู้โดยสารและสินค้า ลานสินค้าที่เสนอในปี 2025 เป็นทรัพย์สินอีกแห่ง ประเภทสถานียังไม่สรุป",conflictJalan:"แหล่งข้อมูลขัดแย้ง: รัฐสลังงอร์ระบุ Jalan Kastam เป็นสถานีผู้โดยสารและสินค้า แต่ MRL มิถุนายน 2024 ระบุเฉพาะผู้โดยสาร อย่าปะปนสถานีกับทางเข้าสู่ท่าเรือ",station:'ชื่อสถานีอ้างอิงเอกสารทางการ จุดบนแผนที่เป็นตำแหน่งอ้างอิงพื้นที่เดิม ไม่ใช่ตำแหน่งรางหรือชานชาลาจริง',c2:'ชื่อสถานี C2 มีแหล่งอ้างอิงทางการ แต่ไม่มีพิกัดรางสถานีที่ตรวจสอบแล้ว แสดงเพียงจุดอ้างอิงแผน EIA ปี 2017 ไม่ใช่ตำแหน่งสถานีจริง',loop:'เป็นรหัส PL ในข้อมูล MR-S10 เดิม ยังไม่ได้ยืนยันทางหลีก ผังทาง และตำแหน่ง',yard:'โครงการปรับแก้ C2 เดือนตุลาคม 2025 เสนอลานขนส่งสินค้า Puncak Alam ไม่ใช่หลักฐานว่าเปิดใช้งานแล้ว',port:"กระทรวงคมนาคมอนุมัติเมื่อ 17 กุมภาพันธ์ 2025: ช่วง D ยาว 25 กม. มีรางมาตรฐานใหม่ของ ECRL และรางหนึ่งเมตรเดิมของ KTMB แยกจากกัน แทนข้อเสนอรางคู่ขนาดเดิม ยังไม่มีพิกัดรางที่ยืนยัน",depot:'ข้อมูลศูนย์ซ่อมบำรุง MR-S10 เดิมยังรอตรวจสอบสถานะและตำแหน่ง',tunnel:'มีข้อมูลโครงการอุโมงค์ แต่ยังไม่ยืนยันพิกัดปากอุโมงค์ ความยาว และรูปแบบทาง'}
};
function noteFor(a){
 const k=a.officialName==='Puncak Alam'?'conflictPuncak':a.officialName==='Jalan Kastam (Port Klang)'?'conflictJalan':a.assetType==='STATION'?(a.section==='C2'?'c2':'station'):
 a.assetType==='HISTORICAL_PL_DESIGNATION'?'loop':
 a.assetType==='FREIGHT_YARD'?'yard':
 a.assetType==='PORT_INTERFACE'?'port':
 a.assetType==='DEPOT'?'depot':'tunnel';
 return noteMap[state.lang][k];
}
function shownAssets(){
 const scoped=A.filter(a=>state.scope==='ALL'||a.section==='C2'||a.section==='D'||a.assetId==='ecrl-stn-16');
 const q=state.search.trim().toLowerCase();
 return scoped.filter(a=>!q||[a.officialName,a.historicalName,a.assetId,a.section].filter(Boolean).join(' ').toLowerCase().includes(q));
}
function label(a){return a.officialName||a.historicalName||a.assetId;}
function sourceLinks(a){
 const ul=d.createElement('ul');
 for(const id of a.sourceIds||[]){
  const s=D.sources[id];if(!s)continue;
  const li=d.createElement('li'),link=d.createElement('a');
  link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=id+' · '+s.revision;
  li.appendChild(link);ul.appendChild(li);
 }return ul;
}
function addPair(dl,k,value){
 const dt=d.createElement('dt'),dd=d.createElement('dd');dt.textContent=T(k);dd.textContent=value;dl.append(dt,dd);
}
function section(title,container){const h=d.createElement('h3');h.textContent=title;container.appendChild(h)}
function renderDetail(){
 const a=byId.get(state.selectedId),panel=get('detail-panel');
 if(!a){panel.hidden=true;return;}
 panel.hidden=false;
 get('detail-type').textContent=T(typeTitle[a.assetType]||'infraIntel');
 get('detail-title').textContent=label(a);
 get('detail-close').setAttribute('aria-label',T('back'));
 const wrap=get('detail-content');wrap.replaceChildren();
 const dl=d.createElement('dl');
 addPair(dl,'assetType',T(keys[a.assetType]||'facility'));
 addPair(dl,'section',a.section);
 addPair(dl,'status',status(a.assetStatus));
 addPair(dl,'verification',status(a.verificationStatus));
 addPair(dl,'geometry',geoLabel(a));
 addPair(dl,'chainage',T('none'));
 if(a.assetType==='STATION')addPair(dl,'service',status(a.serviceType));
 if(a.assetType==='HISTORICAL_PL_DESIGNATION')addPair(dl,'classification',T('pendingStatus'));
 if(a.assetType==='STATION'||a.assetType==='HISTORICAL_PL_DESIGNATION')addPair(dl,'trackCount',T('unknown'));
 if(a.assetType==='PORT_INTERFACE'){addPair(dl,'gauge','1,435 mm ECRL + 1,000 mm KTMB');addPair(dl,'trackCount','2 ('+a.section+')');}
 wrap.appendChild(dl);
 if(a.assetType==='STATION'||a.assetType==='HISTORICAL_PL_DESIGNATION'){
  section(T('speed'),wrap);const sd=d.createElement('dl');
  for(const k of ['speedDesign','speedPermitted','speedApproach','speedThrough','speedCurve','tsr'])addPair(sd,k,T('none'));
  wrap.appendChild(sd);
  const p=d.createElement('p');p.textContent=T('projectOnly');wrap.appendChild(p);
 }
 section(T('note'),wrap);const p=d.createElement('p');p.textContent=noteFor(a);wrap.appendChild(p);
  if(a.referencePoint||a.focusReferenceAssetId){const warning=d.createElement('p');warning.className='reference-disclaimer';warning.textContent=a.focusReferenceAssetId?T('yardFocusWarning'):a.referenceKind==='PORT_FACILITY_AREA_PKA22'?T('portReferenceWarning'):T('referenceWarning');wrap.appendChild(warning);}
  if(a.referenceSourceId){const coord=d.createElement('p');coord.className='reference-coordinates';coord.textContent=T('referenceBadge')+' · '+a.referencePoint[1].toFixed(5)+'°N, '+a.referencePoint[0].toFixed(5)+'°E';wrap.appendChild(coord);}
 section(T('sources'),wrap);wrap.appendChild(sourceLinks(a));
 state.markers.forEach((marker,id)=>marker.getElement().setAttribute('data-selected',String(id===a.assetId)));
 const selected=state.map?.getCanvasContainer?.();if(selected)selected.setAttribute('data-active-ecrl-asset',a.assetId);
}
function choose(id,focus=false){
 const a=byId.get(id);if(!a)return;
 state.selectedId=id;renderDetail();renderList();
 const position=focusPoint(a);
  if(focus&&position&&state.mapReady){
   const frame=get('map-frame').getBoundingClientRect(),small=frame.width<=700;
   state.map.easeTo({center:position,zoom:Math.max(state.map.getZoom(),10.8),
    padding:small?{top:24,bottom:Math.min(frame.height*0.57,440),left:12,right:12}:{top:18,bottom:18,left:18,right:Math.min(390,frame.width*0.38)},
    duration:350});
  }
}
function renderList(){
 const list=get('asset-list');list.replaceChildren();
 const visible=shownAssets();get('browser-count').textContent=String(visible.length);
 get('asset-list-title').textContent=T('list')+' · '+(state.scope==='C2'?'C2':'A–C2');
 for(const a of visible){
  const b=d.createElement('button');b.type='button';b.setAttribute('data-asset-id',a.assetId);
  b.setAttribute('aria-current',String(a.assetId===state.selectedId));
  const name=d.createElement('strong');name.textContent=label(a);
  const small=d.createElement('small');small.textContent=a.section+' · '+T(keys[a.assetType]||'facility')+' · '+geoLabel(a);
  b.append(name,small);b.addEventListener('click',()=>choose(a.assetId,true));list.appendChild(b);
 }
}
function translate(){
 d.documentElement.lang=state.lang;
 get('app-title').textContent=T('title');get('app-subtitle').textContent=T('subtitle');
 get('asset-search').placeholder=T('search');get('asset-search').setAttribute('aria-label',T('search'));
 get('theme').setAttribute('aria-label',T('theme'));get('reset').setAttribute('aria-label',T('reset'));
 get('show-list').setAttribute('aria-label',T('list'));get('legend-title').textContent=T('legend');
 get('legend-station').textContent=T('regular');get('legend-historic').textContent=T('legendHistoric');get('legend-port').textContent=T('legendPort');get('legend-loop').textContent=T('verified');get('legend-pending').textContent=T('pending');
 get('legend-notice').textContent=T('noLoops');get('legal').textContent=T('legal');
 get('map-status').textContent=state.mapReady?T('noTrack'):state.map===null?T('mapError'):T('loading');
 d.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===state.lang)));
 renderList();renderDetail();
}
function fitScope(){
 if(!state.mapReady)return;
 const small=get('map-frame').clientWidth<=700;
 if(state.scope==='C2')state.map.fitBounds([[101.27,2.91],[101.78,3.41]],{
  padding:small?{top:35,bottom:100,left:25,right:25}:{top:35,bottom:35,left:30,right:state.listOpen?330:30},
  duration:350,maxZoom:9.1});
 else state.map.fitBounds([[101.27,2.91],[103.50,6.15]],{padding:small?30:65,duration:350,maxZoom:8});
}
function setScope(scope){
 state.scope=scope;get('scope-c2').setAttribute('aria-pressed',String(scope==='C2'));
 get('scope-all').setAttribute('aria-pressed',String(scope==='ALL'));
 renderList();renderMarkers();
 fitScope();
}
const sourceName='mrs10-ecrl-v1-locality-reference-points',layerName='mrs10-ecrl-v1-reference-hitbox';
function syncGeoJSON(){
 if(!state.map||!state.map.isStyleLoaded())return;
 const features=[...D.stations,...D.facilities].filter(x=>geoPoint(x)).map(a=>({
  type:'Feature',id:a.assetId,properties:{assetId:a.assetId,geometryProvenance:a.referenceKind||a.geometryProvenance,referenceSourceId:a.referenceSourceId||a.sourceId,physicalTrack:false},
  geometry:{type:'Point',coordinates:geoPoint(a)}}));
 const geo={type:'FeatureCollection',features};
 if(!state.map.getSource(sourceName))state.map.addSource(sourceName,{type:'geojson',data:geo});
 else state.map.getSource(sourceName).setData(geo);
 if(!state.map.getLayer(layerName))state.map.addLayer({id:layerName,type:'circle',source:sourceName,
  layout:{visibility:'visible'},paint:{'circle-radius':12,'circle-opacity':0,'circle-stroke-opacity':0}});
}
function verifiedLoop(a){return a.assetType==='HISTORICAL_PL_DESIGNATION'&&a.verificationStatus==='CONFIRMED'&&a.geometryType==='VERIFIED_ASSET_POINT'&&Array.isArray(a.point)&&a.sourceIds.some(id=>D.sources[id]?.kind==='SURVEYED_OR_VALIDATED_GIS');}
function renderMarkers(){
 if(!state.mapReady||!ML)return;
 for(const [id,m] of state.markers){m.remove();state.markers.delete(id);}
 for(const a of [...D.stations.filter(a=>geoPoint(a)&&(state.scope==='ALL'||a.section==='C2'||a.assetId==='ecrl-stn-16')),...D.facilities.filter(a=>a.section==='D'&&geoPoint(a)),...D.loops.filter(a=>verifiedLoop(a)&&(state.scope==='ALL'||a.section==='C2'))]){
  const b=d.createElement('button');b.type='button';b.className='ecrl-pin';
  b.setAttribute('aria-label',label(a)+' · '+(verifiedLoop(a)?T('verified'):geoLabel(a)));b.title=label(a)+' · '+geoLabel(a);b.dataset.assetId=a.assetId;b.dataset.shape=verifiedLoop(a)?'loop':a.referenceKind==='HISTORICAL_EIA2017_PROPOSED_STATION'?'historical-reference':a.referenceKind==='PORT_FACILITY_AREA_PKA22'?'port-reference':'station';
  const icon=d.createElement('span');icon.className='pin-visual';icon.setAttribute('aria-hidden','true');b.appendChild(icon);
  b.addEventListener('click',ev=>{ev.stopPropagation();choose(a.assetId);});
  const marker=new ML.Marker({element:b,anchor:'center'}).setLngLat(geoPoint(a)).addTo(state.map);
  state.markers.set(a.assetId,marker);
 }
 if(state.selectedId&&geoPoint(byId.get(state.selectedId)))state.markers.get(state.selectedId)?.getElement().setAttribute('data-selected','true');
}
function initMap(){
 if(!ML||typeof ML.Map!=='function'){get('map-status').textContent=T('mapError');return;}
 try{
  state.map=new ML.Map({container:'ecrl-map',style:'https://tiles.openfreemap.org/styles/liberty',center:[101.67,3.33],zoom:8.4,
   attributionControl:true,cooperativeGestures:false,maxZoom:17});
  state.map.addControl(new ML.NavigationControl({showCompass:false}),'bottom-left');
  state.map.on('style.load',()=>{try{syncGeoJSON();}catch(e){get('map-status').textContent=T('mapError');}});
  state.map.on('load',()=>{state.mapReady=true;syncGeoJSON();renderMarkers();fitScope();get('map-status').textContent=T('noTrack');});
  state.map.on('error',e=>{if(!state.mapReady)get('map-status').textContent=T('mapError');});
 }catch(e){get('map-status').textContent=T('mapError');}
}
function boot(){
 get('asset-search').addEventListener('input',e=>{state.search=e.target.value;renderList();});
 d.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{state.lang=b.dataset.lang;translate();renderMarkers();}));
 get('theme').addEventListener('click',()=>{state.theme=state.theme==='light'?'dark':'light';d.documentElement.dataset.theme=state.theme;});
 get('reset').addEventListener('click',()=>{state.search='';get('asset-search').value='';state.selectedId=null;renderDetail();setScope('C2');});
 get('scope-c2').addEventListener('click',()=>setScope('C2'));get('scope-all').addEventListener('click',()=>setScope('ALL'));
 get('detail-close').addEventListener('click',()=>{state.selectedId=null;renderDetail();renderList();});
 get('show-list').addEventListener('click',()=>{state.listOpen=!state.listOpen;get('asset-browser').hidden=!state.listOpen;get('show-list').setAttribute('aria-expanded',String(state.listOpen));});
 get('legend-toggle').addEventListener('click',()=>{const open=get('legend-body').hidden;get('legend-body').hidden=!open;get('legend-toggle').setAttribute('aria-expanded',String(open));});
 translate();initMap();
 w.MRS10ECRLV1QA=Object.freeze({getSnapshot:()=>({
 version:D.version,language:state.lang,theme:state.theme,scope:state.scope,
 selectedAssetId:state.selectedId,stationCount:D.stations.length,c2Stations:D.stations.filter(a=>a.section==='C2').length,
 verifiedLoops:D.loops.filter(a=>a.verificationStatus==='CONFIRMED').length,pendingLoops:D.loops.filter(a=>a.verificationStatus==='PENDING_VALIDATION').length,
 physicalTrackFeatures:0,referenceMarkers:state.markers.size,c2PlanningReferences:D.stations.filter(a=>a.section==='C2'&&a.referencePoint).length,portAreaReferences:D.facilities.filter(a=>a.section==='D'&&a.referencePoint).length,mapReady:state.mapReady,styleLoaded:!!state.map?.isStyleLoaded(),
 sourcePresent:!!state.map?.getSource(sourceName),layerPresent:!!state.map?.getLayer(layerName),
 webglAvailable:!!state.map?.getCanvas().getContext('webgl2')||!!state.map?.getCanvas().getContext('webgl')
 })});
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);