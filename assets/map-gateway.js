/* Lazy MAP projection. Public coordinates are reference positions from the earlier ECRL map build, never survey/GIS alignment points. */
(()=>{
 'use strict';
 if(window.RailwayMap)return;
 const R=window.Railway,A=window.RailwayAccess;
 const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
 const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
 const LEAFLET_JS_SRI='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
 const LEAFLET_CSS_SRI='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
 const TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';

 // Coordinate projection only. It intentionally excludes protected station codes,
 // chainage, layouts and Member records. PL07 and both depots remain unmapped because
 // the earlier project positions were interpolated/estimated rather than validated.
 const points=Object.freeze([
  ['Kota Bharu','STN',6.05136,102.23264,'public-reference'],
  ['Pasir Puteh','STN',5.80648,102.36769,'public-reference'],
  ['Jerteh','STN',5.70102,102.48321,'public-reference'],
  ['Bandar Permaisuri','STN',5.52084,102.73814,'public-reference'],
  ['Pekan Sg. Tong','PL',5.35123,102.89995,'public-reference'],
  ['Kuala Terengganu','STN',5.17328,103.09777,'public-reference'],
  ['Bukit Payung','PL',5.23269,103.10281,'public-reference'],
  ['Dungun','STN',4.73388,103.38748,'public-reference'],
  ['Kemasik','STN',4.50287,103.42200,'public-reference'],
  ['Chukai','STN',4.24895,103.38249,'public-reference'],
  ['Cherating','STN',4.15156,103.37487,'public-reference'],
  ['Kuantan Port City Depot','Depot',null,null,'coordinate-pending'],
  ['Kuantan Port City','STN',3.96685,103.34673,'public-reference'],
  ['Kota SAS','STN',3.86503,103.29351,'public-reference'],
  ['Paya Besar','STN',3.74690,103.12168,'public-reference'],
  ['Felda Lepar','PL',3.67709,103.03001,'public-reference'],
  ['Kampung Alur Gading','PL',3.61430,102.83280,'public-reference'],
  ['Maran','STN',3.54089,102.66381,'public-reference'],
  ['Chenor','PL',3.48992,102.58141,'public-reference'],
  ['Temerloh','STN',3.44351,102.31911,'public-reference'],
  ['Lanchang','PL',3.50746,102.19129,'public-reference'],
  ['Bentong','STN',3.47825,101.91328,'public-reference'],
  ['Alang Sedayu','PL',null,null,'coordinate-pending'],
  ['Gombak North EMU Depot','Depot',null,null,'coordinate-pending'],
  ['ITT Gombak','STN',3.23169,101.72284,'public-reference']
 ].map(([name,type,lat,lon,coordinateClass],index)=>Object.freeze({id:'ref-'+index,name,type,lat,lon,coordinateClass,phase:'current'})));

 let instance=null,loadPromise=null;
 const esc=v=>R?.escape?R.escape(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
 const text=v=>R?.text?R.text(v):String(v);
 const normalize=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
 const bodyStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const titleStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];

 function memberOverlay(point){
  if(!A?.canReadMemberContent)return null;
  const rows=A.cachedData?.content||[];
  const key=normalize(point.name);
  const item=rows.find(x=>x.approved!==false&&x.kind==='corridor'&&titleStrings(x.title).some(t=>normalize(t)===key));
  if(!item)return null;
  const body=bodyStrings(item.body).join(' ');
  const chainage=(body.match(/\bCH\s*\d{1,3}\s*[+]\s*\d{3}\b/i)||[])[0]||null;
  const code=/^(?:STN|PL|DEPOT|EMU|GNU)[A-Z0-9-]*$/i.test(String(item.id||''))?String(item.id):null;
  return {code,chainage,title:item.title,body:item.body,evidence:item.evidence};
 }
 async function ensureMemberData(){
  if(!A?.canReadMemberContent||A.cachedData)return;
  try{await A.fetchMemberBundle();}catch{}
 }
 function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);
  if(loadPromise)return loadPromise;
  loadPromise=new Promise((resolve,reject)=>{
   if(!document.querySelector('link[data-railway-leaflet]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href=LEAFLET_CSS;link.integrity=LEAFLET_CSS_SRI;link.crossOrigin='anonymous';link.dataset.railwayLeaflet='1';document.head.append(link);
   }
   const existing=document.querySelector('script[data-railway-leaflet]');
   if(existing){existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',reject,{once:true});return;}
   const script=document.createElement('script');script.src=LEAFLET_JS;script.integrity=LEAFLET_JS_SRI;script.crossOrigin='anonymous';script.async=true;script.dataset.railwayLeaflet='1';
   script.addEventListener('load',()=>window.L?resolve(window.L):reject(new Error('Leaflet unavailable')),{once:true});
   script.addEventListener('error',()=>reject(new Error('Map library could not be loaded.')),{once:true});
   document.head.append(script);
  });
  return loadPromise;
 }

 async function mount(host){
  unmount();
  if(!host)return;
  const controller=new AbortController(),signal=controller.signal;
  const state={host,controller,map:null,markers:new Map(),selected:null,filter:'All',query:''};
  instance=state;
  host.innerHTML='<section class="map-module" aria-label="ECRL public reference map">'+
   '<div class="map-toolbar"><label class="map-search"><span>Search</span><input type="search" data-map-search placeholder="Station name; Member code / chainage when available" autocomplete="off"></label>'+
   '<div class="map-filters" role="group" aria-label="Map filters">'+['All','STN','PL','Depot'].map(x=>'<button type="button" data-map-filter="'+x+'" aria-pressed="'+(x==='All')+'">'+x+'</button>').join('')+'</div>'+
   '<div class="map-actions"><button type="button" data-map-fit>FIT FULL ROUTE</button><button type="button" data-map-focus disabled>FOCUS SELECTED</button></div></div>'+
   '<div class="map-layout"><div class="map-canvas-wrap"><div class="map-canvas" data-map-canvas aria-label="Interactive Malaysia reference map"></div><p class="map-attribution-note">Standard map only · public-reference markers are not railway survey/GIS coordinates.</p></div>'+
   '<aside class="map-side"><div data-map-detail class="map-detail"><span class="access-label">MAP</span><h3>Select a marker</h3><p>Tap a marker or result to inspect its reference status.</p></div><div class="map-results" data-map-results></div></aside></div>'+
   '<p class="study-boundary">No route line is drawn. Future/proposed infrastructure is not shown as confirmed infrastructure.</p>'+
   '</section>';

  const resultHost=host.querySelector('[data-map-results]'),detailHost=host.querySelector('[data-map-detail]');
  const input=host.querySelector('[data-map-search]'),focusBtn=host.querySelector('[data-map-focus]');
  const visible=()=>points.filter(p=>p.phase==='current'&&(state.filter==='All'||p.type===state.filter)).filter(p=>{
   if(!state.query)return true;const overlay=memberOverlay(p),hay=[p.name,overlay?.code,overlay?.chainage].filter(Boolean).join(' ');return normalize(hay).includes(normalize(state.query));
  });
  const note=p=>p.coordinateClass==='public-reference'?'Public-reference coordinate · not survey/GIS':'Exact map coordinate withheld pending validation';
  function renderDetail(p){
   state.selected=p;focusBtn.disabled=!(Number.isFinite(p?.lat)&&Number.isFinite(p?.lon));
   if(!p){detailHost.innerHTML='<span class="access-label">MAP</span><h3>Select a marker</h3><p>Tap a marker or result to inspect its reference status.</p>';return;}
   const overlay=memberOverlay(p),extra=overlay?'<dl class="map-member-detail">'+(overlay.code?'<div><dt>Code</dt><dd>'+esc(overlay.code)+'</dd></div>':'')+(overlay.chainage?'<div><dt>Chainage</dt><dd>'+esc(overlay.chainage)+'</dd></div>':'')+(overlay.evidence?'<div><dt>Evidence</dt><dd>'+esc(overlay.evidence)+'</dd></div>':'')+'</dl>':'';
   detailHost.innerHTML='<span class="access-label">'+esc(p.type)+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(note(p))+'</p>'+extra+(A?.canReadMemberContent?'<p class="map-access-note">Approved Member detail is merged at runtime only.</p>':'<p class="map-access-note">Public view · protected Corridor records are not loaded.</p>');
  }
  function syncMarkers(){
   const allowed=new Set(visible().filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>p.id));
   for(const [id,m] of state.markers){if(!allowed.has(id)){m.remove();state.markers.delete(id);}}
   for(const p of visible()){
    if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||state.markers.has(p.id))continue;
    const cls='railway-map-pin map-pin-'+p.type.toLowerCase();
    const icon=L.divIcon({className:'railway-map-divicon',html:'<span class="'+cls+'" aria-hidden="true"></span>',iconSize:[18,18],iconAnchor:[9,9]});
    const marker=L.marker([p.lat,p.lon],{icon,keyboard:true,title:p.name,riseOnHover:true}).addTo(state.map);
    marker.bindTooltip(esc(p.name),{direction:'top',offset:[0,-8],opacity:.92,className:'railway-map-label'});
    marker.on('click',()=>{renderDetail(p);renderResults();});
    state.markers.set(p.id,marker);
   }
  }
  function renderResults(){
   const rows=visible();
   resultHost.innerHTML=rows.map(p=>{const overlay=memberOverlay(p),meta=[p.type,overlay?.code,overlay?.chainage].filter(Boolean).join(' · ');return '<button type="button" data-map-point="'+p.id+'" aria-current="'+(state.selected?.id===p.id)+'"><strong>'+esc(p.name)+'</strong><span>'+esc(meta||p.type)+'</span><small>'+esc(note(p))+'</small></button>';}).join('')||'<p class="map-empty">No matching reference markers.</p>';
   syncMarkers();
  }
  function fit(){
   const coords=visible().filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>[p.lat,p.lon]);
   if(coords.length)state.map.fitBounds(L.latLngBounds(coords),{padding:[24,24],maxZoom:8});
  }
  input.addEventListener('input',()=>{state.query=input.value;renderResults();},{signal});
  host.querySelector('.map-filters').addEventListener('click',e=>{const b=e.target.closest('[data-map-filter]');if(!b)return;state.filter=b.dataset.mapFilter;host.querySelectorAll('[data-map-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderResults();fit();},{signal});
  resultHost.addEventListener('click',e=>{const b=e.target.closest('[data-map-point]');if(!b)return;const p=points.find(x=>x.id===b.dataset.mapPoint);if(!p)return;renderDetail(p);renderResults();if(Number.isFinite(p.lat)&&Number.isFinite(p.lon))state.map.setView([p.lat,p.lon],10);},{signal});
  host.querySelector('[data-map-fit]').addEventListener('click',fit,{signal});
  focusBtn.addEventListener('click',()=>{const p=state.selected;if(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon))state.map.setView([p.lat,p.lon],11);},{signal});
  const accessRefresh=async()=>{if(instance!==state)return;await ensureMemberData();if(instance===state){renderDetail(state.selected);renderResults();}};
  window.addEventListener('railway-access-change',accessRefresh,{signal});

  try{
   await ensureMemberData();
   const L=await loadLeaflet();
   if(instance!==state||!host.isConnected)return;
   state.map=L.map(host.querySelector('[data-map-canvas]'),{zoomControl:true,attributionControl:true,preferCanvas:true,minZoom:5,maxZoom:15});
   L.tileLayer(TILE_URL,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',updateWhenIdle:true,keepBuffer:1,detectRetina:false}).addTo(state.map);
   state.map.setView([4.55,102.55],6);
   renderResults();fit();renderDetail(null);
   host.dataset.mapReady='true';
   setTimeout(()=>{if(instance===state)state.map.invalidateSize(false);},0);
  }catch(error){
   if(instance===state){host.dataset.mapReady='error';host.querySelector('[data-map-canvas]').innerHTML='<div class="map-error"><strong>Map unavailable</strong><span>'+esc(error.message||error)+'</span></div>';renderResults();}
  }
 }
 function unmount(){
  if(!instance)return;
  const old=instance;instance=null;old.controller.abort();try{old.map?.remove();}catch{}old.markers.clear();
 }
 window.RailwayMap=Object.freeze({mount,unmount,get mounted(){return Boolean(instance);},referenceCount:points.length});
})();
