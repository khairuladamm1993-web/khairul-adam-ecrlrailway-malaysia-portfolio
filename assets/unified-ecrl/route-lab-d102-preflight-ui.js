/* Owner-only MODEL candidate coordinate confirmation UI.
 * This isolated preview has NO AUTHENTICATION. Never place private/restricted
 * rail engineering location data here; localStorage is not secure cloud storage.
 * CH distance cannot mathematically infer lat/lon. */
(function(root){'use strict';
const engine=root.MRS10ECRLD102Preflight,observations=root.MRS10ECRLD102Observations;
if(!engine||!observations)throw Error('D102_PREFLIGHT_DEPENDENCIES_MISSING');
const store=engine.create(root.localStorage),log=observations.create(root.localStorage);
let selected='STN01',message='',logMessage='',map=null,pickOnMap=false;
const $=(tag,txt,cls)=>{const el=document.createElement(tag);if(txt!==undefined&&txt!==null)el.textContent=String(txt);if(cls)el.className=cls;return el};
const text={
 ms:{head:'D102 · Pemeriksaan Sebelum Perjalanan',notice:'Calon koordinat Owner untuk SIMULASI sahaja. Tiada pengesahan ukur as-built. Jangan masukkan lokasi rahsia atau dokumen terhad pada Preview ini.',status:'Status koordinat',confirm:'Sahkan calon koordinat model',undo:'Batalkan pengesahan',source:'Sumber koordinat / URL / nama dokumen',note:'Nota bukti & alasan penilaian Owner (min 10 aksara)',map:'Ambil koordinat daripada tap pada peta (cadangan sahaja)',start:'STN / PL',before:'Beza CH dari checkpoint sebelumnya',candidate:'Calon semasa',geo:'Jarak terus antara calon bersebelahan ialah batas minimum, bukan laluan rel.',export:'Eksport rekod Owner (PRIVATE JSON)',missing:'Belum disahkan untuk model',done:'Direkod sebagai calon simulasi; bukan surveyed',mapmsg:'Tap peta sekali untuk mengisi calon lat/lon; semak jalan raya, rel dan bukti sebelum mengesahkan.',extra:'D102 · Log data sepanjang simulasi',obs:'Jenis pemerhatian',title:'Tajuk data',details:'Catatan teknikal dan rujukan',capture:'Rekod pemerhatian pada CH semasa',obsExport:'Eksport D102 Data Log JSON',gate:'Tidak dibenarkan menjalankan tren atas peta sehingga geometri rel vektor dan anchor disahkan.',privacy:'Penyimpanan setempat pada browser sahaja. Salinan JSON perlu disimpan secara peribadi.'},
 en:{head:'D102 · Pre-Run Coordinate Review',notice:'Owner coordinate candidates are for SIMULATION ONLY, not as-built survey validation. Do not enter restricted site coordinates.',status:'Coordinate status',confirm:'Confirm model coordinate candidate',undo:'Revoke review',source:'Coordinate source / URL / document',note:'Owner evidence and review rationale (min 10 characters)',map:'Use map tap as candidate only',start:'Station / Loop',before:'CH delta from previous asset',candidate:'Current candidate',geo:'Straight-line distance is a lower bound, not a rail alignment.',export:'Export Owner register (PRIVATE JSON)',missing:'Not model-confirmed',done:'Recorded as simulation candidate, not surveyed',mapmsg:'Tap once to fill coordinates; verify rails and source before approval.',extra:'D102 · Journey data log',obs:'Observation category',title:'Data title',details:'Technical observation and reference',capture:'Record at current CH',obsExport:'Export D102 data log JSON',gate:'Map-based train movement blocked until vector rail geometry and CH anchors are validated.',privacy:'Browser storage only. Retain private JSON backup.'}
};
function t(){return text[root.document.documentElement.lang==='en'?'en':'ms']}
function getAsset(){return engine.controls.find(x=>x.code===selected)}
function download(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=$('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000)}
function setMap(m){map=m}
function preflight(){
 const host=document.getElementById('lab-d102-preflight');if(!host)return;
 const lang=t(),asset=getAsset(),snap=store.snapshot(),summary=snap.summary,found=store.candidate(selected);
 host.replaceChildren();host.append($('h2',lang.head),$('p',lang.notice,'lab-trail-note'));
 const line=$('p',lang.status+': '+summary.completed+'/'+summary.total+' · STN '+summary.stations+' · PL '+summary.passingLoops,'lab-owner-counter');
 host.append(line);
 const progress=$('progress');progress.max=23;progress.value=summary.completed;host.append(progress);
 if(summary.issues.length){const issue=$('details');issue.append($('summary',summary.issues.length+' CH lower-bound anomalies'));for(const x of summary.issues)issue.append($('p',x));host.append(issue)}
 const selection=$('label',lang.start),sel=$('select');sel.id='lab-preflight-asset';
 for(const c of engine.controls){const complete=!!store.candidate(c.code),o=$('option',(complete?'✓ ':'○ ')+c.code+' · '+c.name+' · '+c.CHLabel);o.value=c.code;sel.append(o)}sel.value=selected;sel.onchange=()=>{selected=sel.value;message='';preflight()};selection.append(sel);host.append(selection);
 const grid=$('div',null,'lab-grid'),la=$('label','Latitude (WGS84)'),lo=$('label','Longitude (WGS84)');
 const a=$('input'),b=$('input');a.id='lab-preflight-lat';b.id='lab-preflight-lon';
 a.type='number';b.type='number';a.step=b.step='any';a.inputMode=b.inputMode='decimal';a.min=1;a.max=7;b.min=99;b.max=105;
 const ref=asset.publicReference;
 a.value=found?.latitude??ref?.latitude??'';b.value=found?.longitude??ref?.longitude??'';
 la.append(a);lo.append(b);grid.append(la,lo);host.append(grid);
 host.append($('p',asset.code+' · '+asset.name+' · '+asset.CHLabel+' · '+asset.section+' · '+asset.type,'lab-note'));
 host.append($('p',lang.before+': '+(asset.deltaPreviousKm==null?'START':asset.deltaPreviousKm.toFixed(3)+' km')+' · '+(ref?'Public locality reference (not surveyed)':'No coordinate reference'),'lab-note'));
 if(found)host.append($('p',lang.candidate+': '+found.latitude+', '+found.longitude+' · '+found.status,'lab-owner-counter'));
 else host.append($('p',lang.missing,'lab-note'));
 const source=$('label',lang.source),sin=$('input');sin.id='lab-preflight-source';sin.placeholder='e.g. Public ECRL locality / drawing reference';
 sin.value=found?.source||asset.publicSource||'';source.append(sin);host.append(source);
 const note=$('label',lang.note),nin=$('textarea');nin.id='lab-preflight-note';nin.rows=2;nin.value=found?.note||'';note.append(nin);host.append(note);
 const approval=$('label'),cb=$('input');cb.type='checkbox';cb.id='lab-preflight-owner-ack';approval.className='lab-owner-checkbox';approval.append(cb,$('span','Saya sahkan untuk MODEL simulasi, bukan koordinat survei rasmi / Confirm as model candidate ONLY'));host.append(approval);
 const actions=$('div',null,'lab-row'),btn=$('button',lang.confirm);btn.type='button';btn.onclick=()=>{try{if(!cb.checked)throw Error('OWNER_MODEL_ACK_REQUIRED');store.check(selected,a.value,b.value,sin.value,nin.value);message=lang.done;preflight()}catch(e){message=e.message;showMessage()}};actions.append(btn);
 const cancel=$('button',lang.undo);cancel.type='button';cancel.disabled=!found;cancel.onclick=()=>{store.revoke(selected);message='';preflight()};actions.append(cancel);
 const picker=$('button',lang.map);picker.type='button';picker.onclick=()=>{pickOnMap=true;message=lang.mapmsg;showMessage()};actions.append(picker);
 host.append(actions);
 const second=$('div',null,'lab-row'),exportBtn=$('button',lang.export);exportBtn.type='button';exportBtn.onclick=()=>download('private-mrs10-owner-23-coordinate-candidates.json',store.serialize());second.append(exportBtn);host.append(second);
 host.append($('p',lang.geo,'lab-note'),$('p',lang.gate,'lab-trail-note'),$('p',lang.privacy,'lab-note'));
 const details=$('details');details.append($('summary','23 checkpoint · '+summary.completed+' candidate models'));
 const items=$('ol');
 for(const c of engine.controls)items.append($('li',(store.candidate(c.code)?'✓ ':'○ ')+c.code+' '+c.CHLabel+' · '+c.name+(c.type==='PASSING_LOOP'?' [PL]':'')));
 details.append(items);host.append(details);host.append($('p',message,'lab-alert'));showMessage();
}
function showMessage(){const host=document.getElementById('lab-d102-preflight');if(!host)return;const p=host.querySelector('.lab-alert');if(p)p.textContent=message;}
function observe(){
 const host=document.getElementById('lab-d102-observations');if(!host)return;
 const lang=t(),snapshot=log.snapshot();host.replaceChildren();
 host.append($('h2',lang.extra),$('p','Events: '+snapshot.observationCount+' · CH-only · no GPS/rail physical telemetry','lab-note'));
 const type=$('label',lang.obs),choose=$('select');choose.id='lab-obs-type';
 for(const v of observations.TYPES){const o=$('option',v.replaceAll('_',' '));o.value=v;choose.append(o)}type.append(choose);host.append(type);
 const title=$('label',lang.title),name=$('input');name.id='lab-obs-title';name.placeholder='Station, grade, bridge, tunnel, turnout...';title.append(name);host.append(title);
 const evidence=$('label','Evidence class'),classes=$('select');classes.id='lab-obs-evidence';
 for(const v of ['SIMULATED','PUBLIC_REFERENCE','OWNER_FIELD_NOTE_UNVERIFIED']){const o=$('option',v);o.value=v;classes.append(o)}evidence.append(classes);host.append(evidence);
 const notes=$('label',lang.details),n=$('textarea');n.id='lab-obs-notes';n.rows=3;notes.append(n);host.append(notes);
 const source=$('label',lang.source),si=$('input');si.id='lab-obs-source';si.value='OWNER_SIMULATED_OBSERVATION';source.append(si);host.append(source);
 const actions=$('div',null,'lab-row'),record=$('button',lang.capture);record.onclick=()=>{try{const ch=root.MRS10ECRLRouteLab?.snapshot()?.session?.currentCH??670;log.log({type:choose.value,title:name.value,notes:n.value,evidenceClass:classes.value,source:si.value},ch);logMessage='OBSERVATION_SAVED_ON_DEVICE';observe()}catch(e){logMessage=e.message;const m=host.querySelector('.lab-alert');if(m)m.textContent=logMessage}};actions.append(record);
 const exp=$('button',lang.obsExport);exp.onclick=()=>download('private-mrs10-d102-observations.json',log.exportLog());actions.append(exp);host.append(actions);
 const details=$('details');details.append($('summary','Event log · '+snapshot.observationCount));
 const items=$('ol');for(const item of snapshot.observations.slice(-30))items.append($('li',item.CHLabel+' · '+item.type+' · '+item.title));
 details.append(items);host.append(details,$('p',logMessage,'lab-alert'));
}
function connect(map){
 setMap(map);
 map.on('click',e=>{if(!pickOnMap)return;pickOnMap=false;if(!e?.lngLat)return;
  const a=document.getElementById('lab-preflight-lat'),b=document.getElementById('lab-preflight-lon');
  if(a&&b){a.value=e.lngLat.lat.toFixed(7);b.value=e.lngLat.lng.toFixed(7)}
  message='MAP_TAP_CANDIDATE_ONLY_NOT_RAIL_SURVEY';showMessage();
 });
 preflight();observe();
}
const api=Object.freeze({connect,render:()=>{preflight();observe()},snapshot:()=>({preflight:store.snapshot().summary,observationCount:log.snapshot().observationCount,fullGeographicRunAllowed:false}),getStore:()=>store,getObservations:()=>log});
root.MRS10ECRLD102PreflightUI=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
