/* Read-only projection of the V8 ECRL reference inventory. */
(function(root){'use strict';
const VERSION=1;

function create(adapter,master){
 const ordered=adapter.chainage.records.map(entry=>adapter.get(entry.assetId));
 const depots=adapter.assets.filter(asset=>asset.assetType==='DEPOT');
 const records=Object.freeze([...ordered,...depots].map(asset=>{
  const chainage=master.get(asset.assetId).chainage;
  const reference=adapter.reference(asset.assetId);
  return Object.freeze({
   assetId:asset.assetId,
   type:asset.stationCode?'STN':asset.plCode?'PL':'DEPOT',
   code:asset.stationCode||asset.plCode||null,
   name:asset.officialName||asset.historicalName,
   section:asset.section,
   chainage:chainage?Object.freeze({
    metres:chainage.metres,label:chainage.label,datum:chainage.datum??null,
    provenance:chainage.provenance??chainage.source??null,status:chainage.status
   }):null,
   referencePosition:reference?Object.freeze({
    kind:reference.kind,coordinates:Object.freeze([...reference.coordinates]),sourceId:reference.sourceId
   }):null,
   confidence:Object.freeze({
    identity:asset.verificationStatus,
    position:reference?'AREA_REFERENCE_ONLY':'UNVERIFIED',
    chainage:chainage?.status??'UNVERIFIED'
   }),
   physicalGeometry:null
  });
 }));
 return Object.freeze({version:VERSION,corridor:'ECRL',records});
}

const api=Object.freeze({create,VERSION});
if(typeof module==='object')module.exports=api;
if(root)root.MRS10RailwayDataContractV1=api;
})(typeof window!=='undefined'?window:null);
