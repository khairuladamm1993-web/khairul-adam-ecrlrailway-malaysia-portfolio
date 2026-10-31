/* No tokens, identity records or private documents in Web Storage / IndexedDB. */
(function(root){'use strict';
let epoch=0,identity=null,factorId=null,busy=false;
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('mrs10-r2-session-invalidation'):null;
const reset=()=>{epoch++;identity=null;factorId=null;for(const n of document.querySelectorAll('input'))n.value='';const qr=document.getElementById('mfa-qr');if(qr){qr.removeAttribute('src');qr.hidden=true}root.dispatchEvent(new Event('mrs10-private-clear'));render()};
async function api(action,body){const revision=epoch;const r=await fetch('/api/auth-r2?action='+encodeURIComponent(action),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();if(revision!==epoch){await fetch('/api/auth-r2?action=logout',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:'{}'});throw Error('SESSION_CHANGED_RESPONSE_DISCARDED')}if(!r.ok){if(r.status===401||r.status===403){identity=null;root.dispatchEvent(new Event('mrs10-private-clear'));render()}throw Error(value.status||'AUTH_UNAVAILABLE')}return value}
function render(){if(!document.getElementById('login'))return;document.getElementById('login').hidden=Boolean(identity);document.getElementById('mfa').hidden=!identity?.mfaRequired;document.getElementById('room').hidden=!identity?.ownerPrivate}
function status(s){const n=document.getElementById('status');if(n)n.textContent=s}
async function session(){identity=await api('session');render();status(identity.ownerPrivate?'Owner · MFA disahkan':identity.mfaRequired?'Owner · MFA diperlukan':'Member · sesi disahkan');if(identity.mfaRequired){const data=await api('mfa-factors');factorId=data.factors?.find(x=>x.status==='verified')?.id||null}return identity}
async function act(fn){if(busy)return;busy=true;try{await fn()}catch(e){status(e.message)}finally{busy=false}}
const button=(id,fn)=>{const n=document.getElementById(id);if(n)n.onclick=()=>act(fn)};
button('request',async()=>{await api('otp-request',{email:document.getElementById('email').value});document.getElementById('code').value='';status('Semak e-mel. Kod, expiry dan rate limit dikawal penyedia sandbox.')});
button('magic',async()=>{await api('magic-request',{email:document.getElementById('email').value});status('Semak Magic Link. Gunakan browser dan origin yang sama.')});
button('verify',async()=>{await api('otp-verify',{email:document.getElementById('email').value,code:document.getElementById('code').value});document.getElementById('code').value='';await session()});
button('enroll',async()=>{const data=await api('mfa-enroll',{});factorId=data.id;const img=document.getElementById('mfa-qr');if(data.totp?.qr_code){img.src=data.totp.qr_code.startsWith('data:')?data.totp.qr_code:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(data.totp.qr_code);img.hidden=false}});
button('mfa-verify',async()=>{await api('mfa-verify',{factorId,code:document.getElementById('mfa-code').value});document.getElementById('mfa-code').value='';const img=document.getElementById('mfa-qr');img.removeAttribute('src');img.hidden=true;await session()});
button('refresh',async()=>{await api('refresh',{});await session()});
button('logout',async()=>{reset();channel?.postMessage('invalidate');try{await api('logout',{})}finally{status('Sesi ditutup. Data Owner dibersihkan daripada paparan.')}});
button('migration',async()=>{if(!identity?.ownerPrivate)throw Error('OWNER_MFA_REQUIRED');if(!root.confirm('Pindahkan jurnal lama ke backend? Data browser hanya dipadam selepas penerimaan backend.'))return;await root.MRS10LegacyMigrationR2.migrate(api);status('Pemindahan diterima backend; rekod legacy setempat dibersihkan.')});
channel?.addEventListener('message',()=>{reset();status('Sesi berubah pada tab lain. Sahkan semula akses.')});
root.addEventListener('pagehide',()=>{reset()});
root.addEventListener('pageshow',e=>{if(e.persisted){reset();act(session)}});
root.MRS10AuthR2=Object.freeze({api,session,clear:reset,snapshot:()=>identity?{...identity}:null});
act(session);
})(window);
