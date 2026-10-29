/* P01 R1.6.1: privately store authorized layout pictures/PDFs for STN/PL.
 * Source-file preview is NOT a surveyed railway track plan, nor rail vector.
 * IndexedDB storage is on THIS preview origin/device only. */
(function(root){'use strict';
const DB='mrs10-p01-d102-layout-source-images-r161',STORE='attachments',LIMIT=12*1024*1024;
const ACCEPT='.png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf';
const VALID_CODES=new Set(root.MRS10ECRLChainage?.records?.map(x=>x.code)||[]);
let dbPromise=null,notice='',inMemoryCount=0,readiness='NOT_OPENED',activeURLs=new Map();
function open(){
 if(dbPromise)return dbPromise;
 if(!root.indexedDB)return Promise.reject(new Error('INDEXEDDB_UNAVAILABLE_SAFARI_STORAGE'));
 dbPromise=new Promise((resolve,reject)=>{
  const r=root.indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{
   const db=r.result;if(!db.objectStoreNames.contains(STORE)){
    const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('assetCode','assetCode',{unique:false});
   }
  };
  r.onsuccess=()=>{readiness='READY';resolve(r.result)};
  r.onerror=()=>reject(new Error('INDEXEDDB_OPEN_FAILED'));
  r.onblocked=()=>reject(new Error('INDEXEDDB_BLOCKED'));
 });
 return dbPromise.catch(e=>{dbPromise=null;readiness='UNAVAILABLE';throw e});
}
function inspectFile(file,head){
 const h=new Uint8Array(head),ascii=(a,b)=>Array.from(h.slice(a,b)).map(x=>String.fromCharCode(x)).join('');
 if(h.length<12)throw new Error('EMPTY_OR_UNSUPPORTED_SOURCE_FILE');
 if(h[0]===0x89&&ascii(1,4)==='PNG')return {media:'image/png',view:'IMAGE'};
 if(h[0]===0xff&&h[1]===0xd8&&h[2]===0xff)return {media:'image/jpeg',view:'IMAGE'};
 if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return {media:'image/webp',view:'IMAGE'};
 if(ascii(0,5)==='%PDF-')return {media:'application/pdf',view:'PDF'};
 throw new Error('ONLY_PNG_JPG_WEBP_PDF_SOURCE_SUPPORTED');
}
async function save(file,assetCode,source){
 const code=String(assetCode||'').trim().toUpperCase(),src=String(source||'').trim();
 if(!VALID_CODES.has(code))throw new Error('UNKNOWN_STATION_OR_PL');
 if(!file||!Number.isInteger(file.size)||file.size<12||file.size>LIMIT)throw new Error('FILE_SIZE_LIMIT_12MB');
 if(src.length<8)throw new Error('SOURCE_REFERENCE_REQUIRED');
 const format=inspectFile(file,await file.slice(0,16).arrayBuffer()),existing=await list(code,false);
 if(existing.length>=12)throw new Error('MAX_12_LOCAL_ATTACHMENTS_PER_ASSET');
 const entry={
  id:code+'-'+Date.now()+'-'+Math.floor(Math.random()*1000000),
  assetCode:code,fileName:String(file.name||'imported-layout').slice(0,160),
  media:format.media,view:format.view,blob:file,bytes:file.size,
  source:src.slice(0,350),importedAt:new Date().toISOString(),
  evidenceClass:'OWNER_IMPORTED_SOURCE_VISUAL_UNVERIFIED',
  physicalCoordinateVerified:false,trackConnectionsVerified:false,publicPublished:false,
  geometryCoordinates:null
 };
 const db=await open();
 await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(entry);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('INDEXEDDB_SAVE_FAILED'))});
 notice=code+' · '+file.name+' disimpan pada browser ini';inMemoryCount+=1;
 return {...entry,blob:undefined};
}
async function list(code,withBlob=true){
 if(!VALID_CODES.has(code))return [];
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).index('assetCode').getAll(code);
  req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.importedAt.localeCompare(a.importedAt)).map(x=>
   withBlob?x:{...x,blob:undefined}));
  req.onerror=()=>reject(new Error('INDEXEDDB_READ_FAILED'));
 });
}
async function allSummaries(){
 const db=await open();return new Promise((resolve,reject)=>{
  const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
  req.onsuccess=()=>resolve(req.result.map(x=>({assetCode:x.assetCode,fileName:x.fileName,importedAt:x.importedAt,source:x.source,view:x.view})));
  req.onerror=()=>reject(new Error('INDEXEDDB_INDEX_FAILED'));
 });
}
function revoke(container){const old=activeURLs.get(container);if(old){for(const u of old)URL.revokeObjectURL(u)}activeURLs.set(container,[])}
function url(container,blob){const u=URL.createObjectURL(blob);activeURLs.get(container)?.push(u);return u}
function make(tag,value,cls){const e=root.document.createElement(tag);if(value!==null&&value!==undefined)e.textContent=String(value);if(cls)e.className=cls;return e}
async function render(code,host,{compact=false}={}){
 if(!host||!VALID_CODES.has(code))return;
 host.dataset.r161Code=code;
 let box=host.querySelector('.lab-r161-source-documents');
 if(!box){box=make('div',null,'lab-r161-source-documents');host.append(box)}
 const target=box;revoke(target);target.replaceChildren();
 target.append(make('h3','Layout dokumen · '+code+(compact?'':' · STN/PL Intelligence')));
 target.append(make('p','Pratonton fail asal sahaja · bukan geometri trek / as-built yang disahkan.','lab-r16-note'));
 try{
  const entries=await list(code);
  if(host.dataset.r161Code!==code||!target.isConnected)return;
  if(!entries.length){target.append(make('p','Tiada gambar/PDF yang diimport untuk '+code,'lab-r16-note'));return}
  for(const e of entries){
   const d=make('details',null,'lab-r161-item'),h=make('summary',e.fileName+' · '+(e.bytes/1024).toFixed(0)+' KB · '+e.importedAt.slice(0,10));
   d.append(h,make('p','Sumber: '+e.source+' · OWNER SOURCE VISUAL / UNVERIFIED','lab-r16-note'));
   const u=url(target,e.blob);
   if(e.view==='IMAGE'){
    const img=make('img');img.src=u;img.alt=e.assetCode+' imported station/PL layout reference';img.loading='lazy';
    img.className='lab-r161-layout-img';d.append(img);
   }else{
    d.append(make('p','PDF sumber. Buka fail asal menggunakan pautan berikut. Tiada pengekstrakan landasan automatik.','lab-r16-note'));
   }
   const a=make('a','Buka gambar / PDF asal');a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.className='lab-r161-open';d.append(a);
   target.append(d);
  }
 }catch(e){target.append(make('p','Tidak boleh membaca storan setempat: '+e.message,'lab-r16-alert'))}
}
const api=Object.freeze({save,list,allSummaries,render,ACCEPT,MAX_BYTES:LIMIT,
 snapshot:()=>({provider:'BROWSER_INDEXEDDB_ONLY',readiness,importsThisPage:inMemoryCount,lastMessage:notice,
  vectorGeometryGenerated:false,physicalTrackVerified:false,publicPublished:false,crossPreviewSync:false})});
root.MRS10D102SourceDocuments=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
