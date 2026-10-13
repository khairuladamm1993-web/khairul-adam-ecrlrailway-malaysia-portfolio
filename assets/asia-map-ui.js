/* Optional Asia MAP UI. ECRL mount remains the authoritative default; no canonical or owner data access. */
(()=>{
'use strict';
if(window.MRS10AsiaMapUI)return;
let active=null,infoLoader=null;
function ensureInfoOverlay(){if(window.MRS10AsiaInfoOverlay)return Promise.resolve(window.MRS10AsiaInfoOverlay);if(infoLoader)return infoLoader;infoLoader=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/asia-info-overlay.js';s.async=true;s.onload=()=>window.MRS10AsiaInfoOverlay?resolve(window.MRS10AsiaInfoOverlay):reject(Error('Overlay unavailable'));s.onerror=()=>reject(Error('Overlay script unavailable'));document.head.append(s)}).catch(e=>{infoLoader=null;throw e});return infoLoader;}
function unmount(){
 if(!active)return;
 const old=active;active=null;
 try{old.info?.unmount();}catch{}
 try{old.asia?.remove();}catch{}
 try{old.railway?.unmount();}catch{}
 if(old.host){delete old.host.dataset.mapReady;delete old.host.dataset.validatedMarkers;delete old.host.dataset.totalMarkers;old.host.replaceChildren();}
}
function mount(host,railway){
 unmount();if(!host||!railway?.mount||!railway?.unmount)return;
 const state={host,railway,asia:null,info:null,current:'ecrl'};active=state;
 const wrapper=document.createElement('section');
 wrapper.className='asia-map-switch';
 wrapper.innerHTML='<div class="asia-map-switch-controls" role="group" aria-label="Railway map view">'+
  '<button type="button" data-asia-view="ecrl" aria-pressed="true">ECRL CORRIDOR MAP</button>'+
  '<button type="button" data-asia-view="asia" aria-pressed="false">ASIA RAILWAY NETWORK</button></div>'+
  '<div data-asia-ecrl></div><div data-asia-panel hidden><p class="study-boundary">Asian railway context layer: OpenRailwayMap visual reference. Track locations, names and operating status are not independently verified in this module; no ECRL route is inferred.</p>'+
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
    m.setView([4.2,102.5],6);
    // V0.4.2 accepts only independently sourced vector data; empty until vetted data is provided.
    ensureInfoOverlay().then(api=>{if(active===state&&state.current==='asia'&&state.asia===m)state.info=api.mount(window.L,m,[]);}).catch(()=>{});
    // Source-backed vector overlays can be added later; raster railway pixels have no feature identity.
    // Do not fabricate stations, track alignment coordinates, names, or clickable raster popups.
    requestAnimationFrame(()=>{if(active===state&&state.asia===m)m.invalidateSize(false)});
   }catch(e){panel.querySelector('[data-asia-canvas]').textContent='Railway reference map unavailable: '+String(e.message||e);}
  }else{
   try{state.info?.unmount();}catch{}state.info=null;
   try{state.asia?.remove();}catch{}state.asia=null;
   panel.hidden=true;ecrl.hidden=false;
   state.current='ecrl';mountEcrl();
  }
  state.current=view;
  wrapper.querySelectorAll('[data-asia-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.asiaView===view)));
 }
 wrapper.querySelector('.asia-map-switch-controls').addEventListener('click',e=>{
  const button=e.target.closest('[data-asia-view]');if(button&&wrapper.contains(button))show(button.dataset.asiaView);
 });
 mountEcrl();
}
window.MRS10AsiaMapUI=Object.freeze({mount,unmount,get mounted(){return Boolean(active)}});
})();