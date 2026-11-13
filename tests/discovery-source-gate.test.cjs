'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const catalogue = require('../data/openmr-r3/intelligence.json');
const {validateCatalogue} = require('../scripts/validate-discovery-source.cjs');

function copy(){return structuredClone(catalogue)}
test('MR-S10 baseline source catalogue passes the reusable quality gate',()=>{
 const result=validateCatalogue(copy());
 assert.equal(result.ok,true,result.errors.join('\n'));
 assert.deepEqual(
   [result.summary.facilities,result.summary.relationships,result.summary.sectors],
   [14,6,11]
 );
 assert(result.summary.sourceCount>=10);
});
test('a newly added independently sourced sector can be incorporated without modifying the map or frontend',()=>{
 const data=copy();
 data.sectors.push({
   id:'ELECTRONICS',
   name:'Electronics manufacturing',
   benefit:'Potential market and intermodal research',
   constraints:[],
   infrastructureGaps:[],
   dataRisks:[],
   furtherStudy:[],
   confidence:'PRELIMINARY_MR_S10_ANALYSIS_NOT_INVESTMENT_ADVICE',
   sourceURL:data.sources.MIDA_EAP.url,
   sourceDate:'UNKNOWN'
 });
 assert.equal(validateCatalogue(data).ok,true);
});
test('unregistered sources or missing evidence fail',()=>{
 const a=copy();a.facilities[0].sourceId='UNKNOWN_SOURCE';
 const b=copy();b.sectors[0].sourceURL='http://invalid.example';
 const c=copy();c.relationships[0].sourceURL='https://not-listed.example/resource';
 for(const invalid of [a,b,c])assert.equal(validateCatalogue(invalid).ok,false);
});
test('accidental loss of accepted records is rejected',()=>{
 const data=copy();data.facilities.pop();
 assert.equal(validateCatalogue(data).ok,false);
});
test('duplicate entities, missing relationships or invented rail geometry are rejected',()=>{
 const a=copy();a.facilities[1].id=a.facilities[0].id;
 const b=copy();b.relationships[0].to='missing-port';
 const c=copy();c.relationships[0].geometry={type:'LineString',coordinates:[[102,3],[103,3]]};
 const d=copy();d.facilities[0].geometry={type:'Point',coordinates:[103,3]};
 for(const invalid of [a,b,c,d])assert.equal(validateCatalogue(invalid).ok,false);
});
