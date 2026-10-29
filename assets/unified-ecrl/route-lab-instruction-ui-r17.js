/* D102 owner instruction runner UI. Upload JSON / UTF-8 text containing JSON.
 * Never execute arbitrary ChatGPT code or assume live remote ChatGPT access. */
(function(root){'use strict';
const Engine=root.MRS10D102InstructionRunner,Auditor=root.MRS10D102EngineeringAssistant;
if(!Engine||!Auditor)throw Error('MR_S10_R17_SCRIPT_DEPENDENCIES_MISSING');
let engine=null,deps=null,notice='',media=[],audit=null,masterLink=null;
const $=(tag,label,css)=>{const n=document.createElement(tag);if(label!==undefined&&label!==null)n.textContent=String(label);if(css)n.className=css;return n};
function saveFile(name,data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=$('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),6000);
}
const sample=()=>({
 schema:Engine.SCHEMA,bundleId:'adam-d102-owner-example-001',issuedBy:'ChatGPT-Adam',
 purpose:'Makmal STN01 dahulu; contoh arahan model, bukan arahan operasi ECRL',
 commands:[
  {id:'FOCUS-STN01',action:'FOCUS_ASSET',assetCode:'STN01',
   note:'Buka Station Intelligence dan dokumen import STN01'},
  {id:'GAP-TRACK-STN01',action:'FLAG_GEOMETRY_GAP',assetCode:'STN01',field:'TRACK_CENTERLINE',
   reason:'Jajaran rel georeferenced/as-built STN01 belum diverifikasi; jangan buat garisan rel sintetik',
   source:'MR-S10 Owner review only'},
  {id:'PLAN-NEXT-STN02',action:'QUEUE_CH_TARGET',assetCode:'STN02',CH:33700,
   note:'Guna popup departure/next/arrival Owner; CH model sahaja'}
 ]
});
function show(){
 const host=document.getElementById('lab-r17-instruction-runner');if(!host||!engine)return;
 engine.sync();
 const state=engine.snapshot();
 host.replaceChildren();
 host.append($('h2','MR-S10 Assistant · ChatGPT Adam Instruction Runner'));
 host.append($('p','Import fail arahan JSON / teks UTF-8 berstruktur JSON ketika sesi D102 berjalan. Hanya tindakan dalam senarai putih dibenarkan. Tiada pelaksanaan kod bebas, akses AI server automatik atau kemas kini Production.','lab-trail-note'));
 const row=$('div',null,'lab-r17-status-row');
 row.append($('span','D102 sekarang: '+(deps.getSession()?.currentCH??'UNKNOWN')+' m · '+(state.active?.bundleId||'Tiada bundle')));
 row.append($('span',state.active?.reviewStatus||'WAITING_FILE'));
 host.append(row);
 const file=$('input');file.type='file';file.accept='.json,.txt,.md,application/json,text/plain,text/markdown';
 file.id='lab-r17-instruction-file';file.setAttribute('aria-label','Import fail arahan ChatGPT Adam');
 file.onchange=async()=>{
  try{
   const f=file.files?.[0];if(!f||f.size<10||f.size>Engine.MAX_BYTES)throw Error('FILE_MUST_BE_JSON_TEXT_UNDER_128KB');
   let text=await f.text();
   text=text.trim().replace(/^\u0060\u0060\u0060(?:json)?\s*/i,'').replace(/\s*\u0060\u0060\u0060$/,'').trim();
   const parsed=JSON.parse(text),preview=Engine.validate(parsed);
   engine.load(parsed);notice='Bundle '+preview.bundleId+' diterima untuk semakan. Tiada arahan telah dijalankan.';
  }catch(err){notice='IMPORT DITOLAK: '+String(err.message||err).slice(0,180)}
  show();
 };
 const label=$('label','Fail arahan ChatGPT Adam (.json / .txt / .md JSON sahaja)');
 label.append(file);host.append(label);
 const actions=$('div',null,'lab-row'),tmpl=$('button','Muat turun templat arahan'),auditButton=$('button','Eksport audit 23 checkpoint');
 tmpl.type='button';tmpl.onclick=()=>saveFile('mrs10-chatgpt-adam-instruction-template.json',sample());
 auditButton.type='button';auditButton.onclick=()=>{const data=Auditor.report({...deps,getAttachments:()=>media});saveFile('mrs10-d102-23-checkpoint-engineering-gaps.json',data)};
 actions.append(tmpl,auditButton);host.append(actions);
 if(state.active){
  const p=$('p','Bundle: '+state.active.bundleId+' · '+state.active.commands.length+' arahan · '+state.active.purpose);
  host.append(p);
  const confirm=$('button','Saya semak & luluskan bundle untuk simulasi CH sahaja');
  confirm.type='button';confirm.disabled=state.active.reviewStatus==='OWNER_APPROVED';
  confirm.onclick=()=>{if(!root.confirm('Luluskan bundle arahan ini untuk tindakan simulasi sahaja? Setiap arahan masih memerlukan klik berasingan. Tiada akses kod bebas.'))return;
   try{engine.approve();notice='BUNDLE_APPROVED_MODEL_ONLY';show()}catch(e){notice=e.message;show()}};
  host.append(confirm);
  const list=$('ol',null,'lab-r17-queue');
  for(const c of state.active.commands){
   const line=$('li',null,'lab-r17-command');
   line.append($('strong',c.id+' · '+c.action+' · '+c.status));
   line.append($('p',c.note||[c.assetCode,c.field,c.CH].filter(x=>x!==undefined).join(' · '),'lab-r16-note'));
   if(c.status==='PENDING_OWNER'&&state.active.reviewStatus==='OWNER_APPROVED'){
    const run=$('button','Jalankan arahan ini'),skip=$('button','Langkau');
    run.type=skip.type='button';run.onclick=()=>{try{const result=engine.execute(c.id);
     notice='Arahan '+c.id+': '+result.status+' · '+result.result;
     show()}catch(e){notice='TIDAK DILAKSANAKAN: '+e.message;show()}};
    skip.onclick=()=>{try{engine.dismiss(c.id);notice='Arahan dilangkau oleh Owner';show()}catch(e){notice=e.message;show()}};
    line.append(run,skip);
   }
   if(c.status==='WAITING_OWNER_POPUP')line.append($('p','Selesaikan popup D102 sedia ada dahulu; arahan seterusnya akan dibuka selepas pengesahan CH.','lab-r16-note'));
   list.append(line);
  }
  host.append(list);
 }
 host.append($('p',notice,'lab-r17-message'));
 const aud=Auditor.report({...deps,getAttachments:()=>media});audit=aud;
 const details=$('details');details.id='lab-r17-engineering-audit';
 details.append($('summary','Pembantu audit ECRL · 16 STN + 7 PL · data belum lengkap'));
 const lines=$('div',null,'lab-r17-metrics');
 for(const v of [
  'CH manifest: '+aud.recordedCHAnchors+' / 23',
  'Model koordinat Owner: '+aud.modelCoordinateCandidates+' / 23',
  'Layout SVG sumber: '+aud.diagramsCount+' / 23',
  'Imej/PDF setempat: '+aud.sourceMediaReferences,
  'Bridge/tunnel/QZ rujukan: '+aud.infrastructureReferenceCount,
  'Geometri rel fizikal penuh: BELUM DISAHKAN'
 ])lines.append($('p',v));
 details.append(lines);
 const list=$('ol',null,'lab-r17-gaps');
 for(const v of aud.assets){
  const li=$('li',v.code+' · '+v.CHLabel+' · '+(v.ownerModelCandidate?'Calon WGS84 tersedia':'Koordinat belum disemak')+
    ' · '+(v.layoutSchematicImported?'SVG sumber ada':'Trek layout belum bervektor'));
  list.append(li);
 }
 details.append(list,$('p','Pembantu ini ialah audit peraturan/deterministik, BUKAN model AI autonomi atau pengukuran rel fizikal.','lab-trail-note'));
 host.append(details);
 const complete=root.MRS10D102MasterHandoff.readiness(engine.snapshot());
 const archive=$('button',complete.readyForPortableArchive?'Eksport 1 fail induk ECRL untuk PWA':'Fail induk: tunggu semua arahan selesai');
 archive.type='button';archive.id='lab-r17-master-export';archive.disabled=!complete.readyForPortableArchive;
 archive.onclick=async()=>{
  archive.disabled=true;archive.textContent='Menyediakan satu fail lengkap...';
  try{
   const payload=await root.MRS10D102MasterHandoff.create({
    getInstructions:()=>engine.exportData(),
    getLayouts:deps.getLayouts,getJourney:deps.getJourney,getSession:deps.getSession,
    getAudit:()=>Auditor.report({...deps,getAttachments:()=>media}),
    getImportedGeometry:deps.getImportedGeometry
   },{includeMedia:true});
   if(masterLink?.url)URL.revokeObjectURL(masterLink.url);
   const fileName='MR-S10-ECRL-D102-MASTER-CH-STN-PL-TRACK-HANDOFF-v1.json';
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
   masterLink={url:URL.createObjectURL(blob),fileName,bytes:blob.size};
   // Explicit second tap reliably downloads on iOS Safari even after async IndexedDB reads.
   // Do not auto-download via a suspended user gesture after asynchronous attachment loading.
   notice='FAIL INDUK DICIPTA: '+payload.assetRegistry.length+' checkpoints · '+payload.trackLayoutMedia.length+' dokumen · GEOFIZIKAL BELUM DISAHKAN';
  }catch(e){notice='EKSPORT DITAHAN: '+String(e.message||e).slice(0,170)}
  show();
 };
 host.append(archive,$('p','Selepas semua arahan Owner selesai, satu JSON induk mengandungi 23 CH, layout STN/PL yang tersedia, data trek, imej/PDF sumber (maksimum 22 MB), checkpoint D102 dan audit provenance. Geometri yang belum sah tetap UNKNOWN.','lab-r16-note'));
 if(masterLink){
  const link=$('a','Muat turun fail induk ECRL · '+(masterLink.bytes/1024/1024).toFixed(2)+' MB');
  link.id='lab-r17-master-download';link.href=masterLink.url;link.download=masterLink.fileName;
  link.className='lab-r161-open';host.append(link);
 }
 const exportButton=$('button','Eksport sejarah arahan & audit'),foot=$('p','Disimpan pada browser Preview ini sahaja. Setiap domain Vercel berbeza memerlukan eksport/import rekod.','lab-r16-note');
 exportButton.onclick=()=>saveFile('private-mrs10-chatgpt-adam-instruction-runner-audit.json',engine.exportData());
 host.append(exportButton,foot);
}
async function refresh(){
 if(!engine)return;
 try{media=await root.MRS10D102SourceDocuments?.allSummaries?.()||[]}catch(_){media=[]}
 show();
}
function connect(d){
 deps=d;
 engine=Engine.create(root.localStorage,d);
 refresh();
}
const api=Object.freeze({connect,refresh,snapshot:()=>({...(engine?.snapshot()||{}),
 assistantAudit:audit?{anchors:audit.recordedCHAnchors,ownerCandidates:audit.modelCoordinateCandidates,
   layoutCount:audit.diagramsCount,mediaCount:audit.sourceMediaReferences,physicalTrainReleased:false}:null})});
root.MRS10D102InstructionUI=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
