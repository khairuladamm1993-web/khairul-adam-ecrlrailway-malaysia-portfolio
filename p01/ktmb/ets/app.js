/* Render evidence state only; no false map geometries or station pins. */
(function(){
  'use strict';
  const api=window.MRS10ETS,i18n={"ms":{"subtitle":"Asas modul terasing · bukan peta operasi","notice":"Turutan stesen belum disahkan daripada GTFS/jadual rasmi. Tiada pin, kod stesen atau trek direka.","label":"Perkhidmatan","lineup":"Lineup stesen","pending":"Menunggu import data dan pengesahan turutan hentian.","source":"Sumber","theme":"Tema gelap","light":"Tema cerah","noMap":"Geometri trek fizikal belum disahkan. Map dan penanda akan diaktifkan selepas audit GIS.","footer":"Untuk pelawat sahaja; bukan data operasi tren."},"en":{"subtitle":"Isolated module foundation · not an operational map","notice":"Station sequence has not been verified against current GTFS/operator timetable. No invented stations, pins or tracks.","label":"Services","lineup":"Station lineup","pending":"Pending sourced stop import and stop-order review.","source":"Sources","theme":"Dark theme","light":"Light theme","noMap":"Physical track geometry unverified; map/markers will be enabled only after GIS audit.","footer":"Visitor reference only; not railway operational data."},"zh":{"subtitle":"独立模块基础 · 非运营铁路图","notice":"站序尚未通过最新时刻表核验；不编造站点、坐标或轨道。","label":"列车服务","lineup":"车站顺序","pending":"等待正式来源站序导入与审核。","source":"数据来源","theme":"深色模式","light":"浅色模式","noMap":"实体轨道几何尚未核实；审核前不显示地理线路。","footer":"仅供访客参考；非行车数据。"},"th":{"subtitle":"โมดูลแยก · ไม่ใช่แผนที่เดินรถ","notice":"ลำดับสถานียังไม่ได้รับการตรวจสอบจากตารางเดินรถปัจจุบัน ไม่มีการสร้างพิกัดหรือทางรถไฟขึ้นเอง","label":"บริการ","lineup":"ลำดับสถานี","pending":"รอตรวจสอบข้อมูลสถานีจากแหล่งทางการ","source":"แหล่งข้อมูล","theme":"ธีมมืด","light":"ธีมสว่าง","noMap":"ยังไม่มีข้อมูลแนวรางที่ผ่านการตรวจสอบ จึงไม่แสดงเส้นทางบนแผนที่","footer":"สำหรับผู้เข้าชม ไม่ใช่ข้อมูลควบคุมรถไฟ"}};
  const l=document.getElementById('language'),t=document.getElementById('theme');
  let dark=false;
  function txt(id,s){document.getElementById(id).textContent=s}
  function render(){
    const d=i18n[l.value]||i18n.ms;
    document.documentElement.lang=l.value;
    document.documentElement.dataset.theme=dark?'dark':'light';
    txt('subtitle',d.subtitle);txt('notice',d.notice);txt('service-title',d.label);
    txt('lineup-title',d.lineup);txt('lineup-note',d.pending);txt('geographic-note',d.noMap);
    txt('sources-title',d.source);txt('footer',d.footer);
    t.textContent=dark?d.light:d.theme;
    const root=document.getElementById('services');root.replaceChildren();
    for(const s of api.manifest.services){
      const card=document.createElement('div');card.className='card';
      const badge=document.createElement('span');badge.className='swatch';badge.style.backgroundColor=s.color;badge.style.color=s.color;badge.setAttribute('aria-hidden','true');
      const wrap=document.createElement('div');const name=document.createElement('strong');name.textContent=s.name;
      const sub=document.createElement('small');sub.textContent=s.id+' · '+api.manifest.colourStatus;
      wrap.append(name,sub);card.append(badge,wrap);root.append(card);
    }
    const sources=document.getElementById('sources');sources.replaceChildren();
    for(const s of api.manifest.sources){
      const li=document.createElement('li'),a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noreferrer noopener';a.textContent=s.type;
      li.append(a,document.createTextNode(' — '+s.note));sources.append(li);
    }
  }
  l.addEventListener('change',render);t.addEventListener('click',()=>{dark=!dark;render()});render();
})();