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
 const raw=tags.gauge===undefined||tags.gauge===null?'':String(tags.gauge).trim();
 const railwayTag=String(tags.railway||'').trim();
 const isRailGeometry=['rail','construction','proposed'].includes(railwayTag);
 const highwayTag=tags.highway!==undefined&&tags.highway!==null&&String(tags.highway).trim()!=='';
 const roadConflict=highwayTag||tags.area==='yes'||tags.motor_vehicle==='yes';
 // Orange ORM raster tiles never provide gauge or a safe movement centreline.
 // Each accepted vector feature must explicitly state exactly 1435 mm.
 const match=/^\d{3,4}$/.test(raw)?Number(raw):null;
 const tagGaugeVerified=match===1435;
 const status=!isRailGeometry?'NOT_RAILWAY_CANDIDATE':
    roadConflict?'ROAD_OR_AREA_TAG_CONFLICT':
    !raw?'GAUGE_TAG_MISSING_NEEDS_SOURCE_REVIEW':
    !tagGaugeVerified?'GAUGE_CONFLICT_OR_MULTIPLE_VALUES':
    'GAUGE_TAG_MATCHES_PROJECT_SPEC_NOT_SURVEYED';
 return Object.freeze({
  classification:'ECRL_SIMULATION_CANDIDATE',
  label:'1435 mm PROJECT SPEC; OSM segment gauge requires separate evidence',
  gaugeMm:match,
  gaugeTag:raw||null,
  status,
  isRailGeometry,
  roadConflict,
  gaugeCompatible:tagGaugeVerified,
  source:source.id
 });
}
function movementEligibility({assembly,matched,sourceTags=[]}={}){
 const reasons=[];
 if(!assembly||assembly.status!=='CONTINUOUS_CANDIDATE'||assembly.paths?.length!==1||
    !Number.isFinite(assembly.paths?.[0]?.metres)||assembly.paths[0].metres<=0)
   reasons.push('TRACK_CANDIDATE_NOT_CONTINUOUS');
 if(!matched||matched.status!=='INFERRED_CH_MATCH_ONLY'||matched.anchors?.length<2)
   reasons.push('CH_GEO_ANCHORS_NOT_CALIBRATED');
 if(!Array.isArray(sourceTags)||sourceTags.length===0)
   reasons.push('NO_VECTOR_RAIL_SEGMENT_METADATA');
 else{
  const audits=sourceTags.map(auditSegment);
  if(audits.some(a=>!a.isRailGeometry))reasons.push('ROAD_OR_NON_RAIL_VECTOR_REJECTED');
  if(audits.some(a=>a.roadConflict))reasons.push('ROAD_OR_AREA_TAG_CONFLICT');
  if(audits.some(a=>a.status==='GAUGE_TAG_MISSING_NEEDS_SOURCE_REVIEW'))reasons.push('GAUGE_NOT_VERIFIED_ON_EVERY_SEGMENT');
  if(audits.some(a=>a.status==='GAUGE_CONFLICT_OR_MULTIPLE_VALUES'))reasons.push('GAUGE_CONFLICT');
 }
 // This is a MODEL-ONLY candidate, not a surveyed alignment or an assurance that
 // OSM has no positional mapping error. Crossing over roads on a bridge or level
 // crossing is legitimate; train movement remains constrained to the rail vector.
 return Object.freeze({
  trainingTrainPinAllowed:reasons.length===0,
  officialSurveyAccepted:false,operationalOrPassengerLocationAllowed:false,
  roadParcelGeometryIndependentlyVerified:false,
  source:'OSM_VECTOR_SIMULATION_ONLY',
  reasons:Object.freeze(reasons)
 });
}
const api=Object.freeze({source,ecrl,orm,auditSegment,movementEligibility});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLRailEngineering=api;
})(typeof window!=='undefined'?window:null);
