/**
 * MR-S10 maintenance control - isolated server-side implementation.
 * NOT DEPLOYED. Requires an approved database migration and staging credentials.
 * AuthZ: Supabase Auth getUser + account_role RPC + enabled member profile.
 * Never trust user_metadata, browser flags, or a client-supplied role.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const allowedOrigins=()=>new Set((Deno.env.get('MRS10_MAINTENANCE_ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean));
const json=(body,status=200,origin=null)=>new Response(JSON.stringify(body),{
 status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...(origin&&allowedOrigins().has(origin)?{'access-control-allow-origin':origin,'vary':'origin'}:{})}
});
Deno.serve(async request=>{
 const origin=request.headers.get('origin');
 if(origin&&!allowedOrigins().has(origin))return json({error:'origin_denied'},403,origin);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':origin||'','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'authorization, apikey, content-type','vary':'origin','cache-control':'no-store'}});
 if(request.method!=='GET'&&request.method!=='POST')return json({error:'method_not_allowed'},405,origin);
 const url=Deno.env.get('SUPABASE_URL');
 const publishable=Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
 if(!url||!publishable)return json({error:'service_unavailable'},503,origin);
 const token=(request.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1];
 if(!token)return json({error:'unauthorized'},401,origin);
 const db=createClient(url,publishable,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userError}=await db.auth.getUser(token);
 if(userError||!user)return json({error:'unauthorized'},401,origin);
 const {data:role,error:roleError}=await db.rpc('account_role');
 if(roleError||role!=='admin')return json({error:'forbidden'},403,origin);
 const {data:profile,error:profileError}=await db.from('member_profiles').select('enabled,role').eq('user_id',user.id).maybeSingle();
 if(profileError||!profile?.enabled||profile.role!=='admin')return json({error:'forbidden'},403,origin);
 if(request.method==='GET'){
  const {data,error}=await db.from('site_maintenance_control').select('enabled,updated_at').eq('id',1).single();
  return error?json({error:'control_unavailable'},503,origin):json({enabled:data.enabled,updated_at:data.updated_at},200,origin);
 }
 if(!origin||!allowedOrigins().has(origin))return json({error:'origin_denied'},403,origin);
 let body;try{body=await request.json()}catch{return json({error:'invalid_json'},400,origin)}
 if(typeof body?.enabled!=='boolean'||Object.keys(body).some(k=>k!=='enabled'))return json({error:'invalid_payload'},400,origin);
 const {data,error}=await db.from('site_maintenance_control').update({enabled:body.enabled,updated_at:new Date().toISOString(),updated_by:user.id}).eq('id',1).select('enabled,updated_at').single();
 return error?json({error:'write_denied'},403,origin):json({enabled:data.enabled,updated_at:data.updated_at},200,origin);
});
