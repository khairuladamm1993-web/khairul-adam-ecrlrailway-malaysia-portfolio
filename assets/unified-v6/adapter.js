/* MR-S10 P01 V6: source-isolated adapters. No invented station coordinates or track geometries. */
(function(root){
'use strict';
const ids=Object.freeze({sri:'lrt-sri-petaling',mono:'kl-monorail',express:'erl-klia-ekspres',transit:'erl-klia-transit'});
const external=(deps)=>({
 sri:deps?.sri||root?.MRS10SriPetalingV2,
 sriGIS:deps?.sriGIS||root?.MRS10SriPetalingGISV2,
 mono:deps?.mono||root?.MRS10MonorailV2,
 erl:deps?.erl||root?.MRS10ERLV2,
 erlGIS:deps?.erlGIS||root?.MRS10ERLV2GIS
});
function routes(deps){
 const {sri,sriGIS,mono,erl,erlGIS}=external(deps);
 if(!sri?.validate?.()||!sriGIS?.decode||!mono?.validate?.()||!erl?.validate?.()||!erlGIS?.decode)
  throw Error('V6_ISOLATED_MODULE_INVALID');
 if(!sri.sharedFixture({validate:()=>true,stations:sri.stations.slice(0,11).map(s=>({name:s.name,serviceCode:s.pairedAmpangCode}))}).ok)
  throw Error('V6_SRI_SHARED_SERVICE_INVALID');
 const sr={id:ids.sri,category:'LRT',label:'LRT Sri Petaling',color:sri.color.light,
  expected:29,decoder:'SRI',source:sriGIS.queryUrl,
  stops:sri.stations.map(s=>({id:s.id,name:s.name,code:s.serviceCode,order:s.order})),alignment:null};
 const mn={id:ids.mono,category:'Monorail',label:'KL Monorail',color:mono.visual.marker,
  expected:11,decoder:'OSM',source:'https://overpass.kumi.systems/api/interpreter',
  stops:mono.stations.map(s=>({id:s.id,name:s.name,code:s.code,order:s.order})),alignment:null};
 const e=Object.values(erl.services).map(s=>({
  id:s.id,category:'ERL',label:s.name,
  color:s.id===ids.express?erl.colour.express.light:erl.colour.transit.light,
  expected:s.stationSequence.length,decoder:'ERL',source:erlGIS.requestUrl,
  stops:s.stationSequence.map((id,i)=>{
   const x=erl.stationById(id);return {id:x.id,name:x.name,code:'',order:i+1};
  }),alignment:null
 }));
 const ret=[sr,mn,...e];
 if(ret.length!==4||ret.reduce((n,r)=>n+r.expected,0)!==49||new Set(ret.map(x=>x.id)).size!==4)
  throw Error('V6_ROUTE_REGISTRY_WRONG');
 return ret.map(r=>Object.freeze({...r,stops:Object.freeze(r.stops)}));
}
const cache=new Map();
function checkedFetch(url,opts){
 const promise=fetch(url,{mode:'cors',credentials:'omit',cache:'no-store',...opts}).then(r=>{
  if(!r.ok)throw Error('GIS_HTTP_'+r.status);return r.json();
 });
 return promise;
}
function osmQuery(mono){
 const b=mono.bbox;
 const names=mono.stations.map(x=>x.name.replace(/[.*+?^$()|[\]{}]/g,'\\$&')).join('|');
 return '[out:json][timeout:20];(nwr["name"~"^('+names+')$",i]["railway"~"^(station|halt|monorail)$"]('+b.s+','+b.w+','+b.n+','+b.e+');nwr["name"~"^('+names+')$",i]["public_transport"="station"]('+b.s+','+b.w+','+b.n+','+b.e+'););out center tags;';
}
async function fetchRoute(route,deps){
 const {sri,sriGIS,mono,erl,erlGIS}=external(deps);
 let points=[],ok=false,reason='',matched=0;
 if(route.decoder==='OSM'){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),23000);
  try{
   const json=await checkedFetch(route.source,{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'data='+encodeURIComponent(osmQuery(mono)),signal:controller.signal});
   const found=mono.sourceBacked(json?.elements);
   ok=found.ok;reason=found.reason;matched=found.matched;
   points=found.stations.map(p=>({id:p.id,name:p.name,code:p.code,routeId:route.id,
    coordinates:[...p.coordinates],sourceId:p.osmId,provenance:'OSM_MONORAIL_POI_NOT_TRACK'}));
  }finally{clearTimeout(timeout)}
 }else if(route.decoder==='SRI'){
  const raw=await checkedFetch(route.source);
  const found=sriGIS.decode(raw?.features,sri);
  ok=found.ok;reason=found.reason;matched=found.matched;
  points=found.data.map(p=>({id:p.stationId,name:p.name,code:p.serviceCode,routeId:route.id,
   coordinates:[...p.coordinates],sourceId:p.sourceId,provenance:p.provenance}));
 }else if(route.decoder==='ERL'){
  if(!cache.has(route.source))cache.set(route.source,checkedFetch(route.source).catch(e=>{cache.delete(route.source);throw e}));
  const raw=await cache.get(route.source);
  const found=erlGIS.decode(raw?.features,erl);
  ok=found.ok;reason=found.reason;
  const byId=new Map(found.points.map(p=>[p.stationId,p]));
  points=route.stops.map(s=>{
   const p=byId.get(s.id);
   return p?{id:s.id,name:s.name,code:'',routeId:route.id,coordinates:[...p.coordinates],
    sourceId:p.sourceId,provenance:'ARCGIS_ERL_REFERENCE_NOT_TRACK'}:null;
  }).filter(Boolean);
  matched=points.length;
 }else throw Error('V6_UNKNOWN_GIS_DECODER');
 if(!ok) return {ok:false,reason,matched:0,expected:route.expected,points:[]};
 return {ok:true,reason,matched,expected:route.expected,points};
}
const edges=[
 [['lrt-sri-petaling','Titiwangsa'],['kl-monorail','Titiwangsa'],'INTERCHANGE'],
 [['lrt-sri-petaling','Masjid Jamek'],['lrt-kelana-jaya','Masjid Jamek'],'INTERCHANGE'],
 [['lrt-sri-petaling','Plaza Rakyat'],['mrt-kajang','Merdeka'],'PEDESTRIAN_CONNECTION'],
 [['lrt-sri-petaling','Hang Tuah'],['kl-monorail','Hang Tuah'],'INTERCHANGE'],
 [['lrt-sri-petaling','Chan Sow Lin'],['mrt-putrajaya','Chan Sow Lin'],'INTERCHANGE'],
 [['lrt-sri-petaling','Bandar Tasik Selatan'],['erl-klia-transit','Bandar Tasik Selatan'],'INTERCHANGE'],
 [['lrt-sri-petaling','Putra Heights'],['lrt-kelana-jaya','Putra Heights'],'INTERCHANGE'],
 [['kl-monorail','KL Sentral'],['erl-klia-transit','KL Sentral'],'CONNECTED_STATION_COMPLEX'],
 [['kl-monorail','KL Sentral'],['erl-klia-ekspres','KL Sentral'],'CONNECTED_STATION_COMPLEX'],
 [['kl-monorail','Bukit Bintang'],['mrt-kajang','Bukit Bintang'],'PEDESTRIAN_CONNECTION'],
 [['kl-monorail','Bukit Nanas'],['lrt-kelana-jaya','Dang Wangi'],'PEDESTRIAN_CONNECTION'],
 [['kl-monorail','Titiwangsa'],['mrt-putrajaya','Titiwangsa'],'INTERCHANGE'],
 [['erl-klia-transit','Putrajaya & Cyberjaya'],['mrt-putrajaya','Putrajaya Sentral'],'CONNECTED_STATION_COMPLEX'],
 [['erl-klia-transit','KL Sentral'],['lrt-kelana-jaya','KL Sentral'],'CONNECTED_STATION_COMPLEX']
];
function transfersFor(point,manifest,legacy,normalise){
 const norm=normalise||((v)=>String(v||'').toLowerCase().trim());
 const pairs=[];
 const add=(routeId,stationName,relation)=>{
  const route=manifest.find(r=>r.id===routeId);
  const stop=route?.stops?.find(s=>norm(s.name)===norm(stationName));
  if(route&&stop&&!pairs.some(p=>p.route.id===route.id&&p.stop.id===stop.id))
   pairs.push({route,stop,relation});
 };
 for(const r of legacy||[]){
  if(r.routes.includes(point.routeId)&&norm(r.station)===norm(point.name))
   for(const id of r.routes)add(id,r.station,r.relation);
 }
 const sri=external().sri;
 if(sri?.validate?.()){
  for(const s of sri.stations.filter(s=>s.sharedService)){
   if((point.routeId==='lrt-ampang'||point.routeId===ids.sri)&&norm(point.name)===norm(s.name)){
    add('lrt-ampang',s.name,'SHARED_SERVICE_SECTION');
    add(ids.sri,s.name,'SHARED_SERVICE_SECTION');
   }
  }
 }
 for(const [a,b,relation] of edges){
  if(point.routeId===a[0]&&norm(point.name)===norm(a[1])){add(a[0],a[1],relation);add(b[0],b[1],relation);}
  else if(point.routeId===b[0]&&norm(point.name)===norm(b[1])){add(a[0],a[1],relation);add(b[0],b[1],relation);}
 }
 if(point.routeId===ids.express||point.routeId===ids.transit){
  add(ids.express,point.name,'SHARED_PASSENGER_STOP');
  add(ids.transit,point.name,'SHARED_PASSENGER_STOP');
 }
 return pairs;
}
const api=Object.freeze({ids,routes,fetchRoute,osmQuery,transfersFor,edges});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10UnifiedV6Adapter=api;
})(typeof window!=='undefined'?window:null);
