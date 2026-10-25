/* MR-S10 R2.19 | Isolated LRT Ampang Line service catalogue.
 * Operator shared infrastructure: Sentul Timur - Chan Sow Lin; branch to Ampang.
 * Model identity levels separately: service / station / platform / track / way / route.
 * Station positions are schematic service order, NOT railway geometry.
 */
(function(root){
 'use strict';
 const sourceUrls=Object.freeze({
  "operator": "https://www.prasarana.com.my/mobiliti/the-nations-first-lrt-line/",
  "operatorMap": "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
  "researchMap": "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
  "stationList": "https://mrt.com.my/lrt_ampang/index.htm",
  "operatorSwitch": "https://myrapid.com.my/kemas-kini-laluan-ampang-sri-petaling-29/",
  "osmPublicTransport": "https://wiki.openstreetmap.org/wiki/Public_transport",
  "osmRoute": "https://wiki.openstreetmap.org/wiki/Relation:route"
});
 const officialServiceColor=Object.freeze({
   category:'OPERATOR_MAP_COLOR_FAMILY_CONFIRMED',
   label:'Orange / Oren',officialHex:'UNVERIFIED',
   // MR-S10 accessible design tokens; NOT exact operator hex measurements.
   light:'#A65100',dark:'#FFBB7B',marker:'#A65100',
   scope:'PASSENGER_SERVICE_AND_STATION_REFERENCE_ONLY',
   alignmentColorAllowed:false
 });
 const rawStations=[
  {
    "id": "mrs10-lrt-ampang-ag1",
    "name": "Sentul Timur",
    "order": 1,
    "serviceCode": "AG1",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag2",
    "name": "Sentul",
    "order": 2,
    "serviceCode": "AG2",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag3",
    "name": "Titiwangsa",
    "order": 3,
    "serviceCode": "AG3",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag4",
    "name": "PWTC",
    "order": 4,
    "serviceCode": "AG4",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag5",
    "name": "Sultan Ismail",
    "order": 5,
    "serviceCode": "AG5",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag6",
    "name": "Bandaraya",
    "order": 6,
    "serviceCode": "AG6",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": {
      "with": [
        "ktm-komuter"
      ],
      "type": "PEDESTRIAN_CONNECTION",
      "sourceUrl": "https://www.prasarana.com.my/mobiliti/the-nations-first-lrt-line/"
    },
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag7",
    "name": "Masjid Jamek",
    "order": 7,
    "serviceCode": "AG7",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": {
      "with": [
        "lrt-kelana-jaya"
      ],
      "type": "PASSENGER_INTERCHANGE",
      "sourceUrl": "https://www.prasarana.com.my/mobiliti/the-nations-first-lrt-line/"
    },
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag8",
    "name": "Plaza Rakyat",
    "order": 8,
    "serviceCode": "AG8",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag9",
    "name": "Hang Tuah",
    "order": 9,
    "serviceCode": "AG9",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag10",
    "name": "Pudu",
    "order": 10,
    "serviceCode": "AG10",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag11",
    "name": "Chan Sow Lin",
    "order": 11,
    "serviceCode": "AG11",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang",
      "lrt-sri-petaling"
    ],
    "sharedPassengerService": true,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag12",
    "name": "Miharja",
    "order": 12,
    "serviceCode": "AG12",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag13",
    "name": "Maluri",
    "order": 13,
    "serviceCode": "AG13",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag14",
    "name": "Pandan Jaya",
    "order": 14,
    "serviceCode": "AG14",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag15",
    "name": "Pandan Indah",
    "order": 15,
    "serviceCode": "AG15",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag16",
    "name": "Cempaka",
    "order": 16,
    "serviceCode": "AG16",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag17",
    "name": "Cahaya",
    "order": 17,
    "serviceCode": "AG17",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  },
  {
    "id": "mrs10-lrt-ampang-ag18",
    "name": "Ampang",
    "order": 18,
    "serviceCode": "AG18",
    "codeEvidence": "OPERATOR_SCHEMATIC_REPRODUCED_IN_2023_RESEARCH_MAP_SECONDARY_CROSSCHECK",
    "codeIsTrackId": false,
    "serviceIds": [
      "lrt-ampang"
    ],
    "sharedPassengerService": false,
    "interchangeEvidence": null,
    "stationConfidence": "SERVICE_SEQUENCE_CROSSCHECKED",
    "sourceUrls": [
      "https://myrapid.com.my/wp-content/uploads/2021/07/28102018_Transit-Map.pdf",
      "https://easts.info/on-line/proceedings/vol.14/pdf/PP3803.pdf",
      "https://mrt.com.my/lrt_ampang/index.htm"
    ],
    "poiSourceAttributes": null,
    "poiMatchStatus": "UNVERIFIED",
    "geometry": null,
    "geometryStatus": "UNVERIFIED",
    "platforms": [],
    "physicalTrackIds": [],
    "railwayWayIds": [],
    "routeRelationIds": [],
    "physicalTrackStatus": "UNVERIFIED"
  }
];
 const stations=Object.freeze(rawStations.map(s=>Object.freeze({
  ...s,serviceIds:Object.freeze(s.serviceIds),platforms:Object.freeze(s.platforms),
  physicalTrackIds:Object.freeze(s.physicalTrackIds),
  railwayWayIds:Object.freeze(s.railwayWayIds),
  routeRelationIds:Object.freeze(s.routeRelationIds),
  sourceUrls:Object.freeze(s.sourceUrls),
  interchangeEvidence:s.interchangeEvidence?Object.freeze(s.interchangeEvidence):null
 })));
 const route=Object.freeze({
  id:'lrt-ampang',name:'LRT Ampang Line',operator:'Rapid Rail / Rapid KL',
  lineNumber:3,fromStationId:stations[0].id,toStationId:stations[17].id,
  stationCount:18,serviceIds:Object.freeze(['lrt-ampang']),
  stationSequence:Object.freeze(stations.map(s=>s.id)),
  sharedServiceSection:Object.freeze({
   fromStationId:stations[0].id,toStationId:stations[10].id,stationCount:11,
   withServiceId:'lrt-sri-petaling',
   classification:'SHARED_PASSENGER_SERVICE_AND_INFRASTRUCTURE',
   trackCount:'UNVERIFIED',geometry:null,railwayWayIds:Object.freeze([]),
   sourceUrl:sourceUrls.operator
  }),
  branch:Object.freeze({
   serviceDivergenceAt:'Chan Sow Lin',ampangContinuationTo:'Ampang',
   separatePassengerService:'lrt-sri-petaling',otherTerminus:'Putra Heights',
   physicalJunctionGeometry:'UNVERIFIED',turnoutIds:Object.freeze([]),
   sourceUrl:sourceUrls.operator
  }),
  visualIdentity:officialServiceColor,sourceUrls:Object.freeze([
   sourceUrls.operator,sourceUrls.operatorMap,sourceUrls.researchMap,sourceUrls.stationList
  ]),
  serviceAdjacencies:Object.freeze(stations.slice(1).map((s,i)=>Object.freeze({
   fromStationId:stations[i].id,toStationId:s.id,relation:'CONSECUTIVE_SERVICE_STOPS',
   physicalTrackId:null,railwayWayId:null,routeRelationId:null,geometry:null
  }))),
  physicalAlignmentStatus:'UNVERIFIED',geometry:null,railwayWayIds:Object.freeze([]),
  acceptedOsmRouteRelations:Object.freeze([]),acceptedPhysicalTrackWays:Object.freeze([])
 });
 // Candidate is NOT a verified vector POI, and must NOT be rendered in orange.
 // Require explicit evidence registry before an exact source label is accepted.
 const observedPoiCrosswalk=Object.freeze([]);
 function normalise(raw){return typeof raw==='string'?raw.trim().replace(/\s+/g,' '):''}
 function candidatePoi(props){
  if(!props||props.class!=='railway'||!['station','subway'].includes(props.subclass))return null;
  const raw=normalise(props.name);
  const match=/^AG(1[0-8]|[1-9])\s+(.+)$/.exec(raw);
  if(!match)return null;
  const code='AG'+Number(match[1]),s=stations.find(x=>x.serviceCode===code);
  if(!s||match[2]!==s.name)return null;
  const en=normalise(props['name:en']||props.name_en);
  if(en&&en!==s.name&&en!==raw)return null;
  return Object.freeze({stationId:s.id,stationName:s.name,code,
   classification:'UNVERIFIED_CARTOGRAPHIC_CANDIDATE_NOT_ALLOWED_FOR_HIGHLIGHT',
   evidence:null,geometry:null,physicalTrackId:null});
 }
 function verifiedPoi(props){
  const c=candidatePoi(props);
  if(!c)return null;
  const cross=observedPoiCrosswalk.find(x=>x.raw===normalise(props.name));
  return cross&&cross.stationId===c.stationId&&cross.verificationStatus==='SOURCE_VERIFIED'
   ?Object.freeze({...c,classification:'EXACT_SOURCE_VERIFIED_STATION_POI',evidence:cross.evidence}):null;
 }
 function validate(){
  if(stations.length!==18||route.stationSequence.length!==18||route.serviceAdjacencies.length!==17)return false;
  if(stations[0].name!=='Sentul Timur'||stations[17].name!=='Ampang')return false;
  if(stations.filter(s=>s.sharedPassengerService).length!==11)return false;
  if(stations.some((s,i)=>s.order!==i+1||s.serviceCode!=='AG'+(i+1)||
   s.id!==route.stationSequence[i]||s.geometry!==null||s.physicalTrackIds.length||
   s.railwayWayIds.length||s.routeRelationIds.length||s.physicalTrackStatus!=='UNVERIFIED'))return false;
  if(route.serviceAdjacencies.some((a,i)=>a.fromStationId!==stations[i].id||
   a.toStationId!==stations[i+1].id||a.geometry!==null||a.physicalTrackId!==null))return false;
  return route.geometry===null&&route.acceptedPhysicalTrackWays.length===0&&
   officialServiceColor.alignmentColorAllowed===false;
 }
 function stationByCode(code){return stations.find(s=>s.serviceCode===code)||null}
 const api=Object.freeze({sourceUrls,officialServiceColor,stations,route,validate,stationByCode,
  candidatePoi,verifiedPoi,observedPoiCrosswalk});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10AmpangR219=api;
})(typeof window!=='undefined'?window:null);
