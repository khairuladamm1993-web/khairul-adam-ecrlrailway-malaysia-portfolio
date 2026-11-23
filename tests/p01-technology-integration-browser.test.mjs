import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const base=process.env.P01_QA_ORIGIN||'http://127.0.0.1:8765';
const out=process.env.P01_QA_OUTPUT||'artifacts/p01-technology-integration';
const vendor=process.env.P01_MAPLIBRE_DIST||path.dirname(require.resolve('maplibre-gl'));
await fs.mkdir(out,{recursive:true});
const sdk=await fs.readFile(vendor+'/maplibre-gl.js','utf8');
// Capture the app's MapLibre instance in the test harness to set repeatable camera zooms.
const mapHook=';{const p=maplibregl.Map.prototype;const jump=p.jumpTo;p.jumpTo=function(...args){window.ecrlTestMap=this;return jump.apply(this,args)}}';
const rows=[];
const profiles=[['desktop',1200,900],['ipad',810,1080],['iphone',390,844]];
for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch({headless:true,args:engine==='chromium'?['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']:[]});
 try{
  for(const [device,width,height] of profiles){
   const page=await browser.newPage({viewport:{width,height},hasTouch:device!=='desktop',isMobile:device!=='desktop'});
   const errors=[];
   const localFailures=[];
   page.on('response',r=>{if(r.url().startsWith(base+'/')&&!r.ok())localFailures.push(new URL(r.url()).pathname)});
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(/^V8_MAP_LAYER_INSTALL_FAILED/.test(m.text())) errors.push(m.text())});
   await page.route('https://unpkg.com/maplibre-gl@5.12.0/dist/**',r=>r.request().url().endsWith('.js')?
    r.fulfill({body:sdk+'\n'+mapHook,contentType:'application/javascript'}):r.fulfill({path:vendor+'/maplibre-gl.css'}));
   await page.route('https://tiles.openfreemap.org/styles/**', r=>r.fulfill({json:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#dce6e4'}}]},headers:{'access-control-allow-origin':'*'}}));
   await page.route(/^https:\/\/[^/]*arcgis\.com\//,r=>r.fulfill({json:{features:[]},headers:{'access-control-allow-origin':'*'}}));
   try{
    assert.equal((await page.goto(base+'/unified-map-v8.html')).status(),200);
    assert.equal(await page.evaluate(()=>window.MRS10RailwayDataContractV1.VERSION),1);
    await page.waitForFunction(()=>{const d=window.MRS10V8Diagnostics?.snapshot();return d?.stage==='DONE'&&d.styleLoaded&&d.webglReady&&d.ecrl?.layersPresent},null,{timeout:45000});
    await page.locator('#filters').getByRole('button',{name:'ECRL',exact:true}).click();
    await page.locator('#map-fullscreen').click();
    const panel=page.locator('#ecrl-schematic');
    assert.equal(await panel.locator('[data-schematic-asset]').count(),25);
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
    await page.locator('.maplibregl-popup').getByText('STN12 · Kota SAS',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.MRS10V8Diagnostics.snapshot().ecrl.physicalSegments),0);
    assert.deepEqual(errors,[]);
    assert.deepEqual(localFailures,[]);
    rows.push({engine,device,status:'PASS',tiers:[[16,0,0,0],[16,7,0,0],[16,7,2,7]],stationPopup:true,plNoPoint:true});
   }catch(e){rows.push({engine,device,status:'FAIL',error:String(e.stack||e)});await page.screenshot({path:`${out}/${engine}-${device}-fail.png`}).catch(()=>{})}
   finally{await fs.writeFile(out+'/visual-qa.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));await page.close()}
  }
 }finally{await browser.close()}
}
if(rows.some(row=>row.status==='FAIL'))process.exitCode=1;
