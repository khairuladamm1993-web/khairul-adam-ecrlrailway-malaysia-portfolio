/* D102 R1.6 user-interface: evidence-first modal UAT & track layout viewer.
 * Autosave is local; it cannot certify rail positioning or create surveyed geometry. */
(function(root){'use strict';
const Journey=root.MRS10D102JourneyControl,Layouts=root.MRS10AssetLayoutRegistry,sourceDocs=root.MRS10D102SourceDocuments;
if(!Journey||!Layouts||!sourceDocs)throw Error('R161_DEPENDENCIES_MISSING');
const journey=Journey.create(root.localStorage,root.MRS10ECRLChainage.records);
const layouts=Layouts.create(root.localStorage);
let map=null,fn=null,shownCode='STN01',error='',layoutError='',sourceStatus='',viewStarted=false;
const $=(tag,value,className)=>{const n=document.createElement(tag);if(value!==undefined&&value!==null)n.textContent=String(value);if(className)n.className=className;return n};
const ch=Journey.chLabel;
function current(){return fn?.getSession?.()||null}
function coords(p){
 if(p.code){
  const owner=root.MRS10ECRLD102PreflightUI?.getStore?.().candidate(p.code);
  if(owner)return {latitude:owner.latitude,longitude:owner.longitude,source:owner.source,confidence:'OWNER_MODEL_CANDIDATE_NOT_SURVEYED'};
  const station=root.MRS10ECRLStationIntelligence?.getStation(p.code);
  if(station?.referencePoint)return {latitude:station.referencePoint[1],longitude:station.referencePoint[0],source:station.sourceIds?.join(', ')||'PUBLIC_LOCALITY_REFERENCE',confidence:'STATION_PUBLIC_LOCALITY_REFERENCE_NOT_SURVEYED'};
 }
 if(p.latitude!=null&&p.longitude!=null)return {latitude:p.latitude,longitude:p.longitude,source:p.source||'INFRASTRUCTURE_IMPORT',confidence:'IMPORTED_UNVERIFIED'};
 return {latitude:null,longitude:null,source:'UNAVAILABLE',confidence:'COORDINATE_UNKNOWN'};
}
function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value}
function modal(){
 let dialog=document.getElementById('lab-r16-dialog');
 if(dialog)return dialog;
 dialog=$('dialog');dialog.id='lab-r16-dialog';dialog.className='lab-r16-dialog';
 document.body.append(dialog);return dialog;
}
function popup(){
 const p=journey.pending(),d=modal();if(!p){if(d.open)d.close();return}
 d.replaceChildren();
 const h=$('h2','D102 · '+({DEPARTURE:'Pengesahan sebelum berlepas',NEXT:'Checkpoint / lokasi berikutnya',ARRIVAL:'Ketibaan · pengesahan Owner',MANUAL_ARRIVAL:'CH · pengesahan Owner',INFRASTRUCTURE:'HENTI · semakan '+p.type})[p.phase]);d.append(h);
 d.append($('p',(p.code||p.name||p.type)+' · '+ch(p.CH)+' · '+p.type,'lab-r16-heading'));
 const c=coords(p);
 const info=$('p','Koordinat: '+(c.latitude===null?'BELUM DISAHKAN':c.latitude.toFixed(7)+'° N')+' / '+(c.longitude===null?'BELUM DISAHKAN':c.longitude.toFixed(7)+'° E')+' · '+c.confidence,'lab-trail-note');d.append(info);
 d.append($('p','CH rujukan bukan CH ukur fizikal. Jika nilai sebenar tidak tersedia, kekalkan BELUM DISAHKAN; ia tetap boleh direkod sebagai jurang data.','lab-r16-note'));
 const warn=$('ul',null,'lab-r16-unknown');
 const outstanding=[];
 if(c.latitude===null||c.longitude===null)outstanding.push('Latitude/longitude fizikal');
 if(!layouts.get(p.code||''))outstanding.push('Layout stesen / PL sumber');
 outstanding.push('Geometri centerline / track ID / residual CH');
 if(p.phase==='INFRASTRUCTURE')outstanding.push('Portal / struktur / QZ curve geometry & jarak ukur');
 for(const item of outstanding)warn.append($('li','Belum disahkan: '+item));
 d.append(warn);
 const fields=$('div',null,'lab-r16-fields');
 const make=(id,label,value,type='text')=>{const l=$('label',label),e=$('input');e.id=id;e.type=type;e.value=value??'';if(type==='number')e.step='any';l.append(e);fields.append(l);return e};
 const n=make('lab-r16-confirm-ch','CH pemerhatian (meter, tidak mengubah CH manifest)',String(p.CH),'number');
 const lat=make('lab-r16-confirm-lat','Latitude WGS84 (kosong jika belum ada)',c.latitude,'number');
 const lon=make('lab-r16-confirm-lon','Longitude WGS84 (kosong jika belum ada)',c.longitude,'number');
 const src=make('lab-r16-confirm-source','Sumber maklumat',c.source==='UNAVAILABLE'?'':c.source);
 const label=$('label','Catatan semakan'),note=$('textarea');note.id='lab-r16-confirm-note';note.rows=2;note.placeholder='Model / kawasan rujukan sahaja, belum survei';label.append(note);fields.append(label);d.append(fields);
 const actions=$('div',null,'lab-row'),ok=$('button','OK · Rekod & Teruskan'),later=$('button','Tunda / Kekal berhenti');
 ok.id='lab-r16-ack';later.id='lab-r16-hold';
 ok.onclick=()=>{try{
  const currentSession=current();if(!currentSession)throw Error('NO_SESSION');
  const result=journey.confirm(currentSession,{CH:n.value,latitude:lat.value,longitude:lon.value,source:src.value,note:note.value});
  if(result.action==='ADVANCE_CH_ONLY'){
   fn.advanceSession(result.moveTo); // persists the CH-only session before arrival popup
  }
  if(result.action==='RESUME_NEXT_CH_CHECKPOINT'){
   // A manual confirmed bridge/tunnel/QZ event resumes a CH-only model
   // automatically to the next registered stop. No physical train animation.
   const after=journey.confirm(current(),{CH:result.pending.CH,source:result.pending.source||'OWNER_CH_SIMULATED_RESUME',note:'CH-ONLY_AUTO_RESUME_AFTER_INFRA_CONFIRMATION'});
   if(after.action==='ADVANCE_CH_ONLY')fn.advanceSession(after.moveTo);
  }
  refresh();popup();
 }catch(e){setText('lab-r16-popup-error',String(e.message||e))}};
 later.onclick=()=>{if(d.open)d.close();refresh()};
 actions.append(ok,later);d.append(actions,$('p','', 'lab-r16-alert'));d.lastChild.id='lab-r16-popup-error';
 if(!d.open){try{d.showModal()}catch(_){d.setAttribute('open','')}}
}
function request(target){
 const s=current();if(!s)throw Error('NO_D102_SESSION');
 const p=journey.request(s,Number(target));refresh();popup();return p;
}
async function linkMap(){
 if(!map||!map.getStyle?.()||!map.isStyleLoaded?.())return;
 const source='mrs10-r16-layout-markers',layer='mrs10-r16-layout-icons',items=[];
 const attached=await sourceDocs.allSummaries().catch(()=>[]);
 const keyed=new Set([...layouts.all().map(x=>x.code),...attached.map(x=>x.assetCode)]);
 if(!map?.isStyleLoaded?.())return;
 for(const code of keyed){
  const entry={code};
  const station=root.MRS10ECRLStationIntelligence?.getStation(entry.code);
  const owner=root.MRS10ECRLD102PreflightUI?.getStore?.().candidate(entry.code);
  const loc=owner?[owner.longitude,owner.latitude]:station?.referencePoint;
  if(loc?.length===2)items.push({type:'Feature',geometry:{type:'Point',coordinates:loc},properties:{code:entry.code,provenance:owner?'OWNER_MODEL':'STATION_LOCALITY_REFERENCE',attachmentOnly:!layouts.get(entry.code)}});
 }
 const data={type:'FeatureCollection',features:items};
 if(map.getSource(source))map.getSource(source).setData(data);
 else map.addSource(source,{type:'geojson',data});
 if(!map.getLayer(layer)){
  map.addLayer({id:layer,type:'symbol',source,layout:{'text-field':'▣','text-size':24,'text-offset':[0,-1.15],'text-allow-overlap':true},
    paint:{'text-color':'#1c7c93','text-halo-color':'#fff','text-halo-width':2}});
  map.on('click',layer,e=>{const code=e.features?.[0]?.properties?.code;if(code)showLayout(code,true)});
 }
}
function showLayout(code,scroll=false){
 shownCode=code;renderLayout();
 if(scroll)document.getElementById('lab-r16-layout-panel')?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
}
function renderLayout(){
 const host=document.getElementById('lab-r16-layout-panel');if(!host)return;
 host.replaceChildren();host.append($('h2','Station / PL Intelligence · Import Layout'));
 host.append($('p','Terima gambar PNG/JPG/WEBP, PDF, layout JSON atau GeoJSON. Gambar/PDF dipaparkan sebagai dokumen asal sahaja; tidak ditukar automatik kepada landasan. Simpanan hanya pada browser ini.','lab-trail-note'));
 const sel=$('select');sel.id='lab-r16-layout-select';
 for(const r of root.MRS10ECRLChainage.records){const op=$('option',r.code+' · '+ch(r.metres));op.value=r.code;sel.append(op)}
 sel.value=shownCode;sel.onchange=()=>showLayout(sel.value);host.append(sel);
 const file=$('input');file.type='file';file.accept='.json,.geojson,application/json,'+sourceDocs.ACCEPT;file.id='lab-r16-layout-file';
 file.onchange=async()=>{try{const f=file.files?.[0];if(!f)throw Error('NO_FILE_SELECTED');
  if(!/\.(json|geojson)$/i.test(f.name)&&!(f.type==='application/json')){
   await importMediaFile(f,shownCode,host.querySelector('#lab-r161-source-ref')?.value||'OWNER_IMPORTED_LOCAL_VISUAL_REFERENCE_UNVERIFIED');return;
  }
  if(f.size>1300000)throw Error('LAYOUT_JSON_MAX_1_3_MB');
  const v=JSON.parse(await f.text());
  const candidates=Array.isArray(v.layouts)?v.layouts:[v];
  if(candidates.some(x=>!x.code&&!x.assetCode)&&v?.type!=='FeatureCollection')throw Error('LAYOUT_MUST_SPECIFY_STATION_OR_PL_CODE');
  const result=v?.type==='FeatureCollection'?layouts.ingestGeoJSON(v):layouts.ingest(v);shownCode=result[0].code;layoutError='Layout source imported: '+result.map(x=>x.code+' ('+x.tracks+' track)').join(', ');
  renderLayout();linkMap();
 }catch(e){layoutError='IMPORT ERROR: '+e.message;renderLayout()}};
 const sourceLabel=$('label','Sumber gambar / PDF (nota rujukan, belum disahkan)'),reference=$('input');reference.id='lab-r161-source-ref';reference.value='OWNER_IMPORTED_LOCAL_VISUAL_REFERENCE_UNVERIFIED';reference.maxLength=350;sourceLabel.append(reference);host.append(sourceLabel);
 const fileLabel=$('label','Import layout STN/PL · PNG/JPG/PDF/GeoJSON/JSON');fileLabel.append(file);host.append(fileLabel);
 const doc=layouts.get(shownCode);
 if(doc){
  host.append($('strong',doc.title+' · '+doc.code+' · '+ch(doc.CH)));
  const svg=layouts.renderSVG(shownCode);if(svg)host.append(svg);
  host.append($('p',doc.tracks.length+' trek berasaskan fail · '+doc.source+' · '+doc.status,'lab-r16-note'));
 }else host.append($('p','Tiada layout sumber untuk '+shownCode+'; susunan trek tidak direka.','lab-r16-note'));
 const list=$('details');list.append($('summary','Lay out yang telah diimport: '+layouts.all().length));
 for(const l of layouts.all()){const b=$('button',l.code+' · '+l.tracks+' tracks');b.type='button';b.onclick=()=>showLayout(l.code);list.append(b)}
 host.append(list,$('p',layoutError,'lab-r16-alert'));
 sourceDocs.render(shownCode,host).catch(e=>{layoutError='Dokumen sumber: '+e.message});
}
async function importMediaFile(file,assetCode,source){
 const code=String(assetCode||shownCode).toUpperCase();
 const entry=await sourceDocs.save(file,code,source);
 shownCode=code;
 layoutError='Gambar/PDF sumber disimpan untuk '+code+': '+entry.fileName+' · belum disahkan sebagai geometri.';
 renderLayout();linkMap();
 if(code.startsWith('STN'))root.MRS10ECRLStationMap?.select?.(code,false);
 return {category:'STATION_PL_SOURCE_MEDIA',code,fileName:entry.fileName,view:entry.view,publicPublished:false};
}
function renderEvents(){
 const host=document.getElementById('lab-r16-infrastructure');if(!host)return;host.replaceChildren();
 host.append($('h2','D102 · Infra Checkpoint: Jambatan / Terowong / QZ'));
 host.append($('p','Peristiwa infrastruktur hanya akan menghentikan model CH selepas lokasi CH dimasukkan atau diimport. Ia bukan pengesanan automatik daripada imej satelit.','lab-trail-note'));
 const sel=$('select');sel.id='lab-r16-infra-type';
 for(const type of Journey.EVENT_TYPES){const o=$('option',type);o.value=type;sel.append(o)}
 host.append(sel);
 const make=(id,placeholder,type='text')=>{const i=$('input');i.id=id;i.placeholder=placeholder;i.type=type;if(type==='number')i.step='any';host.append(i);return i};
 const CH=make('lab-r16-infra-ch','Current CH meter · contoh 123456','number'),source=make('lab-r16-infra-source','Sumber CH / geometry'),name=make('lab-r16-infra-name','Nama aset (pilihan)');
 const lat=make('lab-r16-infra-lat','Latitude jika ada','number'),lon=make('lab-r16-infra-lon','Longitude jika ada','number');
 const add=$('button','Rekod peristiwa infrastruktur');add.onclick=()=>{try{
  const res=journey.registerInfrastructure({type:sel.value,CH:CH.value,source:source.value,name:name.value,latitude:lat.value,longitude:lon.value});
  error='Event disimpan: '+res.type+' '+ch(res.CH)+' · unverified';refresh();
 }catch(e){error=e.message;refresh()}};host.append(add);
 const l=$('details');l.append($('summary','Peristiwa rujukan disimpan: '+journey.infrastructure().length));
 for(const ev of journey.infrastructure())l.append($('p',ev.type+' · '+ch(ev.CH)+' · '+ev.name+' · '+ev.source));
 host.append(l,$('p',error,'lab-r16-alert'));
 const file=$('input');file.type='file';file.accept='.json,application/json';file.id='lab-r16-infra-file';
 file.onchange=async()=>{try{const f=file.files?.[0];if(!f||f.size>1300000)throw Error('EVENT_FILE_MAX_1_3_MB');
  const data=JSON.parse(await f.text());const entries=data.infrastructure||data.events;
  if(!Array.isArray(entries)||entries.length>100)throw Error('EXPECT_INFRASTRUCTURE_ARRAY_MAX_100');
  for(const item of entries)journey.registerInfrastructure(item);
  error=entries.length+' infrastructure events imported';refresh();
 }catch(e){error='IMPORT ERROR: '+e.message;refresh()}};
 const label=$('label','Import senarai CH jambatan / terowong / QZ (JSON)');label.append(file);host.append(label);
}
function refresh(){
 const host=document.getElementById('lab-r16-status');if(host){
  const s=journey.snapshot(),session=current();
  host.replaceChildren();host.append($('h2','D102 Journey Control · R1.6'));
  host.append($('p','CH '+(session?ch(session.currentCH):'UNKNOWN')+' · '+s.ledgerCount+' log events · '+s.infrastructure.length+' rujukan infrastruktur · '+s.storage));
  host.append($('p','Jarak dan kedudukan GPS fizikal: BELUM DISAHKAN. Makmal ini bergerak CH sahaja.','lab-trail-note'));
  const ex=$('button','Eksport sejarah D102 R1.6 JSON');ex.onclick=()=>{
   const blob=new Blob([JSON.stringify(journey.exportData(),null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=$('a');a.href=url;a.download='private-d102-r16-journey-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  };host.append(ex);
  const backupLabel=$('label','Import sandaran sesi lama R1.5/R1.6 · sambung CH tanpa mula semula');
  const backup=$('input');backup.type='file';backup.accept='.json,application/json';backup.id='lab-r16-backup-file';
  backup.onchange=async()=>{try{
    const file=backup.files?.[0];if(!file||file.size>1800000)throw Error('BACKUP_MAX_1_8MB');
    const input=JSON.parse(await file.text());
    if(!input||input.schema!==1||!input.session)throw Error('EXPECTED_R15_SESSION_BACKUP_SCHEMA_1');
    if(!root.confirm('Import sandaran akan menggantikan CH sesi yang sedang dipaparkan. Jurnal R1.6 kekal. Teruskan?'))return;
    const restored=fn.restoreSession(input.session);
    sourceStatus='Sesi dipulihkan pada '+ch(restored.currentCH)+' · geometri dan data sensitif tidak diimport automatik';
    refresh();
  }catch(e){sourceStatus='IMPORT BACKUP ERROR: '+String(e.message||e);refresh()}};
  backupLabel.append(backup);host.append(backupLabel,$('p',sourceStatus,'lab-r16-note'));
  const history=$('details');history.append($('summary','Sejarah perjalanan dan confirmation · '+s.ledgerCount));
  const list=$('ol');for(const ev of s.ledger.slice(-80))list.append($('li',ev.type+' · '+ch(ev.CH??0)+' · '+(ev.code||ev.id||'')+' · '+ev.time));
  history.append(list);host.append(history);
 }
 renderLayout();renderEvents();linkMap();
}
function importPayload(data){
 if(data?.type==='FeatureCollection'&&data.features?.length&&data.features.every(x=>x.properties?.assetCode||x.properties?.stationCode||x.properties?.loopCode)){
  const loaded=layouts.ingestGeoJSON(data);shownCode=loaded[0].code;layoutError='Source GeoJSON schematic: '+loaded.map(x=>x.code).join(', ');refresh();
  return {category:'TRACK_LAYOUT_GEOJSON',assets:loaded};
 }
 if(Array.isArray(data?.layouts)||(data?.tracks&&Array.isArray(data?.tracks))){
  const loaded=layouts.ingest(data);shownCode=loaded[0].code;layoutError='Imported '+loaded.map(x=>x.code).join(', ');refresh();
  return {category:'TRACK_LAYOUT',assets:loaded};
 }
 const entries=data?.infrastructure||data?.events;
 if(Array.isArray(entries)){
  if(entries.length>100)throw Error('MAX_100_INFRA_EVENTS_PER_FILE');
  const accepted=entries.map(journey.registerInfrastructure);error=accepted.length+' CH infrastructure imported';refresh();
  return {category:'INFRASTRUCTURE_EVENTS',events:accepted};
 }
 return null;
}
function cancelPending(){journey.clearPending();popup();refresh()}
function movementApplied(fromCH,toCH){journey.movementApplied(fromCH,toCH);refresh()}
function newRun(origin,destination){journey.newRun(origin,destination);refresh()}
function connect(options){
 fn=options;map=options.map;const retry=()=>linkMap();
 if(map){map.on('load',retry);map.on('style.load',retry)}
 journey.syncSession(current());refresh();
 if(journey.pending())popup();
}
const api=Object.freeze({connect,request,refresh,showLayout,importPayload,importMediaFile,cancelPending,movementApplied,newRun,pending:()=>journey.pending(),snapshot:()=>({journey:journey.snapshot(),layouts:layouts.snapshot(),sourceDocuments:sourceDocs.snapshot()})});
root.MRS10D102JourneyUI=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
