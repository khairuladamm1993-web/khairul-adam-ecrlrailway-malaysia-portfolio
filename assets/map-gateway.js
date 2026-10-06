/* Lazy MAP projection. Exact railway markers are rendered only for canonical records classified Validated Location. */
(()=>{
 'use strict';
 if(window.RailwayMap)return;
 const R=window.Railway,A=window.RailwayAccess;
 const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
 const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
 const LEAFLET_JS_SRI='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
 const LEAFLET_CSS_SRI='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
 const TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
 const EXACT_ZOOM=11;
 const VALID='Validated Location',PUBLIC='Public Reference Location',PENDING='Pending Validation';
 const points=()=>window.RailwayCorridorReference||[];

 let instance=null,loadPromise=null;
 const esc=v=>R?.escape?R.escape(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
 const normalize=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
 const bodyStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const titleStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const finite=v=>Number.isFinite(Number(v));
 const allowedConfidence=v=>[VALID,PUBLIC,PENDING].includes(v)?v:PENDING;
 const coordinateText=v=>finite(v)?Number(v).toFixed(5):'—';

 function locationPayload(body){
  const raw=body&&typeof body==='object'?(body.location||body.mapLocation||null):null;
  if(!raw||typeof raw!=='object')return null;
  const confidence=allowedConfidence(raw.locationConfidence||raw.confidence);
  const lat=finite(raw.latitude)?Number(raw.latitude):null,lon=finite(raw.longitude)?Number(raw.longitude):null;
  const source=String(raw.coordinateSource||raw.sourceType||raw.source||'').trim()||null;
  if(confidence===VALID&&(!finite(lat)||!finite(lon)))return {lat:null,lon:null,locationConfidence:PENDING,coordinateSource:source||'Validated coordinate incomplete'};
  return {lat,lon,locationConfidence:confidence,coordinateSource:source};
 }
 function memberOverlay(point){
  if(!A?.canReadMemberContent)return null;
  const rows=A.cachedData?.content||[];
  const key=normalize(point.name);
  const item=rows.find(x=>x.approved!==false&&x.kind==='corridor'&&titleStrings(x.title).some(t=>normalize(t)===key));
  if(!item)return null;
  const bodyText=bodyStrings(item.body).join(' ');
  const chainage=typeof item.body?.chainage==='string'?item.body.chainage:(bodyText.match(/\bCH\s*\d{1,3}\s*[+]\s*\d{3}\b/i)||[])[0]||null;
  const code=/^(?:STN|PL|DEPOT|EMU|GNU)[A-Z0-9-]*$/i.test(String(item.id||''))?String(item.id):null;
  return {code,chainage,title:item.title,body:item.body,evidence:item.evidence,location:locationPayload(item.body)};
 }
 function effective(point){
  const overlay=memberOverlay(point),loc=overlay?.location;
  if(loc){
   if(loc.locationConfidence===VALID&&finite(loc.lat)&&finite(loc.lon)){
    return {...point,lat:Number(loc.lat),lon:Number(loc.lon),locationConfidence:VALID,coordinateSource:loc.coordinateSource||'Validated project reference',overlay};
   }
   if(loc.locationConfidence===PUBLIC&&finite(loc.lat)&&finite(loc.lon)){
    return {...point,lat:Number(loc.lat),lon:Number(loc.lon),locationConfidence:PUBLIC,coordinateSource:loc.coordinateSource||'Public reference / locality source',overlay};
   }
   if(loc.locationConfidence===PENDING){
    return {...point,lat:null,lon:null,locationConfidence:PENDING,coordinateSource:loc.coordinateSource||'Pending validation',overlay};
   }
  }
  return {...point,locationConfidence:allowedConfidence(point.locationConfidence),coordinateSource:point.coordinateSource||null,overlay};
 }
 const exact=r=>r?.locationConfidence===VALID&&finite(r.lat)&&finite(r.lon);

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
  const state={host,controller,map:null,leaflet:null,markers:new Map(),selected:null,filter:'All',query:''};
  instance=state;
  host.innerHTML='<section class="map-module" aria-label="ECRL reference map">'+
   '<div class="map-toolbar"><label class="map-search"><span>Search</span><input type="search" data-map-search placeholder="Station name; Member code / chainage when available" autocomplete="off"></label>'+
   '<div class="map-filters" role="group" aria-label="Map filters">'+['All','STN','PL','Depot'].map(x=>'<button type="button" data-map-filter="'+x+'" aria-pressed="'+(x==='All')+'">'+x+'</button>').join('')+'</div>'+
   '<div class="map-actions"><button type="button" data-map-fit>FIT FULL ROUTE</button><button type="button" data-map-focus disabled>FOCUS SELECTED</button></div></div>'+
   '<div class="map-layout"><div class="map-canvas-wrap"><div class="map-canvas" data-map-canvas aria-label="Interactive Malaysia reference map"></div><p class="map-attribution-note">Exact railway markers require Validated Location. Public-reference coordinates are not railway survey/GIS coordinates.</p></div>'+
   '<aside class="map-side"><div data-map-detail class="map-detail"><span class="access-label">MAP</span><h3>Select an asset</h3><p>Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.</p></div><div class="map-results" data-map-results></div></aside></div>'+
   '<p class="study-boundary">No route line / no polyline. Manual pan or zoom never recalculates stored marker coordinates.</p>'+
   '</section>';

  const resultHost=host.querySelector('[data-map-results]'),detailHost=host.querySelector('[data-map-detail]');
  const input=host.querySelector('[data-map-search]'),focusBtn=host.querySelector('[data-map-focus]');
  const visibleBase=()=>points().filter(p=>p.phase==='current'&&(state.filter==='All'||p.type===state.filter)).filter(p=>{
   if(!state.query)return true;const overlay=memberOverlay(p),hay=[p.name,overlay?.code,overlay?.chainage].filter(Boolean).join(' ');return normalize(hay).includes(normalize(state.query));
  });
  const visible=()=>visibleBase().map(effective);
  const note=r=>r.locationConfidence===VALID
   ?'Validated Location · exact marker uses the stored canonical coordinate.'
   :r.locationConfidence===PUBLIC
    ?'Public Reference Location · locality/reference position only; not an exact railway or survey/GIS coordinate.'
    :'Pending Validation · no exact railway location is rendered.';
  const sourceText=r=>r.locationConfidence===PUBLIC?'Public reference / locality source':r.coordinateSource||'Not available';
  function focusExact(r,zoom=EXACT_ZOOM){
   if(!exact(r)||!state.map)return false;
   state.map.setView([Number(r.lat),Number(r.lon)],zoom);
   return true;
  }
  function renderDetail(r){
   state.selected=r||null;focusBtn.disabled=!exact(r);
   if(!r){detailHost.innerHTML='<span class="access-label">MAP</span><h3>Select an asset</h3><p>Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.</p>';return;}
   const o=r.overlay||{};
   detailHost.innerHTML='<span class="access-label">'+esc(r.type)+'</span><h3>'+esc(r.name)+'</h3>'+
    '<dl class="map-member-detail">'+
     '<div><dt>Code</dt><dd>'+esc(o.code||'—')+'</dd></div>'+
     '<div><dt>Name</dt><dd>'+esc(r.name)+'</dd></div>'+
     '<div><dt>Category</dt><dd>'+esc(r.type)+'</dd></div>'+
     '<div><dt>Chainage</dt><dd>'+esc(o.chainage||'—')+'</dd></div>'+
     '<div><dt>Latitude</dt><dd>'+esc(coordinateText(r.lat))+'</dd></div>'+
     '<div><dt>Longitude</dt><dd>'+esc(coordinateText(r.lon))+'</dd></div>'+
     '<div><dt>Location confidence</dt><dd>'+esc(r.locationConfidence)+'</dd></div>'+
     '<div><dt>Coordinate source</dt><dd>'+esc(sourceText(r))+'</dd></div>'+
    '</dl><p>'+esc(note(r))+'</p>'+
    (A?.canReadMemberContent?'<p class="map-access-note">Approved Member Corridor data is merged at runtime only.</p>':'<p class="map-access-note">Public view · protected Corridor records are not loaded.</p>');
  }
  function syncMarkers(){
   const records=visible(),allowed=new Set(records.filter(exact).map(r=>r.id));
   for(const [id,m] of state.markers){if(!allowed.has(id)){m.remove();state.markers.delete(id);}}
   for(const r of records){
    if(!exact(r)||state.markers.has(r.id))continue;
    const cls='railway-map-pin map-pin-'+r.type.toLowerCase();
    const icon=state.leaflet.divIcon({className:'railway-map-divicon',html:'<span class="'+cls+'" aria-hidden="true"></span>',iconSize:[18,18],iconAnchor:[9,9]});
    const marker=state.leaflet.marker([Number(r.lat),Number(r.lon)],{icon,keyboard:true,title:r.name,riseOnHover:true}).addTo(state.map);
    marker.bindTooltip(esc(r.name),{direction:'top',offset:[0,-8],opacity:.92,className:'railway-map-label'});
    marker.on('click',()=>{renderDetail(r);renderResults();focusExact(r);});
    state.markers.set(r.id,marker);
   }
  }
  function renderResults(){
   const rows=visible();
   resultHost.innerHTML=rows.map(r=>{const o=r.overlay||{},meta=[r.type,o.code,o.chainage].filter(Boolean).join(' · ');return '<button type="button" data-map-point="'+r.id+'" aria-current="'+(state.selected?.id===r.id)+'"><strong>'+esc(r.name)+'</strong><span>'+esc(meta||r.type)+'</span><small>'+esc(r.locationConfidence)+' · '+esc(note(r))+'</small></button>';}).join('')||'<p class="map-empty">No matching Corridor records.</p>';
   syncMarkers();
  }
  function fit(){
   const records=visible(),validated=records.filter(exact),fallback=records.filter(r=>finite(r.lat)&&finite(r.lon));
   const source=validated.length?validated:fallback;
   const coords=source.map(r=>[Number(r.lat),Number(r.lon)]);
   if(coords.length)state.map.fitBounds(state.leaflet.latLngBounds(coords),{padding:[24,24],maxZoom:8});
  }
  input.addEventListener('input',()=>{state.query=input.value;renderResults();},{signal});
  host.querySelector('.map-filters').addEventListener('click',e=>{const b=e.target.closest('[data-map-filter]');if(!b)return;state.filter=b.dataset.mapFilter;host.querySelectorAll('[data-map-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderResults();fit();},{signal});
  resultHost.addEventListener('click',e=>{const b=e.target.closest('[data-map-point]');if(!b)return;const base=points().find(x=>x.id===b.dataset.mapPoint);if(!base)return;const r=effective(base);renderDetail(r);renderResults();if(exact(r))focusExact(r);},{signal});
  host.querySelector('[data-map-fit]').addEventListener('click',fit,{signal});
  focusBtn.addEventListener('click',()=>focusExact(state.selected),{signal});
  const accessRefresh=async()=>{if(instance!==state)return;await ensureMemberData();if(instance===state){state.selected=state.selected?effective(points().find(x=>x.id===state.selected.id)||state.selected):null;renderDetail(state.selected);renderResults();}};
  window.addEventListener('railway-access-change',accessRefresh,{signal});

  try{
   await ensureMemberData();
   state.leaflet=await loadLeaflet();
   if(instance!==state||!host.isConnected)return;
   state.map=state.leaflet.map(host.querySelector('[data-map-canvas]'),{zoomControl:true,attributionControl:true,preferCanvas:true,minZoom:5,maxZoom:15});
   state.leaflet.tileLayer(TILE_URL,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',updateWhenIdle:true,keepBuffer:1,detectRetina:false}).addTo(state.map);
   state.map.setView([4.55,102.55],6);
   renderResults();fit();renderDetail(null);
   host.dataset.mapReady='true';
   host.dataset.validatedMarkers=String(visible().filter(exact).length);
   setTimeout(()=>{if(instance===state)state.map.invalidateSize(false);},0);
  }catch(error){
   if(instance===state){host.dataset.mapReady='error';host.querySelector('[data-map-canvas]').innerHTML='<div class="map-error"><strong>Map unavailable</strong><span>'+esc(error.message||error)+'</span></div>';renderResults();}
  }
 }
 function unmount(){
  if(!instance)return;
  const old=instance;instance=null;old.controller.abort();try{old.map?.remove();}catch{}old.markers.clear();
 }
 window.RailwayMap=Object.freeze({mount,unmount,get mounted(){return Boolean(instance);},referenceCount(){return points().length}});
})();
