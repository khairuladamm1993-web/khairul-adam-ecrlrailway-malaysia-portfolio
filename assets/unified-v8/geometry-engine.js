/* Physical way topology is independent of service station adjacency. */
(function(root){
'use strict';
const classes=['OFFICIAL_VERIFIED','OSM_TOPOLOGY_MATCHED','SECONDARY_APPROXIMATE','UNRESOLVED'];
function fromOSM(raw,sourceDate){
 const nodes=new Map(raw.elements.filter(e=>e.type==='node').map(n=>[n.id,n]));
 const ways=[...new Map(raw.elements.filter(e=>e.type==='way'&&e.tags?.railway).map(w=>[w.id,w])).values()];
 const usage=new Map();for(const w of ways)for(const id of new Set(w.nodes))usage.set(id,(usage.get(id)||0)+1);
 const segments=[];for(const w of ways){
  if(w.nodes.some(id=>!nodes.has(id)))continue;
  let start=0;
  for(let i=1;i<w.nodes.length;i++)if(i===w.nodes.length-1||usage.get(w.nodes[i])>1){
   const ids=w.nodes.slice(start,i+1),t=w.tags;
   segments.push({segmentId:`osm-way-${w.id}-${start}-${i}`,fromNode:'osm-node-'+ids[0],toNode:'osm-node-'+ids.at(-1),routeIds:w.tags.ref==='RTS'?['sg-RTS']:[],nodeIds:ids.map(x=>'osm-node-'+x),geometry:{type:'LineString',coordinates:ids.map(id=>[nodes.get(id).lon,nodes.get(id).lat])},sourceUrl:'https://www.openstreetmap.org/way/'+w.id,sourceDate,railwayType:t.railway,trackCount:t.tracks||null,gauge:t.gauge||null,electrification:t.electrified||null,bridge:t.bridge||null,tunnel:t.tunnel||null,operationalStatus:t.railway==='construction'?'UNDER_CONSTRUCTION':'UNVERIFIED',confidence:'OSM_TOPOLOGY_MATCHED',topologyValidation:'SHARED_OSM_NODE_IDS_ONLY',geometryVerification:'OSM_TOPOLOGY_MATCHED'});start=i;
  }
 }
 return {nodes:[...nodes.values()].map(n=>({id:'osm-node-'+n.id,coordinates:[n.lon,n.lat]})),segments};
}
function validate(network){
 const ids=new Set(),nodes=new Map(network.nodes.map(n=>[n.id,n]));
 for(const s of network.segments){
  if(ids.has(s.segmentId))throw Error('DUPLICATE_SEGMENT');ids.add(s.segmentId);
  if(!classes.includes(s.geometryVerification))throw Error('UNKNOWN_EVIDENCE_CLASS');
  if(!s.sourceUrl)throw Error('MISSING_SOURCE');
  if(['OFFICIAL_VERIFIED','OSM_TOPOLOGY_MATCHED'].includes(s.geometryVerification)){
   if(!nodes.has(s.fromNode)||!nodes.has(s.toNode))throw Error('DANGLING_NODE');
   if(!s.geometry||!s.nodeIds?.length)throw Error('MISSING_TOPOLOGY');
   const c=s.geometry.coordinates;
   if(JSON.stringify(c[0])!==JSON.stringify(nodes.get(s.fromNode).coordinates)||JSON.stringify(c.at(-1))!==JSON.stringify(nodes.get(s.toNode).coordinates))throw Error('ENDPOINT_MISMATCH');
  }
 }
 return true;
}
function features(network,routeColors,includeApproximate=false){validate(network);return {type:'FeatureCollection',features:network.segments.filter(s=>s.geometry&&(includeApproximate||s.geometryVerification!=='SECONDARY_APPROXIMATE')).map(s=>({type:'Feature',id:s.segmentId,geometry:s.geometry,properties:{...s,geometry:undefined,color:routeColors[s.routeIds[0]]||'#64748b'}}))}}
const api={classes,fromOSM,validate,features};if(typeof module==='object')module.exports=api;if(root)root.MRS10V8Geometry=api;
})(typeof window!=='undefined'?window:null);
