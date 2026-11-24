'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/public-gateway.js'),'utf8');
function boot(initialMember=false,hash='',category='map'){
 const nodes=new Map(),listeners=new Map();
 function stub(){
  return {innerHTML:'',hidden:false,open:false,scrollTop:0,
   addEventListener(){},setAttribute(){},querySelector(){return stub();},focus(){}};
 }
 const document={
  querySelector(selector){if(!nodes.has(selector))nodes.set(selector,stub());return nodes.get(selector);},
  addEventListener(){}
 };
 const railway={html:x=>String(x),escape:x=>String(x),language:'ms',onLanguage(){}};
 const window={
  MRS10P01MapCore:require('../assets/p01-map-core.js'),location:{hash},
  Railway:railway,RailwayAccess:{canReadMemberContent:initialMember},
  RailwayModulePreviews:[],RailwayInsights:[],
  addEventListener(name,callback){listeners.set(name,callback);}
 };
 const sessionStorage={getItem(key){return key==='railway-gateway-category'?JSON.stringify(category):key==='railway-gateway-destination'?'"journey"':null;},setItem(){}};
 vm.runInNewContext(source,{window,document,sessionStorage,CustomEvent:class{},setTimeout(){}},{timeout:3000});
 return {window,nodes,dispatch:name=>listeners.get(name)?.()};
}
test('Visitor is served V7, logging in upgrades to V8, signing out restores V7',()=>{
 const app=boot(false),html=()=>app.nodes.get('#gateway-content').innerHTML;
 assert.match(html(),/data-map-audience="public"/);
 assert.match(html(),/src="unified-map-v7\.html"/);
 assert.doesNotMatch(html(),/data-gis-reference/);
 app.window.RailwayAccess.canReadMemberContent=true;
 app.dispatch('railway-access-change');
 assert.match(html(),/data-map-audience="member"/);
 assert.match(html(),/src="unified-map-v8\.html"/);
 assert.match(html(),/data-gis-reference/);
 app.window.RailwayAccess.canReadMemberContent=false;
 app.dispatch('railway-access-change');
 assert.match(html(),/data-map-audience="public"/);
 assert.doesNotMatch(html(),/data-gis-reference/);
});
test('Authenticated first render shows V8 without a public intermediate frame',()=>{
 const app=boot(true);
 const html=app.nodes.get('#gateway-content').innerHTML;
 assert.match(html,/src="unified-map-v8\.html"/);
 assert.doesNotMatch(html,/src="unified-map-v7\.html"/);
});

test('Lazy legacy map mount refuses stale member sessions and detached hosts',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../assets/public-gateway.js'),'utf8');
 assert.match(source,/if\(!window\.RailwayAccess\?\.canReadMemberContent\)return Promise\.resolve\(\)/);
 assert.match(source,/if\(!window\.RailwayAccess\?\.canReadMemberContent\|\|!host\|\|host\.hidden\)return/);
 assert.match(source,/return m\.mount\(host\)/);
});

test('Direct Public Map return supersedes stored category and links locally',()=>{
 const app=boot(false,'#map','about');
 const html=app.nodes.get('#gateway-content').innerHTML;
 assert.match(html,/src="unified-map-v7\.html"/);
 assert.match(html,/href="map-language-lab\.html\?railPilot=1"/);
 assert.match(html,/href="ecrl-asset-reference\.html"/);
 assert.doesNotMatch(html,/vercel\.app|data-gis-reference|unified-map-v8/);
});
