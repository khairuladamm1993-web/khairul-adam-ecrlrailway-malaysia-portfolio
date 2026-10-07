/* Lazy MAP projection. Exact railway markers are rendered only for canonical records in an approved validated confidence class. */
(()=>{
 'use strict';
 if(window.RailwayMap)return;
 const R=window.Railway,A=window.RailwayAccess;
 const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
 const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
 const LEAFLET_JS_SRI='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
 const LEAFLET_CSS_SRI='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
 const TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
 const RAIL_REFERENCE_TILE_URL='https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png';
 const EXACT_ZOOM=11;
 const VALID='Validated Location',PERSONAL='Personal Field-Validated Location',ENGINEERING='Engineering/Survey Validated Location',PUBLIC='Public Reference Location',PENDING='Pending Validation';
 const points=()=>window.RailwayCorridorReference||[];

 let instance=null,loadPromise=null;
 const esc=v=>R?.escape?R.escape(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
 const normalize=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
 const bodyStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const titleStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const finite=v=>Number.isFinite(Number(v));
 const allowedConfidence=v=>[VALID,PERSONAL,ENGINEERING,PUBLIC,PENDING].includes(v)?v:PENDING;
 const coordinateText=v=>finite(v)?Number(v).toFixed(5):'—';

 function locationPayload(body){
  const raw=body&&typeof body==='object'?(body.location||body.mapLocation||null):null;
  if(!raw||typeof raw!=='object')return null;
  const confidence=allowedConfidence(raw.locationConfidence||raw.confidence);
  const lat=finite(raw.latitude)?Number(raw.latitude):null,lon=finite(raw.longitude)?Number(raw.longitude):null;
  const source=String(raw.coordinateSource||raw.sourceType||raw.source||'').trim()||null;
  if([VALID,PERSONAL,ENGINEERING].includes(confidence)&&(!finite(lat)||!finite(lon)))return {lat:null,lon:null,locationConfidence:PENDING,coordinateSource:source||'Validated coordinate incomplete'};
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
   if([VALID,PERSONAL,ENGINEERING].includes(loc.locationConfidence)&&finite(loc.lat)&&finite(loc.lon)){
    return {...point,lat:Number(loc.lat),lon:Number(loc.lon),locationConfidence:loc.locationConfidence,coordinateSource:loc.coordinateSource||'Validated project reference',overlay};
   }
   if(loc.locationConfidence===PUBLIC&&finite(loc.lat)&&finite(loc.lon)){
    return {...point,lat:Number(loc.lat),lon:Number(loc.lon),locationConfidence:PUBLIC,coordinateSource:loc.coordinateSource||'Public reference / locality source',overlay};
   }
   if(loc.locationConfidence===PENDING){
    return {...point,
      lat:finite(loc.lat)?Number(loc.lat):(finite(point.lat)?Number(point.lat):null),
      lon:finite(loc.lon)?Number(loc.lon):(finite(point.lon)?Number(point.lon):null),
      locationConfidence:PENDING,
      coordinateSource:loc.coordinateSource||point.coordinateSource||'Pending validation',
      overlay};
   }
  }
  return {...point,locationConfidence:allowedConfidence(point.locationConfidence),coordinateSource:point.coordinateSource||null,overlay};
 }
 const exact=r=>[VALID,PERSONAL,ENGINEERING].includes(r?.locationConfidence)&&finite(r.lat)&&finite(r.lon);
 const mappable=r=>finite(r?.lat)&&finite(r?.lon);

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
  const state={host,controller,map:null,leaflet:null,markers:new Map(),selected:null,filter:'All',query:'',ownerLoaded:false};
  instance=state;
  host.innerHTML='<section class="map-module" aria-label="ECRL reference map">'+
   '<div class="map-toolbar"><label class="map-search"><span>Search</span><input type="search" data-map-search placeholder="Station name; Member code / chainage when available" autocomplete="off"></label>'+
   '<div class="map-filters" role="group" aria-label="Map filters">'+['All','STN','PL','Depot'].map(x=>'<button type="button" data-map-filter="'+x+'" aria-pressed="'+(x==='All')+'">'+x+'</button>').join('')+'</div>'+
   '<div class="map-actions"><button type="button" data-map-fit>FIT FULL ROUTE</button><button type="button" data-map-focus disabled>FOCUS SELECTED</button></div></div>'+
   '<div class="map-layout"><div class="map-canvas-wrap"><div class="map-canvas" data-map-canvas aria-label="Interactive Malaysia railway-first reference map"></div><p class="map-attribution-note">Railway context is a visual OpenStreetMap/OpenRailwayMap reference layer, not surveyed ECRL geometry. Exact asset markers still require a validated confidence class; Public Reference and Pending markers remain approximate/reference only.</p></div>'+
   '<aside class="map-side"><div data-map-detail class="map-detail"><span class="access-label">MAP</span><h3>Select an asset</h3><p>Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.</p></div><div class="map-results" data-map-results></div></aside></div>'+
   '<p class="study-boundary">No route line / no polyline. Manual pan or zoom never recalculates stored marker coordinates.</p>'+
   '</section>';

  const resultHost=host.querySelector('[data-map-results]'),detailHost=host.querySelector('[data-map-detail]');
  const input=host.querySelector('[data-map-search]'),focusBtn=host.querySelector('[data-map-focus]');
  const visibleBase=()=>points().filter(p=>p.phase==='current'&&(state.filter==='All'||p.type===state.filter)).filter(p=>{
   if(!state.query)return true;const overlay=memberOverlay(p),hay=[p.name,overlay?.code,overlay?.chainage].filter(Boolean).join(' ');return normalize(hay).includes(normalize(state.query));
  });
  const visible=()=>visibleBase().map(effective);
  const note=r=>r.locationConfidence===PERSONAL
   ?'Personal Field-Validated Location · Owner-confirmed field reference; exact for this portfolio, not engineering/survey GIS.'
   :r.locationConfidence===ENGINEERING
    ?'Engineering/Survey Validated Location · supported by an approved engineering/survey reference.'
    :r.locationConfidence===VALID
     ?'Validated Location · exact marker uses the stored canonical coordinate.'
     :r.locationConfidence===PUBLIC
      ?'Public Reference Location · locality/reference position only; not an exact railway or survey/GIS coordinate.'
      :'Pending Validation · temporary/reference position only when coordinates are available; never exact.';
  const sourceText=r=>r.coordinateSource|| (r.locationConfidence===PUBLIC?'Public reference / locality source':r.locationConfidence===PENDING?'Pending validation reference':'Not available');
  function focusStored(r,zoom=EXACT_ZOOM){
   if(!mappable(r)||!state.map)return false;
   state.map.setView([Number(r.lat),Number(r.lon)],zoom);
   return true;
  }
  function syncSelectedMarker(){
   for(const [id,marker] of state.markers){
    const el=marker.getElement?.();
    if(el)el.classList.toggle('railway-selected-marker',Boolean(state.selected&&id===state.selected.id));
   }
  }
  function renderDetail(r){
   state.selected=r||null;focusBtn.disabled=!mappable(r);syncSelectedMarker();
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
    (A?.canReadMemberContent?'<p class="map-access-note">Approved Member Corridor data is merged at runtime only.</p>':'<p class="map-access-note">Public view · protected Corridor records are not loaded.</p>')+
    (A?.canAdmin?'<div class="owner-map-slot" data-owner-map-slot></div>':'');
  }
  function syncMarkers(){
   const records=visible(),allowed=new Set(records.filter(mappable).map(r=>r.id));
   for(const [id,m] of state.markers){if(!allowed.has(id)){m.remove();state.markers.delete(id);}}
   for(const r of records){
    if(!mappable(r))continue;
    let marker=state.markers.get(r.id);
    if(marker&&marker._railwayConfidence!==r.locationConfidence){marker.remove();state.markers.delete(r.id);marker=null;}
    if(marker){
     const ll=marker.getLatLng?.();
     if(!ll||Math.abs(ll.lat-Number(r.lat))>1e-10||Math.abs(ll.lng-Number(r.lon))>1e-10)marker.setLatLng?.([Number(r.lat),Number(r.lon)]);
     continue;
    }
    const confidenceClass=exact(r)?'map-confidence-exact':r.locationConfidence===PUBLIC?'map-confidence-reference':'map-confidence-pending';
    const cls='railway-map-pin map-pin-'+r.type.toLowerCase()+' '+confidenceClass;
    const icon=state.leaflet.divIcon({className:'railway-map-divicon',html:'<span class="'+cls+'" aria-hidden="true"></span>',iconSize:[18,18],iconAnchor:[9,9]});
    marker=state.leaflet.marker([Number(r.lat),Number(r.lon)],{icon,keyboard:true,title:r.name,riseOnHover:true}).addTo(state.map);
    marker._railwayConfidence=r.locationConfidence;
    marker.bindTooltip(esc(r.name)+' · '+esc(r.locationConfidence),{direction:'top',offset:[0,-8],opacity:.92,className:'railway-map-label'});
    marker.on('click',()=>{const fresh=effective(points().find(x=>x.id===r.id)||r);renderDetail(fresh);renderResults();focusStored(fresh);loadOwnerTools();});
    state.markers.set(r.id,marker);
   }
  }
  function renderResults(){
   const rows=visible();
   resultHost.innerHTML=rows.map(r=>{const o=r.overlay||{},meta=[r.type,o.code,o.chainage].filter(Boolean).join(' · ');return '<button type="button" data-map-point="'+r.id+'" aria-current="'+(state.selected?.id===r.id)+'"><strong>'+esc(r.name)+'</strong><span>'+esc(meta||r.type)+'</span><small>'+esc(r.locationConfidence)+' · '+esc(note(r))+'</small></button>';}).join('')||'<p class="map-empty">No matching Corridor records.</p>';
   syncMarkers();
  }
  function fit(){
   const coords=visible().filter(mappable).map(r=>[Number(r.lat),Number(r.lon)]);
   if(coords.length)state.map.fitBounds(state.leaflet.latLngBounds(coords),{padding:[24,24],maxZoom:8});
  }
  input.addEventListener('input',()=>{state.query=input.value;renderResults();},{signal});
  host.querySelector('.map-filters').addEventListener('click',e=>{const b=e.target.closest('[data-map-filter]');if(!b)return;state.filter=b.dataset.mapFilter;host.querySelectorAll('[data-map-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderResults();fit();},{signal});
  resultHost.addEventListener('click',e=>{const b=e.target.closest('[data-map-point]');if(!b)return;const base=points().find(x=>x.id===b.dataset.mapPoint);if(!base)return;const r=effective(base);renderDetail(r);renderResults();if(mappable(r))focusStored(r);loadOwnerTools();},{signal});
  host.querySelector('[data-map-fit]').addEventListener('click',fit,{signal});
  focusBtn.addEventListener('click',()=>focusStored(state.selected),{signal});
  let ownerPromise=null;
  function ownerContext(){
   return {
    host,
    map:state.map,
    leaflet:state.leaflet,
    getSelected:()=>state.selected,
    getMarker:id=>{
     const base=points().find(x=>x.id===id||memberOverlay(x)?.code===id);
     return state.markers.get(base?.id||id)||null;
    },
    getRecord:id=>{
     const base=points().find(x=>x.id===id||memberOverlay(x)?.code===id);
     return effective(base||state.selected||{});
    },
    renderDetail,
    renderResults,
    focusStored,
    async refreshCanonical(){
     await A.fetchMemberBundle();
     if(state.selected)state.selected=effective(points().find(x=>x.id===state.selected.id)||state.selected);
     renderDetail(state.selected);renderResults();fit();loadOwnerTools(true);
     return state.selected;
    }
   };
  }
  function loadOwnerTools(force=false){
   if(!A?.canAdmin||!state.map)return;
   const slot=host.querySelector('[data-owner-map-slot]');if(!slot)return;
   if(window.RailwayOwnerMap){window.RailwayOwnerMap.mount(ownerContext(),slot,{force});state.ownerLoaded=true;return;}
   if(ownerPromise)return;
   ownerPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/owner-map.js';s.async=true;s.dataset.railwayOwnerMap='1';s.onload=()=>window.RailwayOwnerMap?resolve(window.RailwayOwnerMap):reject(new Error('Owner MAP tools unavailable'));s.onerror=reject;document.head.append(s);});
   ownerPromise.then(m=>{if(instance===state&&A.canAdmin){m.mount(ownerContext(),host.querySelector('[data-owner-map-slot]'),{force:true});state.ownerLoaded=true;}}).catch(()=>{});
  }
  const accessRefresh=async()=>{if(instance!==state)return;await ensureMemberData();if(instance===state){state.selected=state.selected?effective(points().find(x=>x.id===state.selected.id)||state.selected):null;renderDetail(state.selected);renderResults();if(A.canAdmin)loadOwnerTools(true);else window.RailwayOwnerMap?.unmount();}};
  window.addEventListener('railway-access-change',accessRefresh,{signal});

  try{
   await ensureMemberData();
   state.leaflet=await loadLeaflet();
   if(instance!==state||!host.isConnected)return;
   state.map=state.leaflet.map(host.querySelector('[data-map-canvas]'),{zoomControl:true,attributionControl:true,preferCanvas:true,minZoom:5,maxZoom:18});
   const basePane=state.map.createPane?.('railwayBase');
   if(basePane){basePane.style.zIndex='200';basePane.classList.add('railway-basemap-pane');}
   const referencePane=state.map.createPane?.('railwayReference');
   if(referencePane){referencePane.style.zIndex='260';referencePane.style.pointerEvents='none';referencePane.classList.add('railway-reference-pane');}
   state.leaflet.tileLayer(TILE_URL,{pane:basePane?'railwayBase':'tilePane',maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',updateWhenIdle:true,keepBuffer:1,detectRetina:false}).addTo(state.map);
   state.leaflet.tileLayer(RAIL_REFERENCE_TILE_URL,{pane:referencePane?'railwayReference':'overlayPane',minZoom:5,maxZoom:19,attribution:'Style: <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener">CC-BY-SA 2.0</a> <a href="https://www.openrailwaymap.org/" target="_blank" rel="noopener">OpenRailwayMap</a>',updateWhenIdle:true,keepBuffer:1,detectRetina:false}).addTo(state.map);
   state.map.setView([4.55,102.55],6);
   renderResults();fit();renderDetail(null);
   host.dataset.mapReady='true';
   host.dataset.validatedMarkers=String(visible().filter(exact).length);
   host.dataset.totalMarkers=String(visible().filter(mappable).length);
   if(A.canAdmin)loadOwnerTools();
   setTimeout(()=>{if(instance===state)state.map.invalidateSize(false);},0);
  }catch(error){
   if(instance===state){host.dataset.mapReady='error';host.querySelector('[data-map-canvas]').innerHTML='<div class="map-error"><strong>Map unavailable</strong><span>'+esc(error.message||error)+'</span></div>';renderResults();}
  }
 }
 function unmount(){
  if(!instance)return;
  const old=instance;instance=null;window.RailwayOwnerMap?.unmount();old.controller.abort();try{old.map?.remove();}catch{}old.markers.clear();
 }
 window.RailwayMap=Object.freeze({mount,unmount,get mounted(){return Boolean(instance);},referenceCount(){return points().length}});
})();
