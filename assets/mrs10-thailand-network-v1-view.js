/* Standalone Thailand viewer: OSM railway raster + source-linked visible station points.
 * No guessed railway lines or station coordinates; no canonical app mutation. */
(()=>{'use strict';const model=window.MRS10ThailandNetwork;if(!model||!window.L)return;
const words={
bm:{title:'Peta Rangkaian Kereta Api Thailand',sub:'Sambungan KTM Malaysia · SRT · BTS · MRT',find:'Cari laluan / stesen',all:'Semua',border:'Sambungan Malaysia',srt:'SRT Nasional',bangkok:'Rel Bangkok',act:'PADANG BESAR — Sambungan rel aktif ke KTMB; pertukaran tren biasanya diperlukan.',inactive:'SUNGAI KOLOK–RANTAU PANJANG — Tiada perkhidmatan tren rentas sempadan yang aktif.',plan:'Projek belum beroperasi',info:'OpenRailwayMap memaparkan rujukan landasan OSM. Nama stesen dalam katalog ialah node terpilih, bukan semua stesen; pusat peta bukan jajaran rel.',zoom:'Zum sehingga tahap 9 untuk melihat pin stesen OSM.',osm:'Pin stesen awam OSM',unavailable:'Sumber stesen langsung tidak tersedia; peta landasan masih boleh dilihat.',choose:'Pilih laluan di kiri untuk fokus kawasan.',theme:'Tukar tema'},
en:{title:'Thailand Railway Network Map',sub:'KTM Malaysia interface · SRT · BTS · MRT',find:'Find rail route / station',all:'All',border:'Malaysia Link',srt:'SRT National',bangkok:'Bangkok Rail',act:'PADANG BESAR — Active rail connection to KTMB; train transfer normally required.',inactive:'SU-NGAI KOLOK–RANTAU PANJANG — No active cross-border train service.',plan:'Not-yet-operational projects',info:'OpenRailwayMap depicts OSM-sourced railway reference. Catalogue nodes are selected examples, not every station; camera focus is not railway alignment.',zoom:'Zoom in to level 9 to load OSM station pins.',osm:'Public OSM station pins',unavailable:'Live station provider unavailable; railway tiles remain usable.',choose:'Choose a route to focus its region.',theme:'Switch theme'},
zh:{title:'泰国铁路网络地图',sub:'马来西亚 KTM 连接 · SRT · BTS · MRT',find:'搜索路线或站名',all:'全部',border:'马来西亚连接',srt:'泰国国铁',bangkok:'曼谷轨道',act:'PADANG BESAR — 与 KTMB 连接，通常需要换乘列车。',inactive:'SU-NGAI KOLOK–RANTAU PANJANG — 没有运营中的跨境列车。',plan:'尚未开通的项目',info:'OpenRailwayMap 使用 OSM 铁路参考资料。站名为代表性节点而非完整车站清单。',zoom:'放大到 9 级以显示 OSM 车站。',osm:'OSM 车站图钉',unavailable:'无法获取车站资料；铁路地图仍可用。',choose:'选择路线以聚焦区域。',theme:'切换主题'},
th:{title:'แผนที่เครือข่ายรถไฟประเทศไทย',sub:'เชื่อม KTM มาเลเซีย · SRT · BTS · MRT',find:'ค้นหาเส้นทางหรือสถานี',all:'ทั้งหมด',border:'เชื่อมต่อมาเลเซีย',srt:'รถไฟแห่งประเทศไทย',bangkok:'รถไฟกรุงเทพฯ',act:'ปาดังเบซาร์ — มีการเชื่อมต่อรถไฟกับ KTMB โดยทั่วไปต้องเปลี่ยนขบวน',inactive:'สุไหงโก-ลก–รันเตาปันจัง — ไม่มีรถไฟข้ามแดนให้บริการ',plan:'โครงการที่ยังไม่เปิดบริการ',info:'แผนที่อ้างอิง OpenRailwayMap / OSM ชื่อสถานีเป็นเพียงตัวอย่าง ไม่ใช่รายชื่อทั้งหมด',zoom:'ซูมถึงระดับ 9 เพื่อดูสถานี OSM',osm:'หมุดสถานี OSM',unavailable:'โหลดข้อมูลสถานีไม่ได้ แต่แผนที่รถไฟยังใช้งานได้',choose:'เลือกเส้นทางเพื่อเน้นพื้นที่',theme:'เปลี่ยนธีม'}};
let language='bm',filter='all',query='',dark=true,controller=null,prevQuery='',refreshTimer=null;
const byId=id=>document.getElementById(id),tr=k=>words[language][k]||k;
const map=L.map('th-map',{center:[14.3,101.1],zoom:6,preferCanvas:true,zoomControl:true});
const l=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors / CARTO'});
const d=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors / CARTO'}).addTo(map);
const rail=L.tileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{maxZoom:19,attribution:'Rail © OpenRailwayMap, data © OpenStreetMap contributors'}).addTo(map);
const stationLayer=L.layerGroup().addTo(map);
function text(tag,val,cls){const el=document.createElement(tag);el.textContent=val;if(cls)el.className=cls;return el;}
function createRoute(r){const b=text('button','', 'route '+r.group);b.type='button';b.append(text('strong',r.name),text('small',r.selectedNodes.join(' · ')));
 b.onclick=()=>{map.flyTo(r.view.center,r.view.zoom,{duration:.65});byId('selected').textContent=r.name+' · '+tr('choose');const a=byId('ref');a.href=model.sources[r.sourceKey];a.hidden=false;};return b;}
function render(){
 document.documentElement.lang=language==='bm'?'ms':language==='zh'?'zh':language==='th'?'th':'en';
 [['title','title'],['subtitle','sub'],['active','act'],['inactive','inactive'],['plan-title','plan'],['note','info']].forEach(p=>byId(p[0]).textContent=tr(p[1]));
 byId('search').placeholder=tr('find');byId('theme').textContent=tr('theme');byId('selected').textContent=tr('choose');
 for(const id of ['all','border','srt','bangkok']){const b=byId('filter-'+id);b.textContent=tr(id);b.setAttribute('aria-pressed',String(filter===id));}
 const found=(query?model.search(query):model.routes).filter(r=>filter==='all'||r.group===filter);
 const list=byId('routes');list.replaceChildren();found.forEach(r=>list.append(createRoute(r)));byId('count').textContent=found.length+' / '+model.routes.length;
 const project=byId('projects');project.replaceChildren();model.future.forEach(p=>{const e=text('div',p.name+' — '+p.status,'project');const a=document.createElement('a');a.textContent='Source';a.href=p.source;a.target='_blank';a.rel='noopener noreferrer';e.append(' ',a);project.append(e);});
 byId('station-status').textContent=tr('zoom');
}
function bboxOk(b){return b.getSouth()>5&&b.getNorth()<22&&b.getWest()>97&&b.getEast()<107&&b.getNorth()-b.getSouth()<1.4&&b.getEast()-b.getWest()<1.6;}
function pull(){
 if(controller)controller.abort();controller=null;
 const b=map.getBounds();if(map.getZoom()<9||!bboxOk(b)){stationLayer.clearLayers();byId('station-status').textContent=tr('zoom');return;}
 const box=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].map(x=>x.toFixed(4)).join(',');
 if(prevQuery===box)return;prevQuery=box;controller=new AbortController();const signal=controller.signal;
 const request='[out:json][timeout:18];(node["railway"~"^(station|halt)$"]('+box+');way["railway"~"^(station|halt)$"]('+box+'););out center 160;';
 const endpoints=['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter'];
 async function go(){let lastError;
  for(const endpoint of endpoints){try{const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(request),signal});if(!res.ok)throw Error('HTTP '+res.status);return await res.json();}catch(e){lastError=e;if(signal.aborted)throw e;}}
  throw lastError||Error('Station source unavailable');}
 byId('station-status').textContent='Loading OSM…';
 go().then(json=>{
  if(signal.aborted)return;const seen=new Set();let n=0;stationLayer.clearLayers();
  for(const feature of json.elements||[]){if(n>=140)break;const name=String(feature.tags?.name||feature.tags?.['name:en']||feature.tags?.['name:th']||'').trim().slice(0,100);
   const lat=feature.lat??feature.center?.lat,lon=feature.lon??feature.center?.lon;if(!name||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<5||lat>22||lon<97||lon>107)continue;
   const key=name+'|'+lat.toFixed(3)+'|'+lon.toFixed(3);if(seen.has(key))continue;seen.add(key);
   const pin=L.circleMarker([lat,lon],{radius:5,weight:1.3,color:'#ffffff',fillColor:'#14b8bf',fillOpacity:1});
   const popup=document.createElement('div');popup.append(text('strong',name),text('p','OSM '+feature.type+' '+feature.id));
   const a=document.createElement('a');a.href='https://www.openstreetmap.org/'+feature.type+'/'+feature.id;a.textContent='View OSM record';a.target='_blank';a.rel='noopener noreferrer';popup.append(a);pin.bindPopup(popup);stationLayer.addLayer(pin);n++;
  }
  byId('station-status').textContent=tr('osm')+': '+n+' (OSM, not operator-certified)';
 }).catch(e=>{if(!signal.aborted){prevQuery='';byId('station-status').textContent=tr('unavailable');}});
}
document.querySelectorAll('[data-lang]').forEach(el=>el.onclick=()=>{language=el.dataset.lang;document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));render();});
for(const key of ['all','border','srt','bangkok'])byId('filter-'+key).onclick=()=>{filter=key;render();};
byId('search').addEventListener('input',e=>{query=e.target.value;render();});
byId('theme').onclick=()=>{map.removeLayer(dark?d:l);dark=!dark;(dark?d:l).addTo(map);rail.bringToFront();render();};
map.on('moveend zoomend',()=>{if(refreshTimer)clearTimeout(refreshTimer);refreshTimer=setTimeout(pull,700);});render();pull();
})();