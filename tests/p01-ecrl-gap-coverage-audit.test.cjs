'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {audit, provenanceGate} = require('../scripts/p01-ecrl-gap-coverage-audit.cjs');
const fc = features => ({type:'FeatureCollection',features});
const candidate = (a,b,flags={}) => ({type:'Feature',properties:{osm_way_id:7,original_adjacent_osm_nodes:[a,b],approved_alignment:false,do_not_use_for_train_movement:true,...flags}});
const detailed = nodes => ({type:'Feature',properties:{osm_way_id:7,source_node_ids:nodes}});
test('one missing endpoint remains HOLD',()=>{
 const r=audit(fc([candidate(1,2)]),fc([detailed([1,3])]));
 assert.equal(r.summary.one_endpoint,1);assert.equal(r.summary.promoted,0);assert.equal(r.rows[0].decision,'HOLD_NOT_ACCEPTED');
});
test('endpoints in separate features are not connected',()=>{
 const r=audit(fc([candidate(1,2)]),fc([detailed([1,3]),detailed([4,2])]));
 assert.equal(r.summary.both_separate,1);assert.equal(r.summary.same_feature,0);
});
test('even adjacent nodes do not auto-promote',()=>{
 const r=audit(fc([candidate(1,2)]),fc([detailed([1,2])]));
 assert.equal(r.summary.adjacent,1);assert.equal(r.summary.promoted,0);
});
test('reject candidate with unsafe approval flags',()=>{
 assert.throws(()=>audit(fc([candidate(1,2,{approved_alignment:true})]),fc([])),/Unsafe approval/);
});
test('reject missing node provenance',()=>{
 assert.throws(()=>audit(fc([candidate(1,2)]),fc([{type:'Feature',properties:{osm_way_id:7}}])),/Missing source_node_ids/);
});

test('missing provenance stays HOLD and forbids redistribution',()=>{
 const g=provenanceGate(undefined);
 assert.equal(g.status,'HOLD_NOT_VERIFIED');
 assert.equal(g.missing.length,6);
 assert.equal(g.redistributionAllowed,false);
 assert.equal(g.eligibleForAutomaticPromotion,false);
});
test('complete self-declared provenance never automatically verifies geometry',()=>{
 const g=provenanceGate({sourceId:'source',sourceRevision:'v1',coordinateReferenceSystem:'EPSG:4326',license:'restricted',chainageDatum:'datum',independentControlReference:'control',redistributionApproved:true});
 assert.deepEqual(g.missing,[]);
 assert.equal(g.redistributionAllowed,true);
 assert.equal(g.eligibleForAutomaticPromotion,false);
 assert.equal(g.status,'HOLD_NOT_VERIFIED');
});
test('candidate output carries fail-closed provenance status',()=>{
 const r=audit(fc([candidate(1,2)]),fc([detailed([1,2])]));
 assert.equal(r.rows[0].provenance.status,'HOLD_NOT_VERIFIED');
 assert.equal(r.rows[0].decision,'HOLD_NOT_ACCEPTED');
});

test('matching source revision and snapshot are reported, not promoted',()=>{
 const c=candidate(1,2,{rechecked_way_version:3,source_snapshot:'2026-11-05T23:25:19Z'});
 const d=detailed([1,3]);d.properties.rechecked_way_version=3;d.properties.source_snapshot='2026-11-05T23:25:19Z';
 const r=audit(fc([c]),fc([d]));
 assert.equal(r.rows[0].source_revision_match,true);
 assert.equal(r.rows[0].source_snapshot_match,true);
 assert.equal(r.summary.promoted,0);
});
test('source revision mismatch is explicit and remains HOLD',()=>{
 const c=candidate(1,2,{rechecked_way_version:3,source_snapshot:'a'});
 const d=detailed([1,3]);d.properties.rechecked_way_version=4;d.properties.source_snapshot='a';
 const r=audit(fc([c]),fc([d]));
 assert.equal(r.rows[0].source_revision_match,false);
 assert.equal(r.rows[0].decision,'HOLD_NOT_ACCEPTED');
});
test('source snapshot mismatch is explicit and remains HOLD',()=>{
 const c=candidate(1,2,{rechecked_way_version:3,source_snapshot:'a'});
 const d=detailed([1,3]);d.properties.rechecked_way_version=3;d.properties.source_snapshot='b';
 const r=audit(fc([c]),fc([d]));
 assert.equal(r.rows[0].source_snapshot_match,false);
 assert.equal(r.summary.promoted,0);
});

test('missing detailed revision is UNKNOWN, not a verified match or mismatch',()=>{
 const c=candidate(1,2,{rechecked_way_version:7,source_snapshot:'a'});
 const d=detailed([1,3]);d.properties.source_snapshot='a';
 const r=audit(fc([c]),fc([d]));
 assert.equal(r.rows[0].source_revision_comparable,false);
 assert.equal(r.rows[0].source_revision_match,null);
 assert.equal(r.rows[0].source_snapshot_match,true);
 assert.equal(r.rows[0].decision,'HOLD_NOT_ACCEPTED');
});
