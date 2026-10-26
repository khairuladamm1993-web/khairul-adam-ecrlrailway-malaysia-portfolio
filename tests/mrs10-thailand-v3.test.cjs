const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs');
const M=require('../assets/mrs10-thailand-v3-model.js'),G=require('../assets/mrs10-thailand-v3-gis.js');
const h=fs.readFileSync('thailand-railway-v3.html','utf8'),v=fs.readFileSync('assets/mrs10-thailand-v3-view.js','utf8');
test('54 stations and 6 source-gated corridors; no duplicates or guessed geometry',()=>{const a=M.audit();assert.equal(a.stations,54);assert.equal(a.corridors,6);assert.deepEqual(a.duplicateIds,[]);assert.deepEqual(a.unresolvable,[]);assert.deepEqual(a.badCoordinates,[]);assert.deepEqual(a.inventedTracks,[]);assert.equal(a.falseKolok,0);});
test('Padang Besar ONE Malaysia interchange versus separate Thai station',()=>{assert.equal(M.interchange.canonicalFacilityId,'th-my-padang-besar');assert.equal(M.interchange.stationIds.length,1);assert.equal(M.interchange.nearbySeparateThaiStationId,'th-th-padang-besar');assert.notDeepEqual(M.station('th-my-padang-besar').point,M.station('th-th-padang-besar').point);});
test('KTMB SRT and two timezones represented without real-time timetables',()=>{assert.deepEqual(M.interchange.operators,['KTMB','SRT']);assert.equal(M.station('th-my-padang-besar').timezone,'Asia/Kuala_Lumpur');assert.equal(M.station('th-th-padang-besar').timezone,'Asia/Bangkok');assert.equal(M.offsetDifference(),1);});
test('Sungai Kolok Rantau Panjang explicitly planned and NOT active',()=>{const x=M.links.find(z=>z.externalRef==='MY-RANTAU-PANJANG');assert.equal(x.status,'PLANNED');assert.equal(x.serviceActive,false);assert.equal(x.type,'PLANNED_CONNECTION');assert.equal(x.to,null);});
test('Border ordered 4 stations, Bangkok main and Eastern Southern branches',()=>{assert.deepEqual(M.route('th-v3-border').selectedStationIds,['th-my-padang-besar','th-th-padang-besar','th-khlong-ngae','th-hat-yai-junction']);const m=M.route('th-v3-main').selectedStationIds;assert.equal(m[0],'th-hat-yai-junction');assert.equal(m.at(-1),'th-krung-thep-aphiwat');assert.ok(m.indexOf('th-surat-thani')<m.indexOf('th-chumphon'));assert.equal(M.route('th-v3-east').selectedStationIds.at(-1),'th-su-ngai-kolok');assert.ok(M.route('th-v3-trang').selectedStationIds.includes('th-thung-song-junction'));});
test('13 sourced station coords with OSM ids; remaining pending',()=>{const located=M.stations.filter(s=>s.point);assert.equal(located.length,13);assert.equal(G.points(M).features.length,13);assert.ok(located.every(s=>s.coordinateSource.sourceUrl==='https://www.openstreetmap.org/'+s.sourceStationIds.osm&&s.coordinateSource.license==='ODbL'));assert.equal(M.stations.filter(s=>!s.point).length,41);});
test('GIS reject bad source, nonrail, wrong country or ambiguity',()=>{assert.equal(G.stationFeature({point:[0,0]}),null);assert.equal(G.sourceMatch({type:'node',id:1,lat:30,lon:100,tags:{name:'Hat Yai Junction'}},M),null);assert.equal(G.sourceMatch({type:'node',id:1,lat:6,lon:100,tags:{name:'Unrelated'}},M),null);});
test('GIS OSM station match only from names and valid source record',()=>{const f=G.sourceMatch({type:'node',id:8820285515,lat:7.00387,lon:100.46733,tags:{name:'Hat Yai Junction'}},M);assert.equal(f.properties.id,'th-hat-yai-junction');assert.equal(f.properties.sourceId,'node/8820285515');assert.equal(G.mergePoints(G.points(M),[f]).features.length,13);});
test('Physical rail ways use OSM way geometry, not synthetic station segments',()=>{const b=[6.8,100.3,6.9,100.5];const d=G.railwayWays([{type:'way',id:123,tags:{railway:'rail'},geometry:[{lat:6.8,lon:100.3},{lat:6.9,lon:100.4}]},{type:'way',id:456,tags:{railway:'subway'},geometry:[{lat:6.8,lon:100.3},{lat:6.9,lon:100.4}]}],b);assert.equal(d.features.length,1);assert.equal(d.features[0].properties.sourceId,'way/123');assert.equal(d.features[0].properties.serviceRouteId,null);assert.deepEqual(d.features[0].geometry.coordinates,[[100.3,6.8],[100.4,6.9]]);});
test('OSM request bbox limits and physical-source safety',()=>{assert.equal(G.bboxValid([6.8,100.3,6.9,100.5]),true);assert.equal(G.bboxValid([6,100,9,102]),false);assert.equal(G.railwayWays([],[-1,0,99,99]).features.length,0);});
test('MapLibre and live marker recovery after style.load and filters',()=>{assert.match(h,/maplibre-gl-6\.13\.0\.css/);assert.match(v,/map\.on\('style\.load'/);assert.match(v,/new ML\.Marker/);assert.match(v,/new ML\.Popup/);assert.match(v,/setDOMContent/);assert.match(v,/fitBounds/);for(const k of ['all','border','main','east','branches','planned'])assert.ok(h.includes('data-filter="'+k+'"'));});
test('Four-language safe isolated zero-key MapLibre Preview',()=>{for(const k of ['bm','en','zh','th'])assert.ok(h.includes('data-lang="'+k+'"'));assert.ok(h.includes('openstreetmap.org/copyright'));assert.match(v,/tiles\.openfreemap\.org\/styles/);assert.doesNotMatch(h+v,/cartocdn\.com|YOUR_KEY|apiKey:|supabase|localStorage/i);});

test('MapLibre v6 uses ESM .mjs not removed UMD classic script',()=>{
 const b=fs.readFileSync('assets/mrs10-thailand-v3-bootstrap.mjs','utf8');
 assert.match(h,/mrs10-thailand-v3-bootstrap\.mjs/);
 assert.match(b,/thailand-v3-vendor\/maplibre-gl-6\.13\.0\.mjs/);
 assert.doesNotMatch(h+b,/maplibre-gl@6\.13\.0\/dist\/maplibre-gl\.js/);
 assert.match(b,/window\.maplibregl=maplibregl/);
});
test('local ESM vendor assets are pinned, licensed, and external runtime CDN is absent',()=>{
 const css=fs.readFileSync('assets/thailand-v3-vendor/maplibre-gl-6.13.0.css','utf8');
 const lic=fs.readFileSync('assets/thailand-v3-vendor/MAPLIBRE-LICENSE.txt','utf8');
 const b=fs.readFileSync('assets/mrs10-thailand-v3-bootstrap.mjs','utf8');
 assert.ok(css.length>20000);assert.match(lic,/BSD/);assert.match(b,/\.\/thailand-v3-vendor\/maplibre-gl-6\.13\.0\.mjs/);
 assert.match(h,/assets\/thailand-v3-vendor\/maplibre-gl-6\.13\.0\.css/);
 assert.doesNotMatch(h+b,/unpkg\.com\/maplibre|jsdelivr\.net\/npm\/maplibre/);
});
test('Same-origin MapLibre worker is bundled and pointed to before rendering',()=>{
 const boot=fs.readFileSync('assets/mrs10-thailand-v3-bootstrap.mjs','utf8');
 const work=fs.readFileSync('assets/thailand-v3-vendor/maplibre-gl-worker-6.13.0.mjs','utf8');
 assert.ok(work.length>100000);
 assert.match(boot,/maplibregl\.setWorkerUrl\(new URL\('/);
 assert.match(boot,/maplibre-gl-worker-6\.13\.0\.mjs/);
 assert.ok(boot.indexOf('setWorkerUrl')<boot.indexOf('await import'));
});
test('Bangkok approach Southern physical order: Taling Chan before Bang Bamru',()=>{
 const s=M.route('th-v3-main').selectedStationIds;
 assert.ok(s.indexOf('th-taling-chan-junction')<s.indexOf('th-bang-bamru'));
 assert.ok(s.indexOf('th-bang-bamru')<s.indexOf('th-krung-thep-aphiwat'));
});