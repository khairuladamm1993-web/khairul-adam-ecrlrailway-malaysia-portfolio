'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d={window:{}};vm.createContext(d);vm.runInContext(read('assets/ecrl-gis-v1/data.js'),d);
const m=JSON.parse(read('assets/ecrl-gis-v1/integration-manifest.json'));
const D=d.window.MRS10ECRLGISV1,v7=read('assets/unified-v7-map.js'),v7html=read('unified-map-v7.html'),
app=read('assets/ecrl-gis-v1/app.js'),css=read('assets/ecrl-gis-v1/styles.css');
test('Owner-attested standalone Safari UAT recorded without claiming integrated QA',()=>{
 assert.equal(m.gate.ownerSafariUAT,'PASS_OWNER_REPORTED_5_OF_5_IPAD_2026-10-27');
 assert.equal(m.qaEvidence.ownerSafari.checksPassed,5);
 assert.equal(m.gate.integratedCandidateQA,'NOT_RUN');
});
test('Direct-import and production merge remain blocked in handoff manifest',()=>{
 assert.match(m.gate.unifiedIntegration,/NO_GO_DIRECT_IMPORT/);
 assert.match(m.integrationReadiness.decision,/NO_GO_DIRECT_UNIFIED_MERGE/);
 assert.ok(m.prohibitedMerges.includes('main'));
 assert.ok(m.integrationReadiness.doNotDirectImport.includes('assets/ecrl-gis-v1/app.js'));
});
test('Data namespaces do not overlap the V7 map-source prefix',()=>{
 assert.match(v7,/mrs10-v7-source-/);
 assert.match(v7,/mrs10-v7-/);
 assert.ok(!m.sourceId.startsWith('mrs10-v7-'));
 for(const id of m.layerIds)assert.ok(!id.startsWith('mrs10-v7-'));
});
test('Actual integration blockers are visible in existing standalone source',()=>{
 assert.match(v7,/new maplibregl\.Map/);
 assert.match(app,/new ML\.Map/);
 assert.match(app,/container:'ecrl-map'/);
 assert.match(css,/:root\{/);
 assert.match(css,/\.legend\{/);
 assert.doesNotMatch(v7html,/assets\/ecrl-gis-v1/);
});
test('No unverified locations can be promoted by any read-only handoff',()=>{
 assert.equal(D.stations.filter(s=>s.section==='C2'&&s.point).length,0);
 assert.equal(D.loops.filter(l=>l.point||l.verificationStatus==='CONFIRMED').length,0);
 assert.ok(D.segments.every(s=>s.geometry===null));
 assert.ok(D.facilities.filter(f=>f.section==='D').every(f=>f.point===null));
 assert.equal(m.verifiedPhysicalTrackSegments,0);
});
test('Approved Section D is not conflated with C2 or dual-gauge construction',()=>{
 const d=D.segments.find(s=>s.section==='D');
 assert.equal(d.trackArrangement,'SEPARATE_PARALLEL_STANDARD_AND_METRE_GAUGE');
 assert.equal(d.geometry,null);
 assert.equal(d.olderProposal,'SINGLE_DUAL_GAUGE_SUPERSEDED');
});
