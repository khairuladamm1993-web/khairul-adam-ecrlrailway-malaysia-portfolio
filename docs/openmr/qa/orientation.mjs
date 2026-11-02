import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),pw=require(process.env.P01_PLAYWRIGHT_MODULE||'playwright'),reports=[];
process.env.PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK='1';
for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--ignore-certificate-errors-spki-list='+process.env.P01_CA_PIN]}:{}),proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}});try{
 const page=await browser.newPage({viewport:{width:1080,height:810},hasTouch:true});await page.goto(process.env.P01_MAP_URL,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>MRS10V8Diagnostics.snapshot().stage==='DONE'&&MRS10V8Diagnostics.snapshot().styleLoaded&&MRS10V8Diagnostics.snapshot().layerCount===44,null,{timeout:120000});
 assert.equal((await page.evaluate(()=>MRS10CompleteQA.camera())).bearing,0);
 await page.locator('#map canvas').focus();await page.keyboard.press('Shift+ArrowRight');await page.waitForFunction(()=>Math.abs(MRS10CompleteQA.camera().bearing)>1);await page.waitForTimeout(500);
 await page.locator('#search').fill('Padang Besar');await page.locator('#search-results [data-route-id="th-v3-border"][data-stop-id="th-my-padang-besar"]').click();
 const saved=await page.evaluate(()=>MRS10V8Diagnostics.focusSnapshot().original.camera);assert(Math.abs(saved.bearing)>1);
 await page.locator('.maplibregl-popup-close-button').click();const restored=await page.evaluate(()=>MRS10CompleteQA.camera());for(const k of ['bearing','zoom','pitch'])assert(Math.abs(restored[k]-saved[k])<1e-6);
 await page.locator('#reset').click();await page.waitForTimeout(450);assert.equal((await page.evaluate(()=>MRS10CompleteQA.camera())).bearing,0);assert.equal(await page.evaluate(()=>OpenMRQA.category()),'MRS10');assert((await page.evaluate(()=>MRS10V8Diagnostics.snapshot())).ecrl.visible);
 reports.push({engine,status:'PASS',scope:'actual MapLibre keyboard rotate, station focus/close preserves deliberate bearing/zoom/pitch, Reset restores north-up/MRS10/ECRL',savedBearing:saved.bearing,restoredBearing:restored.bearing});
}finally{await browser.close()}}
await fs.writeFile('docs/openmr/evidence/orientation-hosted.json',JSON.stringify(reports,null,2)+'\n');console.log(JSON.stringify(reports));
