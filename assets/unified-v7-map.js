/* MR-S10 P01 V4. All geographic points arrive from GIS query responses.
   No route alignment is inferred from stop order. */
import maplibregl from './p01-maplibre.js';
const $=id=>document.getElementById(id);
const core=window.MRS10UnifiedV4Registry, kl=window.MRS10KLRegistry,
 ampang=window.MRS10AmpangR219, ampangGIS=window.MRS10AmpangGISR219,
 integration=window.MRS10UnifiedV6Adapter,ktm=window.MRS10UnifiedV7KTM;
const locales=['ms','en','zh','th'];
const i18n={
 ms:{title:'Peta Rel Bersepadu V7',desc:'Enam belas lapisan: 8 perkhidmatan V6, 6 KTM Komuter, ETS dan Ekspres Rakyat Timuran. Shuttle Timur belum diintegrasikan. Titik stesen daripada GIS awam pihak ketiga; bukan koordinat operasi atau jajaran trek.',
  ecrlReference:'Rujukan ECRL · lokasi fizikal belum disahkan',ecrlSection:'Rujukan ECRL mengikut seksyen',all:'Semua',search:'Cari stesen, kod atau laluan',reset:'Set semula',lineup:'Turutan stesen',
  loading:'Memuatkan stesen daripada GIS awam…',offline:'Peta geografi gagal dimuatkan. Senarai stesen masih boleh digunakan.',
  partial:'GIS tidak lengkap: hanya penanda yang dipadankan dipaparkan.',complete:'Semua penanda dipadankan kepada sumber GIS awam.',
  located:'Penanda sumber GIS dipadankan',unlocated:'Tiada lokasi GIS yang disahkan untuk stesen ini.',source:'GIS awam pihak ketiga (bukan pengukuran operasi)',
  transfer:'Pertukaran penumpang',status:'penanda GIS',noResults:'Tiada padanan carian.',pending:'Menunggu sumber GIS',notTrack:'Geometri trek belum disahkan; tiada garisan palsu.',visualPending:'Data GIS dipadankan tetapi paparan peta belum disahkan.',
  rights:'Data sumber GIS: ArcGIS awam pihak ketiga · Turutan stesen: MR-S10 operator references · Basemap: OpenFreeMap / OSM · Bukan untuk operasi.',
  fail:'Ralat GIS',show:'Paparkan laluan',found:'daripada'},
 en:{title:'Unified Railway Map V7',desc:'Sixteen layers: 8 baseline services, 6 KTM Komuter services, ETS and Ekspres Rakyat Timuran. Eastern Shuttle excluded. Station points from third-party public GIS; not operational coordinates or track alignments.',
  ecrlReference:'ECRL reference · physical location unverified',ecrlSection:'ECRL reference by section',all:'All',search:'Search station, code or service',reset:'Reset',lineup:'Station lineup',
  loading:'Loading public GIS stations…',offline:'Geographic map unavailable. The station list remains accessible.',
  partial:'GIS incomplete: only source-matched markers are shown.',complete:'All markers matched against public GIS sources.',
  located:'Source GIS marker matched',unlocated:'No verified GIS position for this station.',source:'Third-party public GIS (not an operational survey)',
  transfer:'Passenger interchange',status:'GIS markers',noResults:'No search matches.',pending:'Awaiting GIS source',notTrack:'Track geometry not verified; no fictitious lines.',visualPending:'GIS matched but map rendering not yet verified.',
  rights:'GIS data: third-party ArcGIS · Station order: MR-S10 operator references · Basemap: OpenFreeMap / OSM · Not for operations.',
  fail:'GIS error',show:'Show route',found:'of'},
 zh:{title:'综合铁路地图 V7',desc:'同时显示16个客运服务图层，不包括东海岸接驳列车。车站点位来自第三方公共 GIS，并非运营测量坐标或轨道线路。',
  ecrlReference:'ECRL 参考 · 位置尚未核实',ecrlSection:'ECRL 分段参考',all:'全部',search:'搜索车站、代码或线路',reset:'重置',lineup:'车站顺序',
  loading:'正在加载公共 GIS 车站…',offline:'地理地图不可用，但车站列表仍可使用。',
  partial:'GIS 数据不完整：仅显示来源匹配的标记。',complete:'所有标记已与公共 GIS 来源匹配。',
  located:'已匹配 GIS 标记',unlocated:'该车站尚无已核对的 GIS 位置。',source:'第三方公共 GIS（非运营测量）',
  transfer:'乘客换乘',status:'GIS 标记',noResults:'没有匹配结果。',pending:'等待 GIS 数据',notTrack:'轨道几何未经核实，不绘制虚构线路。',visualPending:'GIS 数据已匹配，但地图尚未通过显示验证。',
  rights:'GIS 来源：第三方 ArcGIS · 车站顺序：MR-S10 运营商参考资料 · 底图：OpenFreeMap / OSM · 不作运营用途。',
  fail:'GIS 错误',show:'显示线路',found:'／'},
 th:{title:'แผนที่รถไฟรวม V7',desc:'แสดง 16 ชั้นข้อมูลบริการ ไม่รวมรถรับส่งฝั่งตะวันออก จุดสถานีจาก GIS สาธารณะของบุคคลที่สาม ไม่ใช่พิกัดปฏิบัติการหรือแนวรางที่ตรวจวัด',
  ecrlReference:'ข้อมูลอ้างอิง ECRL · ยังไม่ยืนยันตำแหน่งจริง',ecrlSection:'ข้อมูลอ้างอิง ECRL ตามช่วง',all:'ทั้งหมด',search:'ค้นหาสถานี รหัส หรือเส้นทาง',reset:'รีเซ็ต',lineup:'ลำดับสถานี',
  loading:'กำลังโหลดสถานีจาก GIS สาธารณะ…',offline:'แผนที่ภูมิศาสตร์ไม่พร้อมใช้งาน แต่ยังดูรายชื่อสถานีได้',
  partial:'GIS ไม่ครบ: แสดงเฉพาะจุดที่จับคู่กับแหล่งข้อมูลได้',complete:'จับคู่หมุดทั้งหมดกับแหล่ง GIS สาธารณะแล้ว',
  located:'จับคู่หมุด GIS แล้ว',unlocated:'ยังไม่มีพิกัด GIS ที่ตรวจสอบแล้วสำหรับสถานีนี้',source:'GIS สาธารณะของบุคคลที่สาม (ไม่ใช่การสำรวจเพื่อปฏิบัติการ)',
  transfer:'จุดเปลี่ยนสายผู้โดยสาร',status:'หมุด GIS',noResults:'ไม่พบผลการค้นหา',pending:'รอข้อมูล GIS',notTrack:'ยังไม่ยืนยันแนวราง จึงไม่สร้างเส้นสมมติ',visualPending:'จับคู่ข้อมูล GIS แล้ว แต่ยังไม่ยืนยันการแสดงผลแผนที่',
  rights:'GIS: ArcGIS บุคคลที่สาม · ลำดับสถานี: MR-S10 ข้อมูลผู้ให้บริการ · แผนที่ฐาน: OpenFreeMap / OSM · ห้ามใช้เพื่อปฏิบัติการ',
  fail:'ข้อผิดพลาด GIS',show:'แสดงเส้นทาง',found:'จาก'}
};
const ecrlLabels={
 ms:{open:'Rujukan ECRL',close:'Tutup',scope:'Susunan rujukan aset mengikut seksyen. Lokasi, jarak dan jajaran fizikal belum disahkan.',STN:'Stesen',PL:'Passing loop',DEPOT:'Depot'},
 en:{open:'ECRL reference',close:'Close',scope:'Reference asset order by section. Physical locations, distances and alignment are unverified.',STN:'Station',PL:'Passing loop',DEPOT:'Depot'},
 zh:{open:'ECRL 参考',close:'关闭',scope:'按区段排列的资产参考。实际位置、距离及线路走向尚未核实。',STN:'车站',PL:'会让线',DEPOT:'车辆段'},
 th:{open:'ข้อมูลอ้างอิง ECRL',close:'ปิด',scope:'ลำดับอ้างอิงตามช่วง ยังไม่ยืนยันตำแหน่ง ระยะทาง และแนวรางจริง',STN:'สถานี',PL:'ทางหลีก',DEPOT:'ศูนย์ซ่อมบำรุง'}
};
const mapLabels={
 ms:['Stesen ECRL · titik rujukan kawasan','Rel latar OpenStreetMap · konteks rangkaian', 'Rujukan Owner: antara muka penumpang dan kargo KTMB. Skim menyenaraikan spur Temerloh. Operasi, pertukaran penumpang dan jajaran belum disahkan.'],
 en:['ECRL stations · locality references','OpenStreetMap rail · network context','Owner reference: KTMB passenger and freight interface. The scheme lists the Temerloh spur. Operations, passenger transfer and alignment remain unverified.'],
 zh:['ECRL 车站 · 地区参考点','OpenStreetMap 铁路 · 路网背景','业主参考：KTMB 客货接口。规划列有 Temerloh 支线。运营、换乘和线路走向尚未核实。'],
 th:['สถานี ECRL · จุดอ้างอิงพื้นที่','ทางรถไฟ OpenStreetMap · บริบทเครือข่าย','ข้อมูลอ้างอิงจากเจ้าของ: จุดเชื่อมต่อผู้โดยสารและสินค้าของ KTMB แผนระบุทางแยก Temerloh ส่วนการเดินรถ การต่อรถ และแนวรางยังไม่ยืนยัน']
};
const ecrlSource='mrs10-v7-ecrl-localities',ecrlMarker=ecrlSource+'-point',ecrlLabel=ecrlSource+'-label',railContext='mrs10-v7-rail-context';
const ecrlLoopMarker='mrs10-v7-ecrl-loop-reference';
const ecrlLoopZoom=9; // V8 DETAIL_ZOOM.PL
const ecrlReferenceUi={
 ms:['Passing loop · rujukan kawasan','Memuatkan jajaran rujukan ECRL…','Jajaran rujukan ECRL gagal dimuatkan.','Cuba lagi'],
 en:['Passing loop · locality reference','Loading the ECRL reference alignment…','Could not load the ECRL reference alignment.','Retry'],
 zh:['会让线 · 地区参考点','正在加载 ECRL 参考线路…','无法加载 ECRL 参考线路。','重试'],
 th:['ทางหลีก · จุดอ้างอิงพื้นที่','กำลังโหลดแนวรางอ้างอิง ECRL…','โหลดแนวรางอ้างอิง ECRL ไม่สำเร็จ','ลองอีกครั้ง']
};
const heldLoopLabels={
 ms:'Passing loop · rujukan kawasan; kedudukan pada jajaran belum disahkan',
 en:'Passing loop · locality reference; position on the alignment unverified',
 zh:'会让线 · 地区参考；线路上的位置尚未核实',
 th:'ทางหลีก · ข้อมูลอ้างอิงพื้นที่ ตำแหน่งบนแนวรางยังไม่ยืนยัน'
};
const unlocatedFacilityLabels={
 ms:'Lokasi fizikal belum disahkan',en:'Physical location unverified',
 zh:'实际位置尚未核实',th:'ตำแหน่งจริงยังไม่ยืนยัน'
};
const identityStatusLabels={
 ms:['Memuatkan rujukan aset ECRL…','Rujukan aset ECRL gagal dimuatkan.'],
 en:['Loading ECRL asset references…','Could not load ECRL asset references.'],
 zh:['正在加载 ECRL 资产参考…','无法加载 ECRL 资产参考。'],
 th:['กำลังโหลดข้อมูลอ้างอิงสินทรัพย์ ECRL…','โหลดข้อมูลอ้างอิงสินทรัพย์ ECRL ไม่สำเร็จ']
};
const ecrlReferenceLine='mrs10-v7-ecrl-reference-alignment';
const ecrlBranchLabels={
 ms:'Cabang · tag OSM',en:'Branch · OSM tag',zh:'支线 · OSM 标签',th:'ทางแยก · แท็ก OSM'
};
const ecrlStructureLabels={
 ms:['Terowong · tag OSM','Jambatan / viaduk · tag OSM','Zum dekat','Viaduk · tag OSM'],
 en:['Tunnel · OSM tag','Bridge / viaduct · OSM tag','Close zoom','Viaduct · OSM tag'],
 zh:['隧道 · OSM 标签','桥梁／高架桥 · OSM 标签','放大显示','高架桥 · OSM 标签'],
 th:['อุโมงค์ · แท็ก OSM','สะพาน / ทางยกระดับ · แท็ก OSM','แสดงเมื่อซูมเข้า','ทางยกระดับ · แท็ก OSM']
};
const alignmentLabels={
 ms:['ECRL · rujukan OSM (pembinaan, Nov 2026)','Jajaran disahkan kejuruteraan · belum tersedia'],
 en:['ECRL · OSM reference (construction, Nov 2026)','Engineering verified alignment · unavailable'],
 zh:['ECRL · OSM 参考（施工，2026年11月）','工程验证线路 · 暂无'],
 th:['ECRL · อ้างอิง OSM (ก่อสร้าง พ.ย. 2026)','แนวรางที่ผ่านการรับรองทางวิศวกรรม · ยังไม่มี']
};
const alignmentEvidenceLabels={
 ms:['Segmen rujukan ECRL','ID segmen','Tangkapan data OSM'],
 en:['ECRL reference segment','Segment ID','OSM snapshot'],
 zh:['ECRL 参考区段','区段 ID','OSM 数据快照'],
 th:['ช่วงอ้างอิง ECRL','รหัสช่วง','ข้อมูล OSM ณ วันที่']
};
const c2Labels={
 ms:['Stesen dirancang','Terminal kargo cadangan','Rujukan skema C2. Lokasi semasa dan jajaran belum disahkan.'],
 en:['Planned station','Proposed freight yard','C2 scheme reference. Current locations and alignment are unverified.'],
 zh:['规划车站','拟建货场','C2 规划参考。当前点位与线路走向尚未核实。'],
 th:['สถานีตามแผน','ลานสินค้าที่เสนอ','ข้อมูลอ้างอิงแผน C2 ยังไม่ยืนยันตำแหน่งปัจจุบันหรือแนวราง']
};
const dLabels={
 ms:['Antara muka pelabuhan dirancang','Rujukan kawasan pelabuhan. Skim memisahkan trek ECRL {ecrl} mm dan KTMB {ktmb} mm. Terminal, sambungan dan operasi rel belum disahkan.'],
 en:['Planned port interface','Port-area references. The scheme separates ECRL {ecrl} mm and KTMB {ktmb} mm tracks. Rail terminals, connections and operations are unverified.'],
 zh:['规划港口接口','港区参考。规划区分 ECRL {ecrl} 毫米轨道与 KTMB {ktmb} 毫米轨道。铁路终端、接轨与运营尚未核实。'],
 th:['จุดเชื่อมต่อท่าเรือตามแผน','อ้างอิงพื้นที่ท่าเรือ แผนแยกราง ECRL {ecrl} มม. และ KTMB {ktmb} มม. สถานีปลายทาง การเชื่อมราง และการเดินรถยังไม่ยืนยัน']
};
const ecrlType2='mrs10-ecrl-station-type-2';
let linkedAssetId=window.MRS10P01MapCore.readAssetId(location.search);
const catalogueLabels={ms:'Buka dalam katalog aset',en:'Open in asset catalogue',zh:'在资产目录中打开',th:'เปิดในรายการทรัพย์สิน'};
const state={locale:'ms',category:'ECRL',selected:'mrt-kajang',railFocus:false,theme:'light',map:null,mapReady:false,zoomDone:false,
 ecrlPublic:[],ecrlStations:[],ecrlLoops:[],assetIdentityStatus:'loading',referenceAlignment:null,alignmentSnapshot:null,alignmentStructures:new Map(),alignmentBranches:new Map(),referenceAlignmentStatus:'loading',activeReference:null,referenceOpener:null,basemapLabelOpacity:new Map(),results:new Map(),points:new Map(),pending:0,networkError:false,popup:null,manifest:[]};
function tr(k){return i18n[state.locale][k]}
function say(message){$('qa-note').textContent=message}
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=String(text);return x}
function selectedRoutes(){return state.manifest.filter(r=>state.category==='All'||r.category===state.category)}
function routeStatus(r){const d=state.results.get(r.id);return d?d.matched+'/'+r.expected:r.expected?'0/'+r.expected:'0'}
function currentCount(){return [...state.results.values()].reduce((n,r)=>n+r.matched,0)}
function showStatus(){
 const total=state.manifest.reduce((n,r)=>n+r.expected,0),ready=currentCount();
 const finished=state.pending===0;
 const view=diagnosticSnapshot();
 const canvasOk=view.mapReady&&view.styleLoaded&&view.tilesLoaded&&view.webglReady;
 const rows=Object.values(view.perRoute);
 const baselineOk=state.manifest.slice(0,4).every(r=>view.perRoute[r.id]?.present&&view.perRoute[r.id]?.rendered>0);
 const loaded=finished&&ready===total&&canvasOk&&rows.length===state.manifest.length&&rows.every(x=>x.present&&x.rendered>0);
 const message=!finished?tr('loading'):loaded?tr('complete'):
  ready!==total?tr('partial'):tr('visualPending');
 say(message+' · '+ready+'/'+total+' '+tr('status')+' · '+tr('notTrack'));
 const ecrlSelected=['ECRL','All'].includes(state.category);
 const showIdentity=ecrlSelected&&state.assetIdentityStatus!=='ready';
 const showAlignment=ecrlSelected&&state.referenceAlignmentStatus!=='ready';
 const [,alignmentLoading,alignmentError,retryLabel]=ecrlReferenceUi[state.locale];
 const [identityLoading,identityError]=identityStatusLabels[state.locale];
 const identityFailed=showIdentity&&state.assetIdentityStatus==='error';
 const alignmentFailed=showAlignment&&state.referenceAlignmentStatus==='error';
 const statusText=identityFailed?identityError:alignmentFailed?alignmentError:
  showIdentity?identityLoading:showAlignment?alignmentLoading:state.networkError?tr('offline'):message;
 const status=$('map-status-message');
 if(status.textContent!==statusText)status.textContent=statusText;
 const retry=$('ecrl-alignment-retry');
 retry.hidden=!(identityFailed||alignmentFailed);
 if(retry.textContent!==retryLabel)retry.textContent=retryLabel;
 const ecrlVisible=state.category==='ECRL'&&state.ecrlStations.length>0&&state.map?.getLayer(ecrlMarker);
 $('map-error').hidden=!showIdentity&&!showAlignment&&!!(canvasOk&&(baselineOk||ecrlVisible));
}
function findGeo(routeId,id){return state.points.get(routeId+':'+id)||null}
function buildFilters(){
 const host=$('filters');host.replaceChildren();
 for(const category of ['ECRL','All','MRT','LRT','Monorail','ERL','KTM','ETS','Intercity']){
  const btn=el('button',null,category==='All'?tr('all'):category);
  btn.type='button';btn.setAttribute('aria-pressed',String(category===state.category));
  btn.onclick=()=>setCategory(category);
  host.append(btn);
 }
}
function setCategory(category){
 linkedAssetId=null;
 closeReferenceContext();
 state.popup?.remove();
 state.category=category;
 state.railFocus=false;
 const allowed=selectedRoutes();
 if(!allowed.some(x=>x.id===state.selected))state.selected=allowed[0]?.id||state.selected;
 renderReferenceContext();buildFilters();buildLegend();buildRoutes();buildLineup();applyVisibility();
 state.zoomDone=false;fitOnce();showStatus();
}
function buildLegend(){
 const host=$('legend');host.replaceChildren();
 if(state.category==='ECRL'||state.category==='All'){
  const [station,rail]=mapLabels[state.locale];
  host.append(el('span','legend-item',station),el('span','legend-item',rail));
  const [reference,engineering]=alignmentLabels[state.locale];
  if(state.referenceAlignment?.features.length){
   const entry=el('span','legend-item'),swatch=el('span','swatch p01-reference-swatch');
   entry.append(swatch,el('span',null,reference));host.append(entry);
  }
  if(state.alignmentStructures.size){
   const [tunnel,bridge,closeZoom]=ecrlStructureLabels[state.locale];
   for(const [kind,label] of [['tunnel',tunnel],['bridge',bridge]]){
    const entry=el('span','legend-item');
    entry.append(el('span','swatch p01-reference-swatch p01-structure-'+kind),el('span',null,label+' · '+closeZoom));
    host.append(entry);
   }
  }
  if(state.alignmentBranches.size){
   const entry=el('span','legend-item');
   entry.append(el('span','swatch p01-reference-swatch p01-branch-swatch'),
    el('span',null,ecrlBranchLabels[state.locale]+' · '+ecrlStructureLabels[state.locale][2]));
   host.append(entry);
  }
  if(state.ecrlLoops.length){
   const entry=el('span','legend-item');
   entry.append(el('span','swatch p01-loop-swatch'),el('span',null,ecrlReferenceUi[state.locale][0]));
   host.append(entry);
  }
  host.append(el('span','legend-item',engineering));
 }
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
  btn.onclick=()=>{state.selected=r.id;state.railFocus=true;buildRoutes();buildLineup();applyVisibility();focusRoute(r.id)};
  host.append(btn);
 }
}
function focusRoute(routeId){
 const points=state.results.get(routeId)?.points||[];
 if(!state.mapReady||points.length===0)return;
 if(points.length===1){state.map.easeTo({center:points[0].coordinates,zoom:11,duration:350});return}
 const c=points.map(p=>p.coordinates);
 state.map.fitBounds([[Math.min(...c.map(p=>p[0])),Math.min(...c.map(p=>p[1]))],
 [Math.max(...c.map(p=>p[0])),Math.max(...c.map(p=>p[1]))]],{padding:50,maxZoom:11.5,duration:350});
}
function focusStation(routeId,id){
 const route=state.manifest.find(x=>x.id===routeId);if(!route)return;
 closeReferenceContext();
 state.selected=routeId;state.railFocus=true;
 if(state.category!=='All'&&state.category!==route.category){state.category='All';buildFilters();buildLegend();}
 renderReferenceContext();buildRoutes();buildLineup();applyVisibility();
 const point=findGeo(routeId,id);
 if(!point){say(tr('unlocated'));return}
 state.zoomDone=true;
 say(point.name+' · '+tr('located'));
 if(state.map){
  const open=()=>{state.map.easeTo({center:point.coordinates,zoom:Math.max(state.map.getZoom(),12.3),duration:360});showPopup(point)};
  if(state.map.isStyleLoaded())open();
  else state.map.once('idle',()=>{if(state.map?.isStyleLoaded())open()});
 }
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
function renderReferenceContext(){
 const reference=state.activeReference;
 $('ecrl-gateway-return').href=window.MRS10P01MapCore.assetHref('gateway',reference?.assetId);
 const labels=ecrlLabels[state.locale];
 const opener=$('ecrl-context-open');
 opener.textContent=labels.open;
 opener.hidden=state.ecrlPublic.length===0;
 opener.setAttribute('aria-expanded',String(!!reference));
 $('ecrl-context').hidden=!reference;
 $('rail-lineup-panel').hidden=!!reference||state.category==='ECRL';
 if(!reference)return;
 const {section,assetId}=reference;
 $('ecrl-context-title').textContent=tr('ecrlSection')+' · '+section;
 const gauges=window.MRS10P01MapCore.sectionDGauges;
 $('ecrl-context-status').textContent=section==='D'?dLabels[state.locale][1].replace(/\{(ecrl|ktmb)\}/g,(_,domain)=>gauges[domain]):
  section==='C2'?c2Labels[state.locale][2]:labels.scope;
 $('ecrl-context-back').textContent=labels.close;
 const sections=$('ecrl-context-sections');
 sections.setAttribute('aria-label',tr('ecrlSection'));
 sections.replaceChildren(...[...new Set(state.ecrlPublic.map(row=>row.section))].map(key=>{
  const button=el('button',null,key);
  button.type='button';
  button.dataset.section=key;
  button.setAttribute('aria-pressed',String(key===section));
  button.setAttribute('aria-controls','ecrl-context-list');
  button.onclick=()=>{
   state.activeReference={section:key};
   renderReferenceContext();
   [...sections.children].find(child=>child.dataset.section===key).focus();
  };
  return button;
 }));
 const list=$('ecrl-context-list');
 list.replaceChildren(...state.ecrlPublic.filter(row=>row.section===section).map(row=>{
  const item=el('li');
  item.dataset.assetId=row.assetId;
  item.dataset.type=row.type;
  if(section==='C2'&&row.type==='STN'){
   const icon=window.MRS10P01MapCore.stationType2Canvas();
   icon.className='p01-c2-station-icon';
   icon.setAttribute('aria-hidden','true');
   item.append(icon);
  }
  const title=[row.code,row.name].filter(Boolean).join(' · ');
  const hasPoint=!!ecrlPoint(row.assetId);
  const heldLoop=window.MRS10P01MapCore.isPassingLoopPlacementHeld(row);
  const button=el('button',null,title);
  button.type='button';
  if(hasPoint)button.dataset[row.type==='STN'?'mapStation':'mapReference']=row.assetId;
  else button.className='p01-ecrl-reference-select';
  button.onclick=()=>selectEcrlAsset(row,opener,hasPoint);
  item.append(button);
  item.append(el('small',null,row.type==='PORT'?dLabels[state.locale][0]:
   row.type==='DEPOT'?labels.DEPOT+' · '+unlocatedFacilityLabels[state.locale]:
   section==='C2'?c2Labels[state.locale][row.type==='YARD'?1:0]:
   heldLoop?heldLoopLabels[state.locale]:row.type==='PL'?
    (hasPoint?ecrlReferenceUi[state.locale][0]:labels.PL+' · '+unlocatedFacilityLabels[state.locale]):labels[row.type]));
  if(row.assetId===assetId){
   item.setAttribute('aria-current','true');
   if(assetId==='ecrl-stn-14')item.append(temerlohContext());
   const catalogueLink=el('a',null,catalogueLabels[state.locale]);
   catalogueLink.href=window.MRS10P01MapCore.assetHref('ecrl',assetId);
   catalogueLink.target='_top';
   item.append(catalogueLink);
  }
  return item;
 }));
 list.scrollTop=0;
 const selected=list.querySelector('[aria-current=true]');
 if(selected)list.scrollTop=Math.max(0,selected.getBoundingClientRect().top-list.getBoundingClientRect().top);
}
function temerlohContext(){
 const detail=el('div','notice');
 detail.id='ecrl-context-detail';
 const link=el('a',null,'PLANMalaysia PeGTaECRL');
 link.href='https://myplan.planmalaysia.gov.my/admin/uploads_publication/pdf_20250117162247_10.pdf';
 link.target='_blank';link.rel='noopener noreferrer';
 detail.append(el('p',null,mapLabels[state.locale][2]+' '),link);
 const ert=state.manifest.find(route=>route.id==='ktmb-ert');
 const stop=ert?.stops.find(row=>row.id==='ktmb-ert:66100');
 if(stop){
  const button=el('button',null,'Mentakab · KTM ERT');
  button.type='button';
  button.onclick=()=>focusStation(ert.id,stop.id);
  detail.append(button);
 }
 return detail;
}
function openReferenceContext(reference,opener){
 state.activeReference=reference;
 state.referenceOpener=opener;
 renderReferenceContext();
 $('ecrl-context-title').focus();
}
function ecrlPoint(assetId){
 return state.ecrlStations.find(row=>row.id===assetId)??state.ecrlLoops.find(row=>row.id===assetId);
}
function selectEcrlAsset(asset,opener,zoom){
 const point=ecrlPoint(asset.assetId);
 state.railFocus=false;
 state.popup?.remove();
 if(point&&state.mapReady){
  state.zoomDone=true;
  if(!['ECRL','All'].includes(state.category)){
   state.category='ECRL';buildFilters();buildLegend();buildRoutes();buildLineup();
  }
  if(zoom)state.map.easeTo({center:point.geometry.coordinates,zoom:Math.max(9,state.map.getZoom()),duration:320});
 }
 applyVisibility();
 openReferenceContext(asset,opener);
}
function closeReferenceContext(){
 if(!state.activeReference)return;
 state.activeReference=null;
 state.referenceOpener=null;
 renderReferenceContext();
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
 const references=window.MRS10P01MapCore?.findPublicAssets(state.ecrlPublic,$('search').value)??[];
 for(const asset of references){
  const button=el('button',null,[tr('ecrlReference'),asset.code,asset.name].filter(Boolean).join(' · '));
  button.type='button';
  button.dataset.ecrlIdentity=asset.assetId;
  button.setAttribute('aria-controls','ecrl-context');
  button.onclick=()=>{
   host.hidden=true;
   selectEcrlAsset(asset,$('search'),true);
  };
  host.append(button);
 }
 if(!matches.length&&!references.length)host.append(el('p',null,tr('noResults')));
}
function updateFullscreenLabel(){
 const button=$('p01-v7-fullscreen'), active=button.getAttribute('aria-pressed')==='true';
 const labels={ms:['Skrin penuh','Keluar skrin penuh'],en:['Fullscreen','Exit fullscreen'],zh:['全屏','退出全屏'],th:['เต็มหน้าจอ','ออกจากเต็มหน้าจอ']};
 button.textContent=labels[state.locale][Number(active)];
}
function bindFullscreen(){
 const button=$('p01-v7-fullscreen'), shell=button.closest('.mapbox');
 function setFullscreen(active){
  shell.classList.toggle('p01-v7-fullscreen',active);
  document.body.classList.toggle('p01-v7-fullscreen-open',active);
  button.setAttribute('aria-pressed',String(active));
  updateFullscreenLabel();
  requestAnimationFrame(()=>state.map?.resize());
 }
 button.addEventListener('click',()=>setFullscreen(button.getAttribute('aria-pressed')!=='true'));
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.defaultPrevented||button.getAttribute('aria-pressed')!=='true')return;
  event.preventDefault();
  setFullscreen(false);
  button.focus({preventScroll:true});
 });
}
function applyLanguage(){
 document.documentElement.lang=state.locale;
 $('title').textContent=tr('title');$('description').textContent=tr('desc');
 $('lineup-title').textContent=tr('lineup');$('search').placeholder=tr('search');
 $('reset').textContent=tr('reset');$('language').textContent=state.locale==='ms'?'BM':state.locale==='en'?'EN':state.locale==='zh'?'中文':'ไทย';
 $('attribution').textContent=tr('rights');
 renderReferenceContext();updateFullscreenLabel();buildFilters();buildLegend();buildRoutes();buildLineup();updateSearch();showStatus();
}
function geoJSON(){
 return core.toGeoJSON(state.manifest.map(r=>state.results.get(r.id)));
}
const srcId=id=>'mrs10-v7-source-'+id;
const layerId=id=>'mrs10-v7-'+id;
function installGeographicContext(map){
 const style=map.getStyle();
 const transportation=style.layers.find(layer=>layer['source-layer']==='transportation'&&style.sources[layer.source]?.type==='vector');
 if(transportation&&!map.getLayer(railContext)){
  // Same source taxonomy as R211. Basemap rail is context without an ECRL designation.
  map.addLayer({id:railContext,type:'line',source:transportation.source,'source-layer':'transportation',minzoom:8,
   filter:['all',['==',['get','class'],'rail'],['in',['get','subclass'],['literal',['rail','narrow_gauge']]]],
   paint:{'line-color':state.theme==='dark'?'#87c6d6':'#527d8b','line-opacity':0.62,
    'line-width':['interpolate',['linear'],['zoom'],8,0.7,14,1.45,18,2.4]}},
   style.layers.find(layer=>layer.type==='symbol')?.id);
 }
 if(state.referenceAlignment?.features.length){
  window.MRS10P01MapCore.installReferenceAlignment(map,ecrlReferenceLine,{
   geometry:state.referenceAlignment,structures:state.alignmentStructures,branches:state.alignmentBranches
  },state.theme,[ecrlMarker,style.layers.find(layer=>layer.type==='symbol')?.id].find(id=>id&&map.getLayer(id)));
 }
 if(state.ecrlLoops.length&&!map.getLayer(ecrlLoopMarker)){
  if(!map.getSource(ecrlLoopMarker))map.addSource(ecrlLoopMarker,{type:'geojson',
   data:{type:'FeatureCollection',features:state.ecrlLoops}});
  map.addLayer({id:ecrlLoopMarker,type:'circle',source:ecrlLoopMarker,minzoom:ecrlLoopZoom,
   paint:{'circle-radius':['interpolate',['linear'],['zoom'],ecrlLoopZoom,5,14,7],
    'circle-color':'#b57925','circle-stroke-color':'#fff','circle-stroke-width':1.5}},
   map.getLayer(ecrlMarker)?ecrlMarker:undefined);
 }
 if(!state.ecrlStations.length)return;
 if(!map.getSource(ecrlSource))map.addSource(ecrlSource,{type:'geojson',data:{type:'FeatureCollection',features:state.ecrlStations}});
 if(!map.getLayer(ecrlMarker)){
  window.MRS10P01MapCore.installStationType2(map,ecrlType2);
  map.addLayer({id:ecrlMarker,type:'symbol',source:ecrlSource,
   layout:{'icon-image':ecrlType2,'icon-size':['step',['zoom'],0.62,8,0.82,12,1],'icon-allow-overlap':true}});
 }
 if(style.glyphs&&!map.getLayer(ecrlLabel))map.addLayer({id:ecrlLabel,type:'symbol',source:ecrlSource,minzoom:8,
  layout:{'text-field':['step',['zoom'],['get','code'],11,['concat',['get','code'],' · ',['get','name']]],
   'text-font':['Noto Sans Regular'],'text-size':12,'text-max-width':11,'text-padding':4,
   'text-offset':[0,1.35],'text-anchor':'top'},
  paint:{'text-color':state.theme==='dark'?'#e9f4ff':'#16457b','text-halo-color':state.theme==='dark'?'#183140':'#fff','text-halo-width':1.5}});
}
function updateMapLayer(){
 const map=state.map;
 if(!map||!map.isStyleLoaded())return;
 try{
  for(const r of state.manifest){
   const source=srcId(r.id),lid=layerId(r.id);
   const data=core.toGeoJSON([state.results.get(r.id)]);
   if(!map.getSource(source))map.addSource(source,{type:'geojson',data});
   else map.getSource(source).setData(data);
   if(!map.getLayer(lid))map.addLayer({id:lid,type:'circle',source,
    paint:{
     'circle-color':r.color,
     'circle-radius':r.id==='erl-klia-ekspres'?
       ['interpolate',['linear'],['zoom'],3,3.5,7,7,11,13,14,16]:
       r.id==='erl-klia-transit'?['interpolate',['linear'],['zoom'],3,2,7,3.6,11,7,14,9.5]:
       ['interpolate',['linear'],['zoom'],3,2,7,4,11,8.5,14,11],
     'circle-stroke-color':'#fff',
     'circle-stroke-width':2,
     'circle-opacity':1
    }});
  }
  installGeographicContext(map);
  applyVisibility();
 }catch(e){
  state.networkError=true;
  $('map-error').hidden=false;
  $('map-error').textContent=tr('offline');
  console.error('V7_MAP_LAYER_INSTALL_FAILED',e);
 }
}
function applyBasemapLabelFocus(map,styleLayers,focused){
 for(const layer of styleLayers){
  if(layer.type!=='symbol'||!['transportation_name','water_name','waterway'].includes(layer['source-layer']))continue;
  const current=map.getPaintProperty(layer.id,'text-opacity');
  if(!state.basemapLabelOpacity.has(layer.id)){
   if(!focused||current!==undefined&&typeof current!=='number')continue;
   state.basemapLabelOpacity.set(layer.id,current);
  }
  const original=state.basemapLabelOpacity.get(layer.id);
  const opacity=focused?(original??1)*0.5:original;
  if(current!==opacity)map.setPaintProperty(layer.id,'text-opacity',opacity??null);
 }
}
function applyVisibility(){
 const map=state.map;
 if(!map||!state.mapReady)return;
 const layers=[];
 const focusedId=state.railFocus?layerId(state.selected):null;
 for(const r of state.manifest){
  const id=layerId(r.id);
  if(!map.getLayer(id))continue;
  layers.push(id);
  const visibility=state.category==='All'||state.category===r.category?'visible':'none';
  if(map.getLayoutProperty(id,'visibility')!==visibility)map.setLayoutProperty(id,'visibility',visibility);
  const focused=id===focusedId;
  const opacity=focusedId&&!focused?0.65:1;
  for(const [property,value] of [['circle-opacity',opacity],['circle-stroke-opacity',opacity],['circle-stroke-width',focused?3:2]]){
   if(map.getPaintProperty(id,property)!==value)map.setPaintProperty(id,property,value);
  }
 }
 // Raise the selected service above overlaps and restore source order on reset.
 if(focusedId&&layers.includes(focusedId))layers.push(...layers.splice(layers.indexOf(focusedId),1));
 const railLayers=new Set(layers);
 const styleLayers=map.getStyle()?.layers??[];
 const current=styleLayers.filter(layer=>railLayers.has(layer.id));
 if(layers.some((id,index)=>current[index]?.id!==id)){
  for(const id of layers)map.moveLayer(id);
 }
 const ecrlVisible=['ECRL','All'].includes(state.category);
 for(const id of [ecrlMarker,ecrlLabel,ecrlLoopMarker,railContext,ecrlReferenceLine]){
  if(!map.getLayer(id))continue;
  const visible=ecrlVisible||(id===railContext&&state.category==='KTM');
  if(map.getLayoutProperty(id,'visibility')!==(visible?'visible':'none'))map.setLayoutProperty(id,'visibility',visible?'visible':'none');
 }
 if(ecrlVisible&&layers.some(id=>styleLayers.findIndex(l=>l.id===id)>styleLayers.findIndex(l=>l.id===ecrlMarker))){
  for(const id of [ecrlMarker,ecrlLabel])if(map.getLayer(id))map.moveLayer(id);
 }
 applyBasemapLabelFocus(map,styleLayers,state.category==='ECRL'||!!focusedId&&railLayers.has(focusedId));
}
function showAlignmentEvidence(event){
 const map=state.map;
 if(!state.referenceAlignment||!['ECRL','All'].includes(state.category)||!map.getLayer(ecrlReferenceLine))return;
 const {x,y}=event.point;
 const hits=map.queryRenderedFeatures([[x-5,y-5],[x+5,y+5]],{layers:[ecrlReferenceLine]});
 const ids=new Set(hits.map(hit=>hit.properties.segmentId));
 if(ids.size!==1)return;
 const [id]=ids;
 const segment=state.referenceAlignment.features.find(feature=>feature.id===id);
 if(!segment)return;
 const [title,idLabel,snapshotLabel]=alignmentEvidenceLabels[state.locale];
 const [classification,confidence]=alignmentLabels[state.locale];
 const host=el('div');
 host.dataset.ecrlReferenceSegment=segment.id;
 host.append(el('strong',null,title),el('p',null,classification),el('p',null,confidence),
  el('p',null,idLabel+' · '+segment.id));
 const snapshot=state.alignmentSnapshot;
 if(snapshot)host.append(el('p',null,snapshotLabel+' · '+snapshot.from+' – '+snapshot.through));
 const structure=state.alignmentStructures.get(segment.id);
 if(structure){
  const label=ecrlStructureLabels[state.locale][{tunnel:0,bridge:1,viaduct:3}[structure.kind]];
  host.append(el('p',null,label+' · v'+structure.version));
 }
 const branchVersion=state.alignmentBranches.get(segment.id);
 if(branchVersion)host.append(el('p',null,ecrlBranchLabels[state.locale]+' · v'+branchVersion));
 const source=el('a',null,'OpenStreetMap way '+segment.properties.osmWayId+' · ODbL 1.0');
 source.href='https://www.openstreetmap.org/way/'+segment.properties.osmWayId;
 source.target='_blank';source.rel='noopener noreferrer';
 host.append(source);
 closeReferenceContext();
 state.popup?.remove();
 const {clientWidth,clientHeight}=map.getCanvas();
 const maxWidth=Math.min(280,Math.floor(clientWidth*0.74));
 const vertical=y>=(clientHeight-2)/2?'bottom':'top';
 const horizontal=x<maxWidth/2?'-left':x>clientWidth-maxWidth/2?'-right':'';
 const popup=new maplibregl.Popup({
  anchor:vertical+horizontal,className:'p01-v7-alignment-popup',maxWidth:maxWidth+'px',focusAfterOpen:false
 }).setLngLat(event.lngLat).setDOMContent(host).addTo(map);
 state.popup=popup;
 requestAnimationFrame(()=>{
  if(state.popup!==popup)return;
  const {top,bottom}=popup.getElement().getBoundingClientRect();
  if(top<8)window.scrollBy(0,Math.floor(top-8));
  else if(bottom>window.innerHeight-8)window.scrollBy(0,Math.ceil(bottom-window.innerHeight+8));
 });
}
function showPopup(point){
 if(!state.map)return;
 if(state.popup)state.popup.remove();
 const route=state.manifest.find(r=>r.id===point.routeId);
 const container=el('div');
 container.append(el('strong',null,point.name),el('p',null,route.label+(point.code?' · '+point.code:'')),
  el('p',null,point.provenance?.startsWith('OFFICIAL_KTMB_GTFS')?
  'KTMB GTFS rasmi · koordinat hentian, bukan geometri trek':point.provenance?.startsWith('SECONDARY_ARCGIS_KTM')?
  'GIS awam sekunder · titik stesen, bukan pengukuran operasi':tr('source')));
 const transfers=integration.transfersFor(point,state.manifest,core.interchangeRegistry,core.normalise);
 if(transfers.length){
  const shared=el('div','shared-services');shared.append(el('strong',null,tr('transfer')));
  for(const {route:service,stop,relation} of transfers){
   const btn=el('button','service-change',service.label+
    (relation==='PEDESTRIAN_CONNECTION'?' · walk':''));
   const dot=el('span','swatch');dot.style.background=service.color;
   btn.prepend(dot);btn.onclick=()=>focusStation(service.id,stop.id);
   shared.append(btn);
  }
  container.append(shared);
 }
 state.popup=new maplibregl.Popup({offset:15,maxWidth:'300px'}).setLngLat(point.coordinates).setDOMContent(container).addTo(state.map);
}
function fitOnce(){
 if(state.zoomDone||!state.mapReady)return;
 if(state.category!=='ECRL'&&state.pending>0)return;
 const coords=state.category==='ECRL'?state.ecrlStations.map(f=>f.geometry.coordinates):
  [...state.points.values()].filter(p=>selectedRoutes().some(r=>r.id===p.routeId)).map(p=>p.coordinates);
 if(!coords.length)return;
 if(coords.length===1){
  state.map.easeTo({center:coords[0],zoom:10,duration:320});state.zoomDone=true;return;
 }
 const minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),
 minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1]));
 state.map.fitBounds([[minX,minY],[maxX,maxY]],{padding:45,maxZoom:12,duration:400});
 state.zoomDone=true;
}
function reserveAttributionSpace(container){
 const shell=container.closest('.mapbox');
 const actions=shell.querySelector('.p01-v7-map-actions');
 const corner=container.querySelector('.maplibregl-ctrl-bottom-right');
 const observer=new ResizeObserver(()=>{
  const control=corner.querySelector('.maplibregl-ctrl-attrib');
  if(!control)return;
  const credit=control.getBoundingClientRect();
  const toolbar=actions.getBoundingClientRect();
  const sharesWidth=credit.left<toolbar.right+8&&credit.right>toolbar.left-8;
  const clearance=sharesWidth?Math.ceil(container.getBoundingClientRect().bottom-credit.top)+8:0;
  shell.style.setProperty('--p01-attribution-clearance',clearance+'px');
 });
 observer.observe(container);
 observer.observe(corner);
 observer.observe(actions);
}
function startMap(){
 try{
  state.map=new maplibregl.Map({container:'map',style:styleURL(),center:[101.69,3.13],zoom:10.1,
   attributionControl:{compact:true}});
  reserveAttributionSpace(state.map.getContainer());
  state.map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  state.map.on('movestart',e=>{if(e.originalEvent)state.zoomDone=true});
  state.map.on('style.load',()=>{
   state.basemapLabelOpacity.clear();
   state.mapReady=true;state.networkError=false;
   // style.load is earlier than isStyleLoaded() on some MapLibre builds.
   // A second safe layer-install gate runs on load/idle.
   updateMapLayer();showStatus();
  });
  state.map.on('load',()=>{
   state.mapReady=true;updateMapLayer();fitOnce();showStatus();
  });
  state.map.on('idle',()=>{
    // Safari/WebKit and Chromium can reach loaded style without a second 'load'
    // event after setStyle(). Never gate recovery on stale mapReady=false.
    if(state.map.isStyleLoaded()){
     state.mapReady=true;
     const missing=state.manifest.some(route=>
      !state.map.getSource(srcId(route.id))||!state.map.getLayer(layerId(route.id)));
     const missingEcrl=(state.ecrlStations.length&&!state.map.getLayer(ecrlMarker))||
      (state.ecrlLoops.length&&!state.map.getLayer(ecrlLoopMarker))||
      (state.referenceAlignment?.features.length&&!state.map.getLayer(ecrlReferenceLine));
     if((state.points.size&&missing)||missingEcrl){updateMapLayer();fitOnce();}
    }
    showStatus();
   });
   state.map.on('error',()=>{if(!state.mapReady){state.networkError=true;showStatus()}});
  state.map.on('click',e=>{
   if(!state.mapReady)return;
   const layers=[ecrlLabel,ecrlMarker,ecrlLoopMarker,...state.manifest.map(r=>layerId(r.id))].filter(id=>state.map.getLayer(id));
   const hits=layers.length?state.map.queryRenderedFeatures([[e.point.x-11,e.point.y-11],[e.point.x+11,e.point.y+11]],{layers}):[];
   const references=hits.filter(hit=>[ecrlMarker,ecrlLabel,ecrlLoopMarker].includes(hit.layer.id));
   const byDistance=hit=>{
    const {x,y}=state.map.project(hit.geometry.coordinates);
    return Math.hypot(x-e.point.x,y-e.point.y);
   };
   const reference=references.sort((a,b)=>byDistance(a)-byDistance(b))[0];
   if(reference){
    const asset=state.ecrlPublic.find(row=>row.assetId===reference.properties.assetId);
    if(asset)selectEcrlAsset(asset,$('ecrl-context-open'),false);
    return;
   }
   const hit=hits[0];
   const point=hit&&findGeo(hit.properties.routeId,hit.properties.id);
   if(!point){showAlignmentEvidence(e);return;}
   closeReferenceContext();
   state.selected=point.routeId;state.railFocus=true;buildRoutes();buildLineup();applyVisibility();showPopup(point);
  });
 }catch(e){state.networkError=true;showStatus()}
}
function styleURL(){return 'https://tiles.openfreemap.org/styles/'+(state.theme==='dark'?'dark':'positron')}
function reset(){
 state.selected='mrt-kajang';$('search').value='';$('search-results').hidden=true;
 setCategory('ECRL');
}
async function fetchRoute(route){
 if(route.decoder?.startsWith('KTM_'))return ktm.fetchRoute(route);
 if(route.decoder)return integration.fetchRoute(route);
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
async function loadReferenceAlignment(){
 const retry=state.referenceAlignmentStatus==='error';
 state.referenceAlignmentStatus='loading';
 showStatus();
 try{
  const {geometry,snapshot,structures,branches}=await window.MRS10P01MapCore.loadPublicReferenceAlignment(retry);
  state.referenceAlignment=geometry;state.alignmentSnapshot=snapshot;
  state.alignmentStructures=structures;state.alignmentBranches=branches;
  state.referenceAlignmentStatus='ready';
  buildLegend();updateMapLayer();
 }catch{
  state.referenceAlignmentStatus='error';
 }
 showStatus();
}
async function loadAssetIdentity(){
 const retry=state.assetIdentityStatus==='error';
 state.assetIdentityStatus='loading';
 showStatus();
 try{
  const mapCore=window.MRS10P01MapCore;
  const records=await mapCore.loadPublicAssetIdentity(retry);
  const localities=window.RailwayCorridorReference??[];
  state.ecrlStations=mapCore.publicStationReferences(records,localities);
  state.ecrlLoops=mapCore.publicPassingLoopReferences(records,localities);
  state.ecrlPublic=records;
  state.assetIdentityStatus='ready';
  buildLegend();renderReferenceContext();updateSearch();updateMapLayer();fitOnce();
  const linkedAsset=records.find(asset=>asset.assetId===linkedAssetId);
  linkedAssetId=null;
  if(linkedAsset&&!state.activeReference)openReferenceContext(linkedAsset,$('ecrl-context-open'));
 }catch{
  state.assetIdentityStatus='error';
 }
 showStatus();
}
function init(){
 try{state.manifest=[...core.loadManifest(kl,ampang),...integration.routes(),...ktm.routes()]}catch(e){$('map-error').textContent='Registry: '+e.message;return}
 $('search').addEventListener('input',()=>{
  linkedAssetId=null;
  updateSearch();
 });
 function dismissReference(){
  const opener=state.referenceOpener;
  closeReferenceContext();
  updateSearch();
  opener?.focus();
 }
 $('ecrl-context-open').addEventListener('click',event=>{
  if(state.activeReference){dismissReference();return}
  const first=state.ecrlPublic[0];
  if(first)openReferenceContext({section:first.section},event.currentTarget);
 });
 $('ecrl-context-back').addEventListener('click',dismissReference);
 $('ecrl-context').addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  event.preventDefault();
  dismissReference();
 });
 $('reset').addEventListener('click',reset);
 $('language').addEventListener('click',()=>{state.locale=locales[(locales.indexOf(state.locale)+1)%4];applyLanguage();if(state.popup){state.popup.remove();state.popup=null}});
 $('theme').addEventListener('click',()=>{
  state.theme=state.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=state.theme;
  if(state.map){state.mapReady=false;state.map.setStyle(styleURL())}
  showStatus();
 });
 $('ecrl-alignment-retry').addEventListener('click',()=>{
  if(state.assetIdentityStatus==='error')void loadAssetIdentity();
  if(state.referenceAlignmentStatus==='error')void loadReferenceAlignment();
 });
 bindFullscreen();applyLanguage();startMap();void loadGIS();void loadReferenceAlignment();void loadAssetIdentity();
}
function diagnosticSnapshot(){
 const map=state.map,rows={};
 let styleLoaded=false,tilesLoaded=false,webglReady=false,rect={width:0,height:0};
 try{
  styleLoaded=!!map?.isStyleLoaded?.();
  tilesLoaded=!!map?.areTilesLoaded?.();
  const canvas=map?.getCanvas?.();
  if(canvas){
   const r=canvas.getBoundingClientRect();
   rect={width:r.width,height:r.height,backingWidth:canvas.width,backingHeight:canvas.height};
   webglReady=!!map?.painter?.context?.gl&&!map.painter.context.gl.isContextLost();
  }
  for(const route of state.manifest){
   const source=srcId(route.id),layer=layerId(route.id);
   const present=!!map?.getSource?.(source)&&!!map?.getLayer?.(layer);
   const visible=present&&map.getLayoutProperty(layer,'visibility')!=='none';
   const rendered=styleLoaded&&visible?map.queryRenderedFeatures({layers:[layer]}).length:0;
   rows[route.id]={source,layer,present,visible,rendered,matched:state.results.get(route.id)?.matched||0};
  }
 }catch(e){console.error('V7_DIAGNOSTIC_ERROR',e)}
 return Object.freeze({mapReady:state.mapReady,styleLoaded,tilesLoaded,webglReady,
  rect,perRoute:rows,renderedFeatureCount:Object.values(rows).reduce((n,r)=>n+r.rendered,0),
  layerCount:Object.values(rows).filter(r=>r.present).length,sourceMatched:state.points.size,
  ecrlReferenceLoopMarkers:state.ecrlLoops.length,ecrlAssetIdentityStatus:state.assetIdentityStatus,ecrlReferenceAlignmentStatus:state.referenceAlignmentStatus,
  ecrlReferenceFeatures:state.referenceAlignment?.features.length??0,
  mapInstances:state.map?1:0,stage:state.pending?'LOADING':'DONE',category:state.category});
}
window.MRS10V7Diagnostics=Object.freeze({snapshot:diagnosticSnapshot});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
