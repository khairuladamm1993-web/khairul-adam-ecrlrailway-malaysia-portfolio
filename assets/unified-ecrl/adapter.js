/* Infrastructure only. Never appended to the passenger service manifest. */
(function(root){'use strict';
const NS='mrs10-v8-ecrl-infra',COLORS={LOCALITY:'#0f8b8d',HISTORICAL:'#c76a1b',MARITIME:'#7c3aed',YARD:'#b57925'};
const DETAIL_ZOOM=Object.freeze({PL:9,DEPOT:12});
const detailLevel=zoom=>zoom>=DETAIL_ZOOM.DEPOT?'near':zoom>=DETAIL_ZOOM.PL?'mid':'far';
const codedStation=['!=',['to-string',['get','stationCode']],''];
function trainImage(map,id){
 if(map.hasImage(id))return;
 const canvas=document.createElement('canvas');canvas.width=68;canvas.height=68;
 const ctx=canvas.getContext('2d');ctx.scale(68/24,68/24);
 ctx.fillStyle='#1457a6';ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.roundRect(3.5,2.5,17,17,4);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffffff';ctx.fillRect(7,6,10,6);
 for(const x of [8,16]){ctx.beginPath();ctx.arc(x,15.5,1.2,0,2*Math.PI);ctx.fill()}
 ctx.strokeStyle='#1457a6';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(8,19);ctx.lineTo(6,22);ctx.moveTo(16,19);ctx.lineTo(18,22);ctx.stroke();
 map.addImage(id,ctx.getImageData(0,0,68,68),{pixelRatio:2});
}
function labelImage(map,id,text){
 if(map.hasImage(id))return;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const font='bold 12px sans-serif';
 ctx.font=font;
 const width=Math.ceil(ctx.measureText(text).width)+14,height=22;
 canvas.width=width*2;canvas.height=height*2;
 ctx.scale(2,2);ctx.font=font;
 ctx.fillStyle='#16457b';ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='#ffffff';ctx.strokeRect(.5,.5,width-1,height-1);
 ctx.fillStyle='#ffffff';ctx.textBaseline='middle';ctx.fillText(text,7,height/2);
 map.addImage(id,ctx.getImageData(0,0,canvas.width,canvas.height),{pixelRatio:2});
}
function create(registry,translations){
 const chainage=(root&&root.MRS10ECRLChainage)||(typeof require==='function'?require('./chainage-manifest.js'):null);
 const portCatalogue=(root&&root.MRS10ECRLPortReferences)||(typeof require==='function'?require('./port-references.js'):null);
 if(!portCatalogue||portCatalogue.assets.length!==2)throw Error('ECRL_PORT_CATALOGUE_MISSING');
 const kerteh=(root&&root.MRS10ECRLKertehFreight)||(typeof require==='function'?require('./kerteh-freight-reference.js'):null);
 if(!kerteh||kerteh.assets.length!==2)throw Error('ECRL_KERTEH_FREIGHT_REFERENCE_MISSING');
 if(!chainage||chainage.records.length!==23)throw Error('ECRL_CHAINAGE_MANIFEST_MISSING');
 const alignmentEvidence=(root&&root.MRS10ECRLAlignmentEvidence)||(typeof require==='function'?require('./alignment-evidence-r2.js'):null);
 if(!alignmentEvidence||alignmentEvidence.passingLoops.length!==7||alignmentEvidence.spurs.length!==7)throw Error('ECRL_ALIGNMENT_EVIDENCE_MISSING');
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
 const assets=[...stations,...loops,...registry.facilities,...portCatalogue.assets,...kerteh.assets];
 const enhancedRegistry={...registry,sources:Object.freeze({...registry.sources,...portCatalogue.sources,...kerteh.sources}),topology:Object.freeze([...registry.topology,...kerteh.logicalInterfaces]),portLogicalInterfaces:portCatalogue.logicalInterfaces,kertehLogicalInterfaces:kerteh.logicalInterfaces};
 if(new Set(assets.map(a=>a.assetId)).size!==assets.length)throw Error('ECRL_DUPLICATE_ID');
 const flags={LOCALITY:true,HISTORICAL:true,MARITIME:true,YARD:true};
 function references(){return assets.flatMap(a=>{
  if(a.assetType==='STATION'&&a.geometryType==='LOCALITY_REFERENCE_POINT'&&a.point)return [{assetId:a.assetId,kind:'LOCALITY',coordinates:[...a.point],sourceId:a.sourceId}];
  if(a.referencePoint&&a.referenceKind==='HISTORICAL_EIA2017_PROPOSED_STATION')return [{assetId:a.assetId,kind:'HISTORICAL',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  if(a.referencePoint&&['PORT_FACILITY_AREA_PKA22','PUBLIC_OFFICIAL_PORT_AREA_ONLY'].includes(a.referenceKind))return [{assetId:a.assetId,kind:'MARITIME',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  if(a.referencePoint&&a.referenceKind==='OSM_HISTORICAL_RAILWAY_LANDUSE_AREA')return [{assetId:a.assetId,kind:'YARD',coordinates:[...a.referencePoint],sourceId:a.referenceSourceId}];
  return [];
 })}
 const refs=references(),get=id=>assets.find(a=>a.assetId===id),reference=id=>refs.find(r=>r.assetId===id);
 const t=(locale,key)=>translations[locale]?.[key]||translations.en[key]||key;
 function features(){return {type:'FeatureCollection',features:refs.map(r=>({type:'Feature',id:r.assetId,geometry:{type:'Point',coordinates:r.coordinates},properties:{assetId:r.assetId,stationCode:get(r.assetId)?.stationCode||null,kind:r.kind,color:COLORS[r.kind],geometryVerification:'REFERENCE_ONLY',sourceId:r.sourceId,operationalStatus:'NOT_OPERATIONAL'}}))}}
 function setVisibility(map,category,mode='NORMAL'){
  if(!map?.getLayer(NS+'-hit'))return;
  const allowed=(mode==='NORMAL'&&(category==='All'||category==='MRS10'||category==='Malaysia'||category==='ECRL'))||mode==='INFRASTRUCTURE_FOCUS';
  const kinds=allowed?Object.keys(flags).filter(k=>flags[k]):[];
  for(const suffix of ['-hit','-ring','-inner','-station-marker','-station-label']){
   const kindFilter=['in',['get','kind'],['literal',kinds]];
   const filter=suffix.startsWith('-station-')?['all',kindFilter,codedStation]:['all',kindFilter,['!',codedStation]];
   map.setLayoutProperty(NS+suffix,'visibility',kinds.length?'visible':'none');map.setFilter(NS+suffix,filter);
  }
 }
 function install(map){
  // The host has passed its style gate; other GeoJSON sources may now be loading.
  if(!map?.getStyle())return;
  if(!map.getSource(NS))map.addSource(NS,{type:'geojson',data:features()});
  if(!map.getLayer(NS+'-hit'))map.addLayer({id:NS+'-hit',type:'circle',source:NS,paint:{'circle-radius':14,'circle-opacity':0}});
  for(const [kind,color] of Object.entries(COLORS))if(!map.hasImage(NS+'-'+kind)){
   const c=document.createElement('canvas');c.width=c.height=44;const x=c.getContext('2d');x.lineWidth=3;x.strokeStyle=color;x.fillStyle='white';x.setLineDash([5,4]);x.beginPath();if(kind==='YARD')x.rect(7,7,30,30);else x.arc(22,22,15,0,Math.PI*2);x.fill();x.stroke();map.addImage(NS+'-'+kind,x.getImageData(0,0,44,44));
  }
  if(!map.getLayer(NS+'-ring'))map.addLayer({id:NS+'-ring',type:'symbol',source:NS,layout:{'icon-image':['concat',NS+'-',['get','kind']],'icon-size':0.65,'icon-allow-overlap':true,'icon-ignore-placement':true}});
  if(!map.getLayer(NS+'-inner'))map.addLayer({id:NS+'-inner',type:'circle',source:NS,paint:{'circle-radius':2.5,'circle-color':['get','color']}});
  if(!map.getLayer(NS+'-station-marker')){
   trainImage(map,NS+'-train');
   map.addLayer({id:NS+'-station-marker',type:'symbol',source:NS,filter:codedStation,layout:{
    'icon-image':NS+'-train','icon-size':['step',['zoom'],0.62,8,0.82,12,1],'icon-padding':['step',['zoom'],4,12,2]
   }});
  }
  if(!map.getLayer(NS+'-station-label')){
   for(const station of stations.filter(asset=>asset.stationCode)){
    labelImage(map,NS+'-code-'+station.stationCode,station.stationCode);
    labelImage(map,NS+'-name-'+station.stationCode,station.stationCode+' · '+station.officialName);
   }
   map.addLayer({id:NS+'-station-label',type:'symbol',source:NS,filter:codedStation,minzoom:9,layout:{
    'icon-image':['step',['zoom'],['concat',NS+'-code-',['get','stationCode']],14,['concat',NS+'-name-',['get','stationCode']]],
    'icon-anchor':'bottom','icon-offset':[0,-19],'icon-padding':2
   }},NS+'-station-marker');
  }
 }
 function hit(map,point){
  if(!map?.getLayer(NS+'-hit')||map.getLayoutProperty(NS+'-hit','visibility')==='none')return null;
  const rect=[[point.x-5,point.y-5],[point.x+5,point.y+5]];
  const visibleStations=new Set(map.queryRenderedFeatures(rect,{layers:[NS+'-station-marker',NS+'-station-label']}).map(f=>f.properties.assetId));
  return refs.filter(r=>flags[r.kind]&&(r.kind!=='LOCALITY'||visibleStations.has(r.assetId))).map(r=>{
   const p=map.project(r.coordinates);
   return {...r,distance:Math.hypot(p.x-point.x,p.y-point.y)};
  }).filter(r=>r.distance<=14||(r.kind==='LOCALITY'&&visibleStations.has(r.assetId))).sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 function search(q){const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');const text=norm(q);if(!text)return [];if(/^stn\d{1,2}$/.test(text))return stations.filter(a=>norm(a.stationCode)===text);if(/^pl0?[1-7]$/.test(text))return loops.filter(a=>norm(a.plCode)===text||norm(a.plCode)===text.replace(/^pl([1-7])$/,'pl0$1'));return assets.filter(a=>norm(['ECRL',a.officialName,a.historicalName,a.assetId,a.section,a.stationCode,a.plCode,a.chainageLabel,a.assetId==='ecrl-depot-gombak-north'?'GNU EMU Depot':'',...(a.alternativeNames||[])].join(' ')).includes(text))}
 function snapshot(map){return {assetCount:assets.length,stationCount:registry.stations.length,referenceCount:refs.length,referenceKinds:Object.fromEntries(Object.keys(flags).map(k=>[k,refs.filter(r=>r.kind===k).length])),flags:{...flags},verifiedStationPoints:0,verifiedLoopPoints:0,physicalSegments:0,sourcePresent:!!map?.getSource(NS),layersPresent:!!map?.getLayer(NS+'-inner'),visible:!!map?.getLayer(NS+'-hit')&&map.getLayoutProperty(NS+'-hit','visibility')!=='none'}}
 return Object.freeze({namespace:NS,assets,stations,loops,chainage,registry:enhancedRegistry,portCatalogue,kerteh,alignmentEvidence,flags,refs,get,reference,t,features,install,setVisibility,hit,search,snapshot});
}
const api={create,NS,DETAIL_ZOOM,detailLevel};if(typeof module==='object')module.exports=api;if(root)root.MRS10UnifiedECRL=api;
})(typeof window!=='undefined'?window:null);
