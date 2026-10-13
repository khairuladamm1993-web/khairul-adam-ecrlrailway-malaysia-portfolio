const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ui=fs.readFileSync('assets/asia-map-ui.js','utf8');
test('simple Asia MAP excludes catalogue search, filters and result cards',()=>{for(const s of ['data-malaysia-search','data-malaysia-category','data-malaysia-results','ensureCatalogue','data-network'])assert(!ui.includes(s),s)});
test('road opacity reduced with separate prominent railway pane',()=>{for(const s of ['asiaMutedRoads',"opacity='0.42'",'asiaRailways',"pointerEvents='none'"])assert(ui.includes(s),s)});
test('original ECRL remains default and original engine is present',()=>{for(const s of ["current:'ecrl'","railway.mount(ecrl)"])assert(ui.includes(s),s);const original=fs.readFileSync('assets/map-gateway.js','utf8');assert(original.includes('window.RailwayMap=Object.freeze'))});
test('raster railway remains non-interactive and cannot generate invented markers',()=>{for(const s of ['L.polyline','L.marker','L.geoJSON'])assert(!ui.includes(s),s);assert(ui.includes('Raster reference tracks are not selectable'))});
