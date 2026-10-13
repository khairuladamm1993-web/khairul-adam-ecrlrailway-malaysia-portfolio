const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ui=fs.readFileSync('assets/asia-map-ui.js','utf8');
test('simple map excludes catalogue search, filters and long result cards',()=>{for(const s of ['data-malaysia-search','data-malaysia-category','data-malaysia-results','ensureCatalogue','data-network'])assert(!ui.includes(s),s)});
test('roads muted visually, rail overlay prominent and independent',()=>{assert.match(ui,/asiaMutedRoads/);assert.match(ui,/opacity='0\\.42'/);assert.match(ui,/asiaRailways/);assert.match(ui,/pointerEvents='none'/)});
test('original ECRL remains default and untouched',()=>{assert.match(ui,/current:'ecrl'/);assert.match(ui,/railway\\.mount\\(ecrl\\)/);const old=fs.readFileSync('assets/map-gateway.js','utf8');assert.match(old,/window\\.RailwayMap=Object\\.freeze/)});
test('no pretend clickable OpenRailwayMap raster geometry',()=>{assert(!/L\\.polyline|L\\.marker|L\\.geoJSON/.test(ui));assert.match(ui,/Raster reference tracks are not selectable/)});
