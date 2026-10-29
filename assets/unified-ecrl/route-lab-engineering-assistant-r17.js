/* R1.7 deterministic MR-S10 engineering audit assistant.
 * This is NOT a generative AI model or autonomous survey process. */
(function(root){'use strict';
const rows=root.MRS10ECRLChainage?.records||[];
function report(deps){
 const store=root.MRS10ECRLD102PreflightUI?.getStore?.();
 const summary=store?.checks?.()||{total:23,completed:0,missing:rows.map(x=>x.code),issues:[]};
 const diagrams=deps.getLayouts().all();
 const attachments=deps.getAttachments?.()||[];
 const infra=deps.getJourney().infrastructure();
 const gates=rows.map((asset,i)=>{
  const code=asset.code,modelCandidate=store?.candidate(code)||null;
  const drawing=diagrams.find(x=>x.code===code)||null;
  const files=attachments.filter(x=>x.assetCode===code);
  const issues=[];
  if(!modelCandidate)issues.push('MODEL_COORDINATE_PENDING');
  if(!drawing&&files.length===0)issues.push('SOURCE_LAYOUT_NOT_IMPORTED');
  if(!drawing)issues.push('VECTOR_TRACK_LAYOUT_NOT_AVAILABLE');
  if(i>0)issues.push('ADJACENT_RAIL_TOPOLOGY_NOT_VERIFIED');
  return {code,CH:asset.metres,CHLabel:'CH'+String(Math.floor(asset.metres/1000)).padStart(3,'0')+'+'+String(asset.metres%1000).padStart(3,'0'),
   type:code.startsWith('PL')?'PASSING_LOOP':'STATION',
   ownerModelCandidate:!!modelCandidate,layoutSchematicImported:!!drawing,sourceMediaFiles:files.length,
   gapFlags:issues,railVectorSurveyVerified:false,physicalChainageMatched:false};
 });
 const missing=summary.missing||gates.filter(x=>!x.ownerModelCandidate).map(x=>x.code);
 return {
  schema:'mrs10-d102-engineering-gap-audit-v1',generatedAt:new Date().toISOString(),
  origin:'STN01',terminus:'STN17',recordedCHAnchors:23,stations:16,loops:7,
  modelCoordinateCandidates:summary.completed||0,missingCandidateCodes:missing,
  diagramsCount:diagrams.length,sourceMediaReferences:attachments.length,
  infrastructureReferenceCount:infra.length,
  entireCorridorVectorConnected:false,physicalCHTrackMatched:false,physicalTrainReleased:false,
  autoSurveyComplete:false,localOnly:true,
  nextEngineeringActions:[
   'Verify source rights and source revision for georeferenced centreline',
   'Resolve all 16 STN and PL01–PL07 WGS84 candidates with source and CH residual',
   'Audit railway-only continuous segment connectivity and gauge=1435 with no synthetic road links',
   'Register authoritative bridge/tunnel/QZ CH/elevation/grade/curve source facts before popup use',
   'Review imported STN/PL schematic tracks and turnout positions against permitted engineering evidence',
   'Perform Safari UAT and Owner sign-off on the actual station/PL review evidence',
   'Keep geographic D102 follow, public publish and physical train claims BLOCKED pending verified track geometry'
  ],assets:gates,
  approval:'RESEARCH_AND_OWNER_MODEL_REVIEW_ONLY',asBuiltVerified:false
 };
}
const api=Object.freeze({report});
root.MRS10D102EngineeringAssistant=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
