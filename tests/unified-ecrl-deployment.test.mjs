import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const base=process.env.ECRL_PREVIEW_URL||'https://mrs10-p01-unified-v8-sg-geometry-2xx50vmky-1993khairuladam-3016.vercel.app/';
const html=await fs.readFile('unified-map-v8.html','utf8');
async function walk(dir){const files=[];for(const d of await fs.readdir(dir,{withFileTypes:true})){const p=path.posix.join(dir,d.name);files.push(...(d.isDirectory()?await walk(p):[p]))}return files}
const files=[...new Set(['unified-map-v8.html',...[...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map(m=>m[1]),'data/unified-v8/physical-network.json',...['lines.json','stations.geojson','route-topology.json','cross-border-terminals.geojson','cross-border-connections.json'].map(p=>'singapore/data/'+p),...await walk('assets/unified-ecrl'),...await walk('assets/consumer-foundation')])];
const digest=b=>createHash('sha256').update(b).digest('hex'),results=[];
for(const file of files){const response=await fetch(new URL(file,base));assert.equal(response.status,200,file);assert.equal(new URL(response.url).origin,new URL(base).origin,file);const sha=digest(Buffer.from(await response.arrayBuffer()));assert.equal(sha,digest(await fs.readFile(file)),file);results.push({file,status:200,sha256:sha})}
await fs.mkdir('artifacts/unified-ecrl-deployment',{recursive:true});await fs.writeFile('artifacts/unified-ecrl-deployment/report.json',JSON.stringify({status:'PASS',base,results},null,2));
console.log('PASS: HTTP 200 + exact SHA-256 match for '+files.length+' ECRL candidate application/provenance assets');
