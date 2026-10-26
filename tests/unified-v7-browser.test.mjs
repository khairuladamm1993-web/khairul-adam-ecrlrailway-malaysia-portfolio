/* MR-S10 P01 V7 — browser WebGL and actual PNG visual QA; Owner Safari separate. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const url='https://mrs10-p01-unified-v4-isolated-preview-8eq32a6oo.vercel.app/unified-map-v7.html';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const routes=['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya',
 'lrt-sri-petaling','kl-monorail','erl-klia-ekspres','erl-klia-transit'];
const ktm=['ktm-seremban','ktm-port-klang','ktm-padang-besar','ktm-ipoh',
 'ktm-shuttle-selatan-paloh','ktm-shuttle-selatan-pasirgudang','ktmb-ets-v1','ktmb-ert'];
function pixelStats(buf){
 const im=PNG.sync.read(buf),set=new Set();
 for(let y=0;y<im.height;y+=4)for(let x=0;x<im.width;x+=4){
  const i=(y*im.width+x)*4;if(im.data[i+3]>230)set.add([im.data[i],im.data[i+1],im.data[i+2]].map(x=>Math.floor(x/12)).join(':'));
 }
 return {width:im.width,height:im.height,colors:set.size};
}
const report=[];let fail=0;await fs.mkdir('artifacts/unified-v7-browser',{recursive:true});
try{
 for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push('js:'+e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push('console:'+e.text())});
  page.on('response',r=>{if(/arcgis|openfreemap/.test(r.url()))network.push({status:r.status(),url:r.url().slice(0,120)})});
  const snapshot=()=>page.evaluate(()=>window.MRS10V7Diagnostics?.snapshot?.()||null);
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>{const s=window.MRS10V7Diagnostics?.snapshot?.();
    return s?.stage==='DONE'&&s?.styleLoaded&&s?.tilesLoaded&&s?.webglReady&&s?.layerCount===16&&s?.sourceMatched>=315;
   },null,{timeout:65000});
   await page.waitForTimeout(650);
   const s=await snapshot();
   assert.equal(s.mapInstances,1,'SINGLE_MAPLIBRE_INSTANCE');
   assert.equal(s.layerCount,16,'SIXTEEN_DISTINCT_LAYERS');
   assert(s.sourceMatched>=315&&s.sourceMatched<=326,'SOURCE_MATCH_TOTAL_UNEXPECTED');
   const baseline=[29,37,18,36,29,11,3,6];
   routes.forEach((r,i)=>assert.equal(s.perRoute[r].matched,baseline[i],r+' REGRESSION'));
   const minimum=[23,27,13,13,7,2,38,23];
   ktm.forEach((r,i)=>assert(s.perRoute[r].matched>=minimum[i],r+' SOURCE_MISSING'));
   assert.equal(s.perRoute['ktmb-ets-v1'].matched,38);
   assert.equal(s.perRoute['ktmb-ert'].matched,23);
   assert(!Object.keys(s.perRoute).some(x=>x.includes('timuran')),'SHUTTLE_TIMUR_IMPORTED');
   assert(routes.every(r=>s.perRoute[r].present),'V6_LAYERS_LOST');
   assert(ktm.every(r=>s.perRoute[r].present),'V7_KTM_LAYER_LOST');
   const pic=pixelStats(await page.locator('#map').screenshot({path:'artifacts/unified-v7-browser/'+vp.name+'-map.png'}));
   assert(pic.colors>30,'UNIFORM_BASEMAP');
   assert(s.rect.width>310&&s.rect.height>300,'MAP_CANVAS_TOO_SMALL');
   assert(network.some(x=>x.status===200),'NO_BASEMAP_OR_GIS_SUCCESS');
   const data=await page.evaluate(()=>window.MRS10UnifiedV7KTMData);
   assert.equal(data.tripServices.length,2);
   assert(data.tripServices.every(x=>['ETS','ERT'].includes(x.routeId)));
   const tab=page.locator('#filters button').filter({hasText:'KTM'}).first();
   await tab.click();
   const filtered=await snapshot();
   assert.equal(filtered.perRoute['mrt-kajang'].visible,false,'KTM_FILTER_NOT_HIDING_MRT');
   assert.equal(filtered.perRoute['ktm-seremban'].visible,true,'KTM_FILTER_NOT_SHOWING_KTM');
   await page.locator('#reset').click();
   await page.locator('#theme').click();
   await page.waitForFunction(()=>{const s=window.MRS10V7Diagnostics?.snapshot?.();
    return s?.styleLoaded&&s?.tilesLoaded&&s?.layerCount===16&&s.perRoute['mrt-kajang'].present&&s.perRoute['ktmb-ets-v1'].present;
   },null,{timeout:35000});
   await page.locator('#theme').click();
   await page.waitForFunction(()=>{const s=window.MRS10V7Diagnostics?.snapshot?.();
    return s?.styleLoaded&&s?.tilesLoaded&&s?.layerCount===16;
   },null,{timeout:35000});
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('Unified'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('综合'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('แผนที่'));
   await page.locator('#language').click();
   await page.locator('#route-buttons button').filter({hasText:'KTM ETS'}).click();
   await page.locator('#lineup button').first().click();
   assert(await page.locator('.maplibregl-popup').count(),'ETS_POPUP_NOT_WORKING');
   report.push({viewport:vp.name,pass:true,sourceMatched:s.sourceMatched,rendered:s.renderedFeatureCount,layers:s.layerCount,pixels:pic,errors});
   console.log('V7_KTM_VISUAL_PASS',JSON.stringify(report.at(-1)));
  }catch(e){
   fail++;const s=await snapshot().catch(()=>null);
   const row={viewport:vp.name,pass:false,error:String(e),snapshot:s,errors};report.push(row);
   console.error('V7_KTM_VISUAL_FAIL',JSON.stringify(row));
   await page.screenshot({path:'artifacts/unified-v7-browser/'+vp.name+'-FAIL.png',fullPage:true}).catch(()=>{});
  }finally{await page.close()}
 }
}finally{
 await browser.close();
 await fs.writeFile('artifacts/unified-v7-browser/report.json',JSON.stringify(report,null,2));
}
if(fail)process.exitCode=1;
