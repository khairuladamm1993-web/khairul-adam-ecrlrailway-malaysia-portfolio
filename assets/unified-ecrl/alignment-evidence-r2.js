/* MR-S10 P01 ECRL Alignment Evidence R2.
   Public railway schemes establish topology, NOT coordinates of physical rails.
   No generated/snap-to-road LineString, terminal point, PL pin, train position or ETA. */
(function(root){'use strict';
const SOURCES=Object.freeze({
 MRL_2023:Object.freeze({url:'https://www.mrl.com.my/wp-content/uploads/2023/05/ECRL-Alignment-1552023.pdf',kind:'OFFICIAL_RAIL_SCHEMATIC',revision:'MRL overall corridor and Kerteh/Kemaman/Kuantan/Port Klang spur schematic, May 2023',surveyGeometry:false}),
 PLAN_PEGTA_2025:Object.freeze({url:'https://myplan.planmalaysia.gov.my/admin/uploads_publication/pdf_20250117162247_10.pdf',kind:'GOVERNMENT_INTEGRATED_LAND_USE_MASTER_PLAN',revision:'PeGTaECRL Vol I Chapter 5, Table 5.79: existing MRL spurline programmes vs proposed future studies',surveyGeometry:false}),
 PLAN_ECRL_METADATA:Object.freeze({url:'https://myplan.planmalaysia.gov.my/admin/uploads_publication/pdf_20250417162849_13.pdf',kind:'GOVERNMENT_GIS_METADATA_SPECIFICATION',revision:'PLANMalaysia 2025 REL2: shp/tab, state-specific GDM2000 Cassini; metadata specification only, not a downloadable surveyed ECRL alignment',surveyGeometry:false}),
 PORT_KUANTAN:Object.freeze({url:'https://www.kuantanport.com.my/zh/2026/02/09/',kind:'OFFICIAL_PORT_OPERATOR',revision:'9 Feb 2026 Kuantan Port: KP1/KP2 spurs under development; status at release, not surveyed track coordinates',surveyGeometry:false}),
 PORT_KEMAMAN:Object.freeze({url:'https://www.epicgroup.com.my/news/EPIC-Berhad-Drives-Pelabuhan-Kemaman-Expansion-Strengthening-Pelabuhan-Kemaman-As-Leading-Logistic-Centre',kind:'OFFICIAL_PORT_OPERATOR',revision:'25 Mar 2026 EPIC Kemaman expansion and ECRL spur reference; no loading-bay survey',surveyGeometry:false}),
 OSM_KERTEH:Object.freeze({url:'https://www.openstreetmap.org/way/537934577',kind:'COMMUNITY_RAILWAY_LANDUSE',revision:'OSM railway land-use area is not proof of ECRL track centreline, loading bay or as-built branch',surveyGeometry:false})
});
const PL=Object.freeze([
 ['PL01','ecrl-loop-historical-01','Pekan Sg. Tong','A','OWNER_HISTORICAL_CH'],
 ['PL02','ecrl-loop-historical-02','Bukit Payung','A','OWNER_HISTORICAL_CH'],
 ['PL03','ecrl-loop-historical-03','Felda Lepar','B','OWNER_HISTORICAL_CH'],
 ['PL04','ecrl-loop-historical-04','Kampung Alur Gading','B','OWNER_HISTORICAL_TRACK_LAYOUT_REVIEWED'],
 ['PL05','ecrl-loop-historical-05','Chenor','B','OWNER_HISTORICAL_TRACK_LAYOUT_REVIEWED'],
 ['PL06','ecrl-loop-historical-06','Lanchang','B','OWNER_HISTORICAL_CH'],
 ['PL07','ecrl-loop-historical-07','Alang Sedayu','C1','HISTORICAL_C1_DO_NOT_RELOCATE_TO_C2']
].map(([code,assetId,name,section,evidenceClass])=>Object.freeze({
 code,assetId,name,section,evidenceClass,placement:'LIST_ONLY_PENDING_GEOSPATIAL_VERIFICATION',
 point:null,geometry:null,verifiedTurnouts:0,verifiedPhysicalLoop:false,ownerCoordinateDisclosure:'AUTHENTICATED_ONLY',
 independentSurveyGeometry:false
})));
const SPURS=Object.freeze([
 ['KERTEH_PETRONAS','Kerteh / PETRONAS','ecrl-kerteh-petronas-loading-interface','Dungun–Kemasik corridor context','MRL_2023','OSM_KERTEH'],
 ['KEMAMAN_PORT','Kemaman Port','ecrl-port-kemaman','Kemasik–Chukai corridor context','MRL_2023','PORT_KEMAMAN'],
 ['KUANTAN_KP1','Kuantan Port KP1','ecrl-port-kuantan','Cherating–Kuantan Port City corridor context','MRL_2023','PORT_KUANTAN'],
 ['KUANTAN_KP2','Kuantan Port KP2','ecrl-port-kuantan','Cherating–Kuantan Port City corridor context','MRL_2023','PORT_KUANTAN'],
 ['TEMERLOH_KTMB','Temerloh KTMB freight interface',null,'Temerloh corridor context','PLAN_PEGTA_2025','MRL_2023'],
 ['NORTHPORT','Port Klang Northport','ecrl-port-northport','Jalan Kastam Section D context','MRL_2023','PLAN_PEGTA_2025'],
 ['WESTPORTS','Port Klang Westports','ecrl-port-westports','Jalan Kastam Section D context','MRL_2023','PLAN_PEGTA_2025']
].map(([code,name,existingReferenceAssetId,corridorContext,schemeSource,contextSource])=>Object.freeze({
 code,name,existingReferenceAssetId,corridorContext,schemeSource,contextSource,
 geometryStatus:'SCHEMATIC_ONLY',verifiedLine:null,verifiedTurnout:null,
 verifiedRailEndpoint:null,verifiedLoadingBay:null,verifiedTransitLane:null,
 verifiedCapacity:null,physicalConnectivityVerified:false,
 landParcelRoadResidentialAudit:'NOT_DONE',passengerRoutingEligible:false,
 referenceOnly:true
})));
if(PL.length!==7||SPURS.length!==7||new Set([...PL,...SPURS].map(x=>x.code)).size!==14)throw Error('ECRL_R2_REGISTER_CONFLICT');
const needs=Object.freeze(['approvedGeoreferencedLine','validatedSurveyDatum','assetEvidence','independentSourceReview','roadParcelExclusion','ownerReview']);
function placementReview(candidate){
 const reason=[];
 if(!candidate||typeof candidate!=='object')return Object.freeze({status:'BLOCKED_NO_SURVEY',reason:['MISSING_CANDIDATE'],readyForPublicMap:false});
 const g=candidate.geometry;
 if(g?.type!=='LineString'||!Array.isArray(g.coordinates)||g.coordinates.length<2||
 g.coordinates.length>10000||g.coordinates.some(p=>!Array.isArray(p)||p.length<2||p.length>3||
 !p.slice(0,2).every(Number.isFinite)||p[0]<99||p[0]>105||p[1]<1||p[1]>7)){
  reason.push('NO_VALID_WGS84_SURVEY_LINE');}
 if(candidate.crs!=='EPSG:4326'||candidate.datumValidated!==true)reason.push('DATUM_NOT_VERIFIED');
 if(candidate.evidenceClass!=='AS_BUILT_ENGINEERING_SURVEY'||candidate.asBuilt!==true||
 candidate.independentReview!==true||!/^https:\/\//.test(candidate.sourceUrl||'')||
 !candidate.revision||!candidate.sourceDocumentId)reason.push('NO_INDEPENDENT_ENGINEERING_PROVENANCE');
 if(candidate.ownerApproved!==true)reason.push('OWNER_APPROVAL_MISSING');
 if(candidate.railwayLandUseVerified!==true||candidate.roadParcelConflictChecked!==true||
 candidate.residentialParcelConflictChecked!==true||candidate.parcelConflictFree!==true)reason.push('LANDUSE_CLEARANCE_MISSING');
 if(candidate.assetId==null||(!PL.some(x=>x.assetId===candidate.assetId)&&
 !SPURS.some(x=>x.existingReferenceAssetId===candidate.assetId)))reason.push('UNKNOWN_ASSET_ID');
 // A successful automated gate is still NOT authority to install geometry on the consumer map.
 return Object.freeze({status:reason.length?'BLOCKED':'REVIEW_CANDIDATE_ONLY',
 reason:Object.freeze(reason),readyForPublicMap:false,
 requiresFinalIndependentGeometryQA:true,requiresOwnerPublishApproval:true});
}
function snapshot(){return Object.freeze({
 plCount:PL.length,spurCount:SPURS.length,approvedTrackLines:0,
 accuratePLPins:0,verifiedEndLanes:0,syntheticTracks:0,
 status:'EVIDENCE_REGISTRY_READY_GEOMETRY_PENDING',
 publishGate:'CLOSED_PENDING_AS_BUILT_INDEPENDENT_REVIEW',missing:needs
})}
const api=Object.freeze({version:'2.0.0',sources:SOURCES,passingLoops:PL,spurs:SPURS,placementReview,snapshot});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLAlignmentEvidence=api;
})(typeof window!=='undefined'?window:null);
