/* Shared preferences, stored locally only. Language changes do not navigate. */
(()=>{
 const dict=window.railwayTranslations||{},listeners=[];
 const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 let language=read('railway-language','ms'),pinyin=read('railway-pinyin','off')==='on';
 if(!['ms','en','zh'].includes(language))language='ms';
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const obj=value=>typeof value==='string'?{en:value,...dict[value]}:value;
 const text=value=>{const o=obj(value);return o[language]||o.en||'';};
 const html=value=>{const o=obj(value);return '<span class="localized"><span>'+escape(text(o))+'</span>'+(language==='zh'&&pinyin&&o.py?'<span class="pinyin" lang="zh-Latn">'+escape(o.py)+'</span>':'')+'</span>';};
 function bind(root=document.body){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){if(node.parentElement.closest('script,style,[data-lang],.pinyin-toggle,.theme-toggle,[data-i18n],.localized'))continue;const key=node.textContent.trim();if(!dict[key])continue;const span=document.createElement('span');span.dataset.i18n=key;node.replaceWith(span);}
 }
 function translate(){
  const anchor=document.body.dataset.screen==='portfolio'?[...document.querySelectorAll('main>section')].find(s=>s.getBoundingClientRect().bottom>160):null,offset=anchor?.getBoundingClientRect().top;
  document.documentElement.lang=language==='zh'?'zh-Hans':language;document.body.classList.toggle('with-pinyin',language==='zh'&&pinyin);
  document.querySelectorAll('[data-i18n]').forEach(el=>el.innerHTML=html(el.dataset.i18n));
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===language)));
  document.querySelectorAll('.pinyin-toggle').forEach(b=>{b.hidden=language!=='zh';b.textContent='Pinyin '+(pinyin?'ON':'OFF');b.setAttribute('aria-pressed',String(pinyin));});
  document.querySelectorAll('.theme-toggle').forEach(b=>{const light=window.RailwayTheme?.value==='light';b.innerHTML=html(light?'Dark Mode':'Light Mode');b.setAttribute('aria-pressed',String(!light));});
  listeners.forEach(fn=>fn());
  if(anchor)window.scrollBy(0,anchor.getBoundingClientRect().top-offset);
 }
 document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{language=b.dataset.lang;write('railway-language',language);translate();}));
 document.querySelectorAll('.pinyin-toggle').forEach(b=>b.addEventListener('click',()=>{pinyin=!pinyin;write('railway-pinyin',pinyin?'on':'off');translate();}));
 window.Railway={html,text,escape,bind,translate,onLanguage:fn=>listeners.push(fn),get language(){return language;},get pinyin(){return pinyin;}};
 document.querySelectorAll('.language-dock').forEach(dock=>{const button=document.createElement('button');button.type='button';button.className='theme-toggle';button.addEventListener('click',()=>window.RailwayTheme.toggle());dock.append(button);});
 bind();translate();
})();
