'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {audit, provenanceGate, buildEvidenceRequests} = require('../scripts/p01-ecrl-gap-coverage-audit.cjs');
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

test('disconnected source features do not imply traversable linework',()=>{
 const r=audit(fc([candidate(1,4)]),fc([detailed([1,2]),detailed([3,4])]));
 assert.equal(r.rows[0].same_way_source_graph_connected,false);
 assert.equal(r.rows[0].source_component_node_count,2);
 assert.equal(r.summary.graph_connected,0);
});
test('shared source node establishes graph reachability, not survey approval',()=>{
 const r=audit(fc([candidate(1,4)]),fc([detailed([1,2,3]),detailed([3,4])]));
 assert.equal(r.rows[0].same_way_source_graph_connected,true);
 assert.equal(r.summary.graph_connected,1);
 assert.equal(r.summary.promoted,0);
 assert.equal(r.rows[0].decision,'HOLD_NOT_ACCEPTED');
});
test('graph connectivity never bridges separate OSM way IDs',()=>{
 const other={type:'Feature',properties:{osm_way_id:8,source_node_ids:[2,3]}};
 const r=audit(fc([candidate(1,4)]),fc([detailed([1,2]),other,detailed([3,4])]));
 assert.equal(r.rows[0].same_way_source_graph_connected,false);
});

test('evidence requests identify missing endpoint and retain HOLD',()=>{
 const r=audit(fc([candidate(1,2)]),fc([detailed([1,3])]));
 const req=buildEvidenceRequests(r);
 assert.equal(req.length,1);
 assert.deepEqual(req[0].missing_endpoint_node_ids,['2']);
 assert.deepEqual(req[0].endpoint_node_ids,['1','2']);
 assert.equal(req[0].decision,'HOLD_PENDING_NEW_SOURCE');
 assert.equal(req[0].evidence_needed.length,4);
});
test('disconnected endpoint pairs request linework even if both endpoints exist',()=>{
 const r=audit(fc([candidate(1,4)]),fc([detailed([1,2]),detailed([3,4])]));
 const req=buildEvidenceRequests(r);
 assert.deepEqual(req[0].missing_endpoint_node_ids,[]);
 assert.equal(req[0].source_graph_connected,false);
});
test('evidence request generator rejects missing audit input',()=>{
 assert.throws(()=>buildEvidenceRequests(null),/Audit rows required/);
});

test('construction railway tag is evidence context, never operational approval',()=>{
 const c=candidate(1,2,{raw_osm_tags:{railway:'construction',construction:'rail',tunnel:'yes'}});
 const r=audit(fc([c]),fc([detailed([1,2])]));
 assert.equal(r.rows[0].source_railway_tag,'construction');
 assert.equal(r.rows[0].source_tunnel_tag,'yes');
 assert.equal(r.rows[0].operational_evidence_status,'NOT_VERIFIED_FROM_OSM_TAGS');
 assert.equal(buildEvidenceRequests(r)[0].operational_evidence_status,'NOT_VERIFIED_FROM_OSM_TAGS');
 assert.equal(r.summary.promoted,0);
});
test('missing OSM tags cannot imply an operational railway',()=>{
 const r=audit(fc([candidate(1,2)]),fc([detailed([1,2])]));
 assert.equal(r.rows[0].source_railway_tag,null);
 assert.equal(r.rows[0].operational_evidence_status,'NOT_VERIFIED_FROM_OSM_TAGS');
});

test('malformed OSM way and endpoint identifiers fail closed',()=>{
 for(const bad of [null,'',0,'abc','-12']){
  assert.throws(()=>audit(fc([candidate(bad,2)]),fc([])),/Invalid candidate/);
  assert.throws(()=>audit(fc([candidate(1,bad)]),fc([])),/Invalid candidate/);
 }
 assert.throws(()=>audit(fc([candidate(1,2,{osm_way_id:'invalid'})]),fc([])),/Invalid candidate/);
});

test('incomplete or malformed detailed node sequences fail closed',()=>{
 for(const nodes of [[],[1],[1,null],[1,'bad'],[0,2]]){
  assert.throws(()=>audit(fc([candidate(1,2)]),fc([detailed(nodes)])),/source_node_ids/);
 }
});
