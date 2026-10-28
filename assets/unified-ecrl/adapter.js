/* Infrastructure only. Never appended to the passenger service manifest. */
(function(root){'use strict';
const NS='mrs10-v8-ecrl-infra',COLORS={LOCALITY:'#0f8b8d',HISTORICAL:'#c76a1b',MARITIME:'#7c3aed'};
function create(registry,translations){
 const chainage=(root&&root.MRS10ECRLChainage)||(typeof require==='function'?require('./chainage-manifest.js'):null);
 const portCatalogue=(root&&root.MRS10ECRLPortReferences)||(typeof require==='function'?require('./port-references.js'):null);
 if(!portCatalogue||portCatalogue.assets.length!==2)throw Error('ECRL_PORT_CATALOGUE_MISSING');
 if(!chainage||chainage.records.length!==23)throw Error('ECRL_CHAINAGE_MANIFEST_MISSING');
 const annotate=a=>{const c=chainage.get(a.assetId);return Object.freeze({...a,chainageCode:c?.code||null,plCode:c?.code?.startsWith('PL')?c.code:null,chainageKm:c?.km??null,chainageLabel:c?.label||null,chainageDatum:c?.datum||null,chainageStatus:c?.status||'UNKNOWN',chainageProvenance:c?.provenance||null})};
 // Owner-accepted ECRL station designations. STN10 is absent; assetId is an immutable ordinal key.
const CORRIDOR_STATION_CODES=Object.freeze({
 'Kota Bharu':'STN01','Pasir Puteh':'STN02','Jerteh':'STN03','Bandar Permaisuri':'STN04',
 'Kuala Terengganu':'STN05','Dungun':'STN06','Kemasik':'STN07','Chukai':'STN08','Cherating':'STN09',
 'Kuantan Port City':'STN11','Kota SAS':'STN12','Paya Besar':'STN13','Maran':'STN14',
 'Temerloh':'STN15','Bentong':'STN16','ITT Gombak':'STN17'
});
const stations=registry.stations.map(a=>{
 const stationCode=CORRIDOR_STATION_CODES[a.officialName]||null;
 if(a.section!=='C2'&&!stationCode)throw Error('ECRL_MISSING_ACCEPTED_STATION_CODE:'+a.officialName);
 return annotate({...a,stationCode});
});
const knownCodes=stations.filter(a=>a.stationCode).map(a=>a.stationCode);
if(knownCodes.length!==16||new Set(knownCodes).size!==16||stations.some(a=>a.section==='C2'&&a.stationCode))throw Error('ECRL_STATION_CODE_MANIFEST_MISMATCH');
const loops=registry.loops.map(annotate);
 if(loops.length!==7||loops.some((a,i)=>a.plCode!=='PL'+String(i+1).padStart(2,'0')))throw Error('ECRL_PL_MANIFEST_MISMATCH');
 const assets=[...stations,...loops,...registry.facilities,...portCatalogue.assets];
 const enhancedRegistry={...registry,sources:Object.freeze({...registry.sources,...portCatalogue.sources}),topology:registry.topology,portLogicalInterfaces:portCatalogue.logicalInterfaces};
 if(new Set(assets.map(a=>a.assetId)).size!==assets.length)throw Error('ECRL_DUPLICATE_ID');
 const flags={LOCALITY:false,HISTORICAL:false,MARITIME:false};
 function references(){return assets.flatMap(a=>{
  if(a.assetType==='STATION'&&a.geometryType==='LOCALITY_REFERENCE_POINT'&&a.point)return [{assetId:a.assetId,kind:'LOCALITY',coordinates:[...a.point],sourceId:a.sourceId}];
  if(a.referencePoint&&a.referenceKind==='HISTORICAL_EIA2017_PROPOSED_STATION')return [{assetId:a.assetId,kind:'HISTORICAL',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  if(a.referencePoint&&['PORT_FACILITY_AREA_PKA22','PUBLIC_OFFICIAL_PORT_AREA_ONLY'].includes(a.referenceKind))return [{assetId:a.assetId,kind:'MARITIME',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  return [];
 })}
 const refs=references(),get=id=>assets.find(a=>a.assetId===id),reference=id=>refs.find(r=>r.assetId===id);
 const t=(locale,key)=>translations[locale]?.[key]||translations.en[key]||key;
 function features(){return {type:'FeatureCollection',features:refs.map(r=>({type:'Feature',id:r.assetId,geometry:{type:'Point',coordinates:r.coordinates},properties:{assetId:r.assetId,stationCode:get(r.assetId)?.stationCode||null,kind:r.kind,color:COLORS[r.kind],geometryVerification:'REFERENCE_ONLY',sourceId:r.sourceId,operationalStatus:'NOT_OPERATIONAL'}}))}}
 function setVisibility(map,category,mode='NORMAL'){
  if(!map?.getLayer(NS+'-hit'))return;
  const allowed=(mode==='NORMAL'&&(category==='All'||category==='ECRL'))||mode==='INFRASTRUCTURE_FOCUS';
  const kinds=allowed?Object.keys(flags).filter(k=>flags[k]):[];
  for(const suffix of ['-hit','-ring','-inner']){map.setLayoutProperty(NS+suffix,'visibility',kinds.length?'visible':'none');map.setFilter(NS+suffix,['in',['get','kind'],['literal',kinds]])}
 }
 function install(map){
  // The host has passed its style gate; other GeoJSON sources may now be loading.
  if(!map?.getStyle())return;
  if(!map.getSource(NS))map.addSource(NS,{type:'geojson',data:features()});
  if(!map.getLayer(NS+'-hit'))map.addLayer({id:NS+'-hit',type:'circle',source:NS,paint:{'circle-radius':14,'circle-opacity':0}});
  for(const [kind,color] of Object.entries(COLORS))if(!map.hasImage(NS+'-'+kind)){
   const c=document.createElement('canvas');c.width=c.height=44;const x=c.getContext('2d');x.lineWidth=3;x.strokeStyle=color;x.fillStyle='white';x.setLineDash([5,4]);x.beginPath();x.arc(22,22,15,0,Math.PI*2);x.fill();x.stroke();map.addImage(NS+'-'+kind,x.getImageData(0,0,44,44));
  }
  if(!map.getLayer(NS+'-ring'))map.addLayer({id:NS+'-ring',type:'symbol',source:NS,layout:{'icon-image':['concat',NS+'-',['get','kind']],'icon-size':0.65,'icon-allow-overlap':true,'icon-ignore-placement':true}});
  if(!map.getLayer(NS+'-inner'))map.addLayer({id:NS+'-inner',type:'circle',source:NS,paint:{'circle-radius':2.5,'circle-color':['get','color']}});
 }
 function hit(map,point){if(!map?.getLayer(NS+'-hit')||map.getLayoutProperty(NS+'-hit','visibility')==='none')return null;return refs.filter(r=>flags[r.kind]).map(r=>{const p=map.project(r.coordinates);return {...r,distance:Math.hypot(p.x-point.x,p.y-point.y)}}).filter(r=>r.distance<=14).sort((a,b)=>a.distance-b.distance)[0]||null}
 function search(q){const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');const text=norm(q);if(!text)return [];if(/^stn\d{1,2}$/.test(text))return stations.filter(a=>norm(a.stationCode)===text);if(/^pl0?[1-7]$/.test(text))return loops.filter(a=>norm(a.plCode)===text||norm(a.plCode)===text.replace(/^pl([1-7])$/,'pl0$1'));return assets.filter(a=>norm(['ECRL',a.officialName,a.historicalName,a.assetId,a.section,a.stationCode,a.plCode,a.chainageLabel,...(a.alternativeNames||[])].join(' ')).includes(text))}
 function snapshot(map){return {assetCount:assets.length,stationCount:registry.stations.length,referenceCount:refs.length,referenceKinds:Object.fromEntries(Object.keys(flags).map(k=>[k,refs.filter(r=>r.kind===k).length])),flags:{...flags},verifiedStationPoints:0,verifiedLoopPoints:0,physicalSegments:0,sourcePresent:!!map?.getSource(NS),layersPresent:!!map?.getLayer(NS+'-inner'),visible:!!map?.getLayer(NS+'-hit')&&map.getLayoutProperty(NS+'-hit','visibility')!=='none'}}
 return Object.freeze({namespace:NS,assets,stations,loops,chainage,registry:enhancedRegistry,portCatalogue,flags,refs,get,reference,t,features,install,setVisibility,hit,search,snapshot});
}
const api={create,NS};if(typeof module==='object')module.exports=api;if(root)root.MRS10UnifiedECRL=api;
})(typeof window!=='undefined'?window:null);
