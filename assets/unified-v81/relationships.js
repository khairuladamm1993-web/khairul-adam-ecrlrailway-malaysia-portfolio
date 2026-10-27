/* Direct station relationships only. Never use proximity or transitive closure. */
(function(root){
'use strict';
const supplementary=[
 {a:['mrt-putrajaya','mrt-py08'],b:['ktm-port-klang','ktm-port-klang-09'],type:'PASSENGER_TRANSFER',status:'ACTIVE',sourceUrl:'https://www.mymrt.com.my/projects/putrajaya-line/stations/sri-damansara-timur/'},
 {a:['lrt-kelana-jaya','lrt-kj1'],b:['future-ecrl','STN17'],name:'ECRL ITT Gombak',type:'PLANNED_CONNECTION',status:'PLANNED',sourceUrl:'https://www.mida.gov.my/wp-content/uploads/2024/06/Slides-MRL.pdf'}
];
function resolve(point,manifest,integration,core,sg){
 const members=new Map(),relations=[];
 function add(routeId,stopId,type='SHARED_STATION',sourceUrl=null,status='REGISTRY_SOURCE'){
  const r=manifest.find(x=>x.id===routeId),s=r?.stops.find(x=>x.id===stopId);if(!s)return;
  members.set(routeId+':'+stopId,{route:r,stop:s,type,sourceUrl,status});
 }
 add(point.routeId,point.id);
 // Stable source station identifiers supply direct membership, not a walking link.
 for(const r of manifest)if(r.id!==point.routeId&&r.stops.some(s=>s.id===point.id))add(r.id,point.id);
 for(const m of integration.transfersFor(point,manifest,core.interchangeRegistry,core.normalise)){
  const type=/SHARED/.test(m.relation)?'SHARED_STATION':'PASSENGER_TRANSFER';
  add(m.route.id,m.stop.id,type,m.route.source);relations.push({type,status:'REGISTRY_SOURCE',sourceUrl:m.route.source});
 }
 // Explicit same-station complexes combine their documented direct members;
 // this does not walk onward through another station or interchange.
 const complexEdges=(integration.edges||[]).filter(([a,b])=>core.normalise(a[1])===core.normalise(point.name)&&core.normalise(b[1])===core.normalise(point.name));
 if(complexEdges.some(([a,b])=>a[0]===point.routeId||b[0]===point.routeId)){
  for(const [a,b] of complexEdges)for(const [rid,name] of [a,b]){const r=manifest.find(x=>x.id===rid),stop=r?.stops.find(x=>core.normalise(x.name)===core.normalise(name));if(stop)add(rid,stop.id,'PASSENGER_TRANSFER',r.source)}
 }
 for(const rel of supplementary){
  const key=[point.routeId,point.id].join(':');let other;
  if(rel.a.join(':')===key)other=rel.b;else if(rel.b.join(':')===key)other=rel.a;else continue;
  relations.push(rel);if(rel.status==='ACTIVE')add(...other,rel.type,rel.sourceUrl,rel.status);
 }
 if(point.routeId.startsWith('sg-')){
  for(const rel of sg.topology.interchanges||[]){
   if(rel.stationId!==point.id&&rel.connectingStationId!==point.id)continue;
   if(/AREA|PLANNED/.test(rel.connectionType))continue;
   const opposite=rel.stationId===point.id?rel.connectingStationId:rel.stationId;
   const endpointIds=[rel.stationId,rel.connectingStationId].filter(Boolean);
   const planned=endpointIds.some(id=>{const status=sg.stationById?.get(id)?.properties.status;return status&&status!=='OPERATIONAL'});
   if(planned){relations.push({type:'PLANNED_CONNECTION',status:'PLANNED',sourceUrl:rel.sourceUrl});continue;}
   for(const r of manifest.filter(r=>r.id.startsWith('sg-'))){
    const explicit=(rel.connectingRouteIds||[]).includes(r.sgId);
    const stop=r.stops.find(s=>s.id===opposite)||(explicit?r.stops.find(s=>s.id===point.id||core.normalise(s.name)===core.normalise(point.name)):null);
    if(stop)add(r.id,stop.id,'PASSENGER_TRANSFER',rel.sourceUrl||r.source);
   }
   relations.push({type:'PASSENGER_TRANSFER',status:'REGISTRY_SOURCE',sourceUrl:rel.sourceUrl});
  }
  for(const rel of sg.relations||[])if((rel.from===point.id||rel.to===point.id)&&rel.type.includes('WALKING')){
   const other=rel.from===point.id?rel.to:rel.from;
   // RTS transfer is planned: do not activate TEL/RTS through this relationship.
   relations.push({type:'PLANNED_CONNECTION',status:'PLANNED',name:other,sourceUrl:rel.sourceUrl});
  }
 }
 const list=[...members.values()];return {members:list,routeIds:[...new Set(list.map(m=>m.route.id))],relations,isInterchange:new Set(list.map(m=>m.route.id)).size>1};
}
const api={resolve,supplementary};if(typeof module==='object')module.exports=api;if(root)root.MRS10V81Relationships=api;
})(typeof window!=='undefined'?window:null);
