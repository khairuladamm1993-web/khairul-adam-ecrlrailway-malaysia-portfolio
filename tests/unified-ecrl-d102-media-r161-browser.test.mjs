import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium,webkit} from 'playwright';
const base=process.env.LAB_URL||'http://127.0.0.1:8765/ecrl-alignment-lab.html',out='artifacts/d102-r161-media',results=[];
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jUO8AAAAASUVORK5CYII=','base64');
const pdf=Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
const media=JSON.parse(await fs.readFile('tests/fixtures/d102-media-formats.json','utf8'));
await fs.mkdir(out,{recursive:true});
for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch(name==='chromium'?{headless:true,executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}:{headless:true});
 for(const screen of [{name:'desktop',width:1180,height:820},{name:'ipad',width:820,height:1100},{name:'iphone',width:390,height:844}]){
  const page=await browser.newPage({viewport:screen,hasTouch:screen.name!=='desktop'}),checks=[],errors=[];page.on('pageerror',x=>errors.push(x.message));
  try{
   assert.equal((await page.goto(base,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForFunction(()=>window.MRS10ECRLRouteLab?.snapshot()?.stationMap?.installed&&window.MRS10D102SourceDocuments?.snapshot(),null,{timeout:60000});
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().session.currentCH)),670);
   assert.match(await page.locator('#lab-r16-layout-file').getAttribute('accept'),/\.png/);
   assert.match(await page.locator('#lab-r16-layout-file').getAttribute('accept'),/\.pdf/);
   assert.match(await page.locator('label').filter({hasText:'Import GeoJSON rel'}).locator('input[type=file]').getAttribute('accept'),/\.png/);
   checks.push('iPhone Files picker now accepts PNG/JPG/WEBP/PDF');
   await page.locator('#lab-r16-layout-select').selectOption('STN01');
   await page.locator('#lab-r16-layout-file').setInputFiles({name:'STN01 Kota Bharu.png',mimeType:'image/png',buffer:png});
   await page.waitForFunction(()=>document.querySelector('#lab-r16-layout-panel img.lab-r161-layout-img')&&window.MRS10D102SourceDocuments.snapshot().importsThisPage>=1);
   assert.match(await page.locator('#lab-r16-layout-panel').innerText(),/STN01 Kota Bharu.png/);
   const html=await page.locator('#lab-r16-layout-panel img.lab-r161-layout-img').getAttribute('src');
   assert(html.startsWith('data:image/png;base64,'),'Safari must receive embedded image preview, not blob URL');
   await page.waitForFunction(()=>{
    const img=document.querySelector('#lab-r16-layout-panel img.lab-r161-layout-img');
    return img?.complete&&img.naturalWidth>0;
   },null,{timeout:12000});
   assert.match(await page.locator('#lab-station-intelligence').innerText(),/STN01 Kota Bharu.png/);
   checks.push('image displays within layout panel and STN01 Intelligence without inventing track');
   for(const [ext,fixture] of Object.entries(media)){await page.locator('#lab-r16-layout-file').setInputFiles({name:'STN01 source.'+ext,mimeType:fixture.mimeType,buffer:Buffer.from(fixture.base64,'base64')});await page.waitForFunction(ext=>{const d=[...document.querySelectorAll('#lab-r16-layout-panel details')].find(e=>e.querySelector('summary')?.textContent.includes('STN01 source.'+ext));const img=d?.querySelector('img');return img?.complete&&img.naturalWidth===8},ext,{timeout:12000})}
   checks.push('JPEG and WEBP decode original pixels without vector conversion');
   await page.locator('#lab-r16-layout-file').setInputFiles({name:'STN01 source.pdf',mimeType:'application/pdf',buffer:pdf});
   await page.waitForFunction(()=>document.querySelectorAll('#lab-r16-layout-panel .lab-r161-item').length===4);
   assert.equal(await page.locator('#lab-r16-layout-panel .lab-r161-open').count(),4);
   const pdfHref=await page.locator('#lab-r16-layout-panel .lab-r161-open').filter({hasText:'PDF'}).getAttribute('href');
   assert(pdfHref.startsWith('data:application/pdf;base64,'));assert.equal(Buffer.from(pdfHref.split(',')[1],'base64').compare(pdf),0);
   checks.push('PDF original bytes retained in embedded download, no revoked blob/CORS or raster-to-vector conversion');
   const before=await page.evaluate(()=>({data:window.MRS10D102SourceDocuments.snapshot(),state:window.MRS10ECRLRouteLab.snapshot()}));
   assert.equal(before.data.publicPublished,false);
   assert.equal(before.data.vectorGeometryGenerated,false);
   assert.equal(before.state.session.currentCH,670);
   assert.equal(before.state.mapPinAvailability,false);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('#lab-r16-layout-panel .lab-r161-item').length===4,null,{timeout:60000});
   assert.match(await page.locator('#lab-station-intelligence').innerText(),/STN01 Kota Bharu.png/);
   assert.equal((await page.evaluate(()=>window.MRS10ECRLRouteLab.snapshot().session.currentCH)),670);
   checks.push('IndexedDB attachment persists after Safari reload; D102 CH untouched');
   const unexpected=errors.filter(e=>!(/openrailwaymap|tiles.maps.eox.at/i.test(e)&&/access control|network error|failed to load/i.test(e)));
   assert.equal(unexpected.length,0,unexpected.join('; '));
   results.push({engine:name,viewport:screen.name,status:'PASS',checks});
   await page.screenshot({path:`${out}/${name}-${screen.name}.png`,fullPage:true});
  }catch(e){results.push({engine:name,viewport:screen.name,status:'FAIL',checks,error:String(e.stack||e),errors});await page.screenshot({path:`${out}/${name}-${screen.name}-fail.png`,fullPage:true}).catch(()=>{})}
  await fs.writeFile(out+'/report.json',JSON.stringify(results,null,2));await page.close();
 }await browser.close();
}
console.log(JSON.stringify(results));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
