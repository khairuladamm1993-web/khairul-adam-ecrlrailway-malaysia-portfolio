/* Lazy MAP projection. Exact railway markers are rendered only for canonical records in an approved validated confidence class. */
(()=>{
 'use strict';
 if(window.RailwayMap)return;
 const R=window.Railway,A=window.RailwayAccess,I=window.RailwayMapIntelligence;
 const LEAFLET_JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
 const LEAFLET_CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
 const LEAFLET_JS_SRI='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
 const LEAFLET_CSS_SRI='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
 const TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
 const RAIL_REFERENCE_TILE_URL='https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png';
 const EXACT_ZOOM=11;
 const VALID='Validated Location',PERSONAL='Personal Field-Validated Location',ENGINEERING='Engineering/Survey Validated Location',PUBLIC='Public Reference Location',PENDING='Pending Validation',CALCULATED='Calculated Corridor Reference';
 const MAP_LAYERS=Object.freeze({
  base:'BASE MAP',railwayReference:'RAILWAY REFERENCE',canonical:'CANONICAL ASSETS',
  chainageGuide:'CHAINAGE GUIDE',proposed:'PROPOSED EDIT',survey:'FUTURE SURVEY LAYER',topology:'FUTURE TOPOLOGY LAYER'
 });
 const points=()=>window.RailwayCorridorReference||[];

 let instance=null,loadPromise=null;
 const esc=v=>R?.escape?R.escape(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
 const normalize=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
 const bodyStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const titleStrings=v=>v&&typeof v==='object'?Object.values(v).filter(x=>typeof x==='string'):[String(v||'')];
 const finite=v=>typeof v==='number'?Number.isFinite(v):(typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v)));
 const numeric=v=>finite(v)?Number(v):null;
 const legalPair=r=>{
  const lat=numeric(r?.lat),lon=numeric(r?.lon);
  return lat!==null&&lon!==null&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180&&!(lat===0&&lon===0);
 };
 const corridorSane=r=>legalPair(r)&&Number(r.lat)>=1&&Number(r.lat)<=7.5&&Number(r.lon)>=99.5&&Number(r.lon)<=104.8;
 const allowedConfidence=v=>[VALID,PERSONAL,ENGINEERING,PUBLIC,PENDING].includes(v)?v:PENDING;
 const coordinateText=v=>finite(v)?Number(v).toFixed(5):'—';

 function locationPayload(body){
  const raw=body&&typeof body==='object'?(body.location||body.mapLocation||null):null;
  if(!raw||typeof raw!=='object')return null;
  const confidence=allowedConfidence(raw.locationConfidence||raw.confidence);
  const lat=numeric(raw.latitude),lon=numeric(raw.longitude);
  const source=String(raw.coordinateSource||raw.sourceType||raw.source||'').trim()||null;
  if([VALID,PERSONAL,ENGINEERING].includes(confidence)&&(!finite(lat)||!finite(lon)))return {lat:null,lon:null,locationConfidence:PENDING,coordinateSource:source||'Validated coordinate incomplete'};
  return {lat,lon,locationConfidence:confidence,coordinateSource:source};
 }
 function plainObject(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}
 function textOrNull(v){const s=typeof v==='string'?v.trim():'';return s||null;}
 function topologyPayload(body){
  const raw=plainObject(body?.topology||body?.stationTopology||body?.depotTopology);
  if(!raw)return null;
  const allowed=['trackCount','platformCount','trackIds','lineIds','platformIds','siding','depotAccess','freightLine','passengerLine','turnoutSequence','connectionDirection','trackFunction','usableLength','maxConsistNote','schematicSource','layoutSource','topologyConfidence'];
  const out={};
  for(const key of allowed)if(raw[key]!==undefined&&raw[key]!==null&&raw[key]!=='')out[key]=raw[key];
  return Object.keys(out).length?out:null;
 }
 function estimatedGuidePayload(body){
  const raw=plainObject(body?.estimatedChainageReference||body?.chainageGuide||body?.mapGuide);
  if(!raw)return null;
  const lat=numeric(raw.latitude),lon=numeric(raw.longitude),method=textOrNull(raw.method),source=textOrNull(raw.source||raw.sourceNote);
  const supported=new Set(['survey-georeferenced','approved-engineering-alignment','supported-reference-geometry']);
  if(!finite(lat)||!finite(lon)||!method||!supported.has(method))return null;
  return {lat:Number(lat),lon:Number(lon),method,source,confidence:CALCULATED,canonical:false,surveyGrade:false};
 }
 function assetMetadata(body,evidence){
  const geo=plainObject(body?.geospatial||body?.geoMeta||body?.locationMetadata)||{};
  const survey=plainObject(body?.surveySource||body?.survey||body?.geospatialSource);
  return {
   reviewedAt:textOrNull(geo.reviewedAt||body?.reviewedAt),
   reviewedBy:textOrNull(geo.reviewedBy||body?.reviewedBy),
   coordinateOrigin:textOrNull(geo.coordinateOrigin||body?.coordinateOrigin),
   chainageSource:textOrNull(geo.chainageSource||body?.chainageSource),
   topologySource:textOrNull(geo.topologySource||body?.topologySource),
   surveySource:survey||null,
   topology:topologyPayload(body),
   estimatedGuide:estimatedGuidePayload(body),
   evidence:evidence??body?.evidence??null
  };
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
  return {code,chainage,title:item.title,body:item.body,evidence:item.evidence,location:locationPayload(item.body),meta:assetMetadata(item.body,item.evidence)};
 }
 function effective(point){
  const overlay=memberOverlay(point),loc=overlay?.location;
  if(loc){
   if([VALID,PERSONAL,ENGINEERING].includes(loc.locationConfidence)&&finite(loc.lat)&&finite(loc.lon)){
    return {...point,lat:Number(loc.lat),lon:Number(loc.lon),locationConfidence:loc.locationConfidence,coordinateSource:loc.coordinateSource||'Validated project reference',assetMeta:overlay.meta||null,overlay};
   }
   if(loc.locationConfidence===PUBLIC&&finite(loc.lat)&&finite(loc.lon)){
    return {...point,lat:Number(loc.lat),lon:Number(loc.lon),locationConfidence:PUBLIC,coordinateSource:loc.coordinateSource||'Public reference / locality source',assetMeta:overlay.meta||null,overlay};
   }
   if(loc.locationConfidence===PENDING){
    return {...point,
      lat:finite(loc.lat)?Number(loc.lat):(finite(point.lat)?Number(point.lat):null),
      lon:finite(loc.lon)?Number(loc.lon):(finite(point.lon)?Number(point.lon):null),
      locationConfidence:PENDING,
      coordinateSource:loc.coordinateSource||point.coordinateSource||'Pending validation',
      assetMeta:overlay.meta||null,overlay};
   }
  }
  return {...point,locationConfidence:allowedConfidence(point.locationConfidence),coordinateSource:point.coordinateSource||null,assetMeta:overlay?.meta||null,overlay};
 }
 const exact=r=>[VALID,PERSONAL,ENGINEERING].includes(r?.locationConfidence)&&corridorSane(r);
 const mappable=r=>corridorSane(r);

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
  const state={host,controller,map:null,leaflet:null,markers:new Map(),chainageMarker:null,selected:null,filter:'All',query:'',chainageMode:false,ownerLoaded:false,layers:{...MAP_LAYERS}};
  instance=state;
  host.innerHTML='<section class="map-module" aria-label="ECRL reference map">'+
   '<div class="map-identity-row"><span class="map-malaysia-badge" aria-label="Malaysia map context">🇲🇾 <span>Malaysia</span></span></div>'+
   '<div class="map-toolbar"><label class="map-search"><span>Search</span><input type="search" data-map-search placeholder="Station name; Member code / chainage when available" autocomplete="off"></label>'+
   '<div class="map-filters" role="group" aria-label="Map filters">'+['All','STN','PL','Depot'].map(x=>'<button type="button" data-map-filter="'+x+'" aria-pressed="'+(x==='All')+'">'+x+'</button>').join('')+'</div>'+
   '<div class="map-actions"><button type="button" data-map-fit>FIT FULL ROUTE</button><button type="button" data-map-focus disabled>FOCUS SELECTED</button></div></div>'+
   '<div class="map-layout"><div class="map-canvas-wrap"><div class="map-canvas" data-map-canvas aria-label="Interactive Malaysia railway-first reference map"></div><p class="map-attribution-note">Railway context is a visual OpenStreetMap/OpenRailwayMap reference layer, not surveyed ECRL geometry. Exact asset markers still require a validated confidence class; Public Reference and Pending markers remain approximate/reference only.</p></div>'+
   '<aside class="map-side"><div data-map-detail class="map-detail"><span class="access-label">MAP</span><h3>Select an asset</h3><p>Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.</p></div><div class="map-results" data-map-results></div></aside></div>'+
   '<p class="study-boundary">No route line / no polyline. Manual pan or zoom never recalculates stored marker coordinates.</p>'+
   '</section>';

  const resultHost=host.querySelector('[data-map-results]'),detailHost=host.querySelector('[data-map-detail]');
  const input=host.querySelector('[data-map-search]'),focusBtn=host.querySelector('[data-map-focus]');
  const corridorBase=()=>points().filter(p=>p.phase==='current');
  const corridorRecords=()=>corridorBase().map(effective);
  function approvedAliases(r){
   const o=r.overlay||{},aliases=[r.name,o.code,o.chainage];
   const name=normalize(r.name),code=String(o.code||'').toUpperCase();
   if(name==='pekan sg tong')aliases.push('Pekan Sungai Tong');
   if(name==='kuantan port city depot')aliases.push('Kuantan Depot','Depot Kuantan','Depot KTN');
   if(code==='STN17'||name==='itt gombak')aliases.push('Gombak');
   return aliases.filter(Boolean);
  }
  function rankedSearch(){
   if(!state.query||state.chainageMode)return [];
   const ranked=I.rankRecords(corridorRecords(),state.query,approvedAliases);
   if(ranked[0]?.score===100)return ranked.filter(x=>x.score===100);
   return ranked;
  }
  const filtered=()=>corridorRecords().filter(r=>state.filter==='All'||r.type===state.filter);
  const visible=()=>state.query&&!state.chainageMode?rankedSearch().map(x=>x.record):filtered();
  const setFilter=type=>{state.filter=type;host.querySelectorAll('[data-map-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.mapFilter===type)));};
  function chainageAnchors(){
   if(!A?.canReadMemberContent)return [];
   return corridorRecords().map(record=>{
    const chainageKm=I.parseChainage(record.overlay?.chainage);
    return {record,code:record.overlay?.code||null,name:record.name,type:record.type,chainageKm,lat:Number(record.lat),lon:Number(record.lon),locationConfidence:record.locationConfidence,coordinateSource:sourceText(record)};
   }).filter(a=>Number.isFinite(a.chainageKm)).sort((a,b)=>a.chainageKm-b.chainageKm);
  }
  function ownerChainageContext(record){
   const km=I.parseChainage(record?.overlay?.chainage);
   if(km===null)return {status:'unavailable'};
   return I.chainageContext(chainageAnchors(),km);
  }
  function resolveChainage(km){
   const bracket=I.bracketChainage(chainageAnchors(),km);
   if(bracket.status==='exact')return {kind:'asset',record:bracket.anchor.record,chainageKm:km};
   if(bracket.status==='bracket')return {kind:'bracket',chainageKm:km,previous:bracket.previous,next:bracket.next,afterPreviousKm:km-bracket.previous.chainageKm,beforeNextKm:bracket.next.chainageKm-km};
   return {kind:'error',status:bracket.status,bracket,chainageKm:km};
  }
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
  function anchorText(a){return [a?.code,a?.name,I.formatChainage(a?.chainageKm)].filter(Boolean).join(' · ');}
  function safeArray(v){return Array.isArray(v)?v.filter(x=>x!==null&&x!==undefined&&String(x).trim()!==''):[];}
  function topologyValue(v){return Array.isArray(v)?v.join(', '):typeof v==='boolean'?(v?'Yes':'No'):String(v);}
  function renderOperationalDetail(r){
   const t=r?.assetMeta?.topology;if(!t)return '';
   const rows=[
    ['Track count',t.trackCount],['Platforms',t.platformCount],['Track / line IDs',[...safeArray(t.trackIds),...safeArray(t.lineIds)]],
    ['Platform IDs',safeArray(t.platformIds)],['Siding',t.siding],['Depot access',t.depotAccess],['Freight line',t.freightLine],
    ['Passenger line',t.passengerLine],['Connection direction',t.connectionDirection],['Track function',t.trackFunction],
    ['Usable length',t.usableLength],['Max consist / wagon note',t.maxConsistNote]
   ].filter(([,v])=>!(v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length)));
   if(!rows.length)return '';
   return '<section class="map-detail-level"><h4>Operational Detail</h4><dl class="map-member-detail">'+rows.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(topologyValue(v))+'</dd></div>').join('')+'</dl></section>';
  }
  function renderTopologyDetail(r){
   const t=r?.assetMeta?.topology;if(!t)return '';
   const source=t.schematicSource||t.layoutSource||r.assetMeta?.topologySource;
   const seq=t.turnoutSequence;
   if(!source&&!seq&&!t.topologyConfidence)return '';
   return '<section class="map-detail-level"><h4>Schematic / Topology</h4><dl class="map-member-detail">'+
    (seq?'<div><dt>Turnout sequence</dt><dd>'+esc(topologyValue(seq))+'</dd></div>':'')+
    (t.topologyConfidence?'<div><dt>Topology confidence</dt><dd>'+esc(t.topologyConfidence)+'</dd></div>':'')+
    (source?'<div><dt>Layout source</dt><dd>'+esc(source)+'</dd></div>':'')+
    '</dl></section>';
  }
  function renderDetail(r){
   state.selected=r||null;focusBtn.disabled=!mappable(r);syncSelectedMarker();
   if(!r){detailHost.innerHTML='<span class="access-label">MAP</span><h3>Select an asset</h3><p>Choose a result to inspect coordinate confidence. Exact markers appear only for validated locations.</p>';return;}
   if(r.isChainageBracket){
    detailHost.innerHTML='<span class="access-label">CHAINAGE</span><h3>'+esc(r.name)+'</h3>'+
     '<p><strong>Calculated Corridor Reference — position unresolved</strong></p>'+
     '<dl class="map-member-detail">'+
      '<div><dt>Previous anchor</dt><dd>'+esc(anchorText(r.previous))+'</dd></div>'+
      '<div><dt>Next anchor</dt><dd>'+esc(anchorText(r.next))+'</dd></div>'+
      '<div><dt>After previous</dt><dd>'+esc(r.afterPreviousKm.toFixed(3))+' km</dd></div>'+
      '<div><dt>Before next</dt><dd>'+esc(r.beforeNextKm.toFixed(3))+' km</dd></div>'+
      '<div><dt>Reference coordinate</dt><dd>Not calculated</dd></div>'+
     '</dl><p>The visible railway layer is raster reference context only. No queryable route geometry is available, so MAP does not invent a latitude/longitude point for this chainage.</p>';
    return;
   }
   const o=r.overlay||{};
   detailHost.innerHTML='<span class="access-label">'+esc(r.type)+'</span><h3>'+esc(r.name)+'</h3>'+
    '<section class="map-detail-level"><h4>Basic</h4><dl class="map-member-detail">'+
     '<div><dt>Code</dt><dd>'+esc(o.code||'—')+'</dd></div>'+
     '<div><dt>Name</dt><dd>'+esc(r.name)+'</dd></div>'+
     '<div><dt>Category</dt><dd>'+esc(r.type)+'</dd></div>'+
     '<div><dt>Chainage</dt><dd>'+esc(o.chainage||'—')+'</dd></div>'+
     '<div><dt>Latitude</dt><dd>'+esc(coordinateText(r.lat))+'</dd></div>'+
     '<div><dt>Longitude</dt><dd>'+esc(coordinateText(r.lon))+'</dd></div>'+
     '<div><dt>Location confidence</dt><dd>'+esc(r.locationConfidence)+'</dd></div>'+
     '<div><dt>Coordinate source</dt><dd>'+esc(sourceText(r))+'</dd></div>'+
    '</dl></section><p>'+esc(note(r))+'</p>'+
    (A?.canReadMemberContent?renderOperationalDetail(r)+renderTopologyDetail(r):'')+
    (A?.canReadMemberContent?'<p class="map-access-note">Approved Member Corridor data is merged at runtime only.</p>':'<p class="map-access-note">Public view · protected Corridor records are not loaded.</p>')+
    (A?.canAdmin?'<div class="owner-map-slot" data-owner-map-slot></div>':'');
  }
  function clearChainageMarker(){try{state.chainageMarker?.remove();}catch{}state.chainageMarker=null;}
  function selectAsset(r,{reveal=true}={}){
   clearChainageMarker();state.chainageMode=false;
   if(reveal&&r?.type&&['STN','PL','Depot'].includes(r.type))setFilter(r.type);
   renderDetail(r);renderResults();if(mappable(r))focusStored(r);loadOwnerTools();
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
    marker=state.leaflet.marker([Number(r.lat),Number(r.lon)],{icon,keyboard:true,title:r.name,riseOnHover:true,pane:'canonicalAssets'}).addTo(state.map);
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
  function coordsFor(records){return records.filter(mappable).map(r=>[Number(r.lat),Number(r.lon)]);}
  function fitRecords(records){
   const coords=coordsFor(records);
   if(!coords.length||!state.map)return false;
   state.map.fitBounds(state.leaflet.latLngBounds(coords),{padding:[28,28],maxZoom:8});
   return true;
  }
  function fitCorridor(){return fitRecords(corridorRecords());}
  function fitVisible(){return fitRecords(visible());}
  function chainageError(result){
   clearChainageMarker();state.selected=null;focusBtn.disabled=true;
   const label=I.formatChainage(result.chainageKm)||String(input.value||'').trim();
   const message=!A?.canReadMemberContent?'Verified Member access is required for canonical chainage search.'
    :result.status==='out-of-range'?'Chainage is outside the currently supported canonical anchor range.'
    :result.status==='missing-anchors'||result.status==='missing-bracket'?'There are not enough supported chainage anchors for this location.'
    :'Chainage reference could not be resolved safely.';
   detailHost.innerHTML='<span class="access-label">CHAINAGE</span><h3>'+esc(label)+'</h3><p>'+esc(message)+'</p><p class="map-access-note">No coordinate was invented and the current corridor viewport is preserved.</p>';
  }
  function resolveInput(){
   state.query=input.value.trim();clearChainageMarker();
   const km=I.parseChainage(state.query);
   if(state.query&&km!==null){
    state.chainageMode=true;renderResults();
    const result=resolveChainage(km);
    if(result.kind==='asset'){state.chainageMode=false;state.query='';selectAsset(result.record);return;}
    if(result.kind==='bracket'){
     const bracketView={...result,id:'chainage-'+km.toFixed(3),type:'Chainage',name:I.formatChainage(km).replace('+','.'),locationConfidence:'Calculated Corridor Reference',isChainageBracket:true};
     renderDetail(bracketView);
     return;
    }
    chainageError(result);return;
   }
   state.chainageMode=false;renderResults();
   if(!state.query)return;
   const ranked=rankedSearch();
   if(ranked.length===1||(ranked[0]&&ranked[1]&&ranked[0].score>ranked[1].score))selectAsset(ranked[0].record);
  }
  input.addEventListener('input',resolveInput,{signal});
  host.querySelector('.map-filters').addEventListener('click',e=>{const b=e.target.closest('[data-map-filter]');if(!b)return;setFilter(b.dataset.mapFilter);renderResults();fitVisible();},{signal});
  resultHost.addEventListener('click',e=>{const b=e.target.closest('[data-map-point]');if(!b)return;const base=points().find(x=>x.id===b.dataset.mapPoint);if(!base)return;selectAsset(effective(base));},{signal});
  host.querySelector('[data-map-fit]').addEventListener('click',()=>{clearChainageMarker();fitCorridor();},{signal});
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
    getChainageContext:record=>ownerChainageContext(record||state.selected),
    getEstimatedGuide:record=>(record||state.selected)?.assetMeta?.estimatedGuide||null,
    getAssetMetadata:record=>(record||state.selected)?.assetMeta||null,
    layerNames:MAP_LAYERS,
    renderDetail,
    renderResults,
    focusStored,
    async refreshCanonical(){
     await A.fetchMemberBundle();
     if(state.selected)state.selected=effective(points().find(x=>x.id===state.selected.id)||state.selected);
     renderDetail(state.selected);renderResults();fitCorridor();loadOwnerTools(true);
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
   const canonicalPane=state.map.createPane?.('canonicalAssets');
   if(canonicalPane){canonicalPane.style.zIndex='420';canonicalPane.classList.add('railway-canonical-pane');}
   const surveyPane=state.map.createPane?.('surveyGeometry');
   if(surveyPane){surveyPane.style.zIndex='360';surveyPane.style.pointerEvents='none';surveyPane.classList.add('railway-survey-pane');}
   const topologyPane=state.map.createPane?.('topologyGeometry');
   if(topologyPane){topologyPane.style.zIndex='380';topologyPane.style.pointerEvents='none';topologyPane.classList.add('railway-topology-pane');}
   const chainageGuidePane=state.map.createPane?.('chainageGuide');
   if(chainageGuidePane){chainageGuidePane.style.zIndex='440';chainageGuidePane.classList.add('railway-chainage-guide-pane');}
   const proposedPane=state.map.createPane?.('proposedEdit');
   if(proposedPane){proposedPane.style.zIndex='460';proposedPane.classList.add('railway-proposed-pane');}
   state.leaflet.tileLayer(TILE_URL,{pane:basePane?'railwayBase':'tilePane',maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',updateWhenIdle:true,keepBuffer:1,detectRetina:false}).addTo(state.map);
   state.leaflet.tileLayer(RAIL_REFERENCE_TILE_URL,{pane:referencePane?'railwayReference':'overlayPane',minZoom:5,maxZoom:19,attribution:'Style: <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener">CC-BY-SA 2.0</a> <a href="https://www.openrailwaymap.org/" target="_blank" rel="noopener">OpenRailwayMap</a>',updateWhenIdle:true,keepBuffer:1,detectRetina:false}).addTo(state.map);
   renderResults();fitCorridor();renderDetail(null);
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
  const old=instance;instance=null;window.RailwayOwnerMap?.unmount();old.controller.abort();try{old.chainageMarker?.remove();}catch{}try{old.map?.remove();}catch{}old.markers.clear();
 }
 window.RailwayMap=Object.freeze({mount,unmount,get mounted(){return Boolean(instance);},referenceCount(){return points().length}});
})();
