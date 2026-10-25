const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const maps=require('../assets/map-language-lab.js');
test('readable rails use an actual transportation vector source, never guessed geometry',()=>{
 const style={sources:{osm:{type:'vector'},notrail:{type:'raster'}},layers:[
  {id:'base-road',source:'osm','source-layer':'transportation',type:'line'},
  {id:'road-label',source:'osm','source-layer':'place',type:'symbol'}]};
 assert.equal(maps.transportationSource(style),'osm');
 assert.equal(maps.transportationSource({sources:{},layers:[]}),null);
 assert.equal(maps.transportationSource({sources:{notrail:{type:'raster'}},layers:[{source:'notrail','source-layer':'transportation'}]}),null);
});
test('rail geometry filters both supported OpenMapTiles railway classes rail and transit',()=>{
 const layer=maps.railVectorLayer('osm',false);
 assert.equal(layer.type,'line');
 assert.equal(layer.source,'osm');
 assert.equal(layer['source-layer'],'transportation');
 assert.deepEqual(layer.filter,maps.railVectorFilter);
 assert.deepEqual(layer.filter[1][2][1],['rail','transit']);
 assert.equal(layer.minzoom,8);
 assert(!('features' in layer));
 assert.equal(maps.railVectorLayer('osm',true).paint['line-color']!==layer.paint['line-color'],true);
});
test('railway technical detail is optional; English names remain in vector layer',()=>{
 const js=read('assets/map-language-lab.js'),html=read('map-language-lab.html');
 assert.match(js,/visibility:railVisibility\(railDetails\)/);
 assert.match(js,/function readableRails\(\)/);
 assert.match(js,/const rails=readableRails\(\)/);
 assert.match(js,/overlay\(\);applyLabels\(\);setRailVisibility\(\)/);
 assert.match(js,/railDetails\?readableRailLanguage\[lang\]\.technical/);
 assert.match(js,/map\.setLayoutProperty\(layer\.id,'text-field',nameExpression\(lang\)\)/);
 assert.match(html,/id="rail-vector-note"/);
});
test('Liuzhou English-Chinese name guide does not impersonate verified station coordinates',()=>{
 const html=read('map-language-lab.html');
 assert.match(html,/Liuzhou South · Liǔzhōu Nán/);
 assert.match(html,/柳州南/);
 assert.match(html,/Liuzhou · Liǔzhōu/);
 assert.match(html,/id="liuzhou-guide"[^>]*hidden/);
 assert.match(html,/Not validated geographic station coordinates/);
 assert.doesNotMatch(html,/data-lat|data-long|data-chainage/);
});
test('legacy Owner and ECRL geometry sources remain unchanged by new map',()=>{
 const p=read('assets/map-gateway.js');
 assert.match(p,/EXACT_ZOOM=11/);
 assert.match(p,/tile\.openstreetmap\.org/);
 const visitor=read('assets/map-language-lab.js');
 assert.doesNotMatch(visitor,/supabase\.co|owner_account|auth\.users/);
 assert.match(visitor,/OpenRailwayMap/);
});
