import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {SOURCES,summary,classify} from '../scripts/audit-ecrl-public-geoservices.mjs';
const metadata={geometryType:'esriGeometryPolyline',name:'LANDASAN KERETAPI SEM. MSIA',drawingInfo:{renderer:{uniqueValueInfos:[{label:'Keretapi Tanah Melayu (KTM)'},{label:'Mass Rapid Transit (MRT)'},{label:'Express Rail Link (ERL)'}]}}};
test('MyGeoportal railway metadata with no ECRL label cannot pass identity gate',()=>{
 assert.equal(classify(metadata,SOURCES[0]),'GENERIC_RAIL_WITHOUT_ECRL_CLASS');
 assert.equal(classify({...metadata,drawingInfo:{renderer:{uniqueValueInfos:[{label:'ECRL'}]}}},SOURCES[0]),'ECRL_LABELED_NEEDS_ASBUILT_PROOF');
});
test('named public ArcGIS ECRL layer remains planning candidate not surveyed track',()=>{
 assert.equal(classify({...metadata,name:'Rel ECRL CN'},SOURCES[1]),'ECRL_NAMED_PLANNING_NEEDS_PROOF');
 assert.equal(classify({...metadata,geometryType:'esriGeometryPoint'},SOURCES[1]),'NOT_A_TRACK_LINE');
});
test('public metadata probe has no synthetic geometry, private data, or automatic consumer publication',()=>{
 assert.equal(SOURCES.length,4);assert.equal(summary.publishedTrackGeometry,false);
 assert.equal(summary.permittedNewPLPins,0);assert.equal(summary.permittedRailEndPins,0);
 const text=fs.readFileSync('scripts/audit-ecrl-public-geoservices.mjs','utf8');
 assert(!text.includes('returnGeometry=true'));
 assert(!text.includes('outFields=*'));
 assert(!/navigator\.geolocation|localStorage|supabase|service_role/i.test(text));
 assert.equal(summary.chChainageToGeoMapping,'BLOCKED_NO_LINEAR_REFERENCING_CONTROL');
});
