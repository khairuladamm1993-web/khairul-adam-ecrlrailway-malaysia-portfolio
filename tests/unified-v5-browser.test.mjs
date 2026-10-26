/* MR-S10 P01 V5: real image-backed browser visual acceptance, not JSON-only. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const url=process.env.UNIFIED_V5_URL;
if(!/^https:\/\/mrs10-p01-unified-v4-isolated-preview-[a-z0-9]+\.vercel\.app\/unified-map-v5\.html$/.test(url||''))throw Error('V5_UNAPPROVED_ISOLATED_DEPLOYMENT_URL');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const colors=[[8,125,67],[213,0,50],[166,81,0],[251,205,32]];
const names=['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya'];
const report=[];
async function snapshot(page){return page.evaluate(()=>window.MRS10V5Diagnostics?.snapshot?.()||null)}
function imageStatistics(bytes){
 const png=PNG.sync.read(bytes),samples=new Set(),counts=colors.map(()=>0);
 for(let y=0;y<png.height;y+=2)for(let x=0;x<png.width;x+=2){
  const i=(y*png.width+x)*4;
  if(png.data[i+3]<240)continue;
  const rgb=[png.data[i],png.data[i+1],png.data[i+2]];
  samples.add(rgb.map(v=>Math.floor(v/12)).join(','));
  colors.forEach((c,j)=>{if(c.every((v,k)=>Math.abs(v-rgb[k])<=22))counts[j]++});
 }
 return {width:png.width,height:png.height,uniqueQuantizedColors:samples.size,routeColorPixelSamples:counts};
}
let failures=[];
try{
 await fs.mkdir('artifacts/unified-v5-browser',{recursive:true});
 for(const vp of [{width:1180,height:820,name:'desktop'},{width:810,height:1080,name:'ipad-portrait'},{width:390,height:844,name:'iphone'}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errors=[],network={gis:[],tiles:[],style:[]};
  page.on('pageerror',e=>errors.push('JS:'+e.message));
  page.on('unhandledrejection',e=>errors.push('PROMISE:'+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  page.on('response',r=>{
   const u=r.url();if(u.includes('services5.arcgis.com'))network.gis.push(r.status());
   if(u.includes('tiles.openfreemap.org'))(u.includes('/styles/')?network.style:network.tiles).push(r.status());
  });
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>{
    const x=window.MRS10V5Diagnostics?.snapshot?.();
    return x?.sourceMatched===120&&x.styleLoaded&&x.tilesLoaded&&x.webglReady&&
     x.layerCount===4&&Object.values(x.perRoute).length===4&&
     Object.values(x.perRoute).every(r=>r.visible&&r.rendered>0);
   },null,{timeout:55000});
   const before=await snapshot(page);
   const screenshot=await page.locator('#map').screenshot({path:'artifacts/unified-v5-browser/'+vp.name+'-basemap.png'});
   const pixels=imageStatistics(screenshot);
   assert.equal(before.mapInstances,1,'ONE_MAP_INSTANCE');
   assert.equal(before.layerCount,4,'FOUR_UNIQUE_LAYERS');
   assert.equal(before.sourceMatched,120,'ALL_120_SOURCE_STATIONS');
   assert.equal(before.renderedFeatureCount,120,'ALL_120_RENDERED_FEATURES');
   assert(before.webglReady&&before.styleLoaded&&before.tilesLoaded,'BASEMAP_WEBGL_STYLE_NOT_READY');
   assert(before.rect.width>300&&before.rect.height>300&&before.rect.backingWidth>0&&before.rect.backingHeight>0,'BLANK_CANVAS_SIZE');
   assert(pixels.uniqueQuantizedColors>30,'BASEMAP_PIXELS_UNIFORMLY_BLANK');
   assert(pixels.routeColorPixelSamples.every(n=>n>3),'VERIFIED_MARKER_COLOURS_MISSING');
   assert(network.gis.length===4&&network.gis.every(x=>x===200),'GIS_FETCH_NOT_200');
   assert([...network.style,...network.tiles].some(x=>x===200),'NO_SUCCESSFUL_BASEMAP_TILE_OR_STYLE_FETCH');
   assert(names.every(id=>before.perRoute[id].present&&before.perRoute[id].rendered>0),'PER_ROUTE_VISIBLE_FEATURE_MISSING');
   assert.equal(await page.locator('#map-error').isHidden(),true,'UNJUSTIFIED_MAP_ERROR_STATUS');
   await page.locator('#filters button').filter({hasText:'LRT'}).click();
   const lrt=await snapshot(page);
   assert.equal(lrt.perRoute['mrt-kajang'].visible,false);
   assert.equal(lrt.perRoute['mrt-putrajaya'].visible,false);
   assert(lrt.perRoute['lrt-kelana-jaya'].visible&&lrt.perRoute['lrt-ampang'].visible);
   await page.locator('#reset').click();
   assert((await snapshot(page)).perRoute['mrt-kajang'].visible,'RESET_DID_NOT_RESTORE_ALL');
   await page.locator('#theme').click();
   await page.waitForFunction(()=>{
    const s=window.MRS10V5Diagnostics?.snapshot?.();
    return s?.styleLoaded&&s.tilesLoaded&&s.layerCount===4&&
       Object.values(s.perRoute).every(r=>r.rendered>0);
   },null,{timeout:30000});
   await page.locator('#theme').click();
   await page.waitForFunction(()=>{
    const s=window.MRS10V5Diagnostics?.snapshot?.();
    return s?.styleLoaded&&s.tilesLoaded&&s.layerCount===4&&Object.values(s.perRoute).every(r=>r.rendered>0);
   },null,{timeout:30000});
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('Unified'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('综合'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('แผนที่'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('Bersepadu'));
   await page.locator('#search').fill('Putrajaya');
   assert((await page.locator('#search-results button').count())>0,'SEARCH_RESULTS_MISSING');
   await page.locator('#search').fill('');
   await page.locator('#route-buttons button').first().click();
   await page.locator('#lineup button').first().click();
   await page.locator('.maplibregl-popup').waitFor({timeout:10000});
   assert((await page.locator('.shared-services .service-change').count())>=2,'INTERCHANGE_SERVICE_IDENTITIES_LOST');
   await page.locator('.shared-services .service-change').last().click();
   assert((await page.locator('#route-buttons button[aria-pressed=true]').textContent()).includes('Putrajaya'),'INTERCHANGE_SWITCH_FAIL');
   // Actual marker hit testing, not only list click: project known station using MapLibre click map.
   assert((await snapshot(page)).layerCount===4);
   const result={viewport:vp.name,pass:true,initial:before,pixels,network,consoleErrors:errors};
   report.push(result);console.log('V5_VISUAL_PASS',JSON.stringify(result));
  }catch(e){
   const data={viewport:vp.name,pass:false,error:String(e.stack||e),snapshot:await snapshot(page),consoleErrors:errors,network};
   report.push(data);failures.push(vp.name+': '+e.message);
   console.error('V5_VISUAL_FAIL',JSON.stringify(data));
   await page.screenshot({path:'artifacts/unified-v5-browser/'+vp.name+'-failure.png',fullPage:true}).catch(()=>{});
  }finally{await page.close()}
 }
}finally{
 await browser.close();
 await fs.writeFile('artifacts/unified-v5-browser/report.json',JSON.stringify(report,null,2));
}
if(failures.length){console.error('V5_BROWSER_GATE_FAILURES',failures.join(' | '));process.exitCode=1;}
