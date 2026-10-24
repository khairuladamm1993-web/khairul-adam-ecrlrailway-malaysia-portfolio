/**
 * Read-only, Owner-authorized Vercel deployment status.
 * Never expose the Vercel token or accept arbitrary project IDs from the browser.
 * Needs isolated environment variables: VERCEL_API_TOKEN, SUPABASE_PUBLISHABLE_KEY.
 */
const SUPABASE_URL='https://kfudisbzdgsefdjoopzu.supabase.co';
const TEAM_ID='team_0JRmhxIIyLuWMPHsxwWxJfTv';
const ALLOWED=Object.freeze([
 {name:'Portfolio Preview',id:'prj_0VhBnAaagARpXZYHHTFPquxRf7xy',project:'portfolio'},
 {name:'ECRL Slice 1',id:'prj_81dgAh0E2Fnppz1hWLt62mCgGTlD',project:'web-simulator'},
 {name:'PL03–PL04 Baseline',id:'prj_zj4OEZN7pEapr7W0s7gGeBNob4oq',project:'web-simulator'}
]);
const send=(res,status,body)=>{
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.end(JSON.stringify(body));
};
async function jsonFetch(url,init){
 const response=await fetch(url,{...init,signal:AbortSignal.timeout(7500)});
 if(!response.ok)throw Object.assign(new Error('UPSTREAM_UNAVAILABLE'),{status:response.status});
 return response.json();
}
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{status:'METHOD_NOT_ALLOWED'});
 // Do not run downstream requests until Owner identity is verified.
 const bearer=String(req.headers.authorization||'');
 const match=/^Bearer ([A-Za-z0-9._~-]+)$/.exec(bearer);
 if(!match)return send(res,401,{status:'AUTH_REQUIRED'});
 const key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!key)return send(res,503,{status:'AUTH_VALIDATION_NOT_CONFIGURED'});
 try{
  const headers={'apikey':key,'Authorization':'Bearer '+match[1]};
  const user=await jsonFetch(SUPABASE_URL+'/auth/v1/user',{headers});
  if(!user?.id||!user?.email_confirmed_at)return send(res,403,{status:'NOT_VERIFIED'});
  const role=await jsonFetch(SUPABASE_URL+'/rest/v1/rpc/account_role',{
   method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}'
  });
  if(role!=='admin')return send(res,403,{status:'OWNER_ONLY'});
 }catch{
  return send(res,403,{status:'AUTH_REJECTED'});
 }
 const vercelToken=process.env.VERCEL_API_TOKEN;
 if(!vercelToken)return send(res,503,{status:'VERCEL_NOT_CONNECTED'});
 const results=await Promise.all(ALLOWED.map(async item=>{
  const params='teamId='+encodeURIComponent(TEAM_ID);
  try{
   const headers={Authorization:'Bearer '+vercelToken,Accept:'application/json'};
   const [project,deployments]=await Promise.all([
    jsonFetch('https://api.vercel.com/v9/projects/'+encodeURIComponent(item.id)+'?'+params,{headers}),
    jsonFetch('https://api.vercel.com/v6/deployments?'+params+'&projectId='+encodeURIComponent(item.id)+'&limit=1',{headers})
   ]);
   const newest=deployments?.deployments?.[0]||null;
   return {
    project:item.project,name:item.name,source:'VERCEL_API',
    status:newest?.state||newest?.readyState||'UNKNOWN',
    live:typeof project?.live==='boolean'?project.live:null,
    created:newest?.created||null,
    deploymentId:newest?.uid||newest?.id||null,
    // A READY deployment and a live project are separate properties.
    accessVerified:false
   };
  }catch{return {project:item.project,name:item.name,source:'VERCEL_API',status:'UNVERIFIED',live:null,accessVerified:false};}
 }));
 return send(res,200,{status:'OK',checkedAt:new Date().toISOString(),projects:results});
}
