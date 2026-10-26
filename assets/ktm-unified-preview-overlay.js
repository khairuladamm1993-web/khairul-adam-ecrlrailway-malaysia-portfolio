/* KTM Unified non-production overlay. GTFS public stop points only; never draws a rail polyline. */
(function(root){
'use strict';
const IDS=['ktmb-ets-v1','ktmb-ert','ktmb-shuttle-timuran'];
const NAMES={
 ms:['ETS · perjalanan contoh','Ekspres Rakyat Timuran','Shuttle Timur'],
 en:['ETS · example train','Ekspres Rakyat Timuran','Eastern Shuttle'],
 zh:['ETS 电动列车 · 示例班次','东海岸人民快车','东海岸接驳列车'],
 th:['ETS · เที่ยวรถตัวอย่าง','รถด่วนรัคยัตตีมูรัน','รถรับส่งสายตะวันออก']
};
const WORDS={
 ms:{title:'UJI ETS + INTERCITY (GTFS RASMI)',read:'Pilih ETS atau Intercity untuk melihat hentian satu perjalanan GTFS sebenar. Ini bukan semua corak hentian atau garisan landasan.',stop:'hentian',trip:'Perjalanan GTFS',reset:'Pilih Semua / Reset Komuter untuk kembali.',source:'Sumber koordinat: KTMB GTFS rasmi · data.gov.my'},
 en:{title:'TEST ETS + INTERCITY (OFFICIAL GTFS)',read:'Choose ETS or Intercity to view stops from one recorded GTFS train trip, not every stopping pattern or the physical track.',stop:'stops',trip:'GTFS trip',reset:'Select All / Reset Komuter to return.',source:'Coordinate source: official KTMB GTFS · data.gov.my'},
 zh:{title:'测试 ETS 与城际列车（官方 GTFS）',read:'选择 ETS 或城际列车，查看 GTFS 中一班列车的真实停站顺序。并非所有班次或实际轨道走向。',stop:'站',trip:'GTFS 车次',reset:'选择全部 / 重置返回通勤列车。',source:'坐标来源：KTMB 官方 GTFS · data.gov.my'},
 th:{title:'ทดสอบ ETS และรถไฟระหว่างเมือง (GTFS ทางการ)',read:'เลือก ETS หรือ Intercity เพื่อแสดงสถานีของเที่ยวรถจริงหนึ่งเที่ยวจาก GTFS ไม่ใช่ทุกเที่ยวหรือแนวรางจริง',stop:'สถานี',trip:'เที่ยวรถ GTFS',reset:'เลือกทั้งหมด / รีเซ็ต เพื่อกลับสู่รถไฟชานเมือง',source:'ที่มาพิกัด: GTFS ทางการของ KTMB · data.gov.my'}
};
const $=id=>document.getElementById(id);
function validate(data){
 if(!data||data.schemaVersion!==1||data.source!=='KTMB_OFFICIAL_GTFS_TRIP_PATTERNS'||
    data.sourceUrl!=='https://api.data.gov.my/gtfs-static/ktmb'||
    data.physicalTrackGeometry!==null||!Array.isArray(data.services)||data.services.length!==3)return false;
 return data.services.every((s,i)=>s.id===IDS[i]&&/^[A-Z0-9]+$/.test(s.routeId)&&s.tripId&&
  /^#[A-Fa-f0-9]{6}$/.test(s.color)&&Array.isArray(s.stops)&&s.stops.length>=2&&
  s.stops.every((p,j)=>p.order===j+1&&p.name&&p.id&&Number.isFinite(p.lon)&&Number.isFinite(p.lat)&&
                    p.lon>=99.5&&p.lon<=105&&p.lat>=1&&p.lat<=7.5));
}
function mount({map,lib,selectKomuter}){
 const locale=()=>WORDS[$('lang')?.value]||WORDS.ms;
 const lang=()=>NAMES[$('lang')?.value]||NAMES.ms;
 const container=document.createElement('section');container.id='unified-chooser';container.style.cssText='border:1px solid var(--border);background:var(--card);padding:10px;border-radius:12px;margin:9px 0';
 const title=document.createElement('strong'),desc=document.createElement('p'),bar=document.createElement('div'),info=document.createElement('p');
 bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0'; info.style.cssText='font-size:.83rem;color:var(--muted)';
 container.append(title,desc,bar,info);$('filters').after(container);
 const panel=document.createElement('section');panel.id='ktm-unified-lineup';panel.className='panel';panel.hidden=true;$('services').after(panel);
 let data=null,selected=null,popup=null,audit=null;
 const review=p=>selectedReview(p);
 function selectedReview(p){return audit?.stops?.find(x=>x.stopId===p.id)||null;}
 function validateAudit(a){const sh=data?.services.find(s=>s.id===IDS[2]);return !!(a&&sh&&a.schemaVersion===2&&a.tripId===sh.tripId&&a.zipSha256===data.zipSha256&&a.sourceUrl===data.sourceUrl&&Array.isArray(a.stops)&&a.stops.length===sh.stops.length&&a.stops.every((x,i)=>x.stopId===sh.stops[i].id&&x.order===i+1&&Math.abs(x.originalCoordinates.lat-sh.stops[i].lat)<1e-7&&Math.abs(x.originalCoordinates.lon-sh.stops[i].lon)<1e-7&&['VERIFIED','ACCEPTABLE_STATION_OFFSET','APPROXIMATE','SUSPECTED_MISMATCH','UNRESOLVED'].includes(x.decision)));}
 const source='ktm-unified-source',circle='ktm-unified-circles',labels='ktm-unified-labels';
 function service(){return data?.services.find(s=>s.id===selected)||null;}
 function names(){return (data?.services||[]).map((s,i)=>lang()[i]);}
 function elements(s){
  return {type:'FeatureCollection',features:s?s.stops.map(p=>({type:'Feature',
    properties:{name:p.name,stopId:p.id,order:p.order,color:s.color,serviceId:s.id,tripId:s.tripId,
    gisDecision:s.id===IDS[2]?(review(p)?.decision||'UNRESOLVED'):'GTFS_ONLY'},
    geometry:{type:'Point',coordinates:[p.lon,p.lat]}})):[]};
 }
 function focus(s){if(!s||!map?.getStyle()?.sources)return;const lon=s.stops.map(p=>p.lon),lat=s.stops.map(p=>p.lat);
  map.fitBounds([[Math.min(...lon),Math.min(...lat)],[Math.max(...lon),Math.max(...lat)]],{padding:45,maxZoom:10.8,duration:250});}
 function syncVisibility(){
  if(!map?.getStyle()?.sources)return;
  if(selected){
   for(const layer of map.getStyle().layers||[]){
    if(layer.id.startsWith('ktmv2-')&&map.getLayer(layer.id))
      map.setLayoutProperty(layer.id,'visibility','none');
   }
  }
  if(map.getLayer(circle))map.setLayoutProperty(circle,'visibility',selected?'visible':'none');
  if(map.getLayer(labels))map.setLayoutProperty(labels,'visibility',selected?'visible':'none');
 }
 function layers(){
  if(!map?.getStyle()?.sources||!data)return;
  const geo=elements(service());
  if(!map.getSource(source))map.addSource(source,{type:'geojson',data:geo});else map.getSource(source).setData(geo);
  if(!map.getLayer(circle))map.addLayer({id:circle,type:'circle',source,
   paint:{'circle-radius':['interpolate',['linear'],['zoom'],6,6.5,12,10],
   'circle-color':['get','color'],'circle-stroke-width':2.5,
   'circle-stroke-color':['case',['==',['get','gisDecision'],'SUSPECTED_MISMATCH'],'#c62626',['==',['get','gisDecision'],'UNRESOLVED'],'#d98b1b','#102a39'],
   'circle-opacity':.97}});
  if(!map.getLayer(labels))map.addLayer({id:labels,type:'symbol',source,minzoom:8.2,
   layout:{'text-field':['get','name'],'text-size':12,'text-offset':[0,1.2],
     'text-anchor':'top','text-allow-overlap':false},
   paint:{'text-color':'#17313f','text-halo-color':'#ffffff','text-halo-width':2.5}});
  syncVisibility();
 }
 function openStop(p,s){if(!map||!lib)return;popup?.remove();
  const root=document.createElement('div'),h=document.createElement('strong'),detail=document.createElement('p'),origin=document.createElement('a');
  h.textContent=p.name;detail.textContent=lang()[IDS.indexOf(s.id)]+' · '+locale().trip+' '+s.tripId+' · '+locale().stop+' '+p.order;
  origin.href=data.sourceUrl;origin.target='_blank';origin.rel='noopener noreferrer';origin.textContent=locale().source;
  if(s.id===IDS[2]){
   const a=review(p),evidence=document.createElement('p');
   evidence.textContent='Stop ID '+p.id+' · GIS: '+(a?.decision||'UNRESOLVED')+' · '+(a?.confidence||'LOW')+' confidence · Track offset: '+(a?.offsetMeters==null?'unavailable':a.offsetMeters+' m');
   const original=document.createElement('p');original.textContent='Original KTMB GTFS: '+(a?.originalCoordinates?.lat??p.lat)+', '+(a?.originalCoordinates?.lon??p.lon)+(a?.coordinatesChanged?' · Map position: '+p.lat+', '+p.lon+' (OSM station POI)':' · Unchanged');
   const reason=document.createElement('p');reason.textContent=a?.reason||'Railway geometry evidence not independently verified';
   root.append(evidence,original,reason);
   if(a?.replacementSourceUrl||a?.railwayAlignmentEvidence?.osmRailwayUrl){const track=document.createElement('a');track.href=a.replacementSourceUrl||a.railwayAlignmentEvidence.osmRailwayUrl;track.target='_blank';track.rel='noopener noreferrer';track.textContent='OSM railway evidence';root.append(track);}
  }
  root.prepend(h,detail);root.append(origin);popup=new lib.Popup({offset:14,maxWidth:'300px'}).setLngLat([p.lon,p.lat]).setDOMContent(root).addTo(map);
 }
 function refresh(){const w=locale();title.textContent=w.title;desc.textContent=w.read;info.textContent=data?'GTFS '+new Date(data.snapshotUtc).toISOString().slice(0,10)+' · CC BY 4.0'+(audit?' · Shuttle GIS '+audit.qualityGate+' · suspect '+(audit.decisions.SUSPECTED_MISMATCH||0)+' / unresolved '+(audit.decisions.UNRESOLVED||0):' · GIS review unavailable / pending'):w.read;
  bar.replaceChildren();(data?.services||[]).forEach((s,i)=>{
   const button=document.createElement('button');button.type='button';button.dataset.unifiedService=s.id;
   button.setAttribute('aria-pressed',String(selected===s.id));button.textContent='● '+lang()[i]+' ('+s.stops.length+')';
   button.style.borderColor=s.color;button.addEventListener('click',()=>select(s.id));bar.append(button);
  });
  const s=service();panel.replaceChildren();panel.hidden=!s;$('services').hidden=!!s;
  if(s){
   const head=document.createElement('h2');head.textContent=lang()[IDS.indexOf(s.id)]+' · '+s.stops.length+' '+w.stop;
   const sourceLine=document.createElement('p');sourceLine.textContent=w.trip+' '+s.tripId+' · '+w.source+' · '+w.read;
   const ol=document.createElement('ol');ol.style.cssText='padding-left:30px;max-height:400px;overflow:auto';
   s.stops.forEach(p=>{const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.textContent=(s.id===IDS[2]&&['SUSPECTED_MISMATCH','UNRESOLVED'].includes(review(p)?.decision||'UNRESOLVED')?'⚠ ':s.id===IDS[2]&&review(p)?.decision==='APPROXIMATE'?'≈ ':'')+p.name;
    if(s.id===IDS[2]){const a=review(p);button.title=(a?.decision||'UNRESOLVED')+' · '+(a?.offsetMeters==null?'track distance unavailable':a.offsetMeters+' m from mapped railway');}
    button.style.cssText='display:block;width:100%;min-height:42px;text-align:left;margin:3px 0';button.addEventListener('click',()=>{map.flyTo({center:[p.lon,p.lat],zoom:12.2,duration:250});openStop(p,s)});
    li.append(button);ol.append(li)});
   panel.append(head,sourceLine,ol);
   $('map-status').textContent=lang()[IDS.indexOf(s.id)]+': '+s.stops.length+' '+w.stop+' · '+w.trip+' '+s.tripId;
  }
  layers();
 }
 function clear(){if(!selected)return;selected=null;popup?.remove();popup=null;panel.hidden=true;$('services').hidden=false;refresh();}
 function select(id){
  if(!data?.services.some(s=>s.id===id))return;
  selectKomuter('all');selected=id;popup?.remove();popup=null;
  refresh();focus(service());
 }
 map.on('style.load',()=>{if(data){layers();if(selected)focus(service());}});
 map.on('click',e=>{if(!selected||!map.getLayer(circle))return;
  const hits=map.queryRenderedFeatures([[e.point.x-13,e.point.y-13],[e.point.x+13,e.point.y+13]],{layers:[circle]});
  if(!hits.length)return;const stop=service()?.stops.find(p=>p.id===hits[0].properties.stopId);if(stop)openStop(stop,service());
 });
 (async()=>{try{
  const response=await fetch('./assets/ktm-unified-gtfs-example-trips.json',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const result=await response.json();if(!validate(result))throw Error('GTFS_VALIDATION_FAILED');
  data=result;
  try{
   const auditResponse=await fetch('./assets/ktm-shuttle-v2-alignment-review.json',{credentials:'same-origin',cache:'no-store'});
   if(!auditResponse.ok)throw Error('GIS review HTTP '+auditResponse.status);
   const candidate=await auditResponse.json();if(!validateAudit(candidate))throw Error('GIS_REVIEW_SNAPSHOT_MISMATCH');audit=candidate;
   const shuttle=data.services.find(s=>s.id===IDS[2]);
   shuttle.stops=shuttle.stops.map(p=>{const a=audit.stops.find(x=>x.stopId===p.id);if(!a?.coordinatesChanged)return p;
    const {lat,lon}=a.effectiveCoordinates;
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<1||lat>7.5||lon<99.5||lon>105||!a.replacementSourceUrl)throw Error('UNSOURCED_SHUTTLE_REPLACEMENT');
    return {...p,gtfsLat:p.lat,gtfsLon:p.lon,lat,lon};});
  }catch(e){console.warn('KTM Shuttle GIS review unavailable; originals kept',e);audit=null;}
  refresh();layers();
 }catch(error){info.textContent='Official ETS/Intercity preview unavailable: '+String(error.message||error);console.warn('KTM Unified overlay',error);}})();
 return Object.freeze({clear,refresh,syncVisibility});
}
root.KTMUnifiedOverlay=Object.freeze({mount,validate});
})(typeof window!=='undefined'?window:globalThis);
