'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c=JSON.parse(fs.readFileSync(path.join(root,'assets/mrs10-r223-ktm-catalogue.json'),'utf8'));
const api=require('../assets/mrs10-r223-ktm-service.js');
const html=fs.readFileSync(path.join(root,'ktm-komuter-v2.html'),'utf8');
const national=(name,x,y,id=1)=>({attributes:{Nama_Terminal:name,OBJECTID:id},geometry:{x,y}});
const central=(name,x=101.65,y=3.12,id=1)=>({attributes:{STN_NAME:name,FID:id},geometry:{x,y}});
test('national GIS decoder accepts only exact catalogued northern and southern station points in sector bounds',()=>{
 const result=api.decodeNationalGis({features:[
  national('Padang Besar',100.3,6.65,1),
  national('Butterworth',100.37,5.39,2),
  national('Kluang',103.32,2.03,3),
  national('Kempas Baru',103.7,1.52,4),
  national('Pasir Gudang',103.91,1.45,5)]},c);
 assert.equal(result.ok,true);assert.equal(result.matched,5);
 assert.equal(api.featuresForRoute(result,'ktm-padang-besar').features.length,2);
 assert.equal(api.featuresForRoute(result,'ktm-ipoh').features.length,1);
 assert.equal(api.featuresForRoute(result,'ktm-shuttle-selatan-paloh').features.length,2);
 assert.equal(api.featuresForRoute(result,'ktm-shuttle-selatan-pasirgudang').features.length,2);
 assert(result.features.every(f=>f.properties.status==='NATIONAL_GIS_NAME_MATCH_NOT_SURVEYED'));
});
test('national GIS never assigns a southern station point to northern coordinates',()=>{
 const a=api.decodeNationalGis({features:[
 national('Padang Besar',103.6,1.65,1),
 national('Kempas Baru',100.3,6.65,2),
 national('Unknown Station',103.6,1.65,3),
 national('Putra',101.7,3.15,4)]},c);
 assert.equal(a.matched,0);assert.equal(a.rejected.length,4);
});
test('ambiguous duplicate national GIS names fail closed; invalid service response rejected',()=>{
 const d=api.decodeNationalGis({features:[national('Kluang',103.3,2.0,1),national('Kluang',103.31,2.01,2)]},c);
 assert.equal(d.matched,0);assert(d.rejected.some(x=>x.reason==='DUPLICATE_NAME'));
 assert.equal(api.decodeNationalGis({error:{message:'unauthorized'},features:[]},c).ok,false);
});
test('independent GIS source outages preserve valid points from other source',()=>{
 const kl=api.decodeGis({features:[central('KL Sentral')]},c);
 const north=api.decodeNationalGis({features:[national('Padang Besar',100.3,6.65)]},c);
 const merged=api.mergeGis(kl,north);
 assert.equal(merged.matched,2);
 assert.equal(api.mergeGis(null,north).matched,1);
 assert.equal(api.mergeGis(kl,null).matched,1);
 assert.equal(api.mergeGis(null,null).ok,false);
});
test('source duplicate cross-match cannot create phantom marker',()=>{
 const kl=api.decodeGis({features:[central('KL Sentral')]},c);
 const other={ok:true,features:structuredClone(kl.features)};
 const m=api.mergeGis(kl,other);
 assert.equal(m.matched,0);assert(m.rejected.some(x=>x.reason==='CROSS_SOURCE_DUPLICATE'));
});
test('browser resets obsolete no-point status and uses bounded independent GIS requests',()=>{
 assert.match(html,/function selectRoute\(id\)\{[\s\S]*?focus=id;[\s\S]*?activePopup\?\.remove\(\);activePopup=null;[\s\S]*?render\(\);[\s\S]*?updateLayers\(\);[\s\S]*?statusMessage\(\);[\s\S]*?focusSelectedRoute\(\);/);
 assert.match(html,/Promise\.allSettled\(/);
 assert.match(html,/api\.NATIONAL_GIS_URL/);
 assert.match(html,/word\(\)\.noMapped/);
 assert.match(html,/AbortController\(/);
 assert.doesNotMatch(html,/supabase|localStorage|member-gateway|GTM-|LineString/i);
});
test('no invented coordinates or physical railway polylines in station data',()=>{
 assert.equal(c.physicalTrackGeometry,null);
 for(const r of c.services){assert.equal(r.geometry,null);for(const s of r.stationSequence)assert.equal(s.coordinates,null);}
});
