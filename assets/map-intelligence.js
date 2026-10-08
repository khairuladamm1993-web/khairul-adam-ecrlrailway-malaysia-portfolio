/* Lightweight MAP search + chainage intelligence. Contains no Corridor dataset. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RailwayMapIntelligence=Object.freeze(api);
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const normalizeText=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();

  function parseChainage(value){
    const raw=String(value??'').trim();
    let m=raw.match(/^(?:ch\s*)?(\d{1,3})\s*\+\s*(\d{3})$/i);
    if(m){
      const km=Number(m[1])+Number(m[2])/1000;
      return Number.isFinite(km)?km:null;
    }
    m=raw.match(/^(?:ch\s*)?(\d{1,3})(?:\.(\d{1,3}))?$/i);
    if(!m)return null;
    const whole=Number(m[1]),fraction=m[2]?Number('0.'+m[2]):0,km=whole+fraction;
    return Number.isFinite(km)?km:null;
  }

  function formatChainage(km){
    if(!Number.isFinite(Number(km)))return null;
    const total=Math.round(Number(km)*1000);
    const whole=Math.floor(total/1000),metres=total-whole*1000;
    return 'CH'+String(whole).padStart(3,'0')+'+'+String(metres).padStart(3,'0');
  }

  function searchScore(query,aliases){
    const q=normalizeText(query);
    if(!q)return 0;
    let best=0;
    for(const value of aliases||[]){
      const a=normalizeText(value);
      if(!a)continue;
      if(a===q)best=Math.max(best,100);
      else if(a.startsWith(q))best=Math.max(best,80);
      else{
        const tokens=q.split(' ').filter(Boolean);
        if(tokens.length&&tokens.every(t=>a.includes(t)))best=Math.max(best,60);
        else if(a.includes(q))best=Math.max(best,40);
      }
    }
    return best;
  }

  function rankRecords(records,query,aliasGetter){
    return (records||[]).map(record=>({record,score:searchScore(query,aliasGetter(record))}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||String(a.record?.name||'').localeCompare(String(b.record?.name||'')));
  }

  function bracketChainage(anchors,km){
    const target=Number(km);
    if(!Number.isFinite(target))return {status:'invalid'};
    const rows=(anchors||[]).filter(a=>Number.isFinite(Number(a.chainageKm))).slice().sort((a,b)=>Number(a.chainageKm)-Number(b.chainageKm));
    if(!rows.length)return {status:'missing-anchors'};
    if(target<Number(rows[0].chainageKm)||target>Number(rows[rows.length-1].chainageKm))return {status:'out-of-range',first:rows[0],last:rows[rows.length-1]};
    const exact=rows.find(a=>Math.abs(Number(a.chainageKm)-target)<0.0005);
    if(exact)return {status:'exact',anchor:exact};
    let previous=null,next=null;
    for(const a of rows){
      if(Number(a.chainageKm)<target)previous=a;
      if(Number(a.chainageKm)>target){next=a;break;}
    }
    if(!previous||!next)return {status:'missing-bracket',previous,next};
    return {status:'bracket',previous,next};
  }

  function interpolateReference(previous,next,km){
    const p=Number(previous?.chainageKm),n=Number(next?.chainageKm),target=Number(km);
    const plat=Number(previous?.lat),plon=Number(previous?.lon),nlat=Number(next?.lat),nlon=Number(next?.lon);
    if(![p,n,target,plat,plon,nlat,nlon].every(Number.isFinite)||n<=p||target<=p||target>=n)return null;
    const ratio=(target-p)/(n-p);
    return {
      lat:plat+(nlat-plat)*ratio,
      lon:plon+(nlon-plon)*ratio,
      ratio,
      afterPreviousKm:target-p,
      beforeNextKm:n-target
    };
  }

  return {normalizeText,parseChainage,formatChainage,searchScore,rankRecords,bracketChainage,interpolateReference};
});
