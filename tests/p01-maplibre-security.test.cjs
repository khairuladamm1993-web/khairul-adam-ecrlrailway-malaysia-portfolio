'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
const root='https://unpkg.com/maplibre-gl@6.13.0/dist/';
const checksumRows=read('tests/fixtures/p01-maplibre-6.13.0.sha256').trim().split('\n').map(row=>row.split(/\s+/));
const checksums=Object.fromEntries(checksumRows.map(([digest,file])=>[file,digest]));
const cssIntegrity='sha256-'+Buffer.from(checksums['maplibre-gl.css'],'hex').toString('base64');

test('P01 map entry points load the pinned patched ESM and matching CSS',()=>{
 assert.ok(read('assets/p01-maplibre.js').includes(`import('${root}maplibre-gl.mjs').catch(()=>null)`));
 assert.ok(read('assets/p01-maplibre.js').includes("setWorkerUrl(new URL('./p01-maplibre-worker.js',import.meta.url).href)"));
 assert.equal(read('assets/p01-maplibre-worker.js').trim(),`import '${root}maplibre-gl-worker.mjs';`);
 for(const version of [4,5,6,7,8]){
  const html=read(`unified-map-v${version}.html`);
  assert.ok(html.includes(`href="${root}maplibre-gl.css" integrity="${cssIntegrity}" crossorigin="anonymous"`));
  assert.ok(html.includes(`type="module" src="./assets/unified-v${version}-map.js"`));
  assert.ok(read(`assets/unified-v${version}-map.js`).includes("import maplibregl from './p01-maplibre.js'"));
  assert.doesNotMatch(html,/maplibre-gl@5\.|maplibre-gl\.js/);
 }
 const lab=read('ecrl-alignment-lab.html');
 assert.ok(lab.includes(`href="${root}maplibre-gl.css" integrity="${cssIntegrity}" crossorigin="anonymous"`));
 assert.ok(lab.includes('type="module" src="./assets/unified-ecrl/route-lab-ui.js"'));
 assert.ok(read('assets/unified-ecrl/route-lab-ui.js').includes("import maplibregl from '../p01-maplibre.js'"));
 assert.doesNotMatch(lab,/maplibre-gl@5\.|maplibre-gl\.js/);
});

test('checksum manifest covers CSS, loader and module worker graph',()=>{
 assert.deepEqual(Object.keys(checksums).sort(),['maplibre-gl-shared.mjs','maplibre-gl-worker.mjs','maplibre-gl.css','maplibre-gl.mjs']);
 for(const digest of Object.values(checksums))assert.match(digest,/^[a-f0-9]{64}$/);
});
