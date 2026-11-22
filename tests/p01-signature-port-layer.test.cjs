const test=require('node:test');const assert=require('node:assert/strict');
const layer=require('../assets/unified-ecrl/signature-port-layer.js');
test('signature port layer preserves existing source-backed Kuantan Kemaman Kerteh references',()=>{
 const refs=layer.references();const names=refs.map(x=>x.name);
 assert.ok(names.includes('Kuantan Port'));assert.ok(names.includes('Kemaman Port'));
 assert.ok(names.some(x=>x.includes('Kerteh')));
 assert.equal(refs.length,6);
});
test('purple area references cannot be represented as surveyed rail ends',()=>{
 for(const x of layer.references()){
  assert.equal(x.markerStyle,'MR_S10_PURPLE_REFERENCE');
  assert.equal(x.markerMeaning,'AREA_REFERENCE_NOT_RAIL_ENDPOINT');
  assert.equal(x.physicalLineString,null);
  assert.equal(x.geometryStatus,'NO_VERIFIED_RAIL_ENDPOINT');
  assert.ok(x.sourceIds.length>0);
 }
 assert.equal(layer.physicalRailGeometryVerified,false);
});
test('unknown industrial loading interface has no invented coordinate',()=>{
 const x=layer.references().find(x=>x.id==='ecrl-kerteh-petronas-loading-interface');
 assert.equal(x.coordinates,null);
});

test('unified map includes the reference module and visible purple legend',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'../unified-map-v8.html'),'utf8');
 assert.match(html,/assets\/unified-ecrl\/signature-port-layer\.js/);
 assert.match(html,/id="mrs10-port-reference-key"/);
 assert.match(html,/bukan titik hujung spurline yang disahkan/);
});

test('purple halo only targets maritime and yard references, preserving existing colors',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const src=fs.readFileSync(path.join(__dirname,'../assets/unified-ecrl/adapter.js'),'utf8');
 assert.match(src,/signature-port-halo/);
 assert.match(src,/kinds\.filter\(k=>k==='MARITIME'\|\|k==='YARD'\)/);
 assert.match(src,/YARD:'#b57925'/);
 assert.match(src,/MARITIME:'#7c3aed'/);
});

test('Port Klang source positions are locality-only and map integration exists',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const pk=require('../assets/unified-ecrl/port-klang-references.js');
 assert.equal(pk.assets.length,2);
 assert.ok(pk.assets.every(a=>a.physicalRailEndPoint===null&&a.railConnectionStatus==='UNVERIFIED'));
 assert.ok(layer.references().filter(a=>a.sourceRegistry==='port-klang-references').length===2);
 const html=fs.readFileSync(path.join(__dirname,'../unified-map-v8.html'),'utf8');
 const map=fs.readFileSync(path.join(__dirname,'../assets/unified-v8-map.js'),'utf8');
 assert.match(html,/port-klang-references\.js/);
 assert.match(map,/MRS10SignaturePortLayer\?\.install\(map\)/);
});
