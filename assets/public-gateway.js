/* Public gateway: preserved navigation, no member data or simulated login. */
(()=>{
 const R=window.Railway,h=R.html;
 const categories=[['practical','PRACTICAL QUALIFICATION'],['ebook','E-BOOK TRAIN OPERATION'],['corridor','ECRL STATIONS & CORRIDOR'],['map','MAP'],['future','COMING SOON'],['news','NEWS, INSIGHTS & REFERENCES']];
 const destinations=[['home','Full Portfolio'],['journey','Railway Journey'],['experience','Field Experience'],['lab','Simulator Lab']];
 const read=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(key))??fallback;}catch{return fallback;}};
 const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}};
 let category=read('railway-gateway-category','practical'),destination=read('railway-gateway-destination','home');
 if(!categories.some(c=>c[0]===category))category='practical';if(!destinations.some(c=>c[0]===destination))destination='home';
 const box=document.querySelector('#gateway-content'),dialog=document.querySelector('#detail-dialog');
 let currentDetail=null,returnSelector=null;
 const accessButton=(label='LOGIN / MEMBER ACCESS')=>`<button class="secondary" data-member>${h(label)}</button>`;
 const boundary=()=>`<p class="study-boundary">${h('Publicly confirmed · Personal field reference · Simulator / development only')}</p>`;
 const locked=title=>`<article class="learning-card locked-card"><span class="access-label">${h('Verified Member access')}</span><h2>${h(title)}</h2><p>${h('Full material opens after verified email sign-in using the secure Magic Link sent to your email. No IC or passport is required.')}</p>${accessButton()}</article>`;
 const track=(metric,bucket)=>window.dispatchEvent(new CustomEvent('railway-learning-event',{detail:{metric,bucket}}));
 let mapLoader=null;
 const ensureMap=()=>{
  if(window.RailwayMap)return Promise.resolve(window.RailwayMap);
  if(mapLoader)return mapLoader;
  const load=(src,attr,ready)=>new Promise((resolve,reject)=>{
   if(ready())return resolve();
   const existing=document.querySelector('script['+attr+']');
   if(existing){existing.addEventListener('load',()=>ready()?resolve():reject(new Error(src+' unavailable')),{once:true});existing.addEventListener('error',reject,{once:true});return;}
   const s=document.createElement('script');s.src=src;s.async=true;s.setAttribute(attr,'1');s.onload=()=>ready()?resolve():reject(new Error(src+' unavailable'));s.onerror=()=>reject(new Error(src+' failed to load'));document.head.append(s);
  });
  mapLoader=(async()=>{await load('assets/map-intelligence.js','data-railway-map-intelligence',()=>Boolean(window.RailwayMapIntelligence));await load('assets/map-gateway.js','data-railway-map-module',()=>Boolean(window.RailwayMap));return window.RailwayMap;})();
  return mapLoader;
 };
 const mountMap=()=>ensureMap().then(m=>m.mount(document.querySelector('#railway-map-mount'))).catch(error=>{const host=document.querySelector('#railway-map-mount');if(host)host.innerHTML='<article class="learning-card"><h2>MAP</h2><p>'+R.escape(error.message||error)+'</p></article>';});
 function renderDetail(){
  const body=document.querySelector('#detail-content');
  const controls=`<div class="quiz-languages">${['ms','en','zh'].map(l=>`<button data-detail-lang="${l}" aria-pressed="${R.language===l}">${({ms:'BM',en:'EN',zh:'中文'})[l]}</button>`).join('')}${R.language==='zh'?`<button data-detail-pinyin aria-pressed="${R.pinyin}">Pinyin ${R.pinyin?'ON':'OFF'}</button>`:''}<button data-detail-theme>${h(window.RailwayTheme.value==='light'?'Dark Mode':'Light Mode')}</button></div>`;
  if(currentDetail==='member')body.innerHTML=`<h2 id="detail-title">${h('Verified Member')}</h2><p class="access-label">${h('Secure email Magic Link')}</p><p>${h('Enter your email to receive a one-time secure sign-in link. Member access remains locked until a verified Supabase session is confirmed.')}</p><p>${h('No IC or passport is required. Public portfolio access remains available without login.')}</p><a class="primary" href="portfolio.html#home">${h('Browse the public portfolio')}</a>`;
  else {const item=window.RailwayInsights[currentDetail];if(!item)return;body.innerHTML=`<p class="access-label">${h('Public overview')}</p><h2 id="detail-title">${h(item.title)}</h2><p>${h(item.summary)}</p><div class="detail-member"><h3>${h('Detailed Insights — Member Access')}</h3>${accessButton()}</div>`;}
  body.insertAdjacentHTML('afterbegin',controls);
 }
 function openDetail(detail,selector){currentDetail=detail;returnSelector=selector;renderDetail();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('[data-close]').focus();}
 function render(){
  if(category!=='map')window.RailwayMap?.unmount();
  document.querySelector('#categories').innerHTML=categories.map(([id,title])=>`<button role="tab" aria-selected="${id===category}" data-category="${id}">${h(title)}</button>`).join('');
  document.querySelector('#categories').setAttribute('role','tablist');
  if(!window.RailwayAccess)document.querySelector('#gateway-status').innerHTML=`<span class="access-label">${h('Public')}</span><button class="member-entry" data-member>${h('LOGIN / MEMBER ACCESS')}</button>`;
  document.querySelector('#destinations').innerHTML=destinations.map(([id,title])=>`<button data-mode="${id}" aria-pressed="${id===destination}">${h(title)}</button>`).join('');
  document.querySelector('#enter-portfolio').href='portfolio.html#'+destination;
  document.querySelector('#start-quiz').hidden=true;
  if(category==='practical')box.innerHTML=`<div class="content-heading"><div><h2>${h('Module previews')}</h2><p>${h('Full quiz — Member Access')}</p></div></div><div class="module-grid">${window.RailwayModulePreviews.map(m=>`<button class="module" data-preview-module="${m.id}" data-member><span class="module-index">${String(m.index).padStart(2,'0')}</span><span><span class="module-title">${h(m.title)}</span><span class="module-meta">${h('16-question bank')} · ${h('Verified Member access')}</span></span><span aria-hidden="true">↗</span></button>`).join('')}</div><section class="content-row"><h2>${h('Rolling Stock Library')}</h2><article class="learning-card"><h3>CR200J</h3><p>${h('ECRL passenger rolling stock')}</p><p>${h('Full rolling-stock specification — Member Access')}</p>${accessButton()}</article></section>`;
  else if(category==='ebook')box.innerHTML=locked('E-BOOK TRAIN OPERATION');
  else if(category==='corridor')box.innerHTML=`<section class="content-row"><h2>${h('ECRL STATIONS & CORRIDOR')}</h2><article class="learning-card locked-card"><h3>${h('Corridor Master Overview')}</h3><div class="map-placeholder" role="img" aria-label="${R.escape(R.text('Protected image pending secure member storage.'))}"><span>${h('Verified Member access')}</span></div><p>${h('Personal corridor compilation / working reference. Not an official engineering drawing.')}</p><p>${h('Protected image pending secure member storage.')}</p>${accessButton('LOGIN TO VIEW FULL CORRIDOR')}</article></section><section class="content-row"><h2>${h('Station & facility details')}</h2><p>${h('Station codes, approved chainage, section groups and facility details will be available to verified members.')}</p>${boundary()}</section>`;
  else if(category==='map'){box.innerHTML='<section class="content-row"><div class="content-heading"><div><h2>'+h('MAP')+'</h2><p>'+h('Visual projection of approved Corridor references. No route line.')+'</p></div></div><div id="railway-map-mount" class="railway-map-mount" aria-live="polite"><article class="learning-card"><p>'+h('Loading map on demand…')+'</p></article></div></section>';setTimeout(mountMap,0);}
  else if(category==='future')box.innerHTML=`<article class="learning-card locked-card"><h2>${h('COMING SOON')}</h2><p class="access-label">${h('Restricted Development Preview — Verified Member Access')}</p><p>${h('Development details are reserved for verified members.')}</p>${accessButton()}</article>`;
  else box.innerHTML=`<section class="content-row" data-news-row="news"><h2>01 / ${h('News')}</h2><article class="learning-card"><span class="access-label">${h('Official source directory')}</span><h3>CCC / CHEC — ECRL</h3><p>${h('No dated news item has been added yet. Updates will show a date, source, short summary and original link after verification.')}</p><p class="study-boundary">${h('CHEC Malaysia source site — under maintenance when checked on 5 October 2026.')}</p><a href="https://chec.my/" target="_blank" rel="noopener noreferrer">${h('Visit original source')} ↗</a></article></section><section class="content-row" data-news-row="insights"><h2>02 / ${h('Insights')}</h2><div class="learning-grid">${window.RailwayInsights.map((item,i)=>`<button class="insight-button" data-insight="${i}" aria-haspopup="dialog">${h(item.title)} <span aria-hidden="true">↗</span></button>`).join('')}</div></section><section class="content-row" data-news-row="references"><h2>03 / ${h('References')}</h2><article class="learning-card"><h3>${h('Independent Railway Development')}</h3><p>${h('Project references support this independent portfolio. Organisations are credited as sources, not endorsers.')}</p><a href="references.html">${h('Railway Project References')} ↗</a></article></section>`;
  if(dialog.open)renderDetail();
 }
 document.querySelector('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;destination=({practical:'experience',ebook:'journey',corridor:'journey',map:'journey',future:'home',news:'lab'})[category];write('railway-gateway-category',category);write('railway-gateway-destination',destination);render();document.querySelector(`[data-category="${category}"]`).focus({preventScroll:true});box.scrollTop=0;track('category',category);});
 document.querySelector('#categories').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const bs=[...e.currentTarget.querySelectorAll('button')],i=bs.indexOf(document.activeElement),last=bs.length-1,n=e.key==='Home'?0:e.key==='End'?last:(i+(e.key==='ArrowRight'?1:last))%bs.length;bs[n].click();});
 document.querySelector('#destinations').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;destination=b.dataset.mode;write('railway-gateway-destination',destination);render();document.querySelector(`[data-mode="${destination}"]`).focus({preventScroll:true});});
 document.addEventListener('click',e=>{
  const lang=e.target.closest('[data-detail-lang]');if(lang){document.querySelector(`[data-lang="${lang.dataset.detailLang}"]`).click();dialog.querySelector(`[data-detail-lang="${lang.dataset.detailLang}"]`)?.focus();return;}
  if(e.target.closest('[data-detail-pinyin]')){document.querySelector('.language-dock .pinyin-toggle').click();dialog.querySelector('[data-detail-pinyin]')?.focus();return;}
  if(e.target.closest('[data-detail-theme]')){window.RailwayTheme.toggle();dialog.querySelector('[data-detail-theme]')?.focus();return;}
  const insight=e.target.closest('[data-insight]');if(insight){openDetail(Number(insight.dataset.insight),`[data-insight="${insight.dataset.insight}"]`);return;}
  const member=e.target.closest('[data-member]');if(member){const prior=returnSelector;openDetail('member',dialog.contains(member)?prior:member.dataset.previewModule?`[data-preview-module="${member.dataset.previewModule}"]`:member.closest('#gateway-status')?'#gateway-status [data-member]':'#gateway-content [data-member]');}
 });
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 // Native dialog traps focus and handles Escape. Explicit restoration survives language re-rendering.
 dialog.addEventListener('close',()=>{currentDetail=null;document.querySelector(returnSelector||'#gateway-status [data-member]')?.focus({preventScroll:true});});
 R.onLanguage(render);render();
})();
