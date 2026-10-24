/* MR-S10 Owner Dashboard integration: same-origin route, permission-gated navigation.
 * The link is a convenience only; owner-command-center.html independently verifies
 * the live Supabase user/session/role. No private Owner data or passwords here.
 */
(()=>{
 'use strict';
 const shortcut=document.getElementById('owner-center-shortcut');
 if(!shortcut)return;
 function refresh(){
  const auth=window.RailwayAccess;
  const verified=Boolean(auth&&auth.canAdmin===true&&auth.status==='authenticated');
  shortcut.hidden=!verified;
  shortcut.setAttribute('aria-hidden',String(!verified));
  if(!verified)shortcut.setAttribute('tabindex','-1');
  else shortcut.removeAttribute('tabindex');
 }
 window.addEventListener('railway-access-change',refresh);
 window.addEventListener('pageshow',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 refresh();
})();
