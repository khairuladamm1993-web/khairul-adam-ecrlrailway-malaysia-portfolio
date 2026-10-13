/* Public OpenStreetMap station discovery for the visible Malaysia viewport.
 * No guessed stations, operators, railway alignments or ECRL canonical writes.
 * On-demand only, bounded results, abortable and fail-closed.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MRS10MalaysiaOSM=Object.freeze(api)})(typeof window!=='undefined'?window:null,function(){
'use strict';
const endpoint='https://overpass-api.de/api/interpreter';
const network=(tags={})=>{
 const v=[tags.operator,tags.network,tags.line,tags.brand,tags['operator:en']].filter(Boolean).join(' ').toLowerCase();
 if(/rapid transit system|rts link/.test(v))return 'RTS';
 if(/express rail link|klia ekspres|klia transit/.test(v))return 'ERL';
 if(/monorail/.test(v))return 'Monorail';
 if(/mrt|mass rapid transit/.test(v))return 'MRT';
 if(/lrt|light rail/.test(v))return 'LRT';
 if(/ktmb|keretapi tanah melayu|ktm komuter|ets|electric train service/.test(v))return 'KTMB';
 if(/ecrl|east coast rail link/.test(v))return 'ECRL';
 return String(tags.network||'Railway').slice(0,80);
};
const boundsValid=b=>Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[0]>=0.8&&b[2]<=7.7&&b[1]>=99&&b[3]<=105.5&&b[0]<b[2]&&b[1]<b[3]&&(b[2]-b[0])*(b[3]-b[1])<=2.5;
function query(b){
 if(!boundsValid(b))throw Error('Viewport outside supported Malaysia survey scope');
 const box=b.map(x=>Number(x).toFixed(5)).join(',');
 return '[out:json][timeout:18];(node["railway"~"^(station|halt)$"]('+box+');way["railway"~"^(station|halt)$"]('+box+');node["public_transport"="station"]["train"="yes"]('+box+'););out center 350;';
}
function feature(e){
 if(!e||!['node','way'].includes(e.type)||!Number.isSafeInteger(e.id))return null;
 const t=e.tags||{},name=String(t.name||t['name:en']||'').trim();
 const lat=e.type==='node'?e.lat:e.center?.lat,lon=e.type==='node'?e.lon:e.center?.lon;
 if(!name||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<0.8||lat>7.7||lon<99||lon>105.5)return null;
 const id=e.type+'/'+e.id;
 return {type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},properties:{
  name:name.slice(0,110),network:network(t),operator:String(t.operator||'Operator not recorded').slice(0,100),
  source:'OpenStreetMap public railway data',sourceId:id,sourceUrl:'https://www.openstreetmap.org/'+id,
  status:'Community-mapped station position · verify with official operator'
 }};
}
function parse(data){
 if(!data||!Array.isArray(data.elements))return [];
 const ids=new Set(),out=[];
 for(const e of data.elements){
  if(out.length>=350)break;
  const f=feature(e);if(!f||ids.has(f.properties.sourceId))continue;
  ids.add(f.properties.sourceId);out.push(f);
 }return out;
}
async function load(b,{fetchImpl=typeof fetch==='function'?fetch:null,signal}={}){
 if(!fetchImpl)throw Error('Fetch unavailable');
 const q=query(b);
 const controller=new URLSearchParams({data:q});
 const res=await fetchImpl(endpoint,{method:'POST',body:controller,signal,headers:{'Content-Type':'application/x-www-form-urlencoded'}});
 if(!res.ok)throw Error('Rail station reference source unavailable');
 return parse(await res.json());
}
return Object.freeze({load,parse,query,boundsValid,feature,network});
});
