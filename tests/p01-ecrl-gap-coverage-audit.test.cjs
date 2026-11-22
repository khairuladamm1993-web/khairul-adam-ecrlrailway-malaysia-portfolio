'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {audit} = require('../scripts/p01-ecrl-gap-coverage-audit.cjs');
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
