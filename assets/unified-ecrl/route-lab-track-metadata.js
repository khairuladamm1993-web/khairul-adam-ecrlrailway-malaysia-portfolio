/* MR-S10 P01 Railway engineering model. 1435 mm is an ECRL PROJECT
   specification, NOT a property encoded by OpenRailwayMap orange pixels.
   Track occupancy/movement requires vector centreline and CH anchors. */
(function(root){'use strict';
const source=Object.freeze({
 id:'MRL_ECRL_TECHNICAL_2024',
 url:'https://www.mida.gov.my/wp-content/uploads/2024/06/Slides-MRL.pdf',
 date:'2024-06',
 description:'Malaysia Rail Link public general technical features; 1.435 m, 25 kV, single track on double track formation, passenger 160 km/h, freight 80 km/h',
 evidence:'OFFICIAL_PROJECT_GENERAL_SPECIFICATION_NOT_SEGMENT_SURVEY'
});
const ecrl=Object.freeze({
 routeId:'ECRL_MAINLINE',
 gaugeMm:1435,
 gaugeClass:'STANDARD_GAUGE',
 gaugeEvidence:source.id,
 electrification:'25KV_AC_PROJECT_SPEC',
 trackConfiguration:'SINGLE_TRACK_ON_DOUBLE_TRACK_FORMATION',
 trackCountSource:'PROJECT_SPECIFICATION_NOT_CURRENT_SEGMENT_VERIFICATION',
 passengerSpeedReferenceKmh:160,
 freightSpeedReferenceKmh:80,
 speedType:'PROJECT_GENERAL_REFERENCE_NOT_TSR_OR_PERMITTED_SPEED',
 geometryStatus:'UNVERIFIED_IN_ROUTE_LAB',
 safetyStatus:'SIMULATION_ONLY',
 metadataVersion:'R1.2'
});
const orm=Object.freeze({
 layer:'STANDARD_OSM_RAILWAY_STYLE',
 mainlineOrange:'#FF8100',
 railwayProposedConstructionMayBeDashed:true,
 glyphMeaning:'RAILWAY_USAGE_AND_STATE_BASED_RENDERING',
 signifiesGauge:false,
 geometryFromRaster:false,
 canTrackTrain:false,
 sourceUrl:'https://github.com/OpenRailwayMap/OpenRailwayMap/blob/master/styles/standard.mapcss'
});
function auditSegment(tags={}){
 const raw=tags.gauge==null?'':String(tags.gauge).trim();
 const gauges=raw.match(/\d{3,4}/g)?.map(Number)||[];
 const report={classification:'ECRL_SIMULATION_CANDIDATE',label:'1435 mm PROJECT SPEC; OSM gauge NOT VERIFIED',
    gaugeMm:raw?null:undefined,gaugeTag:raw||null,
    status:'GAUGE_TAG_MISSING_NEEDS_SOURCE_REVIEW',
    isRailGeometry:typeof tags.railway==='string'&&['rail','construction','proposed'].includes(tags.railway),
    gaugeCompatible:null,source:source.id};
 if(gauges.length){
  report.gaugeMm=gauges.length===1?gauges[0]:null;
  report.gaugeCompatible=gauges.length===1&&gauges[0]===1435;
  report.status=report.gaugeCompatible?'GAUGE_TAG_MATCHES_PROJECT_SPEC_NOT_SURVEYED':'GAUGE_CONFLICT_OR_MULTIPLE_VALUES';
 }
 if(!report.isRailGeometry)report.status='NOT_RAILWAY_CANDIDATE';
 return Object.freeze(report);
}
function movementEligibility({assembly,matched,sourceTags=[]}={}){
 const reasons=[];
 if(!assembly||assembly.status!=='CONTINUOUS_CANDIDATE')reasons.push('TRACK_CANDIDATE_NOT_CONTINUOUS');
 if(!matched||matched.status!=='INFERRED_CH_MATCH_ONLY')reasons.push('CH_GEO_ANCHORS_NOT_CALIBRATED');
 if(sourceTags.some(t=>auditSegment(t).status==='GAUGE_CONFLICT_OR_MULTIPLE_VALUES'))reasons.push('GAUGE_CONFLICT');
 return Object.freeze({
 trainingTrainPinAllowed:reasons.length===0,
 officialSurveyAccepted:false,operationalOrPassengerLocationAllowed:false,
 source:'OSM_VECTOR_SIMULATION_ONLY',reasons:Object.freeze(reasons)
 });
}
const api=Object.freeze({source,ecrl,orm,auditSegment,movementEligibility});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLRailEngineering=api;
})(typeof window!=='undefined'?window:null);
