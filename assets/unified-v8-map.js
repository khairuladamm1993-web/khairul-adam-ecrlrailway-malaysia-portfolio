/* MR-S10 P01 V4. All geographic points arrive from GIS query responses.
   No route alignment is inferred from stop order. */
const maplibregl=window.maplibregl;
const $=id=>document.getElementById(id);
const core=window.MRS10UnifiedV4Registry, kl=window.MRS10KLRegistry,
 ampang=window.MRS10AmpangR219, ampangGIS=window.MRS10AmpangGISR219,
 integration=window.MRS10UnifiedV6Adapter,ktm=window.MRS10UnifiedV7KTM;
let singapore,physical,ecrl,ecrlUI,journeyView;
const paths=new Map();
const locales=['ms','en','zh','th'];
const i18n={
 ms:{title:'Peta Rel Bersepadu V8',desc:'Enam belas lapisan: 8 perkhidmatan V6, 6 KTM Komuter, ETS dan Ekspres Rakyat Timuran. Shuttle Timur belum diintegrasikan. Titik stesen daripada GIS awam pihak ketiga; bukan koordinat operasi atau jajaran trek.',
  all:'Semua',search:'Cari stesen, kod atau laluan',reset:'Set semula',lineup:'Turutan stesen',
  loading:'Memuatkan stesen daripada GIS awam…',offline:'Peta geografi gagal dimuatkan. Senarai stesen masih boleh digunakan.',
  partial:'GIS tidak lengkap: hanya penanda yang dipadankan dipaparkan.',complete:'Semua penanda dipadankan kepada sumber GIS awam.',
  located:'Penanda sumber GIS dipadankan',unlocated:'Tiada lokasi GIS yang disahkan untuk stesen ini.',source:'GIS awam pihak ketiga (bukan pengukuran operasi)',
  transfer:'Pertukaran penumpang',status:'penanda GIS',noResults:'Tiada padanan carian.',pending:'Menunggu sumber GIS',notTrack:'Geometri trek belum disahkan; tiada garisan palsu.',visualPending:'Data GIS dipadankan tetapi paparan peta belum disahkan.',
  rights:'Data sumber GIS: ArcGIS awam pihak ketiga · Turutan stesen: MR-S10 operator references · Basemap: OpenFreeMap / OSM · Bukan untuk operasi.',
  fail:'Ralat GIS',show:'Paparkan laluan',found:'daripada'},
 en:{title:'Unified Railway Map V8',desc:'Sixteen layers: 8 baseline services, 6 KTM Komuter services, ETS and Ekspres Rakyat Timuran. Eastern Shuttle excluded. Station points from third-party public GIS; not operational coordinates or track alignments.',
  all:'All',search:'Search station, code or service',reset:'Reset',lineup:'Station lineup',
  loading:'Loading public GIS stations…',offline:'Geographic map unavailable. The station list remains accessible.',
  partial:'GIS incomplete: only source-matched markers are shown.',complete:'All markers matched against public GIS sources.',
  located:'Source GIS marker matched',unlocated:'No verified GIS position for this station.',source:'Third-party public GIS (not an operational survey)',
  transfer:'Passenger interchange',status:'GIS markers',noResults:'No search matches.',pending:'Awaiting GIS source',notTrack:'Track geometry not verified; no fictitious lines.',visualPending:'GIS matched but map rendering not yet verified.',
  rights:'GIS data: third-party ArcGIS · Station order: MR-S10 operator references · Basemap: OpenFreeMap / OSM · Not for operations.',
  fail:'GIS error',show:'Show route',found:'of'},
 zh:{title:'综合铁路地图 V8',desc:'同时显示16个客运服务图层，不包括东海岸接驳列车。车站点位来自第三方公共 GIS，并非运营测量坐标或轨道线路。',
  all:'全部',search:'搜索车站、代码或线路',reset:'重置',lineup:'车站顺序',
  loading:'正在加载公共 GIS 车站…',offline:'地理地图不可用，但车站列表仍可使用。',
  partial:'GIS 数据不完整：仅显示来源匹配的标记。',complete:'所有标记已与公共 GIS 来源匹配。',
  located:'已匹配 GIS 标记',unlocated:'该车站尚无已核对的 GIS 位置。',source:'第三方公共 GIS（非运营测量）',
  transfer:'乘客换乘',status:'GIS 标记',noResults:'没有匹配结果。',pending:'等待 GIS 数据',notTrack:'轨道几何未经核实，不绘制虚构线路。',visualPending:'GIS 数据已匹配，但地图尚未通过显示验证。',
  rights:'GIS 来源：第三方 ArcGIS · 车站顺序：MR-S10 运营商参考资料 · 底图：OpenFreeMap / OSM · 不作运营用途。',
  fail:'GIS 错误',show:'显示线路',found:'／'},
 th:{title:'แผนที่รถไฟรวม V8',desc:'แสดง 16 ชั้นข้อมูลบริการ ไม่รวมรถรับส่งฝั่งตะวันออก จุดสถานีจาก GIS สาธารณะของบุคคลที่สาม ไม่ใช่พิกัดปฏิบัติการหรือแนวรางที่ตรวจวัด',
  all:'ทั้งหมด',search:'ค้นหาสถานี รหัส หรือเส้นทาง',reset:'รีเซ็ต',lineup:'ลำดับสถานี',
  loading:'กำลังโหลดสถานีจาก GIS สาธารณะ…',offline:'แผนที่ภูมิศาสตร์ไม่พร้อมใช้งาน แต่ยังดูรายชื่อสถานีได้',
  partial:'GIS ไม่ครบ: แสดงเฉพาะจุดที่จับคู่กับแหล่งข้อมูลได้',complete:'จับคู่หมุดทั้งหมดกับแหล่ง GIS สาธารณะแล้ว',
  located:'จับคู่หมุด GIS แล้ว',unlocated:'ยังไม่มีพิกัด GIS ที่ตรวจสอบแล้วสำหรับสถานีนี้',source:'GIS สาธารณะของบุคคลที่สาม (ไม่ใช่การสำรวจเพื่อปฏิบัติการ)',
  transfer:'จุดเปลี่ยนสายผู้โดยสาร',status:'หมุด GIS',noResults:'ไม่พบผลการค้นหา',pending:'รอข้อมูล GIS',notTrack:'ยังไม่ยืนยันแนวราง จึงไม่สร้างเส้นสมมติ',visualPending:'จับคู่ข้อมูล GIS แล้ว แต่ยังไม่ยืนยันการแสดงผลแผนที่',
  rights:'GIS: ArcGIS บุคคลที่สาม · ลำดับสถานี: MR-S10 ข้อมูลผู้ให้บริการ · แผนที่ฐาน: OpenFreeMap / OSM · ห้ามใช้เพื่อปฏิบัติการ',
  fail:'ข้อผิดพลาด GIS',show:'แสดงเส้นทาง',found:'จาก'}
};
const state={locale:'ms',category:'All',selected:'mrt-kajang',theme:'light',map:null,mapReady:false,zoomDone:false,
 results:new Map(),points:new Map(),pending:0,networkError:false,popup:null,manifest:[]};
// V8.1 owns temporary focus only; underlying registries and controls remain intact.
let pendingRestore=null;
const relationsFor=p=>window.MRS10V81Relationships.resolve(p,state.manifest,integration,core,singapore);
function ownedLayers(){return (state.map?.getStyle()?.layers||[]).filter(l=>l.id.startsWith('mrs10-v8-'))}
function layerSnapshot(){return ownedLayers().map(l=>({id:l.id,visibility:state.map.getLayoutProperty(l.id,'visibility')||'visible',filter:state.map.getFilter(l.id)||null}))}
function restoreLayers(saved){
 if(!state.map?.getLayer('mrs10-v8-geometry')){pendingRestore=saved;return}
 for(const l of saved)if(state.map.getLayer(l.id)){state.map.setLayoutProperty(l.id,'visibility',l.visibility);state.map.setFilter(l.id,l.filter)}
 pendingRestore=null;
}
const focus=window.MRS10V81Focus.create({
 capture:()=>({layers:layerSnapshot(),category:state.category,selected:state.selected}),
 apply:selection=>{
  if(!state.map?.getLayer('mrs10-v8-geometry'))return;
  ecrl?.setVisibility(state.map,state.category,selection.mode);
  const visible=new Set(selection.routeIds);
  for(const r of state.manifest)for(const suffix of ['', '-ring','-inner','-interchange']){
   const id=layerId(r.id)+suffix;if(state.map.getLayer(id))state.map.setLayoutProperty(id,'visibility',visible.has(r.id)?'visible':'none');
  }
  const ids=selection.segmentIds||physical.segments.filter(s=>s.routeIds.some(id=>visible.has(id))).map(s=>s.segmentId);
  if(state.map.getLayer('mrs10-v8-geometry'))state.map.setFilter('mrs10-v8-geometry',['in',['get','segmentId'],['literal',ids]]);
 },
 restore:saved=>{state.category=saved.category;state.selected=saved.selected;restoreLayers(saved.layers);buildFilters();buildLegend();buildRoutes();buildLineup()}
});
function closeFocus(){$('ecrl-no-point').hidden=true;$('ecrl-focus-dismiss').hidden=true;if(state.popup){const old=state.popup;state.popup=null;old.remove()}focus.exit()}
function mountPopup(host,position){
 $('ecrl-no-point').hidden=true;
 const old=state.popup;state.popup=null;old?.remove();
 const popup=new maplibregl.Popup({offset:15,maxWidth:'330px',closeOnClick:false,focusAfterOpen:false}).setLngLat(position).setDOMContent(host);
 state.popup=popup;popup.on('close',()=>{if(state.popup===popup){state.popup=null;$('ecrl-focus-dismiss').hidden=true;focus.exit()}});popup.addTo(state.map);if(host.classList?.contains('ecrl-intelligence')){popup.getElement().classList.add('ecrl-popup');const dismiss=$('ecrl-focus-dismiss');dismiss.textContent='× '+ecrl.t(state.locale,'close');dismiss.hidden=false}else $('ecrl-focus-dismiss').hidden=true;popup.getElement().querySelector('.maplibregl-popup-close-button')?.focus({preventScroll:true});
}
function appendFocusLineup(host,routeIds){
 for(const id of routeIds){const r=state.manifest.find(r=>r.id===id);if(!r)continue;
  const patterns=r.paths||[{label:r.label,orderedStationIds:r.stops.map(s=>s.id)}];
  for(const path of patterns){const details=el('details'),summary=el('summary',null,r.label+' · '+(path.label||tr('lineup'))),list=el('ol','intelligence-lineup');
   for(const sid of path.orderedStationIds){const stop=r.stops.find(s=>s.id===sid);if(stop)list.append(el('li',null,(stop.code?stop.code+' · ':'')+stop.name))}
   details.append(summary,list);host.append(details);
  }
 }
}
function tr(k){return i18n[state.locale][k]}
function say(message){$('qa-note').textContent=message}
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=String(text);return x}
function selectedRoutes(){return state.manifest.filter(r=>state.category==='All'||r.category===state.category)}
function routeStatus(r){const d=state.results.get(r.id);return d?d.matched+'/'+r.expected:r.expected?'0/'+r.expected:'0'}
function currentCount(){return [...state.results.values()].reduce((n,r)=>n+r.matched,0)}
function showStatus(){
 const total=state.manifest.reduce((n,r)=>n+r.expected,0),ready=currentCount();
 const finished=state.pending===0;
 const view=diagnosticSnapshot();
 const canvasOk=view.mapReady&&view.styleLoaded&&view.tilesLoaded&&view.webglReady;
 const rows=Object.values(view.perRoute);
 const baselineOk=state.manifest.slice(0,4).every(r=>view.perRoute[r.id]?.present&&view.perRoute[r.id]?.rendered>0);
 const loaded=finished&&ready===total&&canvasOk&&rows.length===state.manifest.length&&rows.every(x=>x.present&&x.rendered>0);
 const message=!finished?tr('loading'):loaded?tr('complete'):
  ready!==total?tr('partial'):tr('visualPending');
 say(message+' · '+ready+'/'+total+' '+tr('status')+' · '+tr('coverageNote'));
 $('map-error').textContent=state.networkError?tr('offline'):message;
 $('map-error').hidden=!!canvasOk;
}
function findGeo(routeId,id){return state.points.get(routeId+':'+id)||null}
function buildFilters(){
 const host=$('filters');host.replaceChildren();
 for(const category of ['All','MRT','LRT','Monorail','ERL','KTM','ETS','Intercity','Singapore','ECRL']){
  const btn=el('button',null,category==='All'?tr('all'):category);
  btn.type='button';btn.setAttribute('aria-pressed',String(category===state.category));
  btn.onclick=()=>{closeFocus();state.category=category;const allowed=selectedRoutes();if(!allowed.some(x=>x.id===state.selected))state.selected=allowed[0]?.id||state.selected;
    buildFilters();buildLegend();buildRoutes();buildLineup();applyVisibility();ecrlUI?.render();};
  host.append(btn);
 }
 ecrlUI?.render();
}
function buildLegend(){
 const host=$('legend');host.replaceChildren();
 for(const r of selectedRoutes()){
  const row=el('div','legend-item'),dot=el('span','swatch'),name=el('span',null,r.label+' · '+routeStatus(r));
  dot.style.background=r.color;row.append(dot,name);host.append(row);
 }
}
function buildRoutes(){
 const host=$('route-buttons');host.replaceChildren();
 for(const r of selectedRoutes()){
  const btn=el('button',null,r.label);
  btn.type='button';btn.setAttribute('aria-pressed',String(r.id===state.selected));
  btn.onclick=()=>{closeFocus();state.selected=r.id;buildRoutes();buildLineup();focusRoute(r.id)};
  host.append(btn);
 }
}
function focusRoute(routeId){
 const points=state.results.get(routeId)?.points||[];
 if(!state.mapReady||points.length===0)return;
 if(points.length===1){state.map.easeTo({center:points[0].coordinates,zoom:11,duration:350});return}
 const c=points.map(p=>p.coordinates);
 state.map.fitBounds([[Math.min(...c.map(p=>p[0])),Math.min(...c.map(p=>p[1]))],
 [Math.max(...c.map(p=>p[0])),Math.max(...c.map(p=>p[1]))]],{padding:50,maxZoom:11.5,duration:350});
}
function focusStation(routeId,id){
 const route=state.manifest.find(x=>x.id===routeId);if(!route)return;
 state.selected=routeId;
 if(state.category!=='All'&&state.category!==route.category){state.category='All';buildFilters();buildLegend();applyVisibility();}
 buildRoutes();buildLineup();
 const point=findGeo(routeId,id);
 if(!point){say(tr('unlocated'));return}
 say(point.name+' · '+tr('located'));
 if(state.map){
  showPopup(point);
  const open=()=>{state.map.easeTo({center:point.coordinates,zoom:Math.max(state.map.getZoom(),12.3),duration:360})};
  if(state.map.isStyleLoaded())open();
  else state.map.once('idle',()=>{if(state.map?.isStyleLoaded())open()});
 }
}
function buildLineup(){
 const host=$('lineup');host.replaceChildren();
 const route=state.manifest.find(r=>r.id===state.selected);
 if(!route)return;
 const selector=$('path-select');selector.replaceChildren();selector.hidden=!route.paths;
 $('path-label').textContent=route.paths?tr('direction'):'';
 let stops=route.stops;
 if(route.paths){
  for(const p of route.paths){const opt=el('option',null,p.label);opt.value=p.pathId;selector.append(opt)}
  selector.value=paths.get(route.id)||route.paths[0].pathId;
  const path=route.paths.find(p=>p.pathId===selector.value)||route.paths[0];
  paths.set(route.id,path.pathId);
  stops=path.orderedStationIds.map((id,i)=>({...route.stops.find(s=>s.id===id),order:i+1}));
  selector.onchange=()=>{paths.set(route.id,selector.value);buildLineup()};
  $('path-status').textContent=(path.operatingStatus==='OPERATIONAL'?tr('operational'):tr('future'))+' · '+(route.topologyStatus.includes('PARTIAL')?tr('partialTopology'):tr('sourceTopology'))+' · '+tr('serviceNotTrack');
 }else $('path-status').textContent=tr('serviceNotTrack');
 for(const s of stops){
  const li=el('li'),btn=el('button'),left=el('span'),right=el('span');
  const point=findGeo(route.id,s.id),dot=el('span','dot');
  dot.style.background=point?route.color:'var(--line)';
  left.append(dot,document.createTextNode(s.order+'. '+s.name));
  if(s.code)right.textContent=s.code;
  btn.type='button';btn.append(left,right);btn.onclick=()=>focusStation(route.id,s.id);
  btn.setAttribute('aria-label',s.name+(point?' · GIS':' · '+tr('unlocated')));
  li.append(btn);host.append(li);
 }
}
function updateSearch(){
 const q=core.normalise($('search').value),host=$('search-results');host.replaceChildren();
 if(!q){host.hidden=true;return}
 host.hidden=false;
 const matches=[];
 for(const r of state.manifest){
  for(const s of r.stops){if(core.normalise(s.name).includes(q)||core.normalise(s.code).includes(q)||core.normalise(r.label).includes(q))matches.push({r,s});}
 }
 for(const {r,s} of matches.slice(0,35)){
  const btn=el('button',null,r.label+' · '+s.name+(s.code?' ('+s.code+')':''));
  btn.type='button';btn.onclick=()=>{focusStation(r.id,s.id);host.hidden=true;$('search').value=''};
  host.append(btn);
 }
 const infrastructure=ecrl?.search(q)||[];
 for(const asset of infrastructure.slice(0,35)){const btn=el('button',null,'ECRL · '+(asset.officialName||asset.historicalName)+' · '+asset.assetId);btn.type='button';btn.onclick=()=>{showInfrastructure(asset.assetId,true);host.hidden=true;$('search').value=''};host.append(btn)}
 if(!matches.length&&!infrastructure.length)host.append(el('p',null,tr('noResults')));
}
function applyLanguage(){
 document.documentElement.lang=state.locale;
 $('details-toggle').setAttribute('aria-label',tr('mapDetails'));
 $('title').textContent=tr('title');$('description').textContent=tr('desc');
 $('lineup-title').textContent=tr('lineup');$('search').placeholder=tr('search');
 $('reset').textContent=tr('reset');$('language').textContent=state.locale==='ms'?'BM':state.locale==='en'?'EN':state.locale==='zh'?'中文':'ไทย';
 $('attribution').textContent=tr('rights');$('approximate-label').textContent=tr('approximate');geometryStatus();
 buildFilters();buildLegend();buildRoutes();buildLineup();updateSearch();showStatus();ecrlUI?.render();journeyView?.render();
}
function geoJSON(){
 return core.toGeoJSON(state.manifest.map(r=>state.results.get(r.id)));
}
const srcId=id=>'mrs10-v8-source-'+id;
const layerId=id=>'mrs10-v8-'+id;
function updateMapLayer(){
 const map=state.map;
 if(!map||!map.isStyleLoaded())return;
 try{
  installGeometry();
  for(const r of state.manifest){
   const source=srcId(r.id),lid=layerId(r.id);
   const data=core.toGeoJSON([state.results.get(r.id)]);
   for(const f of data.features){const p=findGeo(r.id,f.properties.id);f.properties.interchange=!!p&&relationsFor(p).isInterchange;f.properties.future=!!p?.status&&p.status!=='OPERATIONAL';f.properties.pending=!p?.provenance?.startsWith('OFFICIAL_KTMB_GTFS');}
   if(!map.getSource(source))map.addSource(source,{type:'geojson',data});
   else map.getSource(source).setData(data);
   if(!map.getLayer(lid))map.addLayer({id:lid,type:'circle',source,
    paint:{
     'circle-color':'rgba(255,255,255,0.05)',
     'circle-radius':r.id==='erl-klia-ekspres'?
       ['interpolate',['linear'],['zoom'],7,9,11,13,14,16]:
       r.id==='erl-klia-transit'?['interpolate',['linear'],['zoom'],7,4.2,11,7,14,9.5]:
       ['interpolate',['linear'],['zoom'],7,5.5,11,8.5,14,11],
     'circle-stroke-color':r.color,
     'circle-stroke-width':0,
     'circle-opacity':r.operationalStatus&&r.operationalStatus!=='OPERATIONAL'?0.35:1
    }});
  }
  installInnerDots();ecrl?.install(map);applyVisibility();if(pendingRestore)restoreLayers(pendingRestore);
 }catch(e){
  state.networkError=true;
  $('map-error').hidden=false;
  $('map-error').textContent=tr('offline');
  console.error('V8_MAP_LAYER_INSTALL_FAILED',e);
 }
}
function applyVisibility(){
 if(focus.current.mode!=='NORMAL'){focus.reapply();return}
 if(!state.map?.getLayer('mrs10-v8-geometry'))return;
 for(const r of state.manifest){
  const id=layerId(r.id);
  if(state.map.getLayer(id+'-interchange'))state.map.setLayoutProperty(id+'-interchange','visibility',state.category==='All'||state.category===r.category?'visible':'none');
  if(state.map.getLayer(id+'-ring'))state.map.setLayoutProperty(id+'-ring','visibility',state.category==='All'||state.category===r.category?'visible':'none');
  if(state.map.getLayer(id+'-inner'))state.map.setLayoutProperty(id+'-inner','visibility',state.category==='All'||state.category===r.category?'visible':'none');
  if(state.map.getLayer(id))state.map.setLayoutProperty(id,'visibility',
   state.category==='All'||state.category===r.category?'visible':'none');
 }
 applyGeometryVisibility();ecrl?.setVisibility(state.map,state.category);
}
function showPopup(point){
 if(!state.map)return;
 const relationship=relationsFor(point);
 focus.enter({mode:relationship.isInterchange?'INTERCHANGE_FOCUS':'STATION_FOCUS',routeIds:relationship.routeIds,stationId:point.id});
 state.selected=point.routeId;buildRoutes();buildLineup();
 const route=state.manifest.find(r=>r.id===point.routeId);
 const container=el('div');
 container.append(el('h3',null,tr(relationship.isInterchange?'interchangeIntelligence':'stationIntelligence')));
 container.append(el('strong',null,point.name),el('p',null,route.label+(point.code?' · '+point.code:'')),
  el('p',null,point.provenance?.startsWith('OFFICIAL_KTMB_GTFS')?
  'KTMB GTFS rasmi · koordinat hentian, bukan geometri trek':point.provenance?.startsWith('SECONDARY_ARCGIS_KTM')?
  'GIS awam sekunder · titik stesen, bukan pengukuran operasi':tr('source')));
 if(route.decoder==='SG'){container.append(el('p',null,point.status==='OPERATIONAL'?tr('operational'):tr('future')),el('p',null,tr('secondaryPoint')));appendSource(container,point.sourceUrl);appendSGTransfers(container,point);}
 const transfers=integration.transfersFor(point,state.manifest,core.interchangeRegistry,core.normalise);
 if(transfers.length){
  const shared=el('div','shared-services');shared.append(el('strong',null,tr('transfer')));
  for(const {route:service,stop,relation} of transfers){
   const btn=el('button','service-change',service.label+
    (relation==='PEDESTRIAN_CONNECTION'?' · walk':''));
   const dot=el('span','swatch');dot.style.background=service.color;
   btn.prepend(dot);btn.onclick=()=>focusStation(service.id,stop.id);
   shared.append(btn);
  }
  container.append(shared);
 }
 for(const rel of relationship.relations){container.append(el('p',null,rel.type+' · '+rel.status+(rel.name?' · '+rel.name:'')));appendSource(container,rel.sourceUrl)}
 container.append(el('p',null,tr('serviceNotTrack')));appendFocusLineup(container,relationship.routeIds);
 mountPopup(container,point.coordinates);
}
function showInfrastructure(assetId,moveCamera=false){
 const asset=ecrl?.get(assetId);if(!asset)return;
 const host=ecrlUI.content(assetId),ref=ecrl.reference(assetId);
 if(moveCamera&&ref&&ecrl.flags[ref.kind]&&state.map)state.map.easeTo({center:ref.coordinates,zoom:Math.max(state.map.getZoom(),12.5),duration:300});
 focus.enter({mode:'INFRASTRUCTURE_FOCUS',routeIds:[],assetId});
 if(ref&&ecrl.flags[ref.kind]&&state.map){mountPopup(host,ref.coordinates)}
 else{const old=state.popup;state.popup=null;old?.remove();const panel=$('ecrl-no-point');panel.replaceChildren();const close=el('button',null,'×');close.type='button';close.setAttribute('aria-label',ecrl.t(state.locale,'close'));close.onclick=closeFocus;panel.append(close,host);panel.hidden=false;close.focus({preventScroll:true})}
}
function fitOnce(){
 if(state.zoomDone||!state.mapReady)return;
 if(state.pending>0)return;
 const coords=[...state.points.values()].map(p=>p.coordinates);
 if(coords.length<2)return;
 const minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),
 minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1]));
 state.map.fitBounds([[minX,minY],[maxX,maxY]],{padding:45,maxZoom:12,duration:400});
 state.zoomDone=true;
}
function startMap(){
 try{
  state.map=new maplibregl.Map({container:'map',style:styleURL(),center:[101.69,3.13],zoom:10.1,
   attributionControl:true});
  state.map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  state.map.on('style.load',()=>{
   state.mapReady=true;state.networkError=false;
   // style.load is earlier than isStyleLoaded() on some MapLibre builds.
   // A second safe layer-install gate runs on load/idle.
   updateMapLayer();showStatus();
  });
  state.map.on('load',()=>{
   state.mapReady=true;updateMapLayer();fitOnce();showStatus();
  });
  state.map.on('idle',()=>{
    // Safari/WebKit and Chromium can reach loaded style without a second 'load'
    // event after setStyle(). Never gate recovery on stale mapReady=false.
    if(state.map.isStyleLoaded()){
     state.mapReady=true;
     const missing=state.manifest.some(route=>
      !state.map.getSource(srcId(route.id))||!state.map.getLayer(layerId(route.id)))||(ecrl&&!ecrl.snapshot(state.map).layersPresent);
     if(state.points.size&&missing){updateMapLayer();fitOnce();}
    }
    if(pendingRestore)restoreLayers(pendingRestore);
    showStatus();
   });
   state.map.on('error',()=>{if(!state.mapReady){state.networkError=true;showStatus()}});
  const selectMapPoint=e=>{
   if(!state.mapReady)return;
   state.lastTap={x:e.point.x,y:e.point.y,time:Date.now()};
   // Screen-space hit testing uses the same source points as the rendered icons.
   // It is never used to infer railway connectivity or interchange membership.
   const candidates=[...state.points.values()].filter(p=>state.map.getLayer(layerId(p.routeId))&&state.map.getLayoutProperty(layerId(p.routeId),'visibility')!=='none').map(p=>{const q=state.map.project(p.coordinates);return {point:p,distance:Math.hypot(q.x-e.point.x,q.y-e.point.y)}}).filter(p=>p.distance<=14).sort((a,b)=>a.distance-b.distance);
   const infrastructure=ecrl?.hit(state.map,e.point);
   if(infrastructure&&(!candidates.length||infrastructure.distance<candidates[0].distance)){showInfrastructure(infrastructure.assetId);return}
   const point=candidates[0]?.point;
   state.lastTap.stationId=point?.id||null;
   if(!point){showTrackAt(e);return;}
   showPopup(point);
  };
  let touchTap=null;
  state.map.on('click',e=>{
   if(touchTap&&Date.now()-touchTap.time<650&&Math.hypot(e.point.x-touchTap.x,e.point.y-touchTap.y)<16)return;
   selectMapPoint(e);
  });
  // A short single-pointer tap is distinct from drag/pinch. Native MapLibre
  // click can be suppressed by touch gesture arbitration on Chromium Android.
  const canvas=state.map.getCanvas(),tracker=window.MRS10V81Focus.tapTracker();
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')tracker.down(e)});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')tracker.move(e)});
  canvas.addEventListener('pointercancel',e=>tracker.cancel(e));
  canvas.addEventListener('pointerup',e=>{
   if(e.pointerType!=='touch'||!tracker.up(e))return;
   const rect=canvas.getBoundingClientRect(),point={x:e.clientX-rect.left,y:e.clientY-rect.top};
   touchTap={...point,time:Date.now()};selectMapPoint({point,lngLat:state.map.unproject([point.x,point.y])});
  });
 }catch(e){state.networkError=true;showStatus()}
}
function styleURL(){return 'https://tiles.openfreemap.org/styles/'+(state.theme==='dark'?'dark':'positron')}
function reset(){
 closeFocus();
 state.category='All';state.selected='mrt-kajang';$('search').value='';$('search-results').hidden=true;
 buildFilters();buildLegend();buildRoutes();buildLineup();applyVisibility();
 state.zoomDone=false;fitOnce();ecrlUI?.render();
}
async function fetchRoute(route){
 if(route.decoder==='SG')return singapore.fetchRoute(route);
 if(route.decoder?.startsWith('KTM_'))return ktm.fetchRoute(route);
 if(route.decoder)return integration.fetchRoute(route);
 const response=await fetch(route.source,{mode:'cors',credentials:'omit',cache:'no-store'});
 if(!response.ok)throw new Error('HTTP_'+response.status);
 const raw=await response.json();
 return core.decodeArcgis(route,raw,ampangGIS,ampang);
}
async function loadGIS(){
 state.pending=state.manifest.length;showStatus();
 await Promise.all(state.manifest.map(async route=>{
  try{
   const result=await fetchRoute(route);
   state.results.set(route.id,result);
   for(const p of result.points)state.points.set(p.routeId+':'+p.id,p);
  }catch(e){
   state.results.set(route.id,{ok:false,reason:String(e?.message||e),matched:0,expected:route.expected,points:[]});
  }finally{
   state.pending--;buildLegend();buildLineup();updateMapLayer();showStatus();
  }
 }));
 fitOnce();
}
async function init(){
 try{singapore=await window.MRS10V8Singapore.load();physical=await fetch('./data/unified-v8/physical-network.json').then(r=>{if(!r.ok)throw Error('GEOMETRY_HTTP_'+r.status);return r.json()});window.MRS10V8Geometry.validate(physical);state.manifest=[...core.loadManifest(kl,ampang),...integration.routes(),...ktm.routes(),...singapore.routes()]}catch(e){$('map-error').textContent='Registry: '+e.message;return}
 ecrl=window.MRS10UnifiedECRL.create(window.MRS10ECRLGISV1,window.MRS10ECRLI18N);
 ecrlUI=window.MRS10ECRLIntegrationUI.create(ecrl,{getLocale:()=>state.locale,getCategory:()=>state.category,onSelect:id=>showInfrastructure(id,true),onFlags:(kind,enabled)=>{closeFocus();ecrl.flags[kind]=enabled;applyVisibility();ecrlUI.render()}});
 journeyView=window.MRS10JourneyView.create({host:$('journey-foundation'),stations:ecrl.stations,getLocale:()=>state.locale});
 $('details-toggle').addEventListener('click',()=>{const expanded=$('details-toggle').getAttribute('aria-expanded')!=='true';$('details-toggle').setAttribute('aria-expanded',String(expanded));$('map-details').hidden=!expanded});
 $('approximate').addEventListener('change',()=>{closeFocus();installGeometry();applyVisibility();geometryStatus()});
 $('search').addEventListener('input',updateSearch);
 $('reset').addEventListener('click',reset);
 $('ecrl-focus-dismiss').addEventListener('click',closeFocus);
 $('language').addEventListener('click',()=>{state.locale=locales[(locales.indexOf(state.locale)+1)%4];applyLanguage();if(focus.current.mode==='INFRASTRUCTURE_FOCUS'){showInfrastructure(focus.current.assetId)}else if(state.popup){closeFocus()}});
 $('theme').addEventListener('click',()=>{
  state.theme=state.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=state.theme;
  if(state.map){state.mapReady=false;state.map.setStyle(styleURL())}
  showStatus();
 });
 applyLanguage();startMap();void loadGIS();
}
function diagnosticSnapshot(){
 const map=state.map,rows={};
 let styleLoaded=false,tilesLoaded=false,webglReady=false,rect={width:0,height:0};
 try{
  styleLoaded=!!map?.isStyleLoaded?.();
  tilesLoaded=!!map?.areTilesLoaded?.();
  const canvas=map?.getCanvas?.();
  if(canvas){
   const r=canvas.getBoundingClientRect();
   rect={width:r.width,height:r.height,backingWidth:canvas.width,backingHeight:canvas.height};
   webglReady=!!map?.painter?.context?.gl&&!map.painter.context.gl.isContextLost();
  }
  for(const route of state.manifest){
   const source=srcId(route.id),layer=layerId(route.id);
   const present=!!map?.getSource?.(source)&&!!map?.getLayer?.(layer);
   const visible=present&&map.getLayoutProperty(layer,'visibility')!=='none';
   const rendered=styleLoaded&&visible?map.queryRenderedFeatures({layers:[layer]}).length:0;
   rows[route.id]={source,layer,present,visible,rendered,matched:state.results.get(route.id)?.matched||0};
  }
 }catch(e){console.error('V8_DIAGNOSTIC_ERROR',e)}
 return Object.freeze({mapReady:state.mapReady,styleLoaded,tilesLoaded,webglReady,
  rect,perRoute:rows,renderedFeatureCount:Object.values(rows).reduce((n,r)=>n+r.rendered,0),
  lastTap:state.lastTap||null,layerCount:Object.values(rows).filter(r=>r.present).length,sourceMatched:state.points.size,
  geometry:geometrySnapshot(),singaporeSourceRecords:singapore?.sourceRecordCount,borderRecords:singapore?.borderRecordCount,ecrl:ecrl?.snapshot(map),mapInstances:state.map?1:0,stage:state.pending?'LOADING':'DONE',category:state.category});
}
// QA camera uses only existing OSM-backed geometry; it never derives service alignment.
function focusTrackInspection(){
 const map=state.map;
 const segments=physical?.segments.filter(s=>s.routeIds.includes('sg-RTS')&&s.geometry?.type==='LineString')||[];
 if(!map?.getLayer('mrs10-v8-geometry')||!segments.length)return false;
 map.resize(); // Reconcile WebGL/canvas viewport after iPad page scrolling.
 const coords=segments.flatMap(s=>s.geometry.coordinates);
 const x=coords.map(c=>c[0]),y=coords.map(c=>c[1]);
 map.jumpTo({center:[(Math.min(...x)+Math.max(...x))/2,(Math.min(...y)+Math.max(...y))/2],zoom:14.5});
 return true;
}
// Return actual hit-testable track points, excluding station hit boxes. A screen
// projection alone does not prove the painted/filtered MapLibre layer is clickable.
function trackHitTargets(){
 const map=state.map;if(!map?.isStyleLoaded()||!map.getLayer('mrs10-v8-geometry'))return [];
 const rect=map.getCanvas().getBoundingClientRect(),hits=[];
 const stationLayers=state.manifest.map(r=>layerId(r.id))
  .filter(id=>map.getLayer(id)&&map.getLayoutProperty(id,'visibility')!=='none');
 for(const s of physical.segments.filter(s=>s.routeIds.includes('sg-RTS')&&s.geometry?.type==='LineString')){
  const coords=s.geometry.coordinates;
  for(let i=1;i<coords.length;i++){
   const mid=[(coords[i-1][0]+coords[i][0])/2,(coords[i-1][1]+coords[i][1])/2];
   const p=map.project(mid);
   if(p.x<24||p.y<24||p.x>rect.width-24||p.y>rect.height-24)continue;
   if(document.elementFromPoint(rect.left+p.x,rect.top+p.y)!==map.getCanvas())continue;
   const tracks=map.queryRenderedFeatures([[p.x-4,p.y-4],[p.x+4,p.y+4]],{layers:['mrs10-v8-geometry']});
   if(!tracks.some(f=>f.properties.geometryVerification==='OSM_TOPOLOGY_MATCHED'))continue;
   const nearbyStations=stationLayers.length?map.queryRenderedFeatures(
    [[p.x-12,p.y-12],[p.x+12,p.y+12]],{layers:stationLayers}):[];
   if(nearbyStations.length)continue;
   hits.push({x:p.x,y:p.y,segmentId:s.segmentId});
  }
 }
 return hits;
}
function inspectStation(routeId,id){const p=findGeo(routeId,id);if(!p||!state.map?.getLayer(layerId(routeId)))return false;state.map.resize();state.map.jumpTo({center:p.coordinates,zoom:18});return true}
function stationHitTarget(routeId,id){const p=findGeo(routeId,id);if(!p||!state.map)return null;const q=state.map.project(p.coordinates);const rect=state.map.getCanvas().getBoundingClientRect();if(document.elementFromPoint(rect.left+q.x,rect.top+q.y)!==state.map.getCanvas())return null;return {x:q.x,y:q.y}}
window.MRS10ECRLCandidateQA=Object.freeze({snapshot:()=>({infrastructure:ecrl?.snapshot(state.map),focus:focus.current,journey:journeyView?.snapshot()}),inspectAsset:id=>{const ref=ecrl?.reference(id);if(!ref||!state.map)return false;state.map.resize();state.map.jumpTo({center:ref.coordinates,zoom:15});return true},assetHitTarget:id=>{const ref=ecrl?.reference(id);if(!ref||!ecrl.flags[ref.kind]||!state.map)return null;const p=state.map.project(ref.coordinates),rect=state.map.getCanvas().getBoundingClientRect();return document.elementFromPoint(rect.left+p.x,rect.top+p.y)===state.map.getCanvas()?{x:p.x,y:p.y}:null}});
window.MRS10V8Diagnostics=Object.freeze({snapshot:diagnosticSnapshot,focusTrackInspection,trackHitTargets,inspectStation,stationHitTarget,focusSnapshot:()=>({current:focus.current,original:focus.original,layers:layerSnapshot(),approximate:$('approximate').checked})});

const v8texts={
ms:{desc:'Malaysia V7 + 17 laluan Singapore. Turutan perkhidmatan dan geometri fizikal diasingkan. Shuttle Timur dikecualikan.',direction:'Arah / cabang',approximate:'Paparkan 13 geometri sekunder — anggaran, bukan landasan disahkan',operational:'Beroperasi (registry sumber)',future:'Akan datang / status terhad — bukan pengesahan operasi',partialTopology:'Turutan sebahagian; jurang sumber',sourceTopology:'Turutan berpaut sumber',serviceNotTrack:'Turutan perkhidmatan bukan sambungan fizikal landasan.',secondaryPoint:'Titik GIS sekunder; bukan ukuran rasmi.',coverageNote:'Rekod laluan-stesen, bukan bilangan stesen fizikal unik. Lokasi belum tersedia kekal dalam turutan.',physical:'Segmen fizikal disahkan',approx:'Geometri anggaran',unresolved:'Jajaran lain belum disahkan',track:'Maklumat landasan',verification:'Pengesahan geometri',confidence:'Keyakinan',railwayType:'Jenis landasan',sourceLabel:'Sumber',sourceDate:'Tarikh sumber',unknown:'Belum disahkan',serviceRelation:'Hubungan perkhidmatan',walk:'Pertukaran penumpang; tiada through-track',area:'Kawasan berdekatan; tiada through-track'},
en:{desc:'Malaysia V7 + 17 Singapore routes. Service order and physical geometry are separate. Eastern Shuttle excluded.',direction:'Direction / branch',approximate:'Show 13 secondary geometries — approximate, not verified track',operational:'Operational (source registry)',future:'Future / limited status — not an operating confirmation',partialTopology:'Partial lineup; source gaps',sourceTopology:'Source-linked lineup',serviceNotTrack:'Service order is not a physical track connection.',secondaryPoint:'Secondary GIS point; not an official survey.',coverageNote:'Route-station records, not unique physical stations. Unlocated stops remain in the lineup.',physical:'Verified physical segments',approx:'Approximate geometries',unresolved:'Other alignments unresolved',track:'Track Intelligence',verification:'Geometry verification',confidence:'Confidence',railwayType:'Railway type',sourceLabel:'Source',sourceDate:'Source date',unknown:'Unverified',serviceRelation:'Service relationship',walk:'Passenger transfer; no through-track',area:'Nearby area; no through-track'},
zh:{desc:'马来西亚 V7 加新加坡17条线路。服务顺序与实体轨道几何分开。暂不包含东海岸接驳列车。',direction:'方向／支线',approximate:'显示13条次级近似几何；并非已核实轨道',operational:'运营中（来源登记）',future:'未来／有限状态；非运营确认',partialTopology:'部分顺序；来源存在缺口',sourceTopology:'来源关联顺序',serviceNotTrack:'服务顺序不代表实体轨道连接。',secondaryPoint:'次级 GIS 点；非官方测量。',coverageNote:'线路车站记录，不等于独立实体车站数量。无坐标车站仍保留在列表中。',physical:'已核实实体段',approx:'近似几何',unresolved:'其他线路几何未核实',track:'轨道信息',verification:'几何核实',confidence:'可信度',railwayType:'轨道类型',sourceLabel:'来源',sourceDate:'来源日期',unknown:'未核实',serviceRelation:'服务关系',walk:'乘客换乘；无直通轨道',area:'邻近区域；无直通轨道'},
th:{desc:'มาเลเซีย V7 และสิงคโปร์ 17 เส้นทาง แยกลำดับบริการจากแนวรางจริง ไม่รวมรถรับส่งฝั่งตะวันออก',direction:'ทิศทาง / สาขา',approximate:'แสดงแนวประมาณ 13 รายการจากแหล่งรอง ไม่ใช่รางที่ยืนยันแล้ว',operational:'ให้บริการตามทะเบียนแหล่งข้อมูล',future:'อนาคต / สถานะจำกัด ไม่ใช่การยืนยันเปิดบริการ',partialTopology:'ลำดับบางส่วน มีช่องว่างข้อมูล',sourceTopology:'ลำดับอ้างอิงแหล่งข้อมูล',serviceNotTrack:'ลำดับบริการไม่ใช่การเชื่อมรางจริง',secondaryPoint:'จุด GIS แหล่งรอง ไม่ใช่การสำรวจทางการ',coverageNote:'ระเบียนสถานีต่อเส้นทาง ไม่ใช่จำนวนสถานีจริงที่ไม่ซ้ำ สถานีไม่มีพิกัดยังอยู่ในรายการ',physical:'ช่วงรางจริงที่ยืนยัน',approx:'แนวประมาณ',unresolved:'แนวอื่นยังไม่ยืนยัน',track:'ข้อมูลราง',verification:'การยืนยันแนวราง',confidence:'ความเชื่อมั่น',railwayType:'ประเภทราง',sourceLabel:'แหล่งข้อมูล',sourceDate:'วันที่แหล่งข้อมูล',unknown:'ยังไม่ยืนยัน',serviceRelation:'ความสัมพันธ์บริการ',walk:'เปลี่ยนสายผู้โดยสาร ไม่มีรางเชื่อมตรง',area:'พื้นที่ใกล้เคียง ไม่มีรางเชื่อมตรง'}
};
const focusTexts={ms:['Maklumat peta','Maklumat stesen','Maklumat pertukaran'],en:['Map details','Station Intelligence','Interchange Intelligence'],zh:['地图详情','车站信息','换乘信息'],th:['รายละเอียดแผนที่','ข้อมูลสถานี','ข้อมูลจุดเปลี่ยนสาย']};
for(const lang of locales){Object.assign(i18n[lang],v8texts[lang]);[i18n[lang].mapDetails,i18n[lang].stationIntelligence,i18n[lang].interchangeIntelligence]=focusTexts[lang]}
function appendSource(host,url){if(!url)return;try{const u=new URL(url);if(u.protocol!=='https:')return;const a=el('a',null,tr('sourceLabel'));a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';host.append(a)}catch{}}
function appendSGTransfers(host,point){
 for(const r of singapore.relations.filter(r=>r.from===point.id||r.to===point.id)){
  const other=r.from===point.id?r.to:r.from;
  const match=state.manifest.find(x=>x.decoder==='SG'&&x.stops.some(s=>s.id===other));
  const kind=r.type.includes('WALKING')?'walk':r.type.includes('AREA')?'area':'serviceRelation';
  host.append(el('p',null,tr(kind)+(kind==='walk'?' · PLANNED_CONNECTION · '+tr('future'):'')));
  if(match){const btn=el('button',null,match.stops.find(s=>s.id===other).name);btn.onclick=()=>focusStation(match.id,other);host.append(btn)}appendSource(host,r.sourceUrl);
 }
 for(const r of singapore.topology.interchanges.filter(r=>r.stationId===point.id||r.connectingStationId===point.id)){
  const future=[r.stationId,r.connectingStationId].filter(Boolean).some(id=>{const status=singapore.stationById.get(id)?.properties.status;return status&&status!=='OPERATIONAL'});
  host.append(el('p',null,(future?'PLANNED_CONNECTION · '+tr('future'):tr('walk'))+' · '+(r.connectingRouteIds||[]).join(' / ')));appendSource(host,r.sourceUrl);
 }
}
function geometrySnapshot(){return {official:physical?.segments.filter(s=>s.geometryVerification==='OFFICIAL_VERIFIED').length||0,osm:physical?.segments.filter(s=>s.geometryVerification==='OSM_TOPOLOGY_MATCHED').length||0,approximate:physical?.segments.filter(s=>s.geometryVerification==='SECONDARY_APPROXIMATE').length||0,rendered:state.map?.getLayer('mrs10-v8-geometry')&&state.map.isStyleLoaded()?state.map.queryRenderedFeatures({layers:['mrs10-v8-geometry']}).length:0,sourcePresent:!!state.map?.getSource('mrs10-v8-physical')}}
function geometryStatus(){const g=geometrySnapshot();$('geometry-status').textContent=tr('physical')+': '+g.official+' official / '+g.osm+' OSM · '+tr('approx')+': '+g.approximate+' · '+tr('unresolved')}
function installGeometry(){
 const map=state.map;if(!map?.isStyleLoaded()||!physical)return;
 const colors=Object.fromEntries(state.manifest.map(r=>[r.id,r.color]));
 const data=window.MRS10V8Geometry.features(physical,colors,$('approximate').checked);
 if(map.getSource('mrs10-v8-physical'))map.getSource('mrs10-v8-physical').setData(data);else map.addSource('mrs10-v8-physical',{type:'geojson',data});
 if(!map.getLayer('mrs10-v8-geometry'))map.addLayer({id:'mrs10-v8-geometry',type:'line',source:'mrs10-v8-physical',paint:{'line-color':['get','color'],'line-width':3,'line-dasharray':[2,2],'line-opacity':0.7}},state.manifest.map(r=>layerId(r.id)).find(id=>map.getLayer(id)));
}
function applyGeometryVisibility(){
 if(!state.map?.getLayer('mrs10-v8-geometry'))return;
 const visible=new Set(selectedRoutes().map(r=>r.id));
 const ids=physical.segments.filter(s=>state.category==='All'||s.routeIds.some(id=>visible.has(id))).map(s=>s.segmentId);
 state.map.setFilter('mrs10-v8-geometry',['in',['get','segmentId'],['literal',ids]]);
}
function installInnerDots(){for(const r of state.manifest){
 for(const kind of ['solid','pending','future']){const name=r.id+'-'+kind;if(!state.map.hasImage(name)){
  const c=document.createElement('canvas');c.width=c.height=40;const ctx=c.getContext('2d');ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.fillStyle=kind==='future'?'#fff3c4':'white';if(kind!=='solid')ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(20,20,14,0,Math.PI*2);ctx.fill();ctx.stroke();state.map.addImage(name,ctx.getImageData(0,0,40,40));
 }}
 if(!state.map.getLayer(layerId(r.id)+'-ring'))state.map.addLayer({id:layerId(r.id)+'-ring',type:'symbol',source:srcId(r.id),layout:{'icon-image':['case',['get','future'],r.id+'-future',['get','pending'],r.id+'-pending',r.id+'-solid'],'icon-size':0.6,'icon-allow-overlap':true,'icon-ignore-placement':true}});
 const outer=layerId(r.id)+'-interchange';if(!state.map.getLayer(outer))state.map.addLayer({id:outer,type:'circle',source:srcId(r.id),filter:['==',['get','interchange'],true],paint:{'circle-radius':12,'circle-color':'rgba(0,0,0,0)','circle-stroke-width':2,'circle-stroke-color':r.color}});
 const id=layerId(r.id)+'-inner';if(!state.map.getLayer(id))state.map.addLayer({id,type:'circle',source:srcId(r.id),paint:{'circle-color':r.color,'circle-radius':2,'circle-opacity':r.operationalStatus&&r.operationalStatus!=='OPERATIONAL'?0.45:1}})}}
function showTrackAt(e){
 if(!state.map.getLayer('mrs10-v8-geometry'))return;
 // Source-geometry hit fallback avoids thin-line GPU query differences on WebKit.
 // Only already-visible source segments participate; no alignment is generated.
 const filter=state.map.getFilter('mrs10-v8-geometry');
 const allowed=filter?.[2]?.[1];
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
 let s=null,best=12;
 for(const candidate of physical.segments){
  if(allowed&&!allowed.includes(candidate.segmentId))continue;
  if(candidate.geometryVerification==='SECONDARY_APPROXIMATE'&&!$('approximate').checked)continue;
  const lines=candidate.geometry?.type==='LineString'?[candidate.geometry.coordinates]:candidate.geometry?.type==='MultiLineString'?candidate.geometry.coordinates:[];
  for(const line of lines)for(let i=1;i<line.length;i++){const d=distance(e.point,state.map.project(line[i-1]),state.map.project(line[i]));if(d<best){best=d;s=candidate}}
 }
 if(!s)return;
 if(state.lastTap)state.lastTap.segmentId=s.segmentId;
 const segmentIds=window.MRS10V81Focus.component(physical,s.segmentId);
 const routeIds=[...new Set(physical.segments.filter(x=>segmentIds.includes(x.segmentId)).flatMap(x=>x.routeIds))];
 focus.enter({mode:'TRACK_FOCUS',segmentIds,routeIds,segmentId:s.segmentId});
 const host=el('div');host.append(el('strong',null,tr('track')),el('p',null,s.segmentId));
 for(const [label,value] of [['railwayType',s.railwayType],['verification',s.geometryVerification],['confidence',s.confidence],['sourceDate',s.sourceDate]])host.append(el('p',null,tr(label)+': '+(value??'UNKNOWN')));
 for(const key of ['trackCount','gauge','electrification','bridge','tunnel','operationalStatus','topologyValidation'])host.append(el('p',null,key+': '+(s[key]==null?'UNKNOWN':typeof s[key]==='object'?JSON.stringify(s[key]):s[key])));
 host.append(el('p',null,tr('serviceRelation')+': '+(routeIds.join(' / ')||'UNKNOWN')),el('p',null,'Station–track anchors: UNKNOWN'));
 appendSource(host,s.sourceUrl);mountPopup(host,e.lngLat);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
