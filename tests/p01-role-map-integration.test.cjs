'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Public map uses existing V7; Member/Owner main map uses existing V8',()=>{
 const source=read('assets/public-gateway.js');
 assert.match(source,/const member=Boolean\(window\.RailwayAccess\?\.canReadMemberContent\)/);
 assert.match(source,/const src=member\?'unified-map-v8\.html':'unified-map-v7\.html'/);
 assert.match(source,/data-map-audience/);
 assert.match(source,/class="mrs10-map-frame"/);
 assert.match(source,/loading="lazy" referrerpolicy="no-referrer"/);
 assert.match(source,/hadMemberAccess!==hasMemberAccess/);
});
test('Legacy GIS reference is loaded only on authenticated click',()=>{
 const source=read('assets/public-gateway.js');
 assert.match(source,/data-gis-reference/);
 assert.match(source,/data-legacy-map-load/);
 assert.match(source,/if\(!window\.RailwayAccess\?\.canReadMemberContent\)return/);
 assert.match(source,/void mountMap\(\)/);
});
test('V8 is sourced OpenMR GPS map and V7 is Public catalogue',()=>{
 const v8=read('unified-map-v8.html'),v7=read('unified-map-v7.html');
 assert.match(v8,/assets\/openmr\/gps\.js/);
 assert.match(v8,/assets\/unified-v8-map\.js/);
 assert.match(v7,/assets\/unified-v7-map\.js/);
 assert.match(v7,/Shuttle Timur dikecualikan/);
});
test('Candidate-only build does not alter production pipeline or publish backend',()=>{
 const build=read('scripts/build-p01-map-candidate.cjs');
 assert.match(build,/scripts\/build-production\.py/);
 assert.match(build,/unified-map-v7\.html/);
 assert.match(build,/unified-map-v8\.html/);
 assert.match(build,/assets\/unified-ecrl/);
 assert.match(build,/PRIVATE_FILE/);
 assert.doesNotMatch(build,/vercel --prod|git push/i);
});
