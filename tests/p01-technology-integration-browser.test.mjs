import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const base=process.env.P01_QA_ORIGIN||'http://127.0.0.1:8765';
const out=process.env.P01_QA_OUTPUT||'artifacts/p01-technology-integration';
const vendor=process.env.P01_MAPLIBRE_DIST;
assert.ok(vendor,'P01_MAPLIBRE_DIST must point to the pinned MapLibre browser assets');
await fs.mkdir(out,{recursive:true});
const moduleRoot='https://unpkg.com/maplibre-gl@6.13.0/dist/';
const loader=await fetch(base+'/assets/p01-maplibre.js');
assert.equal(loader.status,200);
// Attach a camera probe to the local loader. The verified SDK and worker bytes remain intact.
const loaderWithProbe=await loader.text()+`
import {Map as ProbeMap,getVersion as probeVersion} from '${moduleRoot}maplibre-gl.mjs';
window.ecrlTestVersion=probeVersion();
const jump=ProbeMap.prototype.jumpTo;
ProbeMap.prototype.jumpTo=function(...args){window.ecrlTestMap=this;return jump.apply(this,args)};
`;
const rows=[];
const profiles=[['desktop',1200,900],['ipad',810,1080],['iphone',390,844],['iphone-landscape',844,390]];
const arcgis=/^https:\/\/[^/]*arcgis\.com\//;
const emptyGis=r=>r.fulfill({json:{features:[]},headers:{'access-control-allow-origin':'*'}});

async function checkUnavailableRenderer(browser){
 const page=await browser.newPage();
 try{
  await page.route(moduleRoot+'**',r=>r.abort());
  await page.route(arcgis,emptyGis);
  for(const version of [7,8]){
   assert.equal((await page.goto(base+'/unified-map-v'+version+'.html')).status(),200);
   await page.waitForFunction(v=>window['MRS10V'+v+'Diagnostics']?.snapshot()?.stage==='DONE'&&
    document.querySelector('#lineup li')&&document.querySelector('#map-error')?.textContent.includes('gagal dimuatkan'),version);
   assert.match(await page.locator('#map-error').innerText(),/Peta geografi gagal dimuatkan/);
   assert.ok(await page.locator('#lineup li').count()>0);
  }
  console.log('P01_MAPLIBRE_UNAVAILABLE_CATALOGUE_PASS V7 V8');
 }finally{await page.close()}
}
for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch({headless:true,args:engine==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']:[]});
 try{
  if(engine==='chromium')await checkUnavailableRenderer(browser);
  for(const [device,width,height] of profiles){
   const page=await browser.newPage({viewport:{width,height},hasTouch:device!=='desktop',isMobile:device!=='desktop'});
   const errors=[];
   const localFailures=[];
   page.on('response',r=>{if(r.url().startsWith(base+'/')&&!r.ok())localFailures.push(new URL(r.url()).pathname)});
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(/^V8_MAP_LAYER_INSTALL_FAILED/.test(m.text())) errors.push(m.text())});
   const allowedAssets=new Set(['maplibre-gl.css','maplibre-gl.mjs','maplibre-gl-shared.mjs','maplibre-gl-worker.mjs']);
   await page.route(moduleRoot+'**',async r=>{
    const name=new URL(r.request().url()).pathname.split('/').pop();
    assert.ok(allowedAssets.has(name),name);
    return r.fulfill({
     path:vendor+'/'+name,contentType:name.endsWith('.css')?'text/css':'application/javascript',
     headers:{'access-control-allow-origin':'*'}
    });
   });
   await page.route(base+'/assets/p01-maplibre.js',r=>r.fulfill({body:loaderWithProbe,contentType:'application/javascript'}));
   await page.route('https://tiles.openfreemap.org/styles/**', r=>r.fulfill({json:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#dce6e4'}}]},headers:{'access-control-allow-origin':'*'}}));
   await page.route(arcgis,emptyGis);
   try{
    assert.equal((await page.goto(base+'/unified-map-v7.html')).status(),200);
    await page.waitForFunction(()=>{
     const d=window.MRS10V7Diagnostics?.snapshot();
     return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.layerCount>0;
    },null,{timeout:45000});
    assert.equal(await page.evaluate(()=>window.ecrlTestVersion),'6.13.0');
    assert.equal((await page.goto(base+'/unified-map-v8.html')).status(),200);
    assert.equal(await page.evaluate(()=>window.ecrlTestVersion),'6.13.0');
    assert.equal(await page.evaluate(()=>window.MRS10RailwayDataContractV1.VERSION),1);
    assert.equal(await page.locator('.mrs10-product-badge').innerText(),'MR-S10 · Railway Intelligence');
    await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.ecrl?.layersPresent},null,{timeout:45000});
    await page.locator('#filters').getByRole('button',{name:'ECRL',exact:true}).click();
    await page.locator('#map-fullscreen').click();
    const panel=page.locator('#ecrl-schematic');
    assert.equal(await panel.locator('[data-schematic-asset]').count(),25);
    assert.deepEqual(await page.evaluate(()=>window.ecrlTestMap.getLayoutProperty('mrs10-v8-ecrl-infra-station-marker','icon-size')),
     ['step',['zoom'],0.62,8,0.82,12,1]);
    for(const [tier,zoom,pl,depot,spur] of [['far',7,0,0,0],['mid',9,7,0,0],['near',12,7,2,7]]){
     await page.evaluate(z=>window.ecrlTestMap.jumpTo({center:[103,3.8],zoom:z}),zoom);
     await page.waitForFunction(k=>document.querySelector('#ecrl-schematic').dataset.detail===k,tier);
     if(tier==='far')await panel.locator('summary').click();
     assert.match(await panel.innerText(),/bukan peta jajaran fizikal/);
     for(const [type,n] of [['stn',16],['pl',pl],['depot',depot],['spur',spur]])
      assert.equal(await panel.locator('.ecrl-schematic-'+type+':visible').count(),n);
     const size=await panel.locator('.ecrl-schematic-stn .ecrl-design-icon').first().evaluate(n=>n.getBoundingClientRect().width);
     assert.equal(size,34);
     if(pl)assert.equal(await panel.locator('.ecrl-schematic-pl .ecrl-design-icon').first().evaluate(n=>n.getBoundingClientRect().width),26);
     if(depot)assert.equal(await panel.locator('.ecrl-schematic-depot .ecrl-design-icon').first().evaluate(n=>n.getBoundingClientRect().width),26);
     const panelBox=await panel.boundingBox(), fullscreenBox=await page.locator('#map-fullscreen').boundingBox();
     assert.ok(panelBox.x>=fullscreenBox.x+fullscreenBox.width);
     if(device==='iphone'||tier==='near')await page.screenshot({path:`${out}/${engine}-${device}-${tier}.png`});
    }
    await panel.locator('[data-schematic-asset="ecrl-loop-historical-01"]').click();
    await page.locator('#ecrl-no-point').waitFor();
    assert.match(await page.locator('#ecrl-no-point').innerText(),/Lokasi PL belum disahkan/);
    await page.locator('#ecrl-no-point > button').click();
    assert.equal(await page.evaluate(()=>window.MRS10ECRLCandidateQA.inspectAsset('ecrl-stn-11')),true);
    const canvas=page.locator('#map canvas');
    const hit=await page.waitForFunction(()=>{
     const m=window.ecrlTestMap,n='mrs10-v8-ecrl-infra';
     const info=m?.getImage(n+'-train');
     if(!info||!m.isStyleLoaded())return null;
     const matched=m.queryRenderedFeatures({layers:[n+'-station-marker']}).find(f=>f.properties.assetId==='ecrl-stn-11');
     if(!matched)return null;
     return {size:info.data.width/info.pixelRatio,point:m.project(matched.geometry.coordinates)};
    },null,{timeout:10000});
    const {point,size}=await hit.jsonValue();
    assert.equal(size,34);
    await canvas.click({position:point});
    const popup=page.locator('.p01-map-popup');
    await popup.getByText('STN12 · Kota SAS',{exact:true}).waitFor();
    const measure=()=>page.evaluate(()=>{
     const bounds=s=>document.querySelector(s).getBoundingClientRect();
     const p=bounds('.p01-map-popup'),c=bounds('.maplibregl-popup-close-button');
     const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
     const controls=['#map-fullscreen','#my-location','.maplibregl-ctrl-top-right'];
     return {inside:p.top>=0&&p.left>=0&&p.bottom<=innerHeight+1&&p.right<=innerWidth+1,
      obstruction:controls.some(s=>overlaps(p,bounds(s))),
      closeVisible:c.top>=p.top&&c.bottom<=p.bottom&&c.width>=44&&c.height>=44};
    });
    assert.deepEqual(await measure(),{inside:true,obstruction:false,closeVisible:true});
    await popup.locator('.ecrl-engineering > summary').click();
    assert.equal(await popup.locator('.ecrl-engineering').evaluate(e=>e.open),true);
    assert.ok(await popup.locator('.maplibregl-popup-content').evaluate(e=>{
     e.scrollTop=e.scrollHeight;
     return e.scrollTop>0;
    }));
    assert.deepEqual(await measure(),{inside:true,obstruction:false,closeVisible:true});
    await page.screenshot({path:`${out}/${engine}-${device}-popup.png`});
    await popup.locator('.maplibregl-popup-close-button').click();
    await popup.waitFor({state:'detached'});
    const fullscreen=page.locator('#map-fullscreen');
    await fullscreen.click();
    await page.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.mapbox').classList.contains('is-fullscreen'));
    await page.locator('.mapbox').evaluate(box=>{
     box.requestFullscreen=()=>Promise.reject(new Error('Fullscreen API unavailable'));
    });
    await fullscreen.click();
    await page.waitForFunction(()=>!document.querySelector('#map-fullscreen').disabled);
    assert.equal(await fullscreen.getAttribute('aria-label'),'Keluar daripada skrin penuh');
    assert.equal(await fullscreen.getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
    await canvas.focus();
    await page.keyboard.press('Escape');
    assert.equal(await fullscreen.getAttribute('aria-label'),'Skrin penuh');
    assert.equal(await fullscreen.getAttribute('aria-pressed'),'false');
    assert.equal(await fullscreen.evaluate(button=>document.activeElement===button),true);
    assert.equal(await page.locator('.mapbox.is-fullscreen').count(),0);
    await fullscreen.click();
    await fullscreen.click();
    await page.waitForFunction(()=>document.querySelector('#map-fullscreen').getAttribute('aria-pressed')==='false');
    assert.equal(await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl.physicalSegments),0);
    assert.deepEqual(errors,[]);
    assert.deepEqual(localFailures,[]);
    rows.push({engine,device,status:'PASS',maplibre:'6.13.0',publicV7:true,tiers:[[16,0,0,0],[16,7,0,0],[16,7,2,7]],stationPopup:true,popupScroll:true,controlsClear:true,plNoPoint:true,fullscreenFallbackEscape:true});
   }catch(e){rows.push({engine,device,status:'FAIL',error:String(e.stack||e)});await page.screenshot({path:`${out}/${engine}-${device}-fail.png`}).catch(()=>{})}
   finally{await fs.writeFile(out+'/visual-qa.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));await page.close()}
  }
 }finally{await browser.close()}
}
if(rows.some(row=>row.status==='FAIL'))process.exitCode=1;
