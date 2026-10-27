'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const context={window:{},console};vm.createContext(context);
const html=fs.readFileSync('unified-map-v8.html','utf8');
for(const [,p]of html.matchAll(/<script src="\.\/([^" ]+)"/g))vm.runInContext(fs.readFileSync(p,'utf8'),context,{filename:p});
const w=context.window,read=p=>JSON.parse(fs.readFileSync(p));
const sg=w.MRS10V8Singapore.create(...['lines.json','stations.geojson','route-topology.json','cross-border-terminals.geojson','cross-border-connections.json'].map(f=>read('singapore/data/'+f)));
const routes=[...w.MRS10UnifiedV4Registry.loadManifest(w.MRS10KLRegistry,w.MRS10AmpangR219),...w.MRS10UnifiedV6Adapter.routes(),...w.MRS10UnifiedV7KTM.routes(),...sg.routes()];
const stationAssociations=[],paths=[],edges=[];
for(const r of routes){
 for(const s of r.stops)stationAssociations.push({id:r.id+':'+s.id,stationId:s.id,routeId:r.id,name:s.name,code:s.code,sourceUrl:r.source,physicalNode:null});
 const patterns=r.paths||[{pathId:r.id+'-baseline',orderedStationIds:r.stops.map(s=>s.id),operatingStatus:'BASELINE_REGISTRY',sourceUrl:r.source}];
 for(const p of patterns){paths.push({...p,routeId:r.id});for(let i=1;i<p.orderedStationIds.length;i++)edges.push({id:p.pathId+':'+i,routeId:r.id,pathId:p.pathId,fromNode:r.id+':'+p.orderedStationIds[i-1],toNode:r.id+':'+p.orderedStationIds[i],physicalSegmentIds:[],geometryVerification:'UNRESOLVED',relationship:'SERVICE_ADJACENCY_ONLY',sourceUrl:p.sourceUrl||r.source});}
}
const physical=read('data/unified-v8/physical-network.json');
const sourcePaths=['singapore/integration-manifest.json','singapore/data/route-topology.json','singapore/data/stations.geojson','singapore/data/cross-border-terminals.geojson','singapore/data/tracks.geojson','data/unified-v8/osm-border-raw.json'];
const evidence={asOf:'2026-10-27',baselineV7:'c64aa0b19b68aeafbaeb03e568e5cd07e7e4790f',singaporeSource:'81c8ef8af2b1d2354ad1ffd56c3e54f0ee7ca697',files:sourcePaths.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),geometrySources:[...new Set(physical.segments.map(s=>s.sourceUrl))],classes:w.MRS10V8Geometry.classes,notes:['OSM retrieved date is not a survey date.','Node adjacency proves OSM graph connectivity, not official engineering verification.','No station-to-physical-track anchor is asserted.','OSM ref RTS is a source attribution, not proof the complete passenger service path is resolved.','Shared physical segments stored once. Route associations can be many-to-one.']};
fs.writeFileSync('data/unified-v8/service-network.json',JSON.stringify({routes:routes.map(({id,label,color,category})=>({id,label,color,category})),paths,edges}));
fs.writeFileSync('data/unified-v8/station-registry.json',JSON.stringify({stationAssociations,physicalStationCount:null,physicalStationCountReason:'Station-code and service-association records must not be counted as unique physical stations.'}));
fs.writeFileSync('data/unified-v8/evidence-registry.json',JSON.stringify(evidence,null,2));
const nodes=new Set(stationAssociations.map(s=>s.id));if(edges.some(e=>!nodes.has(e.fromNode)||!nodes.has(e.toNode)))throw Error('SERVICE_DANGLING_NODE');
console.log(JSON.stringify({routeCount:routes.length,stationAssociations:stationAssociations.length,pathCount:paths.length,serviceEdges:edges.length,physicalSegments:physical.segments.length,stationTrackAnchors:0}));
