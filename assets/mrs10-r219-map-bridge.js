/* MR-S10 R2.19 — standalone, same-page MapLibre adapter; never fabricates AG geometry.
 * The existing R2.19 service catalogue is authoritative for ordered stops.
 * Vector POI data is external reference only; no track or turnout ID inferred.
 */
(async function(){
'use strict';
const host=document.getElementById('r219-map');
const api=window.MRS10AmpangR219;
if(!host||!api?.validate?.())return;
const note=document.getElementById('r219-map-note');
const select=document.getElementById('r219-region');
const locale=document.getElementById('lang');
let map,theme='light',region='malaysia',activePopup=null,lastAppliedLang=null;
const centers={malaysia:{center:[101.68653,3.14120],zoom:11.7},thailand:{center:[100.50144,13.75398],zoom:11},china:{center:[109.424,24.3285],zoom:11}};
const help={
 ms:'Peta vektor interaktif · Titik biru ialah POI umum; titik oren hanya daripada sumber GIS yang berjaya dipadankan, bukan data operasi.',
 en:'Interactive vector map · Blue dots are generic POIs; orange Ampang markers use source-matched GIS references, not operational coordinates.',
 zh:'交互式矢量地图 · 蓝点为普通兴趣点；橙点仅对应公共 GIS 来源记录，并非运营坐标。',
 th:'แผนที่เวกเตอร์ · จุดสีน้ำเงินคือ POI ทั่วไป; จุดสีส้มมาจากข้อมูล GIS ที่จับคู่แหล่งได้ ไม่ใช่พิกัดปฏิบัติการ'
};
const msg={
 ms:['Stesen peta','Padanan AG (calon, belum disahkan lokasi)','Rujukan peta, bukan identiti laluan yang disahkan','Trek fizikal belum disahkan'],
 en:['Map station','AG label match (candidate, location unverified)','Map reference, not verified service identity','Physical track unverified'],
 zh:['地图车站','AG 标识对应（候选，位置未核实）','地图参考；非已证实运营归属','实体轨道未核实'],
 th:['สถานีบนแผนที่','ชื่อ AG ตรงกันเบื้องต้น (ตำแหน่งยังไม่ยืนยัน)','ข้อมูลอ้างอิง ไม่ยืนยันสายบริการ','ยังไม่ยืนยันแนวรางจริง']
};
const mapStyle=()=> 'https://tiles.openfreemap.org/styles/'+(theme==='dark'?'dark':'positron');
const safeName=p=>{
 const language=locale?.value||'ms';
 const native=String(p?.name||'').trim(),english=String(p?.['name:en']||p?.name_en||p?.['name:latin']||'').trim();
 return (language==='zh'&&p?.['name:zh'])||(language==='th'&&p?.['name:th'])||english||native||msg[language]?.[0]||'Station';
};
function status(){if(note)note.textContent=help[locale?.value]||help.en}
function applyLabels(){
 if(!map?.isStyleLoaded?.())return;
 const language=locale?.value||'ms';
 if(lastAppliedLang===language)return;
 const tags=language==='ms'?['name:ms','name:en','name:latin','name']:
 language==='en'?['name:en','name:latin','name']:['name:'+language,'name:en','name:latin','name'];
 for(const layer of map.getStyle().layers||[]){
  if(layer.type!=='symbol'||layer.layout?.['text-field']==null||!(/label_|place_|water_name|highway_name_other|highway-name-/).test(layer.id))continue;
  try{map.setLayoutProperty(layer.id,'text-field',['coalesce',...tags.map(k=>['get',k])]);}catch{}
 }
 lastAppliedLang=language;
}
function installLayers(){
 lastAppliedLang=null;
 if(!map?.getStyle?.()?.sources)return;
 const style=map.getStyle();
 const station=style.layers?.find(l=>l['source-layer']==='poi'&&style.sources[l.source]?.type==='vector')?.source;
 const rail=style.layers?.find(l=>l['source-layer']==='transportation'&&style.sources[l.source]?.type==='vector')?.source;
 if(station&&!map.getLayer('r219-base-stations')){
  map.addLayer({id:'r219-base-stations',type:'circle',source:station,'source-layer':'poi',minzoom:10,
   filter:['all',['==',['get','class'],'railway'],['in',['get','subclass'],['literal',['station','subway']]]],
   paint:{'circle-radius':5.5,'circle-color':'#1F849E','circle-stroke-width':1.5,'circle-stroke-color':'#fff'}});
 }
 if(rail&&!map.getLayer('r219-base-rails')){
  map.addLayer({id:'r219-base-rails',type:'line',source:rail,'source-layer':'transportation',minzoom:8,
   filter:['in',['get','subclass'],['literal',['rail','subway','light_rail','monorail','tram']]],
   paint:{'line-color':theme==='dark'?'#87d8e8':'#247a97','line-width':1.6,'line-opacity':0.85}});
 }
 // Intentionally NO orange vector or line layer until observed source POIs are validated.
 applyLabels();status();
}
function featureAt(e){
 const layer=map.getLayer('r219-base-stations');if(!layer)return null;
 const p=e.point,b=[[p.x-10,p.y-10],[p.x+10,p.y+10]];
 try{return(map.queryRenderedFeatures(b,{layers:['r219-base-stations']})||[])[0]||null}catch{return null}
}
function stationPopup(e){
 if(window.MRS10AmpangGISOverlay?.at?.(e))return;
 const feature=featureAt(e);
 if(!feature||region!=='malaysia')return;
 const props=feature.properties||{},candidate=api.candidatePoi(props),verified=api.verifiedPoi(props);
 const lang=locale?.value||'ms',words=msg[lang]||msg.en;
 const root=document.createElement('div');root.className='r219-popup';
 const heading=document.createElement('strong');
 heading.textContent=candidate?.stationName||safeName(props);
 root.appendChild(heading);
 for(const line of [candidate?(verified?words[0]:words[1]):words[2],
  candidate?candidate.code+' · '+candidate.stationId:null,words[3]]){
  if(!line)continue;const p=document.createElement('p');p.textContent=line;root.appendChild(p);
 }
 if(activePopup)activePopup.remove();
 activePopup=new maplibre.Popup({offset:12,maxWidth:'255px'}).setLngLat(e.lngLat).setDOMContent(root).addTo(map);
}
let maplibre;
try {maplibre=await import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs')}catch{
 if(note)note.textContent='MapLibre unavailable / Tidak dapat memuatkan peta';return;
}
map=new maplibre.Map({container:host,style:mapStyle(),center:centers.malaysia.center,zoom:centers.malaysia.zoom,
 minZoom:1,pitchWithRotate:false,dragRotate:false,touchPitch:false,attributionControl:true});
map.addControl(new maplibre.NavigationControl({showCompass:false}),'top-left');
map.on('style.load',installLayers);
map.on('idle',applyLabels);
map.on('click',stationPopup);
window.MRS10AmpangGISOverlay?.attach?.({map,service:api,lib:maplibre,locale,region:()=>region});
document.addEventListener('mrs10-r219-theme',()=>{theme=document.documentElement.dataset.theme==='dark'?'dark':'light';map.setStyle(mapStyle())});
locale?.addEventListener('change',()=>{lastAppliedLang=null;status();applyLabels()});
select?.addEventListener('change',()=>{
 const next=select.value;if(!centers[next])return;region=next;
 window.MRS10AmpangGISOverlay?.toggle?.(next);
 if(activePopup){activePopup.remove();activePopup=null}
 map.flyTo({...centers[next],essential:true});status();
});
const exp=document.getElementById('r219-expand'),wrapper=document.getElementById('r219-map-shell');
exp?.addEventListener('click',()=>{
 const on=!wrapper.classList.contains('expanded');wrapper.classList.toggle('expanded',on);
 exp.setAttribute('aria-expanded',String(on));exp.textContent=on?'×':'⛶';
 document.documentElement.style.overflow=on?'hidden':'';map.resize();
});
status();
})();