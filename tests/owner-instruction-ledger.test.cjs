'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const sql=read('supabase/migrations/20261028_owner_instruction_ledger_r1.sql');
const ui=read('assets/owner-instruction-ledger.js');
const access=read('assets/access.js');
const html=read('owner-command-center.html');

test('R1 scripts parse and Owner page contains separate ledger controls',()=>{
 assert.doesNotThrow(()=>new vm.Script(ui));
 assert.doesNotThrow(()=>new vm.Script(access));
 for(const needle of [
  'id="instruction-ledger" hidden','id="ledger-form"','id="ledger-items"',
  'id="ledger-state"','id="ledger-summary"','id="ledger-acceptance"',
  'id="ledger-scope"','assets/owner-instruction-ledger.js'
 ])assert(html.includes(needle),needle);
 assert(!html.includes('type="password"'));
});
test('schema ledger is private, RLS enabled, no direct public grants, no deployment actions',()=>{
 for(const needle of [
  'create table app_private.owner_instruction_ledger',
  'create table app_private.owner_instruction_events',
  'unique(instruction_id,revision)',
  'client_nonce uuid not null unique',
  'enable row level security',
  'revoke all on app_private.owner_instruction_ledger from public,anon,authenticated',
  'revoke all on app_private.owner_instruction_events from public,anon,authenticated',
  'auth.uid() is null or app_private.account_role()',
  'on conflict(client_nonce) do nothing',
  'revision=p_expected_revision',
  'owner_user_id=auth.uid()',
  "check (project_id='P01')",
  "'OWNER_PORTAL'",
  'security definer set search_path to',
  'revoke execute on function public.admin_instruction_submit',
  'grant execute on function public.admin_instruction_submit'
 ])assert(sql.includes(needle),needle);
 assert(!/grant\s+(insert|update|delete|all)\s+on\s+app_private\.owner_instruction_(ledger|events)\s+to\s+(anon|authenticated)/i.test(sql));
 assert(!/\b(create|alter|drop)\s+table\s+public\.owner_instruction/i.test(sql));
 assert(!/\b(deploy|force-push|production merge)\s*\(/i.test(ui));
});
test('browser uses server-validated Owner role and scoped RPCs, never localStorage',()=>{
 for(const needle of [
  "A?.canAdmin&&A.status==='authenticated'",
  "adminInstructionSubmit({nonce,summary:s,acceptance:a,scope:paths})",
  'adminInstructionCheckpoint({',
  'adminInstructionList(15)',
  'adminInstructionHistory(item.instruction_id)',
  'window.crypto.randomUUID()',
  'textContent=',
  "panel.hidden=!allowed"
 ])assert(ui.includes(needle),needle);
 assert(!/innerHTML\s*=|localStorage|sessionStorage|service_role|sb_secret_|VERCEL_API_TOKEN/.test(ui));
 for(const method of ['adminInstructionSubmit','adminInstructionList','adminInstructionCheckpoint','adminInstructionHistory'])
  assert(access.includes(method),method);
 assert(access.includes("if(revision!==authRevision||!snapshot().canAdmin"),'stale session response rejected');
});
test('UI is fail-closed when no owner session is available',async()=>{
 const created=[];
 const noOwner={canAdmin:false,status:'public',adminInstructionList(){throw Error('should not load');}};
 const nodes=new Map();
 const mk=id=>({
  id,hidden:false,disabled:false,value:'',textContent:'',dataset:{},
  childNodes:[],addEventListener(){},
  replaceChildren(){this.childNodes=[];},
  append(...values){this.childNodes.push(...values);}
 });
 for(const id of ['instruction-ledger','ledger-state','ledger-items','ledger-form','ledger-summary','ledger-acceptance','ledger-scope','ledger-submit','ledger-refresh'])
  nodes.set(id,mk(id));
 const document={
  getElementById(id){return nodes.get(id)||null;},
  addEventListener(){},
  createElement(tag){const n=mk(tag);n.tagName=tag.toUpperCase();created.push(n);return n;}
 };
 const window={
  RailwayAccess:noOwner,addEventListener(){},crypto:{randomUUID(){return 'test-nonce';}}
 };
 const context={window,document,Date,Intl,Boolean,Array,String,Number,Error,Promise};
 vm.runInNewContext(ui,context);
 assert.equal(nodes.get('instruction-ledger').hidden,true);
 assert.equal(nodes.get('ledger-items').childNodes.length,0);
 assert.equal(nodes.get('ledger-state').dataset.mode,'blocked');
});
test('unit test covers the Owner-only contract without claiming E2E database or Safari PASS',()=>{
 assert(!/\bRELEASED\b|\bTESTED\b|'SOLVED'/i.test(sql),'schema cannot self-approve releases');
 assert(sql.includes("p_event_type not in ('NOTE','DIAGNOSED','BLOCKED')"));
});
