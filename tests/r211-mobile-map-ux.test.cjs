const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function setup(){
 const html=read('map-language-lab.html');
 const d=new JSDOM(html,{url:'https://preview.example/map-language-lab.html',runScripts:'outside-only'});
 const w=d.window,maps=[];w.scrollTo=(x,y)=>{w.restoredScroll=[x,y]};
 class MockPopup{
  constructor(options){this.options=options;} setDOMContent(x){this.node=x;return this}
  isOpen(){return this.open||false}
 }
 class MockMarker{
  constructor({element}){this.element=element;this.visible=false;this.removed=false;this.toggleCount=0;}
  setLngLat(p){this.coords=p;return this}
  setPopup(p){this.popup=p;return this}
  addTo(m){this.visible=true;this.map=m;m.marker=this;return this}
  getElement(){return this.element}
  getPopup(){return this.popup}
  remove(){this.removed=true;return this}
  togglePopup(){this.popup.open=true;this.toggleCount++;return this}
 }
 class MockMap{
  constructor(args){this.args=args;this.listeners={};this.layers=[];this.sources={};maps.push(this)}
  addControl(){} resize(){this.resizeCount=(this.resizeCount||0)+1;}
  on(k,fn){this.listeners[k]=fn}
  getStyle(){return {layers:this.layers.length?this.layers:[{type:'symbol',id:'label_city',source:'osm','source-layer':'place',layout:{'text-field':['get','name']}}],sources:{osm:{type:'vector'}}}}
  getSource(k){return this.sources[k]}
  getLayer(k){return this.layers.find(x=>x.id===k)}
  addSource(k,s){this.sources[k]=s}
  addLayer(l){this.layers.push(l)}
  setLayoutProperty(k,p,v){let l=this.getLayer(k);if(l){l.layout||={};l.layout[p]=v;}}
  isStyleLoaded(){return true}
  flyTo(o){this.lastFly=o}
  setStyle(s){this.args.style=s;this.listeners['style.load']?.()}
 }
 w.maplibregl={Map:MockMap,Marker:MockMarker,Popup:MockPopup,NavigationControl:class {}};
 w.eval(read('assets/map-language-lab.js'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 assert.equal(maps.length,1);
 maps[0].listeners['style.load']();
 return {w,map:maps[0]};
}

test('R2.11 expand/exit retains the same map, selected popup, view and layers',()=>{
 const {w,map}=setup(),d=w.document,button=d.getElementById('map-expand');
 d.querySelector('[data-region="china"]').click();d.getElementById('campus-focus').click();
 d.getElementById('railway-btn').click();
 const marker=map.marker,popup=marker.getPopup(),view=map.lastFly,layers=JSON.stringify(map.layers);
 d.body.setAttribute('style','color: red;');
 const original=d.body.getAttribute('style');d.querySelector('header').setAttribute('inert','');
 button.click();assert.equal(button.getAttribute('aria-expanded'),'true');
 assert(d.getElementById('map-shell').classList.contains('is-expanded'));
 assert.equal(d.body.style.position,'fixed');assert(d.getElementById('lab-title').hasAttribute('inert'));
 assert.equal(map.marker,marker);assert.equal(marker.getPopup(),popup);assert(popup.isOpen());
 assert.equal(map.lastFly,view);assert.equal(JSON.stringify(map.layers),layers);assert.equal(map.resizeCount,1);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 assert.equal(button.getAttribute('aria-expanded'),'false');assert.equal(d.body.getAttribute('style'),original);
 assert(!d.getElementById('lab-title').hasAttribute('inert'));assert(d.querySelector('header').hasAttribute('inert'));
 assert.deepEqual(w.restoredScroll,[0,0]);assert.equal(map.resizeCount,2);assert.equal(d.activeElement,button);
 w.close();
});
test('R2.11 repeated expand, exit, resize and removal do not duplicate controls or leak handlers',()=>{
 const {w,map}=setup(),d=w.document,button=d.getElementById('map-expand');
 for(let i=0;i<4;i++){button.click();button.click();}
 assert.equal(map.resizeCount,8);assert.equal(d.querySelectorAll('#map-expand').length,1);
 button.click();w.dispatchEvent(new w.Event('resize'));assert.equal(map.resizeCount,10);
 map.listeners.remove();assert.equal(button.getAttribute('aria-expanded'),'false');
 const count=map.resizeCount;button.click();w.dispatchEvent(new w.Event('resize'));
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(map.resizeCount,count);
 assert.equal(d.body.getAttribute('style'),null);w.close();
});
test('R2.11 expand control follows four locales and campus popup remains scoped and sourced',()=>{
 const {w,map}=setup(),d=w.document;
 for(const locale of ['ms','en','zh','th']){
  d.querySelector('[data-locale="'+locale+'"]').click();
  assert(d.getElementById('map-expand').getAttribute('aria-label').length>3);
 }
 d.querySelector('[data-region="china"]').click();
 assert.equal(map.marker.getPopup().options.className,'mrl-campus-popup');
 assert.match(map.marker.getPopup().node.textContent,/Liǔzhōu/);
 assert.match(map.marker.getPopup().node.textContent,/No. 2 Wenyuan Road/);w.close();
});
function luminance(hex){const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
test('R2.11 popup foreground/body/disclaimer colour pairs exceed WCAG AA 4.5:1',()=>{
 const h=read('map-language-lab.html');
 const blocks=[...h.matchAll(/--popup-bg:(#[0-9a-f]+);--popup-fg:(#[0-9a-f]+);--popup-muted:(#[0-9a-f]+)/g)];
 assert.equal(blocks.length,2);
 for(const [,bg,fg,muted] of blocks)for(const colour of [fg,muted]){
  const expand=x=>x.length===4?'#'+[...x.slice(1)].map(c=>c+c).join(''):x;
  const a=luminance(expand(bg)),b=luminance(expand(colour));
  assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,colour+' on '+bg);
 }
 assert.match(h,/#visitor-map \.campus-popup p\{color:var\(--popup-fg\)/);
 assert.doesNotMatch(h,/!important/);
});
test('R2.11 responsive CSS preserves touch areas, viewport/safe-area handling and attribution',()=>{
 const h=read('map-language-lab.html');
 for(const token of ['width:min(82vw,255px)','max-height:min(34dvh,170px)','overflow-wrap:anywhere','height:clamp(460px,72dvh,800px)','height:100dvh','env(safe-area-inset-bottom)','width:44px;height:44px','width:32px;height:32px','© OpenRailwayMap'])assert(h.includes(token),token);
 assert.doesNotMatch(read('assets/map-language-lab.js'),/requestFullscreen/);
});
