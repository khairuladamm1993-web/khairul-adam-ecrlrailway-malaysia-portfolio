/* R2.6 Source-safe localization of MR-S10 map-owned controls; never changes raster tile pixels or canonical coordinates. */
((root)=>{
'use strict';
const labels={
  "MAP": {
    "ms": "PETA",
    "en": "MAP",
    "zh": "地图",
    "th": "แผนที่"
  },
  "Search": {
    "ms": "Cari",
    "en": "Search",
    "zh": "搜索",
    "th": "ค้นหา"
  },
  "All": {
    "ms": "Semua",
    "en": "All",
    "zh": "全部",
    "th": "ทั้งหมด"
  },
  "STN": {
    "ms": "STN",
    "en": "STN",
    "zh": "车站 STN",
    "th": "สถานี STN"
  },
  "PL": {
    "ms": "PL",
    "en": "PL",
    "zh": "会让点 PL",
    "th": "จุดผ่าน PL"
  },
  "Depot": {
    "ms": "Depoh",
    "en": "Depot",
    "zh": "车辆基地",
    "th": "ศูนย์ซ่อมบำรุง"
  },
  "FIT FULL ROUTE": {
    "ms": "PAPAR SEMUA STESEN",
    "en": "FIT FULL ROUTE",
    "zh": "显示所有车站",
    "th": "แสดงสถานีทั้งหมด"
  },
  "FOCUS SELECTED": {
    "ms": "FOKUS PILIHAN",
    "en": "FOCUS SELECTED",
    "zh": "定位所选",
    "th": "ไปยังจุดที่เลือก"
  },
  "Select an asset": {
    "ms": "Pilih aset",
    "en": "Select an asset",
    "zh": "选择站点",
    "th": "เลือกจุดข้อมูล"
  },
  "Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.": {
    "ms": "Pilih hasil carian untuk melihat tahap keyakinan koordinat. Penanda tepat hanya untuk lokasi yang disahkan.",
    "en": "Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.",
    "zh": "选择结果以查看坐标可信度。仅经验证的位置显示精确标记。",
    "th": "เลือกผลลัพธ์เพื่อตรวจสอบความน่าเชื่อถือของพิกัด ตำแหน่งที่ผ่านการตรวจสอบเท่านั้นจึงจะแสดงหมุดที่แม่นยำ"
  },
  "No matching Corridor records.": {
    "ms": "Tiada rekod koridor yang sepadan.",
    "en": "No matching Corridor records.",
    "zh": "没有匹配的线路记录。",
    "th": "ไม่พบข้อมูลแนวเส้นทางที่ตรงกัน"
  },
  "Station name; Member code / chainage when available": {
    "ms": "Nama stesen; kod Member / chainage jika tersedia",
    "en": "Station name; Member code / chainage when available",
    "zh": "车站名称；会员编号 / 里程（如有）",
    "th": "ชื่อสถานี; รหัสสมาชิก / ระยะทางตามแนวเส้นทาง (ถ้ามี)"
  },
  "Railway context is a visual OpenStreetMap/OpenRailwayMap reference layer, not surveyed ECRL geometry. Exact asset markers still require a validated confidence class; Public Reference and Pending markers remain approximate/reference only.": {
    "ms": "Lapisan OpenStreetMap/OpenRailwayMap ialah rujukan visual, bukan geometri tinjauan ECRL. Penanda tepat memerlukan pengesahan lokasi; penanda rujukan awam atau belum disahkan kekal anggaran.",
    "en": "Railway context is a visual OpenStreetMap/OpenRailwayMap reference layer, not surveyed ECRL geometry. Exact asset markers still require a validated confidence class; Public Reference and Pending markers remain approximate/reference only.",
    "zh": "OpenStreetMap/OpenRailwayMap 图层仅用于视觉参考，不代表 ECRL 测绘线路。精确标记必须经过位置验证；公共参考和待验证标记仍为近似位置。",
    "th": "ชั้นแผนที่ OpenStreetMap/OpenRailwayMap ใช้เพื่อการอ้างอิงภาพ ไม่ใช่ข้อมูลสำรวจแนวเส้นทาง ECRL หมุดตำแหน่งแม่นยำต้องผ่านการตรวจสอบ ส่วนตำแหน่งอ้างอิงสาธารณะและรอตรวจสอบยังเป็นข้อมูลโดยประมาณ"
  },
  "No route line / no polyline. Manual pan or zoom never recalculates stored marker coordinates.": {
    "ms": "Tiada garisan laluan. Pergerakan atau zum manual tidak mengubah koordinat penanda yang disimpan.",
    "en": "No route line / no polyline. Manual pan or zoom never recalculates stored marker coordinates.",
    "zh": "不绘制线路。手动平移或缩放不会重新计算保存的标记坐标。",
    "th": "ไม่มีการวาดเส้นทาง การเลื่อนหรือซูมแผนที่จะไม่คำนวณพิกัดหมุดที่บันทึกไว้ใหม่"
  },
  "MAP BASE LABELS": {
    "ms": "LABEL PETA ASAS",
    "en": "BASEMAP LABELS",
    "zh": "底图文字",
    "th": "ข้อความบนแผนที่พื้นฐาน"
  },
  "Basemap labels remain in source language; website controls follow your selected language.": {
    "ms": "Nama bandar pada peta asas kekal dalam bahasa asal pembekal. Kawalan MR-S10 mengikut bahasa pilihan anda.",
    "en": "Place names printed on the basemap remain in the provider’s original language. MR-S10 controls follow your selected language.",
    "zh": "底图上已印刷的地名仍使用地图提供方的原始语言。MR-S10 控件跟随所选语言。",
    "th": "ชื่อสถานที่ที่แสดงบนภาพแผนที่พื้นฐานยังคงใช้ภาษาของผู้ให้บริการ ส่วนปุ่มและข้อความของ MR-S10 ใช้ภาษาที่คุณเลือก"
  },
  "Malaysia": {
    "ms": "Malaysia",
    "en": "Malaysia",
    "zh": "马来西亚",
    "th": "มาเลเซีย"
  },
  "Public Reference Location": {
    "ms": "Lokasi Rujukan Awam",
    "en": "Public Reference Location",
    "zh": "公共参考位置",
    "th": "ตำแหน่งอ้างอิงสาธารณะ"
  },
  "Pending Validation": {
    "ms": "Menunggu Pengesahan",
    "en": "Pending Validation",
    "zh": "待验证位置",
    "th": "รอตรวจสอบตำแหน่ง"
  },
  "Validated Location": {
    "ms": "Lokasi Disahkan",
    "en": "Validated Location",
    "zh": "已验证位置",
    "th": "ตำแหน่งที่ตรวจสอบแล้ว"
  },
  "Code": {
    "ms": "Kod",
    "en": "Code",
    "zh": "代码",
    "th": "รหัส"
  },
  "Name": {
    "ms": "Nama",
    "en": "Name",
    "zh": "名称",
    "th": "ชื่อ"
  },
  "Category": {
    "ms": "Kategori",
    "en": "Category",
    "zh": "类别",
    "th": "ประเภท"
  },
  "Chainage": {
    "ms": "Chainage",
    "en": "Chainage",
    "zh": "里程",
    "th": "ระยะทางตามแนวเส้นทาง"
  },
  "Latitude": {
    "ms": "Latitud",
    "en": "Latitude",
    "zh": "纬度",
    "th": "ละติจูด"
  },
  "Longitude": {
    "ms": "Longitud",
    "en": "Longitude",
    "zh": "经度",
    "th": "ลองจิจูด"
  },
  "Location confidence": {
    "ms": "Keyakinan Lokasi",
    "en": "Location confidence",
    "zh": "位置可信度",
    "th": "ความน่าเชื่อถือของตำแหน่ง"
  },
  "Coordinate source": {
    "ms": "Sumber Koordinat",
    "en": "Coordinate source",
    "zh": "坐标来源",
    "th": "ที่มาของพิกัด"
  },
  "Basic": {
    "ms": "Asas",
    "en": "Basic",
    "zh": "基本信息",
    "th": "ข้อมูลพื้นฐาน"
  },
  "Operational Detail": {
    "ms": "Maklumat Operasi",
    "en": "Operational Detail",
    "zh": "运营资料",
    "th": "รายละเอียดการปฏิบัติงาน"
  },
  "CHAINAGE": {
    "ms": "CHAINAGE",
    "en": "CHAINAGE",
    "zh": "线路里程",
    "th": "ระยะทางตามแนวเส้นทาง"
  },
  "No coordinate was invented and the current corridor viewport is preserved.": {
    "ms": "Tiada koordinat direka dan paparan koridor semasa dikekalkan.",
    "en": "No coordinate was invented and the current corridor viewport is preserved.",
    "zh": "未虚构坐标，当前线路视图保持不变。",
    "th": "ไม่ได้สร้างพิกัดขึ้นเอง และยังคงมุมมองแนวเส้นทางปัจจุบันไว้"
  },
  "Public view · protected Corridor records are not loaded.": {
    "ms": "Paparan awam · rekod koridor terlindung tidak dimuatkan.",
    "en": "Public view · protected Corridor records are not loaded.",
    "zh": "公共视图 · 不加载受保护的线路记录。",
    "th": "มุมมองสาธารณะ · ไม่โหลดข้อมูลแนวเส้นทางที่จำกัดสิทธิ์"
  },
  "Public Reference Location · locality/reference position only; not an exact railway or survey/GIS coordinate.": {
    "ms": "Lokasi rujukan awam sahaja; bukan koordinat tepat landasan atau GIS.",
    "en": "Public Reference Location · locality/reference position only; not an exact railway or survey/GIS coordinate.",
    "zh": "公共参考位置，仅用于地理参考，并非准确的铁路或测绘 GIS 坐标。",
    "th": "ตำแหน่งอ้างอิงสาธารณะเท่านั้น ไม่ใช่พิกัดรางรถไฟหรือข้อมูลสำรวจ GIS ที่แม่นยำ"
  }
};
const originals=new WeakMap(),placeholders=new WeakMap();
const lookup=(value,locale)=>labels[value]?.[locale]||labels[value]?.en||value;
function apply(host,locale){
 if(!host||!['ms','en','zh','th'].includes(locale))return;
 const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
 const texts=[];
 while(walker.nextNode()){
  const node=walker.currentNode,p=node.parentElement;
  if(!p||p.closest('.map-canvas, .leaflet-container, .leaflet-control-attribution,script,style'))continue;
  texts.push(node);
 }
 for(const node of texts){
  const current=node.nodeValue.trim();
  const key=originals.get(node)||current;
  if(!labels[key])continue;
  originals.set(node,key);
  const next=lookup(key,locale),out=node.nodeValue.replace(current,next);
  if(node.nodeValue!==out)node.nodeValue=out;
 }
 const field=host.querySelector('[data-map-search]');
 if(field){
  const key=placeholders.get(field)||field.getAttribute('placeholder');
  if(labels[key]){placeholders.set(field,key);field.setAttribute('placeholder',lookup(key,locale));}
 }
 host.dataset.mapLanguage=locale;
}
root.RailwayMapLocale=Object.freeze({apply,lookup,labels,sourceLabelsLocalized:false});
if(typeof module==='object'&&module.exports)module.exports=root.RailwayMapLocale;
})(typeof window!=='undefined'?window:globalThis);
