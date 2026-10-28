'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../assets/unified-ecrl/route-lab-geometry-lineage.js');
const line=(properties={})=>({type:'Feature',properties,geometry:{type:'LineString',coordinates:[[103.4,4.5],[103.41,4.51]]}});
test('OSM-derived rail model remains ODbL after removing OpenRailwayMap raster',()=>{
 const g={type:'FeatureCollection',source:'OpenStreetMap ODbL',features:[line({railway:'construction',sourceRef:'OSM way 537934577',gauge:'1435'})]};
 const v=P.inspect(g,{ownerReviewed:true,simulationQAPassed:true});
 assert.equal(v.includesOSM,true);
 assert.equal(v.datasetClass,'OSM_DERIVED_CANDIDATE');
 assert.equal(v.railwaySimulationStatus,'OWNER_SIMULATION_REVIEWED');
 assert.equal(v.officialSurveyVerified,false);
 assert.equal(v.publicReleaseAllowed,false);
 assert.equal(v.consumerRasterSource,'NONE_REQUIRED');
 assert.equal(v.attribution,'© OpenStreetMap contributors · ODbL 1.0');
 assert.match(v.licenseUrl,/odbl/);
});
test('independent licensed dataset can be isolated from OSM, but not auto-published',()=>{
 const g={features:[line({source:'Independent Survey R1',independentSurvey:true,
 publicRedistributionLicensed:true,rightsHolder:'Example Authority',licenseUrl:'https://example.test/licence'})]};
 const v=P.inspect(g);
 assert.equal(v.datasetClass,'INDEPENDENT_LICENSED_CANDIDATE');
 assert.equal(v.includesOSM,false);
 assert.equal(v.publicReleaseAllowed,false);
 assert.equal(v.attribution,null);
});
test('unknown, restricted and mixed geometry cannot be silently converted to proprietary MR-S10',()=>{
 const unknown=P.inspect({features:[line({source:'Unknown private map'})]});
 assert.equal(unknown.provenanceComplete,false);
 const restricted=P.inspect({features:[line({source:'confidential restricted engineering sheet'})]});
 assert.equal(restricted.hasRestricted,true);
 const mixed=P.inspect({source:'OSM',features:[line({source:'OpenStreetMap'}),line({source:'confidential site track'})]});
 assert.equal(mixed.hasRestricted,true);
 assert.equal(mixed.publicReleaseAllowed,false);
});
test('exported local model handoff excludes raw geometry, exact anchors and Owner notes',()=>{
 const g={type:'FeatureCollection',source:'OpenStreetMap',features:[line({sourceRef:'osm/test/1'})],anchors:[{code:'STN01',coordinates:[103.43789,4.58123]}]};
 const s={trainId:'D102-SIM',currentCH:33700,origin:'STN01',destination:'STN17',
 reviews:[{code:'STN02',note:'private owner location confidential'}],
 events:[{type:'SIM_CHECKPOINT',code:'STN02',time:'2026-10-29T01:00:00Z'}]};
 const m=P.packageCandidate(g,s);
 const serialized=JSON.stringify(m);
 assert.equal(m.consumerMapUsesOpenRailwayMap,false);
 assert.equal(m.geometryReadyForConsumer,false);
 assert.equal(m.publicReleaseAllowed,false);
 assert.equal(m.geometryInventory.featureCount,1);
 assert.equal(m.lineage.includesOSM,true);
 assert(!serialized.includes('103.43789'));
 assert(!serialized.includes('private owner location'));
 assert(!serialized.includes('coordinates'));
 assert(!serialized.includes('OpenRailwayMap raster'));
});
test('browser page keeps visible source attribution and linked lineage module',()=>{
 const html=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 assert(html.includes('route-lab-geometry-lineage.js'));
 assert(ui.includes('packageCandidate('));
 assert(ui.includes('geometryLineage:'));
 assert(!ui.includes('fetch(\'https://www.openrailwaymap.org'));
});
