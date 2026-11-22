const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('MAP runtime uses one engine with authenticated role-aware presentation',()=>{
 const source=read('assets/map-gateway.js');
 assert.match(source,/const canMember=Boolean\(A\?\.canReadMemberContent\)/);
 assert.match(source,/host\.dataset\.mapView=canMember\?'member':'public'/);
 assert.match(source,/data-map-role-note/);
 assert.match(source,/applyAccessView\(\);state\.selected=/);
 assert.match(source,/instance\.applyAccessView\?\.\(\)/);
 assert.match(source,/A\?\.canReadMemberContent\?I\.parseChainage\(state\.query\):null/);
});

test('Public map hides advanced controls while member and owner retain existing tool path',()=>{
 const css=read('assets/gateway.css');
 const map=read('assets/map-gateway.js');
 for(const selector of ['.map-filters','[data-map-confidence-summary]','[data-map-refresh]','[data-map-fullscreen]','[data-map-results]']){
  assert(css.includes('.railway-map-mount[data-map-view="public"] '+selector),selector);
 }
 assert.match(map,/if\(A\.canAdmin\)loadOwnerTools\(\)/);
 assert.match(map,/A\?\.canReadMemberContent/);
 assert.match(map,/Continuous track alignment: NOT VERIFIED/);
});

test('MAP loader failure can retry instead of retaining a rejected promise',()=>{
 const gateway=read('assets/public-gateway.js');
 assert.match(gateway,/mapLoader=null;throw error/);
 assert.match(gateway,/s\.onerror=\(\)=>\{s\.remove\(\);reject/);
 assert.match(gateway,/data-map-retry/);
 assert.match(gateway,/void mountMap\(\)/);
});

test('safe artifact build explicitly includes required lazy MAP assets',()=>{
 const build=read('scripts/build-production.py');
 for(const asset of ['map-locale.js','map-intelligence.js','map-gateway.js']){
  assert(build.includes('"'+asset+'"'),asset);
 }
 assert.match(build,/Missing required authenticated\/public runtime assets/);
});
