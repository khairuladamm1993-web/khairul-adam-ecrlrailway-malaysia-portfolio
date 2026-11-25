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
 const api=Object.freeze({routes,createEcrlContext,publicAssetIdentity,findPublicAssets,loadPublicAssetIdentity});
 if(typeof module==='object')module.exports=api;
 if(root)root.MRS10P01MapCore=api;
})(typeof window==='undefined'?null:window);
