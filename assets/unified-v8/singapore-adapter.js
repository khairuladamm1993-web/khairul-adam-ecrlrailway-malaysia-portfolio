/* Additive adapter. The source Singapore registry is immutable. */
(function(root){
'use strict';
function create(lines,stations,topology,border,relations){
 const features=[...stations.features,...border.features];
 const stationById=new Map(features.map(f=>[f.properties.stationId,f]));
 for(const s of topology.unlocatedStations||[])if(!stationById.has(s.stationId))stationById.set(s.stationId,{properties:s,geometry:null});
 const routes=lines.routes.map(line=>{
  const t=topology.routes.find(x=>x.routeId===line.lineId);
  if(!t)throw Error('SG_TOPOLOGY_MISSING:'+line.lineId);
  const ids=[...new Set(t.paths.flatMap(p=>p.orderedStationIds))];
  // Also retain source station-code records absent from current service patterns.
  for(const f of features)if(f.properties.routeIds?.includes(line.lineId)&&!ids.includes(f.properties.stationId))ids.push(f.properties.stationId);
  const stops=ids.map((id,i)=>{const p=stationById.get(id)?.properties;if(!p)throw Error('SG_UNKNOWN_NODE:'+id);return {id,name:p.stationName||p.name||id,code:p.stationCode||'',order:i+1,status:p.status}});
  return {id:'sg-'+line.lineId,sgId:line.lineId,label:line.name,category:'Singapore',serviceCategory:line.category,color:line.displayColor,source:line.sourceUrl,decoder:'SG',expected:ids.filter(id=>stationById.get(id)?.geometry).length,stops,paths:t.paths,topologyStatus:t.lineupCompleteness,operationalStatus:line.operationalStatus};
 });
 function fetchRoute(r){const points=r.stops.flatMap(s=>{const f=stationById.get(s.id);if(!f?.geometry)return [];const p=f.properties;return [{...s,routeId:r.id,coordinates:f.geometry.coordinates,sourceUrl:p.sourceUrl,provenance:p.confidence,status:p.status}]});return {ok:true,matched:points.length,expected:r.expected,points}}
 return {routes:()=>routes,fetchRoute,stationById,topology,relations:relations.relations,sourceRecordCount:stations.features.length,borderRecordCount:border.features.length};
}
async function load(){const files=['lines.json','stations.geojson','route-topology.json','cross-border-terminals.geojson','cross-border-connections.json'];const data=await Promise.all(files.map(async f=>{const r=await fetch('./singapore/data/'+f);if(!r.ok)throw Error('SG_HTTP_'+r.status);return r.json()}));return create(...data)}
const api={create,load};if(typeof module==='object')module.exports=api;if(root)root.MRS10V8Singapore=api;
})(typeof window!=='undefined'?window:null);
