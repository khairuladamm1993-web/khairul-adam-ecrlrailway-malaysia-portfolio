'use strict';
// Preview-only: restore the verified gateway auth layer without unlocking the R2 private lab.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
cp.execFileSync(process.execPath,['scripts/build-auth-private-r2.cjs'],{stdio:'inherit'});
const out='dist-auth-recovery';fs.rmSync(out,{recursive:true,force:true});fs.cpSync('dist-auth-r2',out,{recursive:true});
for(const f of ['gateway.html','owner-command-center.html','assets/access.js','assets/member-gateway.js','assets/public-gateway.js','assets/owner-center-shortcut.js','assets/owner-command-center.js','assets/owner-command-center.css','assets/owner-project-status.js','assets/build-info.js']){
 if(fs.existsSync(f))fs.copyFileSync(f,path.join(out,f));
}
let gateway=fs.readFileSync(out+'/gateway.html','utf8');
gateway=gateway.replace('<head>','<head><meta name="mrs10-auth-origin" content="https://khairul-adam-portfolio-preview-safe.vercel.app"><meta name="referrer" content="no-referrer">');
fs.writeFileSync(out+'/gateway.html',gateway);
const cfg=JSON.parse(fs.readFileSync(out+'/vercel.json','utf8'));cfg.headers.unshift({source:'/gateway.html',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'Referrer-Policy',value:'no-referrer'}]});
fs.writeFileSync(out+'/vercel.json',JSON.stringify(cfg));
for(const f of ['assets/questions.js','assets/quiz-core.js','assets/gateway.js','server','.env'])if(fs.existsSync(path.join(out,f)))throw Error('FORBIDDEN_FRONTEND_ASSET:'+f);
console.log('OWNER_AUTH_RECOVERY_PREVIEW_READY_CANONICAL_ORIGIN_ONLY_R2_PRIVATE_REMAINS_CLOSED');
