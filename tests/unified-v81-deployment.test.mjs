import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='https://mrs10-p01-unified-v8-sg-geometry-k9z5y0ucb-1993khairuladam-3016.vercel.app/';
const html=await fs.readFile('unified-map-v8.html','utf8');
const files=['unified-map-v8.html',...[...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map(m=>m[1]),'data/unified-v8/physical-network.json',...['lines.json','stations.geojson','route-topology.json','cross-border-terminals.geojson','cross-border-connections.json'].map(p=>'singapore/data/'+p)];
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const path of files){const response=await fetch(new URL(path,base));assert.equal(response.status,200,path);assert.equal(digest(Buffer.from(await response.arrayBuffer())),digest(await fs.readFile(path)),path);}
console.log('PASS: HTTP 200 + exact SHA-256 match for '+files.length+' deployed application assets');
