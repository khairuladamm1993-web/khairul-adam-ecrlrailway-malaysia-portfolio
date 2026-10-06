/* Supabase-backed access layer. Authorization always resolves through server-validated session + account_role(). */
(()=>{
 'use strict';
 const PROJECT_URL='https://kfudisbzdgsefdjoopzu.supabase.co';
 const PUBLISHABLE_KEY='sb_publishable_1Diyg-QnCNMJXIY2g0RdCg_ToWFuq0V';
 let client=null,authSubscription=null,consent=false,dataCache=null,userId=null;
 let state={level:'public',status:'initializing',canReadMemberContent:false,canAdmin:false,email:null,error:null};
 const emit=()=>window.dispatchEvent(new CustomEvent('railway-access-change',{detail:snapshot()}));
 const snapshot=()=>Object.freeze({...state,canReadMemberContent:state.level==='member'||state.level==='admin',canAdmin:state.level==='admin'});
 const set=(patch)=>{state={...state,...patch};emit();return snapshot();};
 const failClosed=(status='public',error=null)=>{consent=false;dataCache=null;userId=null;return set({level:'public',status,canReadMemberContent:false,canAdmin:false,email:null,error:error?String(error):null});};
 const requireClient=()=>{
  if(client)return client;
  if(!window.supabase?.createClient)throw new Error('Supabase client library unavailable');
  client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
 };
 const validateSession=async()=>{
  try{
   const c=requireClient();
   const {data:{session},error:sessionError}=await c.auth.getSession();
   if(sessionError||!session)return failClosed(sessionError?'session-error':'public',sessionError);
   const {data:{user},error:userError}=await c.auth.getUser();
   if(userError||!user)return failClosed('invalid-session',userError||'No valid user');
   userId=user.id;
   const {data:role,error:roleError}=await c.rpc('account_role');
   if(roleError||!['member','admin'].includes(role))return failClosed(roleError?'role-error':'public',roleError);
   const profile=await c.from('member_profiles').select('email,role,enabled,activity_consent_at,privacy_version').eq('user_id',userId).maybeSingle();
   if(profile.error)return failClosed('profile-error',profile.error.message);
   consent=Boolean(profile.data?.activity_consent_at);
   return set({level:role,status:'authenticated',canReadMemberContent:true,canAdmin:role==='admin',email:user.email||profile.data?.email||null,error:null});
  }catch(error){return failClosed('client-error',error);}
 };
 async function init(){
  try{
   const c=requireClient();
   if(!authSubscription){
    const {data}=c.auth.onAuthStateChange(()=>{setTimeout(()=>{validateSession();},0);});
    authSubscription=data?.subscription||null;
   }
   return await validateSession();
  }catch(error){return failClosed('client-error',error);}
 }
 async function sendMagicLink(email){
  const normalized=String(email||'').trim().toLowerCase();
  if(!normalized||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw new Error('Enter a valid email address.');
  const c=requireClient();
  set({status:'sending',error:null});
  const redirectTo=location.origin+location.pathname;
  const {error}=await c.auth.signInWithOtp({email:normalized,options:{emailRedirectTo:redirectTo,shouldCreateUser:true}});
  if(error){failClosed('auth-error',error.message);throw error;}
  return set({level:'public',status:'verification-sent',email:normalized,error:null});
 }
 async function logout(){
  try{if(client)await client.auth.signOut({scope:'local'});}finally{failClosed('signed-out');}
 }
 async function fetchMemberBundle(){
  if(!snapshot().canReadMemberContent)throw new Error('Verified member session required.');
  const c=requireClient();
  const [profile,content,banks,files,progress,attempts]=await Promise.all([
   c.from('member_profiles').select('user_id,email,role,display_name,enabled,activity_consent_at,privacy_version,last_member_activity').eq('user_id',userId).maybeSingle(),
   c.from('member_content').select('id,kind,title,body,evidence,approved,updated_at').eq('approved',true).order('kind').order('id'),
   c.from('quiz_banks').select('id,title,bank,approved,updated_at').eq('approved',true).order('id'),
   c.from('member_files').select('id,bucket_id,object_path,approved,artwork_signature').eq('approved',true).order('id'),
   c.from('member_progress').select('resource_id,position,completed,updated_at').order('updated_at',{ascending:false}),
   c.from('quiz_attempts').select('id,client_attempt_id,modules,score,passed,attempted_at').order('attempted_at',{ascending:false}).limit(50)
  ]);
  const results={profile,content,banks,files,progress,attempts};
  for(const [name,result] of Object.entries(results))if(result.error){failClosed(name+'-fetch-error',result.error.message);throw result.error;}
  consent=Boolean(profile.data?.activity_consent_at);
  dataCache={profile:profile.data,content:content.data||[],quizBanks:banks.data||[],files:files.data||[],progress:progress.data||[],quizAttempts:attempts.data||[]};
  return dataCache;
 }
 async function signedFileUrl(file,expiresIn=120){
  if(!snapshot().canReadMemberContent)throw new Error('Verified member session required.');
  if(!file?.bucket_id||!file?.object_path)throw new Error('Invalid member file.');
  const {data,error}=await requireClient().storage.from(file.bucket_id).createSignedUrl(file.object_path,expiresIn);
  if(error)throw error;
  return data?.signedUrl||null;
 }
 async function submitQuiz(attemptId,modules,answers){
  if(!snapshot().canReadMemberContent)throw new Error('Verified member session required.');
  const {data,error}=await requireClient().rpc('submit_quiz',{p_attempt:attemptId,p_modules:modules,p_answers:answers});
  if(error)throw error;
  dataCache=null;
  return data;
 }
 async function saveProgress(resourceId,position,completed){
  if(!snapshot().canReadMemberContent)throw new Error('Verified member session required.');
  const {error}=await requireClient().rpc('save_progress',{p_resource:resourceId,p_position:position,p_completed:Boolean(completed)});
  if(error)throw error;
  dataCache=null;
  return true;
 }
 async function setActivityConsent(enabled){
  if(!snapshot().canReadMemberContent)throw new Error('Verified member session required.');
  const {error}=await requireClient().rpc('set_activity_consent',{p_enabled:Boolean(enabled)});
  if(error)throw error;
  consent=Boolean(enabled);
  dataCache=null;
  return consent;
 }
 async function recordEngagement(sessionId,section,sequence,visitSeconds,activeSeconds){
  if(!snapshot().canReadMemberContent||!consent)throw new Error('Explicit activity consent required.');
  const {error}=await requireClient().rpc('record_engagement',{p_session:sessionId,p_section:section,p_sequence:sequence,p_visit:visitSeconds,p_active:activeSeconds});
  if(error)throw error;
  return true;
 }
 async function fetchAdminData(){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const c=requireClient();
  const [members,attempts,engagement,audit,snapshots,content]=await Promise.all([
   c.from('member_profiles').select('user_id,email,role,display_name,enabled,created_at,last_sign_in,last_member_activity').order('created_at',{ascending:false}).limit(100),
   c.from('quiz_attempts').select('user_id,modules,score,passed,attempted_at').order('attempted_at',{ascending:false}).limit(100),
   c.from('member_engagement').select('user_id,section,visit_seconds,active_seconds,created_at').order('created_at',{ascending:false}).limit(100),
   c.from('admin_audit').select('id,actor,action,target,created_at').order('created_at',{ascending:false}).limit(100),
   c.from('public_analytics_snapshots').select('period_start,period_end,source,metrics,imported_at').order('imported_at',{ascending:false}).limit(20),
   c.from('member_content').select('id,kind,title,evidence,approved,updated_at').order('updated_at',{ascending:false}).limit(100)
  ]);
  const results={members,attempts,engagement,audit,snapshots,content};
  for(const result of Object.values(results))if(result.error)throw result.error;
  return Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.data||[]]));
 }
 async function adminSummary(){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const {data,error}=await requireClient().rpc('admin_summary');
  if(error)throw error;
  return data;
 }
 async function adminSaveContent(values){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const {error}=await requireClient().rpc('admin_save_content',{p_id:values.id,p_kind:values.kind,p_title:values.title,p_body:values.body,p_evidence:values.evidence,p_approved:Boolean(values.approved)});
  if(error)throw error;
  dataCache=null;
  return true;
 }
 async function adminSetMemberEnabled(userId,enabled){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const {error}=await requireClient().rpc('admin_set_member_enabled',{p_user:userId,p_enabled:Boolean(enabled)});
  if(error)throw error;
  return true;
 }
 window.RailwayAccess=Object.freeze({
  get level(){return state.level;},get status(){return state.status;},get canReadMemberContent(){return state.level==='member'||state.level==='admin';},get canAdmin(){return state.level==='admin';},
  get email(){return state.email;},get error(){return state.error;},get activityConsent(){return consent;},get cachedData(){return dataCache;},
  init,refresh:validateSession,sendMagicLink,logout,fetchMemberBundle,fetchAdminData,signedFileUrl,submitQuiz,saveProgress,setActivityConsent,recordEngagement,adminSummary,adminSaveContent,adminSetMemberEnabled,snapshot
 });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>init(),{once:true}):init();
})();