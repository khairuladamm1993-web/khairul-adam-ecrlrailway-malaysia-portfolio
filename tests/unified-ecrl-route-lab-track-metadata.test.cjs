'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const meta=require('../assets/unified-ecrl/route-lab-track-metadata.js');
test('ECRL MRL technical specification is not inferred from ORM orange styling',()=>{
 assert.equal(meta.ecrl.gaugeMm,1435);
 assert.equal(meta.ecrl.trackConfiguration,'SINGLE_TRACK_ON_DOUBLE_TRACK_FORMATION');
 assert.equal(meta.ecrl.electrification,'25KV_AC_PROJECT_SPEC');
 assert.equal(meta.ecrl.passengerSpeedReferenceKmh,160);
 assert.equal(meta.ecrl.freightSpeedReferenceKmh,80);
 assert.equal(meta.orm.mainlineOrange,'#FF8100');
 assert.equal(meta.orm.signifiesGauge,false);
 assert.equal(meta.orm.geometryFromRaster,false);
 assert.equal(meta.orm.canTrackTrain,false);
 assert(meta.source.url.startsWith('https://www.mida.gov.my/'));
});
test('gauge source tag conflict blocks train marker, missing tag stays unverified',()=>{
 assert.equal(meta.auditSegment({railway:'construction',gauge:'1435'}).status,'GAUGE_TAG_MATCHES_PROJECT_SPEC_NOT_SURVEYED');
 assert.equal(meta.auditSegment({railway:'rail',gauge:'1000'}).status,'GAUGE_CONFLICT_OR_MULTIPLE_VALUES');
 assert.equal(meta.auditSegment({railway:'rail'}).status,'GAUGE_TAG_MISSING_NEEDS_SOURCE_REVIEW');
 assert.equal(meta.auditSegment({railway:'rail',gauge:'1435;1000'}).gaugeCompatible,false);
 const good={status:'CONTINUOUS_CANDIDATE'},anchors={status:'INFERRED_CH_MATCH_ONLY'};
 assert.equal(meta.movementEligibility({assembly:good,matched:anchors,sourceTags:[{railway:'construction',gauge:'1000'}]}).trainingTrainPinAllowed,false);
 assert.equal(meta.movementEligibility({assembly:good,matched:anchors,sourceTags:[{railway:'construction',gauge:'1435'}]}).trainingTrainPinAllowed,true);
 assert.equal(meta.movementEligibility({assembly:{status:'GAPS_OR_BRANCHES'},matched:anchors}).trainingTrainPinAllowed,false);
 assert.equal(meta.movementEligibility({assembly:good,matched:{status:'ANCHORS_REQUIRE_REVIEW'}}).trainingTrainPinAllowed,false);
 assert.equal(meta.movementEligibility({assembly:good,matched:anchors}).officialSurveyAccepted,false);
});
test('raster layer cannot become a track geometry for simulation or other operator routes',()=>{
 const ui=fs.readFileSync('assets/unified-ecrl/route-lab-ui.js','utf8');
 assert(ui.includes('movementEligibility('));
 assert(ui.includes('eligible')===false || !ui.includes('eligibleForPublicRelease:true'));
 assert(ui.includes('trainingTrainPinAllowed'));
 assert(ui.includes('route-lab-rail-overlay.js')===false);
 const page=fs.readFileSync('ecrl-alignment-lab.html','utf8');
 assert(page.includes('route-lab-rail-overlay.js'));
 assert(page.includes('route-lab-track-metadata.js'));
 assert(page.includes('OpenRailwayMap')&&page.includes('1435')===false?true:page.includes('1,435'));
});
