/* MR-S10 ECRL geometry provenance & clean consumer handoff.
 * Raster OpenRailwayMap is training-only. Underlying OSM-derived vector
 * geometry remains ODbL-derived even when re-rendered without ORM tiles.
 * Owner calibration != independent surveyed geometry or rights clearance. */
(function(root){'use strict';
const OSM_COPYRIGHT='https://www.openstreetmap.org/copyright';
const OSM_LICENSE='https://opendatacommons.org/licenses/odbl/1-0/';
const ORM_REFERENCE='https://www.openrailwaymap.org/';
const classes=Object.freeze({
 OSM_DERIVED:'OSM_DERIVED_ODBL',
 INDEPENDENT:'INDEPENDENT_LICENSED_SOURCE',
 RESTRICTED:'RESTRICTED_NO_PUBLIC_REUSE',
 UNKNOWN:'UNKNOWN_PROVENANCE_BLOCK_PUBLIC_RELEASE'
});
function identify(source={}){
 const text=[source.source,source.sourceRef,source.attribution,source.license,source.licenseUrl,source['@id']].filter(Boolean).join(' ').toLowerCase();
 if(/(?:openstreetmap|openrailwaymap|osm|odbl|openstreetmap\.org)/.test(text))return classes.OSM_DERIVED;
 if(/restricted|confidential|private|unauthori[sz]ed/.test(text))return classes.RESTRICTED;
 if(source.independentSurvey===true&&source.publicRedistributionLicensed===true&&
 source.licenseUrl?.startsWith('https://')&&source.rightsHolder)return classes.INDEPENDENT;
 return classes.UNKNOWN;
}
function inspect(geo={},review={}){
 const features=Array.isArray(geo.features)?geo.features:[];
 const declared=geo.provenance||{};
 const perFeature=features.map((f,i)=>{
  const props=f?.properties||{};
  const description={...declared,...props,source:props.source||props.sourceRef||props['@id']||declared.source||geo.source||'',license:props.license||declared.license||geo.license||'',licenseUrl:props.licenseUrl||declared.licenseUrl||geo.licenseUrl||''};
  const origin=identify(description);
  return Object.freeze({index:i,origin,sourceRef:String(props.sourceRef||props['@id']||props.source||geo.source||'').slice(0,300)});
 });
 const kinds=new Set(perFeature.map(x=>x.origin));
 const includesOSM=kinds.has(classes.OSM_DERIVED),hasRestricted=kinds.has(classes.RESTRICTED);
 const provenanceComplete=perFeature.length>0&&perFeature.every(x=>x.origin!==classes.UNKNOWN);
 const simulationAccepted=review?.ownerReviewed===true&&review?.simulationQAPassed===true;
 // ODbL-database public display may be possible after licence review and
 // derivative release duties; never auto-publish user-imported coordinates.
 const publicReleaseAllowed=false;
 return Object.freeze({
  schema:'mrs10-ecrl-geometry-lineage-v1',
  datasetClass:includesOSM?'OSM_DERIVED_CANDIDATE':kinds.size===1&&kinds.has(classes.INDEPENDENT)?'INDEPENDENT_LICENSED_CANDIDATE':'MIXED_OR_UNKNOWN',
  originClasses:Object.freeze([...kinds]),
  included:perFeature,
  includesOSM,hasRestricted,provenanceComplete,
  railwaySimulationStatus:simulationAccepted?'OWNER_SIMULATION_REVIEWED':'CANDIDATE_NOT_OWNER_APPROVED',
  officialSurveyVerified:false,publicReleaseAllowed,
  consumerRasterSource:'NONE_REQUIRED',
  publicHandoff:'BLOCKED_PENDING_DATA_RIGHTS_AND_INDEPENDENT_QA',
  attribution:includesOSM?'© OpenStreetMap contributors · ODbL 1.0':null,
  licenseUrl:includesOSM?OSM_LICENSE:null,
  osmCopyrightUrl:includesOSM?OSM_COPYRIGHT:null,
  originalMapReference:ORM_REFERENCE,
  mapStyleDependency:'NONE_FOR_CONSUMER_VECTOR',
  notes:hasRestricted?'Restricted source present: do not distribute or upload.':includesOSM?'Removing OpenRailwayMap tiles does not remove ODbL derivative obligations.':'Independent rights and publication still require review.'
 });
}
function packageCandidate(geo,session,review={}){
 const lineage=inspect(geo,review);
 const safeSession={
   trainId:String(session?.trainId||'D102-SIM'),
   currentCH:Number.isInteger(session?.currentCH)?session.currentCH:null,
   origin:String(session?.origin||'STN01'),
   destination:String(session?.destination||'STN17'),
   events:Array.isArray(session?.events)?session.events.slice(-500).map(x=>({
     type:String(x.type||'SIM_EVENT'),code:x.code||null,to:x.to??null,from:x.from??null,time:x.time||null
   })):[]
 };
 // This manifest never includes raw geometry, personal GPS, or Owner notes.
 return Object.freeze({
  schema:'mrs10-ecrl-calibration-handoff-v1',
  model:'ECRL_OWNER_SIMULATION_NOT_ASBUILT',consumerMapUsesOpenRailwayMap:false,
  geometryReadyForConsumer:false,publicReleaseAllowed:false,
  geometryInventory:{featureCount:geo?.features?.length||0,geometryStoredSeparately:true},
  session:safeSession,
  lineage:{datasetClass:lineage.datasetClass,originClasses:lineage.originClasses,
   includesOSM:lineage.includesOSM,provenanceComplete:lineage.provenanceComplete,
   publicHandoff:lineage.publicHandoff,attribution:lineage.attribution,
   licenseUrl:lineage.licenseUrl,osmCopyrightUrl:lineage.osmCopyrightUrl,
   originalMapReference:lineage.originalMapReference},
  requiredGates:['VECTOR_TOPOLOGY_QA','CH_ANCHOR_CALIBRATION_QA','SOURCE_LICENSE_REVIEW','OWNER_PUBLICATION_APPROVAL']
 });
}
const api=Object.freeze({identify,inspect,packageCandidate,classes,OSM_COPYRIGHT,OSM_LICENSE,ORM_REFERENCE});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLGeometryLineage=api;
})(typeof window!=='undefined'?window:null);
