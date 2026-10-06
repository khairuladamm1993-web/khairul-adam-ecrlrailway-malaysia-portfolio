const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');

const root=path.resolve(__dirname,'..');

function build(script,prefix){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
  const r=cp.spawnSync('python3',[path.join(root,'scripts',script),dir],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,(r.stdout||'')+(r.stderr||''));
  return dir;
}
function walk(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name),s=fs.statSync(p);
    if(s.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}

test('production artifact excludes retained legacy quiz/protected assets',()=>{
  const dir=build('build-production.py','railway-production-');
  for(const name of ['questions.js','gateway.js','quiz-core.js'])assert.equal(fs.existsSync(path.join(dir,'assets',name)),false,name);
  for(const name of ['access.js','public-gateway.js','member-gateway.js','module-previews.js','analytics.js','map-gateway.js','corridor-reference.js'])assert.equal(fs.existsSync(path.join(dir,'assets',name)),true,name);
  const textFiles=walk(dir).filter(p=>/\.(?:html|js|css|md|xml|txt)$/i.test(p));
  const all=textFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
  assert(!all.includes('window.RailwayModules='));
  assert(!all.includes('df8b_inspection-1'));
  assert(!all.includes('"correct":0'));
  assert(!all.includes('Email verification — coming soon'));
  assert(!all.includes('Member sign-in is not connected yet'));
  assert(all.includes('signInWithOtp'));
  assert(all.includes("rpc('account_role')"));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('production gateway keeps authenticated runtime and fail-closed public entry',()=>{
  const dir=build('build-production.py','railway-production-');
  const html=fs.readFileSync(path.join(dir,'gateway.html'),'utf8');
  for(const src of ['assets/access.js','assets/public-gateway.js','assets/member-gateway.js'])assert(html.includes(src));
  assert(!html.includes('assets/questions.js'));
  assert(!html.includes('assets/gateway.js'));
  assert(!html.includes('assets/quiz-core.js'));
  const access=fs.readFileSync(path.join(dir,'assets/access.js'),'utf8');
  assert(access.includes("level:'public'"));
  assert(access.includes("rpc('account_role')"));
  assert(access.includes("failClosed"));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('preview artifact remains analytics- and authentication-isolated',()=>{
  const dir=build('build-preview.py','railway-preview-');
  const html=fs.readFileSync(path.join(dir,'gateway.html'),'utf8');
  const access=fs.readFileSync(path.join(dir,'assets/access.js'),'utf8');
  const analytics=fs.readFileSync(path.join(dir,'assets/analytics.js'),'utf8');
  const headers=fs.readFileSync(path.join(dir,'_headers'),'utf8');
  assert(!html.includes('@supabase/supabase-js'));
  assert(!html.includes('assets/member-gateway.js'));
  assert(!html.includes('assets/analytics.js'));
  assert(access.includes("status:'preview-public-only'"));
  assert.equal(analytics.trim(),'/* Preview only: analytics submission disabled. */');
  assert(headers.includes("connect-src 'none'"));
  for(const name of ['questions.js','gateway.js','quiz-core.js','member-gateway.js'])assert.equal(fs.existsSync(path.join(dir,'assets',name)),false,name);
  fs.rmSync(dir,{recursive:true,force:true});
});

test('MAP is lazy, marker-only and contains no protected Corridor registry',()=>{
  const dir=build('build-production.py','railway-production-');
  const html=fs.readFileSync(path.join(dir,'gateway.html'),'utf8');
  const gateway=fs.readFileSync(path.join(dir,'assets','public-gateway.js'),'utf8');
  const map=fs.readFileSync(path.join(dir,'assets','map-gateway.js'),'utf8');
  const registry=fs.readFileSync(path.join(dir,'assets','corridor-reference.js'),'utf8');
  assert(!html.includes('map-gateway.js'));
  assert(!html.includes('leaflet'));
  assert(!html.includes('tile.openstreetmap.org'));
  assert(gateway.includes("s.src='assets/map-gateway.js'"));
  assert(map.includes('leaflet@1.9.4'));
  assert(map.includes('tile.openstreetmap.org/{z}/{x}/{y}.png'));
  assert(map.includes('window.RailwayCorridorReference'));
  assert(!map.includes("['Kota Bharu','STN'"));
  assert(!/\bSTN\d{2}\b/.test(registry));
  assert(!/\bCH\s*\d{1,3}\+\d{3}\b/.test(registry));
  for(const token of ['totalTrackLength','turnoutCount','TrackLine(','MapPolyline','L.polyline'])assert(!map.includes(token)&&!registry.includes(token),token);
  assert(registry.includes("['Pekan Sg. Tong','PL',null,null,'Pending Validation']"));
  assert(registry.includes("['Bukit Payung','PL',5.23269,103.10281,'Public Reference Location']"));
  assert(registry.includes("['Felda Lepar','PL',3.67709,103.03001,'Public Reference Location']"));
  assert(registry.includes("['Kampung Alur Gading','PL',3.61430,102.83280,'Public Reference Location']"));
  assert(registry.includes("['Chenor','PL',null,null,'Pending Validation']"));
  assert(registry.includes("['Lanchang','PL',null,null,'Pending Validation']"));
  assert(registry.includes("['Alang Sedayu','PL',null,null,'Pending Validation']"));
  assert(registry.includes("['Kuantan Port City Depot','Depot',null,null,'Pending Validation']"));
  assert(registry.includes("['Gombak North EMU Depot','Depot',null,null,'Pending Validation']"));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('MAP exact-location contract classifies coordinates and never shifts markers',()=>{
  const dir=build('build-production.py','railway-production-');
  const map=fs.readFileSync(path.join(dir,'assets','map-gateway.js'),'utf8');
  const registry=fs.readFileSync(path.join(dir,'assets','corridor-reference.js'),'utf8');
  assert(registry.includes("'Public Reference Location'"));
  assert(registry.includes("'Pending Validation'"));
  assert(map.includes("const VALID='Validated Location',PUBLIC='Public Reference Location',PENDING='Pending Validation'"));
  assert(map.includes("r?.locationConfidence===VALID"));
  assert(map.includes("marker=state.leaflet.marker([Number(r.lat),Number(r.lon)]"));
  assert(map.includes("state.map.setView([Number(r.lat),Number(r.lon)],zoom)"));
  assert(!map.includes('setLatLng('));
  assert(!map.includes('MapPolyline'));
  assert(!map.includes('L.polyline'));
  assert(!map.includes('.polyline('));
  assert(!map.includes("state.map.on('zoom"));
  assert(!map.includes("state.map.on('move"));
  assert(map.includes("Public Reference Location · locality/reference position only; not an exact railway or survey/GIS coordinate."));
  assert(map.includes("Pending Validation · no exact railway location is rendered."));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('canonical Corridor confidence overrides the public-safe projection',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  assert(map.includes("if(loc.locationConfidence===PUBLIC&&finite(loc.lat)&&finite(loc.lon))"));
  assert(map.includes("if(loc.locationConfidence===PENDING)"));
  assert(map.includes("lat:null,lon:null,locationConfidence:PENDING"));
});
