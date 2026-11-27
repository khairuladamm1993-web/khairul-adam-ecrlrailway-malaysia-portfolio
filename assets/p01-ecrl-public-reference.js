(()=>{
 'use strict';
 const page=window.MRS10P01MapCore;
 const list=document.getElementById('asset-reference-list');
 const status=document.getElementById('asset-status');
 const search=document.getElementById('asset-search');
 const retryButton=document.getElementById('asset-retry');
 const buttons=[...document.querySelectorAll('[data-asset-kind]')];
 const labels={STN:'Stesen',PL:'Passing loop',DEPOT:'Depot',YARD:'Terminal kargo cadangan',PORT:'Antara muka pelabuhan dirancang'};
 let kind='ALL';
 let assets;
 function render(){
  if(!assets)return;
  const visible=page.findPublicAssets(assets,search.value,kind);
  list.replaceChildren(...visible.map(asset=>{
   const row=document.createElement('li'),title=document.createElement('strong'),link=document.createElement('a'),detail=document.createElement('small');
   row.dataset.type=asset.type;
   row.dataset.assetId=asset.assetId;
   link.textContent=[asset.code,asset.name].filter(Boolean).join(' · ');
   link.href='./'+page.routes.malaysia+'?'+new URLSearchParams({asset:asset.assetId});
   link.target='_top';
   title.append(link);
   const label=asset.type==='STN'&&asset.section==='C2'?'Stesen dirancang':labels[asset.type];
   const note=asset.type==='PORT'?'Rujukan kawasan pelabuhan; sambungan rel belum disahkan':'Lokasi fizikal belum disahkan';
   detail.textContent=[label,asset.section?'Seksyen '+asset.section:null,note].filter(Boolean).join(' · ');
   row.append(title,detail);
   return row;
  }));
  status.textContent=visible.length?visible.length+' aset rujukan':'Tiada padanan aset.';
 }
 async function load(retry=false){
  if(retryButton.disabled)return;
  retryButton.disabled=true;
  status.textContent='Memuatkan rujukan aset…';
  try{
   assets=await page.loadPublicAssetIdentity(retry);
  }catch{
   status.textContent='Rujukan aset ECRL gagal dimuatkan.';
   retryButton.hidden=false;
   return;
  }finally{
   retryButton.disabled=false;
  }
  if(document.activeElement===retryButton)search.focus();
  retryButton.hidden=true;
  render();
 }
 search.addEventListener('input',render);
 for(const button of buttons)button.addEventListener('click',()=>{
  kind=button.dataset.assetKind;
  for(const item of buttons)item.setAttribute('aria-pressed',String(item===button));
  render();
 });
 retryButton.addEventListener('click',()=>void load(true));
 void load();
})();
