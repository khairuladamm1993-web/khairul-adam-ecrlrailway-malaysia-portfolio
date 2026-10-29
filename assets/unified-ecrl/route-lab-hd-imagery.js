/* P01 D102 HD visual calibration — MapTiler BYO origin-restricted browser API key.
 * No key committed, uploaded, cached in localStorage, or written in logs.
 * Imagery is only a VIEW; never implies surveyed railway or station accuracy.
 * Fallback remains EOxCloudless 2016 and OpenFreeMap. */
(function(root){'use strict';
const SOURCE='mrs10-maptiler-owner-hd',LAYER=SOURCE+'-raster';
const TILE_TEMPLATE='https://api.maptiler.com/tiles/satellite-v4/tiles.json?key=';
const CREDIT='© MapTiler · satellite imagery providers (see MapTiler source metadata)';
let map=null,mode='LOW_RES_ONLY',tileState='DISABLED',lastError=null,attempted=false;
function get(id){return root.document.getElementById(id)}
function paint(){
 const b=get('lab-basemap-hd'),s=get('lab-hd-status'),tip=get('lab-hd-license');
 if(b)b.setAttribute('aria-pressed',String(mode==='HD'));
 if(mode==='HD'){for(const id of ['lab-basemap-satellite','lab-basemap-street']){const x=get(id);if(x)x.setAttribute('aria-pressed','false')}}
 if(s){s.textContent=mode==='HD'?(tileState==='SOURCE_LOADED'?'Satelit HD diproses — semak butiran imej dan metadata lokasi':'Satelit HD dipilih — memuatkan tile berlesen'):mode==='ERROR'?'Satelit HD tidak dapat dimuatkan — kembali kepada Satelit 2016': 'Satelit HD pilihan · perlu kunci MapTiler milik pengguna';
 s.dataset.status=tileState;}
 if(tip)tip.textContent='Pratonton latihan sahaja · imej pihak ketiga · belum membuktikan koordinat STN01/CH. Kunci API kekal dalam sesi browser dan URL permintaan tile (bukan rahsia). Hadkan domain di MapTiler.';
}
function enable(){
 const field=get('lab-hd-key'),value=String(field?.value||'').trim();
 if(!/^[A-Za-z0-9_-]{12,128}$/.test(value)){hide();tileState='KEY_REQUIRED';paint();return false}
 if(!map?.getStyle?.()){tileState='WAITING_MAP';paint();return false}
 try{
  // Source replacement supports switching keys without persisting them anywhere.
  if(map.getLayer(LAYER))map.removeLayer(LAYER);
  if(map.getSource(SOURCE))map.removeSource(SOURCE);
  const url=TILE_TEMPLATE+encodeURIComponent(value);
  map.addSource(SOURCE,{type:'raster',url,attribution:CREDIT});
  let below;
  const priority=['mrs10-lab-openrailwaymap-standard-raster-layer','mrs10-lab-station-circles','mrs10-lab-port-purple'];
  for(const id of priority){if(map.getLayer(id)){below=id;break}}
  map.addLayer({id:LAYER,type:'raster',source:SOURCE,paint:{'raster-opacity':1,'raster-fade-duration':0}},below);
  // Source is registered below rail/asset markers; existing EOx is hidden.
  root.MRS10ECRLSatelliteBasemap?.setMode('street');
  mode='HD';tileState='REQUESTED';lastError=null;attempted=true;
  map.easeTo({zoom:Math.max(map.getZoom(),15.5),pitch:0,duration:500});
  if(field)field.value='';
  paint();return true;
 }catch(err){
  // Do not expose a provider error that might include query credentials.
  lastError='HD_TILE_OR_SOURCE_FAILURE';tileState='ERROR';mode='ERROR';
  if(map.getLayer(LAYER))map.removeLayer(LAYER);
  if(map.getSource(SOURCE))map.removeSource(SOURCE);
  root.MRS10ECRLSatelliteBasemap?.setMode('satellite');
  if(field)field.value='';
  paint();return false;
 }
}
function hide(){
 if(map?.getLayer?.(LAYER))map.removeLayer(LAYER);
 if(map?.getSource?.(SOURCE))map.removeSource(SOURCE);
 mode='LOW_RES_ONLY';tileState='DISABLED';paint();
}
function connect(m){
 map=m;get('lab-basemap-hd')?.addEventListener('click',enable);
 for(const id of ['lab-basemap-satellite','lab-basemap-street'])get(id)?.addEventListener('click',hide);
 m.on('sourcedata',e=>{if(e.sourceId===SOURCE&&e.isSourceLoaded){tileState='SOURCE_LOADED';paint()}});
 m.on('error',e=>{if(e.sourceId===SOURCE){tileState='ERROR';lastError='MAPTILER_TILE_REQUEST_FAILED';paint()}});
 paint();
}
const api=Object.freeze({connect,enable,hide,snapshot:()=>({
 mode,tileState,attempted,loaded:tileState==='SOURCE_LOADED',installed:!!map?.getLayer?.(LAYER),
 requiresOwnAPIKey:true,keyStored:false,provider:'MAPTILER_SATELLITE_V4',sourceDateAtLocation:'UNKNOWN',
 claimedGroundResolutionAtLocation:'UNKNOWN',imageryGeometryNotSurvey:true,rawKeyExposedInSnapshot:false,lastError
})});
root.MRS10ECRLHDImagery=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
