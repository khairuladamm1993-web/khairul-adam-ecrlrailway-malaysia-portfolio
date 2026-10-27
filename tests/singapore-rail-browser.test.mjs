import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { PNG } from "pngjs";
const url=process.env.SG_PREVIEW_URL||"http://127.0.0.1:8765/singapore/index.html";
const out="artifacts/singapore-v1-browser";await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:"/usr/bin/google-chrome",args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl"]});
const all=[];let failed=0;
const pixels=b=>{const im=PNG.sync.read(b);const s=new Set();for(let y=0;y<im.height;y+=6)for(let x=0;x<im.width;x+=6){const p=(y*im.width+x)*4;s.add([im.data[p],im.data[p+1],im.data[p+2]].map(n=>n>>4).join(":"));}return s.size;};
try {
for(const vp of [{name:"desktop",width:1440,height:900},{name:"ipad",width:1024,height:768},{name:"iphone",width:390,height:844}]){
const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
const errors=[],responses=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",e=>{if(e.type()==="error")errors.push(e.text())});page.on("response",r=>{if(/cartocdn|maplibre-gl@/.test(r.url()))responses.push({status:r.status(),url:r.url().slice(0,80)})});
try{
await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
await page.waitForFunction(()=>window.__sgRailEvidence?.loaded===true&&window.__sgRailMap?.getLayer("sg-station-circles"),null,{timeout:28000});
await page.waitForTimeout(1500);
const ev=await page.evaluate(()=>{const m=window.__sgRailMap;return {stationTotal:window.__sgRailEvidence.stationTotal,rendered:m.queryRenderedFeatures({layers:["sg-station-circles"]}).length,renderedTrack:m.queryRenderedFeatures({layers:["sg-track-lines"]}).length,hasStationSource:!!m.getSource("sg-stations"),hasTrackSource:!!m.getSource("sg-tracks"),canvasRect:m.getCanvas().getBoundingClientRect().toJSON()};});
assert.equal(ev.stationTotal,273);assert(ev.rendered>15,"NO_RENDERED_STATIONS");assert(ev.hasStationSource&&ev.hasTrackSource);assert(ev.canvasRect.width>250&&ev.canvasRect.height>200);
const png=await page.locator("#map").screenshot({path:out+"/"+vp.name+"-map.png"});
assert(pixels(png)>30,"NO_MAP_PIXEL_VARIATION");
assert(responses.some(x=>x.status===200),"MAP_TILES_OR_LIBRARY_HTTP_MISSING");
await page.locator("#search").fill("Keppel");assert((await page.locator("#lineup .station-item").count())>0,"SEARCH_KEPPEL_FAILED");
await page.locator("#lineup .station-item").first().click();assert(await page.locator(".maplibregl-popup").count(),"STATION_POPUP_MISSING");
await page.locator("#search").fill("");
await page.locator("#future").check();
await page.locator("#category").selectOption("FUTURE");
assert((await page.locator("#lineup .station-item").count())>0,"FUTURE_NETWORK_FILTER_FAILED");
await page.locator("#reset").click();
await page.locator("#theme").click();
await page.waitForFunction(()=>window.__sgRailMap?.isStyleLoaded()&&window.__sgRailMap?.getLayer("sg-track-hit")&&window.__sgRailMap?.getLayer("sg-station-circles"),null,{timeout:20000});
await page.locator("#theme").click();
await page.waitForFunction(()=>window.__sgRailMap?.isStyleLoaded()&&window.__sgRailMap?.getLayer("sg-station-circles"),null,{timeout:20000});
await page.locator("#lang").selectOption("zh");assert((await page.locator("#future-label").textContent()).includes("未来"));
await page.locator("#lang").selectOption("th");assert((await page.locator("#future-label").textContent()).includes("อนาคต"));
await page.locator("#lang").selectOption("ms");
const trackTest=await page.evaluate(async()=>{const m=window.__sgRailMap;const data=await (await fetch("./data/tracks.geojson")).json();const c=data.features.find(f=>f.properties.routeIds.includes("TEL")).geometry.coordinates;const mid=c[Math.floor(c.length/2)];m.jumpTo({center:mid,zoom:15});return mid;});
await page.waitForTimeout(900);
const pos=await page.evaluate(mid=>{const m=window.__sgRailMap;const p=m.project(mid),r=m.getContainer().getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y};},trackTest);
const tapDiagnostic=await page.evaluate(p=>{const m=window.__sgRailMap,r=m.getContainer().getBoundingClientRect(),q={x:p.x-r.left,y:p.y-r.top};return {pos:p,local:q,element:document.elementFromPoint(p.x,p.y)?.outerHTML.slice(0,180),tracksAtPoint:m.queryRenderedFeatures([[q.x-15,q.y-15],[q.x+15,q.y+15]],{layers:["sg-track-lines"]}).map(f=>f.properties.segmentId).slice(0,5),stationsAtPoint:m.queryRenderedFeatures([[q.x-10,q.y-10],[q.x+10,q.y+10]],{layers:["sg-station-circles"]}).map(f=>f.properties.stationCode),mapZoom:m.getZoom(),hasSource:m.querySourceFeatures("sg-tracks").length,styleLoaded:m.isStyleLoaded()};},pos);
console.log("TRACK_TAP_DIAGNOSTIC",JSON.stringify({viewport:vp.name,...tapDiagnostic}));
await page.mouse.click(pos.x,pos.y);
await page.waitForTimeout(250);
console.log("TRACK_TAP_RESULT",JSON.stringify(await page.evaluate(()=>({lastClick:window.__sgRailLastClick,popups:[...document.querySelectorAll(".maplibregl-popup")].map(x=>x.innerText.slice(0,100))}))));
await page.waitForTimeout(150);
const popup=await page.locator(".maplibregl-popup").allTextContents();
assert(popup.some(x=>/Maklumat teknikal trek|Technical Track Information/.test(x)),"TRACK_TAP_POPUP_MISSING");
assert(popup.some(x=>/Belum disahkan|UNVERIFIED/.test(x)),"TRACK_PROVENANCE_WARNING_MISSING");
assert.equal(errors.filter(x=>/Uncaught|TypeError|ReferenceError|SyntaxError/.test(x)).length,0,"BROWSER_JS_ERRORS");
const result={viewport:vp.name,pass:true,rendered:ev.rendered,renderedTrack:ev.renderedTrack,pixelColors:pixels(png),tileSuccess:responses.filter(x=>x.status===200).length,consoleErrors:errors.slice(0,3)};all.push(result);console.log("SINGAPORE_BROWSER_PASS",JSON.stringify(result));
}catch(e){failed++;const diagnostic=await page.evaluate(()=>({hasMapLibre:!!window.maplibregl,hasMap:!!window.__sgRailMap,ready:window.__sgRailEvidence,styleLoaded:window.__sgRailMap?.isStyleLoaded(),hasStationLayer:!!window.__sgRailMap?.getLayer("sg-station-circles"),status:document.getElementById("status")?.textContent,mapError:document.getElementById("map-error")?.textContent})).catch(()=>null);const failure={viewport:vp.name,pass:false,error:String(e),errors:errors.slice(0,7),diagnostic};all.push(failure);console.error("SINGAPORE_BROWSER_FAIL",JSON.stringify(failure));await page.screenshot({path:out+"/"+vp.name+"-FAIL.png",fullPage:true}).catch(()=>{});}
finally{await page.close();}
}
}finally{await browser.close();await fs.writeFile(out+"/report.json",JSON.stringify(all,null,2));}
if(failed)process.exitCode=1;
