const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('server control requires a real JWT, backend role and enabled Admin profile',()=>{
 const src=read('supabase/functions/mrs10-maintenance-control/index.ts');
 assert.match(src,/auth\.getUser\(token\)/);
 assert.match(src,/rpc\('account_role'\)/);
 assert.match(src,/role!=='admin'/);
 assert.match(src,/profile\.role!=='admin'/);
 assert.match(src,/profile\?\.enabled/);
 assert.match(src,/allowedOrigins\(\)/);
 assert.match(src,/typeof body\?\.enabled!=='boolean'/);
 assert.doesNotMatch(src,/Deno\.env\.get\(['"]SUPABASE_SERVICE_ROLE_KEY|localStorage\./);
});
test('allowlisted maintenance requests retain CORS on all auth and validation errors',()=>{
 const src=read('supabase/functions/mrs10-maintenance-control/index.ts');
 for(const [error,status] of [['service_unavailable',503],['unauthorized',401],['forbidden',403],['invalid_json',400],['invalid_payload',400]]){
  assert.ok(src.includes("json({error:'"+error+"'},"+status+",origin)"),error+' must return CORS headers for approved origin');
 }
 assert.match(src,/if\(origin&&!allowedOrigins\(\)\.has\(origin\)\)/);
});
test('staging migration defaults OFF and restricts reads and writes with RLS',()=>{
 const sql=read('supabase/staging/maintenance-control-review-only.sql');
 assert.match(sql,/enabled boolean not null default false/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all .* from public, anon, authenticated/);
 assert.match(sql,/grant select, update .* to authenticated/);
 assert.match(sql,/for select to authenticated/);
 assert.match(sql,/for update to authenticated/);
 assert.match(sql,/with check/);
 assert.match(sql,/public\.account_role\(\)/);
 assert.match(sql,/p\.enabled = true/);
 assert.match(sql,/values \(1,false\)/);
 assert.doesNotMatch(sql,/drop table|disable row level security|security definer/i);
});
