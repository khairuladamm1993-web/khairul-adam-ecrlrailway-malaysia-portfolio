'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),root=__dirname;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sp=require('./catalogue.js'),gis=require('./gis.js');
const am=require('../../assets/mrs10-r219-ampang-service.js');
test('29 active stations: Sentul Timur to Putra Heights, without invented SP23/SP30',()=>{
 assert(sp.validate());assert.equal(sp.stations.length,29);
 assert.equal(sp.route.stationCount,29);assert.equal(sp.route.serviceAdjacencies.length,28);
 assert.deepEqual([sp.stations[0].name,sp.stations.at(-1).name],['Sentul Timur','Putra Heights']);
 assert.equal(sp.findByCode('SP22').name,'Kinrara BK5');
 assert.equal(sp.findByCode('SP24').name,'IOI Puchong Jaya');
 assert.equal(sp.findByCode('SP29').name,'Puchong Prima');
 assert.equal(sp.findByCode('SP31').name,'Putra Heights');
 assert.equal(sp.findByCode('SP23'),null);assert.equal(sp.findByCode('SP30'),null);
 assert.equal(new Set(sp.stations.map(x=>x.name)).size,29);
});
test('11 genuine shared service stations match untouched Ampang R2.19',()=>{
 assert(am.validate());
 const r=sp.sharedFixture(am);assert.equal(r.ok,true);assert.equal(r.shared,11);
 assert.equal(sp.stations[10].name,'Chan Sow Lin');assert.equal(sp.stations[11].name,'Cheras');
 assert(sp.stations.slice(11).every(s=>!s.sharedService&&s.pairedAmpangCode===null));
 assert.equal(sp.stations[0].pairedAmpangCode,'AG1');
 assert.equal(sp.stations[10].pairedAmpangCode,'AG11');
});
test('Service sequence cannot be mistaken for 28 GIS track segments',()=>{
 assert.equal(sp.route.railwayAlignment,null);
 assert.equal(sp.route.acceptedRailWayIds.length,0);
 assert.equal(sp.route.serviceAdjacencies.every(e=>e.geometry===null&&e.physicalWayId===null),true);
 assert.equal(sp.stations.every(s=>s.geometry===null&&s.physicalTrackIds.length===0&&s.railwayWayIds.length===0),true);
 assert.equal(sp.color.physicalTrackColourAuthorised,false);
 assert.equal(sp.color.exactOperatorHexVerified,false);
});
test('Point matching requires source names and rejects mismatched code, duplicates and out-of-bounds',()=>{
 // Fixture coordinates are synthetic test inputs only; they are never shipped or rendered.
 const fixture=sp.stations.map((s,i)=>({attributes:{FID:i+1,STN_NAME:s.name,STN_CODE:'SP'+String(s.serviceCode.slice(2)).padStart(2,'0')},
  geometry:{x:101.58+i*.004,y:3.00+i*.006}}));
 const ok=gis.decode(fixture,sp);assert(ok.ok);assert.equal(ok.matched,29);assert.equal(ok.missing,0);
 assert.equal(gis.geojson(ok).features.length,29);
 assert.equal(gis.geojson(ok).features.every(f=>f.geometry.type==='Point'),true);
 const wrong=fixture.map(x=>structuredClone(x));wrong[0].attributes.STN_CODE='SP20';
 let out=gis.decode(wrong,sp);assert.equal(out.matched,28);assert.equal(out.missing,1);
 const missing=fixture.map(x=>structuredClone(x));missing[2].geometry.x=105;
 out=gis.decode(missing,sp);assert.equal(out.matched,28);
 out=gis.decode([...fixture,fixture[0]],sp);assert.equal(out.matched,28);
 assert.equal(gis.decode(null,sp).ok,false);
});
test('No duplicated physical station object for Ampang; GIS overlap only read-only',()=>{
 const testDatum={ok:true,data:[{name:'Sentul Timur',coordinates:[101.69,3.18],sharedService:true}]};
 assert.equal(gis.checkAmpangOverlap(testDatum,{ok:true,data:[{name:'Sentul Timur',coordinates:[101.691,3.18]}]}).compared,1);
 assert.equal(sp.stations.slice(0,11).every(s=>!!s.sharedStationKey),true);
});
test('Maroon line / station color, readable markers, accessible controls, theme and four languages',()=>{
 const page=read('index.html'),js=read('app.js');
 assert(page.includes('lang="ms"'));assert(page.includes('viewport-fit=cover'));
 for(const k of ['data-lang="ms"','data-lang="en"','data-lang="zh"','data-lang="th"'])assert(page.includes(k));
 for(const k of ['ms:','en:','zh:','th:'])assert(js.includes(k));
 for(const id of ['focus','all','reset','category','status','lineup','map-shell','theme'])assert(page.includes('id="'+id+'"'));
 assert(js.includes("'circle-color':labelColor()"));
 assert(js.includes("'circle-stroke-color'"));
 assert(js.includes("'text-halo-color'"));assert(js.includes("'circle-radius'"));
 assert(js.includes('textContent'));assert(js.includes('setDOMContent'));
 assert(!js.includes('innerHTML='));
 assert(page.includes('@media(max-width:740px)'));
 assert(page.includes('prefers-reduced-motion'));
 assert(page.includes('min-height:44px'));
});
test('No synthetic geographic route; independent directory does not touch Ampang R2.19',()=>{
 const js=read('app.js'),page=read('index.html');
 assert(!js.includes("type:'line'"));assert(!js.includes('addLayer({id:line'));
 assert(!js.includes('LineString'));
 assert(!page.includes('mrs10-r219-map-bridge.js'));
 assert(!page.includes('assets/member-gateway.js'));
 assert(!page.includes('supabase'));
 assert(page.includes('noindex,nofollow'));
 assert(page.includes('rel="noopener noreferrer"'));
});
