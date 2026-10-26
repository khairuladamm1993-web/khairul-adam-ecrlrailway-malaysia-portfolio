/* MR-S10 P01 ERL V2 isolated UI controller — no writes to central shell. */
(async function(){
 'use strict';
 const model=window.MRS10ERLV2,gis=window.MRS10ERLV2GIS;
 if(!model?.validate?.()||!gis)return;
 const d=document,loc=['ms','en','zh','th'],serviceNames={express:'KLIA Ekspres',transit:'KLIA Transit'};
 const words={
  ms:{title:'ERL · KLIA Ekspres & KLIA Transit',subtitle:'Dua identiti perkhidmatan, satu koridor berkongsi. Peta rujukan pelawat — bukan peta operasi.',
   map:'Peta stesen bersumber',schematic:'Turutan hentian perkhidmatan (skematik)',focus:'Paparan',all:'Semua',express:'Fokus Ekspres',transit:'Fokus Transit',reset:'Reset',
   light:'Mod Cerah',dark:'Mod Gelap',regular:'Hentian biasa',allstop:'Semua hentian',late:'Penting: Menurut operator, selepas 11:00 malam tren KLIA Ekspres juga berhenti di semua stesen. Semak jadual tren tertentu.',
   geometry:'Jajaran rel fizikal: BELUM DISAHKAN. Garis berwarna dalam lineup ialah skematik, bukan rel dipetakan.',
   wait:'Menyemak titik stesen daripada ArcGIS awam. Tiada koordinat atau polyline rekaan.',
   marker:'titik stesen yang dipadankan; sumber GIS sekunder, bukan ukuran operasi.',
   unavailable:'Sumber GIS tidak tersedia atau tiada padanan; rujuk lineup skematik. Tiada pin direka.',
   station:'Stesen',normal:'Servis biasa berhenti:',lateOnly:'Ekspres berhenti di sini hanya bagi corak semua-hentian lewat malam yang diumumkan operator; semak jadual.',
   source:'Sumber',shared:'Kedua-dua perkhidmatan',only:'Transit sahaja (corak biasa)',interchange:'Sambungan / pertukaran',close:'Tutup',waiting:'Sumber GIS belum dipadankan',
   attribution:'© OpenStreetMap contributors (ODbL); pin daripada ArcGIS awam dengan hak guna semula belum disahkan.'},
  en:{title:'ERL · KLIA Ekspres & KLIA Transit',subtitle:'Two service identities, shared corridor. Visitor reference — not an operations map.',
   map:'Source-backed station map',schematic:'Service stop sequence (schematic)',focus:'Display',all:'All',express:'Focus Ekspres',transit:'Focus Transit',reset:'Reset',
   light:'Light Mode',dark:'Dark Mode',regular:'Regular stops',allstop:'All stops',late:'Important: The operator states that after 11 pm KLIA Ekspres trains also stop at all stations. Check individual train timetables.',
   geometry:'Physical rail alignment UNVERIFIED. Coloured lineup is schematic, not mapped track.',
   wait:'Checking public ArcGIS station features. No invented coordinates or polylines.',
   marker:'source-matched stations; secondary GIS, not an operational survey.',
   unavailable:'GIS unavailable or no station match; use the schematic. No fabricated pins.',
   station:'Station',normal:'Regular service stops:',lateOnly:'Ekspres calls here only under the published late-night all-stops pattern; check the timetable.',
   source:'Source',shared:'Both services',only:'Transit only (regular pattern)',interchange:'Interchange / link',close:'Close',waiting:'GIS source not matched yet',
   attribution:'© OpenStreetMap contributors (ODbL); ArcGIS public points, reuse rights unverified.'},
  zh:{title:'机场快线 · KLIA Ekspres 与 KLIA Transit',subtitle:'两种服务标识，共用铁路走廊。仅供旅客参考，非运营地图。',
   map:'有来源的车站地图',schematic:'服务停站顺序（示意图）',focus:'显示',all:'全部',express:'仅看 Ekspres',transit:'仅看 Transit',reset:'重置',
   light:'浅色模式',dark:'深色模式',regular:'常规停站',allstop:'每站停靠',late:'注意：运营商说明晚上11点后，KLIA Ekspres 列车也会停靠所有车站。请核对具体班次。',
   geometry:'实际轨道走向尚未核实。彩色停站顺序图不是地理轨道。',
   wait:'正在查询公共 ArcGIS 车站数据；不虚构坐标或线路。',
   marker:'个来源匹配的站点；属于次级 GIS 参考，并非运营测量。',
   unavailable:'GIS 不可用或没有可靠匹配，请使用示意图；不会生成虚构站点。',
   station:'车站',normal:'常规停靠：',lateOnly:'仅根据已公布的深夜每站停靠安排在此停靠；请核对时刻表。',
   source:'来源',shared:'两种服务',only:'仅 Transit（常规）',interchange:'换乘／连接',close:'关闭',waiting:'GIS 来源尚未匹配',
   attribution:'© OpenStreetMap contributors (ODbL)；ArcGIS 点位转载许可待核实。'},
  th:{title:'ERL · KLIA Ekspres และ KLIA Transit',subtitle:'สองบริการบนแนวเส้นทางร่วมกัน แผนที่อ้างอิง ไม่ใช่แผนที่ปฏิบัติการ',
   map:'แผนที่สถานีที่มีแหล่งข้อมูล',schematic:'ลำดับสถานีที่จอด (แผนผัง)',focus:'แสดง',all:'ทั้งหมด',express:'เฉพาะ Ekspres',transit:'เฉพาะ Transit',reset:'รีเซ็ต',
   light:'โหมดสว่าง',dark:'โหมดมืด',regular:'จอดตามปกติ',allstop:'จอดทุกสถานี',late:'สำคัญ: ผู้ให้บริการระบุว่าหลัง 23:00 น. รถ KLIA Ekspres จะจอดทุกสถานี โปรดตรวจตารางแต่ละขบวน',
   geometry:'แนวรางจริงยังไม่ยืนยัน สีในแผนผังเป็นเพียงลำดับจอด ไม่ใช่แนวรางจริง',
   wait:'กำลังตรวจข้อมูลจุดสถานีจาก ArcGIS ไม่สร้างพิกัดหรือเส้นทางสมมติ',
   marker:' สถานีที่ตรงกับข้อมูล GIS ไม่ใช่ข้อมูลสำรวจเพื่อเดินรถ',
   unavailable:'ไม่สามารถตรวจ GIS หรือจับคู่สถานีได้ ใช้แผนผัง ไม่มีหมุดสมมติ',
   station:'สถานี',normal:'บริการที่จอดปกติ:',lateOnly:'Ekspres จอดที่นี่เฉพาะรูปแบบจอดทุกสถานีช่วงดึก โปรดตรวจตาราง',
   source:'แหล่งข้อมูล',shared:'ทั้งสองบริการ',only:'เฉพาะ Transit (ปกติ)',interchange:'จุดเปลี่ยนสาย / เชื่อมต่อ',close:'ปิด',waiting:'ยังไม่มีผลจับคู่ GIS',
   attribution:'© OpenStreetMap contributors (ODbL); สิทธิการใช้ซ้ำจุด ArcGIS ยังไม่ยืนยัน'}
 };
 let language='ms',theme='light',focus='all',map=null,points=[],markers=[],popup=null,maplibre=null;
 const el=id=>d.getElementById(id);
 const set=(id,v)=>{const x=el(id);if(x)x.textContent=v};
 function activeStation(s){return focus==='all'||s.serviceIds.includes('erl-klia-'+focus)}
 function make(tag,text,className){
  const x=d.createElement(tag);if(className)x.className=className;if(text!=null)x.textContent=text;return x;
 }
 function current(){return words[language]||words.en}
 function stationDetail(s){
  const copy=current(), box=make('div',null,'erl-popup');
  box.appendChild(make('strong',s.name));
  box.appendChild(make('p',copy.normal+' '+s.serviceIds.map(x=>x==='erl-klia-ekspres'?serviceNames.express:serviceNames.transit).join(' + ')));
  if(!s.serviceIds.includes('erl-klia-ekspres'))box.appendChild(make('p',copy.lateOnly));
  if(s.interchangeServices.length)box.appendChild(make('p',copy.interchange+': '+s.interchangeServices.join(' · ')));
  const a=make('a',copy.source);a.href=model.references.operatorTransit;a.target='_blank';a.rel='noopener noreferrer';
  box.appendChild(a);return box;
 }
 function renderLineup(which){
  const parent=el('line-'+which), copy=current(), srv=model.services[which];
  parent.replaceChildren();
  const header=make('h3',serviceNames[which]);header.className='service-h';
  parent.appendChild(header);
  parent.appendChild(make('p',which==='express'?copy.regular:copy.allstop,'substatus'));
  const ol=make('ol',null,'schematic-list '+which);
  for(const id of srv.stationSequence){
   const s=model.stationById(id),li=make('li'),b=make('button',null,'schematic-station');
   b.type='button';b.appendChild(make('span',null,'station-dot'));
   b.appendChild(make('span',s.name));b.title=copy.station+': '+s.name;
   b.addEventListener('click',()=>{const row=points.find(p=>p.stationId===id);
    if(row&&map){map.flyTo({center:row.coordinates,zoom:13.3});showPopup(s,row.coordinates)}
    else {set('selection',s.name+' · '+copy.wait)}
   });
   li.appendChild(b);ol.appendChild(li);
  }
  parent.appendChild(ol);
  parent.hidden=focus!=='all'&&focus!==which;
 }
 function showPopup(s,coordinates){
  if(!maplibre||!map)return;
  if(popup)popup.remove();
  popup=new maplibre.Popup({offset:18,maxWidth:'290px'})
   .setLngLat(coordinates).setDOMContent(stationDetail(s)).addTo(map);
 }
 function clearMarkers(){for(const m of markers)m.remove();markers=[]}
 function renderMarkers(){
  if(!maplibre||!map)return;
  clearMarkers();
  for(const row of points){
   const s=model.stationById(row.stationId);
   if(!activeStation(s))continue;
   const button=make('button',null,'erl-pin');
   button.type='button';button.setAttribute('aria-label',s.name+' · '+s.serviceIds.map(x=>x.replace('erl-klia-','')).join(', '));
   button.title=s.name;
   // A split marker encodes shared passenger SERVICE membership, not two track ways.
   const left=make('span',null,'pin-half '+(s.serviceIds.includes('erl-klia-ekspres')?'ekspres':'transit'));
   const right=make('span',null,'pin-half transit');
   if(focus==='express'){left.className='pin-half ekspres';right.className='pin-half ekspres'}
   else if(focus==='transit'){left.className='pin-half transit';right.className='pin-half transit'}
   const pinCore=make('span',null,'pin-core');pinCore.append(left,right);
   const pinLabel=make('span',s.name,'pin-label');
   button.append(pinCore,pinLabel);
   button.addEventListener('click',()=>showPopup(s,row.coordinates));
   const marker=new maplibre.Marker({element:button,anchor:'center'}).setLngLat(row.coordinates).addTo(map);
   markers.push(marker);
  }
 }
 function render(){
  const copy=current();d.documentElement.lang=language;
  d.documentElement.dataset.theme=theme;
  d.documentElement.style.setProperty('--express',model.colour.express[theme]);
  d.documentElement.style.setProperty('--transit',model.colour.transit[theme]);
  for(const [id,key] of [['title','title'],['subtitle','subtitle'],['map-title','map'],
   ['schematic-title','schematic'],['focus-label','focus'],['btn-all','all'],
   ['btn-express','express'],['btn-transit','transit'],['btn-reset','reset'],
   ['late-note','late'],['geometry-note','geometry'],['attribution','attribution']])set(id,copy[key]);
  set('theme',theme==='light'?copy.dark:copy.light);
  for(const l of loc){const b=el('locale-'+l);b.setAttribute('aria-pressed',String(l===language))}
  for(const k of ['all','express','transit'])el('btn-'+k).setAttribute('aria-pressed',String(focus===k));
  renderLineup('express');renderLineup('transit');renderMarkers();
  if(points.length)set('gis-status',points.length+'/6 '+copy.marker);
  else if(!el('gis-status').dataset.failed)set('gis-status',copy.waiting);
 }
 for(const l of loc)el('locale-'+l).addEventListener('click',()=>{language=l;render()});
 el('theme').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';render();if(map)map.setStyle(styleUrl())});
 for(const f of ['all','express','transit'])el('btn-'+f).addEventListener('click',()=>{focus=f;render()});
 el('btn-reset').addEventListener('click',()=>{
  focus='all';set('selection','');if(popup){popup.remove();popup=null}render();
  if(map){if(points.length)fitPoints();else map.jumpTo({center:[101.70,2.94],zoom:9.4})}
 });
 function styleUrl(){return 'https://tiles.openfreemap.org/styles/'+(theme==='dark'?'dark':'positron')}
 function fitPoints(){
  if(!map||!points.length||!maplibre)return;
  const b=new maplibre.LngLatBounds();
  for(const p of points)b.extend(p.coordinates);
  map.fitBounds(b,{padding:{top:55,bottom:55,left:50,right:50},maxZoom:12.4,duration:0});
 }
 render();
 try{
  const mod=await import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.js');
  maplibre=mod.default||mod;
  map=new maplibre.Map({container:'erl-map',style:styleUrl(),
   center:[101.70,2.94],zoom:9.4,attributionControl:true});
  map.addControl(new maplibre.NavigationControl({showCompass:false}),'top-right');
  map.on('load',()=>{renderMarkers();if(points.length)fitPoints()});
 }catch(e){el('gis-status').dataset.failed='1';set('gis-status',current().unavailable)}
 try{
  const response=await fetch(gis.requestUrl,{cache:'no-store',signal:AbortSignal.timeout(14000)});
  if(!response.ok)throw Error('GIS HTTP '+response.status);
  const data=await response.json();if(data.error||!Array.isArray(data.features))throw Error('GIS_SCHEMA');
  const result=gis.decode(data.features,model);
  if(!result.ok)throw Error(result.reason);
  points=result.points;
  if(!points.length)throw Error('NO_MATCH');
  render();fitPoints();
  if(result.missing)el('gis-status').textContent+=' · '+result.missing+'/6 unmatched';
 }catch(e){points=[];renderMarkers();el('gis-status').dataset.failed='1';set('gis-status',current().unavailable)}
})();
