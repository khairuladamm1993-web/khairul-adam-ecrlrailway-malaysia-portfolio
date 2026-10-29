/* MR-S10 R1.6 — privately imported, source-linked station/PL schematic renderer.
 * Renders normalized sourced SVG geometry (0..100 coordinates), never invents
 * turnouts/platform lines. Import is LOCAL only, not public publishing.
 * GeoJSON layout conversion must happen in an approved separate QA workflow. */
(function(root){'use strict';
const KEY='mrs10-p01-ecrl-asset-layouts-local-r16',LIMIT=23;
const C=root.MRS10ECRLChainage;
function validate(raw){
 const code=String(raw?.code||raw?.assetCode||'').trim().toUpperCase(),ref=C.records.find(x=>x.code===code);
 if(!ref)throw Error('LAYOUT_ASSET_NOT_IN_ACCEPTED_CORRIDOR');
 if(!Array.isArray(raw.tracks)||!raw.tracks.length||raw.tracks.length>24)throw Error('LAYOUT_REQUIRES_1_TO_24_SOURCE_TRACKS');
 const tracks=raw.tracks.map((t,i)=>{
  const points=t?.points;
  if(!Array.isArray(points)||points.length<2||points.length>80||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>100)))throw Error('TRACK_POINTS_MUST_BE_NORMALIZED_0_TO_100');
  return {id:String(t.id||'T'+(i+1)).slice(0,38),role:String(t.role||'UNKNOWN').slice(0,55),points:points.map(x=>[...x]),verified:false};
 });
 const unique=new Set(tracks.map(t=>t.id));if(unique.size!==tracks.length)throw Error('DUPLICATE_TRACK_IDS');
 const source=String(raw.source||raw.sourceRef||'').trim();
 if(source.length<8)throw Error('LAYOUT_PROVENANCE_REQUIRED');
 const status='IMPORTED_UNVERIFIED_LAYOUT';
 return {schema:1,code,CH:ref.metres,kind:code.startsWith('PL')?'PASSING_LOOP':'STATION',
   title:String(raw.title||code+' Schematic').slice(0,100),tracks,source:source.slice(0,350),
   revisedAt:new Date().toISOString(),status,asBuiltVerified:false,ownerApprovedForPublic:false,
   originalCoordinateSystem:'SCHEMATIC_0_TO_100',physicalLineString:null};
}
function create(storage){
 let saved={};
 try{const v=JSON.parse(storage.getItem(KEY)||'null');if(v?.version===1&&Array.isArray(v.items))for(const x of v.items)try{const y=validate(x);saved[y.code]=y}catch(_){}}catch(_){}
 let status='RESTORED';
 const save=()=>{try{storage.setItem(KEY,JSON.stringify({version:1,items:Object.values(saved)}));status='LOCAL_BROWSER_SAVED'}catch(e){status='SAVE_FAILED_'+String(e.message||e).slice(0,75)}};
 function ingest(value){
  const docs=Array.isArray(value?.layouts)?value.layouts:[value];if(!docs.length||docs.length>LIMIT)throw Error('LAYOUT_BATCH_OUT_OF_BOUNDS');
  const approved=docs.map(validate);
  for(const a of approved)saved[a.code]=a;
  save();return approved.map(x=>({code:x.code,tracks:x.tracks.length,status:x.status}));
 }
 function get(code){return saved[code]?JSON.parse(JSON.stringify(saved[code])):null}
 function all(){return Object.values(saved).map(x=>({code:x.code,tracks:x.tracks.length,source:x.source,status:x.status}))}
 function renderSVG(code){
  const doc=get(code);if(!doc)return null;
  const SVG='http://www.w3.org/2000/svg',svg=document.createElementNS(SVG,'svg');
  svg.setAttribute('viewBox','0 0 400 160');svg.setAttribute('role','img');svg.setAttribute('aria-label',doc.code+' imported track schematic - not surveyed');
  svg.setAttribute('style','display:block;width:100%;max-width:640px;background:#f7fafb;border:1px solid #bfd2d9;border-radius:8px');
  for(const t of doc.tracks){
   const path=document.createElementNS(SVG,'polyline');
   path.setAttribute('points',t.points.map(p=>(p[0]*3.7+15)+','+(p[1]*1.3+15)).join(' '));
   path.setAttribute('fill','none');path.setAttribute('stroke',t.role.toLowerCase().includes('main')?'#0b858b':'#b47a30');
   path.setAttribute('stroke-width','3');path.setAttribute('stroke-linecap','round');
   svg.appendChild(path);
   const label=document.createElementNS(SVG,'text');label.setAttribute('x',String(t.points[0][0]*3.7+16));
   label.setAttribute('y',String(t.points[0][1]*1.3+10));label.setAttribute('fill','#22404a');label.setAttribute('font-size','11');
   label.textContent=t.id+' · '+t.role;svg.appendChild(label);
  }
  return svg;
 }
 function snapshot(){return {count:Object.keys(saved).length,layouts:all(),storage:status,publicPublished:false,sourceGeometryVerified:false}}
 return Object.freeze({ingest,get,all,renderSVG,snapshot});
}
const api=Object.freeze({create,validate,KEY});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.MRS10AssetLayoutRegistry=api;
})(typeof window!=='undefined'?window:null);
