const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'reading/library-catalogue.json'),'utf8')),html=fs.readFileSync(path.join(root,'reading/index.html'),'utf8');
const all=catalog.groups.flatMap(g=>g.chapters);
test('catalogue has five distinct categories and 40 unique chapters',()=>{assert.equal(catalog.groups.length,5);assert.equal(all.length,40);assert.equal(new Set(all.map(x=>x.id)).size,all.length)});
test('required machinery catalogue models are present',()=>{for(const id of ['spz200','wd350','cdc16','dc32','dcl32','gmc48','eloco','ccpg500a','gc270','df8b','jw7'])assert(all.some(x=>x.id===id),id)});
test('freight, EMU, CIT, track and strategy topics remain planned',()=>{for(const id of ['ecrl-emu','cit-train','container-flat','engineering-wagons','track-geometry','signalling-occ','wagon-investment','fleet-calculator'])assert(all.some(x=>x.id===id),id)});
test('only Chapter 01 is accessible; planned chapters have no URLs',()=>{const ready=all.filter(x=>x.status==='available');assert.deepEqual(ready.map(x=>x.id),['railway-fundamentals-01']);assert.equal(ready[0].path,'reading/railway-fundamentals-01.html');assert(fs.existsSync(path.join(root,ready[0].path)));assert(all.filter(x=>x.status==='planned').every(x=>x.path===null))});
test('Chapter 01 remains draft with separate original source',()=>{const chapter=fs.readFileSync(path.join(root,'reading/railway-fundamentals-01.html'),'utf8');assert.match(chapter,/EDITORIAL DRAFT/);assert.match(chapter,/Bukan manual operasi/);assert(!html.includes('src="../assets/access.js"'))});
test('four mandatory evidence labels, no invented spec values',()=>{assert.deepEqual(catalog.evidenceLabels,['VERIFIED','FIELD OBSERVATION','GENERAL ENGINEERING REFERENCE','MANUAL REQUIRED']);assert(all.every(x=>x.review==='EDITORIAL DRAFT'&&!x.verifiedTechnicalClaims));assert.doesNotMatch(JSON.stringify(catalog),/\b(?:rpm|kW|km\/h|mm diameter|bar pressure)\b/i)});
test('library is public educational-only with no authentication or privileged backend',()=>{assert.match(html,/noindex,nofollow/);assert.match(html,/library-catalogue\.json/);assert.match(html,/textContent/);assert.doesNotMatch(html,/supabase\.co|service_role|accessToken|localStorage|sessionStorage|fetch\(['"]https?:/);assert.match(catalog.contentPolicy,/not official ECRL/)});
test('responsive theme and language support, no external images',()=>{assert.match(html,/@media\(prefers-color-scheme:dark\)/);assert.match(html,/data-theme/);assert.match(html,/value="ms"/);assert.match(html,/value="en"/);assert.match(html,/value="zh"/);assert.match(html,/Neutral technical diagram placeholder/);assert.doesNotMatch(html,/<img\b|<iframe\b/i)});

const engineeringWagonIds=['fw-engineering-flat','track-laying-boom-flat','hw-hopper'];
function manualRequired(value, label) {
  assert(value && typeof value==='object', label);
  assert.equal(value.value,null,label);
  assert.equal(value.verification,'MANUAL REQUIRED',label);
  assert.equal(value.reference,null,label);
}
for (const id of engineeringWagonIds) {
  test(id+': unpublished draft with structured engineering coverage',()=>{
    const wagon=all.find(x=>x.id===id);
    assert(wagon,id);
    if(id==='fw-engineering-flat') assert.equal(wagon.title,'FW - Flat Wagon');
    assert.equal(wagon.status,'planned');
    assert.equal(wagon.path,null);
    assert.equal(wagon.review,'EDITORIAL DRAFT');
    assert.equal(wagon.verifiedTechnicalClaims,false);
    assert.equal(wagon.category,'engineering-construction-wagon');
    assert.equal(wagon.image.status,'NEUTRAL PLACEHOLDER ONLY');
    assert.equal(wagon.image.publication,'OWNER APPROVAL REQUIRED');
    const purpose=wagon.primaryPurpose;
    assert(purpose.summary.trim().length>0);
    assert(purpose.applications.length>0);
    assert(purpose.applications.every(x=>typeof x==='string' && x.trim().length>0));
    assert.equal(purpose.verification,'GENERAL ENGINEERING REFERENCE');
    for(const field of ['manufacturerModelType','bogieCount','axleCount','axleArrangement','maximumAxleLoad','newWheelDiameter','minimumServiceWheelDiameter','wheelbase','bogieCentreDistance','primarySuspension','secondarySuspension','axleboxBearings'])
      manualRequired(wagon.bogieTypeAndAxleArrangement[field],id+': '+field);
    assert(wagon.wheelsetAndSuspension.description.trim().length>0);
    assert.equal(wagon.wheelsetAndSuspension.verification,'GENERAL ENGINEERING REFERENCE');
    assert.equal(wagon.wheelsetAndSuspension.fittedDetails,'MANUAL REQUIRED');
    for(const field of ['systemType','brakeCylinders','brakeRigging','blocksOrPads','parkingBrake'])
      manualRequired(wagon.brakingSystem[field],id+': '+field);
    for(const field of ['couplerType','draftGearType'])
      manualRequired(wagon.couplerAndDraftGear[field],id+': '+field);
    for(const section of [wagon.brakingSystem,wagon.couplerAndDraftGear]) {
      assert(section.workingPrinciple.trim().length>0);
      assert.equal(section.verification,'GENERAL ENGINEERING REFERENCE');
    }
    const equipment=wagon.keyEquipmentAndPrinciples;
    assert(equipment.equipment.length>0);
    assert(equipment.principles.trim().length>0);
    assert.equal(equipment.verification,'GENERAL ENGINEERING REFERENCE');
    manualRequired(equipment.manufacturerAndModel,id+': equipment model');
    manualRequired(equipment.specificRatings,id+': ratings');
    const maintenance=wagon.inspectionAndMaintenanceConcepts;
    assert(maintenance.scope.length>0);
    assert.equal(maintenance.verification,'GENERAL ENGINEERING REFERENCE');
    manualRequired(maintenance.inspectionIntervals,id+': intervals');
    manualRequired(maintenance.wearLimits,id+': wear limits');
    assert.match(maintenance.procedures,/MANUAL REQUIRED/);
  });
  test(id+': field observations remain separate from verified specifications',()=>{
    const wagon=all.find(x=>x.id===id),refs=wagon.referencesAndVerification;
    assert.equal(refs.sourceStatus,'MANUAL REQUIRED');
    assert.deepEqual(refs.technicalSources,[]);
    assert(refs.notes.trim().length>0);
    assert(Array.isArray(wagon.observations));
    assert(Array.isArray(refs.fieldObservations));
    for(const observation of [...wagon.observations,...refs.fieldObservations]) {
      assert.equal(observation.evidence,'FIELD OBSERVATION / UNVERIFIED');
      assert(observation.item && observation.reported);
    }
    assert.deepEqual(refs.fieldObservations.map(x=>[x.item,x.reported]),
      wagon.observations.map(x=>[x.item,x.reported]));
    assert(refs.fieldObservations.every(x=>typeof x.source==='string' && x.source.length>0));
    assert.match(refs.photoStatus,/owner publication and rights review required/);
  });
}

