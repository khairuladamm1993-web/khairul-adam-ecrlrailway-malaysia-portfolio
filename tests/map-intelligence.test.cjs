const test=require('node:test');
const assert=require('node:assert/strict');
const I=require('../assets/map-intelligence.js');

test('chainage parser accepts supported railway formats',()=>{
  for(const [input,expected] of [
    ['CH081',81],['CH081.000',81],['CH81',81],['81',81],['81.000',81],['CH081+000',81],['81+000',81],['CH081+500',81.5]
  ]) assert.equal(I.parseChainage(input),expected,input);
});

test('chainage parser rejects malformed free text',()=>{
  for(const input of ['CH81+00','CH081+0000','81km','STN17','foo81','CH',''])assert.equal(I.parseChainage(input),null,input);
});

test('chainage bracket lookup resolves CH081 between Jerteh and Bandar Permaisuri',()=>{
  const anchors=[
    {code:'STN03',name:'Jerteh',chainageKm:51.450,lat:5.70102,lon:102.48321},
    {code:'STN04',name:'Bandar Permaisuri',chainageKm:88.220,lat:5.52084,lon:102.73814}
  ];
  const b=I.bracketChainage(anchors,81);
  assert.equal(b.status,'bracket');
  assert.equal(b.previous.code,'STN03');
  assert.equal(b.next.code,'STN04');
  assert.equal(Number((81-b.previous.chainageKm).toFixed(3)),29.550);
  assert.equal(Number((b.next.chainageKm-81).toFixed(3)),7.220);
});

test('chainage engine reports exact, out-of-range and missing-anchor states',()=>{
  const anchors=[{code:'A',chainageKm:10,lat:3,lon:102},{code:'B',chainageKm:20,lat:4,lon:103}];
  assert.equal(I.bracketChainage(anchors,10).status,'exact');
  assert.equal(I.bracketChainage(anchors,9).status,'out-of-range');
  assert.equal(I.bracketChainage([],15).status,'missing-anchors');
  assert.equal(typeof I.interpolateReference,'undefined');
});

test('smart search normalization ranks approved aliases without literal-order dependence',()=>{
  const records=[{name:'Pekan Sg. Tong'},{name:'Kuantan Port City Depot'},{name:'ITT Gombak'}];
  const aliases=r=>r.name==='Pekan Sg. Tong'?[r.name,'PL01','Pekan Sungai Tong']:
    r.name==='Kuantan Port City Depot'?[r.name,'DEPOT-KTN','Kuantan Depot','Depot Kuantan','Depot KTN']:
    [r.name,'STN17','Gombak'];
  assert.equal(I.rankRecords(records,'pl01',aliases)[0].record.name,'Pekan Sg. Tong');
  assert.equal(I.rankRecords(records,'  depot   kuantan ',aliases)[0].record.name,'Kuantan Port City Depot');
  assert.equal(I.rankRecords(records,'DEPOT KTN',aliases)[0].record.name,'Kuantan Port City Depot');
  assert.equal(I.rankRecords(records,'gombak',aliases)[0].record.name,'ITT Gombak');
});
