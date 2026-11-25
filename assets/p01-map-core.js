/* Shared navigation and read-only ECRL context for the P01 map surfaces. */
(function(root){
 'use strict';
 const routes=Object.freeze({
  gateway:'gateway.html#map',
  malaysia:'unified-map-v7.html',
  global:'map-language-lab.html?railPilot=1',
  ecrl:'ecrl-asset-reference.html',
  ampang:'ampang-line-r219.html',
  member:'unified-map-v8.html'
 });
 function createEcrlContext(deps=root){
  const adapter=deps.MRS10UnifiedECRL.create(deps.MRS10ECRLGISV1,deps.MRS10ECRLI18N);
  const master=deps.MRS10ECRLMasterIntelligence.create(adapter);
  const dataContract=deps.MRS10RailwayDataContractV1.create(adapter,master);
  return {adapter,master,dataContract};
 }
 function publicAssetIdentity(dataContract){
  return dataContract.records.map(({assetId,type,code,name,section})=>({assetId,type,code,name,section}));
 }
 function publicStationReferences(records,localities){
  return records.filter(asset=>asset.type==='STN').flatMap(asset=>{
   const matches=localities.filter(row=>row.type==='STN'&&row.name===asset.name&&row.locationConfidence==='Public Reference Location');
   if(matches.length!==1)return [];
   const {lon,lat}=matches[0];
   if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90)return [];
   return [{type:'Feature',id:asset.assetId,properties:{assetId:asset.assetId,code:asset.code,name:asset.name},
    geometry:{type:'Point',coordinates:[lon,lat]}}];
  });
 }
 function findPublicAssets(records,query,type='ALL'){
  const normalize=text=>text.toLowerCase().replace(/[^a-z0-9]/g,'');
  const key=normalize(query).replace(/^(stn|pl)([1-9])$/,(_,prefix,digit)=>prefix+'0'+digit);
  return records.filter(asset=>(type==='ALL'||asset.type===type)&&
   (normalize(asset.assetId)===key||normalize([asset.code,asset.name].join(' ')).includes(key)));
 }
 async function loadPublicAssetIdentity(){
  const response=await fetch('./data/ecrl-public-identity-v1.json');
  if(!response.ok)throw Error('ECRL_PUBLIC_IDENTITY_HTTP_'+response.status);
  const data=await response.json();
  if(data.version!==1||data.corridor!=='ECRL'||!Array.isArray(data.records))throw Error('ECRL_PUBLIC_IDENTITY_CONTRACT');
  return data.records;
 }
 function installStationType2(map,id){
  if(map.hasImage(id))return;
  const canvas=document.createElement('canvas');canvas.width=68;canvas.height=68;
  const ctx=canvas.getContext('2d');ctx.scale(68/24,68/24);
  ctx.fillStyle='#1457a6';ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(3.5,2.5,17,17,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.fillRect(7,6,10,6);
  for(const x of [8,16]){ctx.beginPath();ctx.arc(x,15.5,1.2,0,2*Math.PI);ctx.fill()}
  ctx.strokeStyle='#1457a6';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(8,19);ctx.lineTo(6,22);ctx.moveTo(16,19);ctx.lineTo(18,22);ctx.stroke();
  map.addImage(id,ctx.getImageData(0,0,68,68),{pixelRatio:2});
 }
 const api=Object.freeze({routes,createEcrlContext,publicAssetIdentity,publicStationReferences,installStationType2,findPublicAssets,loadPublicAssetIdentity});
 if(typeof module==='object')module.exports=api;
 if(root)root.MRS10P01MapCore=api;
})(typeof window==='undefined'?null:window);
