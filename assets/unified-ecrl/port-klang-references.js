/* Port Klang independent maritime locality references.
 * Port Klang is NOT an ECRL station or verified ECRL spur endpoint.
 * Positions transcribed from Port Klang Authority Marine Handbook, facility grid references.
 */
(function(root){'use strict';
const source=Object.freeze({id:'PKA_MARINE_HANDBOOK',url:'https://www.pka.gov.my/phocadownload/Publication/MARINE%20HANDBOOK%20LPK.pdf',publisher:'Port Klang Authority',kind:'OFFICIAL_PORT_FACILITY_GRID_REFERENCE'});
const assets=Object.freeze([
 Object.freeze({assetId:'mrs10-port-klang-northport',officialName:'Port Klang — Northport',assetType:'PORT_REFERENCE',referencePoint:Object.freeze([101+22/60,3+1/60]),sourceId:source.id,sourceKind:'PORT_FACILITY_GRID_REFERENCE_NOT_RAIL',physicalRailEndPoint:null,railConnectionStatus:'UNVERIFIED'}),
 Object.freeze({assetId:'mrs10-port-klang-westports',officialName:'Port Klang — Westports',assetType:'PORT_REFERENCE',referencePoint:Object.freeze([101+18.5/60,2+57/60]),sourceId:source.id,sourceKind:'PORT_FACILITY_GRID_REFERENCE_NOT_RAIL',physicalRailEndPoint:null,railConnectionStatus:'UNVERIFIED'})
]);
const api=Object.freeze({source,assets,physicalRailGeometryVerified:false});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10PortKlangReferences=api;
})(typeof window!=='undefined'?window:null);
