/* Shared navigation and read-only ECRL context for the P01 map surfaces. */
(function(root){
 'use strict';
 const routes=Object.freeze({
  gateway:'gateway.html#map',
  malaysia:'unified-map-v7.html',
  global:'map-language-lab.html?railPilot=1',
  ecrl:'ecrl-asset-reference.html',
  ampang:'ampang-line-r219.html',
  member:'unified-map-v8.html'
 });
 const sectionDGauges=Object.freeze({ecrl:1435,ktmb:1000});
 const assetIdPattern=/^ecrl-[a-z0-9-]+$/;
 function readAssetId(search){
  const values=new URLSearchParams(search).getAll('asset');
  return values.length===1&&assetIdPattern.test(values[0])?values[0]:null;
 }
 function assetHref(route,assetId){
  const [path,anchor]=routes[route].split('#');
  if(!assetId)return path+(anchor?'#'+anchor:'');
  return path+(path.includes('?')?'&':'?')+new URLSearchParams({asset:assetId})+(anchor?'#'+anchor:'');
 }
 const heldPassingLoopPlacements=new Set(['PL02','PL03','PL04','PL05']);
 function isPassingLoopPlacementHeld(asset){
  return asset.type==='PL'&&heldPassingLoopPlacements.has(asset.code);
 }
 function createEcrlContext(deps=root){
  const adapter=deps.MRS10UnifiedECRL.create(deps.MRS10ECRLGISV1,deps.MRS10ECRLI18N);
  const master=deps.MRS10ECRLMasterIntelligence.create(adapter);
  const dataContract=deps.MRS10RailwayDataContractV1.create(adapter,master);
  return {adapter,master,dataContract};
 }
 function publicAssetIdentity(dataContract,adapter){
  const main=dataContract.records.map(({assetId,type,code,name,section})=>({assetId,type,code,name,section}));
  const stations=adapter.stations.filter(asset=>asset.section==='C2');
  const yard=adapter.get('ecrl-yard-puncak-alam');
  if(stations.length!==4||stations.some(asset=>asset.stationCode||asset.point)||
    yard?.section!=='C2'||yard.assetType!=='FREIGHT_YARD'||yard.assetStatus!=='PROPOSED_OFFICIAL'||yard.point)
   throw Error('P01_PUBLIC_C2_REFERENCE_INVENTORY');
  const references=stations.map(({assetId,officialName:name,section})=>({assetId,type:'STN',code:null,name,section}));
  references.push({assetId:yard.assetId,type:'YARD',code:null,name:yard.officialName,section:yard.section});
  const scheme=adapter.registry.segments.find(record=>record.segmentId==='ecrl-d-port-access');
  if(!scheme||scheme.trackGaugeMm!==sectionDGauges.ecrl||scheme.ktmbMetreGaugeMm!==sectionDGauges.ktmb||
    scheme.trackArrangement!=='SEPARATE_PARALLEL_STANDARD_AND_METRE_GAUGE'||scheme.geometry!==null)
   throw Error('P01_PUBLIC_D_SCHEME_MISMATCH');
  const ports=['ecrl-port-northport','ecrl-port-westports'].map(assetId=>{
   const asset=adapter.get(assetId);
   if(asset?.section!=='D'||asset.assetType!=='PORT_INTERFACE'||asset.assetStatus!=='PLANNED_CONNECTION'||
     asset.verificationStatus!=='PARTIAL'||asset.point!==null||asset.referenceKind!=='PORT_FACILITY_AREA_PKA22'||asset.referenceSourceId!=='PKA22')
    throw Error('P01_PUBLIC_D_PORT_REFERENCE:'+assetId);
   return {assetId,type:'PORT',code:null,name:asset.officialName,section:asset.section};
  });
  return [...main,...references,...ports];
 }
 function publicStationReferences(records,localities){
  return records.filter(asset=>asset.type==='STN'&&asset.section!=='C2').flatMap(asset=>{
   const matches=localities.filter(row=>row.type==='STN'&&row.name===asset.name&&row.locationConfidence==='Public Reference Location');
   if(matches.length!==1)return [];
   const {lon,lat}=matches[0];
   if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90)return [];
   return [{type:'Feature',id:asset.assetId,properties:{assetId:asset.assetId,code:asset.code,name:asset.name},
    geometry:{type:'Point',coordinates:[lon,lat]}}];
  });
 }
 function publicPassingLoopReferences(records,localities){
  return records.filter(asset=>asset.type==='PL'&&/^PL0[1-7]$/.test(asset.code)).flatMap(asset=>{
   // An area reference does not identify a usable public alignment segment for these loops.
   if(isPassingLoopPlacementHeld(asset))return [];
   const matches=localities.filter(row=>row.type==='PL'&&row.name===asset.name&&row.phase==='current'&&
    row.locationConfidence==='Public Reference Location'&&row.coordinateSource==='Public reference / locality position');
   if(matches.length!==1)return [];
   const {lon,lat}=matches[0];
   if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<99.5||lon>104.8||lat<1||lat>7.5)return [];
   return [{type:'Feature',id:asset.assetId,properties:{assetId:asset.assetId,code:asset.code,name:asset.name},
    geometry:{type:'Point',coordinates:[lon,lat]}}];
  });
 }
 function findPublicAssets(records,query,type='ALL'){
  const normalize=text=>text.toLowerCase().replace(/[^a-z0-9]/g,'');
  const key=normalize(query).replace(/^(stn|pl)([1-9])$/,(_,prefix,digit)=>prefix+'0'+digit);
  return records.filter(asset=>(type==='ALL'||asset.type===type)&&
   (normalize(asset.assetId)===key||normalize([asset.code,asset.name].join(' ')).includes(key)));
 }
 async function loadPublicAssetIdentity(retry=false){
  const url='./data/ecrl-public-identity-v1.json';
  const response=retry?await fetch(url,{cache:'reload'}):await fetch(url);
  if(!response.ok)throw Error('ECRL_PUBLIC_IDENTITY_HTTP_'+response.status);
  const data=await response.json();
  if(data.version!==1||data.corridor!=='ECRL'||!Array.isArray(data.records))throw Error('ECRL_PUBLIC_IDENTITY_CONTRACT');
  return data.records;
 }
 function publicReferenceAlignment(data){
  const meta=data?.metadata;
  if(data?.type!=='FeatureCollection'||meta?.dataset!=='R4_OSM_ECRL_PUBLIC_REFERENCE'||
    meta.scope!=='PUBLIC_REFERENCE'||meta.classification!=='CONSTRUCTION_AT_SNAPSHOT'||
    meta.license!=='ODbL-1.0'||meta.physicalVerified!==false||!Array.isArray(data.features)||!data.features.length)
   throw Error('ECRL_PUBLIC_ALIGNMENT_CONTRACT');
  const ids=new Set();
  const features=data.features.map(feature=>{
   const coordinates=feature?.geometry?.coordinates;
   const way=feature?.properties?.osmWayId;
   if(feature?.type!=='Feature'||!Number.isSafeInteger(way)||way<1||
     typeof feature.id!=='string'||!/^rg-osm-\d+-\d+-\d+$/.test(feature.id)||
     feature.id.split('-')[2]!==String(way)||ids.has(feature.id)||
     feature.geometry?.type!=='LineString'||!Array.isArray(coordinates)||coordinates.length<2||
     coordinates.some(point=>!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||
      point[0]<99.5||point[0]>104.8||point[1]<1||point[1]>7.5)||
     Object.keys(feature.properties).length!==1)
    throw Error('ECRL_PUBLIC_ALIGNMENT_FEATURE');
   ids.add(feature.id);
   return {type:'Feature',id:feature.id,geometry:{type:'LineString',coordinates},properties:{osmWayId:way}};
  });
  return {type:'FeatureCollection',features};
 }
 async function loadPublicReferenceAlignment(retry=false){
  const response=await fetch('./data/ecrl-reference-alignment.geojson',{cache:retry?'reload':'default'});
  if(!response.ok)throw Error('ECRL_PUBLIC_ALIGNMENT_HTTP_'+response.status);
  const data=await response.json();
  const geometry=publicReferenceAlignment(data);
  const {snapshotFrom,snapshotThrough,structureTags,branchTags}=data.metadata;
  const date=/^\d{4}-\d{2}-\d{2}$/;
  const snapshot=[snapshotFrom,snapshotThrough].every(value=>typeof value==='string'&&date.test(value))&&snapshotFrom<=snapshotThrough
   ?{from:snapshotFrom,through:snapshotThrough}:null;
  // Enrich only admitted feature IDs. Unknown or malformed tags leave the line in the general reference tier.
  const structures=new Map();
  const branches=new Map();
  for(const {id} of geometry.features){
   const branchVersion=branchTags?.[id];
   if(Number.isSafeInteger(branchVersion)&&branchVersion>0)branches.set(id,branchVersion);
   const entry=structureTags?.[id];
   if(!Array.isArray(entry)||entry.length!==2)continue;
   const [kind,version]=entry;
   if(['tunnel','bridge','viaduct'].includes(kind)&&Number.isSafeInteger(version)&&version>0){
    structures.set(id,{kind,version});
   }
  }
  return {geometry,snapshot,structures,branches};
 }
 function referenceAlignmentSpec(id,alignment,theme='light'){
  const green=theme==='dark'?'#76d697':'#168b45';
  const {tunnel,bridge}=theme==='dark'?{tunnel:'#ccd2df',bridge:'#ff9b5a'}:{tunnel:'#222c37',bridge:'#a84a16'};
  const data={type:'FeatureCollection',features:alignment.geometry.features.map(feature=>({
   ...feature,properties:{...feature.properties,segmentId:feature.id,
    structure:alignment.structures.get(feature.id)?.kind??'unclassified',
    branch:alignment.branches.has(feature.id)}
  }))};
  return {
   source:{type:'geojson',data,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL 1.0</a>'},
   layer:{id,type:'line',source:id,layout:{'line-cap':'butt','line-join':'round'},
    paint:{'line-color':['step',['zoom'],green,11,
     ['match',['get','structure'],'tunnel',tunnel,['bridge','viaduct'],bridge,green]],
     'line-opacity':0.92,'line-dasharray':[2.4,1.5],
     'line-width':['interpolate',['linear'],['zoom'],5,1.5,10,2.6,11,3,
      13,['case',['==',['get','branch'],true],2,3.8],
      17,['case',['==',['get','branch'],true],2.8,5.2]]}}
  };
 }
 function installReferenceAlignment(map,id,alignment,theme,before){
  if(!alignment?.geometry?.features.length||map.getLayer(id))return false;
  const {source,layer}=referenceAlignmentSpec(id,alignment,theme);
  if(!map.getSource(id))map.addSource(id,source);
  map.addLayer(layer,before&&map.getLayer(before)?before:undefined);
  return true;
 }
 function referenceAlignmentVisible(category,mode='NORMAL',enabled=true){
  return enabled&&((mode==='NORMAL'&&['MRS10','Malaysia','All','ECRL'].includes(category))||mode==='INFRASTRUCTURE_FOCUS');
 }
 const iconZoomStops=Object.freeze([6,9,13,16]);
 const iconSizes=Object.freeze({
  STN:Object.freeze([8,16,24,34,34]),
  INTERCHANGE:Object.freeze([12,20,28,38,38]),
  FACILITY:Object.freeze([0,0,16,24,26])
 });
 const facilityMinZoom=iconZoomStops[1];
 function iconPixels(kind,zoom){
  const next=iconZoomStops.findIndex(stop=>zoom<stop);
  return iconSizes[kind][next<0?iconZoomStops.length:next];
 }
 function iconScale(kind,spriteSize,condition,fallback){
  const value=px=>condition?['case',condition,px/spriteSize,fallback]:px/spriteSize;
  return ['step',['zoom'],value(iconSizes[kind][0]),...iconZoomStops.flatMap((stop,i)=>[stop,value(iconSizes[kind][i+1])])];
 }
 function stationType2Canvas(pixelSize=68){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=pixelSize;
  const ctx=canvas.getContext('2d');ctx.scale(pixelSize/24,pixelSize/24);
  ctx.fillStyle='#1457a6';ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(3.5,2.5,17,17,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.fillRect(7,6,10,6);
  for(const x of [8,16]){ctx.beginPath();ctx.arc(x,15.5,1.2,0,2*Math.PI);ctx.fill()}
  ctx.strokeStyle='#1457a6';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(8,19);ctx.lineTo(6,22);ctx.moveTo(16,19);ctx.lineTo(18,22);ctx.stroke();
  return canvas;
 }
 function installStationType2(map,id,pixelSize){
  if(map.hasImage(id))return;
  const canvas=stationType2Canvas(pixelSize);
  map.addImage(id,canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height),{pixelRatio:2});
 }
 const api=Object.freeze({routes,sectionDGauges,readAssetId,assetHref,createEcrlContext,publicAssetIdentity,publicStationReferences,publicPassingLoopReferences,isPassingLoopPlacementHeld,stationType2Canvas,installStationType2,iconPixels,iconScale,facilityMinZoom,findPublicAssets,loadPublicAssetIdentity,publicReferenceAlignment,loadPublicReferenceAlignment,referenceAlignmentSpec,installReferenceAlignment,referenceAlignmentVisible});
 if(typeof module==='object')module.exports=api;
 if(root)root.MRS10P01MapCore=api;
})(typeof window==='undefined'?null:window);
