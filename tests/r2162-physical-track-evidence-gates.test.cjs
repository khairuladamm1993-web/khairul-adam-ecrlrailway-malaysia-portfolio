const test=require('node:test'),assert=require('node:assert/strict');
const {audit,validate}=require('../assets/railway-track-physical-audit-kl.js');
const {catalog,validateRegistry,findRoute}=require('../assets/railway-track-registry-kl.js');
test('R2.16.2 operator confirmed station sequence and physical railway evidence are separately classified',()=>{
 assert.equal(validate(),true);
 assert.equal(validateRegistry(),true);
 assert.equal(audit.verifiedServiceFacts.operatorStationCount,29);
 assert.equal(audit.verifiedServiceFacts.consecutivePassengerStopPairs,28);
 assert.equal(audit.verifiedServiceFacts.operatorPublishedLineKm,46);
 assert.equal(audit.verifiedServiceFacts.operatorUndergroundStations,7);
 assert.equal(audit.verifiedServiceFacts.operatorElevatedStations,22);
 assert.equal(findRoute('mrt-kajang').stationSequence.length,29);
 assert.equal(findRoute('mrt-kajang').serviceAdjacencies.length,28);
 assert.equal(catalog.physicalSegments.length,0);
 assert.equal(audit.verifiedPhysicalWays.length,0);
 assert(audit.sourceModelCategories.find(c=>c.id==='passenger-service').physicalIdentity===false);
});
test('R2.16.2 rejects claimed physical tracks, route identities and station links before sourced review',()=>{
 for(const key of ['sourceExtracts','candidateTrackWays','verifiedPhysicalWays','matchedServiceRouteRelations','verifiedPhysicalStationConnections']){
  const candidate=JSON.parse(JSON.stringify(audit));
  candidate[key]=[{id:'invented'}];
  assert.equal(validate(candidate),false,key);
 }
 const bad=JSON.parse(JSON.stringify(audit));
 bad.sourceModelCategories.find(c=>c.id==='physical-railway-way').count=28;
 assert.equal(validate(bad),false);
});
test('R2.16.2 infrastructure source taxonomy and explicit acceptance requirements are present',()=>{
 assert.deepEqual(audit.sourceModelCategories.map(x=>x.id),
  ['passenger-service','train-route-relation','railway-route-relation','physical-railway-way']);
 assert(audit.acceptanceRequirements.some(x=>/raw element tags and full geometry/i.test(x)));
 assert(audit.acceptanceRequirements.some(x=>/lifecycle/i.test(x)));
 assert(Object.values(audit.reference).every(x=>x.startsWith('https://')));
 assert.match(audit.warning,/do not imply 28 physical tracks/i);
});
