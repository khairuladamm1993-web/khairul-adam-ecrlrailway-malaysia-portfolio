(function () {
"use strict";
const $ = id => document.getElementById(id);
const CATEGORIES = ["ALL","SABAH","SARAWAK","BLUE","RED","GREEN"];
const COLORS = {SABAH:"#008C95",BLUE:"#1976D2",RED:"#E0474C",GREEN:"#1A9D70"};
const WORDS = {
  ms:{title:"Borneo Rail & ART",subtitle:"Jabatan Keretapi Negeri Sabah · Sarawak Metro KUTS",language:"Bahasa",dark:"Gelap",light:"Cerah",public:"Data awam sahaja",survey:"Penunjuk lokasi bukan jadual operasi",loading:"Memuatkan katalog…",ready:"Katalog dimuatkan",error:"Katalog gagal dimuatkan",map:"Peta rangkaian",all:"Semua Borneo",sabah:"Sabah Railway",sarawak:"Sarawak ART",blue:"Blue Line",red:"Red Line",green:"Green Line",reset:"Tetapkan semula",confidence:"● Koordinat sekunder · □ Skematik tanpa GPS",lineup:"Susunan stesen",searchLabel:"Cari stesen, laluan atau kod",noRails:"Titik stesen disahkan daripada sumber GIS sekunder; geometri landasan tidak dilukis tanpa bukti.",mapFallback:"Peta interaktif tidak tersedia. Senarai stesen di bawah masih boleh digunakan.",disclaimer:"Paparan pendidikan, bukan sistem kawalan kereta api atau maklumat keberangkatan masa nyata.",stations:"stesen",visible:"marker kelihatan pada data",schematic:"Skematik sahaja — tiada GPS stesen disahkan",source:"Sumber lokasi",status:"Status",network:"Rangkaian",statusSabah:"Rangkaian wujud; semak jadual untuk perjalanan tertentu",statusArt:"Dalam pembangunan / ujian; operasi awam belum disahkan",selectStation:"Pilih stesen untuk fokus",secondary:"Koordinat OSM / rujukan awam",noTrack:"Jajaran sebenar belum diterbitkan sebagai GIS disahkan",partial:"Senarai rasmi separa, bukan semua hentian Fasa 1",noResults:"Tiada padanan",cityOnly:"Paparan kawasan Kuching sahaja, bukan lokasi hentian GPS",sabahMap:"15 titik stesen; landasan tidak dilukis",rail:"Rel",main:"Main Line",gorge:"Gorge Line",reference:"Rekod Sembulan (rujuk jadual)",pending:"Belum disahkan",official:"Rekod operator"},
  en:{title:"Borneo Rail & ART",subtitle:"Sabah State Railway · Sarawak Metro KUTS",language:"Language",dark:"Dark",light:"Light",public:"Public data only",survey:"Map position does not prove scheduled service",loading:"Loading catalogue…",ready:"Catalogue loaded",error:"Unable to load catalogue",map:"Network map",all:"All Borneo",sabah:"Sabah Railway",sarawak:"Sarawak ART",blue:"Blue Line",red:"Red Line",green:"Green Line",reset:"Reset",confidence:"● Secondary coordinates · □ Schematic without GPS",lineup:"Station lineup",searchLabel:"Search station, route or code",noRails:"Station points from secondary GIS; railway track is not drawn without verified geometry.",mapFallback:"Interactive map unavailable. The station list below remains accessible.",disclaimer:"Educational viewer; not railway control or real-time departure information.",stations:"stations",visible:"visible point records",schematic:"Schematic only — no verified station GPS",source:"Location source",status:"Status",network:"Network",statusSabah:"Existing network; verify individual journeys against the timetable",statusArt:"Construction/testing; public passenger operation unverified",selectStation:"Choose a station to focus",secondary:"OSM / public reference point",noTrack:"Verified GIS alignment unavailable",partial:"Partial operator-named roster, not all Phase 1 stops",noResults:"No matching stations",cityOnly:"Kuching regional view only, not a stop coordinate",sabahMap:"15 station points; no rail track geometry",rail:"Rail",main:"Main Line",gorge:"Gorge Line",reference:"Sembulan reference (check timetable)",pending:"Unverified",official:"Operator-named"},
  zh:{title:"婆罗洲铁路与智轨",subtitle:"沙巴州铁路 · 砂拉越都市交通系统",language:"语言",dark:"深色",light:"浅色",public:"仅公共数据",survey:"地图位置不代表列车停靠时刻",loading:"正在加载目录…",ready:"目录已加载",error:"目录加载失败",map:"交通网络地图",all:"整个婆罗洲",sabah:"沙巴铁路",sarawak:"砂拉越智轨",blue:"蓝线",red:"红线",green:"绿线",reset:"重置",confidence:"● 第二来源坐标 · □ 无GPS示意图",lineup:"车站顺序",searchLabel:"搜索车站、路线或代码",noRails:"车站坐标来自第二来源；未验证的铁路轨道不绘制。",mapFallback:"交互地图不可用。仍可使用下方车站列表。",disclaimer:"仅供教育参考，不用于铁路控制或实时发车查询。",stations:"座车站",visible:"处坐标标记",schematic:"仅示意图，尚无已核实的车站GPS",source:"坐标来源",status:"状态",network:"网络",statusSabah:"铁路网络存在；具体班次请查询官方时刻表",statusArt:"建设/测试中，公共运营尚未核实",selectStation:"选择车站查看",secondary:"OSM / 公开参考",noTrack:"尚无已验证的GIS路线",partial:"仅列出运营方已确认的部分站名",noResults:"无匹配结果",cityOnly:"仅展示古晋区域，并非车站GPS",sabahMap:"15个车站点，无铁路轨迹",rail:"铁路",main:"主线",gorge:"峡谷线",reference:"Sembulan参考站（核对时刻表）",pending:"未核实",official:"运营方公布"},
  th:{title:"รถไฟและ ART เกาะบอร์เนียว",subtitle:"รถไฟรัฐซาบาห์ · Sarawak Metro KUTS",language:"ภาษา",dark:"โหมดมืด",light:"โหมดสว่าง",public:"เฉพาะข้อมูลสาธารณะ",survey:"ตำแหน่งบนแผนที่ไม่ใช่ตารางเดินรถ",loading:"กำลังโหลดข้อมูล…",ready:"โหลดข้อมูลแล้ว",error:"โหลดข้อมูลไม่สำเร็จ",map:"แผนที่เครือข่าย",all:"บอร์เนียวทั้งหมด",sabah:"รถไฟซาบาห์",sarawak:"ART ซาราวัก",blue:"สายสีน้ำเงิน",red:"สายสีแดง",green:"สายสีเขียว",reset:"รีเซ็ต",confidence:"● พิกัดแหล่งรอง · □ แผนผังไม่มี GPS",lineup:"ลำดับสถานี",searchLabel:"ค้นหาสถานี สาย หรือรหัส",noRails:"จุดสถานีอ้างอิง GIS รอง ไม่วาดรางรถไฟที่ยังไม่มีข้อมูลยืนยัน",mapFallback:"แผนที่ไม่พร้อมใช้งาน แต่ยังดูรายชื่อสถานีได้",disclaimer:"ข้อมูลเพื่อการศึกษา ไม่ใช้ควบคุมรถไฟหรือดูเวลาออกจริง",stations:"สถานี",visible:"จุดที่ระบุตำแหน่ง",schematic:"แผนผังเท่านั้น ยังไม่มี GPS สถานียืนยัน",source:"แหล่งตำแหน่ง",status:"สถานะ",network:"เครือข่าย",statusSabah:"มีเครือข่าย แต่ตรวจตารางเวลาแต่ละเที่ยว",statusArt:"ก่อสร้าง/ทดสอบ ยังไม่ยืนยันเปิดบริการสาธารณะ",selectStation:"เลือกสถานีเพื่อดูตำแหน่ง",secondary:"OSM / แหล่งสาธารณะ",noTrack:"ยังไม่มีแนวเส้นทาง GIS ยืนยัน",partial:"รายชื่อจากผู้ดำเนินงานบางส่วน ไม่ครบทั้งหมด",noResults:"ไม่พบผลลัพธ์",cityOnly:"แสดงพื้นที่กูชิง ไม่ใช่พิกัดสถานี",sabahMap:"15 จุดสถานี ไม่วาดเส้นราง",rail:"รางรถไฟ",main:"สายหลัก",gorge:"สายหุบเขา",reference:"Sembulan ใช้อ้างอิง (ตรวจตาราง)",pending:"ยังไม่ยืนยัน",official:"ผู้ดำเนินงานยืนยัน"}
};
const state = {data:null,lang:"ms",category:"ALL",query:"",theme:"light",map:null,mapLoaded:false,popup:null,selectedId:null,focusVersion:0};
const tr = key => (WORDS[state.lang] || WORDS.ms)[key] || WORDS.en[key] || key;
const norm = value => String(value||"").normalize("NFKD").toLocaleLowerCase().trim();
const pointOK = item => item && item.point && item.point.type==="Point" && Array.isArray(item.point.coordinates) && item.point.coordinates.length===2 && item.point.coordinates.every(Number.isFinite);
function validate(data){
  if(!data || data.schema!=="mrs10.borneo.v2" || data.sabah?.stations?.length!==15 || data.sarawak?.lines?.length!==3)throw Error("Invalid Borneo registry schema/count");
  const ids=new Set(),coords=new Set();
  for(const s of data.sabah.stations){
    if(ids.has(s.id)||coords.has(s.point.coordinates.join(","))||!pointOK(s))throw Error("Duplicate or absent station point");
    ids.add(s.id);coords.add(s.point.coordinates.join(","));
    const [lon,lat]=s.point.coordinates;if(!(lon>114&&lon<117&&lat>4.5&&lat<6.5)||!s.location_source?.startsWith("https://"))throw Error("Unverified station extent/provenance");
  }
  for(const s of data.sarawak.stations){if(ids.has(s.id)||s.point!==null)throw Error("ART cannot have assumed GPS");ids.add(s.id)}
  if(data.sabah.track_geometry!==null||data.sarawak.route_geometry!==null||data.sarawak.classification!=="URBAN_TRANSIT_ART"||data.sarawak.rail_track!==false)throw Error("Track/ART classification breach");
}
function translated(){document.documentElement.lang=state.lang;document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=tr(el.dataset.i18n));$("theme").textContent=tr(state.theme==="light"?"dark":"light");}
function selectedStations(){
  if(!state.data)return [];
  let all=[];
  if(["ALL","SABAH"].includes(state.category))all.push(...state.data.sabah.stations.map(s=>({...s,network:"SABAH",line:s.segment==="gorge"?"GORGE":"MAIN"})));
  if(["ALL","SARAWAK","BLUE","RED","GREEN"].includes(state.category))all.push(...state.data.sarawak.stations.filter(s=>["ALL","SARAWAK"].includes(state.category)||s.line===state.category).map(s=>({...s,network:"SARAWAK"})));
  const q=norm(state.query);return q?all.filter(s=>[s.name,s.id,s.code,s.line,s.network,s.segment,"Kuching","Sabah","Sarawak"].some(t=>norm(t).includes(q))):all;
}
function pointFeatures(rows){return {type:"FeatureCollection",features:rows.filter(pointOK).map(s=>({type:"Feature",id:s.id,geometry:s.point,properties:{id:s.id,name:s.name,color:COLORS.SABAH,segment:s.segment,confidence:s.point_confidence}}))}}
function attach(tag,klass,text){const n=document.createElement(tag);if(klass)n.className=klass;if(text!=null)n.textContent=String(text);return n}
function displaySummary(rows){
  const view=$("summary");view.replaceChildren();
  const isArt=!["SABAH"].includes(state.category)&&state.category!=="ALL";
  const n=rows.filter(pointOK).length;
  view.append(attach("strong",null,isArt?tr("statusArt"):tr("statusSabah")));
  view.append(attach("p",null,isArt?tr("schematic"):tr("sabahMap")));
  view.append(attach("p",null,tr("noTrack")));
  if(state.category==="ALL")view.append(attach("p",null,tr("partial")));
  $("counts").textContent=n+" "+tr("visible")+" · "+rows.length+" "+tr("stations");
}
function renderSchematic(){
 const node=$("schematic");node.replaceChildren();
 if(!state.data||state.category==="SABAH")return;
 const lines=state.data.sarawak.lines.filter(l=>["ALL","SARAWAK"].includes(state.category)||l.id===state.category);
 for(const line of lines){
   const card=attach("div","schematic-line");card.style.setProperty("--line-color",line.color);
   card.append(attach("div","schematic-title",line.name+" · ART"));
   card.append(attach("div","schematic-locations",line.start+" → "+line.end));
   const stopstrip=attach("div","schematic-stop-strip");
   const part=state.data.sarawak.stations.filter(x=>x.line===line.id);
   if(part.length)part.forEach(x=>stopstrip.append(attach("span",null,x.code+" "+x.name)));
   else stopstrip.append(attach("span",null,tr("pending")));
   card.append(stopstrip,attach("p","schematic-note",tr("schematic")+" · "+tr("partial")));
   node.append(card);
 }
}
function renderLineup(){
  const rows=selectedStations(), list=$("lineup");list.replaceChildren();displaySummary(rows);
  if(!rows.length){list.append(attach("p","summary",tr("noResults")));return}
  let last=null;
  rows.forEach(s=>{
    const group=s.network==="SABAH"?(s.segment==="gorge"?"GORGE":s.segment==="reference_only"?"REFERENCE":"MAIN"):s.line;
    if(group!==last){const label=attach("div","line-label",group==="MAIN"?tr("main"):group==="GORGE"?tr("gorge"):group==="REFERENCE"?tr("reference"):(state.data.sarawak.lines.find(x=>x.id===group)?.name||group));label.style.setProperty("--line-color",COLORS[s.network==="SABAH"?"SABAH":group]);list.append(label);last=group;}
    const button=attach("button","item");button.type="button";button.dataset.id=s.id;button.setAttribute("aria-current",String(state.selectedId===s.id));button.style.setProperty("--line-color",COLORS[s.network==="SABAH"?"SABAH":s.line]);
    button.append(attach("span","line-dot"),attach("span","num",s.network==="SABAH"?String(s.sequence).padStart(2,"0"):s.code));
    const info=attach("span","station");info.append(attach("span","name",s.name),attach("span","meta",pointOK(s)?tr("secondary"):tr("schematic")));button.append(info,attach("span","badge",pointOK(s)?"GIS":tr("pending")));
    button.addEventListener("click",()=>focusStation(s));list.append(button);
  });
}
function updateData(){
  renderLineup();renderSchematic();
  if(state.mapLoaded&&state.map){
    const source=state.map.getSource("borneo-points");
    if(source)source.setData(pointFeatures(selectedStations()));
  }
}
function showPopup(s){
  if(!state.map||!pointOK(s)||typeof maplibregl==="undefined")return;
  if(state.popup)state.popup.remove();
  const root=attach("div");
  root.append(attach("div","popup-title",s.name),attach("div","popup-sub",s.id+" · "+tr("sabah")));
  root.append(attach("div","popup-sub",tr("status")+": "+tr("statusSabah")));
  root.append(attach("div","popup-sub",tr("source")+": "+tr("secondary")));
  const anchor=attach("a","popup-link",tr("source"));anchor.href=s.location_source;anchor.rel="noopener noreferrer";anchor.target="_blank";root.append(anchor);
  state.popup=new maplibregl.Popup({offset:14,maxWidth:"290px"}).setLngLat(s.point.coordinates).setDOMContent(root).addTo(state.map);
}
function focusStation(s){
  state.selectedId=s.id;renderLineup();
  if(!state.map||!state.mapLoaded)return;
  if(pointOK(s)){state.map.easeTo({center:s.point.coordinates,zoom:11,duration:300});showPopup(s)}
  else{state.map.easeTo({center:[110.3593,1.5535],zoom:10,duration:300});$("map-info").textContent=tr("cityOnly");}
}
function focusCategory(){
  state.focusVersion++;
  if(!state.map||!state.mapLoaded)return;
  if(state.popup){state.popup.remove();state.popup=null}
  const current=state.category;
  if(["SARAWAK","BLUE","RED","GREEN"].includes(current)){
    state.map.easeTo({center:[110.3593,1.5535],zoom:10,duration:400});$("map-info").textContent=tr("cityOnly");
  }else if(current==="SABAH"){
    state.map.fitBounds([[115.64,5.03],[116.21,6.02]],{padding:45,maxZoom:10,duration:400});$("map-info").textContent=tr("noRails");
  }else{
    state.map.fitBounds([[109.95,0.95],[117.30,6.55]],{padding:35,maxZoom:6.5,duration:400});$("map-info").textContent=tr("noRails");
  }
}
function setCategory(cat){if(!CATEGORIES.includes(cat))return;state.category=cat;state.selectedId=null;document.querySelectorAll("[data-category]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.category===cat)));updateData();focusCategory()}
function setTheme(mode){
  state.theme=mode;document.documentElement.dataset.theme=mode;
  $("theme").textContent=tr(mode==="light"?"dark":"light");
  if(state.map&&state.mapLoaded){try{state.map.setPaintProperty("borneo-base","raster-brightness-max",mode==="dark"?0.57:1);state.map.setPaintProperty("borneo-base","raster-saturation",mode==="dark"?-0.58:0)}catch(e){console.warn("Basemap theme unavailable",e)}}
}
function initMap(){
  if(!window.maplibregl||typeof maplibregl.Map!=="function"||(maplibregl.supported&&!maplibregl.supported())){ $("map-fallback").hidden=false;return }
  const style={version:8,sources:{"borneo-tiles":{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"}},layers:[{id:"borneo-base",type:"raster",source:"borneo-tiles",paint:{"raster-opacity":.85}}]};
  try{
    state.map=new maplibregl.Map({container:"map",style,center:[113.4,3.7],zoom:5.15,attributionControl:true,dragRotate:false,pitchWithRotate:false,fadeDuration:0});
    state.map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    const restore=()=>{
      if(!state.map.getSource("borneo-points"))state.map.addSource("borneo-points",{type:"geojson",data:pointFeatures(selectedStations())});
      if(!state.map.getLayer("borneo-stations"))state.map.addLayer({id:"borneo-stations",type:"circle",source:"borneo-points",paint:{"circle-radius":["interpolate",["linear"],["zoom"],4,7,9,10,14,13],"circle-color":["get","color"],"circle-stroke-color":"#fff","circle-stroke-width":2.5,"circle-opacity":1}});
      state.mapLoaded=true;updateData();setTheme(state.theme);focusCategory();
    };
    state.map.on("style.load",restore);
    state.map.on("click","borneo-stations",evt=>{const id=evt.features?.[0]?.properties?.id;const s=state.data?.sabah.stations.find(x=>x.id===id);if(s)focusStation(s)});
    state.map.on("mouseenter","borneo-stations",()=>state.map.getCanvas().style.cursor="pointer");
    state.map.on("mouseleave","borneo-stations",()=>state.map.getCanvas().style.cursor="");
    state.map.on("error",err=>{console.warn("Map resource problem",err?.error?.message||err);});
  }catch(e){$("map-fallback").hidden=false;console.warn("MapLibre startup failed",e);}
}
function report(){
 const rows=selectedStations(), visible=rows.filter(pointOK).length;
 let rendered=null;
 try{if(state.mapLoaded&&state.map&&state.map.getLayer("borneo-stations"))rendered=state.map.queryRenderedFeatures({layers:["borneo-stations"]}).length;}catch(e){}
 return {schema:state.data?.schema||null,category:state.category,stationCount:state.data?.sabah?.stations?.length||0,visibleGeoJSONCount:visible,renderedFeatureCount:rendered,mapLoaded:state.mapLoaded,theme:state.theme,language:state.lang,railTrackGeoJSON:false,artFakeGPS:false};
}
window.__BORNEO_V2_QA=report;
async function start(){
  $("language").addEventListener("change",e=>{state.lang=e.target.value;translated();updateData();focusCategory()});
  $("theme").addEventListener("click",()=>setTheme(state.theme==="light"?"dark":"light"));
  $("search").addEventListener("input",e=>{state.query=e.target.value;updateData()});
  $("category").addEventListener("click",e=>{const b=e.target.closest("button[data-category]");if(b)setCategory(b.dataset.category)});
  $("reset").addEventListener("click",()=>{$("search").value="";state.query="";setCategory("ALL")});
  translated();
  try{
    const response=await fetch("./data/borneo-v2-registry.json",{cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const data=await response.json();validate(data);state.data=data;
    $("status").textContent=tr("ready");updateData();initMap();
  }catch(e){$("status").textContent=tr("error");$("map-fallback").hidden=false;$("summary").textContent=String(e.message||e);console.error("Borneo source validation",e)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();