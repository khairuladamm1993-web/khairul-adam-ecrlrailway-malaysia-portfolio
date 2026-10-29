/* MR-S10 D102 Master Handoff R1.7 — ONE portable JSON export.
 * Not a certification or a public dataset. Embeds only data locally available
 * with explicit source file references. Never fabricates track coordinates. */
(function(root){'use strict';
const SCHEMA='mrs10-ecrl-d102-master-handoff-v1';
const MAX_RAW_MEDIA=22*1024*1024;
const rows=root.MRS10ECRLChainage?.records||[];
if(rows.length!==23)throw Error('MASTER_EXPORT_23_MANIFEST_MISSING');
function mediaB64(raw,mime){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('MEDIA_ENCODE_FAILED'));
  reader.onload=()=>resolve(String(reader.result||''));
  reader.readAsDataURL(new Blob([raw],{type:mime}));
 });
}
function authority(geo){
 const refs=(geo?.features||[]).filter(x=>x?.geometry?.type==='LineString');
 return {imported:!!geo,featureCount:refs.length,confirmedAsBuilt:false,actualTrackSurveyVerified:false,
  railOnlyContinuityVerified:false,CHChainageMatched:false,
  purpose:'SOURCE_CANDIDATE_UNVERIFIED_NO_PHYSICAL_MOVEMENT',
  provenance:geo?.source||geo?.metadata?.source||'SOURCE_UNRESOLVED',
  coordinateSystem:'GEOJSON_WGS84_WHEN_PRESENT',
  sourceGeoJSON:geo?JSON.parse(JSON.stringify(geo)):null};
}
function compactFile(e,embedded){
 return {fileName:e.fileName,assetCode:e.assetCode,source:e.source,
  mediaType:e.media,bytes:e.bytes,importedAt:e.importedAt,
  evidenceClass:'OWNER_SOURCE_IMAGE_OR_PDF_NOT_SURVEYED',
  embeddedDataURL:embedded,physicalTrackCentrelineExtracted:false};
}
async function create(deps,{includeMedia=true,allowIncomplete=false}={}){
 const runner=deps.getInstructions();
 if(!runner)throw Error('INSTRUCTION_RUNNER_NOT_READY');
 const active=runner.active;
 const allDone=!!active&&active.reviewStatus==='OWNER_APPROVED'&&
  active.commands.length>0&&active.commands.every(c=>c.status==='COMPLETED');
 if(!allDone&&!allowIncomplete)throw Error('ASSIGNMENT_NOT_ALL_COMPLETED_EXPORT_PREVIEW_ONLY');
 const preflight=root.MRS10ECRLD102PreflightUI?.getStore?.().snapshot?.()||null;
 const observation=root.MRS10ECRLD102PreflightUI?.getObservations?.().exportLog?.()||null;
 const layouts=deps.getLayouts();
 const journey=deps.getJourney().exportData();
 const mediaProvider=root.MRS10D102SourceDocuments;
 const plInfo=root.MRS10ECRLAlignmentEvidence?.passingLoops||[];
 const registry=rows.map((r,i)=>{
  const station=root.MRS10ECRLStationIntelligence?.getStation(r.code);
  const passing=plInfo.find(x=>x.code===r.code);
  const cand=preflight?.controls?.find(x=>x.code===r.code)?.candidate||null;
  const lay=layouts.get(r.code);
  const deltaPreviousM=i? r.metres-rows[i-1].metres:null;
  return {
    assetCode:r.code,assetId:r.assetId,sequence:r.sequence,kind:r.code.startsWith('PL')?'PASSING_LOOP':'STATION',
    name:station?.displayName||passing?.name||r.code,chainageM:r.metres,
    CHLabel:r.label,CHDatum:r.datum,CHStatus:r.status,
    previousAsset:i?rows[i-1].code:null,deltaPreviousMetres:deltaPreviousM,
    nextAsset:rows[i+1]?.code||null,deltaNextMetres:rows[i+1]?rows[i+1].metres-r.metres:null,
    coordinateSource:'OWNER_MODEL_CANDIDATE_OR_PUBLIC_REFERENCE_NOT_SURVEYED',
    ownerCoordinateCandidate:cand?{latitude:cand.latitude,longitude:cand.longitude,source:cand.source,
      note:cand.note,reviewedAt:cand.confirmedAt,certifiedSurvey:false}:null,
    publicLocalityReference:station?.referencePoint?{
      longitude:station.referencePoint[0],latitude:station.referencePoint[1],
      sourceIds:station.sourceIds,classification:station.referenceKind}:null,
    physicalLatitude:null,physicalLongitude:null,georeferencedCentrelineMatched:false,
    stationIntelligence:station?JSON.parse(JSON.stringify(station)):null,
    passingLoopReference:passing?JSON.parse(JSON.stringify(passing)):null,
    sourceTrackLayout:lay?{...lay,status:'OWNER_IMPORTED_UNVERIFIED'}:null,
    trackGaugeProjectSpecificationMm:1435,trackGaugeAtAssetVerified:false,
    trackArrangementVerified:false,curveRadiusM:null,gradientPermille:null,
    designSpeedKmh:null,permittedSpeedKmh:null,TSR:null,
    bridgeTunnelQZReferences:journey.infrastructure.filter(v=>v.CH===r.metres).map(x=>({...x,surveyVerified:false})),
    linkedSourceMedia:[],verification:'PENDING_INDEPENDENT_RAILWAY_GEOMETRY_SOURCE'
  };
 });
 const allMedia=[];
 if(includeMedia&&mediaProvider?.list){
   let counted=0;
  for(const r of rows){
   const entries=await mediaProvider.list(r.code);
   for(const e of entries){
    counted+=Number(e.bytes)||0;
    if(counted>MAX_RAW_MEDIA)throw Error('SOURCE_MEDIA_OVER_22MB_REDUCE_ATTACHMENTS_BEFORE_ONE_FILE_EXPORT');
    const embedded=await mediaB64(e.bytesData,e.media);
    const out=compactFile(e,embedded);
    allMedia.push(out);
    registry.find(x=>x.assetCode===r.code).linkedSourceMedia.push({
      fileName:e.fileName,source:e.source,media:e.media,embeddedInMasterFile:true});
   }
  }
 }
 const official=deps.getImportedGeometry?.()||null;
 const geo=authority(official);
 const gates={
  allInstructionCommandsCompleted:allDone,
  CHRegistryComplete:registry.length===23,
  stationCount:registry.filter(r=>r.kind==='STATION').length,
  passingLoopCount:registry.filter(r=>r.kind==='PASSING_LOOP').length,
  ownerCoordinateCandidates:registry.filter(r=>!!r.ownerCoordinateCandidate).length,
  sourceTrackLayouts:registry.filter(r=>!!r.sourceTrackLayout).length,
  sourceDocumentsEmbedded:allMedia.length,
  fullContinuousRailVectorVerified:false,all23PhysicalCHAnchorsVerified:false,
  stationLoopAsBuiltAccepted:false,geographicD102TrainRelease:false,
  publicPwaPublicationAllowed:false,
  handoffStatus:allDone?'ASSIGNMENT_COMMANDS_COMPLETE_GEOMETRY_EVIDENCE_PENDING':'INCOMPLETE_ASSIGNMENT_DRAFT'
 };
 const output={
  schema:SCHEMA,version:'1.0.0',createdAt:new Date().toISOString(),
  purpose:'PORTABLE_OFFLINE_ECRL_PROJECT_HANDOFF_FOR_FUTURE_P01_P02_P03_PWA',
  sourcePolicy:'PRIVATE_OWNER_LEARNING_REFERENCE_NOT_PUBLIC_REPUBLICATION',
  licenseReviewRequired:true,ownerApprovalNotSurveyCertification:true,
  journeyTrainId:'D102-SIM',corridor:{name:'ECRL',origin:'STN01',terminus:'STN17',
   CHStartM:670,CHEndM:524160,referenceLengthKm:523.49,
   gaugeMmProjectSpecification:1435,electrificationProjectSpecification:'25KV_AC',
   authoritativePhysicalGeography:'NOT_VERIFIED',chainageEquations:'UNKNOWN'},
  acceptance:gates,assetRegistry:registry,
  importedRailGeometry:geo,trackLayoutMedia:allMedia,
  infrastructureReferences:journey.infrastructure,
  ownerCoordinateAudit:preflight?{summary:preflight.summary,history:preflight.history}:null,
  d102Session:deps.getSession()?JSON.parse(JSON.stringify(deps.getSession())):null,
  d102JourneyLedger:journey,engineeringObservationLog:observation,
  instructionBundle:runner,assistantGeometryAudit:deps.getAudit(),
  missingEvidence:registry.flatMap(x=>{
    const issue=[];if(!x.ownerCoordinateCandidate)issue.push('WGS84_OWNER_REVIEW');
    if(!x.sourceTrackLayout)issue.push('TRACK_LAYOUT_SOURCE_VECTOR');
    issue.push('GEOGRAPHIC_TRACK_CENTERLINE_AND_CH_GEOMETRY_QA');
    return [{assetCode:x.assetCode,issues:issue}];
  }),
  warning:'ALL CH, images, drawings and simulated observations are reference/training data only. No inference of physical train track, licensed data redistribution, or as-built survey.',
  publicPublished:false,remoteSync:false,
  fileIntegrity:{schemaVersion:'1.0.0',mediaEncoding:includeMedia?'DATA_URL_BASE64':'METADATA_ONLY',
   rawMediaLimitBytes:MAX_RAW_MEDIA,generation:'LOCAL_SAFARI_IN_MEMORY_EXPORT'}
 };
 if(!output.acceptance.CHRegistryComplete)throw Error('CORRIDOR_REGISTRY_INTEGRITY_FAIL');
 return output;
}
function readiness(instructions){
 const active=instructions?.active;
 const allDone=!!active&&active.reviewStatus==='OWNER_APPROVED'&&active.commands.length>0&&active.commands.every(x=>x.status==='COMPLETED');
 return {commandsAllComplete:allDone,readyForPortableArchive:allDone,
   readyForPhysicalRailOrPublicPWA:false,schema:SCHEMA};
}
const api=Object.freeze({SCHEMA,MAX_RAW_MEDIA,create,readiness});
root.MRS10D102MasterHandoff=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
