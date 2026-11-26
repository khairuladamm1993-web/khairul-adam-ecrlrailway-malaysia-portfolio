(async()=>{
 'use strict';
 const page=window.MRS10P01MapCore;
 const list=document.getElementById('asset-reference-list');
 const status=document.getElementById('asset-status');
 const search=document.getElementById('asset-search');
 const buttons=[...document.querySelectorAll('[data-asset-kind]')];
 const labels={STN:'Stesen',PL:'Passing loop',DEPOT:'Depot',YARD:'Terminal kargo cadangan'};
 let kind='ALL';
 let assets;
 try{
  assets=await page.loadPublicAssetIdentity();
 }catch{
  status.textContent='Rujukan aset belum tersedia.';
  return;
 }
 function render(){
  const visible=page.findPublicAssets(assets,search.value,kind);
  list.replaceChildren(...visible.map(asset=>{
   const row=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('small');
   row.dataset.type=asset.type;
   row.dataset.assetId=asset.assetId;
   title.textContent=[asset.code,asset.name].filter(Boolean).join(' · ');
   const label=asset.type==='STN'&&asset.section==='C2'?'Stesen dirancang':labels[asset.type];
   detail.textContent=[label,asset.section?'Seksyen '+asset.section:null,'Lokasi fizikal belum disahkan'].filter(Boolean).join(' · ');
   row.append(title,detail);
   return row;
  }));
  status.textContent=visible.length?visible.length+' aset rujukan':'Tiada padanan aset.';
 }
 search.addEventListener('input',render);
 for(const button of buttons)button.addEventListener('click',()=>{
  kind=button.dataset.assetKind;
  for(const item of buttons)item.setAttribute('aria-pressed',String(item===button));
  render();
 });
 render();
})();
