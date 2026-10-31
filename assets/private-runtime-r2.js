/* Owner data exists in page memory only; persisted state belongs to the RLS backend. */
(function(root){'use strict';
const STORES=['definitions','executions','audit','settings','recoveryArchives','geometryCandidates','ownerReviewedGeometry'];
let active=false,values={},pending=Promise.resolve(),writes=0,error=null;
async function call(data){if(!active)throw Error('OWNER_PRIVATE_BACKEND_REQUIRED');return (await root.MRS10AuthR2.api('private',data)).value}
const storage=Object.freeze({get length(){return Object.keys(values).length},key:i=>Object.keys(values)[i]||null,getItem:k=>values[k]??null,setItem(k,v){if(!active)throw Error('OWNER_MFA_REQUIRED');values[k]=String(v);writes++;pending=pending.then(()=>call({op:'put',store:'browserMemory',key:k,value:String(v)})).catch(e=>{error=e;root.dispatchEvent(new CustomEvent('mrs10-private-save-error',{detail:e.message}))}).finally(()=>writes--)},removeItem(k){delete values[k]},clear(){values={}}});
const repo=Object.freeze({
 get:(store,key)=>call({op:'get',store,key}),list:store=>call({op:'list',store}),put:(store,value)=>{if(!STORES.includes(store)||store==='consumerApprovedGeometry')throw Error('PUBLICATION_NOT_AUTHORIZED');return call({op:'put',store,key:value.key,value})},
 definition:document=>call({op:'definition',document}),save:(state,expectedVersion)=>call({op:'save',state,expectedVersion}),
 claim:(assignmentKey,ownerToken)=>call({op:'claim',assignmentKey,ownerToken}),release:(assignmentKey,ownerToken)=>call({op:'release',assignmentKey,ownerToken}),
 archive:(type,data)=>call({op:'archive',key:crypto.randomUUID(),value:{type,data,scope:'PRIVATE_OWNER',createdAt:new Date().toISOString()}}),
 migrate:async()=>{},open:async()=>{if(!active)throw Error('OWNER_MFA_REQUIRED')},STORES
});
function clear(){active=false;values={};root.MRS10AssistantUI?.clearPrivate?.();const h=document.getElementById('lab-r17-command-center');if(h)h.replaceChildren();document.querySelectorAll('.lab-r161-source-documents').forEach(e=>e.replaceChildren());root.dispatchEvent(new Event('mrs10-runtime-cleared'))}
root.addEventListener('mrs10-private-clear',clear);
root.addEventListener('pagehide',clear);
root.addEventListener('beforeunload',e=>{if(active&&(writes||error)){e.preventDefault();e.returnValue='Backend save pending'}});
root.MRS10PrivateRuntime=Object.freeze({storage,repo,async activate(){const session=await root.MRS10AuthR2.session();if(!session.ownerPrivate)throw Error('OWNER_MFA_REQUIRED');active=true;try{values=await call({op:'bootstrap'})||{}}catch(e){active=false;throw e}},call,async flush(){await pending;if(error)throw error},clear,snapshot:()=>({active,pending:writes,persistence:'BACKEND_RLS_ONLY',error:error?.message||null})});
})(window);
