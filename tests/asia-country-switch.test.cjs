const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const ui=fs.readFileSync('assets/asia-map-ui.js','utf8');
test('Malaysia Thailand China selector only',()=>{for(const name of ['malaysia','thailand','china'])assert(ui.includes('data-asia-country="'+name+'"'));assert(ui.includes('aria-pressed="true"'))});
test('country change moves viewport only',()=>{assert(ui.includes('state.asia.setView(country.center,country.zoom)'));assert(!ui.includes('L.polyline'));assert(!ui.includes('L.marker'));assert(!ui.includes('L.geoJSON'))});
test('existing ECRL default and lifecycle retained',()=>{assert(ui.includes("current:'ecrl'"));assert(ui.includes('railway.mount(ecrl)'));assert(ui.includes('railway.unmount()'))});
test('no login, source or canonical mutations in country selector',()=>{assert(!/localStorage|sessionStorage|Supabase|fetchMemberBundle/.test(ui))});
