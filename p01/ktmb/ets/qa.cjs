'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const m=require('./model.js');
const base=__dirname;
test('module identity and scope remain isolated',()=>{
  assert.equal(m.manifest.moduleId,'mrs10-p01-ktmb-ets-v1');
  assert.equal(m.manifest.scope,'PASSENGER_VISITOR_MAP_REFERENCE_ONLY');
  assert.equal(m.manifest.defaultMapPolicy,'DO_NOT_RENDER_PHYSICAL_TRACK');
  assert.equal(m.manifest.geometryStatus,'NO_VERIFIED_WAY_GEOMETRY');
  assert.equal(m.manifest.services.length,1);
});
test('provisional colours are matched to their services',()=>{
  for(const s of m.manifest.services){
    assert.match(s.color,/^#[0-9A-F]{6}$/);
    assert.equal(s.operatorHexVerified,false);
    assert.equal(s.geometry,null);
    assert.deepEqual(s.stopSequence,[]);
    assert.deepEqual(m.getPublishedStops(s.id),[]);
  }
});
test('reject unsourced station sequence and fabricated geometry',()=>{
  const serviceId=m.manifest.services[0].id;
  const valid={serviceId,sourceType:'OFFICIAL_GOV_GTFS',sourceUrl:'https://api.data.gov.my/gtfs-static/ktmb',snapshotDate:'2026-10-27',stops:[{id:'a',name:'Station A'},{id:'b',name:'Station B'}],geometry:null};
  assert.equal(m.validateSourceDataset(valid).ok,true);
  assert.equal(m.validateSourceDataset({...valid,sourceUrl:'http://unsafe.example'}).ok,false);
  assert.equal(m.validateSourceDataset({...valid,stops:[...valid.stops,valid.stops[0]]}).ok,false);
  assert.equal(m.validateSourceDataset({...valid,geometry:{type:'LineString',coordinates:[]}}).ok,false);
  assert.equal(m.validateSourceDataset({...valid,stops:[{id:'a',name:'Station A',lat:1.2,lon:101.1},{id:'b',name:'Station B'}]}).ok,false);
  assert.equal(m.validateSourceDataset({...valid,serviceId:'other'}).ok,false);
});
test('isolation, security and four-language static UI',()=>{
  const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(base,'app.js'),'utf8');
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/min-height:44px/);
  for(const code of ['ms','en','zh','th'])assert.ok(app.includes('"'+code+'":{'),'Missing '+code+' locale');
  assert.doesNotMatch(html+app,/supabase\.co|service_role|access_token|member-dashboard|admin-panel/i);
  assert.doesNotMatch(app,/map\.addLayer|LineString|setLngLat/);
});
test('required operator and daily data sources retained',()=>{
  assert.ok(m.manifest.sources.some(s=>s.url==='https://www.ktmb.com.my/TrainTime.html'));
  assert.ok(m.manifest.sources.some(s=>s.url==='https://developer.data.gov.my/realtime-api/gtfs-static.en'));
});
