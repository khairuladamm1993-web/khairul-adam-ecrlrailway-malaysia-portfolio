/* MR-S10 Signature Map: source-backed port/freight reference layer.
 * A purple reference icon is NOT a surveyed end-of-spurline marker.
 * No physical rail geometry is emitted by this module.
 */
(function(root){'use strict';
const kuantan=typeof module==='object'&&module.exports?require('./port-references.js'):root.MRS10ECRLPortReferences;
const kerteh=typeof module==='object'&&module.exports?require('./kerteh-freight-reference.js'):root.MRS10ECRLKertehFreight;
const portKlang=typeof module==='object'&&module.exports?require('./port-klang-references.js'):root.MRS10PortKlangReferences;
const isPair=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=-180&&p[0]<=180&&p[1]>=-90&&p[1]<=90;
function references(){
 const entries=[...(kuantan?.assets||[]),...(kerteh?.assets||[]),...(portKlang?.assets||[])];
 return Object.freeze(entries.map(a=>Object.freeze({
  id:a.assetId,name:a.officialName,kind:a.assetType,
  markerStyle:'MR_S10_PURPLE_REFERENCE',markerMeaning:'AREA_REFERENCE_NOT_RAIL_ENDPOINT',
  coordinates:isPair(a.referencePoint)?Object.freeze([...a.referencePoint]):null,
  verification:a.verificationStatus||'UNVERIFIED',
  geometryStatus:'NO_VERIFIED_RAIL_ENDPOINT',physicalLineString:null,
  sourceIds:Object.freeze([...(a.sourceIds||(a.sourceId?[a.sourceId]:[]))]),
  sourceRegistry:a.assetId.startsWith('ecrl-yard')||a.assetId.startsWith('ecrl-kerteh')?'kerteh-freight-reference':a.assetId.startsWith('mrs10-port-klang')?'port-klang-references':'port-references'
 })));
}
function install(map){
 if(!map?.getStyle?.())return false;
 const id='mrs10-signature-port-klang',entries=references().filter(r=>r.sourceRegistry==='port-klang-references'&&r.coordinates);
 const data={type:'FeatureCollection',features:entries.map(r=>({type:'Feature',id:r.id,geometry:{type:'Point',coordinates:r.coordinates},properties:{name:r.name,source:'Port Klang Authority Marine Handbook',meaning:r.markerMeaning}}))};
 if(!map.getSource(id))map.addSource(id,{type:'geojson',data});else map.getSource(id).setData(data);
 if(!map.getLayer(id+'-halo'))map.addLayer({id:id+'-halo',type:'circle',source:id,paint:{'circle-radius':12,'circle-color':'#7c3aed','circle-opacity':0.2,'circle-stroke-color':'#7c3aed','circle-stroke-width':2}});
 if(!map.getLayer(id+'-center'))map.addLayer({id:id+'-center',type:'circle',source:id,paint:{'circle-radius':4,'circle-color':'#7c3aed'}});
 if(!map.__mrs10PortKlangClickInstalled){map.on('click',id+'-halo',e=>{const p=e.features?.[0];if(!p)return;const Popup=root.maplibregl?.Popup;if(!Popup)return;const node=document.createElement('div');const h=document.createElement('strong');h.textContent=p.properties.name;const note=document.createElement('p');note.textContent='Rujukan kawasan pelabuhan (Port Klang Authority). Bukan titik hujung rel atau sambungan ECRL yang disahkan.';node.append(h,note);new Popup().setLngLat(p.geometry.coordinates).setDOMContent(node).addTo(map)});map.__mrs10PortKlangClickInstalled=true;}
 return true;
}
const api=Object.freeze({version:'1.1.0',references,install,physicalRailGeometryVerified:false,
  legend:'Purple = port/freight area reference; NOT a surveyed end of spurline'});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10SignaturePortLayer=api;
})(typeof window!=='undefined'?window:null);
