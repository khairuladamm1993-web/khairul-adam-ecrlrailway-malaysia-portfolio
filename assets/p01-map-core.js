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
 function createEcrlContext(){
  const adapter=root.MRS10UnifiedECRL.create(root.MRS10ECRLGISV1,root.MRS10ECRLI18N);
  const master=root.MRS10ECRLMasterIntelligence.create(adapter);
  const dataContract=root.MRS10RailwayDataContractV1.create(adapter,master);
  return {adapter,master,dataContract};
 }
 function publicAssetIdentity(dataContract){
  return dataContract.records.map(({assetId,type,code,name,section})=>({assetId,type,code,name,section}));
 }
 const api=Object.freeze({routes,createEcrlContext,publicAssetIdentity});
 if(typeof module==='object')module.exports=api;
 if(root)root.MRS10P01MapCore=api;
})(typeof window==='undefined'?null:window);
