/* Browser smoke on isolated V4 preview; do not use in production.
   Executed only in separate GitHub CI, never modifies live data. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.UNIFIED_V4_URL;
if(!/^https:\/\/mrs10-p01-unified-v4-isolated-preview-[a-z0-9]+\.vercel\.app\/unified-map-v4\.html$/.test(base||''))throw new Error('UNAPPROVED_PREVIEW_URL');
await fs.mkdir('artifacts/unified-v4-browser',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
let failed=false;
try{
 for(const viewport of [{width:1100,height:800,name:'desktop'},{width:390,height:844,name:'iphone'}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  const errors=[],gisResponse=[];
  page.on('pageerror',e=>errors.push('runtime:'+e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push('console:'+msg.text())});
  page.on('response',r=>{if(r.url().includes('services5.arcgis.com'))gisResponse.push({url:r.url().split('/FeatureServer/')[1]?.slice(0,4),status:r.status()})});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#lineup li').first().waitFor({timeout:30000});
  assert.equal(await page.locator('#lineup li').count(),29);
  await page.waitForFunction(()=>/(\d+)\/120/.test(document.querySelector('#qa-note')?.textContent||'')&&!/Memuatkan sumber/.test(document.querySelector('#qa-note')?.textContent||''),{timeout:60000}).catch(()=>{});
  await page.waitForTimeout(5000);
  const status=await page.locator('#qa-note').textContent();
  const totals=await page.locator('.legend-item').allTextContents();
  const counts=totals.map(x=>{const m=x.match(/(\d+)\/(\d+)/);return m?{matched:Number(m[1]),expected:Number(m[2])}:null});
  const visual=await page.evaluate(()=>window.MRS10V4Diagnostics?.snapshot?.()||null);
  const result={viewport:viewport.name,status,counts,visual,gisResponse,errors:errors.slice(0,20),title:await page.title()};
  await page.screenshot({path:'artifacts/unified-v4-browser/'+viewport.name+'.png',fullPage:true});
  await fs.writeFile('artifacts/unified-v4-browser/'+viewport.name+'.json',JSON.stringify(result,null,2));
  console.log('BROWSER_RESULT',JSON.stringify(result));
  try{
   assert.equal(counts.length,4,'all four route legends');
   assert.deepEqual(counts.map(x=>x.expected),[29,37,18,36]);
   assert(counts.every(x=>x.matched>0),'every route must display at least one source-backed GIS marker');
   assert(await page.locator('#map canvas').count()>0,'map canvas');
   assert(result.visual?.renderedFeatureCount>0,'ACTUAL_VISIBLE_STATION_MARKERS_ZERO');
   assert(result.visual?.styleLoaded,'MAPLIBRE_STYLE_NOT_LOADED');
   await page.locator('#filters button').filter({hasText:'LRT'}).click();
   assert.equal(await page.locator('.legend-item').count(),2);
   await page.locator('#reset').click();
   assert.equal(await page.locator('.legend-item').count(),4);
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('Unified'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('综合'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('แผนที่'));
   await page.locator('#theme').click();
   await page.waitForTimeout(1300);
   assert.equal(await page.locator('.legend-item').count(),4);
   await page.locator('#search').fill('Putrajaya');
   assert((await page.locator('#search-results button').count())>0);
   await page.locator('#search-results button').first().click();
   console.log('BROWSER_INTERACTION_PASS',viewport.name);
  }catch(e){failed=true;console.error('BROWSER_ASSERTION_FAIL',viewport.name,String(e?.stack||e))}
  await page.close();
 }
}finally{await browser.close()}
if(failed)process.exitCode=1;
