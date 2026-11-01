'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve('dist-auth-recovery'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('recovery artifact keeps one allowlisted callback origin and existing-account login',()=>{
 const origin=process.env.P01_AUTH_CALLBACK_ORIGIN||'https://khairul-adam-portfolio-preview-safe.vercel.app';
 assert(read('gateway.html').includes('name="mrs10-auth-origin" content="'+origin+'"'));
 assert(read('assets/access.js').includes('shouldCreateUser:false'));assert(read('assets/access.js').includes("const redirectTo=location.origin+'/gateway.html'"));
 assert(!read('assets/member-gateway.js').includes('A new address starts registration'));assert(read('assets/member-gateway.js').includes('existing accounts only'));
});
test('gateway script graph is complete without legacy private quiz assets',()=>{
 for(const html of ['gateway.html','owner-command-center.html'])for(const match of read(html).matchAll(/<script[^>]+src="([^"]+)"/g)){
  if(match[1].startsWith('https://'))continue;assert(fs.existsSync(path.join(root,match[1])),match[1]);
 }
 assert(fs.existsSync(path.join(root,'data/owner-project-registry.json')));
 assert(read('assets/build-info.js').includes('gitSha'));
 for(const p of ['.env','server','db','tests','assets/questions.js','assets/gateway.js','assets/quiz-core.js'])assert(!fs.existsSync(path.join(root,p)),p);
});
test('R2 private lab keeps fresh server role/MFA bootstrap while gateway auth is recovered',()=>{
 const lab=read('ecrl-alignment-lab.html');assert(lab.includes('private-bootstrap-r2.js'));assert(lab.includes('id="private-lab-shell" hidden'));
 assert(lab.includes('type="application/x-mrs10-owner-module"'));
 assert(read('assets/unified-ecrl/route-lab-assistant-store-r17.js').includes('OWNER_PRIVATE_BACKEND_REQUIRED'));
 const headers=JSON.parse(fs.readFileSync('vercel.json','utf8')).headers;assert(headers.some(x=>x.source==='/auth-private-r2.html')); assert(headers.some(x=>x.source==='/gateway.html'&&x.headers.some(h=>h.key==='Cache-Control'&&h.value.includes('no-store'))));
});
