import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../dist/analytics.js',import.meta.url),'utf8');
function harness({dnt=false,seen}={}){
 const events={},docEvents={},sent=[],store=new Map(),cl=new Set();if(seen)store.set('railway-analytics-seen-day',seen);
 let time=0;const document={body:{dataset:{screen:'welcome'},classList:{contains:x=>cl.has(x)}},documentElement:{lang:'ms'},hidden:false,querySelectorAll:()=>[],addEventListener:(n,fn)=>docEvents[n]=fn};
 const window={addEventListener:(n,fn)=>events[n]=fn};
 const context={window,document,navigator:{doNotTrack:dnt?'1':'0',userAgent:'Mozilla/5.0 (iPad) AppleWebKit Safari',maxTouchPoints:5},location:{hash:'',reload(){throw new Error('Must not reload portfolio');}},performance:{now:()=>time},innerWidth:1024,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},fetch:(url,opts)=>{sent.push({url,opts,body:JSON.parse(opts.body)});return Promise.resolve({ok:true});},setInterval:fn=>events.tick=fn,IntersectionObserver:class{observe(){}}};
 for(const api of ['geolocation','permissions'])Object.defineProperty(context.navigator,api,{get(){throw new Error('Visitor location or permissions API must not be accessed');}});
 vm.runInNewContext(code,context);
 return {sent,context,events,docEvents,cl,store,time:n=>time=n,async settle(){await new Promise(r=>setTimeout(r,0));},click(el){docEvents.click({target:{closest:()=>({dataset:{},id:'',classList:{contains:()=>false},getAttribute:()=>null,...el})}});},route(screen,hash=''){document.body.dataset.screen=screen;context.location.hash=hash;events.hashchange();}};
}
function totals(h,m,b){return h.sent.flatMap(s=>s.body.counts).filter(r=>r[0]===m&&r[1]===b).reduce((n,r)=>n+r[2],0);}
test('ordered funnel, clicks, language/pinyin, aggregate dimensions and exit durations',async()=>{
 const h=harness();await h.settle();
 h.click({id:'continue'});h.route('modes');await h.settle();h.click({dataset:{mode:'lab'}});h.route('ready');await h.settle();h.click({id:'enter-portfolio'});h.route('portfolio','#lab');await h.settle();
 h.context.document.documentElement.lang='zh-Hans';h.click({dataset:{lang:'zh'}});await h.settle();h.cl.add('with-pinyin');h.click({classList:{contains:x=>x==='pinyin-toggle'}});await h.settle();
 h.time(10000);h.events.pagehide();await h.settle();h.events.pagehide();await h.settle();
 for(const step of ['welcome','modes','ready','portfolio'])assert.equal(totals(h,'funnel',step),1);
 assert.equal(totals(h,'click','continue'),1);assert.equal(totals(h,'click','enter_portfolio'),1);assert.equal(totals(h,'learning_mode','lab'),1);
 assert.equal(totals(h,'language','中文'),1);assert.equal(totals(h,'pinyin','ON'),1);assert.equal(totals(h,'exit','lab'),1);assert.equal(totals(h,'duration_seconds','all'),10);
 assert.equal(totals(h,'device','tablet'),1);assert.equal(totals(h,'os','iOS'),1);assert.equal(totals(h,'daily_browser_estimate','all'),1);
 assert(h.sent.every(s=>Object.keys(s.body).join()==='counts'));assert(h.sent.every(s=>s.opts.referrerPolicy==='no-referrer'));assert.equal(h.store.size,1);
});
test('DNT disables analytics entirely; returning estimate uses a shared date flag, not an ID',async()=>{
 const disabled=harness({dnt:true});assert.equal(disabled.sent.length,0);assert.equal(disabled.store.size,0);
 const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 const h=harness({seen:today});await h.settle();assert.equal(totals(h,'returning','returning'),1);assert.equal(totals(h,'daily_browser_estimate','all'),0);
});
test('back navigation does not recount funnel stages; restoring a cached tab never reloads site',async()=>{
 const h=harness();await h.settle();h.route('modes');await h.settle();h.route('welcome');h.route('modes');await h.settle();assert.equal(totals(h,'funnel','modes'),1);
 h.events.pagehide();await h.settle();h.events.pageshow({persisted:true});await h.settle();assert.equal(totals(h,'visits','all'),2);
});
