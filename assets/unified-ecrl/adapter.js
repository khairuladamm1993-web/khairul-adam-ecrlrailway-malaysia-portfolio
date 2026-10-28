/* Infrastructure only. Never appended to the passenger service manifest. */
(function(root){'use strict';
const NS='mrs10-v8-ecrl-infra',COLORS={LOCALITY:'#0f8b8d',HISTORICAL:'#c76a1b',MARITIME:'#7c3aed'};
function create(registry,translations){
 const assets=[...registry.stations,...registry.loops,...registry.facilities];
 if(new Set(assets.map(a=>a.assetId)).size!==assets.length)throw Error('ECRL_DUPLICATE_ID');
 const flags={LOCALITY:false,HISTORICAL:false,MARITIME:false};
 function references(){return assets.flatMap(a=>{
  if(a.assetType==='STATION'&&a.geometryType==='LOCALITY_REFERENCE_POINT'&&a.point)return [{assetId:a.assetId,kind:'LOCALITY',coordinates:[...a.point],sourceId:a.sourceId}];
  if(a.referencePoint&&a.referenceKind==='HISTORICAL_EIA2017_PROPOSED_STATION')return [{assetId:a.assetId,kind:'HISTORICAL',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  if(a.referencePoint&&a.referenceKind==='PORT_FACILITY_AREA_PKA22')return [{assetId:a.assetId,kind:'MARITIME',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  return [];
 })}
 const refs=references(),get=id=>assets.find(a=>a.assetId===id),reference=id=>refs.find(r=>r.assetId===id);
 const t=(locale,key)=>translations[locale]?.[key]||translations.en[key]||key;
 function features(){return {type:'FeatureCollection',features:refs.map(r=>({type:'Feature',id:r.assetId,geometry:{type:'Point',coordinates:r.coordinates},properties:{assetId:r.assetId,kind:r.kind,color:COLORS[r.kind],geometryVerification:'REFERENCE_ONLY',sourceId:r.sourceId,operationalStatus:'NOT_OPERATIONAL'}}))}}
 function setVisibility(map,category,mode='NORMAL'){
  if(!map?.getLayer(NS+'-hit'))return;
  const allowed=(mode==='NORMAL'&&(category==='All'||category==='ECRL'))||mode==='INFRASTRUCTURE_FOCUS';
  const kinds=allowed?Object.keys(flags).filter(k=>flags[k]):[];
  for(const suffix of ['-hit','-ring','-inner']){map.setLayoutProperty(NS+suffix,'visibility',kinds.length?'visible':'none');map.setFilter(NS+suffix,['in',['get','kind'],['literal',kinds]])}
 }
 function install(map){
  if(!map?.isStyleLoaded())return;
  if(!map.getSource(NS))map.addSource(NS,{type:'geojson',data:features()});
  if(!map.getLayer(NS+'-hit'))map.addLayer({id:NS+'-hit',type:'circle',source:NS,paint:{'circle-radius':14,'circle-opacity':0}});
  for(const [kind,color] of Object.entries(COLORS))if(!map.hasImage(NS+'-'+kind)){
   const c=document.createElement('canvas');c.width=c.height=44;const x=c.getContext('2d');x.lineWidth=3;x.strokeStyle=color;x.fillStyle='white';x.setLineDash([5,4]);x.beginPath();x.arc(22,22,15,0,Math.PI*2);x.fill();x.stroke();map.addImage(NS+'-'+kind,x.getImageData(0,0,44,44));
  }
  if(!map.getLayer(NS+'-ring'))map.addLayer({id:NS+'-ring',type:'symbol',source:NS,layout:{'icon-image':['concat',NS+'-',['get','kind']],'icon-size':0.65,'icon-allow-overlap':true,'icon-ignore-placement':true}});
  if(!map.getLayer(NS+'-inner'))map.addLayer({id:NS+'-inner',type:'circle',source:NS,paint:{'circle-radius':2.5,'circle-color':['get','color']}});
 }
 function hit(map,point){if(!map?.getLayer(NS+'-hit')||map.getLayoutProperty(NS+'-hit','visibility')==='none')return null;return refs.filter(r=>flags[r.kind]).map(r=>{const p=map.project(r.coordinates);return {...r,distance:Math.hypot(p.x-point.x,p.y-point.y)}}).filter(r=>r.distance<=14).sort((a,b)=>a.distance-b.distance)[0]||null}
 function search(q){const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,'');const text=norm(q);return text?assets.filter(a=>norm(['ECRL',a.officialName,a.historicalName,a.assetId,a.section,...(a.alternativeNames||[])].join(' ')).includes(text)):[]}
 function snapshot(map){return {assetCount:assets.length,stationCount:registry.stations.length,referenceCount:refs.length,referenceKinds:Object.fromEntries(Object.keys(flags).map(k=>[k,refs.filter(r=>r.kind===k).length])),flags:{...flags},verifiedStationPoints:0,verifiedLoopPoints:0,physicalSegments:0,sourcePresent:!!map?.getSource(NS),layersPresent:!!map?.getLayer(NS+'-inner'),visible:!!map?.getLayer(NS+'-hit')&&map.getLayoutProperty(NS+'-hit','visibility')!=='none'}}
 return Object.freeze({namespace:NS,assets,stations:registry.stations,registry,flags,refs,get,reference,t,features,install,setVisibility,hit,search,snapshot});
}
const api={create,NS};if(typeof module==='object')module.exports=api;if(root)root.MRS10UnifiedECRL=api;
})(typeof window!=='undefined'?window:null);
