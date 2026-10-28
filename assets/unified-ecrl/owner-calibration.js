/* Owner calibration overlay. Only server-authorized RailwayAccess session data;
   no public GPS, no private coordinates in assets, no writes or survey promotion. */
(function(root){'use strict';
const NS='mrs10-v8-ecrl-owner-reference',ALLOWED=['Personal Field-Validated Location','Public Reference Location','Pending Validation','Validated Location','Engineering/Survey Validated Location'];
const valid=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180&&!(lat===0&&lon===0);
const empty=()=>({type:'FeatureCollection',features:[]});
function parse(rows){
 const found=new Map();
 for(const r of Array.isArray(rows)?rows:[]){
  const code=String(r?.id||'').toUpperCase(),location=r?.body?.location||{};
  if(r?.kind!=='corridor'||r?.approved!==true||!/^PL0[1-7]$/.test(code)||!ALLOWED.includes(location.locationConfidence))continue;
  const lat=Number(location.latitude),lon=Number(location.longitude);
  if(location.latitude==null||location.longitude==null||!valid(lat,lon))continue;
  const source=String(location.coordinateSource||'').trim();
  if(source.length<8)continue;
  const status=location.locationConfidence==='Engineering/Survey Validated Location'?'SURVEY_CLAIM_REQUIRES_SOURCE_AUDIT':'OWNER_APPROVED_REFERENCE';
  found.set(code,Object.freeze({
   code,assetId:'ecrl-loop-historical-'+code.slice(-2),coordinates:Object.freeze([lon,lat]),
   locationConfidence:location.locationConfidence,provenance:source,status,
   updatedAt:typeof r.updated_at==='string'?r.updated_at:null,
   // Approval is not equivalent to physical alignment validation.
   physicallyVerified:false,kind:'OWNER_REFERENCE_NOT_TRACK',surveyConfirmed:false
  }));
 }
 return Object.freeze([...found.values()].sort((a,b)=>a.code.localeCompare(b.code)));
}
function create({map,getCategory,onSelect}){
 let data=Object.freeze([]),generation=0,bound=false,connected=false;
 const allowed=()=>Boolean(root.RailwayAccess?.canAdmin&&root.RailwayAccess?.status==='authenticated');
 const features=()=>({type:'FeatureCollection',features:data.map(r=>({
  type:'Feature',id:r.assetId,properties:{assetId:r.assetId,code:r.code,confidence:r.locationConfidence,
  geometryVerification:r.kind,status:r.status},geometry:{type:'Point',coordinates:[...r.coordinates]}
 }))});
 function install(){
  if(!map?.getStyle()||!allowed())return;
  const source=map.getSource(NS);
  if(!source)map.addSource(NS,{type:'geojson',data:features()});
  else source.setData(features());
  if(!map.hasImage(NS+'-icon')){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=48;
   const x=canvas.getContext('2d');x.strokeStyle='#b97922';x.fillStyle='rgba(255,255,255,.92)';x.lineWidth=3;
   x.setLineDash([5,4]);x.beginPath();x.rect(7,7,34,34);x.fill();x.stroke();
   x.setLineDash([]);x.fillStyle='#b97922';x.beginPath();x.arc(24,24,5,0,Math.PI*2);x.fill();
   map.addImage(NS+'-icon',x.getImageData(0,0,48,48));
  }
  if(!map.getLayer(NS+'-symbol'))map.addLayer({id:NS+'-symbol',type:'symbol',source:NS,layout:{
   'icon-image':NS+'-icon','icon-size':0.78,'icon-allow-overlap':true,'icon-ignore-placement':true
  }});
  visibility();
 }
 function visibility(){
  if(map?.getLayer(NS+'-symbol'))map.setLayoutProperty(NS+'-symbol','visibility',allowed()&&(getCategory()==='ECRL'||getCategory()==='All')&&data.length?'visible':'none');
 }
 function clear(){
  data=Object.freeze([]);const source=map?.getSource(NS);if(source)source.setData(empty());
  visibility();
 }
 async function sync(){
  const n=++generation;
  if(!allowed()){clear();return {status:'NO_AUTH',count:0}}
  try{
   const payload=await root.RailwayAccess.fetchMemberBundle();
   if(n!==generation||!allowed())return {status:'STALE_DISCARDED',count:0};
   data=parse(payload?.content);
   install();visibility();
   return {status:'OWNER_REFERENCE_ONLY',count:data.length};
  }catch(_){
   if(n===generation)clear();
   return {status:'UNAVAILABLE',count:0};
  }
 }
 function reference(id){return allowed()?data.find(r=>r.assetId===id)||null:null}
 function hit(point){
  if(!allowed()||!map?.project||getCategory()!=='ECRL'&&getCategory()!=='All')return null;
  return data.map(r=>{const p=map.project(r.coordinates);return {ref:r,distance:Math.hypot(point.x-p.x,point.y-p.y)}})
   .filter(r=>r.distance<=18).sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 function connect(){
  if(connected)return;connected=true;
  root.addEventListener?.('railway-access-change',()=>{void sync()});
  void sync();
 }
 return Object.freeze({connect,sync,install,visibility,reference,hit,get count(){return allowed()?data.length:0},get isAuthorized(){return allowed()}});
}
const api=Object.freeze({parse,create,NS});if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLOwnerCalibration=api;
})(typeof window!=='undefined'?window:null);
