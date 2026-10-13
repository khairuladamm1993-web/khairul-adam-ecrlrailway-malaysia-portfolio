const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('assets/public-gateway.js','utf8');
const ui=fs.readFileSync('assets/asia-map-ui.js','utf8');
const map=fs.readFileSync('assets/map-gateway.js','utf8');
test('original map remains default',()=>{assert.match(ui,/current:'ecrl'/);assert.match(ui,/railway\.mount\(ecrl\)/);});
test('Asia UI never writes canonical corridor or member state',()=>{assert.doesNotMatch(ui,/RailwayCorridorReference|cachedData|fetchMemberBundle|Supabase|RailwayOwnerMap|localStorage|sessionStorage/);});
test('Asia lazy-loaded only in MAP',()=>{assert.match(js,/const mountMap=\(\)=>ensureMap\(\)/);assert.match(js,/if\(!host\.isConnected\|\|category!=='map'\)return/);});
test('leave original MAP engine unchanged as independent module',()=>{assert.match(map,/window\.RailwayMap=Object\.freeze\(\{mount,unmount/);});
test('Asia map created separately with no fabricated vectors',()=>{assert.match(ui,/window\.L\.map\(wrapper\.querySelector/);assert.doesNotMatch(ui,/L\.polyline|L\.geoJSON|L\.marker/);});
test('navigation unmounts Asia state',()=>{assert.match(js,/window\.MRS10AsiaMapUI\?\.unmount\(\)/);});

test('outer MAP host mirrors original map readiness and marker counts after async mount',()=>{for(const key of ['mapReady','validatedMarkers','totalMarkers'])assert.match(ui,new RegExp('host\\.dataset\\.'+key+'=ecrl\\.dataset\\.'+key));});
test('switch away clears stale ECRL readiness',()=>assert.match(ui,/railway\.unmount\(\);delete host\.dataset\.mapReady/));
