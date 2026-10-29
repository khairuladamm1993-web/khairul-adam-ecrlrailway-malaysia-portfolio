'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function setup(){
 const dom=new JSDOM('<!doctype html><html><body><button id="lab-camera-2d"></button><button id="lab-camera-3d"></button><button id="lab-camera-follow"></button><span id="lab-camera-status"></span></body></html>',{url:'https://preview.example.test'});
 const w=dom.window,ctx={window:w,document:w.document};
 for(const p of ['assets/unified-ecrl/chainage-manifest.js','assets/unified-ecrl/source/data.js','assets/unified-ecrl/route-lab-station-intelligence.js','assets/unified-ecrl/route-lab-d102-camera.js'])
 vm.runInNewContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
 let movements=[],pitch=0;const map={getStyle:()=>({version:8}),getZoom:()=>10,getLayer:()=>null,
 easeTo:x=>{movements.push(x);pitch=x.pitch??pitch},setPitch:x=>{pitch=x},on:()=>{}};
 const api=w.MRS10D102Camera;api.connect(map);
 return {dom,w,api,map,movements,get pitch(){return pitch}};
}
test('default 2D top-down, optional tilted 3D and follow are real UI controls',()=>{
 const x=setup();assert.equal(x.api.snapshot().view,'2d');assert.equal(x.api.snapshot().follow,true);
 x.w.document.getElementById('lab-camera-3d').click();
 assert.equal(x.api.snapshot().view,'3d');assert.equal(x.movements.at(-1).pitch,52);
 assert.equal(x.api.snapshot().terrain3D,false);
 assert.equal(x.api.snapshot().rendering,'TILTED_2_5D_MAP');
 x.w.document.getElementById('lab-camera-2d').click();
 assert.equal(x.movements.at(-1).pitch,0);
 x.w.document.getElementById('lab-camera-follow').click();
 assert.equal(x.api.snapshot().follow,false);x.dom.window.close();
});
test('CH-only train never interpolates physical lat/lon between checkpoints',()=>{
 const x=setup(),api=x.api;
 api.sync({CH:670});assert.equal(api.snapshot().mode,'STATION_REFERENCE');
 assert.equal(api.snapshot().hasVerifiedGeographicSimulationPosition,false);
 assert.equal(x.movements.length,1);
 api.sync({CH:17500});assert.equal(api.snapshot().mode,'WAITING_FOR_RAIL_VECTOR');
 assert.equal(x.movements.length,1);
 api.sync({CH:33700});assert.equal(api.snapshot().mode,'STATION_REFERENCE');
 assert.equal(x.movements.length,2);
 assert.equal(api.snapshot().realTimeGPS,false);
 x.dom.window.close();
});
test('camera follows only accepted model railway coordinates and stops when disabled',()=>{
 const x=setup(),api=x.api;
 api.sync({CH:32000,simulationPosition:[102.5,5.5]});
 assert.equal(api.snapshot().mode,'VECTOR_FOLLOW');
 assert.equal(x.movements.length,1);
 assert.deepEqual(Array.from(x.movements[0].center),[102.5,5.5]);
 api.setFollow(false);api.sync({CH:32500,simulationPosition:[102.7,5.7]});
 assert.equal(x.movements.length,1);
 api.setFollow(true);api.sync({CH:33000,simulationPosition:[102.7,5.7]});
 assert.equal(x.movements.length,2);
 x.dom.window.close();
});
