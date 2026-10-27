'use strict';
const fs=require('fs'),cp=require('child_process'),path=require('path');
cp.execFileSync(process.execPath,['scripts/build-unified-v7.cjs'],{stdio:'inherit'});
const out='dist-unified-v8';fs.mkdirSync(out,{recursive:true});fs.cpSync('dist-unified-v7',out,{recursive:true});
for(const p of ['unified-map-v8.html','assets/unified-v8-map.js','assets/unified-v8','assets/unified-v81','singapore/data','data/unified-v8']){const dest=path.join(out,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.cpSync(p,dest,{recursive:true});}
fs.copyFileSync('unified-map-v8.html',out+'/index.html');
// Vercel configuration is scoped to this new output; existing projects are unchanged.
fs.writeFileSync(out+'/vercel.json',JSON.stringify({headers:[{source:'/(.*)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Content-Type-Options',value:'nosniff'}]}]}));
for(const p of ['api','.env','assets/member-gateway.js'])if(fs.existsSync(out+'/'+p))throw Error('PRIVATE_FILE:'+p);
console.log('V8_PUBLIC_ONLY_BUILD_READY');
