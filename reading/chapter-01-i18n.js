/* Railway Fundamentals Chapter 01: translated editorial draft (public educational material).
   Original Malay markup remains the no-JS fallback. All localized copy is static and authored.
   Keep citation anchors [1]–[3] and trilingual glossary intact. */
(()=>{
 'use strict';
 const article=document.querySelector('main');
 const chooser=document.getElementById('article-language');
 const themeButton=document.getElementById('article-theme');
 if(!article||!chooser)return;
 const translations={
 en:{
  'header a':'← MR-S10 Railway Learning Gateway',
  'main .tag':['PUBLIC · ONLINE READING','EDITORIAL DRAFT · v0.1'],
  'main h1':'Chapter 01 — Introduction to Railway Systems',
  'main > p.muted':'Railway Fundamentals · English · Malay and Chinese railway terminology · Editorial review: 23 October 2026',
  'main > p.lead':'A train does not operate on its own. It depends on track infrastructure, energy supply, control systems, communication, personnel, maintenance and interconnected operating rules.',
  'main > .note':'<strong>Scope limitation:</strong> Public educational material only. Not an operations manual, competency approval, emergency instruction or official ECRL document. International examples do not necessarily represent ECRL specifications.',
  '.toc > strong':'In this chapter',
  '.toc > a':['Learning outcomes','1. Railway system components','2. How components work together','3. Tracks and turnouts','4. Signalling and operations','5. Trilingual glossary','6. Check your understanding','References'],
  '#hasil > h2':'Learning outcomes',
  '#hasil > p':'After reading this chapter, readers should be able to explain what a railway system is, identify its main subsystems, distinguish rolling stock from infrastructure, and understand why signalling and traffic management are necessary.',
  '#komponen > h2':'1. What is a railway system?',
  '#komponen > p':[
   'A railway system combines physical assets, technology and organizations to transport passengers or freight across a rail network. For learning purposes, we can group its interconnected functions into six areas:',
   'This is an educational classification. European Union interoperability documents distinguish structural subsystems such as infrastructure, energy, signalling and rolling stock from operational, maintenance and information functions. <a href="#ref1">[1]</a>'
  ],
  '#komponen .diagram strong':['Infrastructure','Rolling stock','Energy','Signalling & control','Operations','Maintenance'],
  '#komponen .diagram p':[
   'Rails, sleepers, ballast, bridges, tunnels, stations and turnouts.',
   'EMUs, locomotives, passenger coaches and freight wagons.',
   'Electricity or fuel sources and the systems supplying power to trains.',
   'Train detection, route control and movement protection.',
   'Timetables, traffic management and staff communication.',
   'Inspection, repair and care of assets to keep them safe for use.'
  ],
  '#interaksi > h2':'2. How do the parts work together?',
  '#interaksi > p':[
   'Imagine a passenger train traveling from Station A to Station B. It needs suitable track and a power supply. The control system needs information about the route and the train’s position. Operations staff coordinate its journey with other trains. Maintenance teams inspect and maintain the assets.',
   '<strong>Key principle:</strong> A working train is not automatically permitted to move. Movement authorization depends on the relevant systems, procedures and operational conditions. Actual details vary between networks and applicable rules.'
  ],
  '#landasan > h2':'3. A track is more than two rails',
  '#landasan > p':[
   'Track structure includes rails, sleepers supporting the rails and other support components depending on the construction type. On ballasted track, ballast helps support the structure and maintain track geometry. Turnouts or points allow a train to move from one track route to another. <a href="#ref2">[2]</a>',
   'Maintenance may involve a <em>tamping machine</em> to help correct track support and geometry, and a <em>ballast regulator</em> to shape and distribute ballast. Specific machine duties depend on design and work procedures. <a href="#ref2">[2]</a>'
  ],
  '#kawalan > h2':'4. Why are signalling and traffic control needed?',
  '#kawalan > p':[
   'Trains have long stopping distances. Signalling helps manage train movements so routes are used safely. In some systems, train detection indicates whether a track section is occupied, while points change a route. <a href="#ref3">[3]</a>',
   'Some systems use lineside signals, while modern systems can also show control information to drivers through cab displays. Technology and procedures differ between networks. <a href="#ref3">[3]</a>',
   '<strong>OCC / Traffic Control:</strong> Conceptually, traffic management includes coordinating timetables, train movements and service disruption. This chapter does not prescribe any ECRL-specific instructions, speeds, signal aspects or operating procedures.'
  ],
  '#glosari > h2':'5. Basic glossary: BM · EN · 中文',
  '#glosari > p.muted':'The Mandarin terms above are general learning references, not approved ECRL operational terminology. Specialist technical-language review is still needed before final publication.',
  '#semak > h2':'6. Check your understanding',
  '#semak > p':'These self-review questions are not a competency assessment.',
  '#semak details summary':[
   '1. Is rolling stock the same as infrastructure?',
   '2. What is the general purpose of a turnout?',
   '3. Why is signalling important?'
  ],
  '#semak details p':[
   'No. Rolling stock means rail vehicles, while infrastructure includes tracks and fixed facilities.',
   'A turnout allows a train to use a different track route at a junction.',
   'Signalling helps manage and protect train movements while taking account of route conditions and other trains.'
  ],
  '#rujukan > h2':'References and evidence scope',
  '#rujukan ol li':[
   'EUR-Lex, <a href="https://eur-lex.europa.eu/EN/legal-content/summary/an-interoperable-eu-rail-system.html" target="_blank" rel="noopener noreferrer">An interoperable EU rail system</a> — classification of railway subsystems (European reference, not an ECRL specification).',
   'Network Rail, <a href="https://www.networkrail.co.uk/our-work/looking-after-the-railway/track/" target="_blank" rel="noopener noreferrer">Track</a> — track structure and maintenance.',
   'Network Rail, <a href="https://www.networkrail.co.uk/stories/signals-explained/" target="_blank" rel="noopener noreferrer">Signals explained</a> — concepts of signalling, train detection and points.'
  ],
  '#rujukan > p.muted':'Status: editorial draft for technical review, translation and UAT. Original content has been rewritten for educational explanation; no extended excerpts from sources. Sources reviewed: 23 October 2026.',
  'footer p':'MR-S10 Independent Railway Education · Online reading only · No downloads provided · <a href="../gateway.html">Back to Gateway</a>'
 },
 zh:{
  'header a':'← MR-S10 铁路学习入口',
  'main .tag':['公共内容 · 在线阅读','编辑草稿 · v0.1'],
  'main h1':'第01章 — 铁路系统简介',
  'main > p.muted':'铁路基础知识 · 简体中文 · 马来语与英语技术术语 · 编辑审阅：2026年10月23日',
  'main > p.lead':'列车不能独立运行。它依赖线路基础设施、能源供应、控制系统、通信、工作人员、维护以及相互配合的运营规章。',
  'main > .note':'<strong>使用范围：</strong>本资料仅供公共教育学习，并非运营手册、能力资格批准、应急指令或 ECRL 官方文件。国际案例不一定代表 ECRL 的技术规范。',
  '.toc > strong':'本章目录',
  '.toc > a':['学习目标','1. 铁路系统的组成','2. 各部分如何协同','3. 轨道与道岔','4. 信号与运营','5. 三语术语表','6. 理解检测','参考资料'],
  '#hasil > h2':'学习目标',
  '#hasil > p':'阅读本章后，读者应能够解释什么是铁路系统，识别主要子系统，区分轨道车辆与基础设施，并理解为什么需要信号系统和行车管理。',
  '#komponen > h2':'1. 什么是铁路系统？',
  '#komponen > p':[
   '铁路系统由实体资产、技术和管理组织组成，使客运或货运列车能够在铁路网络中运行。为便于学习，可将相互关联的功能概括为六个方面：',
   '这种划分是教学用途的简化说明。欧盟铁路互联互通文件将基础设施、能源、信号和轨道车辆等结构子系统，与运营、维护及信息功能加以区分。<a href="#ref1">[1]</a>'
  ],
  '#komponen .diagram strong':['基础设施','轨道车辆','能源','信号与控制','运营','维护'],
  '#komponen .diagram p':[
   '钢轨、轨枕、道砟、桥梁、隧道、车站和道岔。',
   '动车组、机车、旅客车厢和货运车辆。',
   '电力或燃料来源，以及向列车供能的系统。',
   '列车检测、进路控制与运行防护。',
   '运行图、行车组织与工作人员通信。',
   '检查、修理与保养设施设备，以维持安全使用。'
  ],
  '#interaksi > h2':'2. 各部分如何协同工作？',
  '#interaksi > p':[
   '设想一列旅客列车从 A 站开往 B 站。列车需要适用的轨道和动力供应。控制系统需要掌握线路状况及列车位置。运营人员协调该列车与其他列车的运行。维护团队负责设施设备的检查和保养。',
   '<strong>重要原则：</strong>列车技术状态正常，不代表它就能立即运行。列车运行许可还取决于有关系统、程序和运营条件。不同铁路网络的具体规定可能不同。'
  ],
  '#landasan > h2':'3. 轨道不只是两根钢轨',
  '#landasan > p':[
   '轨道结构包括钢轨、支承钢轨的轨枕，以及依据铺设方式使用的其他支承部件。在有砟轨道中，道砟有助于支承结构并维持轨道几何状态。道岔（turnout / points）允许列车从一条轨道进路转向另一条。<a href="#ref2">[2]</a>',
   '轨道养护可以使用<em>捣固车（tamping machine）</em>协助调整轨道支承及几何状态，并使用<em>道砟整形车（ballast regulator）</em>整理和分配道砟。机器的具体任务取决于设计和作业程序。<a href="#ref2">[2]</a>'
  ],
  '#kawalan > h2':'4. 为什么需要信号和行车控制？',
  '#kawalan > p':[
   '列车制动距离较长。信号系统协助管理列车运行，确保线路得到安全使用。在某些系统中，列车检测可显示某一区段是否被占用；道岔则负责改变进路。<a href="#ref3">[3]</a>',
   '有些铁路采用线路旁信号机，现代系统也可以通过驾驶室显示设备向司机传递控制信息。不同铁路网络的技术和程序有所不同。<a href="#ref3">[3]</a>',
   '<strong>OCC / 行车控制：</strong>从概念上说，行车管理包括协调运行图、列车运行与服务中断情况。本章不制定任何 ECRL 专用指令、速度、信号显示或运营程序。'
  ],
  '#glosari > h2':'5. 基础术语表：BM · EN · 中文',
  '#glosari > p.muted':'上表中的中文术语仅作一般学习参考，并非已经核准的 ECRL 运营术语。正式出版前仍需由技术语言专家复核。',
  '#semak > h2':'6. 理解检测',
  '#semak > p':'以下自学问题不属于岗位能力评估。',
  '#semak details summary':['1. 轨道车辆与基础设施是否相同？','2. 道岔的一般作用是什么？','3. 为什么信号系统很重要？'],
  '#semak details p':[
   '不同。轨道车辆指在轨道上行驶的车辆，而基础设施包括轨道及固定设施。',
   '道岔使列车能够在分岔处选用不同的轨道进路。',
   '信号系统结合线路状态和其他列车的运行情况，协助管理并防护列车运行。'
  ],
  '#rujukan > h2':'参考资料与证据范围',
  '#rujukan ol li':[
   'EUR-Lex，<a href="https://eur-lex.europa.eu/EN/legal-content/summary/an-interoperable-eu-rail-system.html" target="_blank" rel="noopener noreferrer">An interoperable EU rail system</a> — 铁路子系统分类（欧洲参考资料，并非 ECRL 规范）。',
   'Network Rail，<a href="https://www.networkrail.co.uk/our-work/looking-after-the-railway/track/" target="_blank" rel="noopener noreferrer">Track</a> — 轨道结构与维护。',
   'Network Rail，<a href="https://www.networkrail.co.uk/stories/signals-explained/" target="_blank" rel="noopener noreferrer">Signals explained</a> — 信号、列车检测和道岔的基本概念。'
  ],
  '#rujukan > p.muted':'状态：待技术审核、翻译复核及用户验收测试的编辑草稿。内容已经改写为教育用途的说明，未引用来源的长篇原文。来源审阅：2026年10月23日。',
  'footer p':'MR-S10 独立铁路教育 · 仅供在线阅读 · 不提供下载 · <a href="../gateway.html">返回入口</a>'
 }
 };
 const selectors=Object.keys(translations.en);
 const original=Object.fromEntries(selectors.map(sel=>{
  const list=Array.from(document.querySelectorAll(sel));
  return [sel,list.map(node=>node.innerHTML)];
 }));
 // Whitelist only the citation/reference markup compiled with this file.
 // No fetched or user-provided HTML reaches this renderer.
 function language(){
  const url=new URLSearchParams(window.location.search).get('lang');
  let stored;
  try{stored=localStorage.getItem('railway-language')}catch{}
  const chosen=['ms','en','zh'].includes(url)?url:stored;
  return ['ms','en','zh'].includes(chosen)?chosen:'ms';
 }
 function render(lang){
  const copy=translations[lang]||original;
  for(const sel of selectors){
   const nodes=Array.from(document.querySelectorAll(sel));
   const items=Array.isArray(copy[sel])?copy[sel]:[copy[sel]];
   if(nodes.length!==items.length){
    console.warn('Chapter 01 locale coverage mismatch',sel,nodes.length,items.length);
    continue;
   }
   nodes.forEach((node,i)=>{node.innerHTML=items[i]});
  }
  document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
  document.title=lang==='en'?'Chapter 01 · Introduction to Railway Systems | MR-S10':
    lang==='zh'?'第01章 · 铁路系统简介 | MR-S10':'Bab 01 · Pengenalan Sistem Kereta Api | MR-S10';
  chooser.value=lang;
  for(const option of Array.from(chooser.options))option.selected=option.value===lang;
  try{localStorage.setItem('railway-language',lang)}catch{}
  document.querySelector('meta[name="description"]')?.setAttribute('content',
   lang==='en'?'Public railway system fundamentals for general education.':
   lang==='zh'?'铁路系统基础知识：公共教育资料。':
   'MR-S10 Railway Knowledge Library: pengenalan kepada sistem kereta api, komponen, operasi dan istilah asas.');
 }
 function setTheme(theme){
  const t=theme==='dark'?'dark':'light';
  document.documentElement.dataset.theme=t;
  themeButton.textContent=t==='dark'?'Light Mode':'Dark Mode';
  themeButton.setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode');
  try{localStorage.setItem('railway-theme',t)}catch{}
 }
 chooser.addEventListener('change',()=>{
  render(chooser.value);
  const url=new URL(window.location.href);
  url.searchParams.set('lang',chooser.value);
  history.replaceState(null,'',url.pathname+url.search+url.hash);
 });
 themeButton?.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
 let savedTheme='light';
 try{savedTheme=localStorage.getItem('railway-theme')||'light'}catch{}
 setTheme(savedTheme);
 render(language());
})();
