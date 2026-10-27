(function(g){'use strict';
const dict={
ms:{
title:'ECRL · Risikan Infrastruktur',subtitle:'Peta pendidikan berasaskan sumber · bukan peta operasi',
search:'Cari stesen atau aset',theme:'Tema',reset:'Set semula',assets:'Aset',all:'Semua',c2:'C2 / Pelabuhan Klang',
station:'Stesen',crossing:'Crossing loop',facility:'Kemudahan',track:'Landasan',tunnel:'Terowong',yard:'Depoh kargo',ports:'Pelabuhan',
legend:'Petunjuk',regular:'Stesen (bulat)',verified:'Crossing loop disahkan (petak)',pending:'Loop belum disahkan (petak putus)',proposed:'Cadangan',notPlot:'Tiada titik sah — pilih daripada senarai',reference:'Titik rujukan kawasan, bukan koordinat stesen sebenar',
status:'Status',verification:'Pengesahan',assetType:'Jenis aset',section:'Seksyen',classification:'Klasifikasi',service:'Perkhidmatan',
sources:'Sumber',sourceRevision:'Versi sumber',geometry:'Geometri',chainage:'Chainage',trackCount:'Bilangan landasan',gauge:'Tolok rel',speed:'Maklumat kelajuan',
speedDesign:'Kelajuan reka bentuk',speedPermitted:'Kelajuan operasi dibenarkan',speedApproach:'Kelajuan pendekatan stesen',speedThrough:'Kelajuan melalui stesen',speedCurve:'Had kelajuan lengkung',tsr:'Sekatan kelajuan sementara (TSR)',projectOnly:'Rujukan projek sahaja: 160 km/j penumpang · 80 km/j kargo (bukan had stesen)',
none:'TIDAK TERSEDIA',pendingStatus:'MENUNGGU PENGESAHAN',partial:'SEPARA',confirmed:'DISAHKAN (identiti sahaja)',planned:'DALAM PERANCANGAN',proposedOfficial:'CADANGAN RASMI',conflict:'KONFLIK SUMBER',
note:'Nota',select:'Pilih penanda atau aset untuk butiran',close:'Tutup',back:'Tutup panel',list:'Senarai aset',scope:'Fokus C2',noTrack:'Tiada geometri landasan fizikal disahkan; garisan sengaja tidak dilukis.',noLoops:'Tiada crossing loop yang disahkan untuk diplot.',stationIntel:'Station Intelligence',loopIntel:'Crossing Loop Intelligence',infraIntel:'Infrastructure Intelligence',freightIntel:'Freight & Connectivity Intelligence',
unknown:'TIDAK DIKETAHUI',referenceOnly:'LOKASI RUJUKAN',noPoint:'TIDAK ADA TITIK SAH',loading:'Memuatkan peta…',mapError:'Basemap gagal dimuatkan; senarai aset masih boleh digunakan.',
passenger:'Penumpang',passengerFreight:'Penumpang & kargo',futurePassenger:'Penumpang (masa hadapan)',
historicRef:"SKIM EIA 2017 (BUKAN STESEN TERKINI)",portArea:"KAWASAN PELABUHAN (BUKAN TREK ECRL)",proxyArea:"KAWASAN PUNCAK ALAM SAHAJA; TAPAK YARD TIDAK DIKETAHUI",legendHistoric:"Rujukan EIA 2017 (bulat jingga putus)",legendPort:"Rujukan kawasan pelabuhan (bulat ungu putus)",referenceWarning:"AMARAN: Koordinat EIA 2017 ialah cadangan sejarah; mungkin berbeza daripada stesen C2 semasa. Bukan koordinat landasan atau peron yang disahkan.",portReferenceWarning:"Titik ini rujukan grid kemudahan maritim PKA, BUKAN terminal atau trek ECRL.",yardFocusWarning:"Fokus ini ialah lokasi cadangan Puncak Alam EIA 2017 sahaja, BUKAN lokasi freight yard.",referenceBadge:"Rujukan kawasan sahaja",
 basemapQuiet:"Jalan malap",basemapStandard:"Jalan biasa",basemapSwitch:"Tukar gaya asas peta",
notOperational:'Belum operasi awam',legal:'Sumber: MRL, Dewan Negeri Selangor dan MIDA. Koordinat rujukan lama bukan pengukuran trek. Tidak untuk pengendalian tren.'
},
en:{
title:'ECRL · Infrastructure Intelligence',subtitle:'Source-led educational map · not an operational chart',
search:'Search station or asset',theme:'Theme',reset:'Reset',assets:'Assets',all:'All',c2:'C2 / Port Klang',
station:'Station',crossing:'Crossing loop',facility:'Facility',track:'Track',tunnel:'Tunnel',yard:'Freight yard',ports:'Ports',
legend:'Legend',regular:'Station (circle)',verified:'Verified crossing loop (square)',pending:'Unverified loop (dashed square)',proposed:'Proposed',notPlot:'No valid point — select from list',reference:'Area reference point, not actual station coordinates',
status:'Status',verification:'Verification',assetType:'Asset type',section:'Section',classification:'Classification',service:'Service',
sources:'Sources',sourceRevision:'Source revision',geometry:'Geometry',chainage:'Chainage',trackCount:'Track count',gauge:'Track gauge',speed:'Speed intelligence',
speedDesign:'Design speed',speedPermitted:'Maximum permitted speed',speedApproach:'Station approach speed',speedThrough:'Station through speed',speedCurve:'Curve speed limit',tsr:'Temporary speed restriction (TSR)',projectOnly:'Project reference only: passenger 160 km/h · freight 80 km/h (not station limits)',
none:'NOT AVAILABLE',pendingStatus:'PENDING VALIDATION',partial:'PARTIAL',confirmed:'CONFIRMED (identity only)',planned:'PLANNED',proposedOfficial:'OFFICIALLY PROPOSED',conflict:'SOURCE CONFLICT',
note:'Note',select:'Select a marker or asset for details',close:'Close',back:'Close panel',list:'Asset list',scope:'C2 focus',noTrack:'No verified physical track geometry; lines deliberately omitted.',noLoops:'No verified crossing-loop locations to plot.',stationIntel:'Station Intelligence',loopIntel:'Crossing Loop Intelligence',infraIntel:'Infrastructure Intelligence',freightIntel:'Freight & Connectivity Intelligence',
unknown:'UNKNOWN',referenceOnly:'REFERENCE LOCATION',noPoint:'NO VALID POINT',loading:'Loading map…',mapError:'Basemap failed to load; asset list remains accessible.',
passenger:'Passenger',passengerFreight:'Passenger & freight',futurePassenger:'Future passenger',
historicRef:"2017 EIA PLAN (NOT CURRENT STATION SITE)",portArea:"MARITIME PORT AREA (NOT ECRL TRACK)",proxyArea:"PUNCAK ALAM AREA ONLY; YARD SITE UNKNOWN",legendHistoric:"2017 EIA site reference (dashed orange circle)",legendPort:"Maritime port-area reference (dashed purple circle)",referenceWarning:"WARNING: 2017 EIA coordinates represent an old plan and may differ from current C2 sites. Not surveyed station, track or platform GIS.",portReferenceWarning:"The point is a PKA maritime facility grid reference, NOT an ECRL track, junction or rail terminus.",yardFocusWarning:"Map focuses on the historical 2017 Puncak Alam proposal only, NOT the freight yard itself.",referenceBadge:"Area reference only",
 basemapQuiet:"Muted roads",basemapStandard:"Standard roads",basemapSwitch:"Switch basemap style",
notOperational:'Not publicly operating',legal:'Sources: MRL, Selangor State Assembly and MIDA. Legacy reference coordinates are not track surveys. Not for train operation.'
},
zh:{
title:'东海岸铁路 · 基础设施信息',subtitle:'有来源依据的教育地图 · 非运营行车图',
search:'搜索车站或设施',theme:'主题',reset:'重置',assets:'设施',all:'全部',c2:'C2 / 巴生港',
station:'车站',crossing:'会让线',facility:'设施',track:'轨道',tunnel:'隧道',yard:'货运场',ports:'港口',
legend:'图例',regular:'车站（圆形）',verified:'已核实会让线（方形）',pending:'未核实会让线（虚线方形）',proposed:'拟议',notPlot:'无有效坐标 — 请从列表选择',reference:'区域参考点，并非车站实际坐标',
status:'状态',verification:'核实状态',assetType:'设施类型',section:'区段',classification:'分类',service:'服务类型',
sources:'资料来源',sourceRevision:'来源版本',geometry:'地理形状',chainage:'里程标',trackCount:'轨道数量',gauge:'轨距',speed:'速度信息',
speedDesign:'设计速度',speedPermitted:'最高允许速度',speedApproach:'进站速度',speedThrough:'通过车站速度',speedCurve:'曲线限速',tsr:'临时限速 (TSR)',projectOnly:'仅项目级参考：客运 160 km/h · 货运 80 km/h（不是车站限速）',
none:'暂无资料',pendingStatus:'待核实',partial:'部分核实',confirmed:'已核实（仅设施身份）',planned:'规划中',proposedOfficial:'官方拟议',conflict:'来源冲突',
note:'备注',select:'选择地图标记或设施查看详情',close:'关闭',back:'关闭面板',list:'设施列表',scope:'C2 优先',noTrack:'未取得已核实的实际轨道地理数据，因此不绘制轨道线。',noLoops:'目前没有可以定位的已核实会让线。',stationIntel:'车站信息',loopIntel:'会让线信息',infraIntel:'基础设施信息',freightIntel:'货运与连接信息',
unknown:'未知',referenceOnly:'参考位置',noPoint:'无有效坐标',loading:'正在加载地图…',mapError:'底图加载失败，仍可使用设施列表。',
passenger:'客运',passengerFreight:'客运及货运',futurePassenger:'未来客运',
historicRef:"2017年EIA历史规划点（非现行车站）",portArea:"港区海事设施（非ECRL铁路）",proxyArea:"仅参考Puncak Alam地区，货运场位置未知",legendHistoric:"2017年EIA规划参考点（橙色虚线圆）",legendPort:"海港区域参考点（紫色虚线圆）",referenceWarning:"注意：2017年EIA坐标属于历史方案，可能与现行C2站址不同，并非实际站台、车站或轨道测量坐标。",portReferenceWarning:"此点来自巴生港务局海事设施区位网格，并非ECRL轨道、道岔或铁路终点。",yardFocusWarning:"地图仅聚焦2017年Puncak Alam历史规划点，并非货运场位置。",referenceBadge:"仅供区域参考",
 basemapQuiet:"弱化道路",basemapStandard:"普通道路",basemapSwitch:"切换底图样式",
notOperational:'尚未公开运营',legal:'来源：MRL、雪兰莪州议会及 MIDA。历史参考坐标不属于轨道测量数据，不得用于列车运营。'
},
th:{
title:'ECRL · ข้อมูลโครงสร้างพื้นฐาน',subtitle:'แผนที่การศึกษาที่อ้างอิงแหล่งข้อมูล · ไม่ใช่แผนที่ปฏิบัติการ',
search:'ค้นหาสถานีหรือทรัพย์สิน',theme:'ธีม',reset:'รีเซ็ต',assets:'ทรัพย์สิน',all:'ทั้งหมด',c2:'C2 / ท่าเรือกลัง',
station:'สถานี',crossing:'ทางหลีก',facility:'สิ่งอำนวยความสะดวก',track:'ทางรถไฟ',tunnel:'อุโมงค์',yard:'ลานขนส่งสินค้า',ports:'ท่าเรือ',
legend:'สัญลักษณ์',regular:'สถานี (วงกลม)',verified:'ทางหลีกยืนยันแล้ว (สี่เหลี่ยม)',pending:'ทางหลีกยังไม่ยืนยัน (เส้นประ)',proposed:'เสนอ',notPlot:'ไม่มีพิกัดที่ยืนยัน — เลือกจากรายการ',reference:'พิกัดอ้างอิงพื้นที่ ไม่ใช่พิกัดสถานีจริง',
status:'สถานะ',verification:'การตรวจสอบ',assetType:'ประเภททรัพย์สิน',section:'ช่วงทาง',classification:'ประเภท',service:'บริการ',
sources:'แหล่งข้อมูล',sourceRevision:'ฉบับแหล่งข้อมูล',geometry:'ข้อมูลภูมิศาสตร์',chainage:'หลักกิโลเมตร',trackCount:'จำนวนทาง',gauge:'ความกว้างราง',speed:'ข้อมูลความเร็ว',
speedDesign:'ความเร็วออกแบบ',speedPermitted:'ความเร็วสูงสุดที่อนุญาต',speedApproach:'ความเร็วเข้าสถานี',speedThrough:'ความเร็วผ่านสถานี',speedCurve:'จำกัดความเร็วทางโค้ง',tsr:'จำกัดความเร็วชั่วคราว (TSR)',projectOnly:'อ้างอิงระดับโครงการเท่านั้น: ผู้โดยสาร 160 กม./ชม. · สินค้า 80 กม./ชม. (ไม่ใช่ข้อจำกัดในสถานี)',
none:'ไม่มีข้อมูล',pendingStatus:'รอตรวจสอบ',partial:'ตรวจสอบบางส่วน',confirmed:'ยืนยันแล้ว (เฉพาะข้อมูลชื่อ)',planned:'วางแผน',proposedOfficial:'ข้อเสนอทางการ',conflict:'แหล่งข้อมูลขัดแย้ง',
note:'หมายเหตุ',select:'เลือกหมุดหรือทรัพย์สินเพื่อดูรายละเอียด',close:'ปิด',back:'ปิดแผง',list:'รายการทรัพย์สิน',scope:'เน้น C2',noTrack:'ไม่มีรูปทรงรางจริงที่ตรวจสอบแล้ว จึงไม่วาดเส้นทาง',noLoops:'ยังไม่มีตำแหน่งทางหลีกที่ยืนยันสำหรับแสดงบนแผนที่',stationIntel:'ข้อมูลสถานี',loopIntel:'ข้อมูลทางหลีก',infraIntel:'ข้อมูลโครงสร้างพื้นฐาน',freightIntel:'ข้อมูลการเชื่อมต่อสินค้า',
unknown:'ไม่ทราบ',referenceOnly:'ตำแหน่งอ้างอิง',noPoint:'ไม่มีพิกัดยืนยัน',loading:'กำลังโหลดแผนที่…',mapError:'โหลดแผนที่ฐานไม่สำเร็จ แต่ยังใช้รายการทรัพย์สินได้',
passenger:'ผู้โดยสาร',passengerFreight:'ผู้โดยสารและสินค้า',futurePassenger:'ผู้โดยสารในอนาคต',
historicRef:"จุดแผน EIA ปี 2017 (ไม่ใช่สถานีปัจจุบัน)",portArea:"พื้นที่ท่าเรือ (ไม่ใช่ราง ECRL)",proxyArea:"พื้นที่ Puncak Alam เท่านั้น ไม่ทราบจุดลานสินค้า",legendHistoric:"จุดอ้างอิง EIA 2017 (วงกลมประสีส้ม)",legendPort:"พื้นที่ท่าเรืออ้างอิง (วงกลมประสีม่วง)",referenceWarning:"คำเตือน: พิกัด EIA ปี 2017 เป็นแผนเดิม อาจต่างจากสถานี C2 ปัจจุบัน ไม่ใช่ตำแหน่งสถานี ชานชาลา หรือรางที่สำรวจแล้ว",portReferenceWarning:"หมุดเป็นพิกัดพื้นที่ทางทะเลจาก PKA ไม่ใช่รางหรือปลายทางรถไฟ ECRL",yardFocusWarning:"จุดโฟกัสเป็นข้อเสนอ EIA ปี 2017 ของ Puncak Alam เท่านั้น ไม่ใช่ตำแหน่งลานขนส่งสินค้า",referenceBadge:"เป็นจุดอ้างอิงพื้นที่เท่านั้น",
 basemapQuiet:"ถนนสีอ่อน",basemapStandard:"ถนนปกติ",basemapSwitch:"เปลี่ยนรูปแบบแผนที่",
notOperational:'ยังไม่เปิดบริการสาธารณะ',legal:'แหล่งข้อมูล: MRL, สภารัฐสลังงอร์ และ MIDA พิกัดอ้างอิงเดิมไม่ใช่การสำรวจทางรถไฟ ห้ามใช้ปฏิบัติการรถไฟ'
}};
g.MRS10ECRLI18N=Object.freeze(Object.fromEntries(Object.entries(dict).map(([k,v])=>[k,Object.freeze(v)])));
})(window);