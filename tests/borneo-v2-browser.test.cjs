"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const {chromium}=require("playwright");
const base=path.resolve(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};
const allow=new Set(["borneo-v2.html","assets/borneo-v2.css","assets/borneo-v2.js","data/borneo-v2-registry.json","data/borneo-kuts-eia-2021.json"]);
function server(){return http.createServer((req,res)=>{
 const file=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/^\//,"");
 if(!allow.has(file)){res.writeHead(404);res.end("Not found");return}
 const name=path.join(base,file);
 res.writeHead(200,{"content-type":mime[path.extname(name)]||"application/octet-stream","cache-control":"no-store"});
 fs.createReadStream(name).pipe(res);
})}
const tick=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const srv=server();await new Promise((r,e)=>srv.once("error",e).listen(0,"127.0.0.1",r));
 const origin="http://127.0.0.1:"+srv.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});
  const cdn=path.join(base,"node_modules/maplibre-gl/dist");
  const scriptName=path.join(cdn,"maplibre-gl.mjs"),workerName=path.join(cdn,"maplibre-gl-worker.mjs"),cssName=path.join(cdn,"maplibre-gl.css");
  assert.ok(fs.existsSync(scriptName)&&fs.existsSync(workerName)&&fs.existsSync(cssName),"Local ESM MapLibre distribution missing");
  // Controlled local fixture prevents unrelated CDN/OSM outages from becoming false GIS failures.
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==","base64");
  const dir=path.join(base,"qa-output");fs.mkdirSync(dir,{recursive:true});
  const errors=[];
  for(const cfg of [{label:"ipad",viewport:{width:1024,height:768}},{label:"iphone",viewport:{width:390,height:844}}]){
   const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});
   page.on("pageerror",e=>errors.push(cfg.label+": "+e.message));
   await page.route("https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs",route=>route.fulfill({status:200,contentType:"text/javascript",headers:{"access-control-allow-origin":"*"},body:fs.readFileSync(scriptName)}));
   await page.route("https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl-worker.mjs",route=>route.fulfill({status:200,contentType:"text/javascript",headers:{"access-control-allow-origin":"*"},body:fs.readFileSync(workerName)}));
   await page.route("https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.css",route=>route.fulfill({status:200,contentType:"text/css",body:fs.readFileSync(cssName)}));
   await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:png}));
   await page.goto(origin+"/borneo-v2.html",{waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>window.__BORNEO_V2_QA?.().mapLoaded===true,{timeout:25000});
   await page.waitForTimeout(800);
   const first=await page.evaluate(()=>window.__BORNEO_V2_QA());
   assert.equal(first.stationCount,15);
   assert.equal(first.visibleGeoJSONCount,15);
   assert.equal(first.historicalEiaPointCount,10,"2021 EIA proposals missing in default map");
   assert.equal(first.artStationGPSCount,0,"Do not label historical EIA as current GPS");
   assert.ok(await page.locator("#art-map-diagram .art-diagram-route-title").count()===3,"Three line map schematic missing");
   assert.equal(first.artRegionalLocatorCount,1,cfg.label+" Kuching ART marker missing on ALL");
   assert.equal(first.artStationGPSCount,0,"ART station GPS must remain absent");
   assert.deepEqual(first.artShownLines,["BLUE","RED","GREEN"]);
   const marker=page.locator(".borneo-art-locator");
   assert.ok(await marker.isVisible(),"Kuching city reference marker not visible");
   assert.equal(await page.locator(".art-line-chip").count(),0);
   const bounds=await marker.boundingBox(),container=await page.locator("#map").boundingBox();
   const overlapX=Math.max(0,Math.min(bounds.x+bounds.width,container.x+container.width)-Math.max(bounds.x,container.x));
   const overlapY=Math.max(0,Math.min(bounds.y+bounds.height,container.y+container.height)-Math.max(bounds.y,container.y));
   assert.ok(overlapX/bounds.width>.75&&overlapY/bounds.height>.7,
    cfg.label+" Kuching ART locator clipped outside map at ALL overview "+JSON.stringify({bounds,container,overlapX,overlapY}));
   assert.ok(first.renderedFeatureCount>0,cfg.label+" actual MapLibre canvas has no rendered Sabah stations: "+JSON.stringify(first));
   const canvas=page.locator(".maplibregl-canvas");assert.ok(await canvas.isVisible(),cfg.label+" canvas absent");
   await page.screenshot({path:path.join(dir,"borneo-"+cfg.label+"-default.png"),fullPage:true});
   await page.locator('[data-category="SARAWAK"]').click();
   await page.waitForTimeout(650);
   const art=await page.evaluate(()=>window.__BORNEO_V2_QA());
   assert.equal(art.visibleGeoJSONCount,0,"ART cannot invent GPS points");
   assert.equal(art.artRegionalLocatorCount,1,"ART should remain visible on Sarawak focus");
   assert.equal(art.historicalEiaPointCount,10,"Sarawak must show documented historical EIA markers");
   assert.ok(art.historicalEiaRenderedCount>0,"No historical EIA circles actually rendered on MapLibre canvas");
   assert.equal(await page.locator(".art-diagram-stop").count(),14,"14 named ART stops must appear in on-map schematic");
   assert.equal(art.artStationGPSCount,0,"City reference must not be counted as a stop GPS");
   assert.ok(await marker.isVisible(),"ART marker not visible on regional focus");
   await page.screenshot({path:path.join(dir,"borneo-"+cfg.label+"-sarawak.png"),fullPage:true});
   await page.locator(".art-diagram-route-title").filter({hasText:"Red"}).click();
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).category,"RED");
   assert.equal(await page.locator(".art-diagram-route-title").count(),1,"Diagram did not follow RED filter");
   assert.equal(await page.locator(".art-diagram-stop").count(),6,"Red line stop lineup missing");
   await page.locator('.art-diagram-stop').filter({hasText:"Swinburne"}).click();
   assert.equal(await page.locator(".maplibregl-popup").count(),1,"Station historical/source popup missing");
   await page.locator('[data-category="SARAWAK"]').click();
   assert.equal(await page.locator(".schematic-line").count(),3,"ART schematic lines missing");
   await page.locator('[data-category="GREEN"]').click();
   assert.equal(await page.locator(".schematic-line").count(),1,"Green schematic absent");
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).historicalEiaPointCount,0,"Green has no EIA 2021 GPS in this release");
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).artRegionalLocatorCount,1,"Green Line absent from map");
   assert.match(await page.locator("#lineup").innerText(),/Pending/);
   await page.locator('[data-category="SABAH"]').click();
   await page.waitForTimeout(650);
   const sabah=await page.evaluate(()=>window.__BORNEO_V2_QA());
   assert.equal(sabah.visibleGeoJSONCount,15);
   assert.equal(sabah.historicalEiaPointCount,0,"Sabah filter must hide 2021 KUTS markers");
   assert.equal(sabah.artRegionalLocatorCount,0,"ART locator must hide in Sabah-only");
   assert.ok(sabah.renderedFeatureCount>0,"Safari-like viewport focus lost visible stations");
   await page.locator("#search").fill("Tenom");
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).visibleGeoJSONCount,1);
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).artRegionalLocatorCount,0);
   await page.locator("#reset").click();
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).visibleGeoJSONCount,15);
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).historicalEiaPointCount,10,"Reset must show KUTS history layer");
   assert.equal((await page.evaluate(()=>window.__BORNEO_V2_QA())).artRegionalLocatorCount,1,"Reset must recover Kuching city locator");
   await page.locator('[data-id="SSR-10"]').click();
   assert.equal(await page.locator(".maplibregl-popup").count(),1,"Station popup missing");
   await page.locator("#theme").click();
   assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
   await page.locator("#language").selectOption("zh");
   assert.equal(await page.locator("html").getAttribute("lang"),"zh");
   await page.screenshot({path:path.join(dir,"borneo-"+cfg.label+"-dark.png"),fullPage:true});
   await page.close();
   console.log("BROWSER_RENDER_PASS "+cfg.label+" "+JSON.stringify({initial:first.renderedFeatureCount,sabahFocused:sabah.renderedFeatureCount,artSchematic:3,artHistoricalEiaPoints:art.historicalEiaPointCount,artHistoricalEiaRendered:art.historicalEiaRenderedCount,artCityLocator:first.artRegionalLocatorCount,artStationGPS:0,theme:"dark",i18n:"zh"}));
  }
  assert.deepEqual(errors,[],"Browser runtime pageerror(s)");
 }finally{if(browser)await browser.close();await new Promise(r=>srv.close(r));}
})().catch(err=>{console.error(err);process.exitCode=1});
