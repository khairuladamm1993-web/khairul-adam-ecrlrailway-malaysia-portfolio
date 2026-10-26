'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const m=require('../assets/mrs10-erl-v2-model.js');
const gis=require('../assets/mrs10-erl-v2-gis.js');

test('ERL V2: six Transit stations, three regular Ekspres stations, exact order',()=>{
 assert(m.validate());
 assert.deepEqual(m.services.express.stationSequence,['kl-sentral','klia-t1','klia-t2']);
 assert.deepEqual(m.services.transit.stationSequence,[
  'kl-sentral','bandar-tasik-selatan','putrajaya-cyberjaya','salak-tinggi','klia-t1','klia-t2'
 ]);
 assert.equal(m.services.express.serviceAdjacencies.length,2);
 assert.equal(m.services.transit.serviceAdjacencies.length,5);
 for(const id of ['bandar-tasik-selatan','putrajaya-cyberjaya','salak-tinggi'])
  assert.equal(m.regularServiceStopsAt('erl-klia-ekspres',id),false);
});
test('ERL V2: three regular shared stops, no misleading express normal all-stop membership',()=>{
 assert.deepEqual(m.stops.filter(x=>x.serviceIds.length===2).map(x=>x.id),
  ['kl-sentral','klia-t1','klia-t2']);
 assert.deepEqual(m.stops.filter(x=>x.serviceIds.length===1).map(x=>x.id),
  ['bandar-tasik-selatan','putrajaya-cyberjaya','salak-tinggi']);
 assert.equal(m.schedule.effectiveFromHourLocal,23);
 assert.equal(m.schedule.perTrainStopPatternVerified,false);
 assert.deepEqual(m.schedule.lateNightAdditionalStops,
  ['bandar-tasik-selatan','putrajaya-cyberjaya','salak-tinggi']);
});
test('ERL V2: service colours separated; do not assert exact operator hex',()=>{
 assert.equal(m.colour.express.family,'PURPLE_MAGENTA');
 assert.equal(m.colour.transit.family,'CYAN_TEAL');
 assert.notEqual(m.colour.express.light,m.colour.transit.light);
 assert.equal(m.colour.express.isOfficialHex,false);
 assert.equal(m.colour.transit.isOfficialHex,false);
});
test('ERL V2: safe GIS gate; no authored physical line geometry or track IDs',()=>{
 assert.equal(m.infrastructure.physicalPolyline,null);
 assert.equal(m.infrastructure.routeToWayRelations.length,0);
 assert.equal(m.infrastructure.topologyContinuity,'UNVERIFIED');
 assert(m.stops.every(s=>s.geometry===null&&s.officialStationCode===null&&s.physicalTrackIds.length===0));
 assert(Object.values(m.services).every(s=>s.geometry===null&&s.acceptedPhysicalTrackWays.length===0));
 assert.equal(m.stationById('putrajaya-cyberjaya').interchangeRelation,'CONNECTED_PUTRAJAYA_SENTRAL');
 assert.equal(m.stationById('putrajaya-cyberjaya').id!=='mrt-py41',true);
 assert.equal(m.stationById('klia-t1').interchangeRelation,'AIRPORT_TERMINAL');
});
const sourceNames=['KL Sentral','Bandar Tasik Selatan','Putrajaya & Cyberjaya','Salak Tinggi','KLIA T1','KLIA T2'];
const samples=sourceNames.map((name,i)=>({attributes:{FID:i+1,STN_NAME:name,STN_CODE:'UNVERIFIED_'+i},
 geometry:{x:101.69+(i%2)*0.01,y:3.12-i*0.07}}));
test('ERL V2: GIS source-matched six unique point records; secondary code is not official',()=>{
 const out=gis.decode(samples,m);
 assert(out.ok&&out.matched===6&&out.missing===0);
 assert.equal(out.points.length,6);
 assert(out.points.every(p=>p.codeStatus==='SECONDARY_GIS_RAW_UNVERIFIED'));
 assert(out.points.every(p=>p.coordinates.length===2&&p.geometryStatus==='SECONDARY_GIS_POINT_NOT_TRACK'));
 assert.equal(out.redistributionLicence,'UNVERIFIED');
});
test('ERL V2: GIS rejects cross-line name, invalid coordinates and ambiguous duplicate',()=>{
 const bad=[
  {attributes:{FID:91,STN_NAME:'Putrajaya Sentral'},geometry:{x:101.70,y:2.94}},
  {attributes:{FID:92,STN_NAME:'KL Sentral'},geometry:{x:125,y:42}},
  {attributes:{FID:93,STN_NAME:'Imaginary Airport'},geometry:{x:101.7,y:2.8}}
 ];
 const out=gis.decode([...samples,...bad],m);
 assert.equal(out.matched,6);assert(out.rejected>=3);
 const dup=gis.decode([...samples,{attributes:{FID:110,STN_NAME:'KL Sentral'},geometry:{x:101.71,y:3.01}}],m);
 assert.equal(dup.matched,5);assert(!dup.points.some(p=>p.stationId==='kl-sentral'));
 assert.equal(gis.decode([],m).matched,0);
 assert.equal(gis.decode(null,m).ok,false);
});
test('ERL V2: isolated HTML, four languages, focus/reset, responsive MapLibre UI',()=>{
 const html=read('erl-v2.html'),js=read('assets/mrs10-erl-v2-view.js');
 for(const id of ['erl-map','line-express','line-transit','btn-all','btn-express','btn-transit','btn-reset',
  'locale-ms','locale-en','locale-zh','locale-th','theme','gis-status'])
  assert(html.includes('id="'+id+'"'),id);
 assert(!/<iframe\b/i.test(html));
 assert(html.includes('name="viewport"'));
 assert(html.includes('mrs10-erl-v2-model.js'));
 assert(html.includes('mrs10-erl-v2-gis.js'));
 assert(html.includes('mrs10-erl-v2-view.js'));
 assert.match(js,/new maplibre\.Marker\(/);
 assert.match(js,/\.setDOMContent\(stationDetail\(s\)\)/);
 assert.match(js,/focus==='all'/);
 assert.match(js,/map\.fitBounds\(/);
 assert.match(js,/map\.setStyle\(styleUrl\(\)\)/);
 assert.match(js,/23:00|11:00|11 pm/);
 for(const l of ['ms:','en:','zh:','th:'])assert(js.includes(l),l);
 assert(!js.includes('addLayer({id:"erl-physical'));
});
test('ERL V2: untouched four-line integration artifacts checked by immutable references',()=>{
 const reg=require('../assets/railway-track-registry-kl.js');
 assert(reg.validateRegistry());
 assert.equal(reg.findRoute('mrt-kajang').stationSequence.length,29);
 assert.equal(reg.findRoute('mrt-putrajaya').stationSequence.length,36);
 assert.equal(reg.findRoute('lrt-kelana-jaya').stationSequence.length,37);
 assert.equal(reg.catalog.physicalSegments.length,0);
 assert.match(read('tests/r221-p01-crossline-integration.test.cjs'),/four services coexist/);
 assert.match(read('scripts/build-preview.py'),/'ampang-line-r219\.html'/);
});
