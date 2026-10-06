import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,spawnSync} from 'node:child_process';

const dist=path.resolve(process.argv[2]||'dist-production');
if(!fs.existsSync(path.join(dist,'gateway.html')))throw new Error('Built production artifact required.');

function findChrome(){
  for(const bin of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    const r=spawnSync('which',[bin],{encoding:'utf8'});
    if(r.status===0)return r.stdout.trim();
  }
  throw new Error('Chrome/Chromium not found for responsive artifact smoke test.');
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.xml':'application/xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=raw==='/'?'index.html':raw.replace(/^\//,'');
  const file=path.resolve(dist,rel);
  if(!file.startsWith(dist+path.sep)&&file!==dist){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const sitePort=server.address().port;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'railway-chrome-'));
const chrome=spawn(findChrome(),[
  '--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  `--user-data-dir=${profile}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let stderr='';
const devtoolsUrl=new Promise((resolve,reject)=>{
  chrome.stderr.setEncoding('utf8');
  chrome.stderr.on('data',chunk=>{
    stderr+=chunk;
    const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if(m)resolve(m[1]);
  });
  chrome.once('exit',code=>reject(new Error('Chrome exited before CDP was ready ('+code+'): '+stderr.slice(-2000))));
});
const browserWs=await Promise.race([
  devtoolsUrl,
  new Promise((_,reject)=>setTimeout(()=>reject(new Error('Timed out waiting for Chrome CDP: '+stderr.slice(-2000))),15000))
]);
const debugPort=new URL(browserWs).port;
async function json(url,options){
  let last;
  for(let i=0;i<80;i++){
    try{const r=await fetch(url,options);if(r.ok)return await r.json();last=new Error(String(r.status));}catch(e){last=e;}
    await sleep(100);
  }
  throw last||new Error('CDP unavailable');
}

function mockScript(role){
  return `(()=>{
    const role=${JSON.stringify(role)};
    const profile={user_id:'11111111-1111-4111-8111-111111111111',email:'member@example.com',role,display_name:'Member',enabled:true,activity_consent_at:null,privacy_version:'2026-10-05',last_member_activity:null};
    const q=Array.from({length:16},(_,i)=>({id:'smoke-'+i,prompt:{en:'Q '+i,ms:'S '+i,zh:'题 '+i,py:'tí'},options:{en:['A','B','C'],ms:['A','B','C'],zh:['A','B','C'],py:['','','']},correct:0}));
    const rows={
      member_profiles:[profile],
      member_content:[
        {id:'roll-1',kind:'rolling-stock',title:{en:'Protected rolling stock'},body:{en:'Member data'},evidence:'member',approved:true},
        {id:'corr-1',kind:'corridor',title:{en:'Protected corridor'},body:{en:'Member corridor data'},evidence:'member',approved:true}
      ],
      quiz_banks:[{id:'smoke',title:{en:'Smoke bank'},bank:{id:'smoke',index:1,title:{en:'Smoke bank'},questions:q},approved:true}],
      member_files:[],member_progress:[],quiz_attempts:[],member_engagement:[],admin_audit:[],public_analytics_snapshots:[]
    };
    function builder(name){
      const b={select(){return b},eq(){return b},order(){return b},limit(){return b},maybeSingle(){return Promise.resolve({data:rows[name]?.[0]||null,error:null})},then(resolve,reject){return Promise.resolve({data:rows[name]||[],error:null}).then(resolve,reject)}};
      return b;
    }
    window.supabase={createClient(){return{
      auth:{
        async getSession(){return {data:{session:role==='public'?null:{access_token:'smoke'}},error:null}},
        async getUser(){return {data:{user:role==='public'?null:{id:profile.user_id,email:profile.email}},error:role==='public'?{message:'public'}:null}},
        onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
        async signInWithOtp(){return {error:null}},async signOut(){return {error:null}}
      },
      async rpc(name){
        if(name==='account_role')return {data:role,error:null};
        if(name==='admin_summary')return {data:{members:1,quiz_attempts:0,member_sessions:0,average_visit_seconds:0,active_engagement_seconds:0},error:null};
        if(name==='submit_quiz')return {data:{score:12,passed:true},error:null};
        return {data:null,error:null};
      },
      from(name){return builder(name)},
      storage:{from(){return {async createSignedUrl(){return {data:{signedUrl:'about:blank'},error:null}}}}}
    }}};
  })();`;
}

let nextId=1;
function cdp(wsUrl){
  const ws=new WebSocket(wsUrl),pending=new Map(),listeners=new Map();
  const opened=new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',e=>{
    const m=JSON.parse(e.data);
    if(m.id&&pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(new Error(m.error.message)):resolve(m.result);return;}
    for(const fn of listeners.get(m.method)||[])fn(m.params);
  });
  return {
    opened,
    send(method,params={}){const id=nextId++;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});},
    once(method){return new Promise(resolve=>{const fn=p=>{listeners.set(method,(listeners.get(method)||[]).filter(x=>x!==fn));resolve(p)};listeners.set(method,[...(listeners.get(method)||[]),fn]);});},
    close(){ws.close();}
  };
}

async function waitEval(client,expression,timeout=5000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.result?.value)return true;
    await sleep(80);
  }
  throw new Error('Timed out: '+expression);
}
async function evalValue(client,expression){
  const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'Evaluation failed');
  return r.result?.value;
}

const viewports=[[320,568],[390,844],[430,932],[768,1024],[1024,768],[1024,1366],[1366,1024],[1366,768],[1440,900]];
const roles=['public','member','admin'];
const failures=[];

for(const [width,height] of viewports){
  for(const role of roles){
    const target=await json(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'});
    const client=cdp(target.webSocketDebuggerUrl);await client.opened;
    try{
      await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');
      await client.send('Network.setBlockedURLs',{urls:[
        '*://cdn.jsdelivr.net/*','*://kfudisbzdgsefdjoopzu.supabase.co/*',
        '*://khairul-adam-railway-analytics.khairuladamm1993-web.workers.dev/*'
      ]});
      await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=1024});
      await client.send('Page.addScriptToEvaluateOnNewDocument',{source:mockScript(role)});
      const loaded=client.once('Page.loadEventFired');
      await client.send('Page.navigate',{url:`http://127.0.0.1:${sitePort}/gateway.html`});await loaded;
      await waitEval(client,role==='public'?"window.RailwayAccess&&window.RailwayAccess.level==='public'":`window.RailwayAccess&&window.RailwayAccess.level==='${role}'`);
      await evalValue(client,`(()=>{document.querySelector('#gateway-status [data-member]')?.click();return true})()`);
      await waitEval(client,"document.querySelector('#member-dialog')?.open===true");
      if(role==='admin'){
        await evalValue(client,`(()=>{document.querySelector('[data-admin-dashboard]')?.click();return true})()`);
        await waitEval(client,"!!document.querySelector('.admin-content-form')");
      }
      if(role==='member'){
        await evalValue(client,`(()=>{document.querySelector('[data-category="corridor"]')?.click();return true})()`);
        await sleep(100);
      }
      const result=await evalValue(client,`(()=>{
        const d=document.querySelector('#member-dialog');
        const r=d.getBoundingClientRect();
        const visibleButtons=[...d.querySelectorAll('button,input')].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0});
        const minControl=visibleButtons.length?Math.min(...visibleButtons.map(x=>x.getBoundingClientRect().height)):999;
        return {
          docOverflow:document.documentElement.scrollWidth-window.innerWidth,
          dialogOverflow:d.scrollWidth-d.clientWidth,
          left:r.left,right:r.right,width:window.innerWidth,
          minControl
        };
      })()`);
      const ok=result.docOverflow<=1&&result.dialogOverflow<=1&&result.left>=-1&&result.right<=width+1&&result.minControl>=42;
      if(!ok)failures.push({role,width,height,result});
      else console.log(`PASS ${role} ${width}x${height}`);
    }finally{
      client.close();
      try{await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);}catch{}
    }
  }
}
server.close();
const exited=new Promise(resolve=>chrome.once('exit',resolve));
chrome.kill('SIGTERM');
await Promise.race([exited,sleep(3000)]);
try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:100});}catch{}
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exit(1);}
console.log(`Responsive production artifact smoke: ${roles.length*viewports.length}/${roles.length*viewports.length} PASS`);
