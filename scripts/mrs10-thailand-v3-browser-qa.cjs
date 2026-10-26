/* Browser smoke for MR-S10 TH V3, headless desktop Chromium+WebKit. Not owner-device Safari UAT. */
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const {chromium,webkit}=require('playwright');
async function run(){
const srv=cp.spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
fs.mkdirSync('artifacts/thailand-v3-browser',{recursive:true});
try{
await new Promise(res=>setTimeout(res,950));
for(const entry of [['chromium',chromium,390],['webkit',webkit,1024]]){
const name=entry[0],tool=entry[1],width=entry[2];
const browser=await tool.launch({headless:true,...(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}: {})});
try{
const page=await browser.newPage({viewport:{width,height:800},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/thailand-railway-v3.html',{waitUntil:'domcontentloaded',timeout:25000});
await page.locator('.railmarker').first().waitFor({state:'visible',timeout:36000});
const count=await page.locator('.railmarker').count();assert.ok(count>=13,name+' default markers '+count);
await page.screenshot({path:'artifacts/thailand-v3-browser/'+name+'-default.png',fullPage:true});
await page.locator('[data-filter="border"]').click();
const border=await page.locator('.railmarker').count();assert.ok(border>=3,name+' cross-border markers '+border);
await page.locator('#stations button[data-id="th-my-padang-besar"]').click();
await page.locator('.maplibregl-popup-content').waitFor({state:'visible',timeout:9500});
assert.match(await page.locator('.maplibregl-popup-content').innerText(),/KTMB/);
await page.locator('[data-lang="th"]').click();
assert.match(await page.locator('#title').innerText(),/รถไฟไทย/);
await page.locator('#theme').click();await page.waitForTimeout(1900);
assert.ok((await page.locator('.railmarker').count())>=3,name+' style switch lost station markers');
await page.locator('#reset').click();
assert.equal(await page.locator('[data-filter="all"]').getAttribute('aria-pressed'),'true');
await page.screenshot({path:'artifacts/thailand-v3-browser/'+name+'-reset.png',fullPage:true});
assert.deepEqual(errors,[],name+' JS page errors: '+errors.join('; '));
console.log('THAILAND_V3_BROWSER_PASS',JSON.stringify({engine:name,width,defaultMarkers:count,borderMarkers:border,errors:errors.length}));
}finally{await browser.close();}
}
}finally{srv.kill('SIGTERM');}}
run().catch(e=>{console.error('THAILAND_V3_BROWSER_FAIL',e);process.exitCode=1;});
