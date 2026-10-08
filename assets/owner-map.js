/* Owner-only MAP location editor. Loaded lazily only after RailwayAccess resolves admin. */
(()=>{
 'use strict';
 if(window.RailwayOwnerMap)return;
 const A=window.RailwayAccess;
 const PERSONAL='Personal Field-Validated Location',PUBLIC='Public Reference Location',PENDING='Pending Validation',VALID='Validated Location',ENGINEERING='Engineering/Survey Validated Location';
 let mounted=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
 const finite=v=>Number.isFinite(Number(v));
 const coord=v=>finite(v)?Number(v).toFixed(6):'—';
 const haversine=(a,b,c,d)=>{
  if(![a,b,c,d].every(finite))return null;
  const rad=x=>Number(x)*Math.PI/180,R=6371000,dLat=rad(c)-rad(a),dLon=rad(d)-rad(b);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
 };
 const selectedCode=r=>r?.overlay?.code||null;
 const selectedName=r=>r?.name||'';
 const selectedChainage=r=>r?.overlay?.chainage||null;
 const option=(v,label,selected)=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(label||v)+'</option>';

 function mount(ctx,slot,{force=false}={}){
  if(!A?.canAdmin||!slot){unmount();return;}
  if(mounted&&mounted.slot===slot&&!force){render();return;}
  unmount();
  mounted={ctx,slot,draft:null,current:null,currentMarker:null,draftMarker:null,dragMarker:null,mapClick:null,history:null,busy:false};
  render();
 }
 function unmount(){
  const s=mounted;if(!s)return;
  cleanupDraft(true);
  try{s.currentMarker?.remove();}catch{}
  mounted=null;
 }
 function record(){
  return mounted?.ctx?.getSelected?.()||null;
 }
 function setMessage(message,error=false){
  if(!mounted)return;
  const el=mounted.slot.querySelector('[data-owner-message]');
  if(el){el.textContent=message||'';el.classList.toggle('auth-error',Boolean(error));}
 }
 function baseControls(){
  const r=record(),code=selectedCode(r),cur=mounted.current;
  return '<section class="owner-map-panel">'+
   '<div class="owner-map-head"><span class="access-label">OWNER / ADMIN</span><strong>Location Management</strong></div>'+
   '<div class="owner-map-actions"><button type="button" data-owner-geolocate>MY CURRENT LOCATION</button>'+
   (code?'<button type="button" data-owner-edit>EDIT LOCATION</button><button type="button" data-owner-history>LOCATION HISTORY</button>':'')+
   '</div>'+
   (cur?'<div class="owner-current"><strong>Current Location</strong><span>'+coord(cur.lat)+', '+coord(cur.lon)+'</span>'+(cur.accuracy!=null?'<span>Current device accuracy: ±'+Math.round(cur.accuracy)+' m</span>':'<span>Current device accuracy: not reported by browser</span>')+(cur.accuracy!=null&&cur.accuracy>30?'<span class="owner-warning">Accuracy is poor for field confirmation. Review carefully before saving.</span>':'')+(code?'<button type="button" data-owner-use-current>USE CURRENT LOCATION FOR ASSET</button>':'')+'</div>':'<p class="owner-privacy">Device location is requested only when you tap the button. No background tracking or automatic persistence.</p>')+
   '<p data-owner-message class="owner-message" role="status"></p>'+
   '<div data-owner-workflow></div>'+
   '</section>';
 }
 function render(){
  if(!mounted||!A.canAdmin)return;
  mounted.slot.innerHTML=baseControls();
  bindBase();
  if(mounted.draft)renderDraft();
  else if(mounted.history)renderHistoryRows();
 }
 function bindBase(){
  const slot=mounted.slot;
  slot.querySelector('[data-owner-geolocate]')?.addEventListener('click',requestCurrentLocation,{once:true});
  slot.querySelector('[data-owner-edit]')?.addEventListener('click',beginEdit,{once:true});
  slot.querySelector('[data-owner-history]')?.addEventListener('click',loadHistory,{once:true});
  slot.querySelector('[data-owner-use-current]')?.addEventListener('click',useCurrentLocation,{once:true});
 }
 function requestCurrentLocation(){
  if(!mounted||!A.canAdmin)return;
  if(!navigator.geolocation){setMessage('Geolocation is not available in this browser.',true);bindBase();return;}
  setMessage('Requesting device location…');
  navigator.geolocation.getCurrentPosition(
   pos=>{
    if(!mounted||!A.canAdmin)return;
    const rawAccuracy=Number(pos.coords.accuracy);
    mounted.current={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:Number.isFinite(rawAccuracy)&&rawAccuracy>=0?rawAccuracy:null,observedAt:new Date().toISOString()};
    drawCurrentMarker();render();
   },
   error=>{if(mounted){setMessage('Device location unavailable: '+(error.message||'permission denied'),true);bindBase();}},
   {enableHighAccuracy:true,timeout:15000,maximumAge:0}
  );
 }
 function currentIcon(){
  return mounted.ctx.leaflet.divIcon({className:'railway-map-divicon',html:'<span class="railway-current-location-pin" aria-hidden="true"></span>',iconSize:[20,20],iconAnchor:[10,10]});
 }
 function draftIcon(){
  return mounted.ctx.leaflet.divIcon({className:'railway-map-divicon',html:'<span class="railway-draft-location-pin" aria-hidden="true"></span>',iconSize:[20,20],iconAnchor:[10,10]});
 }
 function drawCurrentMarker(){
  const s=mounted;if(!s?.current)return;
  try{s.currentMarker?.remove();}catch{}
  s.currentMarker=s.ctx.leaflet.marker([s.current.lat,s.current.lon],{icon:currentIcon(),keyboard:false,title:'Current device location'}).addTo(s.ctx.map);
  s.currentMarker.bindTooltip('Current device location'+(s.current.accuracy!=null?' · ±'+Math.round(s.current.accuracy)+' m':''),{direction:'top',offset:[0,-9]});
 }
 function confidenceOptions(current){
  const values=[PERSONAL,PUBLIC,PENDING];
  if([VALID,ENGINEERING].includes(current)&&!values.includes(current))values.unshift(current);
  return values.map(v=>option(v,v,current)).join('');
 }
 function beginEdit(){
  if(!mounted||!A.canAdmin)return;
  const r=record(),code=selectedCode(r);if(!r||!code){setMessage('Select an approved Corridor asset first.',true);return;}
  cleanupDraft(true);
  mounted.history=null;
  mounted.draft={
   assetId:code,name:selectedName(r),chainage:selectedChainage(r),previousLat:finite(r.lat)?Number(r.lat):null,previousLon:finite(r.lon)?Number(r.lon):null,
   previousConfidence:r.locationConfidence||PENDING,
   latitude:finite(r.lat)?Number(r.lat):null,longitude:finite(r.lon)?Number(r.lon):null,
   confidence:r.locationConfidence||PENDING,sourceNote:'',accuracyM:null,stage:'edit'
  };
  enableDraftInteraction();
  render();
 }
 function enableDraftInteraction(){
  const s=mounted,d=s?.draft;if(!s||!d)return;
  if(finite(d.latitude)&&finite(d.longitude))createDraftMarker();
  if(finite(d.previousLat)&&finite(d.previousLon)){
   try{s.ctx.map.setView([d.previousLat,d.previousLon],Math.max(s.ctx.map.getZoom?.()||0,16));}catch{}
  }
  s.mapClick=e=>{if(!mounted?.draft||mounted.draft.stage!=='edit')return;setDraftCoordinate(e.latlng.lat,e.latlng.lng,null);};
  try{s.ctx.map.on('click',s.mapClick);}catch{}
 }
 function createDraftMarker(){
  const s=mounted,d=s?.draft;if(!s||!d||!finite(d.latitude)||!finite(d.longitude))return;
  try{s.draftMarker?.remove();}catch{}
  s.draftMarker=s.ctx.leaflet.marker([d.latitude,d.longitude],{icon:draftIcon(),draggable:true,keyboard:true,title:'Proposed draft coordinate'}).addTo(s.ctx.map);
  s.draftMarker.bindTooltip('Proposed draft coordinate · not published',{direction:'top',offset:[0,-9]});
  s.draftMarker.dragging?.enable();
  s.draftMarker.on('dragend',onDraftDragEnd);
 }
 function onDraftDragEnd(e){
  const p=e.target.getLatLng();setDraftCoordinate(p.lat,p.lng,null,false);
 }
 function setDraftCoordinate(lat,lon,accuracy=null,moveMarker=true){
  const s=mounted,d=s?.draft;if(!s||!d)return;
  if(d.stage==='edit')syncDraftForm();
  d.latitude=Number(lat);d.longitude=Number(lon);d.accuracyM=accuracy==null?null:Number(accuracy);d.stage='edit';
  if(moveMarker){
   if(s.draftMarker?.setLatLng)s.draftMarker.setLatLng([d.latitude,d.longitude]);
   else createDraftMarker();
  }
  render();
 }
 function useCurrentLocation(){
  if(!mounted?.current||!A.canAdmin)return;
  if(!mounted.draft)beginEdit();
  if(!mounted?.draft)return;
  setDraftCoordinate(mounted.current.lat,mounted.current.lon,mounted.current.accuracy);
 }
 function resetDraft(){
  const s=mounted,d=s?.draft;if(!s||!d)return;
  d.latitude=finite(d.previousLat)?Number(d.previousLat):null;
  d.longitude=finite(d.previousLon)?Number(d.previousLon):null;
  d.accuracyM=null;d.stage='edit';
  try{s.draftMarker?.remove();}catch{}s.draftMarker=null;
  if(finite(d.latitude)&&finite(d.longitude))createDraftMarker();
  render();
 }
 function focusSelectedForEdit(){
  const s=mounted,d=s?.draft;if(!s||!d)return;
  const lat=finite(d.previousLat)?Number(d.previousLat):(finite(d.latitude)?Number(d.latitude):null);
  const lon=finite(d.previousLon)?Number(d.previousLon):(finite(d.longitude)?Number(d.longitude):null);
  if(finite(lat)&&finite(lon))try{s.ctx.map.setView([lat,lon],16);}catch{}
 }
 function syncDraftForm(){
  const form=mounted?.slot.querySelector('[data-owner-edit-form]');if(!form||!mounted?.draft)return;
  const fd=new FormData(form),d=mounted.draft;
  d.latitude=fd.get('latitude')===''?null:Number(fd.get('latitude'));
  d.longitude=fd.get('longitude')===''?null:Number(fd.get('longitude'));
  d.confidence=String(fd.get('confidence')||PENDING);
  d.sourceNote=String(fd.get('sourceNote')||'').trim();
 }
 function renderDraft(){
  const d=mounted.draft,work=mounted.slot.querySelector('[data-owner-workflow]');if(!work)return;
  if(d.stage==='review'){renderReview();return;}
  work.innerHTML='<form data-owner-edit-form class="owner-edit-form">'+
   '<h4>Edit → Draft Coordinate</h4>'+
   '<p><strong>'+esc(d.assetId)+' · '+esc(d.name)+'</strong></p>'+
   (d.chainage?'<p class="owner-hint">Chainage context: <strong>'+esc(d.chainage)+'</strong> · reference aid only; it does not move or snap the draft marker.</p>':'<p class="owner-hint">Chainage context: unavailable / not validated for this asset.</p>')+
   '<div class="owner-coordinate-grid"><label>Latitude<input name="latitude" type="number" step="0.000001" value="'+(d.latitude??'')+'" required></label><label>Longitude<input name="longitude" type="number" step="0.000001" value="'+(d.longitude??'')+'" required></label></div>'+
   '<label>Classification<select name="confidence">'+confidenceOptions(d.confidence)+'</select></label>'+
   '<label>Source / evidence note<textarea name="sourceNote" maxlength="2000" required placeholder="Describe the field pin, drawing, public reference or other evidence.">'+esc(d.sourceNote)+'</textarea></label>'+
   (d.accuracyM!=null?'<p class="'+(d.accuracyM>30?'owner-warning':'')+'">Device accuracy carried into draft: ±'+Math.round(d.accuracyM)+' m. Consumer GPS is not survey/GIS-grade.</p>':'<p class="owner-hint">Device accuracy was not reported. Treat this as field reference only unless supported by other evidence.</p>')+
   '<div class="owner-location-compare"><div><span>Current stored location</span><strong>'+esc(coord(d.previousLat)+', '+coord(d.previousLon))+'</strong></div><div><span>Proposed draft location</span><strong>'+esc(coord(d.latitude)+', '+coord(d.longitude))+'</strong></div></div>'+
   '<p class="owner-hint">The stored marker remains fixed. Drag the yellow draft marker or tap a precise point on the map. Railway reference tiles are a visual editing aid only and do not change confidence automatically.</p>'+
   '<div class="owner-map-actions"><button type="submit">REVIEW DRAFT</button><button type="button" data-owner-focus>FOCUS / CENTER SELECTED</button><button type="button" data-owner-reset>RESET DRAFT</button><button type="button" data-owner-cancel>CANCEL DRAFT</button></div>'+
   '</form>';
  const form=work.querySelector('[data-owner-edit-form]');
  form.addEventListener('submit',e=>{e.preventDefault();syncDraftForm();if(!finite(d.latitude)||!finite(d.longitude)){setMessage('A coordinate is required before review.',true);return;}if(d.sourceNote.length<4){setMessage('Add a source/evidence note before review.',true);return;}d.stage='review';renderDraft();});
  work.querySelector('[data-owner-focus]')?.addEventListener('click',focusSelectedForEdit);
  work.querySelector('[data-owner-reset]')?.addEventListener('click',resetDraft);
  work.querySelector('[data-owner-cancel]')?.addEventListener('click',()=>{cleanupDraft(true);mounted.draft=null;render();});
  for(const input of work.querySelectorAll('input[name=latitude],input[name=longitude]')){
   input.addEventListener('change',()=>{syncDraftForm();if(finite(d.latitude)&&finite(d.longitude))setDraftCoordinate(d.latitude,d.longitude,d.accuracyM);});
  }
 }
 function renderReview(){
  const d=mounted.draft,work=mounted.slot.querySelector('[data-owner-workflow]');
  const distance=haversine(d.previousLat,d.previousLon,d.latitude,d.longitude);
  work.innerHTML='<div class="owner-review">'+
   '<h4>Review → Owner Confirm → Publish</h4>'+
   '<dl class="map-member-detail">'+
    '<div><dt>Asset</dt><dd>'+esc(d.assetId+' · '+d.name)+'</dd></div>'+
    '<div><dt>Chainage context</dt><dd>'+esc(d.chainage||'—')+'</dd></div>'+
    '<div><dt>Previous coordinate</dt><dd>'+esc(coord(d.previousLat)+', '+coord(d.previousLon))+'</dd></div>'+
    '<div><dt>Proposed coordinate</dt><dd>'+esc(coord(d.latitude)+', '+coord(d.longitude))+'</dd></div>'+
    '<div><dt>Distance moved</dt><dd>'+(distance==null?'—':distance<1000?Math.round(distance)+' m':(distance/1000).toFixed(2)+' km')+'</dd></div>'+
    '<div><dt>Previous classification</dt><dd>'+esc(d.previousConfidence)+'</dd></div>'+
    '<div><dt>New classification</dt><dd>'+esc(d.confidence)+'</dd></div>'+
    '<div><dt>Evidence note</dt><dd>'+esc(d.sourceNote)+'</dd></div>'+
    (d.accuracyM!=null?'<div><dt>Device accuracy</dt><dd>±'+Math.round(d.accuracyM)+' m</dd></div>':'')+
   '</dl>'+
   (d.accuracyM>30?'<p class="owner-warning">Poor device accuracy. Confirm only if field evidence still supports this coordinate.</p>':'')+
   '<p class="owner-hint">Publishing updates the canonical Corridor record. Draft coordinates are not visible to Members or Public.</p>'+
   '<div class="owner-map-actions"><button type="button" data-owner-confirm>PUBLISH — OWNER CONFIRM</button><button type="button" data-owner-back>BACK TO EDIT</button><button type="button" data-owner-cancel>CANCEL</button></div>'+
   '</div>';
  work.querySelector('[data-owner-back]')?.addEventListener('click',()=>{d.stage='edit';renderDraft();});
  work.querySelector('[data-owner-cancel]')?.addEventListener('click',()=>{cleanupDraft(true);mounted.draft=null;render();});
  work.querySelector('[data-owner-confirm]')?.addEventListener('click',confirmPublish);
 }
 async function confirmPublish(){
  if(!mounted?.draft||mounted.busy||!A.canAdmin)return;
  const d=mounted.draft;
  if(!window.confirm('Publish this approved location to the canonical Corridor record?'))return;
  mounted.busy=true;setMessage('Publishing approved location…');
  try{
   await A.adminPublishLocation({assetId:d.assetId,latitude:d.latitude,longitude:d.longitude,confidence:d.confidence,sourceNote:d.sourceNote,accuracyM:d.accuracyM});
   cleanupDraft(false);mounted.draft=null;mounted.history=null;
   await mounted.ctx.refreshCanonical();
  }catch(error){mounted.busy=false;setMessage(error.message||String(error),true);render();}
 }
 function cleanupDraft(restoreApproved){
  const s=mounted,d=s?.draft;if(!s)return;
  if(s.mapClick){try{s.ctx.map.off('click',s.mapClick);}catch{}s.mapClick=null;}
  if(s.dragMarker){try{s.dragMarker.dragging?.disable();}catch{}s.dragMarker=null;}
  if(s.draftMarker){try{s.draftMarker.remove();}catch{}s.draftMarker=null;}
 }
 async function loadHistory(){
  if(!mounted||!A.canAdmin)return;
  const code=selectedCode(record());if(!code)return;
  setMessage('Loading location history…');
  try{mounted.history=await A.adminLocationHistory(code);render();}catch(error){setMessage(error.message||String(error),true);}
 }
 function renderHistoryRows(){
  const work=mounted.slot.querySelector('[data-owner-workflow]'),rows=mounted.history||[];
  work.innerHTML='<div class="owner-history"><h4>Approved Location History</h4>'+
   (rows.length?rows.map(v=>'<article><div><strong>v'+esc(v.version_id)+' · '+esc(v.action)+'</strong><span>'+esc(new Date(v.created_at).toLocaleString())+'</span></div><p>'+esc(coord(v.new_latitude)+', '+coord(v.new_longitude))+' · '+esc(v.new_confidence)+'</p><p>'+esc(v.source_note)+'</p><p class="owner-history-meta">Owner: '+esc(v.owner_user_id)+'</p><button type="button" data-owner-restore="'+esc(v.version_id)+'">RESTORE THIS APPROVED VERSION</button></article>').join(''):'<p>No Owner-published location versions yet.</p>')+
   '<button type="button" data-owner-history-close>CLOSE HISTORY</button></div>';
  work.querySelector('[data-owner-history-close]')?.addEventListener('click',()=>{mounted.history=null;render();});
  for(const button of work.querySelectorAll('[data-owner-restore]'))button.addEventListener('click',()=>restoreVersion(Number(button.dataset.ownerRestore)));
 }
 async function restoreVersion(versionId){
  if(!A.canAdmin||mounted.busy)return;
  const note=window.prompt('Reason/source note for restoring this approved location version:','Owner rollback after review');
  if(!note||note.trim().length<4)return;
  if(!window.confirm('Restore this approved location version to the canonical Corridor record?'))return;
  mounted.busy=true;setMessage('Restoring approved version…');
  try{
   await A.adminRestoreLocation(versionId,note.trim());
   mounted.history=null;
   await mounted.ctx.refreshCanonical();
  }catch(error){mounted.busy=false;setMessage(error.message||String(error),true);render();}
 }

 window.RailwayOwnerMap=Object.freeze({mount,unmount});
})();
