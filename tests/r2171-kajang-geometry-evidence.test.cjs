'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../assets/railway-track-registry-kl.js');
const source=fs.readFileSync(path.join(__dirname,'../assets/map-language-lab.js'),'utf8');
test('R2.17.1: only operator-verified 29-station service topology is authoritative; physical railway still absent',()=>{
 const r=api.findRoute('mrt-kajang'),a=api.osmRelationAudit;
 assert.equal(r.stationSequence.length,29);
 assert.equal(r.serviceAdjacencies.length,28);
 assert.equal(r.geometry,null);
 assert.equal(r.geometryStatus,'UNVERIFIED');
 assert.equal(r.physicalTrackStatus,'UNVERIFIED');
 assert.equal(a.verifiedPhysicalTracks,0);
 assert.equal(a.acceptedGeometry,null);
 assert.deepEqual([...a.acceptedRelationIds],[]);
 assert.deepEqual([...a.acceptedWayIds],[]);
 assert.equal(api.catalog.physicalSegments.length,0);
 assert(api.validateRegistry(),'previous 29-station Registry must remain valid');
});
test('R2.17.1: every external OSM candidate is identifiable and explicitly nonaccepted',()=>{
 const a=api.osmRelationAudit;
 assert.deepEqual([...a.relationCandidateIds],['8000326']);
 assert.deepEqual([...a.wayCandidateIds],['778403716']);
 assert.equal(a.candidates.length,2);
 const rel=a.candidates.find(c=>c.type==='relation'),way=a.candidates.find(c=>c.type==='way');
 assert.equal(rel.id,'8000326');
 assert.equal(rel.source,'WIKIDATA_P402_UNREFERENCED');
 assert.equal(rel.osmUrl,'https://www.openstreetmap.org/relation/8000326');
 assert.equal(way.id,'778403716');
 assert.equal(way.source,'GEOVIEW_OSM_DERIVED_SNAPSHOT');
 assert.equal(way.snapshotDate,'2025-07-14');
 for(const c of a.candidates){
  assert.match(c.status,/UNVERIFIED/);
  assert.equal(c.geometry,null);assert.equal(c.topologyVerified,false);
  assert.deepEqual([...c.memberWayIds],[]);
  assert.match(c.sourceUrl,/^https:\/\//);
  assert.match(c.osmUrl,/^https:\/\/www\.openstreetmap\.org\//);
  assert(Object.isFrozen(c),'candidates are read-only');
 }
 assert.equal(a.currentStatus,'OSM_CANDIDATES_FOUND_GEOMETRY_AND_MEMBERSHIP_UNVERIFIED');
});
test('R2.17.1: third-party GIS route layer and official route length cannot certify OSM physical ways',()=>{
 const a=api.osmRelationAudit,g=a.externalGeometryLayerCandidates[0],o=a.operatorAlignmentContext;
 assert.equal(g.layerIndex,15);
 assert.equal(g.status,'DISCOVERED_SCHEMA_ONLY');
 assert.equal(g.geometry,null);assert.equal(g.topologyVerified,false);assert.equal(g.licenseVerified,false);
 assert.equal(o.sourceUrl,'https://www.mymrt.com.my/projects/kajang-line/');
 assert.equal(o.publishedServiceLengthKm,46);
 assert.equal(o.undergroundKm,9.5);
 assert.equal(o.stations,29);
 assert.equal(o.geometry,null);
 assert.equal(o.status,'OPERATOR_AGGREGATE_ONLY');
 assert(a.evidenceGates.includes('SEPARATE_KTM_AND_NON_KAJANG_RAIL_INFRASTRUCTURE'));
});
test('R2.17.1: the 29 green registry stations and two source-backed POI accents remain; do not paint physical track',()=>{
 assert.equal(api.findRoute('mrt-kajang').visualIdentity.light,'#087D43');
 assert.equal(api.findRoute('mrt-kajang').visualIdentity.physicalAlignmentStatus,'UNVERIFIED');
 assert.match(source,/mrl-kajang-known-poi/);
 assert.match(source,/KG16 Pasar Seni/);
 assert.match(source,/KG35 Kajang/);
 assert.doesNotMatch(source,/mrl-kajang-alignment/);
 assert.doesNotMatch(source,/mrl-kajang-physical-line/);
 assert.match(source,/syncKajangPoiHighlights/);
});
test('R2.17.1: candidate metadata cannot silently mutate into approval',()=>{
 const a=api.osmRelationAudit;
 assert(Object.isFrozen(a));assert(Object.isFrozen(a.candidates));
 assert(Object.isFrozen(a.acceptedWayIds));
 assert.throws(()=>a.acceptedWayIds.push('778403716'),TypeError);
 assert.throws(()=>a.candidates[0].status='VERIFIED',TypeError);
 assert.equal(a.acceptedWayIds.length,0);
});
