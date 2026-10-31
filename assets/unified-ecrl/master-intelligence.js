/* Additive view of the accepted registry. Logical adjacency never becomes GIS. */
(function(root){'use strict';
function create(adapter){
 const layouts={
  'ecrl-loop-historical-04':{status:'SCHEMATIC',source:'OWNER_ACCEPTED_PL04_R1',tracks:['Line 1','Line 2 Mainline','Line 3']},
  'ecrl-stn-07':{status:'SCHEMATIC',source:'OWNER_ACCEPTED_STN07',tracks:['Track 2 · shared crossing / arrival'],referenceLengthMetres:754},
  'ecrl-stn-08':{status:'SCHEMATIC',source:'OWNER_ACCEPTED_STN08',tracks:['Track 2 · shared crossing / arrival'],referenceLengthMetres:898},
  'ecrl-stn-10':{status:'SCHEMATIC',source:'OWNER_ACCEPTED_STN11',tracks:['Cargo Line 5','Cargo Line 6','Cargo Line 7']},
  'ecrl-depot-gombak-north':{status:'SCHEMATIC',source:'OWNER_ACCEPTED_GNU_EMU',tracks:['Inbound SN → DZ1 → DX1 → D1–D5','Service D12–D13','Wash D20','Outbound DZ2 → T7']}
 };
 const spurs=[
  {id:'kuantan',from:'ecrl-stn-10',terminal:'ecrl-port-kuantan',end:'ecrl-end-kuantan',name:'Kuantan Port',sources:['MRL_2024_SCHEME','KPC_2026']},
  {id:'kemaman',from:'ecrl-stn-08',terminal:'ecrl-port-kemaman',end:'ecrl-end-kemaman',name:'Kemaman Port',sources:['MRL_2024_SCHEME','EPIC_2026']},
  {id:'kerteh',from:'ecrl-stn-07',terminal:'ecrl-yard-kerteh-petronas',end:'ecrl-end-kerteh',name:'PETRONAS Kerteh Yard',sources:adapter.kerteh.assets[0].sourceIds}
 ].map(s=>Object.freeze({...s,status:'SCHEMATIC',geometry:null,endCoordinates:null}));
 const endpoints=spurs.map(s=>Object.freeze({assetId:s.end,officialName:s.name+' · End of Spurline',assetType:'FREIGHT_ENDPOINT',geometry:null,point:null,verificationStatus:'UNKNOWN',sourceIds:s.sources,parentTerminal:s.terminal}));
 function get(id){
  const endpoint=endpoints.find(e=>e.assetId===id),a=adapter.get(id)||endpoint;if(!a)return null;
  return {assetId:id,kind:a.assetType,chainage:adapter.chainage.get(id)||(id==='ecrl-depot-gombak-north'?{metres:519750,label:'CH519+750',status:'OWNER_ACCEPTED_PROJECT_REFERENCE_NOT_SURVEYED',source:'MR_S10_OWNER_ACCEPTED_CORRIDOR_MANIFEST'}:null),
   locationStatus:adapter.reference(id)?'AREA_REFERENCE':'UNKNOWN',layout:layouts[id]||{status:'UNKNOWN',tracks:[],source:null},
   spurs:spurs.filter(s=>[s.from,s.terminal,s.end].includes(id)),physicalTrackGeometry:null,
   endpoint:endpoint||null,sourceIds:a.sourceIds||[],permittedSpeed:null,turnouts:null,signals:null};
 }
 return Object.freeze({get,spurs,endpoints,corridor:adapter.chainage.records,depot:adapter.get('ecrl-depot-gombak-north'),layouts});
}
const api={create};if(typeof module==='object')module.exports=api;if(root)root.MRS10ECRLMasterIntelligence=api;
})(typeof window!=='undefined'?window:null);
