'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/mrs10-p01-kl-monorail-v2-registry.js');
const html=read('kl-monorail-v2.html'),ui=read('assets/mrs10-p01-kl-monorail-v2-viewer.js');
test('P01 Monorail V2: exactly 11 names / sequential codes and physically unverified',()=>{
 assert(api.validate());assert.deepEqual(api.stations.map(s=>s.code),Array.from({length:11},(_,i)=>'MR'+(i+1)));
 assert.equal(api.stations[0].name,'KL Sentral');assert.equal(api.stations[10].name,'Titiwangsa');
 assert.equal(api.route.adjacencies.length,10);
 assert(api.route.adjacencies.every(x=>x.physicalGeometry===null&&x.wayId===null));
 assert.equal(api.route.geometry,null);assert.equal(api.route.guideway,null);assert.equal(api.route.track,null);
});
test('P01 Monorail V2: correct interchange concept and independent service ID',()=>{
 assert.deepEqual(api.stations[3].interchangeServices,['lrt-ampang','lrt-sri-petaling']);
 assert.deepEqual(api.stations[5].interchangeServices,['mrt-kajang']);
 assert.equal(api.stations[7].interchangeType,'PEDESTRIAN_TO_DANG_WANGI');
 assert.deepEqual(api.stations[10].interchangeServices,['lrt-ampang','lrt-sri-petaling','mrt-putrajaya']);
 assert(api.stations.every(s=>s.serviceId==='kl-monorail'&&s.geometry===null));
});
test('P01 Monorail V2: reject unsupported candidate, code mismatch, duplicate, invalid coordinate',()=>{
 const mk=(name,id,extra={})=>({type:'node',id,lat:3.15,lon:101.70,
  tags:{name,railway:'station',monorail:'yes',...extra}});
 const result=api.sourceBacked([mk('KL Sentral',101),{...mk('Bukit Bintang',102,{ref:'MR6'}),lat:3.16},
  mk('Titiwangsa',103,{ref:'MR4'}),mk('Imbi',104,{monorail:'no'}),
  mk('Hang Tuah',105),mk('Hang Tuah',106)]);
 assert(result.ok);assert.deepEqual(result.stations.map(s=>s.code),['MR1','MR6']);
 assert.equal(api.sourceBacked([mk('KL Sentral',1),mk('KL Sentral',2)]).matched,0);
 assert.equal(api.sourceBacked([mk('Raja Chulan',3,{ref:'MR9'})]).matched,0);
 assert.equal(api.sourceBacked([mk('Imbi',4,{monorail:'no'})]).matched,0);
 assert.equal(api.sourceBacked([mk('Raja Chulan',5,{railway:'subway'})]).matched,0);
 assert.equal(api.sourceBacked([mk('Titiwangsa',6,{ref:'MR11'})]).matched,1);
 assert.equal(api.sourceBacked([{...mk('Chow Kit',7),lat:12}]).matched,0);
 const data=api.geoJSON(api.sourceBacked([mk('Chow Kit',77)]));
 assert.deepEqual(data.features[0].geometry.coordinates,[101.70,3.15]);
 assert.equal(data.features[0].properties.code,'MR10');
});
test('P01 Monorail V2: responsive isolated source-based map and UX controls',()=>{
 for(const term of ['maplibre-gl','id="mr-map"','id="list"','id="all"','id="focus"','id="reset"','id="theme"','id="lang"','noindex,nofollow','min-height:44px'])assert(html.includes(term),term);
 assert(!/<iframe\b/i.test(html));assert(!html.includes('supabase'));assert(!html.includes('assets/map-language-lab.js'));
 for(const term of ['sourceBacked','mr-poi-halo','mr-poi-label','text-allow-overlap','text-variable-anchor','circle-radius', 'queryRenderedFeatures','setDOMContent','role', 'overpass.kumi.systems']){if(term==='role')continue;assert(ui.includes(term),term);}
 assert(!ui.includes('type:\'line\''));assert(!ui.includes('setPaintProperty('));
 for(const lang of ['ms:','en:','zh:','th:'])assert(ui.includes(lang),lang);
 assert(api.visual.family==='LIGHT_GREEN_OPERATOR_TRANSIT_SCHEMATIC');
 assert(api.visual.geographicAlignmentAllowed===false&&api.visual.officialHex==='UNVERIFIED');
});
test('P01 Monorail V2: no shared registry, Auth/RLS, production code changes',()=>{
 const registry=read('assets/railway-track-registry-kl.js');
 const existing=require('../assets/railway-track-registry-kl.js');
 assert(existing.validateRegistry());assert.equal(existing.findRoute('mrt-kajang').stationSequence.length,29);
 assert.equal(existing.findRoute('lrt-kelana-jaya').stationSequence.length,37);
 assert.equal(existing.findRoute('mrt-putrajaya').stationSequence.length,36);
 assert(!registry.includes('mrs10-p01-kl-monorail-v2'));
});
