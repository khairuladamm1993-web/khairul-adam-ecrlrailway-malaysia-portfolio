/* Asia Malaysia station features: read-only projection from existing public ECRL reference.
   Public reference coordinates are locality estimates, NOT surveyed station positions. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10MalaysiaStations=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const SOURCE='https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/blob/609cbbbfcfc7e848f8c5f94c41e5152fba5115d6/assets/corridor-reference.js';
 function fromPublicReference(records){
  if(!Array.isArray(records))return [];
  const seen=new Set();
  return records.filter(r=>{
    if(!r||r.type!=='STN'||r.locationConfidence!=='Public Reference Location')return false;
    if(!Number.isFinite(r.lat)||!Number.isFinite(r.lon)||r.lat<1||r.lat>7.5||r.lon<99.5||r.lon>105)return false;
    if(typeof r.id!=='string'||!/^ref-\\d+$/.test(r.id)||seen.has(r.id))return false;
    seen.add(r.id);return true;
  }).map(r=>({
    type:'Feature',
    geometry:{type:'Point',coordinates:[r.lon,r.lat]},
    properties:{
      name:r.name,network:'ECRL',operator:'Malaysia Rail Link (MRL)',
      source:'MR-S10 public ECRL reference',sourceId:r.id,sourceUrl:SOURCE,
      status:'Public reference locality — not a surveyed station coordinate'
    }
  }));
 }
 return Object.freeze({fromPublicReference});
});
