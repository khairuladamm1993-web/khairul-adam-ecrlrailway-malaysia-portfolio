const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../assets/malaysia-station-features.js'),O=require('../assets/asia-info-overlay.js');
const r=(id,name,type,lat,lon,locationConfidence='Public Reference Location')=>({id,name,type,lat,lon,locationConfidence});
test('public station projection keeps source and valid point features',()=>{
 const features=M.fromPublicReference([r('ref-1','Example','STN',3.14,101.7)]);
 assert.equal(features.length,1);assert(O.accepts(features[0]));assert.equal(features[0].geometry.coordinates[0],101.7);
 assert.match(O.renderPopup(features[0]),/Public reference locality/);
});
test('reject PL, depot, pending coordinates, duplicated ID and invalid locality',()=>{
 const features=M.fromPublicReference([r('ref-1','A','STN',3.14,101.7),r('ref-1','B','STN',3.15,101.8),
 r('ref-2','PL','PL',3.1,101.7),r('ref-3','Depot','Depot',3.1,101.7),
 r('ref-4','Pending','STN',null,null,'Pending Validation'),r('ref-5','Bad','STN',55,101.7)]);
 assert.equal(features.length,1);
});
test('Asia view reads existing public references without editing canonical map',()=>{
 const ui=fs.readFileSync('assets/asia-map-ui.js','utf8');
 assert(ui.includes('stationApi.fromPublicReference(window.RailwayCorridorReference||[])'));
 assert(ui.includes('api.mount(window.L,m,features)'));
 assert(!ui.includes('RailwayOwnerMap'));
});
