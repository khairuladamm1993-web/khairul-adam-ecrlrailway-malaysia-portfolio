'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const a=require('../scripts/audit-kajang-source-readonly.cjs');
const registry=require('../assets/railway-track-registry-kl.js');
test('R2.17.3 source probe enforces four explicit public read-only endpoints and no credentials',()=>{
 assert.equal(a.endpoints.length,4);
 for(const e of a.endpoints){
  const url=new URL(e.url);
  assert.equal(url.protocol,'https:');
  assert(['api.openstreetmap.org','cps.dbkl.gov.my','services5.arcgis.com'].includes(url.hostname));
  assert(!url.username&&!url.password);
  if(e.kind==='arcgis'){
   assert.equal(url.searchParams.get('where'),'1=1');
   assert.equal(url.searchParams.get('resultRecordCount'),'75');
   assert.equal(url.searchParams.get('outSR'),'4326');
  }
 }
});
test('R2.17.3 relation metadata is only candidate even when OSM response is well-formed',()=>{
 const xml='<osm><relation id="8000326" version="17"><member type="way" ref="778403716" role=""/><member type="node" ref="12" role="stop"/><tag k="type" v="route"/><tag k="route" v="subway"/><tag k="name" v="MRT Kajang Line"/></relation></osm>';
 const x=a.osmSummary(xml,'osm-relation','8000326');
 assert.equal(x.status,'LIVE_ENTITY_READ');assert.equal(x.members,2);assert.equal(x.ways,1);
 assert.equal(x.stops,1);assert.equal(x.tags.route,'subway');
 assert.equal(x.candidateOnly,true);assert.equal(x.geometryVerified,false);assert.equal(x.wayContinuityVerified,false);
 assert.equal(a.osmSummary(xml,'osm-relation','8000327').status,'NO_EXACT_ELEMENT');
});
test('R2.17.3 way node completeness is not membership, physical operator or full alignment proof',()=>{
 const xml='<osm><node id="1" lat="3.10" lon="101.6"/><node id="2" lat="3.11" lon="101.61"/><way id="778403716" version="4"><nd ref="1"/><nd ref="2"/><tag k="railway" v="subway"/><tag k="ref" v="9"/></way></osm>';
 const x=a.osmSummary(xml,'osm-way','778403716');
 assert.equal(x.status,'LIVE_ENTITY_READ');assert.equal(x.nodeRefs,2);assert.equal(x.returnedNodes,2);
 assert.equal(x.allReferencedNodesPresent,true);assert.equal(x.geometryVerified,false);
 assert.equal(x.relationMembershipVerified,false);
 const broken=a.osmSummary(xml.replace('<node id="2" lat="3.11" lon="101.61"/>',''),'osm-way','778403716');
 assert.equal(broken.allReferencedNodesPresent,false);
});
test('R2.17.3 public DBKL polyline has route data but is never treated as a surveyed track',()=>{
 const j={features:[
  {attributes:{dari_stese:'Muzium Negara',hingga_ste:'Pasar Seni',Operator:'Rapid KL',sistem:'MRT1',jenis_trek:'Underground'},geometry:{paths:[[[101.6,3.1],[101.61,3.11]]]}},
  {attributes:{dari_stese:'Kajang',hingga_ste:'KTM Kajang'},geometry:null}
 ],exceededTransferLimit:false};
 const x=a.arcgisSummary(j,'dbkl_mrt1_segments');
 assert.equal(x.featureCount,2);assert.equal(x.geometryFeatureCount,1);assert.equal(x.pointCountTotal,2);
 assert.equal(x.sample[0].operator,'Rapid KL');
 assert.equal(x.geometryVerified,false);assert.equal(x.fullCorridorCovered,false);
 assert.equal(x.sourceLicenseVerified,false);
 assert.equal(a.arcgisSummary({error:{code:403,message:'restricted'}},'test').status,'GIS_ERROR');
});
test('R2.17.3 remote endpoint failures are classified, not fabricated or silently accepted',async()=>{
 const x=await a.probe(a.endpoints[0],async()=>{throw Error('network unavailable')});
 assert.equal(x.status,'SOURCE_UNAVAILABLE');assert.equal(x.candidateOnly,true);assert.equal(x.geometryVerified,false);
 const y=await a.probe(a.endpoints[2],async()=>'{invalid json');
 assert.equal(y.status,'SOURCE_UNAVAILABLE');assert.equal(y.geometryVerified,false);
});
test('R2.17.3 preserves official green 29 stops and source-backed KG13 9/29 popup',()=>{
 const r=registry.findRoute('mrt-kajang'),a=registry.osmRelationAudit;
 assert.equal(r.stationSequence.length,29);
 assert.equal(r.visualIdentity.light,'#087D43');
 assert.equal(r.geometry,null);assert.equal(r.physicalTrackStatus,'UNVERIFIED');
 assert.equal(a.verifiedPhysicalTracks,0);assert.deepEqual([...a.acceptedWayIds],[]);
 const x=registry.matchSourcedKajangPoi({class:'railway',subclass:'subway',name:'KG13 Pusat Bandar Damansara','name:en':'Pusat Bandar Damansara'});
 assert.equal(x?.stopPosition,9);assert.equal(x?.stopCount,29);
 assert.equal(x.physicalTrackId,null);
 assert.equal(registry.matchSourcedKajangPoi({class:'railway',subclass:'subway',name:'Kajang'}),null);
 const source=fs.readFileSync(path.join(__dirname,'../assets/map-language-lab.js'),'utf8');
 assert.match(source,/mrl-kajang-known-poi/);
 assert.doesNotMatch(source,/mrl-kajang-physical-line/);
 assert.doesNotMatch(source,/mrl-kajang-alignment/);
});
