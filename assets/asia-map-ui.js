/* Optional Asia MAP UI. ECRL mount remains the authoritative default; no canonical or owner data access. */
(()=>{
'use strict';
if(window.MRS10AsiaMapUI)return;
let active=null;
function unmount(){
 if(!active)return;
 const old=active;active=null;
 try{old.asia?.remove();}catch{}
 try{old.railway?.unmount();}catch{}
 old.host?.replaceChildren();
}
function mount(host,railway){
 unmount();if(!host||!railway?.mount||!railway?.unmount)return;
 const state={host,railway,asia:null,current:'ecrl'};active=state;
 const wrapper=document.createElement('section');
 wrapper.className='asia-map-switch';
 wrapper.innerHTML='<div class="asia-map-switch-controls" role="group" aria-label="Railway map view">'+
  '<button type="button" data-asia-view="ecrl" aria-pressed="true">ECRL CORRIDOR MAP</button>'+
  '<button type="button" data-asia-view="asia" aria-pressed="false">ASIA RAILWAY NETWORK</button></div>'+
  '<div data-asia-ecrl></div><div data-asia-panel hidden><p class="study-boundary">Asian railway context layer: OpenRailwayMap visual reference. Track locations, names and operating status are not independently verified in this module; no ECRL route is inferred.</p>'+
  '<div data-asia-canvas role="img" aria-label="Asia railway reference map" style="height:min(58vh,520px);min-height:310px"></div>'+
  '<p class="study-boundary">This view is a visual reference only. No interactive approved railway geometries have been loaded.</p></div>';
 host.replaceChildren(wrapper);
 const ecrl=wrapper.querySelector('[data-asia-ecrl]'),panel=wrapper.querySelector('[data-asia-panel]');
 function show(view){
  if(active!==state||state.current===view)return;
  if(view==='asia'){
   railway.unmount();ecrl.hidden=true;panel.hidden=false;
   try{
    if(!window.L?.map||!window.L?.tileLayer)throw Error('Map library unavailable');
    const m=window.L.map(wrapper.querySelector('[data-asia-canvas]'),{zoomControl:true,attributionControl:true,preferCanvas:true,minZoom:3,maxZoom:17});
    state.asia=m;
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
    window.L.tileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{maxZoom:19,attribution:'OpenRailwayMap railway reference'}).addTo(m);
    m.setView([11.5,106],5);
    requestAnimationFrame(()=>{if(active===state&&state.asia===m)m.invalidateSize(false)});
   }catch(e){panel.querySelector('[data-asia-canvas]').textContent='Railway reference map unavailable: '+String(e.message||e);}
  }else{
   try{state.asia?.remove();}catch{}state.asia=null;
   panel.hidden=true;ecrl.hidden=false;
   Promise.resolve(railway.mount(ecrl)).catch(()=>{if(active===state)ecrl.textContent='ECRL map could not load.'});
  }
  state.current=view;
  wrapper.querySelectorAll('[data-asia-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.asiaView===view)));
 }
 wrapper.querySelector('.asia-map-switch-controls').addEventListener('click',e=>{
  const button=e.target.closest('[data-asia-view]');if(button&&wrapper.contains(button))show(button.dataset.asiaView);
 });
 Promise.resolve(railway.mount(ecrl)).catch(()=>{if(active===state)ecrl.textContent='ECRL map could not load.'});
}
window.MRS10AsiaMapUI=Object.freeze({mount,unmount,get mounted(){return Boolean(active)}});
})();