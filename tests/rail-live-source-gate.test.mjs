import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodePublicSummary} from '../api/ktmb-public-telemetry.mjs';
import gate from '../assets/rail-live-source-gate.js';
const utf8=x=>Buffer.from(x,'utf8');
const vi=n=>{const a=[];while(n>127){a.push((n&127)|128);n=Math.floor(n/128)}return Buffer.from([...a,n])};
const field=(no,body)=>Buffer.concat([vi(no*8+2),vi(body.length),body]);
const number=(no,n)=>Buffer.concat([vi(no*8),vi(n)]);
const speed=(no,n)=>{const b=Buffer.alloc(5);b[0]=no*8+5;b.writeFloatLE(n,1);return b};
function fixture(t,withSpeed=true){
 const header=field(1,Buffer.concat([field(1,utf8('2.0')),number(3,t)]));
 const position=Buffer.concat([speed(1,3.1),speed(2,101.7),...(withSpeed?[speed(5,16.5)]:[])]);
 const vehicle=field(4,Buffer.concat([field(2,position),number(5,t)]));
 return Buffer.concat([header,field(2,Buffer.concat([field(1,utf8('train')),vehicle]))]);
}
test('official summary parser distinguishes optional observational speed from permitted line speed',()=>{
 const t=1793050000,now=t*1000+15000,result=decodePublicSummary(fixture(t),now);
 assert.equal(result.status,'CONNECTED');assert.equal(result.reportedVehicles,1);
 assert.equal(result.withObservedSpeed,1);assert.equal(result.stationApproachSpeed.valueKmh,null);
 assert.equal(result.stationThroughSpeed.valueKmh,null);
 assert.equal(result.temporarySpeedRestriction.valueKmh,null);
 assert.equal(gate.accept(result),true);
 assert(!Object.hasOwn(result,'vehicleId'));assert(!Object.hasOwn(result,'position'));
});
test('missing train speed not fabricated; expired timestamps do not display live',()=>{
 const t=1793050000;const r=decodePublicSummary(fixture(t,false),t*1000+220000);
 assert.equal(r.withObservedSpeed,0);assert.equal(r.status,'STALE');
});
test('malformed protobuf fail closed and invalid source rejected',()=>{
 assert.throws(()=>decodePublicSummary(Buffer.from([0xff,0xff])));
 assert.equal(gate.accept({source:'FAKE',status:'CONNECTED'}),false);
});
test('station popup only reports official statuses; no extra external map buttons or Shuttle Timuran',()=>{
 const page=fs.readFileSync('unified-map-v7-live-lab.html','utf8');
 const js=fs.readFileSync('assets/unified-v7-live-map.js','utf8');
 const s=fs.readFileSync('assets/rail-live-source-gate.js','utf8');
 assert(page.includes('assets/rail-live-source-gate.js'));
 assert(js.includes('enhancePopup(container,point)'));
 assert.equal((js.match(/new maplibregl\.Map\(/g)||[]).length,1);
 assert(!page.includes('ktmb-shuttle-timuran'));
 assert(s.includes("fetch('./api/ktmb-public-telemetry'"));
 assert(s.includes("NOT_PUBLISHED"));
});
