'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const pkg=process.env.P01_PREVIEW_PACKAGE;
assert.ok(pkg,'Set P01_PREVIEW_PACKAGE to the generated package root');
const staticRoot=path.join(pkg,'.vercel','output','static');
const read=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const json=(root,file)=>JSON.parse(read(root,file));
const manifest=json(pkg,'release-manifest.json');

test('package uses checked-out SHA, includes source-exact map and keeps config outside served assets',()=>{
 const expected=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const stamp=JSON.parse(read(staticRoot,'assets/build-info.js').match(/Object\.freeze\((.*)\);/)[1]);
 assert.equal(manifest.sourceSha,expected);
 assert.equal(manifest.target,'preview');
 assert.equal(stamp.gitSha,expected);
 assert.equal(stamp.environment,'preview');
 assert.equal(stamp.deploymentId,null);
 assert.equal(stamp.deploymentUrl,null);
 for(const file of ['gateway.html','unified-map-v7.html','unified-map-v8.html','assets/access.js',
  'assets/p01-maplibre.js','assets/p01-maplibre-worker.js','assets/unified-ecrl/route-lab-ui.js','assets/unified-ecrl/railway-data-contract-v1.js']){
  assert.equal(read(staticRoot,file),execFileSync('git',['show',expected+':'+file],{encoding:'utf8'}),file);
 }
 assert.equal(read(pkg,'vercel.json'),read(process.cwd(),'vercel.json'));
 for(const file of ['vercel.json','release-manifest.json','data/owner-project-registry.json','api','supabase','assets/quiz-core.js']){
  assert.equal(fs.existsSync(path.join(staticRoot,file)),false,file);
 }
});

test('prebuilt routes preserve gateway and global security headers from repository configuration',()=>{
 const config=json(pkg,'.vercel/output/config.json');
 assert.equal(config.version,3);
 assert.deepEqual(config.routes.at(-1),{handle:'filesystem'});
 const validate=(uri,expected)=>{
  const headers=Object.assign({},...config.routes.filter(route=>route.src&&new RegExp(route.src).test(uri)).map(route=>route.headers));
  assert.deepEqual(headers,expected);
 };
 const global={'X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
 validate('/gateway.html',{'Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer',...global});
 validate('/assets/p01-maplibre-worker.js',global);
 validate('/unified-map-v8.html',global);
});

test('manifest covers every packaged file and matches their SHA-256 digests',()=>{
 const expected=fs.readdirSync(pkg,{recursive:true,withFileTypes:true})
  .filter(entry=>entry.isFile()).map(entry=>path.relative(pkg,path.join(entry.parentPath,entry.name)).split(path.sep).join('/'))
  .filter(file=>file!=='release-manifest.json').sort();
 assert.deepEqual(manifest.files.map(file=>file.path).sort(),expected);
 for(const {path:file,sha256} of manifest.files){
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(pkg,file))).digest('hex'),sha256,file);
 }
});
