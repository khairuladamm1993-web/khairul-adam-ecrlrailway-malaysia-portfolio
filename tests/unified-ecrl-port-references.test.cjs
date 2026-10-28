'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {JSDOM}=require('jsdom'),ports=require('../assets/unified-ecrl/port-references.js');
const w={};for(const f of ['assets/unified-ecrl/source/data.js','assets/unified-ecrl/source/i18n.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:w});
const adapter=require('../assets/unified-ecrl/adapter.js').create(w.MRS10ECRLGISV1,w.MRS10ECRLI18N);
test('two official area anchors, with four maritime references total, never rail ends',()=>{
 assert.equal(ports.assets.length,2);assert.equal(adapter.assets.length,35);
 assert.equal(adapter.refs.length,24);assert.equal(adapter.snapshot().referenceKinds.MARITIME,4);
 assert.deepEqual(adapter.refs.filter(r=>r.kind==='MARITIME').map(r=>r.assetId),[
  'ecrl-port-northport','ecrl-port-westports','ecrl-port-kuantan','ecrl-port-kemaman']);
 for(const a of ports.assets){
  const ref=adapter.reference(a.assetId);assert(ref);assert.equal(ref.kind,'MARITIME');
  assert.equal(ref.sourceId,a.referenceSourceId);
  assert.equal(a.referenceKind,'PUBLIC_OFFICIAL_PORT_AREA_ONLY');
  assert.equal(a.railTrackEndPoint,null);assert.equal(a.freightLoadBayPoint,null);
  assert.equal(a.transitLanePoint,null);assert.equal(a.trackCount,null);
  assert.equal(a.chainageStartKm,null);assert.equal(a.chainageEndKm,null);
  assert.equal(a.geometryType,'NONE');
  assert.equal(adapter.features().features.find(f=>f.id===a.assetId).geometry.type,'Point');
  assert.equal(adapter.features().features.find(f=>f.id===a.assetId).properties.geometryVerification,'REFERENCE_ONLY');
  assert(adapter.registry.sources[a.referenceSourceId]?.url.startsWith('https://'));
 }
 assert.equal(adapter.snapshot().physicalSegments,0);
 assert(w.MRS10ECRLGISV1.facilities.length===6);
});
test('Kuantan KP1/KP2 remain separate concepts with unverified tracks',()=>{
 const a=adapter.get('ecrl-port-kuantan');
 assert.equal(a.operatorName,'Kuantan Port Consortium Sdn Bhd');
 assert.equal(a.portTerminals.length,2);
 assert.deepEqual(a.portTerminals.map(t=>t.code),['KP1','KP2']);
 assert.deepEqual(a.portTerminals.map(t=>t.plannedSpurLengthKm),[2.7,1]);
 assert(a.portTerminals.every(t=>t.trackEndPoint===null&&t.loadingBayPoint===null&&t.transitLanePoint===null&&!t.independentTrackGeometryVerified));
 const b=adapter.get('ecrl-port-kemaman');
 assert.match(b.operatorName,/Konsortium Pelabuhan Kemaman/);
 assert.equal(b.portTerminals[0].trackEndPoint,null);
 assert.equal(b.portTerminals[0].independentTrackGeometryVerified,false);
 assert.equal(ports.logicalInterfaces.length,2);
 assert(ports.logicalInterfaces.every(x=>x.physicalLineString===null&&x.trackEndGeometry===null&&x.status==='SCHEMATIC_ONLY'));
});
test('published official coordinates only, not exact road or yard location',()=>{
 const k=adapter.reference('ecrl-port-kemaman').coordinates;
 const q=adapter.reference('ecrl-port-kuantan').coordinates;
 assert(Math.abs(k[0]-103.466666667)<1e-6);assert(Math.abs(k[1]-4.25)<1e-6);
 assert(Math.abs(q[0]-103.44)<1e-6);assert(Math.abs(q[1]-3.966666667)<1e-6);
 assert.equal(adapter.get('ecrl-port-kuantan').referenceAccuracy,'PORT_AREA_CENTROID_UNSURVEYED_NOT_TRACK_ENDPOINT');
 assert.equal(adapter.get('ecrl-port-kemaman').referenceAccuracy,'PORT_AREA_CENTROID_UNSURVEYED_NOT_TRACK_ENDPOINT');
 assert(!adapter.registry.sources.KPC_2026.revision.includes('as-built coordinates'));
});
test('compact consumer intelligence keeps marine provenance and pending loading bay within engineering details',()=>{
 const dom=new JSDOM('<!doctype html><body><section id="ecrl-controls"></section><section id="ecrl-assets"></section></body>',{url:'https://preview.invalid/'});
 const browser=dom.window;vm.runInNewContext(fs.readFileSync('assets/unified-ecrl/integration-ui.js','utf8'),{window:browser,document:browser.document});
 let locale='ms';const ui=browser.MRS10ECRLIntegrationUI.create(adapter,{getLocale:()=>locale,getCategory:()=> 'ECRL',onSelect:()=>{},onFlags:()=>{}});
 for(const lang of ['ms','en','zh','th']){
  locale=lang;ui.render();
  const a=ui.content('ecrl-port-kuantan'),b=ui.content('ecrl-port-kemaman');
  assert(a.querySelector('.ecrl-accuracy').textContent.length>=7);
  assert.equal(a.querySelector('.ecrl-key-facts').textContent.includes('KP1 · KP2'),true);
  assert.match(a.querySelector('.ecrl-engineering').textContent,/PENDING_GEOMETRY/);
  assert.match(a.querySelector('.ecrl-engineering').textContent,/2\.7 km/);
  assert.match(a.querySelector('.ecrl-engineering').textContent,/1\.0 km/);
  assert.match(b.querySelector('.ecrl-engineering').textContent,/loadingBay: UNKNOWN/);
  assert.match(a.querySelector('.ecrl-sources').textContent,/PORT_KUANTAN_LOC/);
  assert.match(b.querySelector('.ecrl-sources').textContent,/EPIC_2026/);
  assert(!a.querySelector('.ecrl-engineering').open);
 }
 assert.equal(browser.document.querySelectorAll('#ecrl-assets button').length,35);
 dom.window.close();
});
