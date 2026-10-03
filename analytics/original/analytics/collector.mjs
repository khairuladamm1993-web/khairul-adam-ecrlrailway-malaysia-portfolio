// Only daily counters. Never read identity, cookies, IP addresses or raw user-agent headers.
const routes = ['welcome','modes','ready','home','journey','experience','lab','activities','about','contact'];
const schema = {
  visits:['all'], daily_browser_estimate:['all'], returning:['new','returning','unknown'],
  device:['mobile','tablet','desktop','unknown'], os:['Android','iOS','Windows','macOS','Linux','Other'],
  browser:['Chrome','Safari','Firefox','Edge','Samsung','Opera','Other'], screen:['mobile','tablet','desktop'],
  view:routes, entry:routes, exit:routes, exit_step:['welcome','modes','ready','portfolio'],
  funnel:['welcome','modes','ready','portfolio'], reach:['welcome','modes','ready','portfolio'],
  click:['continue','enter_portfolio','full_portfolio','about_information','information_continue','back','menu','navigation','opening'],
  learning_mode:['journey','experience','lab','home'], language:['BM','EN','中文'],
  language_initial:['BM','EN','中文'], pinyin:['ON','OFF'], pinyin_initial:['ON','OFF'],
  active_seconds:['all'], section_seconds:routes, completed_visits:['all'], duration_seconds:['all'],
};
const timeMetrics = new Set(['active_seconds','section_seconds','duration_seconds']);
const key = 'INSERT INTO anonymous_daily_totals (day,metric,bucket,value) VALUES (?,?,?,?) ON CONFLICT(day,metric,bucket) DO UPDATE SET value=value+excluded.value';
function reply(status){return new Response(null,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function collect(request,env){
  if(request.method!=='POST')return reply(405);
  const origin=request.headers.get('origin');
  if(origin!==new URL(request.url).origin || request.headers.get('sec-fetch-site')==='cross-site')return reply(403);
  if(request.headers.get('DNT')==='1'||request.headers.get('Sec-GPC')==='1')return reply(204);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply(415);
  if(Number(request.headers.get('content-length')||0)>8192)return reply(413);
  // Bound the body while reading, before parsing. Never log rejected content.
  let text='',bytes=0;
  if(!request.body)return reply(400);
  const reader=request.body.getReader(),decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8192){await reader.cancel();return reply(413);}text+=decoder.decode(value,{stream:true});}
  text+=decoder.decode();
  let body;try{body=JSON.parse(text);}catch{return reply(400);}
  if(!body||Object.keys(body).length!==1||!Array.isArray(body.counts)||!body.counts.length||body.counts.length>64)return reply(400);
  const seen=new Set();
  for(const row of body.counts){
    if(!Array.isArray(row)||row.length!==3)return reply(400);
    const [metric,bucket,count]=row;
    if(!Object.hasOwn(schema,metric)||!schema[metric].includes(bucket)||!Number.isInteger(count)||count<1||count>(timeMetrics.has(metric)?86400:100))return reply(400);
    const id=metric+'|'+bucket;if(seen.has(id))return reply(400);seen.add(id);
  }
  if(!env.DB)return reply(503);
  const now=new Date();
  // Daily buckets use Malaysia time; no exact event timestamps persist.
  const day=new Date(now.getTime()+8*3600000).toISOString().slice(0,10);
  const cutoff=new Date(now.getTime()+8*3600000-90*86400000).toISOString().slice(0,10);
  const counts=[...body.counts];
  const visits=counts.find(([m])=>m==='visits')?.[2];
  if(visits){
    // Optional platform-provided coarse country only. No location API or permission request.
    // If unavailable, omit this metric; all other counters must still be accepted.
    try {
      const country=request.cf?.country;
      if(typeof country==='string' && /^[A-Z]{2}$/.test(country)) counts.push(['country',country,visits]);
    } catch { /* Missing/restricted platform metadata must never block analytics. */ }
  }
  try{
    const statements=counts.map(([metric,bucket,count])=>env.DB.prepare(key).bind(day,metric,bucket,count));
    statements.push(env.DB.prepare('DELETE FROM anonymous_daily_totals WHERE day < ?').bind(cutoff));
    await env.DB.batch(statements);
    return reply(204);
  }catch{return reply(503);}
}
