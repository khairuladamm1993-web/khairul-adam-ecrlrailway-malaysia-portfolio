'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'ktm-komuter-v2.html'),'utf8');
test('selected category always refocuses after official GTFS and secondary GIS finish',()=>{
 const wanted='focusSelectedRoute();';
 a(html.includes('function focusSelectedRoute(){'));
 a.match(html,/function selectRoute\(id\)[\s\S]*?focusSelectedRoute\(\)/);
 a.match(html,/decoded=api\.mergeOfficialGis\(null,official\);[\s\S]*?focusSelectedRoute\(\)/);
 a.match(html,/decoded=api\.mergeOfficialGis\([\s\S]*?\n updateLayers\(\);\n statusMessage\(\);\n focusSelectedRoute\(\);/);
 a.match(html,/map\.on\('style\.load',\(\)=>\{styleReady=true;baseLabelDefaults\.clear\(\);localizeBaseMap\(\);updateLayers\(\);focusSelectedRoute\(\);\}\)/);
 a(html.split(wanted).length>=5);
});
test('map never invents coordinates for missing stations',()=>{
 a.match(html,/const f=chooseFeatures\(\)\.features/);
 a.match(html,/if\(!f\.length\)return false/);
 a.match(html,/map\.fitBounds/);
 a.match(html,/map\.flyTo/);
 a.doesNotMatch(html,/fakeCoordinates|interpolatedTrack|inventedLineString/);
});
test('GTFS source and color coded public-only security controls remain intact',()=>{
 a.match(html,/mrs10-r225-ktm-gtfs-stations\.json/);
 a.match(html,/noindex,nofollow/);
 a.doesNotMatch(html,/supabase|member-gateway|service_role|sk_live/i);
 a.match(html,/circle-color':r\.displayColor/);
});
