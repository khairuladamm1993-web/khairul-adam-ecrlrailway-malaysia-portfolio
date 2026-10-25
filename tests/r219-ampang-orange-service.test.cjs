'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=require('../assets/mrs10-r219-ampang-service.js');
const viewer=read('ampang-line-r219.html');
const existingMap=read('assets/map-language-lab.js');
const existingRegistry=require('../assets/railway-track-registry-kl.js');

test('R2.19: Ampang station count, order, codes, immutable membership and evidence',()=>{
 assert(api.validate());
 assert.equal(api.stations.length,18);
 assert.equal(api.route.stationSequence.length,18);
 assert.equal(api.route.serviceAdjacencies.length,17);
 assert.equal(api.stations[0].name,'Sentul Timur');
 assert.equal(api.stations[17].name,'Ampang');
 assert.deepEqual(api.stations.map(x=>x.serviceCode),Array.from({length:18},(_,i)=>'AG'+(i+1)));
 assert(api.stations.every(x=>x.sourceUrls.length>=2&&x.sourceUrls.every(x=>/^https:\/\//.test(x))));
 assert.equal(api.stationByCode('AG2').name,'Sentul');
 assert.equal(api.stationByCode('AG11').name,'Chan Sow Lin');
 assert.equal(api.stationByCode('AG19'),null);
 assert.equal(new Set(api.stations.map(s=>s.id)).size,18);
});
test('R2.19: shared 11 stops, then seven Ampang-only stops; not duplicate tracks',()=>{
 const a=api.stations;
 assert(a.slice(0,11).every(x=>x.sharedPassengerService&&x.serviceIds.includes('lrt-sri-petaling')));
 assert(a.slice(11).every(x=>!x.sharedPassengerService&&!x.serviceIds.includes('lrt-sri-petaling')));
 assert.equal(api.route.sharedServiceSection.stationCount,11);
 assert.equal(api.route.branch.serviceDivergenceAt,'Chan Sow Lin');
 assert.equal(api.route.branch.physicalJunctionGeometry,'UNVERIFIED');
 assert.equal(api.route.sharedServiceSection.geometry,null);
 assert.equal(api.route.sharedServiceSection.trackCount,'UNVERIFIED');
 assert.equal(api.route.acceptedPhysicalTrackWays.length,0);
});
test('R2.19: orange official family but exact hex and alignment unverified',()=>{
 assert.equal(api.officialServiceColor.label,'Orange / Oren');
 assert.equal(api.officialServiceColor.officialHex,'UNVERIFIED');
 assert.equal(api.officialServiceColor.alignmentColorAllowed,false);
 assert.equal(api.route.geometry,null);
 assert(api.stations.every(s=>s.geometry===null&&s.poiMatchStatus==='UNVERIFIED'&&
  s.physicalTrackIds.length===0&&s.railwayWayIds.length===0));
 assert(api.route.serviceAdjacencies.every(e=>e.geometry===null&&e.railwayWayId===null));
});
test('R2.19: exact-code candidate matching rejects fabricated, ambiguous and cross-line POIs',()=>{
 const expected=api.candidatePoi({class:'railway',subclass:'subway',name:'AG13 Maluri'});
 assert.equal(expected.stationId,'mrs10-lrt-ampang-ag13');
 assert.equal(expected.classification,'UNVERIFIED_CARTOGRAPHIC_CANDIDATE_NOT_ALLOWED_FOR_HIGHLIGHT');
 const rejects=[null,{}, {class:'railway',subclass:'station',name:'Maluri'},
  {class:'railway',subclass:'station',name:'AG13 Merdeka'},
  {class:'railway',subclass:'station',name:'AG99 Maluri'},
  {class:'railway',subclass:'station',name:'AG13 Maluri','name:en':'Wrong'},
  {class:'railway',subclass:'halt',name:'AG13 Maluri'},
  {class:'transit',subclass:'subway',name:'AG13 Maluri'},
  {class:'railway',subclass:'subway',name:'KG22 Maluri'}];
 assert(rejects.every(x=>api.candidatePoi(x)===null));
 assert.equal(api.observedPoiCrosswalk.length,0);
 assert.equal(api.verifiedPoi({class:'railway',subclass:'subway',name:'AG13 Maluri'}),null);
});
test('R2.19: isolated viewer retains existing map with no App JS or shared registry rewrite',()=>{
 assert.match(viewer,/<iframe[^>]*map-language-lab\.html\?railPilot=1/);
 assert.match(viewer,/<script src="\.\/assets\/mrs10-r219-ampang-service\.js"/);
 assert.doesNotMatch(viewer,/mrl-ampang-physical-alignment/);
 assert.match(viewer,/#A65100/);
 assert.match(viewer,/#FFBB7B/);
 assert.equal(existingRegistry.findRoute('mrt-kajang').stationSequence.length,29);
 assert.equal(existingRegistry.findRoute('lrt-ampang').stationSequenceStatus,'NOT_YET_VERIFIED');
 assert.equal(existingRegistry.catalog.physicalSegments.length,0);
 assert.match(existingMap,/syncKajangPoiHighlights/);
 assert.doesNotMatch(existingMap,/mrl-ampang-physical-alignment/);
});
function boot(){
 const dom=new JSDOM(viewer,{url:'https://qa.example/ampang-line-r219.html',runScripts:'outside-only'});
 const w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.eval(read('assets/mrs10-r219-ampang-service.js'));
 const inline=viewer.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
 assert(inline,'standalone viewer script');
 w.eval(inline[1]);return w;
}
test('R2.19: 18 tappable orange station references, source popup, four-language and Dark Mode',()=>{
 const w=boot(),d=w.document,items=()=>d.querySelectorAll('#station-list li');
 assert.equal(items().length,18);
 assert.match(items()[0].textContent,/Sentul Timur/);
 items()[6].querySelector('button').click();
 assert.equal(d.getElementById('details').open,true);
 assert.match(d.getElementById('station-title').textContent,/Masjid Jamek/);
 assert.match(d.getElementById('station-interchange').textContent,/lrt-kelana-jaya/);
 assert.match(d.getElementById('station-geometry').textContent,/BELUM DISAHKAN/);
 assert.match(d.getElementById('station-source').href,/prasarana\.com\.my/);
 for(const l of ['en','zh','th','ms']){
  const select=d.getElementById('lang');select.value=l;
  select.dispatchEvent(new w.Event('change'));
  assert.equal(d.documentElement.lang,l);
  assert.equal(items().length,18);
  assert.match(items()[6].textContent,/Masjid Jamek/);
 }
 d.getElementById('theme').click();
 assert.equal(d.documentElement.dataset.theme,'dark');
 assert.equal(items().length,18);
 d.getElementById('close').click();
 assert.equal(d.getElementById('details').open,false);
 w.close();
});

test('R2.19 Safari UX: orange registry precedes collapsed generic base map with explicit disclaimer',()=>{
 const d=boot().document;
 const registry=d.getElementById('registry'),mapPanel=d.getElementById('map-reference');
 assert(registry&&mapPanel);
 assert(registry.compareDocumentPosition(mapPanel)&d.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.equal(mapPanel.open,false,'general map must not obscure the confirmed service registry by default');
 assert.match(d.getElementById('map-ref-note').textContent,/Titik biru ialah POI umum/);
 assert.match(mapPanel.querySelector('iframe').getAttribute('src'),/map-language-lab\.html\?railPilot=1/);
 assert.equal(d.querySelectorAll('#station-list li').length,18);
 assert.equal(d.querySelectorAll('#station-list .shared-tag').length,11);
 assert.equal(d.querySelectorAll('#station-list li:nth-child(n+12) .shared-tag').length,0);
 for(const l of ['en','zh','th']){
  const select=d.getElementById('lang');select.value=l;select.dispatchEvent(new d.defaultView.Event('change'));
  assert.notEqual(d.getElementById('map-ref-note').textContent,'');
  assert.equal(d.querySelectorAll('#station-list li').length,18);
  assert.equal(d.querySelectorAll('#station-list .shared-tag').length,11);
 }
 d.defaultView.close();
});
