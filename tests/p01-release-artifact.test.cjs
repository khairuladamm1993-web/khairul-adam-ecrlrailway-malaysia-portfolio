'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('dist-unified-v8');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
test('isolated artifact has no dangling script references on public gateway pages',()=>{
 for(const name of ['gateway.html','index.html','portfolio.html','references.html','unified-map-v8.html','ecrl-alignment-lab.html']){
  const html=fs.readFileSync(path.join(out,name),'utf8');
  for(const m of html.matchAll(/<script\b[^>]*src="([^"?#]+)[^"]*"/g)){
   if(/^(?:https?:|\/\/)/.test(m[1]))continue;
   assert(fs.existsSync(path.resolve(out,path.dirname(name),m[1])),`${name}: missing ${m[1]}`);
  }
 }
});
test('public artifact excludes privileged controllers, API source and secret-bearing files',()=>{
 const denied=['api','.env','assets/member-gateway.js','assets/owner-command-center.js','assets/owner-two-way-workflow.js','assets/questions.js','assets/quiz-core.js'];
 for(const p of denied)assert(!fs.existsSync(path.join(out,p)),p);
 // Report only filenames, never matching values.
 const secretPatterns=[/sb_secret_[A-Za-z0-9_-]{12,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/gh[pousr]_[A-Za-z0-9]{30,}/,/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/];
 for(const file of walk(out).filter(p=>/\.(js|json|html|txt|css)$/.test(p))){
  const source=fs.readFileSync(file,'utf8');
  for(const pattern of secretPatterns)assert(!pattern.test(source),`secret-shaped value in ${path.relative(out,file)}`);
 }
});
test('public-only artifact explicitly denies Member and Admin capabilities',()=>{
 const s=fs.readFileSync(path.join(out,'assets/access.js'),'utf8');
 assert.match(s,/preview-public-only/);assert.match(s,/canAdmin:false/);assert.match(s,/canReadMemberContent:false/);
 assert.doesNotMatch(s,/supabase\.co|sb_publishable_/);
});
