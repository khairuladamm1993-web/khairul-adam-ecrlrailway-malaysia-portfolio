import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {collect} from './collector.mjs';
function db(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_loose_northstar.sql',import.meta.url),'utf8'));return {sql,prepare(query){return{bind(...args){return{query,args};}}},async batch(statements){sql.exec('BEGIN');try{for(const {query,args}of statements)sql.prepare(query).run(...args);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};}
function request(body,headers={},method='POST'){const r=new Request('https://portfolio.test/api/anonymous-counts',{method,headers:{origin:'https://portfolio.test','content-type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});Object.defineProperty(r,'cf',{value:{country:'MY',city:'Never save this'}});return r;}
test('aggregates counters without storing per-visitor identity, payloads, geography detail or timestamps',async()=>{
 const DB=db();const body={counts:[['visits','all',1],['view','lab',3],['language','中文',1]]};
 const secret={'oai-authenticated-user-id':'DO-NOT-STORE','oai-authenticated-user-email':'private@example.test','cf-connecting-ip':'192.0.2.1',cookie:'identity=secret','user-agent':'private device text'};
 assert.equal((await collect(request(body,secret),{DB})).status,204);await collect(request(body),{DB});
 const rows=DB.sql.prepare('SELECT * FROM anonymous_daily_totals').all();
 assert.equal(rows.find(r=>r.metric==='visits').value,2);assert.equal(rows.find(r=>r.metric==='view').value,6);assert.equal(rows.find(r=>r.metric==='country').bucket,'MY');
 assert(!JSON.stringify(rows).includes('private'));assert(!JSON.stringify(rows).includes('DO-NOT'));assert(rows.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.day)));
});
test('rejects extra identifiers, raw text, URLs, cross-origin requests and oversized bodies',async()=>{
 const DB=db();for(const body of [{counts:[['visits','all',1]],email:'x'},{counts:[['view','https://private.test',1]]},{counts:[['view','lab',1.5]]},{counts:[['view','lab',1],['view','lab',1]]},{counts:[['__proto__','x',1]]}])assert.equal((await collect(request(body),{DB})).status,400);
 assert.equal((await collect(request({counts:[['visits','all',1]]},{origin:'https://other.test'}),{DB})).status,403);
 assert.equal((await collect(request({counts:[['visits','all',1]]},{'content-length':'9000'}),{DB})).status,413);
 assert.equal(DB.sql.prepare('SELECT count(*) n FROM anonymous_daily_totals').get().n,0);
});
test('respects privacy signals, exposes no reading endpoint, fails safely, purges old daily buckets',async()=>{
 const DB=db(),body={counts:[['visits','all',1]]};
 for(const headers of [{'DNT':'1'},{'Sec-GPC':'1'}])assert.equal((await collect(request(body,headers),{DB})).status,204);
 assert.equal(DB.sql.prepare('SELECT count(*) n FROM anonymous_daily_totals').get().n,0);
 assert.equal((await collect(request(null,{},'GET'),{DB})).status,405);
 assert.equal((await collect(request(body),{})).status,503);
 DB.sql.prepare('INSERT INTO anonymous_daily_totals VALUES (?,?,?,?)').run('2000-01-01','visits','all',1);
 await collect(request(body),{DB});assert.equal(DB.sql.prepare("SELECT count(*) n FROM anonymous_daily_totals WHERE day='2000-01-01'").get().n,0);
});
test('missing or inaccessible coarse country never blocks other metrics',async()=>{
 for(const metadata of [undefined,{}, {country:'invalid'}, 'throws']){
  const DB=db();const r=new Request('https://portfolio.test/api/anonymous-counts',{method:'POST',headers:{origin:'https://portfolio.test','content-type':'application/json'},body:JSON.stringify({counts:[['visits','all',1],['click','continue',1],['funnel','welcome',1]]})});
  Object.defineProperty(r,'cf',metadata==='throws'?{get(){throw new Error('Metadata unavailable');}}:{value:metadata});
  assert.equal((await collect(r,{DB})).status,204);
  const rows=DB.sql.prepare('SELECT * FROM anonymous_daily_totals').all();
  assert.equal(rows.length,3);assert(rows.every(r=>r.metric!=='country'));assert.equal(rows.find(r=>r.metric==='visits').value,1);
 }
});
test('coarse country never reads precise location or permission APIs',async()=>{
 const DB=db();const r=new Request('https://portfolio.test/api/anonymous-counts',{method:'POST',headers:{origin:'https://portfolio.test','content-type':'application/json'},body:JSON.stringify({counts:[['visits','all',1]]})});
 const cf={country:'MY'};
 for(const name of ['latitude','longitude','city','postalCode','region','regionCode'])Object.defineProperty(cf,name,{get(){throw new Error('Precise location forbidden');}});
 Object.defineProperty(r,'cf',{value:cf});
 assert.equal((await collect(r,{DB})).status,204);
 assert.equal(DB.sql.prepare("SELECT bucket FROM anonymous_daily_totals WHERE metric='country'").get().bucket,'MY');
});
