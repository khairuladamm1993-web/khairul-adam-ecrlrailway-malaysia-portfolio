/* Corridor evidence inventory. CH adjacency is not physical railway connectivity. */
(function(root){'use strict';
const UNKNOWN='UNKNOWN';
function inspect(rows,geo){
 const assets=rows.map(r=>({code:r.code,CH:r.metres,latitude:null,longitude:null,verification:'OWNER_CH_REFERENCE_NOT_AS_BUILT',physicalSurveyVerified:false}));
 const segments=rows.slice(1).map((r,i)=>({segmentId:rows[i].code+'--'+r.code,from:rows[i].code,to:r.code,CHStart:rows[i].metres,CHEnd:r.metres,relationship:'CH_SEQUENCE_ONLY',geometry:null,connectivity:UNKNOWN,trackId:UNKNOWN,projectGaugeMM:1435,segmentGaugeMM:null,trackCount:null,mainline:UNKNOWN,passingLoop:UNKNOWN,siding:UNKNOWN,platform:UNKNOWN,berths:UNKNOWN,gradient:null,elevation:null,radius:null,cant:null,QZ:UNKNOWN,speedReference:null,bridge:UNKNOWN,tunnel:UNKNOWN,portal:UNKNOWN,embankment:UNKNOWN,cutting:UNKNOWN,electrification:UNKNOWN,signal:UNKNOWN,occupancy:'SIMULATION_ONLY',freightJunction:UNKNOWN,portSpur:UNKNOWN,yard:UNKNOWN,endLane:UNKNOWN,datum:UNKNOWN,CRS:UNKNOWN,sourceFeatureId:null,sourceURL:null,sourceDate:null,sourceLicence:UNKNOWN,confidence:'UNRESOLVED',CHResidual:null,QAStatus:'SOURCE_REQUIRED',ownerConfirmation:null}));
 const candidates=(geo?.features||[]).filter(f=>f.geometry?.type==='LineString').map(f=>({sourceFeatureId:f.id??f.properties?.sourceFeatureId??null,geometry:f.geometry,properties:f.properties||{},classification:'PRIVATE_CANDIDATE_NOT_SURVEY_VERIFIED'}));
 const gaps=['LICENSED_RAILWAY_VECTOR_REQUIRED','SOURCE_NODE_TOPOLOGY_REQUIRED','SOURCE_REFERENCED_CH_ANCHORS_REQUIRED','INDEPENDENT_MODEL_REVIEW_REQUIRED'];
 return {schema:'mrs10-geometry-qa-r17',assets,segments,candidates,counts:{stations:assets.filter(x=>x.code.startsWith('STN')).length,loops:assets.filter(x=>x.code.startsWith('PL')).length,controlPoints:assets.length,CHAdjacencies:segments.length,verifiedPhysicalSegments:0,candidateFeatures:candidates.length},gaps,geographicMovementAllowed:false,physicalSurveyVerified:false,ownerUATIsAsBuiltVerification:false,publicPublished:false,cloudSynced:false};
}
const api={inspect};if(typeof module==='object')module.exports=api;if(root)root.MRS10GeometryIntelligenceR17=api;
})(typeof window!=='undefined'?window:null);
