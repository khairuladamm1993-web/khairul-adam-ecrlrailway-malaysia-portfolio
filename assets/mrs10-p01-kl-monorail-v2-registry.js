/* MR-S10 P01 KL Monorail V2 — service stops are not physical railway tracks.
 * Standalone and deliberately not imported into shared registry/map.
 * Operator colour family: LIGHT GREEN; these CSS hexes are accessible UI tokens, not certified operator values.
 * Physical geometry is NULL until source relation, topology and rights evidence are reviewed.
 */
(function(root){
'use strict';
const refs=Object.freeze({
  mot:'https://www.mot.gov.my/en/land/infrastructure/current-rail-services',
  gtfs:'https://developer.data.gov.my/realtime-api/gtfs-static.en',
  rapid:'https://myrapid.com.my/',
  network:'https://www.mymrt.com.my/projects/travel-with-mrt/',
  codes:'https://www.mtrec.name.my/network/mrl.html',
  osm:'https://www.openstreetmap.org/copyright'
});
const names=['KL Sentral','Tun Sambanthan','Maharajalela','Hang Tuah','Imbi','Bukit Bintang','Raja Chulan','Bukit Nanas','Medan Tuanku','Chow Kit','Titiwangsa'];
const changes=Object.freeze({
 MR1:['lrt-kelana-jaya','ktm-komuter','erl'],MR4:['lrt-ampang','lrt-sri-petaling'],
 MR6:['mrt-kajang'],MR8:['lrt-kelana-jaya'],MR11:['lrt-ampang','lrt-sri-petaling','mrt-putrajaya']
});
const interchangeType=Object.freeze({MR1:'WALKWAY_TO_KL_SENTRAL_HUB',MR4:'INTERCHANGE',MR6:'INTERCHANGE',
 MR8:'PEDESTRIAN_TO_DANG_WANGI',MR11:'INTERCHANGE'});
const visual=Object.freeze({
 family:'LIGHT_GREEN_OPERATOR_TRANSIT_SCHEMATIC',
 officialHex:'UNVERIFIED',light:'#4C8619',dark:'#B7F070',
 marker:'#76B936',haloLight:'#FFFFFF',haloDark:'#152534',
 geographicAlignmentAllowed:false
});
const stations=Object.freeze(names.map((name,i)=>{
 const code='MR'+(i+1);
 return Object.freeze({
  id:'mrs10-kl-monorail-'+code.toLowerCase(),code,name,order:i+1,
  serviceId:'kl-monorail',interchangeServices:Object.freeze(changes[code]||[]),
  interchangeType:interchangeType[code]||null,
  aliases:Object.freeze(i===2?['Maharajelela']:[]),
  languageNameStatus:'LATIN_SOURCE_NAME_FALLBACK',
  geometry:null,physicalTrackIds:Object.freeze([]),platformIds:Object.freeze([]),
  routeRelationIds:Object.freeze([]),positionStatus:'REQUIRES_OSM_OR_GTFS_POI_CROSSWALK',
  sources:Object.freeze([refs.mot,refs.codes,refs.gtfs])
 });
}));
const route=Object.freeze({id:'kl-monorail',name:'KL Monorail',lineNumber:8,stations:Object.freeze(stations.map(s=>s.id)),
 adjacencies:Object.freeze(stations.slice(1).map((s,i)=>Object.freeze({from:stations[i].id,to:s.id,
  kind:'PASSENGER_SERVICE_ADJACENCY_ONLY',physicalGeometry:null,wayId:null}))),
 geometry:null,guideway:null,track:null,serviceType:'MONORAIL_PASSENGER_SERVICE',
 geographicAlignmentStatus:'UNVERIFIED',visual});
const bbox=Object.freeze({s:3.10,w:101.65,n:3.22,e:101.75});
const normal=v=>typeof v==='string'?v.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en'):'';
function findStation(name){
 const n=normal(name);
 return stations.find(s=>normal(s.name)===n||s.aliases.some(a=>normal(a)===n))||null;
}
function sourceBacked(features){
 if(!Array.isArray(features))return Object.freeze({ok:false,reason:'INVALID_SOURCE',stations:[],matched:0});
 const found=new Map(),ambiguous=new Set(),rejected=[];
 for(const feature of features){
  const tags=feature?.tags??{};
  const raw=String(tags.name||'');
  const s=findStation(raw);
  if(!s)continue;
  const lat=feature?.lat??feature?.center?.lat,lon=feature?.lon??feature?.center?.lon;
  const mono=tags.monorail==='yes'||tags.railway==='monorail'||
   /(^|[;,\s])MR0?\d{1,2}(?=$|[;,\s])/i.test(String(tags.ref||tags['ref:rapidkl']||''));
  const ref=String(tags.ref||tags['ref:rapidkl']||'');
  const numbered=ref.match(/(?:^|[;,\s])MR0?(\d{1,2})(?=$|[;,\s])/i);
  if(!['node','way','relation'].includes(feature.type)||!Number.isSafeInteger(feature.id)||
   !Number.isFinite(lat)||!Number.isFinite(lon)||lat<bbox.s||lat>bbox.n||lon<bbox.w||lon>bbox.e||
   !mono||(numbered&&Number(numbered[1])!==s.order)||
   !(['station','halt','monorail'].includes(tags.railway)||tags.public_transport==='station')){
   rejected.push({code:s.code,sourceId:feature.id});continue;
  }
  const rec=Object.freeze({id:s.id,name:s.name,code:s.code,order:s.order,
   coordinates:Object.freeze([lon,lat]),osmType:feature.type,osmId:feature.id,
   osmUrl:'https://www.openstreetmap.org/'+feature.type+'/'+feature.id,
   status:'SOURCE_BACKED_PUBLIC_POI_NOT_SURVEY',interchangeServices:s.interchangeServices});
  if(found.has(s.id)){found.set(s.id,null);ambiguous.add(s.id);rejected.push({code:s.code,sourceId:feature.id,reason:'AMBIGUOUS'});}
  else if(!ambiguous.has(s.id))found.set(s.id,rec);
 }
 const matches=Object.freeze(stations.map(s=>found.get(s.id)).filter(Boolean));
 const positions=new Set(matches.map(p=>p.coordinates.join(':')));
 if(positions.size!==matches.length)return Object.freeze({ok:false,reason:'COORDINATE_COLLISION',stations:[],matched:0});
 return Object.freeze({ok:true,reason:matches.length?'SOURCE_PARTIAL_OR_COMPLETE':'SOURCE_UNMATCHED',
  stations:matches,matched:matches.length,missing:11-matches.length,rejected:rejected.length});
}
function geoJSON(result){return {type:'FeatureCollection',features:(result?.ok?result.stations:[]).map(s=>({
 type:'Feature',id:s.id,properties:{code:s.code,name:s.name,order:s.order,
  stationId:s.id,sourceUrl:s.osmUrl,important:[1,4,6,8,11].includes(s.order)?1:0},
 geometry:{type:'Point',coordinates:[...s.coordinates]}
}))};}
function validate(){return stations.length===11&&stations.every((s,i)=>s.code==='MR'+(i+1)&&s.order===i+1&&
 s.geometry===null&&s.physicalTrackIds.length===0)&&route.geometry===null&&route.guideway===null&&
 route.adjacencies.length===10&&!visual.geographicAlignmentAllowed;}
const api=Object.freeze({refs,stations,route,visual,bbox,validate,findStation,sourceBacked,geoJSON});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10MonorailV2=api;
})(typeof window!=='undefined'?window:null);
