/* Optional Asia MAP UI. ECRL mount remains the authoritative default; no canonical or owner data access. */
(()=>{
'use strict';
if(window.MRS10AsiaMapUI)return;
let active=null,catalogueLoader=null;
function ensureCatalogue(){if(window.MRS10MalaysiaCatalogue)return Promise.resolve(window.MRS10MalaysiaCatalogue);if(catalogueLoader)return catalogueLoader;catalogueLoader=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/malaysia-network-catalogue.js';s.async=true;s.dataset.malaysiaCatalogue='1';s.onload=()=>window.MRS10MalaysiaCatalogue?resolve(window.MRS10MalaysiaCatalogue):reject(Error('Catalogue unavailable'));s.onerror=()=>reject(Error('Catalogue failed to load'));document.head.append(s)}).catch(e=>{catalogueLoader=null;throw e});return catalogueLoader;}
function unmount(){
 if(!active)return;
 const old=active;active=null;
 try{old.asia?.remove();}catch{}
 try{old.railway?.unmount();}catch{}
 if(old.host){delete old.host.dataset.mapReady;delete old.host.dataset.validatedMarkers;delete old.host.dataset.totalMarkers;old.host.replaceChildren();}
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
  '<div class="malaysia-network-controls"><label>Malaysia rail search <input type="search" data-malaysia-search placeholder="ECRL, KTMB, MRT, LRT, Monorail, ERL, RTS"></label><label>Network type <select data-malaysia-category><option value="All">All networks</option></select></label></div><div data-malaysia-results aria-live="polite"></div>'+
  '<div data-asia-canvas role="img" aria-label="Asia railway reference map" style="height:min(58vh,520px);min-height:310px"></div>'+
  '<p class="study-boundary">This view is a visual reference only. No interactive approved railway geometries have been loaded.</p></div>';
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
 function renderCatalogue(c){
  if(active!==state||state.current!=='asia')return;
  const input=panel.querySelector('[data-malaysia-search]'),sel=panel.querySelector('[data-malaysia-category]'),results=panel.querySelector('[data-malaysia-results]');
  const escape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  sel.innerHTML=c.categories.map(x=>'<option value="'+escape(x)+'">'+escape(x)+'</option>').join('');
  const render=()=>{const rows=c.search(input.value,sel.value);results.innerHTML='<p>'+rows.length+' reference entries. Regional centers are not railway coordinates.</p>'+rows.map(r=>'<button type="button" class="malaysia-result" data-network="'+escape(r.id)+'"><strong>'+escape(r.name)+'</strong><span>'+escape(r.category)+' · '+escape(r.region)+'</span><small>'+escape(r.note)+'</small></button>').join('');};
  input.addEventListener('input',render);sel.addEventListener('change',render);
  results.addEventListener('click',e=>{const b=e.target.closest('[data-network]');if(!b)return;const r=c.records.find(x=>x.id===b.dataset.network);if(r&&state.asia?.setView)state.asia.setView(r.center,r.zoom);});
  render();
 }
 function show(view){
  if(active!==state||state.current===view)return;
  if(view==='asia'){
   railway.unmount();delete host.dataset.mapReady;delete host.dataset.validatedMarkers;delete host.dataset.totalMarkers;ecrl.hidden=true;panel.hidden=false;
   try{
    if(!window.L?.map||!window.L?.tileLayer)throw Error('Map library unavailable');
    const m=window.L.map(wrapper.querySelector('[data-asia-canvas]'),{zoomControl:true,attributionControl:true,preferCanvas:true,minZoom:3,maxZoom:17});
    state.asia=m;
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
    window.L.tileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',{maxZoom:19,attribution:'OpenRailwayMap railway reference'}).addTo(m);
    m.setView([4.2,102.5],6);
    ensureCatalogue().then(c=>renderCatalogue(c)).catch(()=>{if(active===state&&state.current==='asia')panel.querySelector('[data-malaysia-results]').textContent='Catalogue unavailable; railway reference map remains available.';});
    requestAnimationFrame(()=>{if(active===state&&state.asia===m)m.invalidateSize(false)});
   }catch(e){panel.querySelector('[data-asia-canvas]').textContent='Railway reference map unavailable: '+String(e.message||e);}
  }else{
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