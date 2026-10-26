/* TH V3 MapLibre isolated UI. Physical OSM ways never asserted to be a service alignment. */
(()=>{'use strict';const M=window.MRS10ThailandV3,G=window.MRS10ThailandV3GIS,ML=window.maplibregl;
const $=id=>document.getElementById(id);if(!M||!G||!ML){$('status').textContent='MapLibre unavailable';return;}
const words={
bm:{title:'Thailand Railway V3 — Rangkaian Selatan',sub:'Padang Besar → Hat Yai → Bangkok | Hat Yai → Su-ngai Kolok',border:'Padang Besar (Malaysia) ialah SATU stesen pertukaran KTMB/SRT. Padang Besar (Thai) stesen fizikal berasingan. MY UTC+8 · TH UTC+7.',kolok:'Su-ngai Kolok ↔ Rantau Panjang: PROPOSED_RECONNECTION; TIADA tren rentas sempadan aktif.',search:'Cari laluan atau stesen',all:'Semua',borderFilter:'Malaysia–Thailand',main:'Southern Main',east:'Pantai Timur',branches:'Cabang Selatan',planned:'Cadangan/sejarah',reset:'Reset',theme:'Tukar tema',line:'Urutan stesen',note:'Sumber SRT menyokong urutan rujukan; bukan semua tren berhenti di setiap stesen. GIS PENDING = koordinat belum dibuktikan.',geometry:'Rel OSM fizikal pada zum ≥10; way belum dipadankan dengan operasi SRT.',loading:'Memuat stesen GIS…',ready:'Pin bersumber:',pending:'GIS PENDING',fail:'GIS langsung gagal; pin sumber tempatan dikekalkan'},
en:{title:'Thailand Railway V3 — Southern Network',sub:'Padang Besar → Hat Yai → Bangkok | Hat Yai → Su-ngai Kolok',border:'Padang Besar Malaysia is ONE KTMB/SRT interchange building. Padang Besar (Thai) is a SEPARATE physical station. MY UTC+8 · TH UTC+7.',kolok:'Su-ngai Kolok ↔ Rantau Panjang: proposed reconnection only; NO active international train.',search:'Find route or station',all:'All',borderFilter:'Malaysia–Thailand',main:'Southern Main',east:'East Coast',branches:'Southern branches',planned:'Proposed/historic',reset:'Reset',theme:'Change theme',line:'Station order',note:'SRT supports selected station sequence, not stop patterns for every train. GIS PENDING = missing validated location.',geometry:'OSM physical track ways at zoom ≥10; not mapped to individual SRT services.',loading:'Loading GIS stations…',ready:'Source-backed pins:',pending:'GIS PENDING',fail:'Live GIS failed; local source-backed pins remain'},
zh:{title:'泰国铁路 V3 — 南线',sub:'巴东勿刹 → 合艾 → 曼谷 | 合艾 → 素艾哥洛',border:'Padang Besar Malaysia 是 KTMB/SRT 共用换乘站，Padang Besar (Thai) 是独立车站。马来西亚 UTC+8，泰国 UTC+7。',kolok:'Su-ngai Kolok ↔ Rantau Panjang：仅建议恢复铁路，并无现行跨境列车。',search:'查询车站或路线',all:'全部',borderFilter:'马泰连接',main:'南线干线',east:'东海岸',branches:'南线支线',planned:'规划/历史',reset:'重置',theme:'切换主题',line:'车站顺序',note:'SRT 所列顺序不是每班列车的停靠时刻表；GIS 待核实代表缺少验证位置。',geometry:'OSM 真实铁路 way 于缩放 ≥10 显示，未确认具体 SRT 服务归属。',loading:'正在加载 GIS…',ready:'有来源的车站：',pending:'GIS 待核实',fail:'GIS 服务不可用；保留已核实本地点'},
th:{title:'รถไฟไทย V3 — เครือข่ายสายใต้',sub:'ปาดังเบซาร์ → หาดใหญ่ → กรุงเทพฯ | หาดใหญ่ → สุไหงโก-ลก',border:'ปาดังเบซาร์ฝั่งมาเลเซียเป็นสถานีเปลี่ยนขบวน KTMB/SRT ร่วมกัน แต่สถานีฝั่งไทยเป็นคนละสถานี MY UTC+8 · TH UTC+7',kolok:'สุไหงโก-ลก ↔ รันเตาปันจัง: ข้อเสนอเปิดทางรถไฟอีกครั้ง ไม่มีรถไฟข้ามแดน',search:'ค้นหาสายทางหรือสถานี',all:'ทั้งหมด',borderFilter:'ไทย–มาเลเซีย',main:'สายใต้หลัก',east:'ฝั่งตะวันออก',branches:'สายแยกใต้',planned:'แผน/ประวัติ',reset:'เริ่มใหม่',theme:'เปลี่ยนธีม',line:'ลำดับสถานี',note:'ลำดับจาก SRT ไม่ใช่สถานีที่ทุกขบวนหยุด GIS PENDING คือพิกัดยังไม่ยืนยัน',geometry:'แสดง OSM railway ways เมื่อซูม ≥10 แต่ยังไม่ตรวจเส้นทางบริการ SRT',loading:'กำลังโหลด GIS…',ready:'หมุดที่มีแหล่งอ้างอิง:',pending:'GIS PENDING',fail:'GIS ไม่พร้อม ใช้หมุดอ้างอิงที่มีอยู่'}};
let lang='bm',filter='all',chosenRoute=null,chosenStation=null,textFilter='',dark=true,geo=G.points(M),track={type:'FeatureCollection',features:[]};
let popup=null,version=0,wayVersion=0,wayAbort=null,stationAbort=null,timer=null;
const map=new ML.Map({container:'map',style:'https://tiles.openfreemap.org/styles/dark',center:[100.5,9.4],zoom:5.8,minZoom:4,maxZoom:17,dragRotate:false,pitchWithRotate:false});
map.addControl(new ML.NavigationControl({showCompass:false}),'top-right');
const markerMap=new Map();
function T(k){return words[lang][k]||k;}function E(type,value,cls){const e=document.createElement(type);if(cls)e.className=cls;e.textContent=value||'';return e;}
function routes(){return M.corridors.filter(r=>filter==='all'||(filter==='planned'?r.status==='PLANNED':r.kind===filter));}
function stationIds(){return [...new Set(routes().flatMap(r=>r.selectedStationIds))];}
function coord(id){return geo.features.find(f=>f.properties.id===id)?.geometry.coordinates||null;}
function stationColor(id){return M.corridors.find(r=>r.selectedStationIds.includes(id))?.color||'#ffc061';}
function popupFor(s){const wrap=E('div');wrap.append(E('strong',s.nameEn+(s.nameTh?' / '+s.nameTh:'')),E('p',s.country+' · '+s.operator.join('/')+' · UTC'+(s.country==='MY'?'+8':'+7')));
 if(s.id==='th-my-padang-besar')wrap.append(E('p','SAME_PHYSICAL_STATION: KTMB + SRT, Malaysian border control facility'));
 if(s.id==='th-th-padang-besar')wrap.append(E('p','Separate Thai station — NOT the KTMB interchange.'));
 const href=geo.features.find(f=>f.properties.id===s.id)?.properties.sourceUrl||s.sourceUrls[0];
 const a=E('a','Source / OSM');a.href=href;a.target='_blank';a.rel='noopener noreferrer';wrap.append(a);return wrap;}
function focusStation(id,camera){const s=M.station(id);if(!s)return;chosenStation=id;popup?.remove();popup=null;const p=coord(id);
 if(p){popup=new ML.Popup({offset:18,maxWidth:'300px'}).setLngLat(p).setDOMContent(popupFor(s)).addTo(map);if(camera)map.flyTo({center:p,zoom:Math.max(map.getZoom(),11),duration:550});}
 if(!p)$('status').textContent=T('pending')+' — '+s.nameEn;
 for(const [key,marker] of markerMap)marker.getElement().classList.toggle('active',key===id);
 for(const b of document.querySelectorAll('#stations button'))b.classList.toggle('selected',b.dataset.id===id);
 const b=document.querySelector('#stations button[data-id="'+id+'"]');b?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function paintMarkers(){for(const m of markerMap.values())m.remove();markerMap.clear();const allowed=new Set(stationIds());
 for(const s of M.stations){if(!allowed.has(s.id))continue;const p=coord(s.id);if(!p)continue;
 const dom=E('button','', 'railmarker');dom.type='button';dom.title=s.nameEn;dom.style.setProperty('--pin',stationColor(s.id));
 dom.setAttribute('aria-label',s.nameEn);dom.append(E('span'));dom.addEventListener('click',()=>focusStation(s.id,true));
 const marker=new ML.Marker({element:dom,anchor:'center'}).setLngLat(p).addTo(map);markerMap.set(s.id,marker);}
 $('status').textContent=T('ready')+' '+markerMap.size+' / '+allowed.size;
}
function paintLists(){const rbox=$('routes');rbox.replaceChildren();
 for(const r of routes()){const names=r.selectedStationIds.map(id=>M.station(id)?.nameEn).join(' ');
 if(textFilter&&!((r.name+' '+names).toLowerCase().includes(textFilter)))continue;
 const b=E('button','');b.type='button';b.style.borderLeftColor=r.color;if(chosenRoute===r.id)b.classList.add('active');
 b.append(E('strong',r.name),E('small',r.selectedStationIds.length+' nodes · '+r.trackGeometryStatus));b.addEventListener('click',()=>focusRoute(r.id));rbox.append(b);}
 if(filter==='planned')rbox.append(E('p','Su-ngai Kolok ↔ Rantau Panjang — PLANNED / NO ACTIVE SERVICE','muted'));
 const box=$('stations');box.replaceChildren();const ids=chosenRoute?M.route(chosenRoute)?.selectedStationIds||[]:stationIds();
 for(const id of ids){const s=M.station(id);if(!s)continue;if(textFilter&&!((s.nameEn+' '+(s.nameTh||'')).toLowerCase().includes(textFilter)))continue;
 const b=E('button');b.type='button';b.dataset.id=id;b.style.setProperty('--dot',stationColor(id));
 b.append(E('i','','dot'),E('span',s.nameEn),E('small',coord(id)?s.country:T('pending')));if(id===chosenStation)b.classList.add('selected');
 b.addEventListener('click',()=>focusStation(id,true));box.append(b);}
}
function redrawText(){document.documentElement.lang=lang==='bm'?'ms':lang==='zh'?'zh':lang==='th'?'th':'en';
 for(const [id,key] of [['title','title'],['subtitle','sub'],['border-info','border'],['kolok-info','kolok'],['line-title','line'],['data-note','note'],['geometry-note','geometry'],['theme','theme'],['reset','reset']])$(id).textContent=T(key);
 $('search').placeholder=T('search');
 const names={all:'all',border:'borderFilter',main:'main',east:'east',branches:'branches',planned:'planned'};
 document.querySelectorAll('[data-filter]').forEach(b=>{b.textContent=T(names[b.dataset.filter]);b.setAttribute('aria-pressed',String(filter===b.dataset.filter));});paintLists();}
function focusRoute(id){const r=M.route(id);if(!r)return;chosenRoute=id;chosenStation=null;popup?.remove();popup=null;
 const bounds=G.pointBounds(geo,r.selectedStationIds);
 if(bounds){if(bounds[0][0]===bounds[1][0])map.flyTo({center:bounds[0],zoom:11});else map.fitBounds(bounds,{padding:65,duration:600,maxZoom:10});}
 else map.flyTo({center:r.view.center,zoom:r.view.zoom,duration:600});
 redrawText();paintMarkers();}
function restore(){filter='all';chosenRoute=null;chosenStation=null;textFilter='';$('search').value='';popup?.remove();popup=null;map.fitBounds([[98.5,5.8],[103,14.5]],{padding:50,duration:500,maxZoom:6});redrawText();paintMarkers();}
function mountSource(){if(!map.isStyleLoaded())return;
 if(!map.getSource('physical-osm-rail'))map.addSource('physical-osm-rail',{type:'geojson',data:track});
 if(!map.getLayer('physical-osm-rail-layer'))map.addLayer({id:'physical-osm-rail-layer',type:'line',source:'physical-osm-rail',paint:{'line-color':'#efa648','line-width':['interpolate',['linear'],['zoom'],9,1.5,14,3.5],'line-opacity':.95}});
 else map.getSource('physical-osm-rail').setData(track);}
async function overpass(query,signal){let err;for(const url of ['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter']){
 try{const ac=new AbortController();const cancel=()=>ac.abort();signal?.addEventListener('abort',cancel,{once:true});
 try{const tm=setTimeout(()=>ac.abort(),16500);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(query),signal:ac.signal});if(!r.ok)throw Error('Overpass '+r.status);return await r.json();}finally{clearTimeout(tm);}}finally{signal?.removeEventListener('abort',cancel);}}
 catch(e){err=e;if(signal?.aborted)throw e;}}throw err||Error('No Overpass response');}
async function stationsFromOSM(){stationAbort?.abort();stationAbort=new AbortController();const s=stationAbort.signal,v=++version;$('status').textContent=T('loading');
 // OSM station NAMES are matched only against SRT catalogue. Never classify close-by POIs by distance alone.
 const pattern=['ปาดังเบซาร์','ชุมทางหาดใหญ่','คลองแงะ','พัทลุง','ชุมทางทุ่งสง','สุราษฎร์ธานี','ชุมพร','หัวหิน','ปัตตานี','ยะลา','สุไหงโก-ลก','นครปฐม','ตรัง','กันตัง','นครศรีธรรมราช'].join('|');
 const q='[out:json][timeout:16];(node["railway"="station"]["name"~"('+pattern+')"](5.8,98.5,14.5,103);node["railway"="station"]["name:en"~"(Hat Yai|Padang Besar|Surat Thani|Hua Hin|Chumphon|Phatthalung|Yala|Pattani|Trang|Nakhon Pathom)"](5.8,98.5,14.5,103););out body 250;';
 try{const d=await overpass(q,s);if(s.aborted||v!==version)return;
 const items=(d.elements||[]).map(f=>G.sourceMatch(f,M)).filter(Boolean);geo=G.mergePoints(geo,items);paintMarkers();paintLists();}
 catch(e){if(!s.aborted){$('status').textContent=T('fail');paintMarkers();}}}
async function waysFromOSM(){wayAbort?.abort();wayAbort=null;
 if(map.getZoom()<10){track={type:'FeatureCollection',features:[]};mountSource();return;}
 const b=map.getBounds();const bounds=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()];
 if(!G.bboxValid(bounds)){track={type:'FeatureCollection',features:[]};mountSource();return;}
 const s=new AbortController();wayAbort=s;const v=++wayVersion;const bbox=bounds.map(n=>n.toFixed(5)).join(',');
 try{const d=await overpass('[out:json][timeout:13];way["railway"="rail"]('+bbox+');out geom 220;',s.signal);
 if(s.signal.aborted||v!==wayVersion)return;track=G.railwayWays(d.elements,bounds);mountSource();$('geometry-note').textContent=T('geometry')+' Ways: '+track.features.length+' (OSM geometry, unmatched)';}
 catch(e){if(!s.signal.aborted)$('geometry-note').textContent=T('geometry')+' — geometry source unavailable';}}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;document.querySelectorAll('[data-lang]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));redrawText();paintMarkers();}));
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;chosenRoute=null;chosenStation=null;popup?.remove();popup=null;redrawText();paintMarkers();if(filter==='border')focusRoute('th-v3-border');if(filter==='east')focusRoute('th-v3-east');if(filter==='main')focusRoute('th-v3-main');}));
$('search').addEventListener('input',e=>{textFilter=e.target.value.toLowerCase().trim();paintLists();});
$('reset').addEventListener('click',restore);
$('theme').addEventListener('click',()=>{dark=!dark;map.setStyle('https://tiles.openfreemap.org/styles/'+(dark?'dark':'positron'));});
map.on('style.load',()=>{mountSource();paintMarkers();});
map.on('moveend',()=>{clearTimeout(timer);timer=setTimeout(waysFromOSM,620);});
map.on('error',e=>{if(e?.error?.message)$('status').textContent='MapLibre: '+String(e.error.message).slice(0,100);});
redrawText();map.once('load',()=>{mountSource();paintMarkers();stationsFromOSM();});
})();