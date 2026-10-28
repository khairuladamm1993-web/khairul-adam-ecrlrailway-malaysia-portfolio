/* ECRL Kerteh / PETRONAS reference:
   This is an OSM-mapped landuse=railway *area*, not a surveyed siding,
   cargo loading bay, railway end, or ECRL as-built track. */
(function(root){'use strict';
const sources=Object.freeze({
 OSM_KERTEH_RAILWAY_AREA:Object.freeze({
  url:'https://www.openstreetmap.org/way/537934577',
  mirror:'https://mapcarta.com/W537934577',
  revision:'OSM way 537934577, landuse=railway and operator=Petronas; area representative 4.56803 N, 103.43875 E, reviewed 29 October 2026. NOT an ECRL rail terminus or as-built track endpoint.',
  kind:'COMMUNITY_RAILWAY_LANDUSE_POLYGON_REFERENCE'
 }),
 PAHANG_LEGACY_KKRAIL:Object.freeze({
  url:'https://investpknp.gov.my/invest-in-pahang/infrastructure/the-kerteh-kemaman-kuantan-railroad/',
  revision:'Pahang investment reference describes historical 77-km Kerteh–Kemaman–Kuantan freight railway and Kerteh, Gebeng, Kuantan yards; current operations and ECRL conversion not verified.',
  kind:'GOVERNMENT_HISTORICAL_RAILWAY_CONTEXT'
 }),
 MRL_KERTEH_2023:Object.freeze({
  url:'https://www.mrl.com.my/wp-content/uploads/2023/05/ECRL-Alignment-1552023.pdf',
  revision:'MRL 2023 schematic shows Kerteh Spurline near Dungun/Kemasik; expressly NOT scaled geometry or surveyed terminal endpoint.',
  kind:'OFFICIAL_RAILWAY_SCHEMATIC'
 }),
 EIA_KERTEH_2017:Object.freeze({
  url:'https://govdocs.sinarproject.org/documents/ministry-of-natural-resources-and-environment/eia-reports/362980465-ecrl-volume-1-executive-summary.pdf',
  revision:'Historical 2017 EIA provisional 10.8-km Kerteh industrial spur; may not describe 2026 final scope or length.',
  kind:'HISTORICAL_PROVISIONAL_EIA'
 }),
 PETRONAS_KIPC_SITE:Object.freeze({
  url:'https://www.petronas.com/pgb/about-us/our-presence',
  revision:'PETRONAS Gas official industrial complex at KM 105 Jalan Kuantan–Kuala Terengganu, not a georeferenced rail-loading facility.',
  kind:'OFFICIAL_INDUSTRIAL_SITE_IDENTITY'
 })
});
const common=Object.freeze({
 section:'B',verificationStatus:'PARTIAL',serviceType:'FREIGHT',
 chainageStartKm:null,chainageEndKm:null,trackCount:null,
 railEndPoint:null,loadingBayPoint:null,transitLanePoint:null,
 proposedCargoLanePoint:null,physicalRailLineString:null,
 checkedAgainstRoadPolygon:false,checkedAgainstResidentialPolygon:false,
 independentlySurveyVerified:false,asBuilt2026Verified:false
});
const assets=Object.freeze([
 Object.freeze({...common,
  assetId:'ecrl-yard-kerteh-petronas',assetType:'HISTORICAL_RAIL_YARD_AREA',
  officialName:'Kerteh Railway Yard (PETRONAS)',operatorName:'PETRONAS (OSM community tag)',
  assetStatus:'RAILWAY_LANDUSE_MAPPED_ECRL_LINK_UNVERIFIED',
  sourceIds:Object.freeze(['OSM_KERTEH_RAILWAY_AREA','PAHANG_LEGACY_KKRAIL','MRL_KERTEH_2023','EIA_KERTEH_2017']),
  geometryType:'NONE',point:null,referencePoint:Object.freeze([103.43875,4.56803]),
  referenceKind:'OSM_HISTORICAL_RAILWAY_LANDUSE_AREA',
  referenceSourceId:'OSM_KERTEH_RAILWAY_AREA',
  referenceAccuracy:'AREA_REFERENCE_NOT_SURVEYED_NOT_TRACK_ENDPOINT',
  iconType:'SQUARE_RING_PENDING',
  notes:'OSM landuse=railway area around Kerteh. Land classification suggests railway land, but road/residential polygon conflict check, land suitability, cargo bay capacity, siding count, physical rail endpoint and ECRL as-built alignment are not verified. NOT an automatically approved loading bay.',
 }),
 Object.freeze({...common,
  assetId:'ecrl-kerteh-petronas-loading-interface',assetType:'INDUSTRIAL_FREIGHT_INTERFACE',
  officialName:'PETRONAS Kerteh — Loading / End Lane',
  operatorName:'PETRONAS industrial complex (exact rail operator TBD)',
  assetStatus:'HISTORICAL_OR_PROPOSED_RAIL_INTERFACE',
  sourceIds:Object.freeze(['PETRONAS_KIPC_SITE','MRL_KERTEH_2023','EIA_KERTEH_2017','PAHANG_LEGACY_KKRAIL']),
  geometryType:'NONE',point:null,referencePoint:null,
  referenceKind:'NONE',referenceSourceId:null,referenceAccuracy:'UNKNOWN',
  iconType:'FREIGHT_TERMINAL_PENDING',
  notes:'Conceptual Kerteh industrial loading/end-lane interface. No surveyed End of Line or loading-bay coordinate is available; DO NOT choose nearby roads, homes, refinery tanks, utilities, power infrastructure or unrelated land as a siding. No rail geometry is drawn.',
 })
]);
const logicalInterfaces=Object.freeze([
 Object.freeze({from:'ecrl-stn-06',to:'ecrl-yard-kerteh-petronas',
   relation:'KERTEH_SPURLINE_CORRIDOR_SCHEMATIC',status:'HISTORICAL_SCHEMATIC_ONLY',
   sourceIds:Object.freeze(['MRL_KERTEH_2023','EIA_KERTEH_2017']),
   physicalLineString:null,branchChainage:null,actualSpurLengthKm:null,
   note:'Dungun–Kemasik corridor context only; neither STN06 nor STN07 turnout position has been verified.'}),
 Object.freeze({from:'ecrl-yard-kerteh-petronas',to:'ecrl-kerteh-petronas-loading-interface',
   relation:'POTENTIAL_TERMINAL_ACCESS_NOT_AS_BUILT',status:'NO_GEOMETRY',
   sourceIds:Object.freeze(['OSM_KERTEH_RAILWAY_AREA','PETRONAS_KIPC_SITE']),
   physicalLineString:null,loadingBayPoint:null,transitLanePoint:null})
]);
const api=Object.freeze({version:'1.0.0',sources,assets,logicalInterfaces,physicalRailEndVerified:false});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLKertehFreight=api;
})(typeof window!=='undefined'?window:null);
