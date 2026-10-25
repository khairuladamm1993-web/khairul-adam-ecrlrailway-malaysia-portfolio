'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const kl=require('../assets/railway-track-registry-kl.js');
const am=require('../assets/mrs10-r219-ampang-service.js');
test('R2.21: four services coexist without inventing physical tracks or merging ID spaces',()=>{
 assert(kl.validateRegistry());assert(am.validate());
 assert.equal(kl.findRoute('mrt-kajang').stationSequence.length,29);
 assert.equal(kl.findRoute('lrt-kelana-jaya').stationSequence.length,37);
 assert.equal(kl.findRoute('mrt-putrajaya').stationSequence.length,36);
 assert.equal(am.stations.length,18);
 assert.equal(kl.catalog.provisionalStations.length,5);
 assert.equal(kl.osmRelationAudit.acceptedWayIds.length,0);
 assert.equal(kl.catalog.physicalSegments.length,0);
 assert(kl.catalog.routes.every(r=>r.geometry===null));
});
test('R2.21: source-coded first/last Putrajaya and Kajang R2.17.5 both available',()=>{
 assert.equal(kl.matchSourcedPutrajayaPoi({class:'railway',subclass:'station',name:'KG04 PY01 Kwasa Damansara'})?.stopPosition,1);
 assert.equal(kl.matchSourcedPutrajayaPoi({class:'railway',subclass:'station',name:'PY41 Putrajaya Sentral'})?.stopPosition,36);
 assert.equal(kl.matchSourcedKajangPoi({class:'railway',subclass:'station',name:'KG13 Pusat Bandar Damansara'})?.stopPosition,9);
 assert(kl.kajangPoiSourceNames.length>=29);
});
test('R2.21: 4-language Ampang navigation and standalone page are published together',()=>{
 const html=read('map-language-lab.html'),js=read('assets/map-language-lab.js');
 assert.match(html,/id="r219-ampang-integrated-link"/);
 assert.match(html,/href="\.\/ampang-line-r219\.html"/);
 for(const label of ['18 stesen','18 stations','18站','18 สถานี'])assert(js.includes(label),label);
 assert(js.includes("ampangLink.hidden=route.id!=='lrt-ampang'"));
 assert(html.includes('id="putrajaya-kwasa-focus"'));
 assert.match(read('scripts/build-preview.py'),/'ampang-line-r219\.html'/);
 assert.match(read('scripts/build-production.py'),/"ampang-line-r219\.html"/);
 const page=read('ampang-line-r219.html');
 assert(page.includes('mrs10-r219-ampang-service.js'));
 assert(page.includes('r219-map-shell'));
 assert(!/<iframe\b/i.test(page));
});
