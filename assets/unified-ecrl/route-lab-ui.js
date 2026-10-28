(function(root){'use strict';
const E=root.MRS10ECRLRouteLabEngine,C=root.MRS10ECRLChainage,rows=E.checkpoints(C),KEY='mrs10-p01-route-lab-r1-local',GEO=KEY+'-geometry';
const d={
 ms:{title:'Makmal Jajaran ECRL · Owner',notice:'SIMULASI PERIBADI · Bukan tren GPS, jajaran as-built, ETA atau sistem operasi.',origin:'Asal',destination:'Destinasi',start:'Bina semula simulasi',next:'Ke checkpoint seterusnya',review:'Semak checkpoint Owner',note:'Nota pengesahan model (sekurang-kurangnya 8 aksara)',upload:'Import GeoJSON rel + anchor',backup:'Eksport sandaran JSON',resume:'Resume',train:'Tren simulasi',remain:'Beza CH ke destinasi',align:'Geometri peta',none:'Tiada geometri penuh yang diterima; pergerakan CH masih boleh disimulasikan.',unverified:'GARIS CALON OSM · BUKAN LANDASAN AS-BUILT',save:'Autosave peranti ini',imported:'Geometri dimuat',reviewed:'UAT model direkod (bukan survei)',noPoint:'Tiada marker tren sebelum 2 anchor geospatial sepadan',privacy:'Autosave hanya pada browser/peranti ini, belum disegerakkan ke akaun Owner.',badFile:'Fail gagal diperiksa'},
 en:{title:'ECRL Alignment Laboratory · Owner',notice:'PERSONAL SIMULATION · Not train GPS, as-built railway, ETA or operations.',origin:'Origin',destination:'Destination',start:'Rebuild simulation',next:'Next checkpoint',review:'Owner checkpoint review',note:'Model review note (at least 8 characters)',upload:'Import rail GeoJSON + anchors',backup:'Export JSON backup',resume:'Resume',train:'Simulated train',remain:'CH difference to destination',align:'Map geometry',none:'No acceptable full alignment; CH-only simulation remains available.',unverified:'CANDIDATE OSM LINE · NOT AS-BUILT',save:'Device autosave',imported:'Geometry imported',reviewed:'Model UAT recorded (not a survey)',noPoint:'No train map pin until two geospatial anchors match',privacy:'Autosave on this browser/device only, not synced to Owner account.',badFile:'File validation failed'},
 zh:{title:'ECRL 线路实验室 · Owner',notice:'个人模拟 · 非列车 GPS、竣工线路、预计到达时间或运营系统。',origin:'起点',destination:'终点',start:'重建模拟',next:'下一个检查点',review:'Owner 检查点审核',note:'模型审核备注（至少八个字符）',upload:'导入铁路 GeoJSON 及锚点',backup:'导出 JSON 备份',resume:'恢复',train:'模拟列车',remain:'至终点 CH 差值',align:'地图几何',none:'无可用完整线路；仍可进行 CH 模拟。',unverified:'OSM 候选线 · 非竣工线路',save:'本设备自动保存',imported:'几何已导入',reviewed:'模型审核已记录（非测绘）',noPoint:'需至少两个匹配锚点才能显示列车位置',privacy:'仅存于当前浏览器，尚未同步 Owner 账号。',badFile:'文件验证失败'},
 th:{title:'ห้องทดลองแนวเส้นทาง ECRL · Owner',notice:'การจำลองส่วนบุคคล · ไม่ใช่ GPS รถไฟ แนวรางสำรวจจริง ETA หรือระบบเดินรถ',origin:'ต้นทาง',destination:'ปลายทาง',start:'เริ่มการจำลองใหม่',next:'จุดตรวจถัดไป',review:'ตรวจสอบจุดโดย Owner',note:'บันทึกตรวจสอบแบบจำลอง (อย่างน้อย 8 ตัวอักษร)',upload:'นำเข้า GeoJSON และจุดอ้างอิง',backup:'ส่งออกสำรอง JSON',resume:'ดำเนินต่อ',train:'รถไฟจำลอง',remain:'ระยะต่าง CH ถึงปลายทาง',align:'แนวแผนที่',none:'ยังไม่มีแนวเส้นทางต่อเนื่องที่ยอมรับได้ แต่จำลอง CH ได้',unverified:'แนว OSM ตัวอย่าง · ไม่ใช่แนวสำรวจจริง',save:'บันทึกในเครื่อง',imported:'โหลดเรขาคณิตแล้ว',reviewed:'บันทึกการตรวจสอบโมเดลแล้ว (ไม่ใช่สำรวจ)',noPoint:'ยังไม่มีตำแหน่งรถบนแผนที่จนมีจุดอ้างอิงอย่างน้อยสองจุด',privacy:'บันทึกในเบราว์เซอร์นี้เท่านั้น ยังไม่เชื่อมบัญชี Owner',badFile:'ตรวจสอบไฟล์ไม่ผ่าน'}
};
let locale='ms',session,geo=null,assembled=null,anchors=null,map=null,memoryStatus='NOT_SAVED',message='';
function load(){try{const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r?.schema===1&&rows.some(p=>p.code===r.origin)&&rows.some(p=>p.code===r.destination)){E.progress(r,rows);return r}}catch(_){}return E.start(rows)}
function restore(){try{const g=JSON.parse(localStorage.getItem(GEO)||'null');if(g){const a=E.assemble(g);return {geo:g,assembly:a,match:E.fit(rows,a,g.anchors||[])}}}catch(_){}return null}
session=load();const recovered=restore();if(recovered){geo=recovered.geo;assembled=recovered.assembly;anchors=recovered.match}
const formatCH=metres=>'CH'+String(Math.floor(metres/1000)).padStart(3,'0')+'+'+String(metres%1000).padStart(3,'0');
const h=document.getElementById('route-lab'),el=(tag,txt,cl)=>{const n=document.createElement(tag);if(txt!==undefined&&txt!==null)n.textContent=txt;if(cl)n.className=cl;return n};
function store(){try{localStorage.setItem(KEY,JSON.stringify(session));if(geo){const s=JSON.stringify(geo);if(s.length>1500000)throw Error('GEOMETRY_TOO_LARGE_FOR_LOCAL_AUTOSAVE');localStorage.setItem(GEO,s)}memoryStatus='SAVED_ON_THIS_BROWSER'}catch(e){memoryStatus='SAVE_ERROR_'+e.message}}
function getMap(){if(map||!root.maplibregl)return map;try{map=new root.maplibregl.Map({container:'lab-map',style:'https://tiles.openfreemap.org/styles/positron',center:[103.435,4.56],zoom:10.3});map.addControl(new root.maplibregl.NavigationControl({showCompass:false}),'top-right');root.MRS10ECRLRailOverlay?.connect(map);map.on('style.load',updateMap)}catch(e){message=String(e.message)}return map}
const routeID='ecrl-lab-rail-candidate',trainID='ecrl-lab-train-position';
function updateMap(){if(!map||!map.isStyleLoaded())return;
 const good=assembled?.status==='CONTINUOUS_CANDIDATE';
 if(good){const data={type:'FeatureCollection',features:[{type:'Feature',properties:{classification:'OSM_SIMULATION_CANDIDATE_NOT_AS_BUILT'},geometry:{type:'LineString',coordinates:assembled.paths[0].coords}}]};
 if(map.getSource(routeID))map.getSource(routeID).setData(data);else map.addSource(routeID,{type:'geojson',data});
 if(!map.getLayer(routeID))map.addLayer({id:routeID,type:'line',source:routeID,paint:{'line-color':'#7c3aed','line-width':4,'line-opacity':0.82}});
 }else if(map.getSource(routeID))map.getSource(routeID).setData({type:'FeatureCollection',features:[]});
 const pos=good?E.positionAt(session.currentCH,assembled,anchors):null;
 const feature={type:'FeatureCollection',features:pos?[{type:'Feature',properties:{status:'SIMULATION_INFERRED'},geometry:{type:'Point',coordinates:pos.coordinates}}]:[]};
 if(map.getSource(trainID))map.getSource(trainID).setData(feature);else map.addSource(trainID,{type:'geojson',data:feature});
 if(!map.getLayer(trainID))map.addLayer({id:trainID,type:'circle',source:trainID,paint:{'circle-color':'#d92942','circle-radius':10,'circle-stroke-width':3,'circle-stroke-color':'white'}});
}
function status(){const t=d[locale],p=E.progress(session,rows);let text=t.none;
 if(assembled)text=assembled.status+' · '+assembled.paths.length+' path(s) · '+Math.round(assembled.paths.reduce((n,x)=>n+x.metres,0)/1000*100)/100+' km OSM · '+(anchors?.status||'UNMATCHED_ANCHORS');
 return {t,p,text};}
function render(){const {t,p,text}=status();h.replaceChildren();root.MRS10ECRLRailOverlay?.setLocale(locale);
 const spec=root.MRS10ECRLRailEngineering;
 const box=document.getElementById('lab-track-metadata');
 if(box&&spec){
  const labels={ms:['Spesifikasi projek ECRL (MRL)','Garisan oren OpenRailwayMap bukan kod gauge. Tren hanya boleh diletakkan pada geometri vektor rel dengan CH anchor yang lulus semakan.','Sumber teknikal MRL'],
   en:['ECRL project technical specification (MRL)','The orange OpenRailwayMap line does not encode gauge. Train movement on the map requires continuous rail vectors and calibrated CH anchors.','MRL technical source'],
   zh:['ECRL 项目技术规格 (MRL)','OpenRailwayMap 的橙色线条不代表轨距。地图上的列车须有连续铁路矢量与经校准的 CH 控制点。','MRL 技术资料'],
   th:['ข้อมูลทางเทคนิคโครงการ ECRL (MRL)','เส้นสีส้ม OpenRailwayMap ไม่ได้บอกขนาดราง การแสดงรถไฟบนแผนที่ต้องใช้แนวรางเวกเตอร์และจุด CH ที่ตรวจสอบแล้ว','เอกสาร MRL']};
  const v=labels[locale];box.querySelector('strong').textContent=v[0]+': '+spec.ecrl.gaugeMm.toLocaleString('en-US')+' mm · 25 kV AC';
  box.querySelector('p').textContent=v[1];
  box.querySelector('a').textContent=v[2];
 }
h.append(el('h1',t.title),el('p',t.notice,'lab-note'));
 const lang=el('div',null,'lab-row');for(const code of ['ms','en','zh','th']){const b=el('button',code.toUpperCase());b.type='button';b.setAttribute('aria-pressed',String(locale===code));b.onclick=()=>{locale=code;render()};lang.append(b)}h.append(lang);
 const config=el('div',null,'lab-grid');for(const [key,label] of [['origin',t.origin],['destination',t.destination]]){const wrap=el('label',label),sel=el('select');sel.id='lab-'+key;for(const p of rows){const opt=el('option',p.code+' · '+formatCH(p.metres));opt.value=p.code;sel.append(opt)}sel.value=session[key];wrap.append(sel);config.append(wrap)}h.append(config);
 const rebuild=el('button',t.start);rebuild.onclick=()=>{try{session=E.start(rows,document.getElementById('lab-origin').value,document.getElementById('lab-destination').value);message='';store();render()}catch(e){message=e.message;render()}};h.append(rebuild);
 const section=el('section',null,'lab-panel');section.append(el('h2',t.train+' · '+session.trainId),el('p','CH'+String(Math.floor(session.currentCH/1000)).padStart(3,'0')+'+'+String(session.currentCH%1000).padStart(3,'0')));
 section.append(el('strong',t.remain+': '+p.remainingKm.toFixed(3)+' km'));
 const meter=el('progress');meter.max=100;meter.value=p.pct;section.append(meter);
 section.append(el('p',(p.next?.code||'ARRIVED')+' · '+(p.next?formatCH(p.next.metres):'')+' · '+p.nextDistanceKm.toFixed(3)+' km'));
 const slider=el('input');slider.type='range';const route=E.locateRun(session,rows);slider.min=route.min;slider.max=route.max;slider.step=10;slider.value=session.currentCH;slider.setAttribute('aria-label','Simulated train CH');slider.onchange=()=>{try{session=E.advance(session,rows,Number(slider.value));store();message='';render()}catch(e){message=e.message;render()}};section.append(slider);
 const manual=el('div',null,'lab-row'),input=el('input');input.type='number';input.value=session.currentCH;input.min=route.min;input.max=route.max;input.step=1;input.setAttribute('aria-label','CH in metres');manual.append(input);
 const move=el('button','Set CH');move.onclick=()=>{try{session=E.advance(session,rows,Number(input.value));store();message='';render()}catch(e){message=e.message;render()}};manual.append(move);
 const next=el('button',t.next);next.disabled=!p.next;next.onclick=()=>{session=E.advance(session,rows,p.next.metres);store();render()};manual.append(next);section.append(manual);
 const note=el('textarea');note.placeholder=t.note;note.maxLength=500;note.rows=2;section.append(note);
 const owner=el('button',t.review);owner.onclick=()=>{try{const on=rows.find(x=>Math.abs(x.metres-session.currentCH)<=100);session=E.review(session,rows,on?.code,note.value);store();message=t.reviewed;render()}catch(e){message=e.message;render()}};section.append(owner);h.append(section);
 const align=el('section',null,'lab-panel');align.append(el('h2',t.align),el('p',text));
 if(assembled?.status==='CONTINUOUS_CANDIDATE')align.append(el('p',t.unverified,'lab-warning'));
 const upload=el('label',t.upload),file=el('input');file.type='file';file.accept='.json,.geojson,application/json';file.onchange=async()=>{try{if(!file.files?.[0]||file.files[0].size>1800000)throw Error('FILE_LIMIT_1_8MB');const g=JSON.parse(await file.files[0].text()),a=E.assemble(g);geo=g;assembled=a;anchors=E.fit(rows,a,g.anchors||[]);store();message=t.imported;render();updateMap()}catch(e){message=t.badFile+' · '+e.message;render()}};upload.append(file);align.append(upload);
 align.append(el('p',t.noPoint,'lab-note'),el('p','© OpenStreetMap contributors · ODbL 1.0 · OpenRailwayMap visual context', 'lab-note'));h.append(align);
 const backup=el('button',t.backup);backup.onclick=()=>{const blob=new Blob([JSON.stringify({schema:1,session,geo,source:'OWNER_SIMULATION_ONLY',savedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mrs10-ecrl-owner-lab-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)};h.append(backup);
 h.append(el('p',t.privacy,'lab-note'),el('p',t.save+': '+memoryStatus,'lab-note'));
 if(message)h.append(el('p',message,'lab-alert'));
 const list=el('details');list.append(el('summary','23 CH checkpoints · '+session.reviews.length+' Owner UAT'));const ul=el('ol');
 for(const x of rows){const li=el('li',x.code+' · '+formatCH(x.metres)+(session.reviews.some(v=>v.code===x.code)?' ✓ OWNER MODEL':''));ul.append(li)}list.append(ul);h.append(list);
 const events=el('details');events.append(el('summary','Autosave events: '+session.events.length));const ul2=el('ol');for(const e of session.events.slice(-30))ul2.append(el('li',e.type+' · '+(e.code||e.to)+' · '+(e.time||'')));events.append(ul2);h.append(events);
 updateMap();
}
store();getMap();render();
root.MRS10ECRLRouteLab=Object.freeze({snapshot:()=>({session,progress:E.progress(session,rows),alignmentStatus:assembled?.status||'NO_GEOMETRY',railVisual:root.MRS10ECRLRailOverlay?.snapshot()||null,trackSpecification:root.MRS10ECRLRailEngineering?.ecrl||null,mapPinAvailability:!!E.positionAt(session.currentCH,assembled,anchors),storage:memoryStatus})});
})(window);
