/* Public educational ECRL intelligence. Coordinates are LOCALITY REFERENCES, never surveyed railway asset locations. */
(function(g){'use strict';
const sources=Object.freeze({
 MOT_D25:{url:'https://www.mot.gov.my/my/Kenyataan%20Media/Tahun%202025/%28MOT%29%20KENYATAAN%20MEDIA%20-%20KABINET%20LULUS%20PERUBAHAN%20SKOP%20PEMBINAAN%20LANDASAN%20SEKSYEN%20D%20PROJEK%20ECRL%20.pdf',revision:'17 February 2025 Cabinet-approved Section D scope change',kind:'OFFICIAL_APPROVED_SCOPE'},
 MRL24:{url:'https://www.mida.gov.my/wp-content/uploads/2024/06/Slides-MRL.pdf',revision:'MRL presentation 13 June 2024, station classification and technical overview',kind:'OFFICIAL_PUBLIC_PRESENTATION'},
 MRL23:{url:'https://www.mrl.com.my/wp-content/uploads/2023/05/ECRL-Alignment-1552023.pdf',revision:'2023 schematic alignment',kind:'SCHEMATIC_REFERENCE'},
 C2_25:{url:'https://www.mrl.com.my/wp-content/uploads/2025/12/Plan-Profile.pdf',revision:'October 2025 revised C2 proposed Puncak Alam freight yard',kind:'SCHEMATIC_REFERENCE'},
 SEL:{url:'https://dewan.selangor.gov.my/question/projek-landasan-keretapi-pantai-timur-ecrl-5/',revision:'Selangor public assembly C2 scheme record',kind:'PUBLIC_OFFICIAL_RECORD'},
 SEL_STN:{url:'https://dewan.selangor.gov.my/question/projek-ecrl-2/',revision:'Selangor public assembly station record',kind:'PUBLIC_OFFICIAL_RECORD'},
 MIDA:{url:'https://www.mida.gov.my/ecrl-overview/',revision:'ECRL overview',kind:'PROJECT_OVERVIEW'},
 MRL_PROGRESS:{url:'https://www.mrl.com.my/wp-content/uploads/2025/10/Kenyataan-Media-Projek-ECRL-Memperkasa-Kontraktor-Bumiputera-Gred-G1-dan-G2-Final-v1.pdf',revision:'September 2025 project progress release',kind:'PROJECT_PROGRESS'},
 EIA17:{url:'https://govdocs.sinarproject.org/documents/ministry-of-natural-resources-and-environment/eia-reports/east-coast-rail-link-phase-2-project/4-ecrl-phase-2-eia-chapter-1-3.pdf',revision:'2017 historical Phase 2 EIA, Table 1-2 planned station coordinates; not confirmed current C2 sites',kind:'HISTORICAL_EIA_PLANNING'},
 PKA22:{url:'https://www.pka.gov.my/phocadownload/Publication/MARINE%20HANDBOOK%20LPK.pdf',revision:'Port Klang Authority Marine Information Handbook, 27 September 2022; maritime port facility grid locations, NOT ECRL track',kind:'OFFICIAL_PORT_AREA'},
 DOE_D26:{url:'https://edl.doe.gov.my/overview/59192',revision:'Department of Environment, 19 October 2026, ongoing public exhibition of Section D EIA',kind:'OFFICIAL_EIA_PUBLIC_EXHIBITION'},
 LEGACY:{url:'https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/blob/feature/mrs10-p01-unified-v7-ktm-no-shuttle-timur/assets/corridor-reference.js',revision:'MR-S10 V7 historical public reference',kind:'HISTORICAL_NOT_SURVEY'}
});
const defs=[
 ['Kota Bharu','A',6.05136,102.23264,'PASSENGER_FREIGHT'],
 ['Pasir Puteh','A',5.80648,102.36769,'PASSENGER'],
 ['Jerteh','A',5.70102,102.48321,'PASSENGER'],
 ['Bandar Permaisuri','A',5.52084,102.73814,'PASSENGER'],
 ['Kuala Terengganu','A',5.17328,103.09777,'PASSENGER'],
 ['Dungun','A',4.73388,103.38748,'PASSENGER_FREIGHT'],
 ['Kemasik','B',4.50287,103.42200,'PASSENGER_FREIGHT'],
 ['Chukai','B',4.24895,103.38249,'PASSENGER_FREIGHT'],
 ['Cherating','B',4.15156,103.37487,'PASSENGER'],
 ['Kuantan Port City','B',3.96685,103.34673,'PASSENGER_FREIGHT'],
 ['Kota SAS','B',3.86503,103.29351,'PASSENGER'],
 ['Paya Besar','B',3.74690,103.12168,'PASSENGER_FREIGHT'],
 ['Maran','B',3.54089,102.66381,'PASSENGER'],
 ['Temerloh','B',3.44351,102.31911,'PASSENGER_FREIGHT'],
 ['Bentong','C1',3.47825,101.91328,'PASSENGER'],
 ['ITT Gombak','C1',3.23169,101.72284,'PASSENGER'],
 ['Serendah Baru','C2',null,null,'PASSENGER_FREIGHT'],
 ['Puncak Alam','C2',null,null,'FUTURE_PASSENGER'],
 ['Kapar','C2',null,null,'FUTURE_PASSENGER'],
 ['Jalan Kastam (Port Klang)','C2',null,null,'PASSENGER_FREIGHT']
];
const revisedService=Object.freeze({
 'Kota Bharu':'PASSENGER','Pasir Puteh':'PASSENGER_FREIGHT','Jerteh':'PASSENGER','Bandar Permaisuri':'PASSENGER',
 'Kuala Terengganu':'PASSENGER','Dungun':'PASSENGER_FREIGHT','Kemasik':'PASSENGER','Chukai':'PASSENGER_FREIGHT',
 'Cherating':'PASSENGER','Kuantan Port City':'PASSENGER_FREIGHT','Kota SAS':'PASSENGER',
 'Paya Besar':'PASSENGER_FREIGHT','Maran':'PASSENGER_FREIGHT','Temerloh':'PASSENGER_FREIGHT',
 'Bentong':'PASSENGER_FREIGHT','ITT Gombak':'PASSENGER','Serendah Baru':'PASSENGER_FREIGHT',
 'Puncak Alam':'UNKNOWN','Kapar':'FUTURE_PASSENGER','Jalan Kastam (Port Klang)':'UNKNOWN'
});
const clean=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// Historical 2017 EIA station proposals are only optional reference points. Current station geometry stays null.
const historicEIA17=Object.freeze({
 'Serendah Baru':Object.freeze([101.588711111,3.364425]),
 'Puncak Alam':Object.freeze([101.411783333,3.248697222]),
 'Kapar':Object.freeze([101.394405556,3.125]),
 'Jalan Kastam (Port Klang)':Object.freeze([101.403291667,3.015322222])
});
const stations=Object.freeze(defs.map(([name,section,lat,lon,serviceType],i)=>Object.freeze({
 assetId:'ecrl-stn-'+String(i+1).padStart(2,'0'),assetType:'STATION',officialName:name,alternativeNames:name==='Serendah Baru'?['Bandar Serendah']:[],section,serviceType:revisedService[name],
 sourceIds:section==='C2'?['MRL23','MRL24','SEL','SEL_STN','EIA17']:['MRL23','MRL24','SEL_STN'],
 chainageStartKm:null,chainageEndKm:null,chainageDatum:null,trackCount:null,
 assetStatus:'PLANNED_NOT_OPERATIONAL',verificationStatus:['Puncak Alam','Jalan Kastam (Port Klang)'].includes(name)?'SOURCE_CONFLICT':section==='C2'?'PARTIAL':'CONFIRMED',
 point:lat!==null?[lon,lat]:null,geometryType:lat!==null?'LOCALITY_REFERENCE_POINT':'NONE',
  referencePoint:historicEIA17[name]||null,referenceSourceId:historicEIA17[name]?'EIA17':null,
  referenceKind:historicEIA17[name]?'HISTORICAL_EIA2017_PROPOSED_STATION':'NONE',referenceAccuracy:historicEIA17[name]?'HISTORICAL_PLAN_NOT_2026_AS_BUILT':'NONE',
 geometryProvenance:lat!==null?'LEGACY_PUBLIC_LOCALITY_REFERENCE':'NO_PUBLIC_ASSET_GIS',
 coordinateReferenceSystem:lat!==null?'EPSG:4326':null,sourceId:lat!==null?'LEGACY':null,
 conflicts:name==='Puncak Alam'?[{field:'serviceType',sourceIds:['SEL','MRL24'],reason:'Official Selangor passenger/future station designation versus MRL 2024 passenger+freight designation; 2025 proposed freight yard is a separate asset.'}]:name==='Jalan Kastam (Port Klang)'?[{field:'serviceType',sourceIds:['SEL_STN','MRL24'],reason:'Selangor government passenger+freight designation versus MRL 2024 passenger-only slide.'}]:[],
 geometryAccuracy:'NOT_ASSET_SURVEY',iconType:'STATION_CIRCLE',stationOrder:i+1,
 notes:section==='C2'?'C2 station identity is official; the separately displayed planning reference is from a 2017 EIA and may NOT represent the revised/current station site.':'Station designation confirmed; plotted position is only historical public locality reference.',
 speed:{designPassengerKmh:null,designFreightKmh:null,permittedKmh:null,approachKmh:null,throughKmh:null,curveKmh:null,tsr:null}
})));
const loops=Object.freeze([
 ['Pekan Sg. Tong','A'],['Bukit Payung','A'],['Felda Lepar','B'],['Kampung Alur Gading','B'],
 ['Chenor','B'],['Lanchang','B'],['Alang Sedayu','C1']
].map(([name,section],i)=>Object.freeze({
 assetId:'ecrl-loop-historical-'+String(i+1).padStart(2,'0'),
 assetType:'HISTORICAL_PL_DESIGNATION',officialName:null,historicalName:name,section,
 sourceIds:['LEGACY'],verificationStatus:'PENDING_VALIDATION',assetStatus:'UNVERIFIED_CONNECTION',
 crossingFacilityStatus:'PENDING_VALIDATION',point:null,geometryType:'NONE',
 iconType:'SQUARE_RING_PENDING',chainageStartKm:null,chainageEndKm:null,
 notes:'MR-S10 historical PL label only; no independently verified passing-loop layout or geospatial feature. Not rendered as a point.'
})));
const facilities=Object.freeze([
 {assetId:'ecrl-yard-puncak-alam',assetType:'FREIGHT_YARD',officialName:'Puncak Alam Freight Yard',section:'C2',assetStatus:'PROPOSED_OFFICIAL',verificationStatus:'CONFIRMED',sourceIds:['C2_25'],geometryType:'SCHEMATIC_REFERENCE',point:null,focusReferenceAssetId:'ecrl-stn-18',iconType:'FREIGHT_YARD',notes:'October 2025 proposed revised C2 railway scheme; not an operating yard.'},
 {assetId:'ecrl-port-northport',assetType:'PORT_INTERFACE',officialName:'Northport',section:'D',assetStatus:'PLANNED_CONNECTION',verificationStatus:'PARTIAL',sourceIds:['MOT_D25','MRL23','MIDA','PKA22','DOE_D26'],geometryType:'NONE',point:null,referencePoint:Object.freeze([101.366666667,3.016666667]),referenceKind:'PORT_FACILITY_AREA_PKA22',referenceSourceId:'PKA22',referenceAccuracy:'MARITIME_FACILITY_NOT_RAIL_TERMINUS',iconType:'FREIGHT_YARD',notes:'Section D (25 km): separate new ECRL standard-gauge and retained KTMB metre-gauge tracks; no verified physical railway geometry. Pin is PKA maritime port area, not an ECRL railway terminal. Section D EIA public exhibition began October 2026.'},
 {assetId:'ecrl-port-westports',assetType:'PORT_INTERFACE',officialName:'Westports',section:'D',assetStatus:'PLANNED_CONNECTION',verificationStatus:'PARTIAL',sourceIds:['MOT_D25','MRL23','MIDA','PKA22','DOE_D26'],geometryType:'NONE',point:null,referencePoint:Object.freeze([101.308333333,2.95]),referenceKind:'PORT_FACILITY_AREA_PKA22',referenceSourceId:'PKA22',referenceAccuracy:'MARITIME_FACILITY_NOT_RAIL_TERMINUS',iconType:'FREIGHT_YARD',notes:'Section D (25 km): separate new ECRL standard-gauge and retained KTMB metre-gauge tracks; no verified physical railway geometry. Pin is PKA maritime port area, not an ECRL railway terminal. Section D EIA public exhibition began October 2026.'},
 {assetId:'ecrl-depot-gombak-north',assetType:'DEPOT',officialName:'Gombak North EMU Depot',section:'C1',assetStatus:'PENDING_VALIDATION',verificationStatus:'PENDING_VALIDATION',sourceIds:['LEGACY'],geometryType:'NONE',point:null,notes:'Historical MR-S10 depot record; no public surveyed point.'},
 {assetId:'ecrl-depot-kuantan',assetType:'DEPOT',officialName:'Kuantan Port City Depot',section:'B',assetStatus:'PENDING_VALIDATION',verificationStatus:'PENDING_VALIDATION',sourceIds:['LEGACY'],geometryType:'NONE',point:null,notes:'Historical MR-S10 depot record; no public surveyed point.'},
 {assetId:'ecrl-tunnel-gombak',assetType:'TUNNEL',officialName:'Gombak Tunnel',section:'C1',assetStatus:'CONSTRUCTION_REFERENCE',verificationStatus:'PARTIAL',sourceIds:['SEL'],geometryType:'NONE',point:null,notes:'Published tunnel-work references only; portal coordinates, length and track arrangement not verified.'}
].map(o=>Object.freeze({...o,chainageStartKm:null,chainageEndKm:null,trackCount:null})));
const topology=Object.freeze([
 {from:'ecrl-stn-16',to:'ecrl-stn-17',relation:'PLANNED_CONNECTION',status:'PARTIAL'},
 {from:'ecrl-stn-17',to:'ecrl-stn-18',relation:'PLANNED_CONNECTION',status:'PARTIAL'},
 {from:'ecrl-stn-18',to:'ecrl-stn-19',relation:'PLANNED_CONNECTION',status:'PARTIAL'},
 {from:'ecrl-stn-19',to:'ecrl-stn-20',relation:'PLANNED_CONNECTION',status:'PARTIAL'},
 {from:'ecrl-stn-20',to:'ecrl-port-northport',relation:'FREIGHT_INTERFACE',status:'PARTIAL'},
 {from:'ecrl-stn-20',to:'ecrl-port-westports',relation:'FREIGHT_INTERFACE',status:'PARTIAL'},
 {from:'ecrl-stn-18',to:'ecrl-yard-puncak-alam',relation:'PLANNED_CONNECTION',status:'PARTIAL'}
].map(o=>Object.freeze(o)));
const segments=Object.freeze([{segmentId:'ecrl-c2-scheme',section:'C2',from:'ITT Gombak',to:'Jalan Kastam (Port Klang)',geometry:null,
 geometryType:'SCHEMATIC_REFERENCE',chainageStartKm:null,chainageEndKm:null,trackGaugeMm:1435,trackCount:null,
 designSpeedKmh:null,maximumPermittedSpeedKmh:null,stationApproachSpeedKmh:null,stationThroughSpeedKmh:null,tsr:null,
 sourceIds:['MRL23','SEL','C2_25'],verificationStatus:'PARTIAL'},
 {segmentId:'ecrl-d-port-access',section:'D',from:'Jalan Kastam (Port Klang)',to:'Northport / Westports',
 geometry:null,geometryType:'SCHEMATIC_REFERENCE',chainageStartKm:null,chainageEndKm:null,
 schemeLengthKm:25,trackGaugeMm:1435,ktmbMetreGaugeMm:1000,trackCount:2,
 trackArrangement:'SEPARATE_PARALLEL_STANDARD_AND_METRE_GAUGE',olderProposal:'SINGLE_DUAL_GAUGE_SUPERSEDED',
 designSpeedKmh:null,maximumPermittedSpeedKmh:null,stationApproachSpeedKmh:null,stationThroughSpeedKmh:null,tsr:null,
 sourceIds:['MOT_D25','MRL23'],verificationStatus:'PARTIAL'}]);
g.MRS10ECRLGISV1=Object.freeze({version:'1.1.0',sources,stations,loops,facilities,segments,topology,
 schemeSpeedReference:Object.freeze({passengerKmh:160,freightKmh:80,sourceId:'MIDA',scope:'PROJECT_LEVEL_ONLY'}),
 schemeTechnicalReference:Object.freeze({gaugeMm:1435,electrificationVolts:25000,trackFormation:'SINGLE_TRACK_ON_DOUBLE_TRACK_FORMATION',sourceId:'MRL24',scope:'PROJECT_LEVEL_SCHEME_NOT_SEGMENT_SURVEY'}),
 geometryPolicy:'REFERENCE_POINTS_ONLY_NO_PHYSICAL_TRACK'});
})(window);
