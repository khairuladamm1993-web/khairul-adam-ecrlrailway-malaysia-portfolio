'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),cat=JSON.parse(fs.readFileSync(path.join(root,'assets/mrs10-r223-ktm-catalogue.json'),'utf8')),api=require('../assets/mrs10-r223-ktm-service.js'),html=fs.readFileSync(path.join(root,'ktm-komuter-v2.html'),'utf8');
const payload=(stops)=>({schemaVersion:1,source:'KTMB_GTFS_STATIC_STOP_COORDINATES',sourceUrl:'https://api.data.gov.my/gtfs-static/ktmb',license:'CC BY 4.0',stops});
const point=(name,lat,lon,services)=>({name,lat,lon,gtfsStopId:'k'+name,serviceIds:services});
test('official GTFS coordinates match all 4 northern/southern categories with correct colors',()=>{
 const rows=[
 point('Padang Besar',6.662205,100.319514,['ktm-padang-besar']),
 point('Butterworth',5.393343,100.366201,['ktm-padang-besar','ktm-ipoh']),
 point('Ipoh',4.597526,101.07333,['ktm-ipoh']),
 point('Paloh',2.186932,103.193987,['ktm-shuttle-selatan-paloh']),
 point('Kluang',2.033666,103.31773,['ktm-shuttle-selatan-paloh']),
 point('Kempas Baru',1.535744,103.721801,['ktm-shuttle-selatan-paloh','ktm-shuttle-selatan-pasirgudang']),
 point('Pasir Gudang',1.444783,103.92152,['ktm-shuttle-selatan-pasirgudang'])
 ];
 const d=api.decodeOfficialGis(payload(rows),cat);
 a.equal(d.matched,7);
 for(const id of ['ktm-padang-besar','ktm-ipoh','ktm-shuttle-selatan-paloh','ktm-shuttle-selatan-pasirgudang'])
  a(api.featuresForRoute(d,id).features.length>=2);
 a(d.features.every(f=>f.properties.status==='OFFICIAL_KTMB_GTFS_STOP_COORDINATE'));
 a.equal(d.features.find(f=>f.properties.name==='Butterworth').properties.serviceIds.split('|').length,2);
});
test('invalid source, forged coordinates, mismatched service and duplicates fail closed',()=>{
 a.equal(api.decodeOfficialGis(payload([point('Padang Besar',1.3,103.6,['ktm-padang-besar'])]),cat).matched,0);
 a.equal(api.decodeOfficialGis(payload([point('Pasir Gudang',1.444,103.92,['ktm-padang-besar'])]),cat).matched,0);
 a.equal(api.decodeOfficialGis(payload([point('Unknown',6.66,100.3,['ktm-padang-besar'])]),cat).matched,0);
 const x=point('Kluang',2.03,103.32,['ktm-shuttle-selatan-paloh']);
 const d=api.decodeOfficialGis(payload([x,x]),cat);
 a.equal(d.matched,0);a(d.rejected.some(x=>x.reason==='DUPLICATE_OFFICIAL_STATION'));
 a.equal(api.decodeOfficialGis({source:'unknown',stops:[]},cat).ok,false);
});
test('official GTFS points override secondary GIS, while missing official data retains secondary',()=>{
 const secondary=api.decodeGis({features:[{attributes:{STN_NAME:'KL Sentral',FID:1},geometry:{x:101.7,y:3.15}}]},cat);
 const verified=api.decodeOfficialGis(payload([point('KL Sentral',3.136,101.687,['ktm-seremban','ktm-port-klang']),point('Kluang',2.033666,103.31773,['ktm-shuttle-selatan-paloh'])]),cat);
 const merged=api.mergeOfficialGis(secondary,verified);
 a.equal(merged.matched,2);
 a.deepEqual(merged.features.find(f=>f.properties.name==='KL Sentral').geometry.coordinates,[101.687,3.136]);
 a.equal(api.mergeOfficialGis(secondary,null).matched,1);
});
test('actual HTML requests CI-bundled GTFS JSON without contacting public ZIP in Safari',()=>{
 a.match(html,/mrs10-r225-ktm-gtfs-stations\.json/);
 a.match(html,/api\.decodeOfficialGis/);
 a.match(html,/api\.mergeOfficialGis/);
 a.match(html,/OFFICIAL_KTMB_GTFS_STOP_COORDINATE/);
 a.match(html,/source\.textContent/);
 a.doesNotMatch(html,/fetch\('https:\/\/api\.data\.gov\.my\/gtfs-static\/ktmb'/);
});
