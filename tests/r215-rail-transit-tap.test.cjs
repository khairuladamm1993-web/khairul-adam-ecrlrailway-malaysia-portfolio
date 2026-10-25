const test=require('node:test'),assert=require('node:assert/strict');
const {pilotEligibleRail,railVectorLayer,railVectorFilter,queryPilotVectorFeature,pilotEligibleStation}=require('../assets/map-language-lab.js');
test('R2.15 OpenMapTiles railway class mappings cover conventional and urban modes without inventing operators',()=>{
 for(const t of ['rail','narrow_gauge','preserved','funicular'])assert.equal(pilotEligibleRail({class:'rail',subclass:t}),true,t);
 for(const t of ['subway','light_rail','monorail','tram'])assert.equal(pilotEligibleRail({class:'transit',subclass:t}),true,t);
 for(const t of [{class:'rail',subclass:'light_rail'},{class:'transit',subclass:'rail'},{class:'motorway',subclass:'motorway'},{class:'transit',subclass:'bus'},{class:'railway',subclass:'station'},null])assert.equal(pilotEligibleRail(t),false);
});
test('R2.15 both readable lines and hit-test layer share source-class filter',()=>{
 const layer=railVectorLayer('osm',false);
 assert.deepEqual(layer.filter,railVectorFilter);
 assert.deepEqual(railVectorFilter[1][2][1],['rail','transit']);
 assert.deepEqual(railVectorFilter[2][2][1],['rail','narrow_gauge','preserved','funicular','subway','light_rail','monorail','tram']);
});
test('R2.15 bounded touch query uses real source-backed layer geometry only',()=>{
 let geometry=null,options=null;
 const map={
  getLayer:id=>id==='mrl-pilot-rail-hits'?{id}:null,
  queryRenderedFeatures:(rect,opts)=>{geometry=rect;options=opts;return [{
   layer:{id:'mrl-pilot-rail-hits'},properties:{class:'transit',subclass:'light_rail'}
  }]}
 };
 const result=queryPilotVectorFeature(map,{x:150,y:220});
 assert.equal(result.kind,'rail');
 assert.equal(result.feature.properties.subclass,'light_rail');
 assert.deepEqual(geometry,[[138,208],[162,232]]);
 assert.deepEqual(options.layers,['mrl-pilot-rail-hits']);
});
test('R2.15 station POI has priority over multiple adjacent railway lines',()=>{
 const hits=[
  {layer:{id:'mrl-pilot-rail-hits'},properties:{class:'rail',subclass:'rail'}},
  {layer:{id:'mrl-pilot-stations'},properties:{class:'railway',subclass:'station',name:'Liuzhou'}},
  {layer:{id:'mrl-pilot-rail-hits'},properties:{class:'transit',subclass:'tram'}}
 ];
 const map={getLayer:id=>({id}),queryRenderedFeatures:()=>hits};
 const r=queryPilotVectorFeature(map,{x:2,y:3});
 assert.equal(r.kind,'station');
 assert.equal(r.feature.properties.name,'Liuzhou');
});
test('R2.15 empty / incomplete hit query is a diagnostic, not a fabricated feature',()=>{
 const map={getLayer:id=>({id}),queryRenderedFeatures:()=>[]};
 assert.equal(queryPilotVectorFeature(map,{x:9,y:9}),null);
 assert.equal(queryPilotVectorFeature(map,{x:NaN,y:9}),null);
 assert.equal(queryPilotVectorFeature({getLayer:()=>null,queryRenderedFeatures:()=>[]},{x:9,y:9}),null);
 const bad={getLayer:id=>({id}),queryRenderedFeatures:()=>[{layer:{id:'mrl-pilot-rail-hits'},properties:{class:'motorway',subclass:'rail'}}]};
 assert.equal(queryPilotVectorFeature(bad,{x:9,y:9}),null);
});
test('R2.15 station POI eligibility remains source-backed',()=>{
 assert(pilotEligibleStation({class:'railway',subclass:'station'}));
 assert(!pilotEligibleStation({class:'bus',subclass:'bus_stop'}));
});
