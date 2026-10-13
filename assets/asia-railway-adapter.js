/* MR-S10 Asia Railway adapter: opt-in, read-only, no automatic loading or writes.
 * No network, Supabase, geolocation, owner state, or canonical Corridor mutation.
 * The host must explicitly call mount() with a separate Leaflet map and verified GeoJSON.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MRS10AsiaRailway=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const MAX_FEATURES=900;
  function isCoordinatePair(p){return Array.isArray(p)&&p.length>=2&&
    Number.isFinite(p[0])&&Number.isFinite(p[1])&&
    p[0]>=-180&&p[0]<=180&&p[1]>=-90&&p[1]<=90;}
  function validGeometry(g){
    if(!g||typeof g!=='object')return false;
    if(g.type==='LineString')return Array.isArray(g.coordinates)&&g.coordinates.length>=2&&g.coordinates.every(isCoordinatePair);
    if(g.type==='Point')return isCoordinatePair(g.coordinates);
    return false;
  }
  function approved(features){
    if(!Array.isArray(features))return [];
    const seen=new Set(),out=[];
    for(const f of features){
      if(out.length>=MAX_FEATURES)break;
      if(!f||f.type!=='Feature'||!validGeometry(f.geometry))continue;
      const p=f.properties||{},source=String(p.source||''),id=String(p.sourceId||'');
      if(!source||!id||!/^https:\/\//.test(String(p.sourceUrl||'')))continue;
      const key=source+':'+id;if(seen.has(key))continue;seen.add(key);
      // Copy only public metadata. Never accept a canonical Corridor asset payload.
      out.push({type:'Feature',geometry:JSON.parse(JSON.stringify(f.geometry)),
        properties:{name:String(p.name||'Unlabelled railway feature'),
          type:String(p.type||'Unspecified railway'),source,sourceId:id,
          sourceUrl:String(p.sourceUrl),status:String(p.status||'Not independently verified')}});
    }
    return out;
  }
  function mount({leaflet,map,features}={}){
    if(!leaflet?.geoJSON||!map?.addLayer||!map?.removeLayer)
      throw Error('A separate Leaflet map instance is required');
    const data={type:'FeatureCollection',features:approved(features)};
    const layer=leaflet.geoJSON(data,{style:()=>({color:'#116b83',weight:4,opacity:1})});
    layer.addTo(map);
    return Object.freeze({featureCount:data.features.length,unmount:()=>map.removeLayer(layer)});
  }
  return Object.freeze({approved,mount,MAX_FEATURES});
});
