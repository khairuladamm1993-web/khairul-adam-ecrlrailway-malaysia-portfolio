/* V6 real Chromium pixel + MapLibre source/render + source responses; not Safari owner proof. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const url='https://mrs10-p01-unified-v4-isolated-preview-8s4ee9zs4.vercel.app/unified-map-v6.html';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const report=[];
const all=['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya',
 'lrt-sri-petaling','kl-monorail','erl-klia-ekspres','erl-klia-transit'];
function imageStats(data){
 const img=PNG.sync.read(data);let variation=new Set();
 for(let y=0;y<img.height;y+=4)for(let x=0;x<img.width;x+=4){
  const i=(y*img.width+x)*4;if(img.data[i+3]>=240)
   variation.add([img.data[i],img.data[i+1],img.data[i+2]].map(v=>Math.floor(v/12)).join(':'));
 }
 return {width:img.width,height:img.height,quantizedColors:variation.size};
}
let fail=0;await fs.mkdir('artifacts/unified-v6-browser',{recursive:true});
try{
 for(const vp of [{name:'desktop',width:1180,height:820},{name:'ipad',width:810,height:1080},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  page.on('response',r=>{if(/arcgis|overpass|openfreemap/.test(r.url()))network.push({status:r.status(),url:r.url().slice(0,145)})});
  const snapshot=()=>page.evaluate(()=>window.MRS10V6Diagnostics?.snapshot?.()||null);
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>{const s=window.MRS10V6Diagnostics?.snapshot?.();
    return s?.stage==='DONE'&&s?.styleLoaded&&s?.tilesLoaded&&s?.webglReady&&
     s?.layerCount===8&&['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya'].every(id=>
       s.perRoute[id]?.present&&s.perRoute[id]?.rendered>0);},null,{timeout:75000});
   const s=await snapshot(),img=imageStats(await page.locator('#map').screenshot({path:'artifacts/unified-v6-browser/'+vp.name+'.png'}));
   assert.equal(s.mapInstances,1,'NO_SINGLE_MAP');
   assert.equal(s.layerCount,8,'EIGHT_LAYERS_NOT_INSTALLED');
   assert.equal(s.perRoute['mrt-kajang'].matched,29);
   assert.equal(s.perRoute['lrt-kelana-jaya'].matched,37);
   assert.equal(s.perRoute['lrt-ampang'].matched,18);
   assert.equal(s.perRoute['mrt-putrajaya'].matched,36);
   assert(img.quantizedColors>30,'BLANK_MAP_IMAGE');
   assert(s.perRoute['lrt-sri-petaling'].matched>=1,'SRI_GIS_NONE');
   assert(s.perRoute['erl-klia-transit'].matched>=1,'ERL_GIS_NONE');
   assert(s.perRoute['kl-monorail'].matched>=1,'MONORAIL_GIS_NONE');
   await page.locator('#filters button').filter({hasText:'Monorail'}).click();
   assert((await snapshot()).perRoute['kl-monorail'].visible,'MONORAIL_FILTER_FAIL');
   await page.locator('#reset').click();
   await page.locator('#theme').click();
   await page.waitForFunction(()=>{const s=window.MRS10V6Diagnostics?.snapshot?.();return s?.styleLoaded&&s?.layerCount===8&&
    ['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya','lrt-sri-petaling','erl-klia-transit','kl-monorail'].every(id=>s.perRoute[id]?.rendered>0);
   },null,{timeout:40000});
   await page.locator('#theme').click();
   await page.waitForFunction(()=>{const s=window.MRS10V6Diagnostics?.snapshot?.();return s?.styleLoaded&&s?.layerCount===8&&
    ['mrt-kajang','lrt-kelana-jaya','lrt-ampang','mrt-putrajaya'].every(id=>s.perRoute[id]?.rendered>0);
   },null,{timeout:40000});
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('Unified'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('综合'));
   await page.locator('#language').click();
   assert((await page.locator('#title').textContent()).includes('แผนที่'));
   await page.locator('#language').click();
   await page.locator('#route-buttons button').filter({hasText:'LRT Sri Petaling'}).click();
   await page.locator('#lineup button').first().click();
   assert(await page.locator('.maplibregl-popup').count(),'SRI_STATION_POPUP_MISSING');
   console.log('V6_VISUAL_PASS',JSON.stringify({vp:vp.name,snapshot:s,pixels:img,network,errors}));
   report.push({vp:vp.name,pass:true,snapshot:s,pixels:img,network,errors});
  }catch(e){
   fail++;const s=await snapshot().catch(()=>null);
   console.error('V6_VISUAL_FAIL',JSON.stringify({vp:vp.name,error:String(e),snapshot:s,network,errors}));
   report.push({vp:vp.name,pass:false,error:String(e),snapshot:s,network,errors});
   await page.screenshot({path:'artifacts/unified-v6-browser/'+vp.name+'-FAIL.png',fullPage:true}).catch(()=>{});
  }finally{await page.close()}
 }
}finally{
 await browser.close();
 await fs.writeFile('artifacts/unified-v6-browser/report.json',JSON.stringify(report,null,2));
}
if(fail)process.exitCode=1;
