/* MR-S10 R1.4: satellite-look basemap with separately licensed 2016 imagery.
   EOxCloudless 2016 CC BY 4.0; never Google Earth or Apple Maps imagery.
   Imagery is VISUAL ONLY, not a georeferenced railway survey. */
(function(root){'use strict';
const SAT='mrs10-eox-satellite-2016',LAYER=SAT+'-raster',
 URL='https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg',
 CREDIT='EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017) · CC BY 4.0';
let map=null,mode='satellite',status='NOT_INITIALIZED',lastError=null;
function install(m){
 map=m;if(!m.getStyle?.()){status='WAITING_STYLE';return false}
 try{
  if(!m.getSource(SAT))m.addSource(SAT,{type:'raster',tiles:[URL],tileSize:256,minzoom:0,maxzoom:14,attribution:CREDIT});
  if(!m.getLayer(LAYER)){
    // The reference railway raster must always remain ABOVE the satellite imagery.
    const before=m.getLayer('mrs10-lab-openrailwaymap-standard-raster-layer')?'mrs10-lab-openrailwaymap-standard-raster-layer':undefined;
    m.addLayer({id:LAYER,type:'raster',source:SAT,layout:{visibility:mode==='satellite'?'visible':'none'},paint:{'raster-opacity':1,'raster-fade-duration':0}},before);
  }else m.setLayoutProperty(LAYER,'visibility',mode==='satellite'?'visible':'none');
  status='LAYER_REGISTERED_NOT_TILE_VERIFIED';update();return true;
 }catch(e){lastError=String(e?.message||e).slice(0,180);status='LAYER_ERROR';update();return false}
}
function setMode(next){if(next!=='street'&&next!=='satellite')throw Error('UNKNOWN_BASEMAP_MODE');mode=next;if(map?.getStyle()){if(!map.getLayer(LAYER))install(map);else map.setLayoutProperty(LAYER,'visibility',mode==='satellite'?'visible':'none')}update()}
function update(){for(const id of ['lab-basemap-satellite','lab-basemap-street']){const b=document.getElementById(id);if(b)b.setAttribute('aria-pressed',String(id.endsWith(mode)))}const p=document.getElementById('lab-basemap-status');if(p){p.textContent=mode==='satellite'?'Satelit Sentinel-2 2016 · berlesen CC BY 4.0 · bukan Google Earth / Apple Maps':'Peta jalan OpenFreeMap';p.dataset.status=status;if(lastError)p.title=lastError}}
function connect(m){map=m;for(const [id,name] of [['lab-basemap-satellite','satellite'],['lab-basemap-street','street']]){const b=document.getElementById(id);if(b)b.addEventListener('click',()=>setMode(name))}
 const retry=()=>{if(!m.getLayer(LAYER))install(m)};
 m.on('style.load',retry);m.on('load',retry);m.on('styledata',retry);
 m.on('sourcedata',e=>{if(e?.sourceId===SAT&&e.isSourceLoaded){status='SOURCE_LOADED_VISUAL_REVIEW';update()}});
 m.on('error',e=>{if(e?.sourceId===SAT||String(e?.error?.message||'').includes('eox.at')){status='TILE_ERROR';lastError=String(e?.error?.message||'').slice(0,180);update()}});
 retry();update();}
const api=Object.freeze({connect,setMode,install,snapshot:()=>({mode,status,installed:!!map?.getLayer?.(LAYER),tileURL:URL,license:'CC BY 4.0',imageryVintage:2016,geometricEvidence:false})});
root.MRS10ECRLSatelliteBasemap=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
