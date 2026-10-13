/* V0.4.2 opt-in popup overlay. No remote fetches and no invented locations.
   GeoJSON supplied by caller must have a source URL + unique source ID. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MRS10AsiaInfoOverlay=Object.freeze(api)})(typeof window!=='undefined'?window:null,function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pair=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
function accepts(f){
 const g=f?.geometry,p=f?.properties;
 if(f?.type!=='Feature'||!g||!p||!/^https:\/\//.test(p.sourceUrl||'')||!p.sourceId||!p.name)return false;
 try{if(new URL(p.sourceUrl).protocol!=='https:')return false}catch{return false}
 if(g.type==='Point')return pair(g.coordinates);
 return g.type==='LineString'&&Array.isArray(g.coordinates)&&g.coordinates.length>=2&&g.coordinates.every(pair);
}
function renderPopup(f){
 if(!accepts(f))return '';
 const p=f.properties,type=f.geometry.type==='Point'?'Station':'Track alignment';
 const u=new URL(p.sourceUrl);if(u.protocol!=='https:')return '';
 return '<strong>'+esc(p.name)+'</strong><br>'+esc(type)+
 '<br>'+esc(p.network||'Railway')+(p.operator?'<br>'+esc(p.operator):'')+
 '<br><small>Source: '+esc(p.source||u.hostname)+' · '+esc(p.status||'Public reference')+'</small>'+
 '<br><a href="'+esc(u.href)+'" target="_blank" rel="noopener noreferrer">View source</a>';
}
function mount(leaflet,map,features=[]){
 if(!leaflet?.geoJSON||!map?.removeLayer)throw Error('A dedicated Leaflet map is required');
 const seen=new Set(),safe=[];
 for(const f of Array.isArray(features)?features:[]){
  if(safe.length>=900)break;if(!accepts(f))continue;
  const k=f.properties.sourceUrl+'#'+f.properties.sourceId;if(seen.has(k))continue;seen.add(k);
  safe.push({type:'Feature',geometry:JSON.parse(JSON.stringify(f.geometry)),properties:{name:f.properties.name,network:f.properties.network,operator:f.properties.operator,source:f.properties.source,sourceUrl:f.properties.sourceUrl,sourceId:f.properties.sourceId,status:f.properties.status}});
 }
 const layer=leaflet.geoJSON({type:'FeatureCollection',features:safe},{
  pointToLayer:(f,latlng)=>leaflet.circleMarker(latlng,{radius:4,weight:1,fillOpacity:.9}),
  style:f=>f.geometry.type==='LineString'?{weight:3,opacity:.85}:{},
  onEachFeature:(f,leaf)=>{
   leaf.bindPopup(renderPopup(f),{maxWidth:230});
   if(f.geometry.type==='LineString'&&leaflet.polyline){
    // Invisible hit-target provides finger-friendly tapping without a thick visible railway.
    const hit=leaflet.polyline(leaf.getLatLngs(),{weight:18,opacity:0,interactive:true});
    hit.bindPopup(renderPopup(f),{maxWidth:230});
    leaf.on('add',()=>hit.addTo(map));leaf.on('remove',()=>hit.remove());
   }
  }
 });
 layer.addTo(map);
 return Object.freeze({featureCount:safe.length,unmount:()=>map.removeLayer(layer)});
}
return Object.freeze({accepts,renderPopup,mount});
});
