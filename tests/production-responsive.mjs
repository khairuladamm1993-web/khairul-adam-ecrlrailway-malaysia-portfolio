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
        {id:'STN01',kind:'corridor',title:{en:'Kota Bharu'},body:{en:'Member corridor data',chainage:'CH000+670',location:{latitude:6.12345,longitude:102.54321,locationConfidence:'Validated Location',coordinateSource:'Validated project reference'}},evidence:'personal-field-reference',approved:true}
      ],
      quiz_banks:Array.from({length:10},(_,i)=>({id:'smoke-'+(i+1),title:{en:'Smoke bank '+(i+1)},bank:{id:'smoke-'+(i+1),index:i+1,title:{en:'Smoke bank '+(i+1)},questions:q.map((item,j)=>({...item,id:'smoke-'+(i+1)+'-'+j}))},approved:true})),
      member_files:[],member_progress:[],quiz_attempts:[],member_engagement:[],admin_audit:[],public_analytics_snapshots:[]
    };
    function builder(name){
      const b={select(){return b},eq(){return b},order(){return b},limit(){return b},maybeSingle(){return Promise.resolve({data:rows[name]?.[0]||null,error:null})},then(resolve,reject){return Promise.resolve({data:rows[name]||[],error:null}).then(resolve,reject)}};
      return b;
    }
    let sessionActive=role!=='public';
    window.__otpCalls=0;window.__otpMode='success';
    window.__railwayMapCalls={setView:[],markers:[],tileLayers:[],panes:[]};
    window.__rpcCalls=[];
    window.__geoCalls=0;
    window.__locationHistory=[];
    window.__nextLocationVersion=1;
    window.confirm=()=>true;
    window.prompt=()=> 'Rollback after CI review';
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
      getCurrentPosition(success){window.__geoCalls++;success({coords:{latitude:6.22222,longitude:102.66666,accuracy:8}});}
    }});
    window.L={
      map(el){
        const handlers={},panes={};
        return {_el:el,setView(coords,zoom){window.__railwayMapCalls.setView.push({coords:[...coords],zoom});return this},getZoom(){return 6},fitBounds(){return this},invalidateSize(){},remove(){},on(name,fn){handlers[name]=fn;return this},off(name,fn){if(handlers[name]===fn)delete handlers[name];return this},createPane(name){const pane={style:{},classList:{add(v){pane.className=v}}};panes[name]=pane;window.__railwayMapCalls.panes.push(name);return pane},_handlers:handlers,_panes:panes};
      }, 
      tileLayer(url,options={}){window.__railwayMapCalls.tileLayers.push({url,options});return {addTo(){return this}}},
      divIcon(options){return options},
      marker(coords,options={}){
        const rec={coords:[...coords],handlers:{},removed:false,options};
        window.__railwayMapCalls.markers.push(rec);
        const marker={
          addTo(){return marker},bindTooltip(){return marker},on(name,fn){rec.handlers[name]=fn;return marker},off(name,fn){if(rec.handlers[name]===fn)delete rec.handlers[name];return marker},
          remove(){rec.removed=true},setLatLng(next){rec.coords=[Number(next[0]),Number(next[1])];return marker},getLatLng(){return {lat:rec.coords[0],lng:rec.coords[1]}},
          dragging:{enabled:false,enable(){this.enabled=true},disable(){this.enabled=false}}
        };
        rec.marker=marker;return marker;
      },
      latLngBounds(coords){return {coords}}
    };
    window.supabase={createClient(){return{
      auth:{
        async getSession(){return {data:{session:sessionActive?{access_token:'smoke',expires_at:Math.floor(Date.now()/1000)+3600}:null},error:null}},
        async refreshSession(){return {data:{session:sessionActive?{access_token:'smoke-refreshed',expires_at:Math.floor(Date.now()/1000)+3600}:null},error:sessionActive?null:{message:'expired'}}},
        async getUser(){return {data:{user:sessionActive?{id:profile.user_id,email:profile.email}:null},error:sessionActive?null:{message:'public'}}},
        onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
        async signInWithOtp(){window.__otpCalls++;if(window.__otpMode==='rate-limit')return {error:{message:'Email rate limit exceeded',status:429}};return {error:null}},
        async signOut(){sessionActive=false;return {error:null}}
      },
      async rpc(name,args={}){
        window.__rpcCalls.push({name,args});
        if(name==='account_role')return {data:role,error:null};
        if(name==='admin_summary')return {data:{members:1,quiz_attempts:0,member_sessions:0,average_visit_seconds:0,active_engagement_seconds:0},error:null};
        if(name==='submit_quiz')return {data:{score:12,passed:true},error:null};
        if(name==='admin_publish_location'){
          const item=rows.member_content.find(x=>x.id===args.p_asset_id),loc=item.body.location;
          if(!window.__locationHistory.some(x=>x.asset_id===item.id)){
            window.__locationHistory.push({version_id:window.__nextLocationVersion++,asset_id:item.id,previous_latitude:loc.latitude,previous_longitude:loc.longitude,new_latitude:loc.latitude,new_longitude:loc.longitude,previous_confidence:loc.locationConfidence,new_confidence:loc.locationConfidence,source_note:'Baseline captured before first Owner location change',accuracy_m:null,owner_user_id:profile.user_id,action:'baseline',created_at:new Date().toISOString()});
          }
          window.__locationHistory.push({version_id:window.__nextLocationVersion++,asset_id:item.id,previous_latitude:loc.latitude,previous_longitude:loc.longitude,new_latitude:args.p_latitude,new_longitude:args.p_longitude,previous_confidence:loc.locationConfidence,new_confidence:args.p_confidence,source_note:args.p_source_note,accuracy_m:args.p_accuracy_m,owner_user_id:profile.user_id,action:'publish',created_at:new Date().toISOString()});
          item.body.location={latitude:args.p_latitude,longitude:args.p_longitude,locationConfidence:args.p_confidence,coordinateSource:'Owner-approved test location'};
          return {data:{version_id:window.__locationHistory.at(-1).version_id,asset_id:item.id},error:null};
        }
        if(name==='admin_location_history'){
          return {data:window.__locationHistory.filter(x=>!args.p_asset_id||x.asset_id===args.p_asset_id).slice().reverse(),error:null};
        }
        if(name==='admin_restore_location'){
          const v=window.__locationHistory.find(x=>x.version_id===args.p_version_id),item=rows.member_content.find(x=>x.id===v.asset_id),loc=item.body.location;
          item.body.location={latitude:v.new_latitude,longitude:v.new_longitude,locationConfidence:v.new_confidence,coordinateSource:'Restored approved test location'};
          window.__locationHistory.push({version_id:window.__nextLocationVersion++,asset_id:item.id,previous_latitude:loc.latitude,previous_longitude:loc.longitude,new_latitude:v.new_latitude,new_longitude:v.new_longitude,previous_confidence:loc.locationConfidence,new_confidence:v.new_confidence,source_note:args.p_source_note,accuracy_m:v.accuracy_m,owner_user_id:profile.user_id,action:'rollback',restored_from_version:v.version_id,created_at:new Date().toISOString()});
          return {data:{version_id:window.__locationHistory.at(-1).version_id,asset_id:item.id},error:null};
        }
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
      if(role!=='public'){
        const reuse=await evalValue(client,"(()=>({otp:window.__otpCalls,signed:/Already signed in/.test(document.querySelector('#member-dialog-content')?.textContent||''),form:!!document.querySelector('#member-auth-form')}))()");
        if(reuse.otp!==0||!reuse.signed||reuse.form)failures.push({role,width,height,phase:'session-reuse',result:reuse});
      }
      if(role==='public'&&width===390&&height===844){
        await evalValue(client,`(()=>{
          window.__otpMode='rate-limit';
          const f=document.querySelector('#member-auth-form');
          f.querySelector('input[name=email]').value='member@example.com';
          f.requestSubmit();f.requestSubmit();return true;
        })()`);
        await waitEval(client,"window.RailwayAccess.status==='rate-limited'");
        const limited=await evalValue(client,"(()=>({otp:window.__otpCalls,disabled:document.querySelector('#member-auth-form button[type=submit]')?.disabled===true,text:document.querySelector('#member-dialog-content')?.textContent||''}))()");
        if(limited.otp!==1||!limited.disabled||!/Too many verification requests/.test(limited.text))failures.push({role,width,height,phase:'magic-link-rate-limit',result:limited});
      }
      if(role==='admin'){
        await evalValue(client,`(()=>{document.querySelector('[data-admin-dashboard]')?.click();return true})()`);
        await waitEval(client,"!!document.querySelector('.admin-content-form')");
      }
      let practicalResult=null;
      if(role!=='public'){
        await waitEval(client,"document.querySelectorAll('#gateway-content .module[data-member-module]').length===10");
        practicalResult=await evalValue(client,`(()=>{
          const cards=[...document.querySelectorAll('#gateway-content .module[data-member-module]')];
          const widths=cards.map(x=>x.getBoundingClientRect().width);
          const visible=document.querySelector('#gateway-content')?.innerText||'';
          return {
            count:cards.length,
            allPressed:cards.every(x=>x.getAttribute('aria-pressed')==='false'),
            literalAttribute:/aria-pressed\\s*=\\s*["']?false["']?>/i.test(visible),
            minWidth:Math.min(...widths),
            titles:cards.map(x=>x.querySelector('.module-title')?.textContent?.trim()||'')
          };
        })()`);
        const practicalOK=practicalResult.count===10&&practicalResult.allPressed&&!practicalResult.literalAttribute&&practicalResult.minWidth>=180&&practicalResult.titles.every(Boolean);
        if(!practicalOK)failures.push({role,width,height,phase:'member-practical-modules',result:practicalResult});
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
      if(!ok)failures.push({role,width,height,phase:'member-dialog',result});
      await evalValue(client,`(()=>{document.querySelector('#member-dialog')?.close();document.querySelector('[data-category="map"]')?.click();return true})()`);
      await waitEval(client,"document.querySelector('#railway-map-mount')?.dataset.mapReady==='true'");
      const mapResult=await evalValue(client,`(()=>{
        const m=document.querySelector('.map-module'),canvas=document.querySelector('.map-canvas');
        const controls=[...m.querySelectorAll('button,input')].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0});
        return {
          docOverflow:document.documentElement.scrollWidth-window.innerWidth,
          moduleOverflow:m.scrollWidth-m.clientWidth,
          canvasHeight:canvas.getBoundingClientRect().height,
          minControl:Math.min(...controls.map(x=>x.getBoundingClientRect().height)),
          lazyScript:!!document.querySelector('script[data-railway-map-module]'),
          order:[...document.querySelectorAll('#categories [data-category]')].map(x=>x.dataset.category).join(','),
          tileUrls:window.__railwayMapCalls.tileLayers.map(x=>x.url),
          panes:window.__railwayMapCalls.panes.slice()
        };
      })()`);
      const expectedMarkers=role==='public'?0:1;
      const exactResult=await evalValue(client,`(()=>{
        const host=document.querySelector('#railway-map-mount');
        const markers=window.__railwayMapCalls.markers;
        const focus=document.querySelector('[data-map-focus]');
        const kota=[...document.querySelectorAll('[data-map-point]')].find(x=>x.textContent.includes('Kota Bharu'));
        const targetMarker=markers.find(m=>Math.abs(m.coords[0]-6.12345)<1e-8&&Math.abs(m.coords[1]-102.54321)<1e-8);
        const before=targetMarker?.coords?[...targetMarker.coords]:null;
        if(targetMarker?.handlers?.click){
          window.__railwayMapCalls.setView.length=0;
          targetMarker.handlers.click({target:targetMarker.marker});
        }else if(kota){
          kota.click();
        }
        const markerFocus=window.__railwayMapCalls.setView.at(-1)||null;
        if(${JSON.stringify(role)}!=='public'){
          window.__railwayMapCalls.setView.length=0;
          focus?.click();
        }
        const buttonFocus=window.__railwayMapCalls.setView.at(-1)||null;
        const after=targetMarker?.coords?[...targetMarker.coords]:null;
        const detail=document.querySelector('[data-map-detail]')?.textContent||'';
        return {
          validatedMarkers:Number(host?.dataset.validatedMarkers||0),
          markerCount:markers.length,
          before,after,markerFocus,buttonFocus,
          focusDisabled:focus?.disabled,
          detail
        };
      })()`);
      const exactOK=role==='public'
        ? exactResult.validatedMarkers===0&&exactResult.markerCount>0&&exactResult.before===null
        : exactResult.validatedMarkers===1&&exactResult.markerCount>1&&
          JSON.stringify(exactResult.before)===JSON.stringify([6.12345,102.54321])&&
          JSON.stringify(exactResult.after)===JSON.stringify(exactResult.before)&&
          JSON.stringify(exactResult.markerFocus?.coords)===JSON.stringify(exactResult.before)&&exactResult.markerFocus?.zoom===11&&
          JSON.stringify(exactResult.buttonFocus?.coords)===JSON.stringify(exactResult.before)&&exactResult.buttonFocus?.zoom===11&&
          exactResult.focusDisabled===false&&/STN01/.test(exactResult.detail)&&/CH000\+670/.test(exactResult.detail)&&
          /6\.12345/.test(exactResult.detail)&&/102\.54321/.test(exactResult.detail)&&/Validated Location/.test(exactResult.detail);
      const mapOK=mapResult.docOverflow<=1&&mapResult.moduleOverflow<=1&&mapResult.canvasHeight>=280&&mapResult.minControl>=42&&mapResult.lazyScript&&mapResult.order==='practical,ebook,corridor,map,future,news'&&mapResult.tileUrls.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png')&&mapResult.tileUrls.includes('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png')&&mapResult.panes.includes('railwayBase')&&mapResult.panes.includes('railwayReference');
      if(!mapOK)failures.push({role,width,height,phase:'map',result:mapResult});
      if(!exactOK)failures.push({role,width,height,phase:'exact-location',result:exactResult});

      let ownerOK=true;
      if(role!=='admin'){
        const ownerState=await evalValue(client,`(()=>({script:!!document.querySelector('script[data-railway-owner-map]'),panel:!!document.querySelector('.owner-map-panel'),geo:window.__geoCalls,publish:window.__rpcCalls.filter(x=>x.name==='admin_publish_location').length}))()`);
        ownerOK=!ownerState.script&&!ownerState.panel&&ownerState.geo===0&&ownerState.publish===0;
        if(!ownerOK)failures.push({role,width,height,phase:'owner-security',result:ownerState});
      }else{
        await waitEval(client,"!!document.querySelector('.owner-map-panel')");
        const preOwner=await evalValue(client,`(()=>{
          const p=document.querySelector('.owner-map-panel'),r=p?.getBoundingClientRect();
          const controls=[...p.querySelectorAll('button,input,select,textarea')].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0});
          return {geo:window.__geoCalls,publish:window.__rpcCalls.filter(x=>x.name==='admin_publish_location').length,panel:!!p,docOverflow:document.documentElement.scrollWidth-window.innerWidth,panelOverflow:p.scrollWidth-p.clientWidth,right:r.right,minControl:Math.min(...controls.map(x=>x.getBoundingClientRect().height))};
        })()`);
        ownerOK=preOwner.panel&&preOwner.geo===0&&preOwner.publish===0&&preOwner.docOverflow<=1&&preOwner.panelOverflow<=1&&preOwner.right<=width+1&&preOwner.minControl>=42;
        if(width===1024&&height===768){
          await evalValue(client,`(()=>{document.querySelector('[data-owner-geolocate]')?.click();return true})()`);
          await waitEval(client,"window.__geoCalls===1&&document.querySelector('[data-owner-use-current]')");
          await evalValue(client,`(()=>{document.querySelector('[data-owner-use-current]')?.click();return true})()`);
          await waitEval(client,"!!document.querySelector('[data-owner-edit-form]')");
          await evalValue(client,`(()=>{
            const m=window.__railwayMapCalls.markers.find(x=>!x.removed&&x.marker?.dragging?.enabled);
            if(m){m.coords=[6.22223,102.66667];m.handlers.dragend?.({target:m.marker});}
            return true;
          })()`);
          const draftState=await evalValue(client,"(()=>({storedStillOriginal:window.__railwayMapCalls.markers.some(x=>!x.removed&&!x.marker?.dragging?.enabled&&Math.abs(x.coords[0]-6.12345)<1e-8&&Math.abs(x.coords[1]-102.54321)<1e-8),draftAtProposed:window.__railwayMapCalls.markers.some(x=>!x.removed&&x.marker?.dragging?.enabled&&Math.abs(x.coords[0]-6.22223)<1e-8&&Math.abs(x.coords[1]-102.66667)<1e-8),controls:!!document.querySelector('[data-owner-reset]')&&!!document.querySelector('[data-owner-focus]')&&/Current stored location/.test(document.querySelector('[data-owner-workflow]')?.textContent||'')&&/Proposed draft location/.test(document.querySelector('[data-owner-workflow]')?.textContent||'')}))()");
          const draftBefore=await evalValue(client,"window.__rpcCalls.filter(x=>x.name==='admin_publish_location').length");
          await evalValue(client,`(()=>{
            const f=document.querySelector('[data-owner-edit-form]');
            f.querySelector('[name=confidence]').value='Personal Field-Validated Location';
            f.querySelector('[name=sourceNote]').value='CI field GPS confirmation';
            f.requestSubmit();return true;
          })()`);
          await waitEval(client,"!!document.querySelector('[data-owner-confirm]')");
          const reviewBefore=await evalValue(client,"window.__rpcCalls.filter(x=>x.name==='admin_publish_location').length");
          await evalValue(client,`(()=>{document.querySelector('[data-owner-confirm]')?.click();return true})()`);
          await waitEval(client,"window.__rpcCalls.filter(x=>x.name==='admin_publish_location').length===1");
          await waitEval(client,"/6\\.22223/.test(document.querySelector('[data-map-detail]')?.textContent||'')");
          await evalValue(client,`(()=>{document.querySelector('[data-owner-history]')?.click();return true})()`);
          await waitEval(client,"document.querySelectorAll('[data-owner-restore]').length>=2");
          const historyState=await evalValue(client,`(()=>({rows:window.__locationHistory.length,baseline:window.__locationHistory.some(x=>x.action==='baseline'),publish:window.__locationHistory.some(x=>x.action==='publish')}))()`);
          await evalValue(client,`(()=>{
            const b=[...document.querySelectorAll('[data-owner-restore]')].find(x=>x.dataset.ownerRestore==='1');b?.click();return true;
          })()`);
          await waitEval(client,"window.__rpcCalls.filter(x=>x.name==='admin_restore_location').length===1");
          await waitEval(client,"/6\\.12345/.test(document.querySelector('[data-map-detail]')?.textContent||'')");
          const ownerState=await evalValue(client,`(()=>({
            geo:window.__geoCalls,
            publishCalls:window.__rpcCalls.filter(x=>x.name==='admin_publish_location').length,
            restoreCalls:window.__rpcCalls.filter(x=>x.name==='admin_restore_location').length,
            historyRows:window.__locationHistory.length,
            baseline:window.__locationHistory.some(x=>x.action==='baseline'),
            rollback:window.__locationHistory.some(x=>x.action==='rollback'),
            restoredMarker:window.__railwayMapCalls.markers.some(x=>!x.removed&&Math.abs(x.coords[0]-6.12345)<1e-8&&Math.abs(x.coords[1]-102.54321)<1e-8),
            detail:document.querySelector('[data-map-detail]')?.textContent||''
          }))()`);
          ownerOK=ownerOK&&draftState.storedStillOriginal&&draftState.draftAtProposed&&draftState.controls&&draftBefore===0&&reviewBefore===0&&historyState.rows>=2&&historyState.baseline&&historyState.publish&&ownerState.geo===1&&ownerState.publishCalls===1&&ownerState.restoreCalls===1&&ownerState.rollback&&ownerState.restoredMarker&&/6\.12345/.test(ownerState.detail);
        }
        if(!ownerOK)failures.push({role,width,height,phase:'owner-workflow',result:preOwner});
      }
      let logoutOK=true;
      if(role==='member'&&width===390&&height===844){
        await evalValue(client,`(()=>{document.querySelector('#gateway-status [data-member]')?.click();return true})()`);
        await waitEval(client,"document.querySelector('#member-dialog')?.open===true");
        await evalValue(client,`(()=>{document.querySelector('[data-logout]')?.click();return true})()`);
        await waitEval(client,"window.RailwayAccess.level==='public'&&window.RailwayAccess.status==='signed-out'");
        const loggedOut=await evalValue(client,"(()=>({form:!!document.querySelector('#member-auth-form'),admin:!!document.querySelector('[data-admin-dashboard]'),otp:window.__otpCalls,status:window.RailwayAccess.status}))()");
        logoutOK=loggedOut.form&&!loggedOut.admin&&loggedOut.otp===0&&loggedOut.status==='signed-out';
        if(!logoutOK)failures.push({role,width,height,phase:'logout-requires-reauth',result:loggedOut});
      }
      if(ok&&mapOK&&exactOK&&ownerOK&&logoutOK)console.log(`PASS ${role} ${width}x${height}`);
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
