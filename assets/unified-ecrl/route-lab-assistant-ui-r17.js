/* Owner command center. Imported text is displayed as text; never interpreted as code. */
(function(root){'use strict';
const WORDS={
ms:['Pusat Arahan Assistant R1.7','IMPORT ARAHAN CHATGPT / MR-S10 ASSISTANT','Sahkan pelan','Saya mengesahkan pelan dan tindakan simulator','Mula','Sambung','Hold','Eksport pelaksanaan','Eksport Geometry QA','Tukar dokumen kepada draf semakan','Pengesahan Owner','Confirm / Correct','CH diperhatikan','Latitud (pilihan)','Longitud (pilihan)','Sumber','Catatan / pembetulan','Storan peribadi pada peranti sahaja. Tiada cloud sync atau penerbitan awam.','Tiada assignment dipilih','Pelan, keperluan dan sumber','Buka semula pengesahan perjalanan'],
en:['Assistant Command Center R1.7','IMPORT CHATGPT / MR-S10 ASSISTANT INSTRUCTIONS','Validate plan','I confirm the plan and simulator actions','Start','Resume','Hold','Export execution','Export Geometry QA','Convert document to review draft','Owner confirmation','Confirm / Correct','Observed CH','Latitude (optional)','Longitude (optional)','Source','Note / correction','Private device storage only. No cloud sync or public publication.','No assignment selected','Plan, requirements and sources','Reopen journey confirmation'],
zh:['Assistant 指令中心 R1.7','导入 CHATGPT / MR-S10 ASSISTANT 指令','验证计划','我确认计划和模拟器操作','开始','继续','暂停','导出执行报告','导出几何 QA','将文档转换为审核草稿','Owner 确认','确认 / 修正','观测 CH','纬度（可选）','经度（可选）','来源','备注 / 修正','仅存储在私人设备。无云同步或公开发布。','未选择任务','计划、要求及来源','重新打开行程确认'],
th:['ศูนย์คำสั่ง Assistant R1.7','นำเข้าคำสั่ง CHATGPT / MR-S10 ASSISTANT','ตรวจสอบแผน','ฉันยืนยันแผนและการทำงานของตัวจำลอง','เริ่ม','ดำเนินต่อ','พัก','ส่งออกรายงาน','ส่งออก Geometry QA','แปลงเอกสารเป็นร่างตรวจสอบ','การยืนยัน Owner','ยืนยัน / แก้ไข','CH ที่สังเกต','ละติจูด (ไม่บังคับ)','ลองจิจูด (ไม่บังคับ)','แหล่งข้อมูล','หมายเหตุ / แก้ไข','เก็บในอุปกรณ์ส่วนตัวเท่านั้น ไม่มี cloud sync หรือการเผยแพร่สาธารณะ','ยังไม่เลือกงาน','แผน ข้อกำหนด และแหล่งข้อมูล','เปิดการยืนยันการเดินทางอีกครั้ง']};
let ctx,repo,engine,locale='ms',error='',preview='',draftText='',busy=false,definitions=[];
const el=(tag,text)=>{const x=document.createElement(tag);if(text!=null)x.textContent=text;return x};
const download=(value,name)=>{const u=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=el('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)};
async function action(fn){if(busy)return;busy=true;try{error='';await fn()}catch(e){error=String(e.message||e)}finally{try{if(repo)definitions=await repo.list('definitions')}catch(e){error=e.message}busy=false;render()}}
function button(text,id,fn){const b=el('button',text);b.id=id;b.type='button';b.onclick=()=>action(fn);return b}
function render(){
 const h=document.getElementById('lab-r17-command-center');if(!h||!engine)return;const w=WORDS[locale]||WORDS.ms,s=engine.snapshot(),d=engine.definition();h.replaceChildren();h.append(el('h2',w[0]),el('p',w[17]));
 const label=el('label',w[1]),file=el('input');file.type='file';file.accept='.json,.md,.txt,application/json,text/plain,text/markdown';file.id='lab-r17-file';file.onchange=()=>action(async()=>{const f=file.files?.[0];if(!f||f.size>524288)throw Error('ASSIGNMENT_MAX_512KB');const text=await f.text();preview=text;if(/\.(md|txt)$/i.test(f.name)){draftText=text;return}draftText='';await engine.load(JSON.parse(text))});label.append(file);h.append(label);
 if(preview){const p=el('details');p.append(el('summary','Import preview'),el('pre',preview));h.append(p)}
 if(draftText)h.append(button(w[9],'lab-r17-convert',async()=>{if(!root.confirm(w[9]+'? '+w[17]))return;await engine.load(root.MRS10AssistantSchema.documentDraft(draftText,ctx.session(),ctx.rows));draftText=''}));
 if(definitions.length){const select=el('select');select.id='lab-r17-history';select.setAttribute('aria-label','Assignment revisions');for(const v of definitions){const o=el('option',v.key);o.value=v.key;select.append(o)}select.value=s?.key||definitions[0].key;select.onchange=()=>action(()=>engine.open(select.value));h.append(select)}
 const status=el('p',s?(s.status+' · '+s.cursor+'/'+d.commands.length+' · '+(s.reason||'')):w[18]);status.id='lab-r17-state';status.setAttribute('aria-live','polite');h.append(status);
 if(error){const p=el('p',error);p.id='lab-r17-error';p.setAttribute('role','alert');h.append(p)}
 if(d){const plan=el('details');plan.append(el('summary',w[19]),el('pre',JSON.stringify(d,null,2)));h.append(plan);
 const owner=el('label'),check=el('input');check.type='checkbox';check.id='lab-r17-owner';owner.append(check,document.createTextNode(w[3]));h.append(owner);
 const consent=()=>{if(!check.checked)throw Error('OWNER_CONFIRMATION_REQUIRED');return true};
 h.append(button(w[2],'lab-r17-validate',()=>engine.validate()),button(w[4],'lab-r17-start',()=>engine.start(consent())),button(w[5],'lab-r17-resume',()=>engine.resume(consent())),button(w[6],'lab-r17-hold',()=>engine.pause()));
 if(s?.pending?.kind==='JOURNEY')h.append(button(w[20],'lab-r17-journey',()=>ctx.showJourneyPending()));
 if(s?.status==='PAUSED'&&s.pending&&s.pending.kind!=='JOURNEY'&&s.reason!=='RECOVERY_CONFIRM_REQUIRED'){
 const form=el('fieldset');form.append(el('legend',w[10]+' · '+(s.pending.code||s.pending.kind)+' · CH '+s.pending.expectedCH));const fields={};
 for(const [key,i] of [['CH',12],['latitude',13],['longitude',14],['source',15],['note',16]]){const l=el('label',w[i]),input=el('input');input.id='lab-r17-'+key;input.type=['CH','latitude','longitude'].includes(key)?'number':'text';input.step=key==='CH'?'1':'any';if(key==='CH')input.value=s.pending.expectedCH;fields[key]=input;l.append(input);form.append(l)}
 form.append(button(w[11],'lab-r17-confirm',()=>engine.confirm({ownerConfirmed:consent(),...Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value]))})));h.append(form)}
 h.append(button(w[7],'lab-r17-export',()=>download(engine.report(),'mrs10-assignment-execution-report-r17.json')));
 }
 h.append(button(w[8],'lab-r17-geometry-export',()=>download(ctx.geometryQA(),'mrs10-geometry-qa-r17.json')));
 if(s){const history=el('details');history.append(el('summary','Audit · '+s.audit.length),el('pre',JSON.stringify(s.audit,null,2)));h.append(history)}
}
async function connect(options){ctx=options;repo=root.MRS10AssistantPrivateStore.create(root.indexedDB);let token=sessionStorage.getItem('mrs10-r17-tab-token');if(!token){token=crypto.randomUUID();sessionStorage.setItem('mrs10-r17-tab-token',token)}
 engine=root.MRS10AssistantEngine.create({repo,host:ctx,rows:ctx.rows,ownerToken:token,onChange:()=>render()});
 await action(async()=>{await repo.migrate({session:ctx.session(),journey:ctx.journey(),savedAt:new Date().toISOString()});const selected=await repo.get('settings','selected-assignment');if(selected)await engine.open(selected.assignmentKey)});render();
}
root.MRS10AssistantUI=Object.freeze({connect,setLocale:value=>{locale=value==='bm'?'ms':value;render()},observe:()=>engine?.observe().catch(e=>{error=e.message;render()}),snapshot:()=>engine?.snapshot()||null,report:()=>engine?.report()||null});
})(window);
