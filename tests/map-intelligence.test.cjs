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

test('canonical calibration chainages resolve as exact anchors while non-anchor CH081 brackets safely',()=>{
  const anchors=[
    ['STN03',51.450],['STN04',88.220],['PL01',115.180],['STN05',145.990],['PL02',172.450],['STN06',207.400],
    ['STN13',338.325],['PL03',353.242],['PL04',377.950],['STN14',396.900],['PL05',415.180],['STN15',433.250],
    ['PL06',457.100],['STN16',484.600],['PL07',515.725],['DEPOT-EMU',519.750],['STN17',524.160]
  ].map(([code,chainageKm])=>({code,chainageKm}));
  for(const code of ['PL01','PL02','PL03','PL04','PL05','PL06','PL07','DEPOT-EMU']){
    const a=anchors.find(x=>x.code===code);
    const hit=I.bracketChainage(anchors,a.chainageKm);
    assert.equal(hit.status,'exact',code);
    assert.equal(hit.anchor.code,code);
  }
  const ch81=I.bracketChainage(anchors,81);
  assert.equal(ch81.status,'bracket');
  assert.equal(ch81.previous.code,'STN03');
  assert.equal(ch81.next.code,'STN04');
  assert.equal(typeof I.interpolateReference,'undefined');
});


test('PL07 owner chainage context preserves linear order without using marker accuracy',()=>{
  const anchors=[
    {code:'STN16',name:'Bentong',chainageKm:484.600,locationConfidence:'Public Reference Location'},
    {code:'PL07',name:'Alang Sedayu',chainageKm:515.725,locationConfidence:'Pending Validation'},
    {code:'DEPOT-EMU',name:'Gombak North EMU Depot',chainageKm:519.750,locationConfidence:'Pending Validation'},
    {code:'STN17',name:'ITT Gombak',chainageKm:524.160,locationConfidence:'Public Reference Location'}
  ];
  const x=I.chainageContext(anchors,515.725);
  assert.equal(x.status,'exact');
  assert.equal(x.anchor.code,'PL07');
  assert.equal(x.previous.code,'STN16');
  assert.equal(x.next.code,'DEPOT-EMU');
  assert.equal(Number(x.afterPreviousKm.toFixed(3)),31.125);
  assert.equal(Number(x.beforeNextKm.toFixed(3)),4.025);
  assert.equal(x.next.locationConfidence,'Pending Validation');
});

test('movement diagnostic is geographic distance only and never changes chainage',()=>{
  const metres=I.haversineMetres(3.28426,101.76345,3.28436,101.76345);
  assert(metres>10&&metres<12);
  assert.equal(I.haversineMetres(null,101,3,102),null);
  assert.equal(typeof I.interpolateReference,'undefined');
});
