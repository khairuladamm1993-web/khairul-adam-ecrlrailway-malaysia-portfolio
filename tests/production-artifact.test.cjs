// CI validation-only trigger after GitHub account email verification; no runtime behavior change.
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
  for(const name of ['access.js','public-gateway.js','member-gateway.js','module-previews.js','analytics.js','map-intelligence.js','map-gateway.js','corridor-reference.js','owner-map.js'])assert.equal(fs.existsSync(path.join(dir,'assets',name)),true,name);
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
  for(const name of ['questions.js','gateway.js','quiz-core.js','member-gateway.js','owner-map.js'])assert.equal(fs.existsSync(path.join(dir,'assets',name)),false,name);
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
  assert(gateway.includes("load('assets/map-intelligence.js'"));
  assert(gateway.includes("load('assets/map-gateway.js'"));
  assert(map.includes('leaflet@1.9.4'));
  assert(map.includes('tile.openstreetmap.org/{z}/{x}/{y}.png'));
  assert(map.includes('tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'));
  assert(map.includes("Style: <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\""));
  assert(map.includes('OpenRailwayMap'));
  assert(map.includes("createPane?.('railwayBase')"));
  assert(map.includes("createPane?.('railwayReference')"));
  assert(map.includes('maxZoom:18'));
  assert(map.includes('window.RailwayCorridorReference'));
  assert(!map.includes("['Kota Bharu','STN'"));
  assert(!/\bSTN\d{2}\b/.test(registry));
  assert(!/\bCH\s*\d{1,3}\+\d{3}\b/.test(registry));
  for(const token of ['totalTrackLength','turnoutCount','TrackLine(','MapPolyline','L.polyline'])assert(!map.includes(token)&&!registry.includes(token),token);
  assert(!html.includes('openrailwaymap.org'));
  assert(!html.includes('tile.openstreetmap.org'));
  assert(registry.includes("['Pekan Sg. Tong','PL',null,null,'Pending Validation']"));
  assert(registry.includes("['Bukit Payung','PL',5.23269,103.10281,'Public Reference Location']"));
  assert(registry.includes("['Felda Lepar','PL',3.67709,103.03001,'Public Reference Location']"));
  assert(registry.includes("['Kampung Alur Gading','PL',3.61430,102.83280,'Public Reference Location']"));
  assert(registry.includes("['Chenor','PL',3.473139,102.518833,'Public Reference Location']"));
  assert(registry.includes("['Lanchang','PL',3.50746,102.19129,'Pending Validation']"));
  assert(registry.includes("['Alang Sedayu','PL',3.28426,101.76345,'Pending Validation']"));
  assert(registry.includes("['Kuantan Port City Depot','Depot',3.97450,103.33750,'Pending Validation']"));
  assert(registry.includes("['Gombak North EMU Depot','Depot',3.25918,101.74407,'Pending Validation']"));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('MAP smart search resolves canonical aliases across filters and auto-focuses one result',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const gateway=fs.readFileSync(path.join(root,'assets','public-gateway.js'),'utf8');
  assert(gateway.includes("assets/map-intelligence.js"));
  assert(map.includes("Pekan Sungai Tong"));
  assert(map.includes("Kuantan Depot','Depot Kuantan','Depot KTN"));
  assert(map.includes("if(code==='STN17'||name==='itt gombak')aliases.push('Gombak')"));
  assert(map.includes("I.rankRecords(corridorRecords(),state.query,approvedAliases)"));
  assert(map.includes("if(reveal&&r?.type&&['STN','PL','Depot'].includes(r.type))setFilter(r.type)"));
  assert(map.includes("if(ranked.length===1||(ranked[0]&&ranked[1]&&ranked[0].score>ranked[1].score))selectAsset(ranked[0].record)"));
  assert(!map.includes("normalize(hay).includes(normalize(state.query))"));
});

test('MAP chainage intelligence uses authenticated canonical anchors and bracket-only fallback without fake geometry',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const intelligence=fs.readFileSync(path.join(root,'assets','map-intelligence.js'),'utf8');
  assert(map.includes("if(!A?.canReadMemberContent)return []"));
  assert(map.includes("const chainageKm=I.parseChainage(record.overlay?.chainage)"));
  assert(map.includes("I.bracketChainage(chainageAnchors(),km)"));
  assert(map.includes("kind:'bracket'"));
  assert(map.includes("Calculated Corridor Reference — position unresolved"));
  assert(map.includes("No queryable route geometry is available"));
  assert(map.includes("Reference coordinate</dt><dd>Not calculated"));
  assert(intelligence.includes("parseChainage"));
  assert(intelligence.includes("bracketChainage"));
  assert(!intelligence.includes("interpolateReference"));
  assert(!map.includes("I.interpolateReference"));
  assert(!map.includes('L.polyline'));
  assert(!map.includes('.polyline('));
});

test('MAP exact-location contract classifies coordinates and never shifts markers',()=>{
  const dir=build('build-production.py','railway-production-');
  const map=fs.readFileSync(path.join(dir,'assets','map-gateway.js'),'utf8');
  const registry=fs.readFileSync(path.join(dir,'assets','corridor-reference.js'),'utf8');
  assert(registry.includes("'Public Reference Location'"));
  assert(registry.includes("'Pending Validation'"));
  for(const classification of [
    'Validated Location',
    'Personal Field-Validated Location',
    'Engineering/Survey Validated Location',
    'Public Reference Location',
    'Pending Validation'
  ]) assert(map.includes(classification),classification);
  assert(map.includes('[VALID,PERSONAL,ENGINEERING].includes(r?.locationConfidence)'));
  assert(map.includes('[VALID,PERSONAL,ENGINEERING].includes(loc.locationConfidence)'));
  assert(map.includes('loc.locationConfidence===PUBLIC'));
  assert(map.includes('loc.locationConfidence===PENDING'));
  assert(map.includes("marker=state.leaflet.marker([Number(r.lat),Number(r.lon)]"));
  assert(map.includes("state.map.setView([Number(r.lat),Number(r.lon)],zoom)"));
  assert(map.includes("const mappable=r=>corridorSane(r)"));
  assert(!map.includes('MapPolyline'));
  assert(!map.includes('L.polyline'));
  assert(!map.includes('.polyline('));
  assert(!map.includes("state.map.on('zoom"));
  assert(!map.includes("state.map.on('move"));
  assert(map.includes("Public Reference Location · locality/reference position only; not an exact railway or survey/GIS coordinate."));
  assert(map.includes("Pending Validation · temporary/reference position only when coordinates are available; never exact."));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('canonical Corridor confidence overrides the public-safe projection',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  assert(map.includes("if(loc.locationConfidence===PUBLIC&&finite(loc.lat)&&finite(loc.lon))"));
  assert(map.includes("if(loc.locationConfidence===PENDING)"));
  assert(map.includes("lat:finite(loc.lat)?Number(loc.lat):(finite(point.lat)?Number(point.lat):null)"));
  assert(map.includes("lon:finite(loc.lon)?Number(loc.lon):(finite(point.lon)?Number(point.lon):null)"));
  assert(map.includes("locationConfidence:PENDING"));
});

test('Owner MAP runtime is lazy, admin-gated and never persists device location automatically',()=>{
  const dir=build('build-production.py','railway-production-');
  const map=fs.readFileSync(path.join(dir,'assets','map-gateway.js'),'utf8');
  const owner=fs.readFileSync(path.join(dir,'assets','owner-map.js'),'utf8');
  const access=fs.readFileSync(path.join(dir,'assets','access.js'),'utf8');
  const html=fs.readFileSync(path.join(dir,'gateway.html'),'utf8');
  assert(!html.includes('owner-map.js'));
  assert(map.includes("if(!A?.canAdmin||!state.map)return"));
  assert(map.includes("s.src='assets/owner-map.js'"));
  assert(owner.includes("navigator.geolocation.getCurrentPosition"));
  assert(!owner.includes('watchPosition'));
  assert(owner.includes("if(!mounted||!A.canAdmin)return"));
  assert(owner.includes("if(!window.confirm('Publish this approved location to the canonical Corridor record?'))return"));
  assert(owner.includes("A.adminPublishLocation"));
  assert(owner.includes("A.adminLocationHistory"));
  assert(owner.includes("A.adminRestoreLocation"));
  assert(access.includes("rpc('admin_publish_location'"));
  assert(access.includes("rpc('admin_location_history'"));
  assert(access.includes("rpc('admin_restore_location'"));
  assert(!/getCurrentPosition\s*\([^)]*adminPublishLocation/s.test(owner));
  assert(owner.includes("Number.isFinite(rawAccuracy)&&rawAccuracy>=0?rawAccuracy:null"));
  assert(owner.includes("Current device accuracy: not reported by browser"));
  assert(!owner.includes("accuracy:Number(pos.coords.accuracy)||0"));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('MAP remains marker-only after Owner editing support',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const owner=fs.readFileSync(path.join(root,'assets','owner-map.js'),'utf8');
  for(const src of [map,owner]){
    assert(!src.includes('L.polyline'));
    assert(!src.includes('.polyline('));
    assert(!src.includes('MapPolyline'));
  }
});

test('Owner MAP server migration keeps writes admin-authorized and history private',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase/migrations/20261007_owner_map_location_management.sql'),'utf8');
  assert(migration.includes('app_private.map_location_versions'));
  assert(migration.includes("app_private.account_role()<>'admin'"));
  assert(migration.includes("action in ('baseline','publish','rollback')"));
  assert(migration.includes('owner_user_id uuid not null'));
  assert(migration.includes('source_note text not null'));
  assert(migration.includes('revoke all on table app_private.map_location_versions from public, anon, authenticated'));
  assert(migration.includes('revoke execute on function public.admin_publish_location'));
  assert(migration.includes('grant execute on function public.admin_publish_location'));
  assert(migration.includes('Baseline captured before first Owner location change'));
  assert(migration.includes('Changing a validated project coordinate requires reclassification'));
  assert(migration.includes('Changing an engineering/survey coordinate requires reclassification'));
});

test('personal field coordinate stays protected from the public-safe projection',()=>{
  const registry=fs.readFileSync(path.join(root,'assets/corridor-reference.js'),'utf8');
  assert(registry.includes("['Pekan Sg. Tong','PL',null,null,'Pending Validation']"));
  assert(!registry.includes('5.35123'));
  assert(!registry.includes('102.89995'));
  assert(!registry.includes('5.354361'));
  assert(!registry.includes('102.902694'));
});

test('Verified Member renderer uses plain escaping inside module attributes',()=>{
  const dir=build('build-production.py','railway-production-');
  const member=fs.readFileSync(path.join(dir,'assets','member-gateway.js'),'utf8');
  assert(member.includes("const escape=v=>R.escape(String(v??''));"));
  assert(!member.includes("const escape=v=>h(String(v??''));"));
  assert(member.includes("data-member-module=\"'+escape(id)+'\""));
  assert(member.includes("aria-pressed=\"'+selected.has(id)+'\""));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('railway-first MAP styling keeps railway reference separate from canonical geometry',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'assets','gateway.css'),'utf8');
  assert(map.includes("RAIL_REFERENCE_TILE_URL='https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'"));
  assert(map.includes("pane:referencePane?'railwayReference':'overlayPane'"));
  assert(map.includes('updateWhenIdle:true,keepBuffer:1,detectRetina:false'));
  assert(css.includes('.leaflet-railway-base-pane .leaflet-tile'));
  assert(css.includes('.leaflet-railway-reference-pane .leaflet-tile'));
  assert(css.includes('grayscale(.96)'));
  assert(css.includes('opacity:.48!important'));
  assert(css.includes('opacity:1!important'));
  assert(css.includes('.railway-selected-marker .railway-map-pin'));
  for(const src of [map,css]){
    assert(!src.includes('L.polyline'));
    assert(!src.includes('.polyline('));
    assert(!src.includes('MapPolyline'));
  }
});

test('MAP Malaysia identity badge is UI-only and outside the tile canvas',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'assets','gateway.css'),'utf8');
  assert(map.includes('map-identity-row'));
  assert(map.includes('map-malaysia-badge'));
  assert(map.includes('🇲🇾 <span>Malaysia</span>'));
  assert(map.indexOf('map-identity-row')<map.indexOf('map-toolbar'));
  assert(map.indexOf('map-identity-row')<map.indexOf('map-canvas-wrap'));
  assert(css.includes('.map-malaysia-badge'));
  assert(css.includes('[data-theme=light] .map-malaysia-badge'));
});

test('MAP coordinate parsing rejects null, blank, zero-zero and non-corridor outliers',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  assert(map.includes("typeof v==='string'&&v.trim()!==''"));
  assert(map.includes("!(lat===0&&lon===0)"));
  assert(map.includes("Number(r.lat)>=1&&Number(r.lat)<=7.5"));
  assert(map.includes("Number(r.lon)>=99.5&&Number(r.lon)<=104.8"));
  assert(map.includes("const mappable=r=>corridorSane(r)"));
  assert(!map.includes("const mappable=r=>finite(r?.lat)&&finite(r?.lon)"));
  const registry=fs.readFileSync(path.join(root,'assets','corridor-reference.js'),'utf8');
  assert(registry.includes("['Pekan Sg. Tong','PL',null,null,'Pending Validation']"));
});

test('MAP viewport is corridor-first and empty filters never trigger a regional fallback',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  assert(map.includes("const corridorRecords=()=>corridorBase().map(effective)"));
  assert(map.includes('function fitCorridor(){return fitRecords(corridorRecords());}'));
  assert(map.includes("[data-map-fit]').addEventListener('click',()=>{clearChainageMarker();fitCorridor();}"));
  assert(map.includes('renderResults();fitCorridor();renderDetail(null);'));
  assert(map.includes('renderResults();fitVisible();'));
  assert(map.includes("if(!coords.length||!state.map)return false"));
  assert(!map.includes('setView([4.55,102.55],6)'));
  assert(!map.includes('L.polyline'));
  assert(!map.includes('.polyline('));
});

test('tablet MAP keeps Owner relocation panel visible without weakening admin gate',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'assets','gateway.css'),'utf8');
  assert(map.includes("if(!A?.canAdmin||!state.map)return"));
  assert(map.includes("(A?.canAdmin?'<div class=\"owner-map-slot\" data-owner-map-slot></div>':'')"));
  assert(css.includes('@media(max-width:900px)'));
  assert(css.includes('.map-side{max-height:none;overflow:visible}'));
  assert(css.includes('.map-results{max-height:260px}'));
});

test('Owner relocation preserves stored marker and edits a separate draft only',()=>{
  const owner=fs.readFileSync(path.join(root,'assets','owner-map.js'),'utf8');
  assert(owner.includes("title:'Proposed draft coordinate'"));
  assert(owner.includes("s.draftMarker.dragging?.enable()"));
  assert(owner.includes('FOCUS / CENTER SELECTED'));
  assert(owner.includes('RESET DRAFT'));
  assert(owner.includes('CANCEL DRAFT'));
  assert(owner.includes('CURRENT LOCATION'));
  assert(owner.includes('PROPOSED LOCATION'));
  assert(owner.includes('The CURRENT marker remains fixed.'));
  assert(owner.includes('Chainage Context'));
  assert(owner.includes('No auto-snap is applied.'));
  assert(!owner.includes("s.dragMarker=approved"));
  assert(!owner.includes("approved.dragging?.enable()"));
  assert(owner.includes("A.adminPublishLocation"));
});

test('auth convenience reuses Supabase sessions without weakening role resolution',()=>{
  const dir=build('build-production.py','railway-production-');
  const access=fs.readFileSync(path.join(dir,'assets','access.js'),'utf8');
  const member=fs.readFileSync(path.join(dir,'assets','member-gateway.js'),'utf8');
  assert(access.includes("persistSession:true"));
  assert(access.includes("autoRefreshToken:true"));
  assert(access.includes("detectSessionInUrl:true"));
  assert(access.includes("c.auth.getSession()"));
  assert(access.includes("c.auth.refreshSession()"));
  assert(access.includes("c.rpc('account_role')"));
  assert(access.includes("if(magicLinkInFlight)return magicLinkInFlight"));
  assert(access.indexOf("const restored=await validateSession()")<access.indexOf("c.auth.signInWithOtp"));
  assert(access.includes("status:'rate-limited'"));
  assert(access.includes('Too many verification requests. Please wait before requesting another link.'));
  assert(access.includes("failClosed('session-expired'"));
  assert(access.includes("status:'verification-failed'"));
  assert(access.includes("scope:'local'"));
  assert(!/localStorage\.(?:setItem|removeItem)\([^)]*(?:token|access|session)/i.test(access));
  assert(!/sessionStorage\.(?:setItem|removeItem)\([^)]*(?:token|access|session)/i.test(access));
  assert(!access.includes('hardcoded admin'));
  assert(member.includes("authSubmitting"));
  assert(member.includes("CHECKING SAVED SESSION"));
  assert(member.includes("Already signed in"));
  assert(member.includes("OPEN ADMIN CONTROLS"));
  assert(member.includes("A.canAdmin"));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('Light Mode typography polish remains local, system-font safe and layout-light',()=>{
  const css=fs.readFileSync(path.join(root,'assets','master.css'),'utf8');
  assert(css.includes('[data-theme=light] body[data-screen=portfolio] h2'));
  assert(css.includes('[data-theme=light] body[data-screen=portfolio] h3'));
  assert(css.includes('[data-theme=light] body[data-screen=portfolio] .muted'));
  assert(css.includes('[data-theme=light] body[data-screen=modes] h1'));
  assert(css.includes('[data-theme=light] body[data-screen=references] h1'));
  assert(!/url\s*\([^)]*font/i.test(css));
  assert(!/@font-face/i.test(css));
});

test('Gateway railway background polish is CSS-only and secondary',()=>{
  const css=fs.readFileSync(path.join(root,'assets','master.css'),'utf8');
  assert(css.includes('body[data-screen=modes]'));
  assert(css.includes('background-image:'));
  assert(css.includes('repeating-linear-gradient'));
  assert(css.includes('[data-theme=light] body[data-screen=modes]'));
  const gatewayBlock=css.slice(css.indexOf('body[data-screen=modes]'),css.indexOf('[data-theme=light] body[data-screen=modes]'));
  assert(!/url\s*\(/i.test(gatewayBlock));
  assert(!/background(?:-image)?\s*:[^;]*(?:jpg|jpeg|png|webp|svg)/i.test(gatewayBlock));
});


test('Owner relocation review exposes current-chainage-proposed without auto-snap or drag publish',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  const owner=fs.readFileSync(path.join(root,'assets','owner-map.js'),'utf8');
  assert(map.includes('getChainageContext:record=>ownerChainageContext(record||state.selected)'));
  assert(owner.includes("title:'CURRENT stored coordinate'"));
  assert(owner.includes('CURRENT LOCATION'));
  assert(owner.includes('PROPOSED LOCATION'));
  assert(owner.includes('Chainage confirms corridor position/order.'));
  assert(owner.includes('No auto-snap is applied.'));
  assert(owner.includes('REVIEW MODE: dragging or reviewing never writes canonical data.'));
  const dragStart=owner.indexOf('function onDraftDragEnd');
  const dragEnd=owner.indexOf('function setDraftCoordinate',dragStart);
  assert(dragStart>=0&&dragEnd>dragStart);
  assert(!owner.slice(dragStart,dragEnd).includes('adminPublishLocation'));
  assert(!owner.includes('snapTo'));
  assert(!owner.includes('interpolateReference'));
});

test('chainage anchors are linear catalogue references independent of marker coordinate validation',()=>{
  const map=fs.readFileSync(path.join(root,'assets','map-gateway.js'),'utf8');
  assert(map.includes(".filter(a=>Number.isFinite(a.chainageKm)).sort((a,b)=>a.chainageKm-b.chainageKm)"));
  assert(!map.includes(".filter(a=>Number.isFinite(a.chainageKm)&&mappable(a.record))"));
  assert(map.includes("const km=I.parseChainage(record?.overlay?.chainage)"));
  assert(map.includes("return I.chainageContext(chainageAnchors(),km)"));
});

test('Owner relocation review remains scroll-reachable on tablet and mobile',()=>{
  const css=fs.readFileSync(path.join(root,'assets','gateway.css'),'utf8');
  assert(css.includes('@media(max-width:900px)'));
  assert(css.includes('.map-side{max-height:none;overflow:visible}'));
  assert(css.includes('@media(max-width:719px)'));
  assert(css.includes('.owner-map-actions{display:grid;grid-template-columns:1fr}'));
  assert(css.includes('.owner-chainage-context'));
  assert(css.includes('.railway-stored-location-pin'));
});
