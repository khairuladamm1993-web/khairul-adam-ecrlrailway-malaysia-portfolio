/* Authenticated member/admin gateway enhancements. Protected data is loaded only after RailwayAccess resolves a live server-authorized role. */
(()=>{
 'use strict';
 const R=window.Railway,h=R.html,A=window.RailwayAccess;
 if(!R||!A)return;
 let bundle=null,loading=false,selected=new Set(),quiz=null,tracker=null;
 const box=()=>document.querySelector('#gateway-content');
 const category=()=>document.querySelector('#categories [aria-selected="true"]')?.dataset.category||'practical';
 const lang=()=>R.language==='zh'?'zh':R.language==='en'?'en':'ms';
 const localized=(value)=>{if(value==null)return'';if(typeof value==='string')return value;return value[lang()]||value.en||value.ms||value.zh||'';};
 const escape=v=>h(String(v??''));
 const dialog=document.createElement('dialog');dialog.id='member-dialog';dialog.setAttribute('aria-labelledby','member-dialog-title');dialog.innerHTML='<button type="button" class="quiet modal-dismiss" data-member-close>Close</button><div id="member-dialog-content"></div>';document.body.append(dialog);
 const body=()=>dialog.querySelector('#member-dialog-content');
 const statusText=()=>A.level==='admin'?'Admin':A.level==='member'?'Verified Member':'Public';
 function renderStatus(){
  const el=document.querySelector('#gateway-status');if(!el)return;
  if(A.canReadMemberContent)el.innerHTML='<span class="access-label">'+escape(statusText())+'</span><button class="member-entry" data-member>'+escape(A.email||'MEMBER SESSION')+'</button>';
  else el.innerHTML='<span class="access-label">Public</span><button class="member-entry" data-member>LOGIN / MEMBER ACCESS</button>';
 }
 function renderAuth(){
  const controls='<div class="quiz-languages">'+['ms','en','zh'].map(l=>'<button data-auth-lang="'+l+'" aria-pressed="'+(R.language===l)+'">'+({ms:'BM',en:'EN',zh:'中文'})[l]+'</button>').join('')+(R.language==='zh'?'<button data-auth-pinyin>Pinyin '+(R.pinyin?'ON':'OFF')+'</button>':'')+'<button data-auth-theme>'+escape(window.RailwayTheme.value==='light'?'Dark Mode':'Light Mode')+'</button></div>';
  let inner='';
  if(A.canReadMemberContent){
   inner='<h2 id="member-dialog-title">'+escape(statusText())+'</h2><p class="access-label">'+escape(A.email||'Verified session')+'</p><p>Your access level is resolved by the backend from the current verified session.</p><div class="member-actions"><button class="secondary" data-refresh-member>REFRESH MEMBER DATA</button><button class="quiet" data-logout>LOG OUT</button></div><section class="learning-card member-consent"><h3>Member activity analytics</h3><p>Visit Duration and Active Engagement Time are recorded separately. Active time pauses while hidden or after 60 seconds without interaction.</p><button class="secondary" data-consent="'+(!A.activityConsent)+'">'+(A.activityConsent?'DISABLE ACTIVITY CONSENT':'ENABLE ACTIVITY CONSENT')+'</button></section>'+(A.canAdmin?'<section class="learning-card"><h3>Admin</h3><p>Admin controls are available only because account_role() returned admin.</p><div class="member-actions"><button class="secondary" data-admin-dashboard>LOAD ADMIN DASHBOARD</button></div><div id="admin-dashboard" hidden></div></section>':'');
  }else if(A.status==='verification-sent'){
   inner='<h2 id="member-dialog-title">Check your email</h2><p class="access-label">Verification link sent</p><p>Open the one-time Supabase email link for '+escape(A.email||'your address')+'. Access remains Public until a valid confirmed session is returned and account_role() approves it.</p><button class="secondary" data-auth-refresh>CHECK SESSION</button>';
  }else{
   inner='<h2 id="member-dialog-title">Verified Member</h2><p class="access-label">Email magic link / OTP</p><p>Enter your email to request secure verification. No IC or passport is required.</p><form id="member-auth-form"><label>Email<br><input name="email" type="email" autocomplete="email" required placeholder="name@example.com"></label><button class="primary" type="submit">'+(A.status==='sending'?'SENDING…':'SEND VERIFICATION LINK')+'</button></form>'+(A.error?'<p class="auth-error" role="alert">'+escape(A.error)+'</p>':'')+'<p class="study-boundary">No frontend-selected role is trusted. Invalid, expired or unapproved sessions remain Public.</p>';
  }
  body().innerHTML=controls+inner;
 }
 function openAuth(){renderAuth();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('[data-member-close]')?.focus();}
 async function loadBundle(){
  if(!A.canReadMemberContent){bundle=null;return;}
  if(loading)return;loading=true;
  try{bundle=await A.fetchMemberBundle();startOrStopTracker();enhance();}
  catch(error){bundle=null;console.error('Member data unavailable',error);renderStatus();}
  finally{loading=false;}
 }
 const progressMap=()=>new Map((bundle?.progress||[]).map(x=>[x.resource_id,x]));
 const contentBy=(...kinds)=>(bundle?.content||[]).filter(x=>kinds.includes(x.kind));
 function card(item){
  const p=progressMap().get(item.id);
  return '<article class="learning-card member-resource"><span class="access-label">'+escape(item.evidence||'Member resource')+'</span><h3>'+escape(localized(item.title))+'</h3><div class="member-body">'+escape(localized(item.body)).replace(/\n/g,'<br>')+'</div><div class="member-actions"><button class="secondary" data-save-resource="'+escape(item.id)+'" '+(p?.completed?'disabled':'')+'>'+(p?.completed?'COMPLETED':'MARK COMPLETE')+'</button></div></article>';
 }
 function enhance(){
  renderStatus();
  if(!A.canReadMemberContent||!bundle)return;
  const c=category(),target=box();if(!target)return;
  if(c==='practical'){
   target.innerHTML='<div class="content-heading"><div><h2>Practical Qualification</h2><p>Verified Member · server-scored assessment</p></div></div><div class="module-grid">'+bundle.quizBanks.map((row,i)=>{const b=row.bank||{},id=row.id;return '<button class="module" data-member-module="'+escape(id)+'" aria-pressed="'+selected.has(id)+'"><span class="module-index">'+String(b.index||i+1).padStart(2,'0')+'</span><span><span class="module-title">'+escape(localized(row.title)||localized(b.title)||id)+'</span><span class="module-meta">16-question bank · Verified Member</span></span><span aria-hidden="true">'+(selected.has(id)?'✓':'+')+'</span></button>';}).join('')+'</div><section class="content-row"><h2>Assessment history</h2><div class="learning-grid">'+((bundle.quizAttempts||[]).slice(0,4).map(a=>'<article class="learning-card"><h3>'+escape(a.modules.join(' + '))+'</h3><p>Score: '+escape(a.score)+'/16 · '+(a.passed?'PASS':'REVIEW')+'</p></article>').join('')||'<article class="learning-card"><p>No completed member assessment yet.</p></article>')+'</div></section><section class="content-row"><h2>Rolling Stock Library</h2><div class="learning-grid">'+(contentBy('rolling-stock','rolling_stock').map(card).join('')||'<article class="learning-card"><p>No approved protected rolling-stock records have been published yet.</p></article>')+'</div></section>';
   const start=document.querySelector('#start-quiz');start.hidden=false;start.disabled=selected.size<1||selected.size>2;start.textContent=selected.size?'START QUIZ ('+selected.size+')':'SELECT 1–2 MODULES';
  }else{
   const start=document.querySelector('#start-quiz');if(start)start.hidden=true;
   if(c==='ebook'){
    const items=contentBy('ebook','train-operation');target.innerHTML='<section class="content-row"><h2>E-BOOK TRAIN OPERATION</h2><div class="learning-grid">'+(items.map(card).join('')||'<article class="learning-card"><p>No approved member e-book content has been published yet.</p></article>')+'</div></section>';
   }else if(c==='corridor'){
    const items=contentBy('corridor','station','facility');target.innerHTML='<section class="content-row"><h2>ECRL STATIONS & CORRIDOR</h2><div class="learning-grid">'+(items.map(card).join('')||'<article class="learning-card"><p>No approved corridor records have been published yet.</p></article>')+'</div></section><section class="content-row"><h2>Protected files</h2><div class="learning-grid">'+((bundle.files||[]).map(f=>'<article class="learning-card"><h3>'+escape(f.id)+'</h3><p>Authenticated private asset</p><button class="secondary" data-member-file="'+escape(f.id)+'">OPEN SECURELY</button></article>').join('')||'<article class="learning-card"><p>No approved protected files are available yet.</p></article>')+'</div></section>';
   }else if(c==='future'){
    const items=contentBy('coming-soon','development');target.innerHTML='<section class="content-row"><h2>COMING SOON</h2><div class="learning-grid">'+(items.map(card).join('')||'<article class="learning-card"><p>No approved restricted development records have been published yet.</p></article>')+'</div></section>';
   }else if(c==='news'){
    const details=contentBy('insight','news','reference');if(details.length)target.insertAdjacentHTML('beforeend','<section class="content-row"><h2>04 / Detailed Member Insights</h2><div class="learning-grid">'+details.map(card).join('')+'</div></section>');
   }
  }
 }
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function startQuiz(){
  if(!bundle||selected.size<1||selected.size>2)return;
  const ids=[...selected],questions=[];
  for(const id of ids){const row=bundle.quizBanks.find(x=>x.id===id),all=row?.bank?.questions||[],take=16/ids.length;for(const q of shuffle(all).slice(0,take))questions.push({...q,module:id});}
  quiz={attempt:crypto.randomUUID(),modules:ids,questions:shuffle(questions),index:0,answers:[],busy:false};renderQuiz();
 }
 function renderQuiz(){
  if(!quiz)return;
  const q=quiz.questions[quiz.index],key=lang(),prompt=q.prompt?.[key]||q.prompt?.en||'',opts=q.options?.[key]||q.options?.en||[];
  body().innerHTML='<div class="quiz-top"><span>QUESTION '+(quiz.index+1)+' / 16</span><span>'+escape(q.module)+'</span></div><h2 id="member-dialog-title">'+escape(prompt)+'</h2>'+(R.language==='zh'&&R.pinyin&&q.prompt?.py?'<p class="pinyin">'+escape(q.prompt.py)+'</p>':'')+'<div class="answer-options">'+opts.map((o,i)=>'<button data-quiz-answer="'+i+'">'+escape(o)+'</button>').join('')+'</div><p class="study-boundary">Personal self-assessment only. This is not an official railway qualification, certification, operating authority or proof of competency.</p>';
  if(!dialog.open)dialog.showModal();
 }
 async function finishQuiz(){
  quiz.busy=true;body().innerHTML='<h2 id="member-dialog-title">Submitting assessment…</h2><p>Score is calculated by the server.</p>';
  try{
   const result=await A.submitQuiz(quiz.attempt,quiz.modules,quiz.answers),score=result.score??0,passed=result.passed??score>=12;
   body().innerHTML='<h2 id="member-dialog-title">'+(passed?'PASS':'REVIEW')+'</h2><div class="score">'+escape(score)+' / 16</div><p>PASS threshold: 12 / 16.</p><p class="study-boundary">Personal self-assessment only. This is not an official railway qualification, certification, operating authority or proof of competency.</p><button class="primary" data-quiz-done>DONE</button>';
   await loadBundle();
  }catch(error){body().innerHTML='<h2 id="member-dialog-title">Assessment not saved</h2><p class="auth-error">'+escape(error.message||error)+'</p><p>No local score is treated as authoritative.</p><button class="secondary" data-quiz-done>CLOSE</button>';}
 }

 function renderAdminDashboard(summary,data){
  const host=dialog.querySelector('#admin-dashboard');if(!host)return;
  const members=data.members||[],audit=(data.audit||[]).slice(0,8),snapshots=(data.snapshots||[]).slice(0,3);
  host.hidden=false;
  host.innerHTML='<div class="learning-grid admin-grid">'+
   '<article class="learning-card"><h3>Registrations</h3><p>'+members.length+' member profile(s)</p><p>Quiz attempts: '+escape(summary.quiz_attempts??0)+'</p></article>'+
   '<article class="learning-card"><h3>Engagement</h3><p>Member sessions: '+escape(summary.member_sessions??0)+'</p><p>Average visit: '+escape(Math.round(summary.average_visit_seconds||0))+' s</p><p>Active engagement: '+escape(Math.round(summary.active_engagement_seconds||0))+' s</p></article>'+
   '<article class="learning-card"><h3>Visitor analytics snapshots</h3><p>'+snapshots.length+' recent snapshot(s) loaded.</p><pre class="admin-summary">'+escape(JSON.stringify(snapshots,null,2))+'</pre></article>'+
   '<article class="learning-card"><h3>Security / activity log</h3><pre class="admin-summary">'+escape(JSON.stringify(audit,null,2))+'</pre></article>'+
  '</div><section class="content-row"><h3>Member access controls</h3><div class="learning-grid">'+members.map(m=>'<article class="learning-card"><p><strong>'+escape(m.email)+'</strong></p><p>'+escape(m.role)+' · '+(m.enabled?'Enabled':'Disabled')+'</p><button class="secondary" data-admin-member="'+escape(m.user_id)+'" data-admin-enable="'+(!m.enabled)+'">'+(m.enabled?'DISABLE':'ENABLE')+'</button></article>').join('')+'</div></section>'+
  '<section class="content-row"><h3>Content control</h3><form id="admin-content-form" class="admin-content-form"><label>ID<input name="id" required></label><label>Kind<input name="kind" required></label><label>Evidence<input name="evidence" required></label><label>Title EN<input name="title_en" required></label><label>Title BM<input name="title_ms" required></label><label>Title 中文<input name="title_zh" required></label><label>Body EN<textarea name="body_en"></textarea></label><label>Body BM<textarea name="body_ms"></textarea></label><label>Body 中文<textarea name="body_zh"></textarea></label><label><input name="approved" type="checkbox"> Approved</label><button class="primary" type="submit">SAVE CONTENT</button></form><p id="admin-content-status" role="status"></p></section>';
 }
 async function stopTracker(flushFirst=true){
  if(!tracker)return;
  const t=tracker;clearInterval(t.timer);
  for(const [event,handler] of t.listeners)removeEventListener(event,handler);
  removeEventListener('pagehide',t.pagehide);
  document.removeEventListener('visibilitychange',t.visibility);
  tracker=null;
  if(flushFirst)await t.flush();
 }
 async function startOrStopTracker(){
  if(!A.canReadMemberContent||!A.activityConsent){await stopTracker(true);return;}
  if(tracker)return;
  const state={id:crypto.randomUUID(),seq:0,last:performance.now(),lastActivity:performance.now(),visit:0,active:0,listeners:[]};
  const activity=()=>{state.lastActivity=performance.now();};
  for(const event of ['pointerdown','keydown','scroll','touchstart']){addEventListener(event,activity,{passive:true});state.listeners.push([event,activity]);}
  const tick=()=>{const now=performance.now(),delta=Math.max(0,Math.min(35,(now-state.last)/1000));state.visit+=delta;if(!document.hidden&&document.hasFocus()&&now-state.lastActivity<60000)state.active+=delta;state.last=now;};
  state.flush=async()=>{tick();const visit=Math.floor(state.visit),active=Math.floor(state.active);if(!visit&&!active)return;state.visit-=visit;state.active-=active;const section=category()==='map'?'corridor':category();try{await A.recordEngagement(state.id,section,state.seq++,visit,active);}catch{state.visit+=visit;state.active+=active;}};
  state.pagehide=()=>{state.flush();};
  state.visibility=()=>{if(document.hidden)state.flush();else state.last=performance.now();};
  addEventListener('pagehide',state.pagehide);document.addEventListener('visibilitychange',state.visibility);
  state.timer=setInterval(state.flush,30000);tracker=state;
 }
 document.addEventListener('click',async e=>{
  const member=e.target.closest('[data-member]');if(member){e.preventDefault();e.stopImmediatePropagation();openAuth();return;}
  const mod=e.target.closest('[data-member-module]');if(mod){const id=mod.dataset.memberModule;if(selected.has(id))selected.delete(id);else if(selected.size<2)selected.add(id);enhance();return;}
  if(e.target.closest('#start-quiz')&&A.canReadMemberContent){e.preventDefault();startQuiz();return;}
  const ans=e.target.closest('[data-quiz-answer]');if(ans&&quiz&&!quiz.busy){quiz.answers.push({module:quiz.questions[quiz.index].module,question:quiz.questions[quiz.index].id,answer:Number(ans.dataset.quizAnswer)});quiz.index++;quiz.index>=16?finishQuiz():renderQuiz();return;}
  if(e.target.closest('[data-quiz-done]')){quiz=null;dialog.close();enhance();return;}
  if(e.target.closest('[data-member-close]')){dialog.close();return;}
  if(e.target.closest('[data-logout]')){await stopTracker(true);await A.logout();bundle=null;selected.clear();renderStatus();renderAuth();return;}
  if(e.target.closest('[data-auth-refresh]')){await A.refresh();renderAuth();return;}
  if(e.target.closest('[data-refresh-member]')){await loadBundle();renderAuth();return;}
  const consent=e.target.closest('[data-consent]');if(consent){await A.setActivityConsent(consent.dataset.consent==='true');await loadBundle();renderAuth();return;}
  const save=e.target.closest('[data-save-resource]');if(save){await A.saveProgress(save.dataset.saveResource,1,true);await loadBundle();return;}
  const fileBtn=e.target.closest('[data-member-file]');if(fileBtn){const f=bundle?.files.find(x=>x.id===fileBtn.dataset.memberFile);if(f){const url=await A.signedFileUrl(f);if(url)window.open(url,'_blank','noopener,noreferrer');}return;}
  if(e.target.closest('[data-admin-dashboard]')){const host=dialog.querySelector('#admin-dashboard');host.hidden=false;host.textContent='Loading admin data…';try{const [summary,data]=await Promise.all([A.adminSummary(),A.fetchAdminData()]);renderAdminDashboard(summary,data);}catch(error){host.textContent=error.message||String(error);}return;}
  const memberToggle=e.target.closest('[data-admin-member]');if(memberToggle){try{await A.adminSetMemberEnabled(memberToggle.dataset.adminMember,memberToggle.dataset.adminEnable==='true');const [summary,data]=await Promise.all([A.adminSummary(),A.fetchAdminData()]);renderAdminDashboard(summary,data);}catch(error){const host=dialog.querySelector('#admin-dashboard');host.textContent=error.message||String(error);}return;}
  const al=e.target.closest('[data-auth-lang]');if(al){document.querySelector('[data-lang="'+al.dataset.authLang+'"]')?.click();renderAuth();return;}
  if(e.target.closest('[data-auth-pinyin]')){document.querySelector('.language-dock .pinyin-toggle')?.click();renderAuth();return;}
  if(e.target.closest('[data-auth-theme]')){window.RailwayTheme.toggle();renderAuth();return;}
 },true);
 dialog.addEventListener('submit',async e=>{if(e.target.id==='member-auth-form'){e.preventDefault();const submit=e.target.querySelector('button[type=submit]');submit.disabled=true;try{await A.sendMagicLink(new FormData(e.target).get('email'));}catch{}renderAuth();return;}if(e.target.id==='admin-content-form'){e.preventDefault();const f=new FormData(e.target),status=dialog.querySelector('#admin-content-status');status.textContent='Saving…';try{await A.adminSaveContent({id:f.get('id'),kind:f.get('kind'),evidence:f.get('evidence'),approved:f.get('approved')==='on',title:{en:f.get('title_en'),ms:f.get('title_ms'),zh:f.get('title_zh')},body:{en:f.get('body_en'),ms:f.get('body_ms'),zh:f.get('body_zh')}});status.textContent='Saved through admin_save_content().';}catch(error){status.textContent=error.message||String(error);}return;}});
 window.addEventListener('railway-access-change',()=>{renderStatus();renderAuth();if(A.canReadMemberContent)loadBundle();else{bundle=null;selected.clear();startOrStopTracker();}});
 document.querySelector('#categories')?.addEventListener('click',()=>setTimeout(enhance,0));
 R.onLanguage(()=>setTimeout(()=>{enhance();if(dialog.open)quiz?renderQuiz():renderAuth();},0));
 renderStatus();if(A.canReadMemberContent)loadBundle();
})();