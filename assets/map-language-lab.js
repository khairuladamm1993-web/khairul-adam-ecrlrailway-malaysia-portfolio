/* R2.7 isolated visitor-map vector label prototype; no ECRL coordinate edits. */
(()=>{
'use strict';
const locales=['ms','en','zh','th'];
const centers={malaysia:[[102.75,4.4],5.4],thailand:[[101,15.3],4.9],china:[[106.7,32.3],3.6]};
const copy={
 ms:['Peta pelawat pelbagai bahasa · BETA','Pilih bahasa bagi nama tempat jika data tersedia.','Nama tempat mungkin tiada terjemahan.','Peta pelawat sahaja, bukan peta operasi ECRL.'],
 en:['Multilingual visitor map · BETA','Choose the language of place names when source data exists.','Not every location has a translated name.','Visitor reference only, not an ECRL operational map.'],
 zh:['多语言旅行地图 · 测试版','选择地名语言（如有源数据）。','部分地点没有相应的译名。','仅供旅行参考，并非 ECRL 运营地图。'],
 th:['แผนที่ท่องเที่ยวหลายภาษา · รุ่นทดสอบ','เลือกภาษาของชื่อสถานที่เมื่อมีข้อมูล','ชื่อไทยจากข้อมูลแผนที่และชื่อเมืองที่มีแหล่งอ้างอิงเท่านั้น; ที่อื่นใช้ชื่อเดิม','สำหรับการเดินทางเท่านั้น ไม่ใช่แผนที่เดินรถ ECRL']
};
const uiText={
 ms:{railOn:'Butiran railway: AKTIF',railOff:'Butiran railway: MATI',railNote:'Mod pelawat menyembunyikan lapisan teknikal OpenRailwayMap. Aktifkan butiran railway untuk melihat laluan dan kod rujukan landasan.',themeLight:'Tukar ke Mod Cerah',themeDark:'Tukar ke Mod Gelap',labelLayers:'lapisan label dengan sokongan bahasa'},
 en:{railOn:'Railway details: ON',railOff:'Railway details: OFF',railNote:'Visitor mode hides the technical OpenRailwayMap overlay. Turn on railway details to view rail routes and reference numbers.',themeLight:'Switch to Light Mode',themeDark:'Switch to Dark Mode',labelLayers:'language-enabled label layers'},
 zh:{railOn:'铁路详情：开启',railOff:'铁路详情：关闭',railNote:'游客模式隐藏 OpenRailwayMap 技术图层。开启铁路详情可查看线路和参考编号。',themeLight:'切换至浅色模式',themeDark:'切换至深色模式',labelLayers:'支持语言切换的标签图层'},
 th:{railOn:'รายละเอียดรถไฟ: เปิด',railOff:'รายละเอียดรถไฟ: ปิด',railNote:'โหมดนักท่องเที่ยวซ่อนชั้นข้อมูลทางเทคนิคของ OpenRailwayMap เปิดรายละเอียดรถไฟเพื่อดูเส้นทางและรหัสอ้างอิง',themeLight:'เปลี่ยนเป็นโหมดสว่าง',themeDark:'เปลี่ยนเป็นโหมดมืด',labelLayers:'ชั้นป้ายชื่อที่รองรับภาษา'}
};

const railLegendI18n={
ms:{title:'Jenis dan warna landasan',note:'8 warna asal OpenRailwayMap. Lapisan rel dipaparkan 60% lutsinar: warna boleh bercampur dengan peta asas. Warna sahaja tidak membuktikan nama, kelajuan atau elektrifikasi.',items:['Main line · Laluan utama','High-speed line · Rel laju bertag','Branch line · Laluan cabang','Metro / subway','Light rail / LRT','Tram','Industrial / spur · Rel industri','Other rail / yard · Rel lain']},
en:{title:'Railway colour legend',note:'8 original OpenRailwayMap colours. The rail overlay is 60% opaque, so colours blend with the basemap. Colours alone do not verify route names, operating speed or electrification.',items:['Main line','High-speed tagged rail','Branch line','Metro / subway','Light rail / LRT','Tram','Industrial / spur','Other rail / yard']},
zh:{title:'铁路颜色图例',note:'OpenRailwayMap 原始八种颜色；叠加层不透明度为 60%，颜色与底图混合。颜色不代表已核实的线路名称、运营速度或电气化。',items:['铁路干线','高速铁路标记','铁路支线','地铁','轻轨','有轨电车','工业线 / 专用线','其他轨道 / 车场']},
th:{title:'คำอธิบายสีทางรถไฟ',note:'สีต้นฉบับ 8 แบบของ OpenRailwayMap ชั้นทางรถไฟทึบ 60% จึงผสมกับสีพื้นแผนที่ สีไม่ได้ยืนยันชื่อเส้นทาง ความเร็ว หรือระบบไฟฟ้า',items:['ทางรถไฟสายหลัก','รางที่ระบุว่าเป็นความเร็วสูง','ทางรถไฟสายรอง','รถไฟฟ้าใต้ดิน','รถไฟฟ้ารางเบา','รถราง','รางอุตสาหกรรม / รางแยก','รางอื่น / ลานจอด']}
};
const railLegendCities={
ms:{malaysia:'Malaysia',thailand:'Thailand',china:'China',pilot:{malaysia:'Kuala Lumpur',thailand:'Bangkok',china:'Liuzhou'}},
en:{malaysia:'Malaysia',thailand:'Thailand',china:'China',pilot:{malaysia:'Kuala Lumpur',thailand:'Bangkok',china:'Liuzhou'}},
zh:{malaysia:'马来西亚',thailand:'泰国',china:'中国',pilot:{malaysia:'吉隆坡',thailand:'曼谷',china:'柳州'}},
th:{malaysia:'มาเลเซีย',thailand:'ไทย',china:'จีน',pilot:{malaysia:'กัวลาลัมเปอร์',thailand:'กรุงเทพฯ',china:'หลิ่วโจว'}}
};
const readableRailLanguage={
 ms:{guide:'Liuzhou · nama railway dwibahasa',guideHint:'Rujukan nama daripada tangkap layar Owner; bukan pin lokasi stesen yang disahkan.',railLines:'Mod pelawat: garisan railway vektor tanpa nombor trek',railMissing:'Garisan railway vektor tidak tersedia dalam gaya peta ini.',technical:'Butiran teknikal ON: nombor trek dan nama pada imej OpenRailwayMap kekal dalam bahasa asal.'},
 en:{guide:'Liuzhou · bilingual railway names',guideHint:'Names identified from the Owner screenshot; not verified station coordinates.',railLines:'Visitor mode: vector railway lines without track numbers',railMissing:'Vector railway lines are unavailable in this map style.',technical:'Technical railway mode ON: track numbers and names on the OpenRailwayMap image remain in their original language.'},
 zh:{guide:'柳州 · 铁路地名对照',guideHint:'名称来自用户提供的截图，不代表经过核实的站点坐标。',railLines:'游客模式：铁路矢量线条，不显示股道编号',railMissing:'此地图样式不支持铁路矢量线条。',technical:'铁路详情开启：OpenRailwayMap 影像上的股道编号与地名仍使用原始语言。'},
 th:{guide:'หลิ่วโจว · ชื่อสถานที่รถไฟสองภาษา',guideHint:'ชื่อจากภาพหน้าจอของเจ้าของ ไม่ใช่พิกัดสถานีที่ผ่านการยืนยัน',railLines:'โหมดนักท่องเที่ยว: เส้นทางรถไฟแบบเวกเตอร์ ไม่มีหมายเลขราง',railMissing:'แผนที่นี้ไม่มีข้อมูลเส้นทางรถไฟแบบเวกเตอร์',technical:'เปิดรายละเอียดรถไฟ: หมายเลขรางและชื่อบนภาพ OpenRailwayMap ยังคงเป็นภาษาต้นฉบับ'}
};
// Campus reference centroid from OpenStreetMap way 631232606 (WGS84).
// This is NOT a verified gate, building, or trainee accommodation position.
const LRVTC_CAMPUS=Object.freeze({
 id:'lrvtc-guantang-campus',name:'Liuzhou Railway Vocational Technical College',
 alternate:'柳州铁道职业技术学院',campus:'Guantang Campus',
 lngLat:Object.freeze([109.52917,24.39864]),osmWay:'631232606',
 address:'No. 2 Wenyuan Road, Yufeng District, Liuzhou, Guangxi, China',
 positionClass:'OSM campus-area reference, not surveyed entrance'
});
const campusText={
 ms:{button:'🎓 LRVTC · Kampus Guantang',title:'LRVTC · Kampus Guantang',
  note:'Pin rujukan kawasan kampus, bukan pintu masuk atau bangunan penginapan yang disahkan.'},
 en:{button:'🎓 LRVTC · Guantang Campus',title:'LRVTC · Guantang Campus',
  note:'Campus-area reference pin; not a verified gate or accommodation building.'},
 zh:{button:'🎓 柳州铁道职业技术学院 · 官塘校区',title:'柳州铁道职业技术学院 · 官塘校区',
  note:'仅供定位校区区域；不是经过核实的校门或住宿楼位置。'},
 th:{button:'🎓 LRVTC · วิทยาเขตกวนถัง',title:'LRVTC · วิทยาเขตกวนถัง',
  note:'หมุดอ้างอิงบริเวณวิทยาเขต ไม่ใช่ทางเข้าหรืออาคารที่พักที่ยืนยันตำแหน่งแล้ว'}
};
const legendExplanations={
ms:['Laluan utama (usage=main); nama sebenar memerlukan bukti sumber.','Rel utama bertag highspeed=yes; bukan bukti kelajuan operasi.','Rel cabang bertag usage=branch.','Subway / metro (railway=subway). Warna biru mungkin kelihatan ungu selepas bercampur dengan peta asas.','Light rail / LRT (railway=light_rail), warna asal hijau.','Tram (railway=tram), warna asal merah jambu.','Rel industri atau spur berdasarkan atribut usage/service.','Rel lain, yard atau data belum dikategorikan.'],
en:['Main railway (usage=main); exact name needs source evidence.','Main track tagged highspeed=yes; not verified operating speed.','Branch off a main line (usage=branch).','Metro / subway; blue may appear purple over the basemap.','Light rail (railway=light_rail), original green.','Tram (railway=tram), original pink.','Industrial usage or spur service based on source tags.','Other, yard or uncategorized rail.'],
zh:['usage=main 主线；具体线路名需要来源。','highspeed=yes 标记，不代表实际运营速度。','usage=branch 铁路支线。','railway=subway 蓝色叠加底图后可能偏紫。','railway=light_rail 绿色轻轨。','railway=tram 粉色有轨电车。','工业或专用线属性。','其他、车场或未分类轨道。'],
th:['สายหลัก usage=main ชื่อจริงต้องมีแหล่งข้อมูล','ติดแท็ก highspeed=yes ไม่ยืนยันความเร็วจริง','ทางแยก usage=branch','รถไฟใต้ดิน สีฟ้าอาจดูม่วงเมื่อซ้อนบนพื้นแผนที่','รถไฟฟ้ารางเบา railway=light_rail สีเขียว','รถราง railway=tram สีชมพู','รางอุตสาหกรรมหรือรางแยกตามแท็ก','รางอื่น ลานจอด หรือไม่ได้จัดประเภท']
};
// R2.13 opt-in pilot uses verified CITY-AREA centers, never guessed station coordinates.
// Kuala Lumpur: https://digital.library.unt.edu/explore/locations/p09469/
// Bangkok: https://digital.library.unt.edu/explore/locations/p01401/
// Liuzhou: https://mapcarta.com/Liuzhou
// POI/transportation vector schemas: https://openmaptiles.org/docs/schema/
const pilotCenters=Object.freeze({
 malaysia:{label:'Kuala Lumpur',center:[101.68653,3.14120],zoom:12.5},
 thailand:{label:'Bangkok',center:[100.50144,13.75398],zoom:12.5},
 china:{label:'Liuzhou',center:[109.424,24.3285],zoom:12.5}
});
const pilotLocalized={
 ms:{title:'Ujian rel & stesen',tap:'Tekan simbol stesen atau rel vektor. Nama khusus mungkin tiada.',station:'Stesen railway',rail:'Segmen landasan',unnamed:'Nama English tidak tersedia',original:'Nama asal',pinyin:'Pinyin (jika disahkan)',kind:'Kategori',source:'Data: OpenMapTiles / OpenFreeMap; bukan sistem operasi'},
 en:{title:'Rail and station pilot',tap:'Tap a station symbol or vector rail. Specific names may be unavailable.',station:'Railway station',rail:'Rail segment',unnamed:'English name unavailable',original:'Original name',pinyin:'Verified pinyin',kind:'Category',source:'OpenMapTiles / OpenFreeMap data; not operational'},
 zh:{title:'铁路与车站测试',tap:'点击车站符号或矢量轨道，名称数据可能缺失。',station:'铁路车站',rail:'轨道区段',unnamed:'名称不可用',original:'原名',pinyin:'来源拼音',kind:'类别',source:'OpenMapTiles / OpenFreeMap 数据，非运营用途'},
 th:{title:'ทดสอบทางรถไฟและสถานี',tap:'แตะสัญลักษณ์สถานีหรือรางเวกเตอร์ ชื่อบางแห่งอาจไม่มีข้อมูล',station:'สถานีรถไฟ',rail:'ช่วงทางรถไฟ',unnamed:'ไม่มีชื่อภาษาอังกฤษ',original:'ชื่อเดิม',pinyin:'พินอินที่มีข้อมูลยืนยัน',kind:'ประเภท',source:'ข้อมูล OpenMapTiles / OpenFreeMap ไม่ใช่การเดินรถ'}
};
const pilotStationSubclasses=Object.freeze(['station','halt','subway','tram_stop']);
function pilotEligibleStation(props){
 return !!props && props.class==='railway' && pilotStationSubclasses.includes(props.subclass);
}
// Official OpenMapTiles transportation.class: rail (conventional) or transit (urban).
// Railway type is source-backed transportation.subclass, NEVER inferred from colour.
const pilotRailSubclasses=Object.freeze(['rail','narrow_gauge','preserved','funicular','subway','light_rail','monorail','tram']);
const railVectorFilter=['all',['in',['get','class'],['literal',['rail','transit']]],
 ['in',['get','subclass'],['literal',pilotRailSubclasses]]];
function pilotEligibleRail(props){
 return !!props && ((props.class==='rail' && ['rail','narrow_gauge','preserved','funicular'].includes(props.subclass)) ||
  (props.class==='transit' && ['subway','light_rail','monorail','tram'].includes(props.subclass)));
}
function queryPilotVectorFeature(mapInstance,point,radius=12){
 if(!mapInstance?.queryRenderedFeatures||!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return null;
 const layers=['mrl-pilot-stations','mrl-pilot-rail-hits'].filter(id=>!!mapInstance.getLayer?.(id));
 if(!layers.length)return null;
 const bounds=[[point.x-radius,point.y-radius],[point.x+radius,point.y+radius]];
 let hits=[];
 try{hits=mapInstance.queryRenderedFeatures(bounds,{layers})||[];}catch{return null;}
 const station=hits.find(f=>f.layer?.id==='mrl-pilot-stations'&&pilotEligibleStation(f.properties));
 if(station)return {kind:'station',feature:station};
 const rail=hits.find(f=>f.layer?.id==='mrl-pilot-rail-hits'&&pilotEligibleRail(f.properties));
 return rail?{kind:'rail',feature:rail}:null;
}
function pilotFeatureInfo(props,kind,locale){
 const p=props||{},l=pilotLocalized[locale]||pilotLocalized.en;
 const original=String(p.name||'').trim();
 const english=String(p['name:en']||p.name_en||p['name:latin']||'').trim();
 const local=locale==='zh'?String(p['name:zh']||'').trim():locale==='th'?String(p['name:th']||'').trim():'';
 const latinOriginal=original && !/[\u3400-\u9fff\u0e00-\u0e7f]/.test(original)?original:'';
 const title=(locale==='ms'||locale==='en' ? (english||latinOriginal) : (local||english||original))||l.unnamed;
 const pinyin=String(p['name:zh-Latn-pinyin']||p['name:zh-Latn']||'').trim();
 return {title,category:kind==='station'?l.station:l.rail,original:original&&original!==title?original:'',pinyin,subclass:String(p.subclass||'').trim(),source:l.source,localization:l, hasVerifiedEnglish:!!(english||latinOriginal)};
}
let pilotMode=false,pilotTapBound=false,pilotInfoPopup=null;
// R2.15.2 opt-in diagnostic only. It records no device location or persistent tracking.
// Pointer count distinguishes an iOS touch that reaches the map canvas from the MapLibre click event.
// Query counts reflect rendered tile features, not authoritative station names or alignments.
let pilotDebug=false,pilotMapClickCount=0,pilotPanCount=0;
function railTapProbe(mapInstance,point,radius=12){
 const out={selectable:0,visible:0,rawRail:0,subclass:'',hitLayer:false,stationLayer:false,railLayer:false,visibleLayer:false};
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!mapInstance?.queryRenderedFeatures)return out;
 const bbox=[[point.x-radius,point.y-radius],[point.x+radius,point.y+radius]];
 const query=layers=>{
  try{return mapInstance.queryRenderedFeatures(bbox,layers?{layers}:undefined)||[];}
  catch{return[];}
 };
 const selectableIds=['mrl-pilot-stations','mrl-pilot-rail-hits'].filter(id=>!!mapInstance.getLayer?.(id));
 out.stationLayer=selectableIds.includes('mrl-pilot-stations');
 out.railLayer=selectableIds.includes('mrl-pilot-rail-hits');
 out.hitLayer=selectableIds.length>0;
 out.selectable=selectableIds.length?query(selectableIds).filter(f=>
  (f.layer?.id==='mrl-pilot-stations'&&pilotEligibleStation(f.properties))||
  (f.layer?.id==='mrl-pilot-rail-hits'&&pilotEligibleRail(f.properties))).length:0;
 out.visibleLayer=!!mapInstance.getLayer?.('mrl-readable-rail-lines');
 const visible=out.visibleLayer?query(['mrl-readable-rail-lines']):[];
 out.visible=visible.length;
 // Only class/subclass returned by current rendered geometry; never identify rail by colour.
 const raw=query().filter(f=>pilotEligibleRail(f.properties));
 out.rawRail=raw.length;
 out.subclass=String((visible[0]||raw[0])?.properties?.subclass||'').slice(0,30);
 return out;
}
function writeRailTapDiagnostic(stage,details){
 if(!pilotDebug)return;
 const node=el('rail-tap-diagnostic');if(!node)return;
 const suffix=details?' · '+details:'';
 // MapLibre click represents an actual selection tap; dragstart represents panning.
 // Do not count pointerdown as a tap: pinch/scroll/drag also begin with pointerdown.
 node.textContent='MAP TAPS '+pilotMapClickCount+' / PANS '+pilotPanCount+
  ' · '+stage+suffix;
 node.hidden=false;
}
function attachPilotTouchDiagnostic(){
 if(!pilotMode||!pilotDebug||!map)return;
 // `dragstart` is emitted only when MapLibre begins a drag; raw touch/pointer
 // starts and webpage scrolling must not inflate the purposeful map tap counter.
 map.on('dragstart',()=>{
  pilotPanCount++;
  writeRailTapDiagnostic('Map pan started; no tap counted');
 });
 map.on('click',e=>{
  pilotMapClickCount++;
  const d=railTapProbe(map,e.point);
  const info='source features '+d.selectable+' / visible '+d.visible+' / raw rail '+d.rawRail+
   ' · '+(d.subclass||'unknown')+' · rail '+(d.railLayer?'READY':'MISSING')+
   ' / station '+(d.stationLayer?'READY':'MISSING');
  writeRailTapDiagnostic('Map tap received',info);
 });
 writeRailTapDiagnostic('Diagnostic armed; only map clicks count as taps');
}

function pilotSourceForLayer(style,sourceLayer){
 const entry=style?.layers?.find(layer=>layer['source-layer']===sourceLayer && style.sources?.[layer.source]?.type==='vector');
 return entry?.source||null;
}
// Some OpenFreeMap styles use a vector tileset for transportation while omitting
// POI symbol layers from the current theme. Their omission from style.layers is
// NOT proof the underlying vector source lacks the OpenMapTiles poi source-layer.
// Re-use only that already-declared source; never create station coordinates.
function pilotStationVectorSource(style){
 const explicit=pilotSourceForLayer(style,'poi');
 if(explicit)return {source:explicit,discovery:'styled-poi'};
 const transport=pilotSourceForLayer(style,'transportation');
 if(transport && style?.sources?.[transport]?.type==='vector')
  return {source:transport,discovery:'shared-vector-source; poi content unverified'};
 return {source:null,discovery:'no-vector-source'};
}
function popupFromPilotFeature(feature,kind,lngLat){
 if(!feature||!(kind==='station'?pilotEligibleStation(feature.properties):pilotEligibleRail(feature.properties)))return;
 const info=pilotFeatureInfo(feature.properties,kind,lang);
 const root=document.createElement('div');
 root.className='campus-popup';root.tabIndex=0;root.setAttribute('role','region');root.setAttribute('aria-label',info.category);
 const title=document.createElement('strong');title.textContent=info.title;root.appendChild(title);
 for(const line of [info.category,info.subclass?info.localization.kind+': '+info.subclass:'',
  info.original?info.localization.original+': '+info.original:'',
  info.pinyin?info.localization.pinyin+': '+info.pinyin:'',info.source]){
  if(!line)continue;const node=document.createElement('p');node.textContent=line;root.appendChild(node);
 }
 // R2.16.3: exact source-string crosswalk, not physical track assignment.
 // No route is inferred from rail colour, geometry proximity or generic place names.
 if(kind==='station'&&activeRegion==='malaysia'&&pilotMode){
  const candidate=window.MRS10KLRegistry?.matchSourcedKajangPoi?.(feature.properties)||
   window.MRS10KLRegistry?.matchSourcedKelanaPoi?.(feature.properties);
  if(candidate){
   const label=lang==='ms'?'Padanan nama peta (calon)':
    lang==='zh'?'地图名称对应（候选）':
    lang==='th'?'จับคู่ชื่อบนแผนที่ (เบื้องต้น)':'Map name match (candidate)';
   const notice=document.createElement('p');
   notice.textContent=label+': '+candidate.routeName+' · '+
    candidate.stopPosition+'/'+candidate.stopCount+' · '+
    (lang==='ms'?'Trek fizikal belum disahkan':
      lang==='zh'?'实体轨道未核实':
      lang==='th'?'ยังไม่ยืนยันรางจริง':'Physical track unverified');
   notice.className=candidate.routeId==='lrt-kelana-jaya'?'kelana-match-notice':'kajang-match-notice';
   root.classList.add(candidate.routeId==='lrt-kelana-jaya'?'kelana-match':'kajang-match');
   root.appendChild(notice);
  }
 }
 if(pilotInfoPopup)pilotInfoPopup.remove();
 pilotInfoPopup=new maplibregl.Popup({offset:12,maxWidth:'255px',className:'mrl-campus-popup'})
  .setLngLat(lngLat).setDOMContent(root).addTo(map);
}
function installPilotVectorLayers(){
 // The map style exists at style.load, but isStyleLoaded() may be false after
 // our readable rails and raster overlay mutate the style. Do not gate layer
 // installation on pending tile/render work; retry missing layers at idle.
 if(!pilotMode||!map?.getStyle?.()?.sources)return false;
 const style=map.getStyle(),railSource=transportationSource(style),stationSource=pilotStationVectorSource(style),poiSource=stationSource.source;
 const status=el('railway-pilot-status');
 let stations=false,rails=false;
 // A vector feature must exist before any popup can open: no synthetic station markers.
 if(poiSource&&!map.getLayer('mrl-pilot-stations')){
  try{
   map.addLayer({id:'mrl-pilot-stations',type:'circle',source:poiSource,'source-layer':'poi',minzoom:10,
    filter:['all',['==',['get','class'],'railway'],['in',['get','subclass'],['literal',pilotStationSubclasses]]],
    paint:{'circle-radius':6,'circle-color':'#1F849E','circle-stroke-color':'#FFFFFF','circle-stroke-width':1.5}});
   stations=true;
  }catch(e){
   stations=false;
   // Diagnostics only. Missing POI source or invalid layer expressions remain
   // distinct from lack of individual station records in loaded tiles.
   if(pilotDebug)writeRailTapDiagnostic('Station layer setup error',String(e?.message||e).slice(0,120));
 }
 }else stations=!!map.getLayer('mrl-pilot-stations');
 // Highlight ONLY exact code+name POIs actually present in source tiles.
 // The other 27 of 29 stations are green in the verified *ordered registry*,
 // not fabricated as map coordinates or physical railway tracks.
 if(poiSource&&!map.getLayer('mrl-kajang-known-poi')){
  try{
   const identity=window.MRS10KLRegistry?.findRoute?.('mrt-kajang')?.visualIdentity;
   if(identity){
    map.addLayer({
     id:'mrl-kajang-known-poi',type:'circle',source:poiSource,'source-layer':'poi',minzoom:10,
     filter:['all',['==',['get','class'],'railway'],
      ['in',['get','subclass'],['literal',['station','subway']]],
      ['in',['get','name'],['literal',['KG16 Pasar Seni','KG35 Kajang']]]],
     layout:{visibility:'none'},
     paint:{'circle-radius':5.5,'circle-color':identity.light,
      'circle-stroke-color':'#FFFFFF','circle-stroke-width':2}
    });
   }
  }catch(e){if(pilotDebug)writeRailTapDiagnostic('Kajang POI highlight setup error',String(e?.message||e).slice(0,80));}
 }
 // R2.18: renderer filters REAL vector POIs; it creates no station or track coordinates.
 if(poiSource&&!map.getLayer('mrl-kelana-code-poi')){
  try{
   const identity=window.MRS10KLRegistry?.findRoute?.('lrt-kelana-jaya')?.serviceIdentity;
   if(identity)map.addLayer({
    id:'mrl-kelana-code-poi',type:'circle',source:poiSource,'source-layer':'poi',minzoom:10,
    filter:['all',['==',['get','class'],'railway'],
     ['in',['get','subclass'],['literal',['station','subway']]],
     ['in',['get','name'],['literal',['KJ1 Gombak','KJ2 Taman Melati','KJ3 Wangsa Maju','KJ4 Sri Rampai','KJ5 Setiawangsa','KJ6 Jelatek',"KJ7 Dato' Keramat",'KJ8 Damai','KJ9 Ampang Park','KJ10 KLCC','KJ11 Kampung Baru','KJ12 Dang Wangi','KJ13 Masjid Jamek','KJ14 Pasar Seni','KJ15 KL Sentral','KJ16 Bangsar','KJ17 Abdullah Hukum','KJ18 Kerinchi','KJ19 Universiti','KJ20 Taman Jaya','KJ21 Asia Jaya','KJ22 Taman Paramount','KJ23 Taman Bahagia','KJ24 Kelana Jaya','KJ25 Lembah Subang','KJ26 Ara Damansara','KJ27 Glenmarie','KJ28 Subang Jaya','KJ29 SS15','KJ30 SS18','KJ31 USJ7','KJ32 Taipan','KJ33 Wawasan','KJ34 USJ21','KJ35 Alam Megah','KJ36 Subang Alam','KJ37 Putra Heights']]]],
    layout:{visibility:'none'},
    paint:{'circle-radius':5.5,'circle-color':identity.light,
     'circle-stroke-color':'#FFFFFF','circle-stroke-width':2}
   });
  }catch(e){if(pilotDebug)writeRailTapDiagnostic('Kelana POI layer error',String(e?.message||e).slice(0,80));}
 }
 syncKajangPoiHighlights();syncKelanaPoiHighlights();
 if(railSource&&!map.getLayer('mrl-pilot-rail-hits')){
  try{
   map.addLayer({id:'mrl-pilot-rail-hits',type:'line',source:railSource,'source-layer':'transportation',minzoom:10,
    filter:railVectorFilter,layout:{'line-cap':'round','line-join':'round'},
    // Transparent but hit-testable line; 24px rendered width plus a bounded 12px map click query.
    paint:{'line-color':'#000000','line-opacity':0.01,'line-width':24}});
   rails=true;
  }catch(e){rails=false;}
 }else rails=!!map.getLayer('mrl-pilot-rail-hits');
 if(!pilotTapBound){
  map.on('click',e=>{
   const hit=queryPilotVectorFeature(map,e.point,12);
   if(hit){
    popupFromPilotFeature(hit.feature,hit.kind,e.lngLat);
    if(status)status.textContent=pilotLocalized[lang].title+' · '+(hit.kind==='station'?pilotLocalized[lang].station:pilotLocalized[lang].rail);
   }else if(status){
    const messages={ms:'Tiada ciri rel atau stesen vektor di titik ini. Zum masuk dan cuba rel lain.',
       en:'No selectable vector rail or station at this point. Zoom in and try another segment.',
       zh:'此处无可选矢量铁路或车站。请放大后尝试其他轨道。',
       th:'ไม่มีข้อมูลรางหรือสถานีเวกเตอร์ที่จุดนี้ ลองซูมเข้าแล้วแตะรางอื่น'};
    // Always visibly confirm a genuine map tap, even if source tiles are missing.
    const layers=['mrl-pilot-stations','mrl-pilot-rail-hits'].filter(id=>!!map.getLayer?.(id));
    status.textContent=(messages[lang]||messages.en)+(!layers.length?' [vector source unavailable]':'');
   }
  });
  pilotTapBound=true;
 }
 if(status)status.textContent=pilotLocalized[lang].title+' · '+pilotLocalized[lang].tap+
  (!stations?' [station POI layer unavailable]':'')+(!rails?' [rail layer unavailable]':'');
 if(pilotDebug && stations && stationSource.discovery!=='styled-poi'){
  // Layer existence does not prove that any station record is available in a tile.
  const diagnostic=el('railway-pilot-status');
  if(diagnostic)diagnostic.textContent+=' [station source shared with railway; station data unverified]';
 }
 return stations||rails;
}
// R2.14 reference catalogue: ONLY individually source-verified Chinese railway codes.
// No inferred station positions, no translation of OpenRailwayMap raster characters.
const chinaRailCodeRecords=Object.freeze({
 '44906':Object.freeze({kind:'station',english:'Chengcun Railway Station',hanzi:'程村站',pinyin:'Chéngcūn Zhàn',source:'https://zh.wikipedia.org/wiki/程村站'}),
 '44930':Object.freeze({kind:'station',english:"Rong'an Railway Station",hanzi:'融安站',pinyin:"Róng'ān Zhàn",source:'https://zh.wikipedia.org/wiki/融安站'}),
 '44957':Object.freeze({kind:'station',english:'Rongshui Railway Station',hanzi:'融水站',pinyin:'Róngshuǐ Zhàn',source:'https://zh.wikipedia.org/wiki/融水站'}),
 '0073':Object.freeze({kind:'line',english:'Hengyang–Liuzhou Railway',hanzi:'衡柳铁路',pinyin:'Héngliǔ Tiělù',source:'https://wiki.openstreetmap.org/wiki/Zh-hans:OpenRailwayMap/China_Railway_Line_Number'}),
 '0081':Object.freeze({kind:'line',english:'Guizhou–Guangxi Railway',hanzi:'黔桂铁路',pinyin:'Qiánguì Tiělù',source:'https://wiki.openstreetmap.org/wiki/Zh-hans:OpenRailwayMap/China_Railway_Line_Number'})
});
function lookupChinaRailCode(value){
 const key=typeof value==='string'?value.trim():'';
 if(!/^(?:[0-9]{4}|[0-9]{5})$/.test(key))return null;
 return Object.prototype.hasOwnProperty.call(chinaRailCodeRecords,key)?{code:key,...chinaRailCodeRecords[key]}:null;
}
const railCodeI18n={
 ms:{button:'Kod railway China',title:'Kod railway China · pilot',hint:'Tekan kod contoh atau masukkan nombor 4/5 digit. Kod pada imej raster belum boleh ditekan terus.',search:'Cari',missing:'Kod belum disahkan dalam katalog pilot. Tiada nama direka.',kindStation:'Kod stesen (TMIS)',kindLine:'Nombor laluan',source:'Sumber rujukan',close:'Tutup'},
 en:{button:'China railway codes',title:'China railway codes · pilot',hint:'Tap an example or enter a 4/5-digit code. Raster tile numbers are not directly clickable yet.',search:'Look up',missing:'Code not verified in this pilot catalogue; no name is invented.',kindStation:'Station code (TMIS)',kindLine:'Railway line number',source:'Reference source',close:'Close'},
 zh:{button:'中国铁路代码',title:'中国铁路代码 · 测试',hint:'点击示例或输入4/5位代码。栅格图片上的数字暂时不能直接点击。',search:'查询',missing:'该代码尚未核实；不生成虚构名称。',kindStation:'车站代码（TMIS）',kindLine:'线路编号',source:'参考来源',close:'关闭'},
 th:{button:'รหัสรถไฟจีน',title:'รหัสรถไฟจีน · ทดสอบ',hint:'แตะรหัสตัวอย่างหรือกรอก 4/5 หลัก ยังไม่สามารถแตะตัวเลขบนภาพแผนที่โดยตรง',search:'ค้นหา',missing:'รหัสนี้ยังไม่มีข้อมูลยืนยัน ไม่สร้างชื่อขึ้นเอง',kindStation:'รหัสสถานี TMIS',kindLine:'หมายเลขเส้นทางรถไฟ',source:'แหล่งอ้างอิง',close:'ปิด'}
};
function syncChinaCodeWidget(){
 const show=pilotMode&&activeRegion==='china';
 const button=el('china-code-trigger'),panel=el('china-code-panel');
 if(button){button.hidden=!show;button.setAttribute('aria-label',railCodeI18n[lang].button);button.title=railCodeI18n[lang].button;}
 if(!show&&panel)panel.hidden=true;
 if(button&&!show)button.setAttribute('aria-expanded','false');
 el('map-shell')?.classList.toggle('is-code-open',show && !!panel && !panel.hidden);
 const l=railCodeI18n[lang];
 for(const [id,value] of [['china-code-title',l.title],['china-code-hint',l.hint],['china-code-search',l.search],['china-code-close',l.close]]){
  const node=el(id);if(node)node.textContent=value;
 }
 // Current evidence remains visible in the selected language; do not invent romanisation.
 const current=el('china-code-result');
 if(current&&current.dataset.code)showChinaRailCode(current.dataset.code);
}
function showChinaRailCode(raw){
 const host=el('china-code-result');if(!host)return;
 const result=lookupChinaRailCode(raw),l=railCodeI18n[lang];
 host.replaceChildren();
 host.dataset.code=typeof raw==='string'?raw.trim():'';
 if(!result){host.textContent=l.missing;return;}
 const heading=document.createElement('strong');heading.textContent=result.code+' · '+result.english;host.appendChild(heading);
 for(const val of [result.kind==='station'?l.kindStation:l.kindLine,result.hanzi,result.pinyin]){
  const p=document.createElement('p');p.textContent=val;host.appendChild(p);
 }
 const a=document.createElement('a');a.href=result.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=l.source;host.appendChild(a);
}
const el=id=>document.getElementById(id);
let lang='ms',map=null,ready=false,railDetails=false,activeRegion='malaysia',campusMarker=null;
const railVisibility=on=>on?'visible':'none';
function makeCampusPopup(){
 const root=document.createElement('div');root.className='campus-popup';root.tabIndex=0;root.setAttribute('role','region');root.setAttribute('aria-label',campusText[lang].title);
 const heading=document.createElement('strong');heading.textContent=campusText[lang].title;root.appendChild(heading);
 const original=document.createElement('p');original.textContent=LRVTC_CAMPUS.alternate+' · Liǔzhōu Tiědào Zhíyè Jìshù Xuéyuàn';root.appendChild(original);
 const address=document.createElement('p');address.textContent=LRVTC_CAMPUS.address;root.appendChild(address);
 const note=document.createElement('small');note.textContent=campusText[lang].note;root.appendChild(note);
 return root;
}
function syncCampusPin(){
 const china=activeRegion==='china';
 if(!china){
  if(campusMarker){campusMarker.remove();campusMarker=null;}
  return;
 }
 if(!map||!window.maplibregl?.Marker||!window.maplibregl?.Popup)return;
 if(!campusMarker){
  const pin=document.createElement('button');pin.type='button';pin.className='lrvtc-pin';
  pin.textContent='🎓';pin.title=campusText[lang].title;
  pin.setAttribute('aria-label',campusText[lang].title);
  campusMarker=new maplibregl.Marker({element:pin,anchor:'bottom'})
   .setLngLat(LRVTC_CAMPUS.lngLat)
   .setPopup(new maplibregl.Popup({offset:22,maxWidth:'255px',className:'mrl-campus-popup'}).setDOMContent(makeCampusPopup()))
   .addTo(map);
 }else{
  const pin=campusMarker.getElement?.();
  if(pin){pin.title=campusText[lang].title;pin.setAttribute('aria-label',campusText[lang].title);}
  campusMarker.setPopup(new maplibregl.Popup({offset:22,maxWidth:'255px',className:'mrl-campus-popup'}).setDOMContent(makeCampusPopup()));
 }
}
function setRailVisibility(){
 if(map?.getLayer?.('mrl-railway'))map.setLayoutProperty('mrl-railway','visibility',railVisibility(railDetails));
 const button=el('railway-btn');
 if(button){button.setAttribute('aria-pressed',String(railDetails));button.textContent=railDetails?uiText[lang].railOn:uiText[lang].railOff;}
 const note=el('railway-note');if(note)note.textContent=railDetails?readableRailLanguage[lang].technical:uiText[lang].railNote;
 const quick=el('rail-mode-status');
 if(quick)quick.textContent=railDetails?readableRailLanguage[lang].technical:readableRailLanguage[lang].railLines;
 // The palette describes the *raster* OpenRailwayMap overlay only. Hide it when
 // railway details are OFF so it cannot cover the vector tap-test viewport.
 const legend=el('railway-legend');
 if(legend){
  if(!railDetails)legend.open=false;
  legend.hidden=!railDetails;
 }
}
try{const v=localStorage.getItem('railway-language');if(locales.includes(v))lang=v;}catch{}
// R2.18.2 (Owner UAT): Source-attested Thai place names only, never station IDs
// or unverified geometry. Thai Ministry of Foreign Affairs / Royal Institute:
// https://image.mfa.go.th/mfa/0/N3nQs9OUac/Titles__Places__and_Translations/5._ชื่อประเทศ_เมืองหลวง_(ไทย-อังกฤษ)_ราชบัณฑิตยสถาน.pdf
// Greater KL city names: https://cmgfthailand.psu.ac.th/?p=2619
// Kuala Lumpur: https://th.wikipedia.org/wiki/กัวลาลัมเปอร์
// Kajang: https://mapcarta.com/Kajang
const thaiMalaysiaPlaces=Object.freeze({
 'Malaysia':'มาเลเซีย','Kuala Lumpur':'กัวลาลัมเปอร์',
 'Selangor':'สลังงอร์','Shah Alam':'ชาห์อาลัม',
 'Petaling Jaya':'เปอตาลิงจายา','Subang Jaya':'ซูบังจายา','Klang':'กลัง','Kajang':'กาจัง',
 'Putrajaya':'ปุตราจายา','Pahang':'ปะหัง','Kuantan':'กวนตัน',
 'Kelantan':'กลันตัน','Kota Bharu':'โกตาบารู',
 'Terengganu':'ตรังกานู','Kuala Terengganu':'กัวลาตรังกานู',
 'Johor':'ยะโฮร์','Johor Bahru':'ยะโฮร์บาห์รู',
 'Kedah':'เกดะห์','Alor Setar':'อลอร์สตาร์',
 'Melaka':'มะละกา','Malacca':'มะละกา','Penang':'ปีนัง','George Town':'จอร์จทาวน์',
 'Perak':'เประ','Ipoh':'อีโปห์','Negeri Sembilan':'เนกรีเซมบีลัน',
 'Seremban':'เซเรมบัน','Sabah':'ซาบาห์',
 'Kota Kinabalu':'โกตากินาบาลู','Sarawak':'ซาราวัก','Kuching':'กูชิง'
});
function nameExpression(locale,layer){
 const keys=locale==='ms'?['name:ms','name:en','name:latin','name']:
 locale==='en'?['name:en','name:latin','name']:['name:'+locale,'name:en','name:latin','name'];
 const native=['coalesce',...keys.map(key=>['get',key])];
 // Native name:th always wins. Curated aliases are exact-string FALLBACK for
 // Malaysian geographic "place" labels only; POIs, railway stations and routes
 // retain source identities. No runtime translation service or fake coordinates.
 if(locale!=='th'||activeRegion!=='malaysia'||layer?.['source-layer']!=='place')
  return native;
 const sourceName=['coalesce',['get','name:en'],['get','name_en'],['get','name:latin'],['get','name']];
 return ['coalesce',['get','name:th'],
  ['match',sourceName,...Object.entries(thaiMalaysiaPlaces).flat(),sourceName]];
}
// R2.18.1 Owner Safari: dark OpenFreeMap uses place_*, water_name and
// highway_name_other; positron uses label_*, water_name_* and highway-name-*.
// Do not rewrite motorway ref/shield labels (highway_name_motorway).
const isNameLayer=layer=>layer?.type==='symbol'&&layer.layout?.['text-field']!=null&&
 /^(label_|water_name(?:_|$)|waterway_line_label|poi_|poi_transit|airport$|highway-name-|place_|highway_name_other$)/.test(layer.id);
let labelUpdatePending=false;
function applyLabels(){
 // A style switch can be loading when the Owner selects a language.
 // Retry once on idle instead of silently dropping the requested locale.
 if(!map?.isStyleLoaded?.()){labelUpdatePending=true;return 0;}
 let n=0;
 for(const layer of map.getStyle().layers||[])
  if(isNameLayer(layer)){map.setLayoutProperty(layer.id,'text-field',nameExpression(lang,layer));n++;}
 labelUpdatePending=false;
 el('label-status').textContent=(n?n+' '+uiText[lang].labelLayers+' · ':'')+copy[lang][2];
 return n;
}
// R2.16: service and station source catalogue is independent from rendered physical geometry.
// A source-backed station popup does not prove that the station belongs to any selected route.
const klRegistryLocales={
 ms:{summary:'Kuala Lumpur · Daftar laluan & stesen (Fasa 1)',warning:'Rujukan perkhidmatan sahaja. Jajaran fizikal, nombor trek dan susunan stesen perlu bukti berasingan.',
  count:(r,n)=>r+' laluan rujukan · '+n+' turutan laluan disahkan · 0 trek fizikal disahkan',
  label:'Pilih laluan',notVerified:'Turutan semua stesen belum disahkan daripada sumber.',
  verified:'Turutan perhentian disahkan oleh operator. Ini bukan geometri landasan.',sources:'Sumber operator'},
 en:{summary:'Kuala Lumpur · Rail & Station Registry (Phase 1)',warning:'Service references only. Physical track geometry, IDs and most station orders remain unverified.',
  count:(r,n)=>r+' referenced routes · '+n+' verified service stop orders · 0 physical tracks verified',
  label:'Choose a route',notVerified:'Full station order is not yet verified from source.',
  verified:'Operator-confirmed stop order; not physical track geometry.',sources:'Operator sources'},
 zh:{summary:'吉隆坡 · 铁路线路与车站目录（第一阶段）',warning:'仅为线路资料。尚未核实实体轨道、轨道编号与大部分车站顺序。',
  count:(r,n)=>r+' 条参考线路 · '+n+' 条线路站序已核实 · 0 条实体轨道已核实',
  label:'选择线路',notVerified:'尚未从来源核实完整车站顺序。',verified:'运营方确认车站顺序；并非实体轨道图。',sources:'运营方来源'},
 th:{summary:'กัวลาลัมเปอร์ · ทะเบียนสายรถไฟและสถานี (ระยะที่ 1)',warning:'ข้อมูลอ้างอิงการให้บริการเท่านั้น ยังไม่ยืนยันแนวรางจริง หมายเลขราง และลำดับสถานีส่วนใหญ่',
  count:(r,n)=>r+' สายอ้างอิง · ยืนยันลำดับ '+n+' สาย · ยังไม่ยืนยันรางจริง',
  label:'เลือกสาย',notVerified:'ยังไม่ยืนยันลำดับสถานีทั้งหมดจากแหล่งข้อมูล',
  verified:'ผู้ให้บริการยืนยันลำดับจุดจอด ไม่ใช่แนวรางจริง',sources:'แหล่งข้อมูลผู้ให้บริการ'}
};
// R2.17: visual highlight follows selected service; never assume all map rail lines are Kajang.
function syncKajangPoiHighlights(){
 if(!pilotMode||!map?.getLayer?.('mrl-kajang-known-poi'))return;
 const selected=activeRegion==='malaysia'&&el('kl-registry-route')?.value==='mrt-kajang';
 try{map.setLayoutProperty('mrl-kajang-known-poi','visibility',selected?'visible':'none');}catch{}
}
function syncKelanaPoiHighlights(){
 if(!pilotMode||!map?.getLayer?.('mrl-kelana-code-poi'))return;
 const selected=activeRegion==='malaysia'&&el('kl-registry-route')?.value==='lrt-kelana-jaya';
 try{map.setLayoutProperty('mrl-kelana-code-poi','visibility',selected?'visible':'none');}catch{}
}
function renderKLRegistry(){
 const box=el('kl-registry'),api=window.MRS10KLRegistry;
 if(!box)return;
 box.hidden=!pilotMode||activeRegion!=='malaysia'||!api?.validateRegistry?.();
 if(box.hidden){syncKajangPoiHighlights();syncKelanaPoiHighlights();return;}
 const local=klRegistryLocales[lang]||klRegistryLocales.en,registry=api.catalog;
 el('kl-registry-title').textContent=local.summary;
 el('kl-registry-warning').textContent=local.warning;
 const confirmed=registry.routes.filter(r=>r.stationSequenceStatus==='SOURCE_CONFIRMED');
 el('kl-registry-counts').textContent=local.count(registry.routes.length,confirmed.length);
 el('kl-registry-route-label').textContent=local.label;
 const selector=el('kl-registry-route'),previous=selector.value;
 if(selector.options.length!==registry.routes.length){
  selector.replaceChildren();
  registry.routes.forEach(r=>{const opt=document.createElement('option');opt.value=r.id;opt.textContent=r.name;selector.appendChild(opt);});
 }
 if(previous && api.findRoute(previous))selector.value=previous;
 const route=api.findRoute(selector.value)||registry.routes[0];
 if(!route)return;
 box.dataset.route=route.id;
 syncKajangPoiHighlights();syncKelanaPoiHighlights();
 el('kl-registry-route-name').textContent=route.name;
 el('kl-registry-route-status').textContent=route.stationSequenceStatus==='SOURCE_CONFIRMED'?
  local.verified+(route.id==='mrt-kajang'?
    ' · '+(lang==='ms'?'Hijau = identiti laluan, bukan jajaran fizikal':
      lang==='zh'?'绿色代表线路身份，并非实体轨道':
      lang==='th'?'สีเขียวหมายถึงสายบริการ ไม่ใช่แนวรางจริง':
      'Green = service identity, not physical alignment') :
    route.id==='lrt-kelana-jaya'?' · '+(
      lang==='ms'?'Ruby = identiti servis, bukan trek fizikal':
      lang==='zh'?'红宝石色代表运营线路，并非实体轨道':
      lang==='th'?'สีทับทิมแสดงสายบริการ ไม่ใช่แนวรางจริง':
      'Ruby = service identity, not physical alignment') : ''):local.notVerified;
 const list=el('kl-registry-station-order');
 list.replaceChildren();
 if(route.stationSequenceStatus==='SOURCE_CONFIRMED'){
  const byId=new Map(registry.stations.map(st=>[st.id,st]));
  route.stationSequence.forEach(id=>{const li=document.createElement('li'),st=byId.get(id);
   li.textContent=st?(route.id==='lrt-kelana-jaya'?st.code+' · ':'')+st.name:'Unverified';
   list.appendChild(li);});
 }
 list.hidden=!route.stationSequence.length;
 const sources=el('kl-registry-sources');sources.replaceChildren();
 sources.appendChild(document.createTextNode(local.sources+': '));
 route.sourceUrls.forEach((url,i)=>{
  if(typeof url!=='string'||!url.startsWith('https://'))return;
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent='Source '+(i+1);
  if(i)sources.appendChild(document.createTextNode(' · '));
  sources.appendChild(a);
 });
}
function render(){
 document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
 el('lab-title').textContent=copy[lang][0];
 el('lab-info').textContent=copy[lang][1];
 el('place-status').textContent=copy[lang][3];
 el('label-status').textContent=copy[lang][2];
 document.querySelectorAll('[data-locale]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.locale===lang)));
 const legendCopy=railLegendI18n[lang];
 const legendTitle=el('railway-legend-title');if(legendTitle)legendTitle.textContent=legendCopy.title;
 const legendNote=el('railway-legend-note');if(legendNote)legendNote.textContent=legendCopy.note;
 const legendSummary=el('railway-legend-trigger');if(legendSummary){legendSummary.setAttribute('aria-label',legendCopy.title);legendSummary.title=legendCopy.title;}
 document.querySelectorAll('[data-rail-legend]').forEach(node=>{const i=Number(node.dataset.railLegend);if(Number.isInteger(i)&&i>=0&&i<legendCopy.items.length)node.lastElementChild.textContent=legendCopy.items[i];});
 renderLegendDetail();renderLegendRegion();syncChinaCodeWidget();renderKLRegistry();
 const pilotStatus=el('railway-pilot-status');
 if(pilotStatus && pilotMode){
  pilotStatus.hidden=false;
  pilotStatus.textContent=pilotLocalized[lang].title+' · '+pilotLocalized[lang].tap;
 }
 const guideTitle=el('liuzhou-title');if(guideTitle)guideTitle.textContent=readableRailLanguage[lang].guide;
 const guideHint=el('liuzhou-hint');if(guideHint)guideHint.textContent=readableRailLanguage[lang].guideHint;
 syncCampusPin();
 renderExpand();
 setRailVisibility();
 const countryNames={
  ms:['Malaysia','Thailand','China'],en:['Malaysia','Thailand','China'],
  zh:['马来西亚','泰国','中国'],th:['มาเลเซีย','ประเทศไทย','จีน']
 };
 document.querySelectorAll('[data-region]').forEach((b,i)=>{
  const flag=['🇲🇾','🇹🇭','🇨🇳'][i];
  if(countryNames[lang][i])b.textContent=flag+' '+countryNames[lang][i];
 });
}
let selectedRailLegend=0;
function renderLegendRegion(){
 const node=el('railway-legend-region');if(!node)return;
 const places=railLegendCities[lang]||railLegendCities.en;
 node.textContent=pilotMode?places.pilot[activeRegion]:places[activeRegion];
}
function renderLegendDetail(){
 const heading=el('rail-legend-selected-name'),description=el('rail-legend-selected-note');
 if(heading)heading.textContent=railLegendI18n[lang].items[selectedRailLegend];
 if(description)description.textContent=legendExplanations[lang][selectedRailLegend];
 document.querySelectorAll('[data-rail-legend]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.railLegend)===selectedRailLegend)));
}
function setLanguage(v){
 if(!locales.includes(v))return;lang=v;
 try{localStorage.setItem('railway-language',lang)}catch{}
 render();applyLabels();
 const status=el('rail-vector-note');if(status&&map?.isStyleLoaded())status.textContent=
  map.getLayer('mrl-readable-rail-lines')?readableRailLanguage[lang].railLines:readableRailLanguage[lang].railMissing;
}
function theme(){
 try{return localStorage.getItem('railway-theme')==='dark'?'dark':'light'}catch{return 'light'}
}
function updateTheme(){
 const dark=theme()==='dark';
 document.documentElement.dataset.theme=dark?'dark':'light';
 const btn=el('theme-btn'),label=dark?uiText[lang].themeLight:uiText[lang].themeDark;
 btn.setAttribute('aria-label',label);
 btn.setAttribute('title',label);
 btn.setAttribute('aria-pressed',String(dark));
}
function transportationSource(style){
 // Source ID is derived from real OpenFreeMap style; no invented track geometry.
 if(!style?.layers||!style?.sources)return null;
 const layer=style.layers.find(l=>l['source-layer']==='transportation' &&
   style.sources[l.source]?.type==='vector');
 return layer?.source||null;
}
function railVectorLayer(source,dark){
 return {id:'mrl-readable-rail-lines',type:'line',source,'source-layer':'transportation',
  minzoom:8,filter:railVectorFilter,
  layout:{'line-cap':'round','line-join':'round'},
  paint:{'line-color':dark?'#87d8e8':'#247a97','line-opacity':0.87,
    'line-width':['interpolate',['linear'],['zoom'],8,0.8,14,1.9,18,3]}};
}
function readableRails(){
 const style=map.getStyle(),source=transportationSource(style);
 if(!source)return false;
 if(map.getLayer('mrl-readable-rail-lines'))return true;
 const first=style.layers.find(x=>x.type==='symbol');
 map.addLayer(railVectorLayer(source,theme()==='dark'),first?.id);
 return true;
}
function overlay(){
 if(map.getSource('mrl-railway'))return;
 map.addSource('mrl-railway',{type:'raster',tiles:['https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'© OpenRailwayMap contributors'});
 const first=map.getStyle().layers.find(x=>x.type==='symbol');
 map.addLayer({id:'mrl-railway',type:'raster',source:'mrl-railway',layout:{visibility:railVisibility(railDetails)},paint:{'raster-opacity':0.60}},first?.id);
}
const expandText={ms:['Besarkan peta','Keluar peta besar'],en:['Expand map','Exit expanded map'],zh:['展开地图','退出展开地图'],th:['ขยายแผนที่','ออกจากแผนที่ขยาย']};
let expanded=false,expandState=null;
function renderExpand(){
 const button=el('map-expand');if(!button)return;
 button.setAttribute('aria-expanded',String(expanded));
 button.setAttribute('aria-label',expandText[lang][expanded?1:0]);
 button.title=expandText[lang][expanded?1:0];
 button.firstElementChild.textContent=expanded?'×':'⛶';
}
function setExpanded(value){
 if(value===expanded)return;
 const shell=el('map-shell'),body=document.body;
 if(!shell)return;
 if(value){
  expandState={style:body.getAttribute('style'),x:window.scrollX,y:window.scrollY,
   siblings:Array.from(shell.parentElement.children).filter(n=>n!==shell).map(n=>[n,n.hasAttribute('inert')])};
  expandState.siblings.forEach(([n])=>n.setAttribute('inert',''));
  body.style.position='fixed';body.style.top=-expandState.y+'px';body.style.left=-expandState.x+'px';body.style.width='100%';body.style.overflow='hidden';
 }else if(expandState){
  expandState.siblings.forEach(([n,wasInert])=>{if(!wasInert)n.removeAttribute('inert');});
  if(expandState.style===null)body.removeAttribute('style');else body.setAttribute('style',expandState.style);
 }
 expanded=value;shell.classList.toggle('is-expanded',expanded);renderExpand();
 // Resize the same instance: centre, zoom, marker/popup and layers remain intact.
 map?.resize?.();
 if(!value&&expandState){window.scrollTo(expandState.x,expandState.y);expandState=null;}
 el('map-expand')?.focus({preventScroll:true});
}
function onMapKey(event){if(event.key==='Escape'&&expanded){event.preventDefault();setExpanded(false);}}
function onViewportResize(){if(expanded)map?.resize?.();}
function init(){
 try{
  const params=new URLSearchParams(window.location.search);
  pilotMode=params.get('railPilot')==='1';
  pilotDebug=pilotMode&&params.get('railDebug')==='1';
 }catch{pilotMode=false;pilotDebug=false}
 render();updateTheme();
 if(!window.maplibregl?.Map){el('label-status').textContent='Vector map engine unavailable';return;}
 map=new maplibregl.Map({
  container:'visitor-map',style:'https://tiles.openfreemap.org/styles/'+(theme()==='dark'?'dark':'positron'),
  center:centers.malaysia[0],zoom:centers.malaysia[1],minZoom:1,attributionControl:true,
  pitchWithRotate:false,dragRotate:false,touchPitch:false
 });
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');
 if(pilotDebug)attachPilotTouchDiagnostic();
 const expandButton=el('map-expand');
 const toggleExpanded=()=>setExpanded(!expanded);
 expandButton?.addEventListener('click',toggleExpanded);
 document.addEventListener('keydown',onMapKey);
 window.addEventListener('resize',onViewportResize);
 window.visualViewport?.addEventListener('resize',onViewportResize);
 map.on('remove',()=>{
  setExpanded(false);
  expandButton?.removeEventListener('click',toggleExpanded);
  document.removeEventListener('keydown',onMapKey);
  window.removeEventListener('resize',onViewportResize);
  window.visualViewport?.removeEventListener('resize',onViewportResize);
 });
 map.on('style.load',()=>{
  try{
   // Localize names BEFORE additional raster/vector layers mutate style readiness.
   applyLabels();
   const rails=readableRails();
   overlay();setRailVisibility();ready=true;
   if(pilotMode)installPilotVectorLayers();
   el('label-status').dataset.ready='true';
   el('rail-vector-note').textContent=rails?readableRailLanguage[lang].railLines:readableRailLanguage[lang].railMissing;
  }
  catch(e){el('label-status').textContent='Map style unavailable';}
 });
 // After setStyle or addSource the map can still have pending tiles at style.load.
 // Retry only missing pilot layers at idle, when rendering has settled.
 map.on('idle',()=>{
  if(labelUpdatePending)applyLabels();
  if(pilotMode&&(!map.getLayer('mrl-pilot-rail-hits')||!map.getLayer('mrl-pilot-stations')))
   installPilotVectorLayers();
 });
 map.on('error',()=>{if(!ready)el('label-status').textContent='Vector map unavailable';});
 document.querySelectorAll('[data-locale]').forEach(b=>b.addEventListener('click',()=>{setLanguage(b.dataset.locale);updateTheme();}));
 el('railway-btn').addEventListener('click',()=>{railDetails=!railDetails;setRailVisibility();});
 el('kl-registry-route')?.addEventListener('change',renderKLRegistry);
 document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>{
  const target=pilotMode?pilotCenters[b.dataset.region]:null;
  const destination=target?[target.center,target.zoom]:centers[b.dataset.region];
  if(destination)map.flyTo({center:destination[0],zoom:destination[1],duration:600});
  if(pilotMode&&pilotInfoPopup){pilotInfoPopup.remove();pilotInfoPopup=null;}
  activeRegion=b.dataset.region;
  // Remove Malaysia-only Thai aliases immediately when browsing other regions.
  if(lang==='th')applyLabels();
  renderLegendRegion();syncChinaCodeWidget();renderKLRegistry();
  el('liuzhou-guide').hidden=activeRegion!=='china';
  syncCampusPin();
 }));
 // Marker click is handled by MapLibre Marker.setPopup(), without an external campus button.
 document.querySelectorAll('[data-rail-legend]').forEach(b=>b.addEventListener('click',()=>{
  const i=Number(b.dataset.railLegend);
  if(Number.isInteger(i)&&i>=0&&i<railLegendI18n[lang].items.length){selectedRailLegend=i;renderLegendDetail();}
 }));
 const codeTrigger=el('china-code-trigger'),codePanel=el('china-code-panel');
 codeTrigger?.addEventListener('click',()=>{
  if(!pilotMode||activeRegion!=='china')return;
  codePanel.hidden=!codePanel.hidden;
  codeTrigger.setAttribute('aria-expanded',String(!codePanel.hidden));
  el('map-shell').classList.toggle('is-code-open',!codePanel.hidden);
  if(!codePanel.hidden){
   const legend=el('railway-legend');if(legend)legend.open=false;
   el('china-code-input')?.focus();
  }
 });
 el('china-code-close')?.addEventListener('click',()=>{
  codePanel.hidden=true;el('map-shell').classList.remove('is-code-open');
  codeTrigger.setAttribute('aria-expanded','false');codeTrigger.focus();
 });
 el('china-code-form')?.addEventListener('submit',e=>{e.preventDefault();showChinaRailCode(el('china-code-input').value);});
 document.querySelectorAll('[data-china-code]').forEach(b=>b.addEventListener('click',()=>{const code=b.dataset.chinaCode;el('china-code-input').value=code;showChinaRailCode(code);}));
 const mapLegend=el('railway-legend');
 if(mapLegend)mapLegend.addEventListener('toggle',()=>{
  if(mapLegend.open && codePanel && !codePanel.hidden){
   codePanel.hidden=true;el('map-shell').classList.remove('is-code-open');
   codeTrigger?.setAttribute('aria-expanded','false');
  }
  if(mapLegend.open&&!railDetails){
  // Prevent stale/open palette from swallowing taps in visitor-vector mode.
  mapLegend.open=false;
  return;
 }});
 el('theme-btn').addEventListener('click',()=>{
  const next=theme()==='dark'?'light':'dark';
  try{localStorage.setItem('railway-theme',next)}catch{}
  updateTheme();
  map.setStyle('https://tiles.openfreemap.org/styles/'+(next==='dark'?'dark':'positron'));
 });
 window.addEventListener('storage',e=>{
  if(e.key==='railway-language'&&locales.includes(e.newValue))setLanguage(e.newValue);
 });
}
if(typeof module==='object'&&module.exports)module.exports={nameExpression,isNameLayer,centers,copy,railVisibility,uiText,transportationSource,railVectorLayer,LRVTC_CAMPUS,campusText,pilotCenters,pilotEligibleStation,pilotEligibleRail,pilotFeatureInfo,pilotSourceForLayer,pilotStationVectorSource,railVectorFilter,queryPilotVectorFeature,railTapProbe,chinaRailCodeRecords,lookupChinaRailCode};
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
}
})();