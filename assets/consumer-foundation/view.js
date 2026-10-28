(function(root){'use strict';
const dictionary={
 ms:{title:'Railway Explorer · Journey simulasi',origin:'Asal',destination:'Destinasi',build:'Bina simulasi',next:'Stesen simulasi seterusnya',current:'Stesen semasa (simulasi)',following:'Stesen seterusnya',arrived:'Destinasi simulasi',notice:'SIMULASI · ECRL belum operasi awam. Turutan registry sahaja; tiada tiket, tren live atau ETA.',lineup:'Turutan simulasi',unknown:'UNKNOWN · Jadual / ETA belum tersedia. GPS tidak diminta; tiada map matching.',offline:'Offline: metadata yang telah dimuat masih tersedia. Basemap / GIS jauh mungkin tidak tersedia. Tiada sokongan offline cold-start.',online:'Asas consumer · metadata setempat; data operasi belum tersedia.',error:'Pilih dua stesen berbeza yang sah.'},
 en:{title:'Railway Explorer · Journey simulation',origin:'Origin',destination:'Destination',build:'Build simulation',next:'Next simulated station',current:'Current station (simulation)',following:'Next station',arrived:'Simulated destination',notice:'SIMULATION · ECRL is not publicly operating. Registry order only; no tickets, live trains or ETA.',lineup:'Simulation lineup',unknown:'UNKNOWN · Timetable / ETA unavailable. GPS not requested; no map matching.',offline:'Offline: already-loaded metadata remains available. Remote basemap / GIS may be unavailable. No offline cold-start support.',online:'Consumer foundation · local metadata; operational data unavailable.',error:'Choose two different valid stations.'},
 zh:{title:'Railway Explorer · 行程模拟',origin:'起点',destination:'终点',build:'创建模拟',next:'下一模拟站',current:'当前站（模拟）',following:'下一站',arrived:'模拟终点',notice:'模拟 · ECRL 尚未对公众运营。仅使用登记顺序；无票务、实时列车或到达预测。',lineup:'模拟站序',unknown:'UNKNOWN · 无时刻表或到达预测。未请求 GPS；无地图匹配。',offline:'离线：已加载的元数据仍可用。远程底图与 GIS 可能不可用。不支持离线冷启动。',online:'消费者基础组件 · 本地元数据；无运营数据。',error:'请选择两个不同的有效车站。'},
 th:{title:'Railway Explorer · จำลองการเดินทาง',origin:'ต้นทาง',destination:'ปลายทาง',build:'สร้างการจำลอง',next:'สถานีจำลองถัดไป',current:'สถานีปัจจุบัน (จำลอง)',following:'สถานีถัดไป',arrived:'ถึงปลายทางจำลอง',notice:'การจำลอง · ECRL ยังไม่เปิดบริการสาธารณะ ใช้ลำดับทะเบียนเท่านั้น ไม่มีตั๋ว รถไฟสด หรือ ETA',lineup:'ลำดับสถานีจำลอง',unknown:'UNKNOWN · ไม่มีตารางเวลา / ETA ไม่ได้ขอ GPS และไม่มีการจับคู่แผนที่',offline:'ออฟไลน์: ข้อมูลที่โหลดแล้วยังใช้ได้ แผนที่และ GIS ระยะไกลอาจใช้ไม่ได้ ไม่รองรับเริ่มต้นออฟไลน์',online:'พื้นฐานผู้โดยสาร · ข้อมูลภายใน ยังไม่มีข้อมูลปฏิบัติการ',error:'เลือกสถานีที่ถูกต้องสองแห่งที่ต่างกัน'}
};
function create({host,stations,getLocale}){
 const engine=root.MRS10JourneyFoundation;let journey=engine.create(stations,'ecrl-stn-11','ecrl-stn-01'),error=false;const draft={originId:journey.originId,destinationId:journey.destinationId};
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 function render(){const t=dictionary[getLocale()]||dictionary.en,p=engine.progress(journey);host.replaceChildren();host.classList.add('consumer-foundation');host.append(el('h2',t.title),el('p',t.notice));
  for(const [key,label] of [['originId',t.origin],['destinationId',t.destination]]){const wrap=el('label',label),select=el('select');select.id='journey-'+key;for(const s of stations){const o=el('option',s.officialName);o.value=s.assetId;select.append(o)}select.value=draft[key];select.onchange=()=>draft[key]=select.value;wrap.append(select);host.append(wrap)}
  const build=el('button',t.build);build.type='button';build.id='journey-build';build.onclick=()=>{try{journey=engine.create(stations,draft.originId,draft.destinationId);error=false}catch{error=true}render()};host.append(build);
  if(error){const e=el('p',t.error);e.setAttribute('role','alert');host.append(e)}
  const status=el('p',t.current+': '+p.currentStation.name+' · '+t.following+': '+(p.nextStation?.name||t.arrived));status.id='journey-progress';status.setAttribute('aria-live','polite');host.append(status);
  const bar=el('progress');bar.max=100;bar.value=p.percentage;bar.setAttribute('aria-label',t.lineup);host.append(bar);
  const next=el('button',t.next);next.type='button';next.id='journey-next';next.disabled=p.arrived;next.onclick=()=>{journey=engine.advance(journey);render()};host.append(next,el('p',t.unknown),el('p',journey.network==='OFFLINE'?t.offline:t.online));
  const list=el('ol');list.id='journey-lineup';for(const stop of journey.lineup)list.append(el('li',stop.name));host.append(list);
 }
 function updateNetwork(){journey=engine.network(journey,navigator.onLine);render()}
 window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();
 return {render,snapshot:()=>JSON.parse(JSON.stringify({...journey,progress:engine.progress(journey)}))};
}
root.MRS10JourneyView=Object.freeze({create,dictionary});
})(window);
