/* Same-origin, aggregate-only analytics. No identifiers or browsing histories leave this page. */
(()=>{
  'use strict';
  if(navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
  const endpoint='/api/anonymous-counts',counts=new Map();
  const allowed=new Set(['welcome','modes','ready','home','journey','experience','lab','activities','about','contact']);
  const safeRoute=value=>allowed.has(value)?value:'welcome';
  const route=()=>document.body.dataset.screen==='portfolio'?safeRoute(location.hash.slice(1)||'home'):safeRoute(document.body.dataset.screen);
  const step=value=>['welcome','modes','ready'].includes(value)?value:'portfolio';
  const lang=()=>({'ms':'BM','en':'EN','zh-Hans':'中文'}[document.documentElement.lang]||'BM');
  const pyn=()=>document.body.classList.contains('with-pinyin')?'ON':'OFF';
  const add=(metric,bucket,n=1)=>{if(n>0){const k=metric+'|'+bucket;counts.set(k,(counts.get(k)||0)+n);}};
  let current=route(),last=performance.now(),active=0,ended=false,flushing=false,progress=-1;
  const reached=new Set(),stages=['welcome','modes','ready','portfolio'];
  let started=performance.now();
  function flush(){
    if(flushing||!counts.size)return;
    // Integer counters only; no URL, referrer, title, text, UUID or auth data.
    const batch=[...counts].slice(0,64);batch.forEach(([k])=>counts.delete(k));
    const body=JSON.stringify({counts:batch.map(([k,n])=>[...k.split('|'),n])});
    flushing=true;
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'same-origin',referrerPolicy:'no-referrer'})
      .catch(()=>{}).finally(()=>{flushing=false;if(counts.size)flush();});
    // Do not retry: avoids duplicate totals without storing a deduplication identity.
  }
  function tick(){
    const now=performance.now();
    if(!document.hidden&&!ended){const seconds=Math.min(35,Math.max(0,(now-last)/1000));active+=seconds;add('active_seconds','all',Math.floor(active)-Math.floor(active-seconds));add('section_seconds',current,Math.floor(seconds));}
    last=now;
  }
  function view(value){
    value=safeRoute(value);if(value===current&&reached.size)return;
    tick();current=value;add('view',value);
    const stage=step(value);
    if(!reached.has(stage)){reached.add(stage);add('reach',stage);}
    const next=stages.indexOf(stage);
    if(next===progress+1){progress=next;add('funnel',stage);}
  }
  function preferences(){
    let state='unknown';
    try{
      const day=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
      const previous=localStorage.getItem('railway-analytics-seen-day');
      state=previous?'returning':'new';
      if(previous!==day)add('daily_browser_estimate','all');
      localStorage.setItem('railway-analytics-seen-day',day);
      // This date is a shared coarse flag, never a random or unique visitor ID and never transmitted.
    }catch{}
    add('returning',state);
  }
  function device(){
    const ua=navigator.userAgent||''; // Parse locally, never transmit the raw string.
    const ipad=/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
    const android=/Android/.test(ua),ios=/iPhone|iPod/.test(ua)||ipad;
    add('os',android?'Android':ios?'iOS':/Windows/.test(ua)?'Windows':/Mac/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'Other');
    add('device',ipad||(android&&!/Mobile/.test(ua))?'tablet':/Mobile|iPhone|iPod/.test(ua)?'mobile':'desktop');
    add('browser',/Edg|EdgiOS|EdgA/.test(ua)?'Edge':/OPR|OPiOS/.test(ua)?'Opera':/SamsungBrowser/.test(ua)?'Samsung':/Firefox|FxiOS/.test(ua)?'Firefox':/Chrome|CriOS/.test(ua)?'Chrome':/Safari/.test(ua)?'Safari':'Other');
    add('screen',innerWidth<650?'mobile':innerWidth<1150?'tablet':'desktop');
  }
  function end(){if(ended)return;tick();ended=true;add('exit',current);add('exit_step',step(current));add('completed_visits','all');add('duration_seconds','all',Math.max(1,Math.min(86400,Math.round((performance.now()-started)/1000))));flush();}
  add('visits','all');preferences();device();add('entry',current);add('language_initial',lang());
  if(document.documentElement.lang==='zh-Hans')add('pinyin_initial',pyn());
  view(current);flush();
  window.addEventListener('hashchange',()=>{view(route());flush();});
  // Section views follow visible content as well as navigation links.
  const observer=new IntersectionObserver(entries=>{
    if(document.body.dataset.screen!=='portfolio')return;
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if(visible)view(visible.target.id);
  },{rootMargin:'-145px 0px -45% 0px',threshold:0});
  document.querySelectorAll('main>section').forEach(s=>observer.observe(s));
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');if(!el)return;
    if(el.dataset.lang){add('language',lang());if(el.dataset.lang==='zh')add('pinyin_initial',pyn());}
    else if(el.classList.contains('pinyin-toggle'))add('pinyin',pyn());
    else if(el.dataset.mode){add('learning_mode',el.dataset.mode);if(el.dataset.mode==='home')add('click','full_portfolio');}
    else if(el.dataset.back)add('click','back');
    else if(el.id==='continue')add('click','continue');
    else if(el.id==='enter-portfolio')add('click','enter_portfolio');
    else if(el.id==='information')add('click','about_information');
    else if(el.id==='dialog-continue')add('click','information_continue');
    else if(el.classList.contains('menu-button'))add('click','menu');
    else if(el.getAttribute('href')==='#opening')add('click','opening');
    else if(el.getAttribute('href')?.startsWith('#'))add('click','navigation');
    flush();
  });
  setInterval(()=>{tick();flush();},30000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!ended){const seconds=Math.min(35,Math.max(0,(performance.now()-last)/1000));active+=seconds;add('active_seconds','all',Math.floor(active)-Math.floor(active-seconds));add('section_seconds',current,Math.floor(seconds));last=performance.now();flush();}else last=performance.now();});
  window.addEventListener('pagehide',end);
  window.addEventListener('pageshow',e=>{if(e.persisted){ended=false;started=last=performance.now();active=0;progress=-1;reached.clear();current=route();add('visits','all');preferences();device();add('entry',current);add('language_initial',lang());if(document.documentElement.lang==='zh-Hans')add('pinyin_initial',pyn());view(current);flush();}});
})();
