(function(root){'use strict';
// Consumer summary is intentionally separate from the complete engineering/source record.
const COPY={
 ms:{station:'Stesen ECRL',facility:'Aset infrastruktur',location:'Titik rujukan kawasan · bukan lokasi stesen sebenar',historic:'Rujukan perancangan EIA 2017 · bukan lokasi stesen terkini',maritime:'Rujukan kawasan pelabuhan · bukan terminal rel',noPoint:'Tiada lokasi stesen yang disahkan',type:'Jenis aset',section:'Seksyen',service:'Perkhidmatan',verified:'Identiti disahkan',partial:'Pengesahan separa',conflict:'Konflik sumber',pending:'Belum disahkan',technical:'Butiran kejuruteraan',internal:'ID teknikal dalaman',references:'Sumber & rujukan',layers:'Ketepatan data dan peta',list:'Senarai aset ECRL',passenger:'Penumpang',freight:'Kargo',future:'Perancangan masa depan',unknown:'Belum disahkan',chReference:'CH (rujukan projek)',chSafety:'CH bukan GPS atau lokasi landasan disahkan',loop:'Crossing Loop · rujukan sejarah',plList:'PL01–PL07 · CH',plNoPoint:'Lokasi PL belum disahkan · hanya rujukan CH',yardRef:'Rujukan yard Kerteh (petak jingga)',yardAccuracy:'Kawasan rel sejarah berasaskan OSM · bukan End Lane ECRL yang disahkan',yardEndUnknown:'Titik hujung rel / loading bay / transit lane: BELUM DISAHKAN',alignmentPanel:'Jajaran dan sisihan · status bukti',alignmentNoLine:'Belum ada geometri as-built yang layak untuk paparan fizikal.',alignmentPL:'PL yang menunggu lokasi disahkan',alignmentSpurs:'Sambungan sisihan (skematik)',alignmentSource:'Rujukan kerajaan / pengendali',alignmentWarning:'Tiada pin PL atau hujung rel akan dijana daripada CH, peta skematik atau titik kawasan.',yardEnd:'End Lane',yardType:'Kawasan yard rel (rujukan)',yardInterfaceType:'Antaramuka muatan kargo',portArea:'Rujukan kawasan pelabuhan rasmi · bukan titik hujung rel',portSpur:'Sambungan kargo ECRL',terminalUnits:'Terminal pelabuhan',terminalPending:'Loading bay / transit lane / titik hujung rel: BELUM DISAHKAN',portLength:'Panjang spurline rujukan (rancangan)',portRailStatus:'Spurline dalam pembangunan · bukan operasi penumpang',portOperator:'Pengendali'},
 en:{station:'ECRL station',facility:'Infrastructure asset',location:'Area reference · not the actual station location',historic:'2017 EIA planning reference · not the current station site',maritime:'Port area reference · not a rail terminal',noPoint:'No verified station location',type:'Asset type',section:'Section',service:'Service',verified:'Identity verified',partial:'Partially verified',conflict:'Source conflict',pending:'Unverified',technical:'Engineering details',internal:'Internal technical ID',references:'Sources & references',layers:'Data and map accuracy',list:'ECRL assets',passenger:'Passenger',freight:'Freight',future:'Future proposal',unknown:'Not verified',chReference:'CH (project reference)',chSafety:'CH is not GPS or verified track location',loop:'Crossing Loop · historical reference',plList:'PL01–PL07 · CH',plNoPoint:'PL position unverified · CH reference only',yardRef:'Kerteh yard reference (amber square)',yardAccuracy:'Historical OSM railway land area · not a verified ECRL End Lane',yardEndUnknown:'Rail endpoint / loading bay / transit lane: UNVERIFIED',alignmentPanel:'Alignment & spurs · evidence status',alignmentNoLine:'No qualifying as-built geometry for the physical track overlay.',alignmentPL:'PL locations awaiting verification',alignmentSpurs:'Spur interfaces (schematic)',alignmentSource:'Government / operator references',alignmentWarning:'No PL or rail-end pins can be generated from CH, schematics or locality points.',yardEnd:'End Lane',yardType:'Railway yard area (reference)',yardInterfaceType:'Cargo loading interface',portArea:'Official port-area reference · not a rail track endpoint',portSpur:'ECRL cargo connection',terminalUnits:'Port terminals',terminalPending:'Loading bay / transit lane / rail endpoint: UNVERIFIED',portLength:'Proposed spur length (reference)',portRailStatus:'Spurline development · not passenger service',portOperator:'Operator'},
 zh:{station:'ECRL 车站',facility:'基础设施资产',location:'区域参考点 · 非车站实际位置',historic:'2017 年环评规划位置 · 非现行车站地点',maritime:'港口区域参考点 · 非铁路货运终点站',noPoint:'没有已核实的车站位置',type:'资产类型',section:'区段',service:'服务',verified:'车站身份已核实',partial:'部分已核实',conflict:'来源存在冲突',pending:'尚未核实',technical:'工程详细信息',internal:'内部技术编号',references:'来源与参考资料',layers:'数据与地图准确性',list:'ECRL 资产',passenger:'客运',freight:'货运',future:'未来规划',unknown:'尚未核实',chReference:'CH（项目参考）',chSafety:'CH 不是 GPS 或已核实轨道位置',loop:'会让线 · 历史参考',plList:'PL01–PL07 · CH',plNoPoint:'PL 位置未核实 · 仅显示 CH 参考',yardRef:'Kerteh 货场参考（橙色方框）',yardAccuracy:'OSM 历史铁路用地 · 非已核实的 ECRL 终点线',yardEndUnknown:'轨道终点／装卸区／停放线：尚未核实',alignmentPanel:'线路与支线 · 证据状态',alignmentNoLine:'尚无符合条件的竣工测绘轨道数据。',alignmentPL:'待核实位置的会让线',alignmentSpurs:'支线连接（示意）',alignmentSource:'政府／运营商资料',alignmentWarning:'不能根据里程、示意图或区域点生成会让线及轨道终点。',yardEnd:'终点线',yardType:'铁路货场区域（参考）',yardInterfaceType:'货物装卸接口',portArea:'官方港区参考点 · 非铁路终点',portSpur:'ECRL 货运连接',terminalUnits:'港口码头',terminalPending:'装卸场／会让线／铁路终点：尚未核实',portLength:'规划支线长度（参考）',portRailStatus:'支线建设中 · 非客运服务',portOperator:'运营商'},
 th:{station:'สถานี ECRL',facility:'สินทรัพย์โครงสร้างพื้นฐาน',location:'จุดอ้างอิงพื้นที่ · ไม่ใช่ตำแหน่งสถานีจริง',historic:'จุดอ้างอิงแผน EIA ปี 2017 · ไม่ใช่ที่ตั้งสถานีปัจจุบัน',maritime:'จุดอ้างอิงพื้นที่ท่าเรือ · ไม่ใช่สถานีรถไฟ',noPoint:'ยังไม่มีพิกัดสถานีที่ยืนยันแล้ว',type:'ประเภทสินทรัพย์',section:'ช่วง',service:'บริการ',verified:'ยืนยันตัวตนสถานี',partial:'ยืนยันบางส่วน',conflict:'แหล่งข้อมูลขัดแย้ง',pending:'ยังไม่ยืนยัน',technical:'รายละเอียดทางวิศวกรรม',internal:'รหัสเทคนิคภายใน',references:'แหล่งข้อมูลและเอกสารอ้างอิง',layers:'ความถูกต้องของข้อมูลและแผนที่',list:'สินทรัพย์ ECRL',passenger:'ผู้โดยสาร',freight:'สินค้า',future:'แผนในอนาคต',unknown:'ยังไม่ยืนยัน',chReference:'CH (อ้างอิงโครงการ)',chSafety:'CH ไม่ใช่ GPS หรือพิกัดรางที่ยืนยัน',loop:'ทางหลีก · อ้างอิงประวัติ',plList:'PL01–PL07 · CH',plNoPoint:'ตำแหน่ง PL ยังไม่ยืนยัน · อ้างอิง CH เท่านั้น',yardRef:'อ้างอิงลาน Kerteh (กรอบสี่เหลี่ยม)',yardAccuracy:'พื้นที่ทางรถไฟเดิมจาก OSM · ไม่ใช่รางปลายทาง ECRL ที่ยืนยันแล้ว',yardEndUnknown:'ปลายราง/จุดขนถ่าย/รางพัก: ยังไม่ยืนยัน',alignmentPanel:'แนวเส้นทางและทางแยก · หลักฐาน',alignmentNoLine:'ยังไม่มีข้อมูลสำรวจแนวรางจริงที่ผ่านการตรวจสอบ',alignmentPL:'ทางหลีกที่รอตรวจสอบตำแหน่ง',alignmentSpurs:'ทางเชื่อมต่อ (แผนผัง)',alignmentSource:'เอกสารรัฐ / ผู้ดำเนินการ',alignmentWarning:'ห้ามสร้างหมุดทางหลีกหรือปลายรางจาก CH แผนผัง หรือจุดอ้างอิงพื้นที่',yardEnd:'ปลายราง',yardType:'พื้นที่ลานรถไฟ (อ้างอิง)',yardInterfaceType:'จุดเชื่อมต่อขนส่งสินค้า',portArea:'จุดอ้างอิงพื้นที่ท่าเรือทางการ · ไม่ใช่ปลายทางรถไฟ',portSpur:'เส้นทางขนส่งสินค้า ECRL',terminalUnits:'ท่าเรือ',terminalPending:'จุดโหลดสินค้า/รางรอง/ปลายราง: ยังไม่ยืนยัน',portLength:'ระยะทางแยกตามแผน (อ้างอิง)',portRailStatus:'อยู่ระหว่างพัฒนา · ไม่ใช่บริการผู้โดยสาร',portOperator:'ผู้ดำเนินการ'}
};
function create(adapter,{getLocale,getCategory,onSelect,onFlags}){
 const $=id=>document.getElementById(id);
 const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!=null)n.textContent=String(value);if(cls)n.className=cls;return n};
 const t=k=>adapter.t(getLocale(),k), ui=k=>(COPY[getLocale()]||COPY.en)[k]||COPY.en[k]||k;
 function summary(host,text){const s=el('summary',text);host.append(s);return s}
 function serviceLabel(value){
  if(value==='PASSENGER_FREIGHT')return ui('passenger')+' + '+ui('freight');
  if(value==='PASSENGER')return ui('passenger');
  if(value==='FUTURE_PASSENGER')return ui('future')+' · '+ui('passenger');
  if(value==='UNKNOWN')return ui('unknown');
  return value||ui('unknown');
 }
 function field(host,label,value){const row=el('p',null,'ecrl-fact');row.append(el('span',label),el('b',value));host.append(row)}
 function referenceLabel(ref){return ref?.kind==='HISTORICAL'?ui('historic'):ref?.kind==='MARITIME'?ui('maritime'):ref?.kind==='YARD'?ui('yardAccuracy'):ref?ui('location'):ui('noPoint')}
 function render(){
  const host=$('ecrl-controls');host.hidden=getCategory()!=='ECRL';host.replaceChildren(el('strong','ECRL · '+t('title')));
  const labels={LOCALITY:t('reference'),HISTORICAL:t('legendHistoric'),MARITIME:t('legendPort'),YARD:ui('yardRef')};
  const switches=el('div',null,'ecrl-switches');
  for(const kind of Object.keys(adapter.flags)){const label=el('label'),box=el('input');box.type='checkbox';box.id='ecrl-reference-'+kind.toLowerCase();box.checked=adapter.flags[kind];box.onchange=()=>onFlags(kind,box.checked);label.append(box,document.createTextNode(labels[kind]));switches.append(label)}
  host.append(switches);
  const plGuide=el('details',null,'ecrl-chainage-guide');summary(plGuide,ui('plList'));
  plGuide.append(el('p',ui('chSafety'),'ecrl-ch-warning'));
  for(const a of adapter.loops){const btn=el('button',(a.plCode||'PL?')+' · '+(a.historicalName||'')+' · '+(a.chainageLabel||ui('unknown')),'ecrl-pl-guide-item');btn.type='button';btn.dataset.ecrlAsset=a.assetId;btn.onclick=()=>onSelect(a.assetId);plGuide.append(btn)}
  host.append(plGuide);
  const evidence=adapter.alignmentEvidence;
  const audit=el('details',null,'ecrl-alignment-readiness');summary(audit,ui('alignmentPanel'));
  audit.append(el('p',ui('alignmentNoLine'),'ecrl-audit-warning'));
  const loops=el('div',null,'ecrl-evidence-list');loops.append(el('strong',ui('alignmentPL')));
  for(const p of evidence.passingLoops){
    const a=adapter.get(p.assetId);
    const line=el('div',(p.code||'?')+' · '+(a?.chainageLabel||'CH UNKNOWN')+' · '+p.placement,'ecrl-evidence-row');
    loops.append(line);
  }
  const spurs=el('div',null,'ecrl-evidence-list');spurs.append(el('strong',ui('alignmentSpurs')));
  for(const item of evidence.spurs){
    const line=el('div',(item.name||item.code)+' · '+item.geometryStatus,'ecrl-evidence-row');
    spurs.append(line);
  }
  audit.append(loops,spurs,el('p',ui('alignmentWarning'),'ecrl-audit-warning'));
  const citations=el('details');summary(citations,ui('alignmentSource'));
  for(const [id,src] of Object.entries(evidence.sources)){const p=el('p'),link=el('a',id);
    link.href=src.url;link.target='_blank';link.rel='noopener noreferrer';
    p.append(link,document.createTextNode(' · '+src.kind));citations.append(p)}
  audit.append(citations);host.append(audit);
  const assets=$('ecrl-assets');assets.replaceChildren();
  const list=el('details',null,'ecrl-asset-list');summary(list,ui('list')+' ('+adapter.assets.length+')');
  for(const a of [...adapter.assets].sort((a,b)=>(a.chainageKm??Infinity)-(b.chainageKm??Infinity))){const btn=el('button',(a.stationCode||a.plCode?(a.stationCode||a.plCode)+' · ':'')+(a.officialName||a.historicalName)+(a.chainageLabel?' · '+a.chainageLabel:'')+' · '+a.assetType+' · '+a.verificationStatus);btn.type='button';btn.dataset.ecrlAsset=a.assetId;btn.onclick=()=>onSelect(a.assetId);list.append(btn)}
  assets.append(list);
 }
 function content(id){
  const a=adapter.get(id);if(!a)return null;
  const host=el('div',null,'ecrl-intelligence');host.dataset.ecrlAsset=id;
  const ref=adapter.reference(id);
  host.append(el('span',a.assetType==='STATION'?ui('station'):a.plCode?ui('loop'):ui('facility'),'ecrl-kicker'));
  host.append(el('strong',(a.stationCode||a.plCode?(a.stationCode||a.plCode)+' · ':'')+(a.officialName||a.historicalName),'ecrl-name'));
  host.append(el('p',t('notOperational'),'ecrl-status'));
  host.append(el('p',a.plCode?ui('plNoPoint'):a.portTerminals?ui('portArea'):referenceLabel(ref),'ecrl-accuracy'));
  const key=el('div',null,'ecrl-key-facts');
  const isKerteh=a.assetId==='ecrl-yard-kerteh-petronas'||a.assetId==='ecrl-kerteh-petronas-loading-interface';
  field(key,ui('type'),isKerteh?(a.assetType==='HISTORICAL_RAIL_YARD_AREA'?ui('yardType'):ui('yardInterfaceType')):a.assetType);
  if(a.section)field(key,ui('section'),a.section);
   // Proposed freight yard is a scheme reference, never an operational facility.
   if(a.assetType==='FREIGHT_YARD'&&a.assetStatus==='PROPOSED_OFFICIAL')field(key,t('status'),a.assetStatus);
  if(a.chainageLabel)field(key,ui('chReference'),a.chainageLabel);
   // Historical PL chainage is not a surveyed track position.
   if(a.plCode&&!ref)field(key,t('geometry'),ui('unknown')+' · UNKNOWN');
  if(a.assetType==='STATION')field(key,ui('service'),serviceLabel(a.serviceType));
  if(a.portTerminals){field(key,ui('portSpur'),ui('portRailStatus'));field(key,ui('portOperator'),a.operatorName);field(key,ui('terminalUnits'),a.portTerminals.map(p=>p.code).join(' · '));}
  if(isKerteh){field(key,ui('portOperator'),'PETRONAS · OSM');field(key,ui('yardEnd'),ui('unknown'))}
  const validation=a.verificationStatus==='CONFIRMED'?ui('verified'):a.verificationStatus==='SOURCE_CONFLICT'?ui('conflict'):a.verificationStatus==='PARTIAL'?ui('partial'):ui('pending');
  field(key,t('verification'),validation+(a.verificationStatus==='CONFIRMED'?' · '+t('confirmed'):''));
  host.append(key);
  const tech=el('details',null,'ecrl-engineering');summary(tech,ui('technical'));
   // Keep raw provenance inside explicit disclosure across responsive CSS.
   const engineeringBody=el('div',null,'ecrl-engineering-body');
   // Lazy mount: closed Consumer popup has no raw technical provenance in its DOM.
   // A summary click mounts before native opening; closing removes it synchronously.
   tech.querySelector('summary').addEventListener('click',()=>{
    if(tech.open)engineeringBody.remove();
    else tech.append(engineeringBody);
   });
   tech.addEventListener('toggle',()=>{
    if(tech.open&&!engineeringBody.isConnected)tech.append(engineeringBody);
    if(!tech.open&&engineeringBody.isConnected)engineeringBody.remove();
   });
  for(const [label,value] of [['status',a.assetStatus],['verification',a.verificationStatus],['service',a.serviceType],['geometry',a.geometryProvenance||a.geometryType],['chainage',a.chainageStartKm==null&&a.chainageEndKm==null?null:[a.chainageStartKm??'UNKNOWN',a.chainageEndKm??'UNKNOWN'].join(' – ')],['trackCount',a.trackCount]]){
   engineeringBody.append(el('p',t(label)+': '+(value??(t('unknown')+' · UNKNOWN'))));
  }
  if(a.chainageLabel)engineeringBody.append(el('p',ui('chReference')+': '+a.chainageLabel+' · '+a.chainageStatus+' · '+a.chainageProvenance+' · '+ui('chSafety')));
  engineeringBody.append(el('p',ui('internal')+': '+a.assetId),el('p',t('noTrack')));
  if(ref)engineeringBody.append(el('p','REFERENCE_ONLY · '+ref.kind+' · '+ref.sourceId));
  if(a.portTerminals){
   engineeringBody.append(el('p',ui('terminalPending')+' · PENDING_GEOMETRY'));
   for(const port of a.portTerminals){
    const summary=port.code+' · '+port.name+' · '+port.connectionStatus;
    engineeringBody.append(el('p',summary+(port.plannedSpurLengthKm==null?'':' · '+ui('portLength')+': '+port.plannedSpurLengthKm.toFixed(1)+' km')+
    ' · railEnd: UNKNOWN · loadingBay: UNKNOWN · transitLane: UNKNOWN'));
   }
   const link=adapter.portCatalogue.logicalInterfaces.find(x=>x.assetId===id);
   if(link)engineeringBody.append(el('p',link.interface+' · '+link.status+' · '+link.corridorContext+' · physicalLineString: NULL'));
  }
  if(id==='ecrl-stn-16')engineeringBody.append(el('p','PLANNED_CONNECTION · LRT KJ1 Gombak · '+t('notOperational')));
  for(const rel of adapter.registry.topology.filter(r=>r.from===id||r.to===id))engineeringBody.append(el('p',rel.relation+' · '+rel.status+' · '+(rel.from===id?rel.to:rel.from)));
  for(const conflict of a.conflicts||[])engineeringBody.append(el('p',t('conflict')+' · SOURCE_CONFLICT · '+conflict.field+' · '+conflict.sourceIds.join(' / ')+' · '+conflict.reason));
  if(isKerteh){engineeringBody.append(el('p',ui('type')+': '+a.assetType));engineeringBody.append(el('p',ui('portOperator')+': '+a.operatorName));engineeringBody.append(el('p',ui('yardEndUnknown')));engineeringBody.append(el('p','NO_SIDING_GEOMETRY · NO_END_LANE_COORDINATE · NO_ROAD_RESIDENTIAL_CADASTRE_AUDIT'));engineeringBody.append(el('p','Source: OSM landuse=railway area only; not an ECRL as-built loading or storage lane.'));}
  if(a.notes)engineeringBody.append(el('p',a.notes));
     host.append(tech);
  const sources=el('details',null,'ecrl-sources');summary(sources,ui('references'));
  const ids=[...new Set([...(a.sourceIds||[]),...(ref?[ref.sourceId]:[])])];
  for(const sid of ids){const source=adapter.registry.sources[sid];if(!source)continue;const p=el('p'),link=el('a',sid+' · '+source.kind);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';p.append(link,el('span',' · '+source.revision));sources.append(p)}host.append(sources);
  return host;
 }
 return {render,content};
}
root.MRS10ECRLIntegrationUI=Object.freeze({create});
})(window);
