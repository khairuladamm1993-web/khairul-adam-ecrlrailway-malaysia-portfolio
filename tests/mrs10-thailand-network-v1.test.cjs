const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const m=require('../assets/mrs10-thailand-network-v1-model.js');
test('routes sourced and unique with no invented geometry',()=>{const x=m.audit();assert.equal(x.count,23);assert.deepEqual(x.duplicateIds,[]);assert.deepEqual(x.invalidSources,[]);assert.deepEqual(x.geometryClaims,[]);assert.deepEqual(x.missingBorderRoutes,[]);});
test('Thailand SRT and Bangkok coverage in 3 separate groups',()=>{assert.equal(m.byGroup('border').length,1);assert.equal(m.byGroup('srt').length,11);assert.equal(m.byGroup('bangkok').length,11);});
test('Padang Besar interface active but not through-train guarantee',()=>{const b=m.border('th-my-padang');assert.equal(b.status,'ACTIVE_RAIL_INTERFACE');assert.equal(b.serviceContinuity,'TRANSFER_USUALLY_REQUIRED');assert.ok(m.route(b.thaiRouteId).selectedNodes.includes('Hat Yai Junction'));});
test('Sungai Kolok-Rantau Panjang remains inactive, not fabricated as KTM track',()=>{const b=m.border('th-my-kolok');assert.equal(b.status,'NO_ACTIVE_CROSS_BORDER_RAIL');assert.equal(b.serviceContinuity,'NO_RAIL_PASSENGER_CONNECTION');});
test('future projects not included among operational route catalog',()=>{assert.equal(m.route('th-orange'),null);assert.ok(m.future.every(p=>p.status.endsWith('NOT_OPEN')||p.status.endsWith('NOT_OPEN_AS_UPGRADE')));});
test('noncontinuity of Mae Klong separated; no exhaustive stop claims',()=>{assert.ok(m.route('th-srt-maeklong-a'));assert.ok(m.route('th-srt-maeklong-b'));assert.ok(m.routes.every(r=>r.geometry===null&&r.stopListCompleteness==='REPRESENTATIVE_NODES_ONLY'));});
test('source-linked border and search discoverability',()=>{assert.ok(m.search('Padang Besar').some(r=>r.id==='th-srt-padang-besar'));assert.ok(m.borders.every(b=>b.sourceUrls.every(u=>u.startsWith('https://'))));});
test('isolated HTML references its dedicated assets and geographic railway tiles',()=>{const h=fs.readFileSync('thailand-railway-v1.html','utf8');const v=fs.readFileSync('assets/mrs10-thailand-network-v1-view.js','utf8');for(const name of ['bm','en','zh','th'])assert.ok(h.includes('data-lang="'+name+'"'));assert.ok(h.includes('mrs10-thailand-network-v1-model.js'));assert.ok(v.includes('tiles.openrailwaymap.org'));assert.ok(v.includes('openstreetmap.org'));assert.ok(!v.includes('supabase'));});

test('keyless Thailand base replaces provider tiles; no API key watermark',()=>{
 const v=fs.readFileSync('assets/mrs10-thailand-network-v1-view.js','utf8');
 assert.match(v,/https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);
 assert.doesNotMatch(v,/basemaps\.cartocdn\.com|API KEY REQUIRED|YOUR_KEY|\?key=/i);
 assert.match(v,/keepBuffer:1,updateWhenIdle:true/);
 assert.match(v,/openstreetmap\.org\/copyright/);
});
test('light dark styling is isolated to basemap not OpenRailwayMap overlay',()=>{
 const v=fs.readFileSync('assets/mrs10-thailand-network-v1-view.js','utf8');
 const h=fs.readFileSync('thailand-railway-v1.html','utf8');
 assert.match(v,/map\.createPane\('th-basemap'\)/);
 assert.match(v,/map\.createPane\('th-railway'\)/);
 assert.match(v,/pane:'th-railway'/);
 assert.match(v,/basePane\.classList\.toggle\('is-dark',dark\)/);
 assert.match(h,/th-basemap-pane\.is-dark/);
 assert.doesNotMatch(v,/removeLayer\(dark\?d:l\)/);
});
