"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const registry=JSON.parse(read("data/borneo-v2-registry.json")),eia=JSON.parse(read("data/borneo-kuts-eia-2021.json")),html=read("borneo-v2.html"),js=read("assets/borneo-v2.js"),css=read("assets/borneo-v2.css");
test("15 JKNS stations in official order and correct section transitions",()=>{
 const expected="Sembulan|Tanjung Aru|Putatan|Kinarut|Kawang|Papar|Kimanis|Bongawan|Membakut|Beaufort|Saliwangan|Halogilat|Rayoh|Pangi|Tenom".split("|");
 assert.deepEqual(registry.sabah.stations.map(s=>s.name),expected);
 assert.deepEqual(registry.sabah.stations.map(s=>s.sequence),Array.from({length:15},(_,i)=>i+1));
 assert.equal(registry.sabah.stations[0].segment,"reference_only");
 assert.equal(registry.sabah.stations[9].segment,"interchange");
 assert.equal(registry.sabah.stations[10].segment,"gorge");
 assert.equal(registry.sabah.line_sections[0].length_km,85);assert.equal(registry.sabah.line_sections[1].length_km,49);
});
test("source-backed station geometry: no duplicates and no made-up coordinates",()=>{
 const coords=new Set(),ids=new Set();
 for(const s of registry.sabah.stations){
  assert.match(s.id,/^SSR-\d{2}$/);assert.ok(!ids.has(s.id));ids.add(s.id);
  assert.equal(s.point.type,"Point");assert.equal(s.point.coordinates.length,2);
  const [lng,lat]=s.point.coordinates;assert.ok(lng>114&&lng<117&&lat>4.5&&lat<6.5);
  assert.ok(!coords.has(s.point.coordinates.join(",")));coords.add(s.point.coordinates.join(","));
  assert.match(s.location_source,/^https:\/\//);assert.match(s.registry_source,/railway.sabah.gov.my/);
  assert.equal(s.passenger_service_confirmed_for_all_trips,false);
 }
 assert.equal(registry.sabah.track_geometry,null);assert.match(registry.sabah.geometry_confidence,/NO_VERIFIED/);
});
test("KUTS is trackless ART, schematic-only, with no deceptive operational labels",()=>{
 assert.equal(registry.sarawak.classification,"URBAN_TRANSIT_ART");assert.equal(registry.sarawak.rail_track,false);
 assert.equal(registry.sarawak.route_geometry,null);
 const city=registry.sarawak.map_reference;
 assert.equal(city.classification,"CITY_REFERENCE_NOT_ART_STATION");
 assert.equal(city.point_confidence,"SECONDARY_OSM_CITY_CENTRE");
 assert.deepEqual(city.point.coordinates,[110.3494,1.5606]);
 assert.match(city.source,/^https:\/\/mapcarta.com\/Kuching/);
 assert.ok(!registry.sarawak.stations.some(s=>s.id===city.id));
 assert.ok(registry.sarawak.stations.some(s=>s.code==="SM11"&&s.name==="The Spring"));
 assert.ok(!registry.sarawak.stations.some(s=>s.code==="SM09"&&s.name==="The Spring"));
 assert.deepEqual(registry.sarawak.lines.map(l=>l.id),["BLUE","RED","GREEN"]);
 assert.equal(new Set(registry.sarawak.stations.map(s=>s.id)).size,registry.sarawak.stations.length);
 for(const x of registry.sarawak.stations){assert.equal(x.point,null);assert.equal(x.point_confidence,"SCHEMATIC_ONLY");assert.ok(["BLUE","RED","GREEN"].includes(x.line))}
 for(const x of registry.sarawak.lines){assert.equal(x.point_geometry,null);assert.equal(x.color_authority,"UI_PROVISIONAL");assert.notEqual(x.lineup_completeness,"COMPLETE")}
 assert.match(registry.sarawak.network_status,/NO_GENERAL_PASSENGER_OPENING_VERIFIED/);
});
test("2021 EIA GPS points remain historical and distinct from 2026 station GPS",()=>{
 assert.equal(eia.records.length,10);assert.equal(eia.document_year,2021);assert.match(eia.source_url,/scribd.com/);
 assert.ok(eia.records.every(x=>x.point_is_current_station===false&&x.geometry_confidence==="HISTORICAL_EIA_PLANNED_NOT_CURRENT_STATION"));
 assert.ok(eia.records.every(x=>x.geometry.coordinates[0]>110.2&&x.geometry.coordinates[1]>1.35));
 assert.ok(registry.sarawak.stations.every(x=>x.point===null));
 assert.equal(registry.sarawak.phase1_update.green_phase1_end,"Bulatan Yayasan Sarawak");
 assert.ok(registry.sarawak.stations.find(x=>x.name==="The Spring")?.code_conflict);
});
test("isolation: preview creates no production/Auth/RLS side effects",()=>{
 assert.match(html,/noindex,nofollow/);assert.ok(!/supabase|login|service.role|api.key/i.test(js));
 assert.ok(!/https?:\/\/[^"']*\.vercel\.app/.test(html));assert.ok(!/CONVENTIONAL_RAILWAY_TRACK/.test(JSON.stringify(registry.sarawak)));
 assert.match(html,/maplibre-gl@6\.13\.0/);assert.ok(!/<script[^>]*gateway\.js/.test(html)); assert.match(html,/type="module"/); assert.ok(html.includes("dist/maplibre-gl.mjs")); assert.ok(!html.includes("dist/maplibre-gl.js"));
});
test("accessible controls and 4-language renderer present",()=>{
 for(const k of ["ALL","SABAH","SARAWAK","BLUE","RED","GREEN"])assert.ok(html.includes('data-category="'+k+'"'));
 for(const l of ["ms","en","zh","th"])assert.ok(html.includes('value="'+l+'"'));
 for(const k of ["map-fallback","lineup","search","reset","theme"])assert.ok(html.includes('id="'+k+'"'));
 assert.match(js,/style\.load/);assert.match(js,/circle-radius/);assert.match(js,/queryRenderedFeatures/);assert.match(css,/prefers-reduced-motion/);
});
test("JSDOM runtime: source has 15 points by default; filters, search, reset, 4 languages, popup and theme function",async()=>{
 const {JSDOM}=require("jsdom");const dom=new JSDOM(html,{url:"https://preview.test/borneo-v2.html",runScripts:"outside-only",pretendToBeVisual:true});
 const w=dom.window;const instances=[];
 class M {
  constructor(o){this.options=o;this.sources={};this.layers={};this.handlers={};this.canvas={style:{}};instances.push(this);w.queueMicrotask(()=>this.handlers["style.load"]?.());}
  on(t,layer,cb){if(typeof layer==="function"){cb=layer;layer=null}this.handlers[t+(layer?":"+layer:"")]=cb;}
  addSource(k,data){this.sources[k]={_data:data.data,setData(x){this._data=x;}}}getSource(k){return this.sources[k]}
  addLayer(data){this.layers[data.id]=data}getLayer(k){return this.layers[k]}getCanvas(){return this.canvas}
  addControl(){}fitBounds(){}easeTo(){}setPaintProperty(){}
  queryRenderedFeatures(){return this.sources["borneo-points"]?this.sources["borneo-points"]._data.features:[]}
 }
 class Marker{
  constructor({element}){this.element=element}
  setLngLat(coords){this.coords=coords;return this}
  addTo(){w.document.getElementById("map").append(this.element);return this}
  remove(){this.element.remove();return this}
 }
 class Popup {setLngLat(){return this}setDOMContent(n){this.content=n;return this}addTo(){return this}remove(){}}
 w.maplibregl={Map:M,Popup,Marker,NavigationControl:class{},supported:()=>true};
 w.fetch=async(url)=>({ok:true,json:async()=>String(url).includes("eia-2021")?eia:registry});
 w.eval(js);w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
 await new Promise(resolve=>setTimeout(resolve,20));
 const data=()=>instances[0].getSource("borneo-points")._data.features;
 const click=(category)=>w.document.querySelector('[data-category="'+category+'"]').click();
 assert.equal(instances.length,1);assert.equal(data().length,15);
 assert.equal(w.__BORNEO_V2_QA().stationCount,15);
 assert.equal(w.__BORNEO_V2_QA().historicalEiaPointCount,10);
 assert.equal(instances[0].getSource("borneo-kuts-eia21")._data.features.length,10);
 assert.ok(instances[0].getLayer("borneo-kuts-eia21-circles"));
 assert.equal(w.document.querySelector(".art-map-diagram .art-diagram-route-title")?.textContent.includes("Blue"),true);
 assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,1);
 assert.equal(w.__BORNEO_V2_QA().artStationGPSCount,0);
 assert.equal(w.document.querySelectorAll(".borneo-art-locator").length,1);
 assert.equal(w.document.querySelectorAll(".art-line-chip").length,0);
 assert.equal(w.document.querySelector(".borneo-art-locator").dataset.mapObject,"KUCHING_CITY_REFERENCE_NOT_STATION");
 click("SARAWAK");assert.equal(data().length,0);assert.equal(w.document.querySelectorAll(".art-diagram-stop").length,14);assert.equal(w.__BORNEO_V2_QA().historicalEiaPointCount,10);assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,1);assert.equal(w.document.querySelectorAll(".schematic-line").length,3);assert.equal(w.__BORNEO_V2_QA().category,"SARAWAK");
 assert.match(w.document.getElementById("summary").textContent,/Skematik/);
 click("BLUE");assert.equal(data().length,0);assert.equal(w.document.querySelectorAll(".art-diagram-stop").length,8);assert.equal(w.__BORNEO_V2_QA().historicalEiaPointCount,7);assert.equal(w.document.querySelectorAll(".art-diagram-route-title").length,1);assert.equal(w.document.querySelectorAll(".schematic-line").length,1);
 click("GREEN");assert.equal(data().length,0);assert.equal(w.__BORNEO_V2_QA().historicalEiaPointCount,0);assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,1);assert.match(w.document.getElementById("lineup").textContent,/Pending/);
 click("SABAH");assert.equal(data().length,15);assert.equal(w.__BORNEO_V2_QA().historicalEiaPointCount,0);assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,0);
 const search=w.document.getElementById("search");search.value="Tenom";search.dispatchEvent(new w.Event("input",{bubbles:true}));assert.equal(data().length,1);assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,0);
 w.document.getElementById("reset").click();assert.equal(data().length,15);assert.equal(search.value,"");assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,1);
 w.document.querySelector('[data-id="SSR-15"]').click();assert.ok(w.document.querySelector('[data-id="SSR-15"][aria-current="true"]'));
 const lng=w.document.getElementById("language");for(const l of ["en","zh","th","ms"]){lng.value=l;lng.dispatchEvent(new w.Event("change",{bubbles:true}));assert.equal(w.document.documentElement.lang,l)}
 w.document.getElementById("theme").click();assert.equal(w.document.documentElement.dataset.theme,"dark");
 click("ALL");w.document.querySelector(".art-diagram-toggle").click();
 assert.equal(w.document.querySelectorAll(".art-diagram-stop").length,14);
 click("SARAWAK");
  const buttons=[...w.document.querySelectorAll(".art-diagram-route-title")];
  const red=buttons.find(x=>x.textContent.includes("Red"));assert.ok(red);
  red.click();
 assert.equal(w.__BORNEO_V2_QA().category,"RED");
 assert.equal(w.__BORNEO_V2_QA().artRegionalLocatorCount,1);
 assert.equal(w.document.querySelectorAll(".art-diagram-route-title").length,1);
 click("ALL");
 const h=instances[0].handlers["click:borneo-stations"];assert.equal(typeof h,"function");
 h({features:[{properties:{id:"SSR-10"}}]});assert.ok(w.document.querySelector('[data-id="SSR-10"][aria-current="true"]'));
 dom.window.close();
});
