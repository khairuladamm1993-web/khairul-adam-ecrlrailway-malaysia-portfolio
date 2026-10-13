const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const C=require('../assets/malaysia-network-catalogue.js');
test('seven unique public entries',()=>{assert.equal(C.records.length,7);assert.equal(new Set(C.records.map(x=>x.id)).size,7)});
test('named operators available in search',()=>{for(const x of ['ECRL','KTMB','MRT','LRT','Monorail','ERL','RTS'])assert.equal(C.search(x).length,1,x)});
test('operator and category filtering',()=>{assert(C.search('Rapid Rail').length>=2);assert.equal(C.search('','Airport rail').length,1)});
test('region centers are bounded and immutable',()=>{assert(Object.isFrozen(C.records));for(const x of C.records){assert(Object.isFrozen(x.center));assert(x.center[0]>=1&&x.center[0]<=7);assert(x.center[1]>=99&&x.center[1]<=120)}});
test('no line geometry or protected data',()=>{for(const x of C.records)for(const k of ['geometry','coordinates','stationId','chainage','ownerDraft','userId','token'])assert.equal(k in x,false)});
test('catalogue remains available as source data but not rendered as clutter',()=>{const s=fs.readFileSync('assets/asia-map-ui.js','utf8');for(const x of ['ensureCatalogue','data-malaysia-search','data-malaysia-category','data-network'])assert(!s.includes(x),x)});
