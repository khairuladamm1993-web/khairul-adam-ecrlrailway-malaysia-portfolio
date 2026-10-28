/* P01 add-on: official general port-area reference points and source-backed
   conceptual freight interfaces. Never claim rail tracks, terminals, sidings,
   loading bays, turning lanes or end-of-line chainage are surveyed here. */
(function(root){'use strict';
const sources=Object.freeze({
 PORT_KUANTAN_LOC:Object.freeze({
  url:'https://investpknp.gov.my/invest-in-pahang/infrastructure/kuantan-port/',
  revision:'Official Pahang investment reference; broad port position 03°58 N, 103°26.4 E, not a rail terminal',
  kind:'PUBLIC_OFFICIAL_PORT_AREA'
 }),
 KPC_2026:Object.freeze({
  url:'https://www.kuantanport.com.my/zh/2026/02/09/',
  revision:'Kuantan Port Consortium 9 February 2026: KP1/KP2 ECRL spurs under construction; KP2 reported 80% then',
  kind:'PORT_OPERATOR_2026_PROGRESS'
 }),
 LP_KTN_2023:Object.freeze({
  url:'https://www.lpktn.gov.my/wp-content/uploads/2026/01/AR-LPKtn-2023.pdf',
  revision:'Kuantan Port Authority 2023 report published 2026: KP1 planned 2.7 km spur, KP2 planned 1 km spur; not as-built coordinates',
  kind:'PORT_AUTHORITY_INFRASTRUCTURE_SCHEME'
 }),
 PORT_KEMAMAN_LOC:Object.freeze({
  url:'https://www.lpkmn.gov.my/location/',
  revision:'Kemaman Port Authority location Tanjung Sulong, 04°15 N 103°28 E; broad port position only',
  kind:'PUBLIC_OFFICIAL_PORT_AREA'
 }),
 EPIC_2026:Object.freeze({
  url:'https://www.epicgroup.com.my/news/EPIC-Berhad-Drives-Pelabuhan-Kemaman-Expansion-Strengthening-Pelabuhan-Kemaman-As-Leading-Logistic-Centre',
  revision:'EPIC/Konsortium Pelabuhan Kemaman 25 March 2026: ECRL port spur and expanding storage/land reclamation',
  kind:'PORT_OPERATOR_2026_PROGRESS'
 }),
 EPIC_PLAN_2025:Object.freeze({
  url:'https://www.epicgroup.com.my/pdf/EPIC_Berhad_Corporate_Brochure_2025.pdf',
  revision:'EPIC 2025 brochure p.7: future reclamation and ECRL spur concept; no track-end coordinates',
  kind:'PORT_OPERATOR_SCHEMATIC'
 }),
 MRL_2024_SCHEME:Object.freeze({
  url:'https://www.mida.gov.my/wp-content/uploads/2024/06/Slides-MRL.pdf',
  revision:'MRL 13 June 2024 corridor scheme p.6 identifies Kemaman and Kuantan Port City spurlines; schematic only',
  kind:'PROJECT_SCHEMATIC'
 })
});
const unverifiedTerminals=Object.freeze([
 Object.freeze({code:'KP1',name:'Kuantan Port 1',plannedSpurLengthKm:2.7,connectionStatus:'UNDER_CONSTRUCTION_REPORTED',trackEndPoint:null,loadingBayPoint:null,transitLanePoint:null,trackCount:null,independentTrackGeometryVerified:false}),
 Object.freeze({code:'KP2',name:'Kuantan Port 2',plannedSpurLengthKm:1.0,connectionStatus:'UNDER_CONSTRUCTION_REPORTED',trackEndPoint:null,loadingBayPoint:null,transitLanePoint:null,trackCount:null,independentTrackGeometryVerified:false})
]);
const assets=Object.freeze([
 Object.freeze({
  assetId:'ecrl-port-kuantan',assetType:'PORT_INTERFACE',officialName:'Kuantan Port',
  operatorName:'Kuantan Port Consortium Sdn Bhd',section:'B',
  assetStatus:'SPURLINE_UNDER_CONSTRUCTION_REPORTED',verificationStatus:'PARTIAL',serviceType:'FREIGHT',
  sourceIds:Object.freeze(['PORT_KUANTAN_LOC','KPC_2026','LP_KTN_2023','MRL_2024_SCHEME']),
  geometryType:'NONE',point:null,referencePoint:Object.freeze([103.44,3.966666667]),
  referenceKind:'PUBLIC_OFFICIAL_PORT_AREA_ONLY',referenceSourceId:'PORT_KUANTAN_LOC',
  referenceAccuracy:'PORT_AREA_CENTROID_UNSURVEYED_NOT_TRACK_ENDPOINT',iconType:'PORT_REFERENCE',
  portTerminals:unverifiedTerminals,trackCount:null,chainageStartKm:null,chainageEndKm:null,
  railTrackEndPoint:null,freightLoadBayPoint:null,transitLanePoint:null,
  notes:'Official port locality coordinate, not proved inside a rail loading yard. Separate KP1 and KP2 ECRL spurs are under construction per operator 2026 release. Rail end, cargo loading bay, second transit lane and as-built geometry remain UNKNOWN.'
 }),
 Object.freeze({
  assetId:'ecrl-port-kemaman',assetType:'PORT_INTERFACE',officialName:'Kemaman Port',
  operatorName:'Konsortium Pelabuhan Kemaman Sdn Bhd (EPIC)',section:'B',
  assetStatus:'SPURLINE_DEVELOPMENT_REPORTED',verificationStatus:'PARTIAL',serviceType:'FREIGHT',
  sourceIds:Object.freeze(['PORT_KEMAMAN_LOC','EPIC_2026','EPIC_PLAN_2025','MRL_2024_SCHEME']),
  geometryType:'NONE',point:null,referencePoint:Object.freeze([103.466666667,4.25]),
  referenceKind:'PUBLIC_OFFICIAL_PORT_AREA_ONLY',referenceSourceId:'PORT_KEMAMAN_LOC',
  referenceAccuracy:'PORT_AREA_CENTROID_UNSURVEYED_NOT_TRACK_ENDPOINT',iconType:'PORT_REFERENCE',
  portTerminals:Object.freeze([Object.freeze({
   code:'KEMAMAN_PORT_ECRL',name:'Kemaman Port cargo spur interface',
   connectionStatus:'PORT_EXPANSION_ECRL_SPURLINE_REPORTED',
   trackEndPoint:null,loadingBayPoint:null,transitLanePoint:null,trackCount:null,
   independentTrackGeometryVerified:false
  })]),
  trackCount:null,chainageStartKm:null,chainageEndKm:null,
  railTrackEndPoint:null,freightLoadBayPoint:null,transitLanePoint:null,
  notes:'Official Tanjung Sulong port locality coordinate only. EPIC identifies ECRL spurline and future reclaimed land; no source-verified terminal end track, turning/transit siding or loading bay coordinate.'
 })
]);
const logicalInterfaces=Object.freeze([
 Object.freeze({assetId:'ecrl-port-kuantan',interface:'KUANTAN_PORT_SPURLINE',corridorContext:'Cherating / Kuantan Port City',physicalLineString:null,trackEndGeometry:null,sourceIds:['KPC_2026','MRL_2024_SCHEME'],status:'SCHEMATIC_ONLY'}),
 Object.freeze({assetId:'ecrl-port-kemaman',interface:'KEMAMAN_PORT_SPURLINE',corridorContext:'Kemasik / Chukai',physicalLineString:null,trackEndGeometry:null,sourceIds:['EPIC_2026','MRL_2024_SCHEME'],status:'SCHEMATIC_ONLY'})
]);
const api=Object.freeze({sources,assets,logicalInterfaces,version:'1.0.0',physicalTrackGeometryVerified:false});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10ECRLPortReferences=api;
})(typeof window!=='undefined'?window:null);
