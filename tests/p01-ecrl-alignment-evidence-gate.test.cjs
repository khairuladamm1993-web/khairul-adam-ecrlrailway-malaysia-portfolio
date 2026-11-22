'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validateAlignment}=require('../scripts/p01-ecrl-alignment-evidence-gate.cjs');
const a=[102.5,4.1],b=[102.499,4.099],c=[102.498,4.098];
const feature=(start,end,coords)=>({type:'Feature',properties:{chainageStartMetres:start,chainageEndMetres:end},geometry:{type:'LineString',coordinates:coords}});
const sample=()=>({type:'FeatureCollection',metadata:{crs:'EPSG:4326',source:'Test fixture only',license:'Test fixture',accuracyMetres:5,approvedForUse:true},features:[feature(1000,2000,[a,b]),feature(2000,3000,[b,c])]});
test('valid connected candidate remains CANDIDATE_ONLY, never VERIFIED',()=>{const r=validateAlignment(sample());assert.equal(r.status,'CANDIDATE_ONLY');assert.deepEqual(r.errors,[]);assert.deepEqual(r.coverageMetres,[1000,3000]);});
test('rejects absent provenance and authorization',()=>{const v=sample();v.metadata={};const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.ok(r.errors.length>=4);});
test('rejects missing route and invalid GeoJSON',()=>{assert.equal(validateAlignment(null).status,'REJECTED');assert.equal(validateAlignment({type:'FeatureCollection',features:[]}).status,'REJECTED');});
test('rejects CH gaps and geographic discontinuities',()=>{const v=sample();v.features[1]=feature(2100,3000,[[102.497,4.098],c]);const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.match(r.errors.join(' '),/gap\/overlap/);assert.match(r.errors.join(' '),/discontinuity/);});
test('rejects reversed chainage, invalid coordinate and degenerate line',()=>{const v=sample();v.features=[feature(3000,2000,[a,b]),feature(2000,3000,[[0,0],b]),feature(3000,4000,[c,c])];const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.match(r.errors.join(' '),/monotonic/);assert.match(r.errors.join(' '),/invalid WGS84/);assert.match(r.errors.join(' '),/degenerate/);});

test('rejects impossible straight-line distance for declared chainage span',()=>{const v=sample();v.features=[feature(1000,1010,[[102.5,4.1],[102.4,4.0]])];const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.match(r.errors.join(' '),/endpoint separation exceeds chainage span/);});
test('allows sub-metre join tolerance while rejecting larger discontinuities',()=>{const v=sample();v.features[1].geometry.coordinates[0]=[102.499004,4.099];assert.equal(validateAlignment(v).status,'CANDIDATE_ONLY');v.features[1].geometry.coordinates[0]=[102.4991,4.099];assert.equal(validateAlignment(v).status,'REJECTED');});

test('rejects long zigzag even when endpoints are close',()=>{const v=sample();v.features=[feature(1000,1200,[[102.5,4.1],[102.49,4.1],[102.5,4.1]])];const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.match(r.errors.join(' '),/polyline distance exceeds chainage span/);});
test('rejects invalid CRS and metadata self-approval absent',()=>{const v=sample();v.metadata.crs='EPSG:3857';v.metadata.approvedForUse=false;const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.match(r.errors.join(' '),/EPSG:4326/);assert.match(r.errors.join(' '),/approvedForUse/);});

test('rejects repeated adjacent coordinates inside otherwise valid line',()=>{const v=sample();v.features=[feature(1000,2000,[a,b,b,c])];const r=validateAlignment(v);assert.equal(r.status,'REJECTED');assert.match(r.errors.join(' '),/repeated adjacent coordinate/);});
