/* R57 Owner-only overlay. Coordinates come from a local file, in session memory. */
(function(root){'use strict';
const NS='mrs10-v8-ecrl-owner-reference';
const R57_SHA256='ea5ab061c374673d4f0ba26b3081377da4193c52bc3625c1070fccc78c0d9eea';
const referenceCodes=new Set(['PL01','PL04','PL07']);
function parse(payload){
 if(payload?.version!=='MR-S10-R57-OWNER-PL-V1'||!Array.isArray(payload.references)||payload.references.length!==referenceCodes.size)return null;
 const found=new Map();
 for(const row of payload.references){
  const {code,referenceOnly,physicalVerified}=row?.properties||{};
  const assetId='ecrl-loop-historical-'+String(code).slice(-2);
  const pair=row?.geometry?.coordinates;
  if(!referenceCodes.has(code)||found.has(code)||row.id!==assetId||row.properties.assetId!==assetId||
     referenceOnly!==true||physicalVerified!==false||row.geometry?.type!=='Point'||!Array.isArray(pair)||pair.length!==2)return null;
  const [lon,lat]=pair;
  if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90||(!lon&&!lat))return null;
  found.set(code,Object.freeze({code,assetId,coordinates:Object.freeze([lon,lat]),
   locationConfidence:'R57 · reference only',status:'OWNER_APPROVED_REFERENCE',physicallyVerified:false,
   kind:'OWNER_REFERENCE_NOT_TRACK',surveyConfirmed:false}));
 }
 return Object.freeze([...found.values()].sort((a,b)=>a.code.localeCompare(b.code)));
}
function create({map,getCategory,sessionHost,onClear}){
 let data=Object.freeze([]),generation=0,connected=false;
 const allowed=()=>{
  const access=sessionHost?.RailwayAccess;
  return access?.canAdmin===true&&access.status==='authenticated';
 };
 const features=()=>({type:'FeatureCollection',features:data.map(r=>({
  type:'Feature',id:r.assetId,properties:{assetId:r.assetId,code:r.code,confidence:r.locationConfidence,
  geometryVerification:r.kind,status:r.status},geometry:{type:'Point',coordinates:[...r.coordinates]}
 }))});
 function install(){
  if(!map?.getStyle()||!allowed()||!data.length)return;
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
  const core=root.MRS10P01MapCore;
  if(!map.getLayer(NS+'-symbol'))map.addLayer({id:NS+'-symbol',type:'symbol',source:NS,minzoom:core.facilityMinZoom,layout:{
   'icon-image':NS+'-icon','icon-size':core.iconScale('FACILITY',48),'icon-allow-overlap':true,'icon-ignore-placement':true
  }});
  visibility();
 }
 function visibility(){
  if(map?.getLayer(NS+'-symbol'))map.setLayoutProperty(NS+'-symbol','visibility',allowed()&&(getCategory()==='ECRL'||getCategory()==='All')&&data.length?'visible':'none');
 }
 function clear(){
  generation++;
  const wasLoaded=data.length>0;
  data=Object.freeze([]);
  if(map?.getLayer(NS+'-symbol'))map.removeLayer(NS+'-symbol');
  if(map?.getSource(NS))map.removeSource(NS);
  if(wasLoaded)onClear?.();
 }
 async function importFile(file){
  if(!allowed())return 'NO_AUTH';
  if(!file||file.size<1||file.size>16384)return 'INVALID';
  const n=++generation;
  try{
   const contents=await file.arrayBuffer();
   const bytes=await root.crypto.subtle.digest('SHA-256',contents);
   if(n!==generation||!allowed())return 'STALE';
   const digest=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==R57_SHA256)return 'INVALID';
   const parsed=parse(JSON.parse(new root.TextDecoder().decode(contents)));
   if(!parsed)return 'INVALID';
   data=parsed;
   install();
   return 'LOADED';
  }catch(_){return 'INVALID';}
 }
 function reference(id){return allowed()?data.find(r=>r.assetId===id)||null:null}
 function hit(point){
  if(!allowed()||!map?.project||getCategory()!=='ECRL'&&getCategory()!=='All')return null;
  if(map.getZoom()<root.MRS10P01MapCore.facilityMinZoom)return null;
  return data.map(r=>{const p=map.project(r.coordinates);return {ref:r,distance:Math.hypot(point.x-p.x,point.y-p.y)}})
   .filter(r=>r.distance<=18).sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 function connect(){
  if(connected)return;connected=true;
  const accessChanged=()=>{if(!allowed())clear()};
  sessionHost?.addEventListener('railway-access-change',accessChanged);
  root.addEventListener('pagehide',event=>{
   clear();
   if(!event.persisted)sessionHost?.removeEventListener('railway-access-change',accessChanged);
  });
 }
 return Object.freeze({connect,importFile,clear,install,visibility,reference,hit,get count(){return allowed()?data.length:0},get isAuthorized(){return allowed()}});
}
const api=Object.freeze({parse,create,NS});if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLOwnerCalibration=api;
})(typeof window!=='undefined'?window:null);
