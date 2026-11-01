'use strict';
// Reuse the accepted R2.6 builder unchanged; publish a map-only entry with canonical auth navigation.
const fs=require('node:fs'),cp=require('node:child_process');
cp.execFileSync(process.execPath,['scripts/build-owner-auth-recovery.cjs'],{stdio:'inherit'});
const out='dist-complete-map';fs.rmSync(out,{recursive:true,force:true});fs.cpSync('dist-auth-recovery',out,{recursive:true});
fs.copyFileSync('unified-map-v8.html',out+'/index.html');
// Existing accepted login stays on its allowlisted canonical host, not an unregistered new map origin.
fs.writeFileSync(out+'/gateway.html','<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=https://khairul-adam-portfolio-preview-safe.vercel.app/gateway.html"><title>MR-S10 Gateway</title></head><body><a href="https://khairul-adam-portfolio-preview-safe.vercel.app/gateway.html">Owner / Member Gateway</a></body></html>');
for(const p of ['api','server','.env','db'])if(fs.existsSync(out+'/'+p))throw Error('PRIVATE_ARTIFACT:'+p);
console.log('COMPLETE_MAP_PREVIEW_READY_ACCEPTED_AUTH_UNCHANGED');
