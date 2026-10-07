/* Supabase-backed access layer. Authorization always resolves through server-validated session + account_role(). */
(()=>{
 'use strict';
 const PROJECT_URL='https://kfudisbzdgsefdjoopzu.supabase.co';
 const PUBLISHABLE_KEY='sb_publishable_1Diyg-QnCNMJXIY2g0RdCg_ToWFuq0V';
 let client=null,authSubscription=null,consent=false,dataCache=null,userId=null,magicLinkInFlight=null;
 let state={level:'public',status:'initializing',canReadMemberContent:false,canAdmin:false,email:null,error:null,retryAfterSeconds:null};
 const emit=()=>window.dispatchEvent(new CustomEvent('railway-access-change',{detail:snapshot()}));
 const snapshot=()=>Object.freeze({...state,canReadMemberContent:state.level==='member'||state.level==='admin',canAdmin:state.level==='admin'});
 const set=(patch)=>{state={...state,...patch};emit();return snapshot();};
 const failClosed=(status='public',error=null)=>{consent=false;dataCache=null;userId=null;return set({level:'public',status,canReadMemberContent:false,canAdmin:false,email:null,error:error?String(error):null,retryAfterSeconds:null});};
 const requireClient=()=>{
  if(client)return client;
  if(!window.supabase?.createClient)throw new Error('Supabase client library unavailable');
  client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
 };
 const validateSession=async()=>{
  try{
   const c=requireClient();
   const previousAuthenticated=state.level==='member'||state.level==='admin'||state.status==='authenticated';
   const {data:{session},error:sessionError}=await c.auth.getSession();
   if(sessionError||!session)return failClosed(sessionError?'session-error':previousAuthenticated?'session-expired':'public',sessionError);
   let liveSession=session;
   const expiresAt=Number(session.expires_at||0)*1000;
   if(expiresAt&&expiresAt<=Date.now()+60000&&typeof c.auth.refreshSession==='function'){
    const refreshed=await c.auth.refreshSession();
    if(refreshed.error||!refreshed.data?.session)return failClosed('session-expired',refreshed.error||'Session expired');
    liveSession=refreshed.data.session;
   }
   const {data:{user},error:userError}=await c.auth.getUser(liveSession.access_token);
   if(userError||!user)return failClosed('invalid-session',userError||'No valid user');
   userId=user.id;
   const {data:role,error:roleError}=await c.rpc('account_role');
   if(roleError||!['member','admin'].includes(role))return failClosed(roleError?'role-error':'public',roleError);
   const profile=await c.from('member_profiles').select('email,role,enabled,activity_consent_at,privacy_version').eq('user_id',userId).maybeSingle();
   if(profile.error)return failClosed('profile-error',profile.error.message);
   consent=Boolean(profile.data?.activity_consent_at);
   return set({level:role,status:'authenticated',canReadMemberContent:true,canAdmin:role==='admin',email:user.email||profile.data?.email||null,error:null,retryAfterSeconds:null});
  }catch(error){return failClosed('client-error',error);}
 };
 function verificationUrlError(){
  const params=new URLSearchParams(location.search||'');
  const hash=new URLSearchParams((location.hash||'').replace(/^#/,''));
  const code=params.get('error_code')||hash.get('error_code')||'';
  const description=params.get('error_description')||hash.get('error_description')||'';
  if(!code&&!description)return null;
  const expired=/expired|otp_expired|already.*used/i.test(code+' '+description);
  try{history.replaceState(null,'',location.pathname);}catch{}
  return expired?'Verification link is expired or has already been used. Request a new link.':'Verification could not be completed. Request a new link.';
 }
 async function init(){
  try{
   const c=requireClient();
   const urlError=verificationUrlError();
   if(!authSubscription){
    const {data}=c.auth.onAuthStateChange(()=>{setTimeout(()=>{validateSession();},0);});
    authSubscription=data?.subscription||null;
   }
   const resolved=await validateSession();
   if(urlError&&!resolved.canReadMemberContent)return set({level:'public',status:'verification-failed',canReadMemberContent:false,canAdmin:false,email:null,error:urlError});
   return resolved;
  }catch(error){return failClosed('client-error',error);}
 }
 const rateLimitInfo=error=>{
  const message=String(error?.message||error||'');
  const limited=Boolean(error&&(Number(error.status)===429||/rate.?limit|too many|email.*limit|security purposes/i.test(message)));
  const match=message.match(/after\s+(\d+)\s+seconds?/i);
  const retryAfterSeconds=match?Number(match[1]):null;
  return {limited,retryAfterSeconds,message:retryAfterSeconds!=null?'Too many verification requests. Please wait '+retryAfterSeconds+' seconds before requesting another link.':'Too many verification requests. Please wait before requesting another link.'};
 };
 async function sendMagicLink(email){
  const normalized=String(email||'').trim().toLowerCase();
  if(!normalized||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw new Error('Enter a valid email address.');
  if(magicLinkInFlight)return magicLinkInFlight;
  magicLinkInFlight=(async()=>{
   const restored=await validateSession();
   if(restored.canReadMemberContent)return restored;
   const c=requireClient();
   set({status:'sending',error:null,email:normalized});
   const redirectTo=location.origin+location.pathname;
   const {error}=await c.auth.signInWithOtp({email:normalized,options:{emailRedirectTo:redirectTo,shouldCreateUser:true}});
   if(error){
    const limited=rateLimitInfo(error);
    if(limited.limited){set({level:'public',status:'rate-limited',canReadMemberContent:false,canAdmin:false,email:normalized,error:limited.message,retryAfterSeconds:limited.retryAfterSeconds});throw error;}
    set({level:'public',status:'auth-error',canReadMemberContent:false,canAdmin:false,email:normalized,error:String(error.message||error),retryAfterSeconds:null});throw error;
   }
   return set({level:'public',status:'verification-sent',canReadMemberContent:false,canAdmin:false,email:normalized,error:null,retryAfterSeconds:null});
  })();
  try{return await magicLinkInFlight;}finally{magicLinkInFlight=null;}
 }
 async function refresh(){
  const previous=snapshot();
  const preserve=['verification-sent','rate-limited'].includes(previous.status);
  const resolved=await validateSession();
  if(resolved.canReadMemberContent||!preserve)return resolved;
  return set({level:'public',status:previous.status,canReadMemberContent:false,canAdmin:false,email:previous.email,error:previous.error,retryAfterSeconds:previous.retryAfterSeconds??null});
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
 async function adminPublishLocation(values){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const {data,error}=await requireClient().rpc('admin_publish_location',{
   p_asset_id:values.assetId,
   p_latitude:values.latitude==null?null:Number(values.latitude),
   p_longitude:values.longitude==null?null:Number(values.longitude),
   p_confidence:values.confidence,
   p_source_note:values.sourceNote,
   p_accuracy_m:values.accuracyM==null?null:Number(values.accuracyM)
  });
  if(error)throw error;
  dataCache=null;
  return data;
 }
 async function adminLocationHistory(assetId){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const {data,error}=await requireClient().rpc('admin_location_history',{p_asset_id:assetId||null});
  if(error)throw error;
  return data||[];
 }
 async function adminRestoreLocation(versionId,sourceNote){
  if(!snapshot().canAdmin)throw new Error('Admin access required.');
  const {data,error}=await requireClient().rpc('admin_restore_location',{p_version_id:Number(versionId),p_source_note:String(sourceNote||'')});
  if(error)throw error;
  dataCache=null;
  return data;
 }
 window.RailwayAccess=Object.freeze({
  get level(){return state.level;},get status(){return state.status;},get canReadMemberContent(){return state.level==='member'||state.level==='admin';},get canAdmin(){return state.level==='admin';},
  get email(){return state.email;},get error(){return state.error;},get retryAfterSeconds(){return state.retryAfterSeconds;},get activityConsent(){return consent;},get cachedData(){return dataCache;},
  init,refresh,sendMagicLink,logout,fetchMemberBundle,fetchAdminData,signedFileUrl,submitQuiz,saveProgress,setActivityConsent,recordEngagement,adminSummary,adminSaveContent,adminSetMemberEnabled,adminPublishLocation,adminLocationHistory,adminRestoreLocation,snapshot
 });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>init(),{once:true}):init();
})();