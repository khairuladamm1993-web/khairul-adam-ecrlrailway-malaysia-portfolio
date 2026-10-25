const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('R2.5 + R2.6 integrated on one MR-S10 Gateway and same-origin Owner page',()=>{
 const gateway=read('gateway.html'),owner=read('owner-command-center.html');
 assert.match(gateway,/MR-S10 UNIFIED PREVIEW · R2\.5 \+ R2\.6/);
 assert.match(gateway,/id="owner-center-shortcut"[^>]*href="owner-command-center\.html"/);
 assert.match(gateway,/assets\/owner-center-shortcut\.js/);
 assert.match(owner,/assets\/owner-two-way-workflow\.js/);
 assert.match(owner,/id="two-way-state"/);
 assert.match(owner,/id="auth-gate"/);
 assert.match(owner,/id="dashboard" hidden/);
 assert.doesNotMatch(gateway,/mrls10-command-center-r1-demo\.vercel\.app/);
});
test('Four choices are on the same Gateway, Welcome, Portfolio and Chapter 01',()=>{
 for(const page of ['index.html','gateway.html','portfolio.html']){
  const html=read(page);
  for(const locale of ['ms','en','zh','th'])assert(html.includes('data-lang="'+locale+'"'),page+': '+locale);
  assert(html.includes('assets/translations-th.js'));
 }
 const chapter=read('reading/railway-fundamentals-01.html');
 for(const locale of ['ms','en','zh','th'])assert(chapter.includes('value="'+locale+'"'));
 assert(read('reading/chapter-01-i18n.js').includes('บทที่ 01'));
});
test('Map UI can switch locale while Leaflet viewport persists; original raster labels are not described as translated',()=>{
 const ui=read('assets/public-gateway.js');
 const map=read('assets/map-gateway.js');
 const locale=read('assets/map-locale.js');
 assert.match(ui,/category==='map'&&window\.RailwayMap\?\.mounted/);
 assert.match(ui,/RailwayMapLocale\?\.apply\(box,R\.language\)/);
 assert.match(map,/tile\.openstreetmap\.org/);
 assert.match(map,/tiles\.openrailwaymap\.org/);
 assert.match(map,/data-map-localization-note/);
 assert.match(locale,/sourceLabelsLocalized:false/);
});
test('Owner cross-chat write contract uses development Registry only and cannot auto deploy',()=>{
 const flow=require('../assets/owner-two-way-workflow.js');
 assert.equal(flow.target.branch,'feature/owner-r23-verified-checkpoint-sync');
 const prompt=flow.composeContract({id:'portfolio'},{id:'owner-auth-safari'});
 assert.match(prompt,/re-read Registry/);
 assert.match(prompt,/SYNC BLOCKED/);
 assert.match(prompt,/No production deploy/);
 assert.doesNotMatch(prompt,/token=.*\S/i);
 const home=read('assets/owner-center-shortcut.js');
 assert.match(home,/auth\.canAdmin===true&&auth\.status==='authenticated'/);
});
test('Integrated artifact builders include multi-language files and Owner Dashboard',()=>{
 const prod=read('scripts/build-production.py');
 const prev=read('scripts/build-preview.py');
 for(const file of ['translations-th.js','map-locale.js','owner-two-way-workflow.js']){
  assert(prod.includes(file),file+' in production builder');
  if(file!=='owner-two-way-workflow.js')assert(prev.includes(file) || prev.includes("copytree"),file+' in public builder');
 }
});
