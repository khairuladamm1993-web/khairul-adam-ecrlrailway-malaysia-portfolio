/* MR-S10 R2.16.2 — strictly non-operational, source-backed KL railway infrastructure audit.
 * No track geometry, way IDs, turnout identifiers, chainage or platform lanes are inferred.
 */
(function(root){
 'use strict';
 const references=Object.freeze({
  operatorCurrent:'https://www.mymrt.com.my/projects/kajang-line/',
  stationList:'https://www.mymrt.com.my/ms/ruang-acara/kajang/',
  osmInfrastructure:'https://wiki.openstreetmap.org/wiki/Open_Rail_Map',
  osmRouteTypes:'https://wiki.openstreetmap.org/wiki/OpenRailwayMap/Tagging'
 });
 const categories=Object.freeze([
  Object.freeze({id:'passenger-service',meaning:'29 published Kajang Line station stops; their 28 adjacent pairs are service sequence only.',
   source:'MRT Corp',status:'OPERATOR_SERVICE_ORDER_CONFIRMED',
   count:28,physicalIdentity:false}),
  Object.freeze({id:'train-route-relation',meaning:'OSM passenger service route relation, if retrieved and independently checked.',
   osmTag:'route=subway',status:'NOT_RETRIEVED',count:0,physicalIdentity:false}),
  Object.freeze({id:'railway-route-relation',meaning:'OSM mainline track route relation, if independently validated against the service.',
   osmTag:'route=railway',status:'NOT_RETRIEVED',count:0,physicalIdentity:false}),
  Object.freeze({id:'physical-railway-way',meaning:'A surveyed or separately source-verified OSM railway way is a physical geometry candidate, never inferred from screen colour.',
   osmTag:'railway=*',status:'NOT_RETRIEVED',count:0,physicalIdentity:true})
 ]);
 const requirements=Object.freeze([
  'Obtain stable OSM element type and ID from a verifiable HTTPS OpenStreetMap element link.',
  'Read raw element tags and full geometry from source; do not trace pixels or raster map tiles.',
  'Verify railway category, lifecycle, direction, connections and current physical existence; do not infer from route colour.',
  'Keep separate station/platform/stop objects and attach only with independently checked topological relationships.',
  'Reconcile operator 29-stop service sequence with OSM passenger route relation; route service pairs are not lane counts.',
  'Review each physical way against date-stamped evidence and record reviewer, provenance, conflicts and verification time.',
  'Do not publish field-sensitive track IDs, precise engineering chainage, signalling or safety-critical operating instructions without appropriate authority.'
 ]);
 const audit=Object.freeze({
  schema:'mrs10-kl-infrastructure-evidence/1',
  version:'R2.16.2',
  region:'Kuala Lumpur / Klang Valley — MRT Kajang pilot',
  checkedOn:'2026-10-26',
  reference:references,
  verifiedServiceFacts:Object.freeze({
   source:'MRT Corp Kajang Line overview',
   operatorStationCount:29,first:'Kwasa Damansara',last:'Kajang',
   operatorPublishedLineKm:46,operatorUndergroundStations:7,operatorElevatedStations:22,
   consecutivePassengerStopPairs:28
  }),
  sourceModelCategories:categories,
  acceptanceRequirements:requirements,
  sourceExtracts:Object.freeze([]),
  candidateTrackWays:Object.freeze([]),
  verifiedPhysicalWays:Object.freeze([]),
  matchedServiceRouteRelations:Object.freeze([]),
  verifiedPhysicalStationConnections:Object.freeze([]),
  status:'PHYSICAL_DATA_NOT_RETRIEVED_OR_VALIDATED',
  warning:'29 stations and 28 adjacent service stops do not imply 28 physical tracks or a complete alignment. Not for operations.'
 });
 function validate(a=audit){
  if(!a||a.schema!==audit.schema||a.status!=='PHYSICAL_DATA_NOT_RETRIEVED_OR_VALIDATED')return false;
  const names=['sourceExtracts','candidateTrackWays','verifiedPhysicalWays','matchedServiceRouteRelations','verifiedPhysicalStationConnections'];
  if(names.some(k=>!Array.isArray(a[k])||a[k].length!==0))return false;
  if(a.verifiedServiceFacts?.operatorStationCount!==29||
     a.verifiedServiceFacts?.consecutivePassengerStopPairs!==28||
     a.verifiedServiceFacts?.operatorUndergroundStations + a.verifiedServiceFacts?.operatorElevatedStations!==29)return false;
  if(!a.sourceModelCategories?.every((x)=> x.id==='passenger-service'?x.count===28&&!x.physicalIdentity:
     x.count===0&&x.status==='NOT_RETRIEVED'))return false;
  return a.acceptanceRequirements?.length>=6 && Object.values(a.reference||{}).every(u=>typeof u==='string'&&u.startsWith('https://'));
 }
 const api=Object.freeze({audit,validate});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MRS10KLPhysicalAudit=api;
})(typeof window!=='undefined'?window:null);
