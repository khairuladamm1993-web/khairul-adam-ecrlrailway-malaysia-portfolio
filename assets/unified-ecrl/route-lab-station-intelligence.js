/* Source-backed ECRL STN01 intelligence, not a surveyed station track plan.
 * Never infer platform arrangement/coordinates of a surveyed asset from locality. */
(function(root){'use strict';
const rows=root.MRS10ECRLChainage?.records||[],gis=root.MRS10ECRLGISV1||{};
function getStation(code){
 const c=rows.find(x=>x.code===code);if(!c||!code.startsWith('STN'))return null;
 const station=gis.stations?.find(x=>x.assetId===c.assetId);if(!station)return null;
 const sourceIds=station.sourceIds||[];
 return Object.freeze({
   code,assetId:c.assetId,displayName:station.officialName,CH:c.metres,CHLabel:'CH'+String(Math.floor(c.metres/1000)).padStart(3,'0')+'+'+String(c.metres%1000).padStart(3,'0'),
   section:station.section,services:station.serviceType,assetStatus:station.assetStatus,
   verificationStatus:station.verificationStatus,trackGaugeMm:gis.schemeTechnicalReference?.gaugeMm??null,
   electrificationVolts:gis.schemeTechnicalReference?.electrificationVolts??null,
   trackFormation:gis.schemeTechnicalReference?.trackFormation||'UNKNOWN',
   referencePoint:station.point?Object.freeze(station.point.slice(0,2)):null,
   referenceKind:station.point?'LEGACY_LOCALITY_NOT_SURVEYED_STATION_COORDINATE':'NONE',
   exactStationLocation:null,
   verifiedTrackLayout:null,verifiedPlatformCount:null,verifiedTurnouts:null,
   verifiedPassingLoop:null,verifiedElevation:null,verifiedTunnelRefs:[],
   verifiedBridgeRefs:[],verifiedOperationalSpeedKmh:null,
   sourceIds,sourceLinks:sourceIds.map(id=>gis.sources?.[id]?.url).filter(Boolean),
   sourceGeometry:'MR_S10_PUBLIC_LOCALITY_REFERENCE',
   chainageDatum:c.datum,simulationReviewed:false,asBuiltSurveyVerified:false,
   stationPassengerPublicOperation:'NOT_CONFIRMED',
   nextCheckpointCode:rows[rows.indexOf(c)+1]?.code||null
 });
}
const api=Object.freeze({getStation,initial:()=>getStation('STN01')});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLStationIntelligence=api;
})(typeof window!=='undefined'?window:null);
