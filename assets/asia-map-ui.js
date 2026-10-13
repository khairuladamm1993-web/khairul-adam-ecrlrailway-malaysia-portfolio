/* Optional Asia MAP UI. ECRL mount remains the authoritative default; no canonical or owner data access. */
(()=>{
'use strict';
if(window.MRS10AsiaMapUI)return;
let active=null,infoLoader=null,stationsLoader=null,osmLoader=null;
function ensureOSM(){if(window.MRS10MalaysiaOSM)return Promise.resolve(window.MRS10MalaysiaOSM);if(osmLoader)return osmLoader;osmLoader=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/malaysia-osm-stations.js';s.async=true;s.onload=()=>window.MRS10MalaysiaOSM?resolve(window.MRS10MalaysiaOSM):reject(Error('Station discovery unavailable'));s.onerror=()=>reject(Error('Station discovery script unavailable'));document.head.append(s)}).catch(e=>{osmLoader=null;throw e});return osmLoader;}
function ensureMalaysiaStations(){if(window.MRS10MalaysiaStations)return Promise.resolve(window.MRS10MalaysiaStations);if(stationsLoader)return stationsLoader;stationsLoader=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/malaysia-station-features.js';s.async=true;s.onload=()=>window.MRS10MalaysiaStations?resolve(window.MRS10MalaysiaStations):reject(Error('Station references unavailable'));s.onerror=()=>reject(Error('Station source unavailable'));document.head.append(s)}).catch(e=>{stationsLoader=null;throw e});return stationsLoader;}
// Country centers are navigation presets only, never station or track geometry.
const countryViews=Object.freeze({malaysia:{center:[4.2,102.5],zoom:6},thailand:{center:[15.1,101],zoom:6},china:{center:[34.5,104.2],zoom:4}});
function ensureInfoOverlay(){if(window.MRS10AsiaInfoOverlay)return Promise.resolve(window.MRS10AsiaInfoOverlay);if(infoLoader)return infoLoader;infoLoader=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/asia-info-overlay.js';s.async=true;s.onload=()=>window.MRS10AsiaInfoOverlay?resolve(window.MRS10AsiaInfoOverlay):reject(Error('Overlay unavailable'));s.onerror=()=>reject(Error('Overlay script unavailable'));document.head.append(s)}).catch(e=>{infoLoader=null;throw e});return infoLoader;}
function unmount(){
 if(!active)return;
 const old=active;active=null;
 try{old.osmAbort?.abort();}catch{}
 try{old.osmInfo?.unmount();}catch{}
 try{old.info?.unmount();}catch{}
 try{old.asia?.remove();}catch{}
 try{old.railway?.unmount();}catch{}
 if(old.host){delete old.host.dataset.mapReady;delete old.host.dataset.validatedMarkers;delete old.host.dataset.totalMarkers;old.host.replaceChildren();}
}
function mount(host,railway){
 unmount();if(!host||!railway?.mount||!railway?.unmount)return;
 const state={host,railway,asia:null,info:null,osmInfo:null,osmAbort:null,osmVersion:0,country:'malaysia',current:'ecrl'};active=state;
 const wrapper=document.createElement('section');
 wrapper.className='asia-map-switch';
 wrapper.innerHTML='<div class="asia-map-switch-controls" role="group" aria-label="Railway map view">'+
  '<button type="button" data-asia-view="ecrl" aria-pressed="true">ECRL CORRIDOR MAP</button>'+
  '<button type="button" data-asia-view="asia" aria-pressed="false">ASIA RAILWAY NETWORK</button></div>'+
  '<div data-asia-ecrl></div><div data-asia-panel hidden><p class="study-boundary">Asian railway context layer: OpenRailwayMap visual reference. Track locations, names and operating status are not independently verified in this module; no ECRL route is inferred.</p>'+
  '<div class="asia-country-switch" role="group" aria-label="Explore railway by country"><button type="button" data-asia-country="malaysia" aria-pressed="true">🇲🇾 Malaysia</button><button type="button" data-asia-country="thailand" aria-pressed="false">🇹🇭 Thailand</button><button type="button" data-asia-country="china" aria-pressed="false">🇨🇳 China</button></div>'+
  '<p data-station-status class="study-boundary" aria-live="polite">Station references are loaded by map area when zoomed in.</p>'+
  '<div data-asia-canvas role="img" aria-label="Asia railway reference map" style="height:min(58vh,520px);min-height:310px"></div>'+
  '<p class="study-boundary">Tap verified station or track features for details when source-backed geometry is available. Raster reference tracks are not selectable.</p></div>';
 host.replaceChildren(wrapper);
 const ecrl=wrapper.querySelector('[data-asia-ecrl]'),panel=wrapper.querySelector('[data-asia-panel]');
 function mountEcrl(){
  delete host.dataset.mapReady;
  return Promise.resolve(railway.mount(ecrl)).then(()=>{
   if(active!==state||state.current!=='ecrl')return;
   host.dataset.mapReady=ecrl.dataset.mapReady||'error';
   host.dataset.validatedMarkers=ecrl.dataset.validatedMarkers||'0';
   host.dataset.totalMarkers=ecrl.dataset.totalMarkers||'0';
  }).catch(()=>{if(active===state&&state.current==='ecrl'){host.dataset.mapReady='error';ecrl.textContent='ECRL map could not load.';}});
 }
 async function refreshStations(m){
  if(active!==state||state.current!=='asia'||state.asia!==m)return;
  state.osmAbort?.abort();state.osmInfo?.unmount();state.osmInfo=null;
  const status=panel.querySelector('[data-station-status]'),version=++state.osmVersion;
  if(state.country!=='malaysia'){status.textContent='Station discovery currently scoped to Malaysia.';return;}
  if(m.getZoom()<8){status.textContent='Zoom closer to discover nearby Malaysia railway stations.';return;}
  const bounds=m.getBounds(),b=[bounds.getSouth(),bounds.getWest(),bounds.getNorth(),bounds.getEast()];
  const controller=new AbortController();state.osmAbort=controller;
  status.textContent='Loading public railway station references for this area…';
  try{
   const api=await ensureOSM();if(controller.signal.aborted)return;
   if(!api.boundsValid(b)){status.textContent='Zoom closer to a smaller Malaysia area.';return;}
   const features=await api.load(b,{signal:controller.signal});
   if(controller.signal.aborted||version!==state.osmVersion||active!==state||state.asia!==m)return;
   const overlay=await ensureInfoOverlay();if(controller.signal.aborted||version!==state.osmVersion)return;
   if(state.country!=='malaysia'||controller.signal.aborted||version!==state.osmVersion)return;
   state.osmInfo=overlay.mount(window.L,m,features);
   status.textContent=features.length+' public station references in this area (OpenStreetMap; not official operator verification).';
  }catch(e){if(!controller.signal.aborted&&active===state&&version===state.osmVersion)status.textContent='Station data unavailable; OpenRailwayMap remains usable.';}
 }
 function show(view){
  if(active!==state||state.current===view)return;
  if(view==='asia'){
   railway.unmount();delete host.dataset.mapReady;delete host.dataset.validatedMarkers;delete host.dataset.totalMarkers;ecrl.hidden=true;panel.hidden=false;
   try{
    if(!window.L?.map||!window.L?.tileLayer)throw Error('Map library unavailable');
    const m=window.L.map(wrapper.querySelector('[data-asia-canvas]'),{zoomControl:true,attributionControl:true,preferCanvas:true,minZoom:3,maxZoom:17});
    state.asia=m;
    const base=m.createPane('asiaMutedRoads');base.style.zIndex='200';base.style.opacity='0.42';
    const rail=m.createPane('asiaRailways');rail.style.zIndex='350';rail.style.pointerEvents='none';
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{pane:'asiaMutedRoads',maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
    window.L.tileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{pane:'asiaRailways',maxZoom:19,attribution:'OpenRailwayMap railway reference'}).addTo(m);
    m.setView(countryViews.malaysia.center,countryViews.malaysia.zoom);
    // Use existing public-safe ECRL locality references, never canonical/member records or guessed KTMB stations.
    Promise.all([ensureInfoOverlay(),ensureMalaysiaStations()]).then(([api,stationApi])=>{
      if(active!==state||state.current!=='asia'||state.asia!==m)return;
      const features=stationApi.fromPublicReference(window.RailwayCorridorReference||[]);
      state.info=api.mount(window.L,m,features);
    }).catch(()=>{});
    // Source-backed vector overlays can be added later; raster railway pixels have no feature identity.
    // Do not fabricate stations, track alignment coordinates, names, or clickable raster popups.
    m.on('moveend',()=>refreshStations(m));
    requestAnimationFrame(()=>{if(active===state&&state.asia===m){m.invalidateSize(false);refreshStations(m)}});
   }catch(e){panel.querySelector('[data-asia-canvas]').textContent='Railway reference map unavailable: '+String(e.message||e);}
  }else{
   state.osmAbort?.abort();state.osmVersion++;try{state.osmInfo?.unmount();}catch{}state.osmInfo=null;
   try{state.info?.unmount();}catch{}state.info=null;
   try{state.asia?.remove();}catch{}state.asia=null;
   panel.hidden=true;ecrl.hidden=false;
   state.current='ecrl';mountEcrl();
  }
  state.current=view;
  wrapper.querySelectorAll('[data-asia-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.asiaView===view)));
 }
 panel.querySelector('.asia-country-switch').addEventListener('click',e=>{
  const b=e.target.closest('[data-asia-country]');if(!b||!panel.contains(b)||state.current!=='asia'||!state.asia)return;
  const country=countryViews[b.dataset.asiaCountry];if(!country)return;
  state.country=b.dataset.asiaCountry;
  state.osmAbort?.abort();state.osmVersion++;
  state.asia.setView(country.center,country.zoom);
  refreshStations(state.asia);
  panel.querySelectorAll('[data-asia-country]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 });
 wrapper.querySelector('.asia-map-switch-controls').addEventListener('click',e=>{
  const button=e.target.closest('[data-asia-view]');if(button&&wrapper.contains(button))show(button.dataset.asiaView);
 });
 mountEcrl();
}
window.MRS10AsiaMapUI=Object.freeze({mount,unmount,get mounted(){return Boolean(active)}});
})();