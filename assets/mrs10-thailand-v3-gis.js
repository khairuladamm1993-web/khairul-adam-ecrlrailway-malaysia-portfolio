/* MR-S10 Thailand V3 GIS gates. Points and lines ONLY from explicit sources.
 * OSM rail ways in viewport are NOT assumed to belong to an SRT passenger route.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MRS10ThailandV3GIS=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';const license='https://www.openstreetmap.org/copyright';
function stationFeature(s){if(!s?.point)return null;const p=s.point;
 if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<97||p[0]>106||p[1]<5||p[1]>21)return null;
 return {type:'Feature',id:s.id,geometry:{type:'Point',coordinates:p.slice()},properties:{id:s.id,name:s.nameEn,country:s.country,sourceId:s.sourceStationIds.osm,
 sourceUrl:s.coordinateSource?.sourceUrl||null,provenance:'OSM_CROSSCHECK',confidence:s.coordinateSource?.confidence||'UNVERIFIED',license}};}
function points(model){return {type:'FeatureCollection',features:model.stations.map(stationFeature).filter(Boolean)};}
function normalizeName(s){return String(s||'').toLocaleLowerCase().normalize('NFKC').replace(/\s+/g,' ').replace(/[().]/g,'').trim();}
function sourceMatch(feature,model){const t=feature?.tags||{};const opts=[t.name,t['name:en'],t['name:th'],t.official_name].filter(Boolean).map(normalizeName);
 const lat=feature?.lat??feature?.center?.lat,lon=feature?.lon??feature?.center?.lon;
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<5||lat>21||lon<97||lon>106||!opts.length)return null;
 const candidates=model.stations.filter(s=>[s.nameEn,s.nameTh].filter(Boolean).map(normalizeName).some(n=>opts.includes(n)));
 if(candidates.length!==1)return null;const s=candidates[0];
 if((s.country==='MY' && !(lat<6.6655&&lon<100.323))||(s.country==='TH'&&lat<6.664&&lon<100.323&&s.id==='th-th-padang-besar'))return null;
 if(s.point){const deg=Math.hypot(s.point[0]-lon,s.point[1]-lat);if(deg>.008)return null;}
 return {...stationFeature({...s,point:[lon,lat],coordinateSource:{sourceUrl:'https://www.openstreetmap.org/'+feature.type+'/'+feature.id,confidence:'OSM_MATCHED_NOT_OPERATOR_CERTIFIED'},sourceStationIds:{...s.sourceStationIds,osm:feature.type+'/'+feature.id}}),properties:{...stationFeature({...s,point:[lon,lat]}).properties,sourceId:feature.type+'/'+feature.id,sourceUrl:'https://www.openstreetmap.org/'+feature.type+'/'+feature.id,provenance:'LIVE_OSM_MATCH',confidence:'OSM_MATCHED_NOT_OPERATOR_CERTIFIED'}};
}
function mergePoints(base,more){const byId=new Map(base.features.map(f=>[f.properties.id,f]));for(const f of more){if(f?.geometry?.type==='Point'&&f.properties?.id)byId.set(f.properties.id,f);}return {type:'FeatureCollection',features:[...byId.values()]};}
function bboxValid(b){return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[0]>5&&b[2]<21&&b[1]>97&&b[3]<106&&b[0]<b[2]&&b[1]<b[3]&&(b[2]-b[0])<=.23&&(b[3]-b[1])<=.27;}
function railwayWays(elements,b){if(!bboxValid(b))return {type:'FeatureCollection',features:[]};const out=[],seen=new Set();
 for(const w of elements||[]){if(out.length>=220)break;if(w.type!=='way'||w.tags?.railway!=='rail'||!Array.isArray(w.geometry)||seen.has(w.id))continue;
 const p=w.geometry.map(g=>[g.lon,g.lat]);if(p.length<2||p.length>600||p.some(x=>!Number.isFinite(x[0])||!Number.isFinite(x[1])||x[0]<97||x[0]>106||x[1]<5||x[1]>21))continue;
 seen.add(w.id);out.push({type:'Feature',id:'osm-way-'+w.id,geometry:{type:'LineString',coordinates:p},properties:{source:'OpenStreetMap',sourceId:'way/'+w.id,sourceUrl:'https://www.openstreetmap.org/way/'+w.id,
 retrievedDate:new Date().toISOString().slice(0,10),geometryType:'LineString',validationMethod:'OSM_WAY_GEOMETRY_AND_BBOX',license:'ODbL',confidence:'OSM_PHYSICAL_WAY_ONLY',reviewStatus:'ROUTE_RELATION_UNVERIFIED',serviceRouteId:null}});}
 return {type:'FeatureCollection',features:out};}
function pointBounds(collection,ids){const valid=collection.features.filter(f=>ids.includes(f.properties?.id)).map(f=>f.geometry.coordinates);if(valid.length<2)return null;
 const xs=valid.map(p=>p[0]),ys=valid.map(p=>p[1]);return [[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]];}
return Object.freeze({stationFeature,points,sourceMatch,mergePoints,bboxValid,railwayWays,pointBounds,license});
});
