const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const chapterHtml=read('reading/railway-fundamentals-01.html');
const chapterJs=read('reading/chapter-01-i18n.js');
const gatewayJs=read('assets/public-gateway.js');
const theme=read('assets/theme.css');
function chapter(lang='ms',mode='light',url='https://mrs10.example/reading/railway-fundamentals-01.html'){
 const dom=new JSDOM(chapterHtml,{url,runScripts:'outside-only'});
 const w=dom.window;
 w.localStorage.setItem('railway-language',lang);
 w.localStorage.setItem('railway-theme',mode);
 w.eval(chapterJs);
 return dom;
}
test('Chapter 01 defaults to saved EN with complete substantive English narrative, contents and answers',()=>{
 const dom=chapter('en');
 const d=dom.window.document;
 assert.equal(d.documentElement.lang,'en');
 assert.match(d.querySelector('h1').textContent,/Chapter 01 — Introduction to Railway Systems/);
 assert.match(d.querySelector('#kawalan > p').textContent,/stopping distances/);
 assert.match(d.querySelector('#interaksi > p').textContent,/passenger train traveling/);
 assert.match(d.querySelector('#semak details summary').textContent,/rolling stock/);
 assert.match(d.querySelector('#rujukan h2').textContent,/References/);
 assert.equal(d.querySelectorAll('#glosari tbody tr').length,6);
 assert.equal(d.querySelectorAll('#rujukan ol a[target="_blank"]').length,3);
 assert.equal(d.getElementById('article-language').value,'en');
});
test('Chapter 01 renders full Chinese narrative and preserves pinyin glossary',()=>{
 const dom=chapter('zh');
 const d=dom.window.document;
 assert.equal(d.documentElement.lang,'zh-Hans');
 assert.match(d.querySelector('h1').textContent,/第01章/);
 assert.match(d.querySelector('#hasil p').textContent,/读者/);
 assert.match(d.querySelector('#kawalan > p').textContent,/制动距离/);
 assert.match(d.querySelector('#semak details summary').textContent,/轨道车辆/);
 assert.match(d.querySelector('#glosari').textContent,/tiělù xìtǒng/);
 assert.equal(d.querySelectorAll('#rujukan ol a').length,3);
});
test('Changing Chapter 01 language persists back to Gateway and replaces the whole article',()=>{
 const dom=chapter('ms');const w=dom.window,d=w.document;
 assert.match(d.querySelector('h1').textContent,/Bab 01/);
 const select=d.getElementById('article-language');
 select.value='en';select.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(w.localStorage.getItem('railway-language'),'en');
 assert.equal(d.documentElement.lang,'en');
 assert.equal(new URL(w.location.href).searchParams.get('lang'),'en');
 select.value='zh';select.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.match(d.querySelector('#rujukan h2').textContent,/参考资料/);
 select.value='ms';select.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.match(d.querySelector('#landasan h2').textContent,/Landasan/);
 assert.equal(d.querySelectorAll('#semak details').length,3);
});
test('Deep link language overrides saved locale and saves new choice',()=>{
 const dom=chapter('ms','light','https://mrs10.example/reading/railway-fundamentals-01.html?lang=en');
 assert.equal(dom.window.document.documentElement.lang,'en');
 assert.equal(dom.window.localStorage.getItem('railway-language'),'en');
});
test('Chapter 01 theme uses saved preference rather than unrelated OS preference',()=>{
 const dom=chapter('en','dark');const w=dom.window,d=w.document;
 assert.equal(d.documentElement.dataset.theme,'dark');
 const b=d.getElementById('article-theme');
 assert.equal(b.textContent,'Light Mode');
 b.click();
 assert.equal(d.documentElement.dataset.theme,'light');
 assert.equal(w.localStorage.getItem('railway-theme'),'light');
 assert.equal(b.textContent,'Dark Mode');
});
test('Translation coverage matches all original Chapter 01 selectors and keeps references',()=>{
 const dom=chapter('en');
 const d=dom.window.document;
 const unresolved=['Bab 01 —','Pengenalan kepada','Hasil pembelajaran','Semak kefahaman','Kembali ke Gateway','Bahan pendidikan bebas untuk bacaan umum'];
 const html=d.querySelector('main').textContent+d.querySelector('footer').textContent;
 unresolved.forEach(s=>assert(!html.includes(s),'Malay prose remains in English view: '+s));
 for(const id of ['hasil','komponen','interaksi','landasan','kawalan','glosari','semak','rujukan','ref1','ref2','ref3']){
  assert(d.getElementById(id),'Missing anchor '+id);
 }
});
test('Gateway editorial card follows selected language, not hardcoded Malay',()=>{
 assert.match(gatewayJs,/lang=\$\{language\}/);
 assert.match(gatewayJs,/READ CHAPTER 01/);
 assert.match(gatewayJs,/阅读第01章/);
 assert.match(gatewayJs,/BACA BAB 01/);
 assert(!gatewayJs.includes('href="reading/railway-fundamentals-01.html">BACA BAB 01'));
});
test('Light and dark Gateway contrast patches and in-flow language toolbar exist',()=>{
 assert.match(theme,/body\[data-screen="modes"\] \.language-dock\{\s*position:relative/);
 assert.match(theme,/body\[data-screen="modes"\] \.learning-card a\.primary/);
 assert.match(theme,/\.map-filters button\[aria-pressed="true"\]/);
 assert.match(theme,/\.map-search input::placeholder/);
});
const brightness=(h)=>parseInt(h,16)/255;
function relativeLuminance(color){
 const m=color.match(/^#([a-f0-9]{6})$/i);assert(m,'hex');
 const rgb=[0,2,4].map(i=>brightness(m[1].slice(i,i+2))).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(a,b){
 const l1=relativeLuminance(a),l2=relativeLuminance(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
test('Primary button light and dark theme foreground contrast exceeds WCAG AA normal text',()=>{
 assert(contrast('#ffffff','#17643f')>=4.5);
 assert(contrast('#082617','#93e0b1')>=4.5);
 assert(contrast('#19313d','#ffffff')>=4.5);
});
test('No live-privileged access and no build of unpublished model specifications',()=>{
 assert(!chapterJs.includes('supabase.co'));
 assert(!chapterJs.includes('service_role'));
 assert(!chapterJs.includes('fetch('));
 assert.match(chapterHtml,/EDITORIAL DRAFT/);
 assert.match(chapterHtml,/Bukan manual operasi/);
});
