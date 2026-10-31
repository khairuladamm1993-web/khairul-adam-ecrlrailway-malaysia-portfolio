(function(root){'use strict';
const node=document.getElementById('private-gate-r2');
async function start(){try{await root.MRS10PrivateRuntime.activate();if(await root.MRS10LegacyMigrationR2.exists())throw Error('LEGACY_DATA_REQUIRES_OWNER_MIGRATION');for(const script of [...document.querySelectorAll('script[data-owner-src]')]){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=script.dataset.ownerSrc;s.onload=resolve;s.onerror=()=>reject(Error('OWNER_MODULE_LOAD_FAILED'));document.body.append(s)})}node.textContent='Owner · MFA · backend disahkan';document.getElementById('private-lab-shell').hidden=false}catch(e){node.textContent=e.message+' · Buka Akses Selamat R2 untuk login / MFA / pemindahan data.'}}
root.addEventListener('mrs10-runtime-cleared',()=>{document.getElementById('private-lab-shell').replaceChildren();node.textContent='Sesi berubah. Sahkan semula Owner.'});
start();
})(window);
