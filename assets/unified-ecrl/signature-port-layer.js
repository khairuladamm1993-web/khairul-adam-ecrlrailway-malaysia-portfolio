/* MR-S10 Signature Map: source-backed port/freight reference layer.
 * A purple reference icon is NOT a surveyed end-of-spurline marker.
 * No physical rail geometry is emitted by this module.
 */
(function(root){'use strict';
const kuantan=typeof module==='object'&&module.exports?require('./port-references.js'):root.MRS10ECRLPortReferences;
const kerteh=typeof module==='object'&&module.exports?require('./kerteh-freight-reference.js'):root.MRS10ECRLKertehFreight;
const isPair=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=-180&&p[0]<=180&&p[1]>=-90&&p[1]<=90;
function references(){
 const entries=[...(kuantan?.assets||[]),...(kerteh?.assets||[])];
 return Object.freeze(entries.map(a=>Object.freeze({
  id:a.assetId,name:a.officialName,kind:a.assetType,
  markerStyle:'MR_S10_PURPLE_REFERENCE',markerMeaning:'AREA_REFERENCE_NOT_RAIL_ENDPOINT',
  coordinates:isPair(a.referencePoint)?Object.freeze([...a.referencePoint]):null,
  verification:a.verificationStatus||'UNVERIFIED',
  geometryStatus:'NO_VERIFIED_RAIL_ENDPOINT',physicalLineString:null,
  sourceIds:Object.freeze([...(a.sourceIds||[])]),
  sourceRegistry:a.assetId.startsWith('ecrl-yard')||a.assetId.startsWith('ecrl-kerteh')?'kerteh-freight-reference':'port-references'
 })));
}
const api=Object.freeze({version:'1.0.0',references,physicalRailGeometryVerified:false,
  legend:'Purple = port/freight area reference; NOT a surveyed end of spurline'});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10SignaturePortLayer=api;
})(typeof window!=='undefined'?window:null);
