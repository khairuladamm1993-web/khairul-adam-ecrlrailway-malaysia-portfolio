/* Private read-only review. No browser persistence; receipts contain version IDs only. */
(()=>{'use strict';
const A=window.RailwayAccess, status=document.getElementById('review-status'), list=document.getElementById('review-records'),load=document.getElementById('review-load'),download=document.getElementById('review-export');
let epoch=0,receipt=[];
const allowed=()=>A?.canAdmin===true&&A.status==='authenticated';
function clear(){epoch++;receipt=[];list.replaceChildren();download.hidden=true;load.hidden=!allowed();load.disabled=false;status.textContent=allowed()?'Akses Owner disahkan. Muat rekod untuk semakan.':'Akses Owner/Admin diperlukan. Log masuk melalui Gateway.';}
function text(tag,value){const n=document.createElement(tag);n.textContent=String(value??'—');return n;}
async function refresh(){clear();if(!allowed())return;const request=epoch;load.disabled=true;status.textContent='Memuat sejarah lokasi…';
try{const rows=await A.adminLocationHistory(null);if(request!==epoch||!allowed())return;
const latest=new Map();for(const row of rows)if(!latest.has(row.asset_id))latest.set(row.asset_id,row);
for(const row of latest.values()){const article=document.createElement('article');article.append(text('h2',row.asset_id),text('p','Versi '+row.version_id+' · '+row.new_confidence),text('p','Lokasi tersimpan: '+row.new_latitude+', '+row.new_longitude),text('p',row.source_note));
const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';label.append(check,document.createTextNode(' Saya telah menyemak rekod tersimpan ini. Ini bukan pengesahan ukur.'));article.append(label);list.append(article);
check.onchange=()=>{receipt=receipt.filter(x=>x.versionId!==row.version_id);if(check.checked)receipt.push({assetId:row.asset_id,versionId:row.version_id,status:'OWNER_REVIEWED_NOT_SURVEY_VERIFIED'});download.hidden=!receipt.length;};}
status.textContent=latest.size+' lokasi unik · '+rows.length+' versi. Status asal dikekalkan.';
}catch{if(request===epoch){list.replaceChildren();status.textContent='Rekod tidak dapat dimuat. Akses kekal disekat; cuba log masuk semula.';}}
finally{if(request===epoch)load.disabled=false;}}
load.onclick=refresh;download.onclick=()=>{if(!allowed()||!receipt.length)return;const url=URL.createObjectURL(new Blob([JSON.stringify({schema:1,reviewedAt:new Date().toISOString(),records:receipt},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='p01-owner-location-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('railway-access-change',clear);window.addEventListener('pagehide',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else A?.refresh();});clear();
})();
