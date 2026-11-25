/* Owner-accepted educational corridor manifest. Not surveyed track geometry,
   live train position, permitted speed, timetable or official operator datum. */
(function(root){'use strict';
// Corridor reference order and sections. Depot rows do not add control points.
const RAW=[
 ['ecrl-stn-01','STN01','A',670],
 ['ecrl-stn-02','STN02','A',33700],
 ['ecrl-stn-03','STN03','A',51450],
 ['ecrl-stn-04','STN04','A',88220],
 ['ecrl-loop-historical-01','PL01','A',115180],
 ['ecrl-stn-05','STN05','A',145990],
 ['ecrl-loop-historical-02','PL02','A',172450],
 ['ecrl-stn-06','STN06','A',207400],
 ['ecrl-stn-07','STN07','B',238700],
 ['ecrl-stn-08','STN08','B',267690],
 ['ecrl-stn-09','STN09','B',278500],
 ['ecrl-depot-kuantan',null,'B',null],
 ['ecrl-stn-10','STN11','B',301735],
 ['ecrl-stn-11','STN12','B',315000],
 ['ecrl-stn-12','STN13','B',338325],
 ['ecrl-loop-historical-03','PL03','B',353242],
 ['ecrl-loop-historical-04','PL04','B',377950],
 ['ecrl-stn-13','STN14','B',396900],
 ['ecrl-loop-historical-05','PL05','B',415180],
 ['ecrl-stn-14','STN15','B',433250],
 ['ecrl-loop-historical-06','PL06','C1',457100],
 ['ecrl-stn-15','STN16','C1',484600],
 ['ecrl-loop-historical-07','PL07','C1',515725],
 ['ecrl-depot-gombak-north',null,'C1',null],
 ['ecrl-stn-16','STN17','C1',524160]
];
const provenance='MR_S10_OWNER_ACCEPTED_CORRIDOR_MANIFEST';
const datum='MR_S10_PROJECT_REFERENCE_A_C1_NOT_SURVEYED';
const status='PROJECT_REFERENCE_PENDING_INDEPENDENT_VERIFICATION';
const format=metres=>Number.isSafeInteger(metres)&&metres>=0
 ? 'CH'+Math.floor(metres/1000)+'+'+String(metres%1000).padStart(3,'0'):null;
const lineup=Object.freeze(RAW.map(([assetId,code,section])=>Object.freeze({assetId,code,section})));
const lineupById=new Map(lineup.map(row=>[row.assetId,row]));
const records=Object.freeze(RAW.filter(([,code])=>code!==null).map(([assetId,code,,metres],i)=>Object.freeze({
 assetId,code,metres,km:metres/1000,label:format(metres),sequence:i+1,
 datum,provenance,status,geometryVerified:false,trackPoint:null
})));
const byId=new Map(records.map(r=>[r.assetId,r]));
if(lineup.length!==25||lineupById.size!==25||byId.size!==23||new Set(records.map(r=>r.code)).size!==23||
 records.some((r,i)=>i>0&&r.metres<=records[i-1].metres))throw Error('ECRL_CHAINAGE_MANIFEST_INTEGRITY');
const get=id=>byId.get(id)||null;
function referenceDelta(fromId,toId){
 const a=get(fromId),b=get(toId);
 if(!a||!b||a.datum!==b.datum)return Object.freeze({
  status:'UNAVAILABLE',referenceKm:null,reason:'MISSING_OR_INCOMPATIBLE_CHAINAGE',
  isLive:false,isPassengerArrivalEstimate:false
 });
 return Object.freeze({
  status:'PROJECT_REFERENCE_DELTA_ONLY',referenceKm:Math.abs(b.metres-a.metres)/1000,
  fromCH:a.label,toCH:b.label,
  direction:b.metres>a.metres?'INCREASING':b.metres<a.metres?'DECREASING':'AT_REFERENCE',
  datum,provenance,isLive:false,isPassengerArrivalEstimate:false,
  reason:'NO_VERIFIED_TRACK_MAP_MATCH_OR_SAME_DATUM_OPERATIONAL_CONFIRMATION'
 });
}
const getLineup=id=>lineupById.get(id)||null;
const api=Object.freeze({version:'1.0.0',status,datum,provenance,records,get,lineup,getLineup,format,referenceDelta});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLChainage=api;
})(typeof window!=='undefined'?window:null);
