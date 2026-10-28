(function(root){'use strict';
function create(adapter,{getLocale,getCategory,onSelect,onFlags}){
 const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);return n},t=k=>adapter.t(getLocale(),k);
 function render(){
  const host=$('ecrl-controls');host.hidden=getCategory()!=='ECRL';host.replaceChildren(el('strong','ECRL · '+t('title')));
  const labels={LOCALITY:t('reference'),HISTORICAL:t('legendHistoric'),MARITIME:t('legendPort')};
  for(const kind of Object.keys(adapter.flags)){const label=el('label'),box=el('input');box.type='checkbox';box.id='ecrl-reference-'+kind.toLowerCase();box.checked=adapter.flags[kind];box.onchange=()=>onFlags(kind,box.checked);label.append(box,document.createTextNode(labels[kind]));host.append(label)}
  host.append(el('small',t('noTrack')+' '+t('noLoops')));
  const assets=$('ecrl-assets');assets.replaceChildren(el('h2','ECRL · '+t('list')));
  assets.append(el('p',t('reference')+' · '+t('noTrack')));
  for(const a of adapter.assets){const b=el('button',(a.officialName||a.historicalName)+' · '+a.assetType+' · '+a.verificationStatus);b.type='button';b.dataset.ecrlAsset=a.assetId;b.onclick=()=>onSelect(a.assetId);assets.append(b)}
 }
 function content(id){const a=adapter.get(id);if(!a)return null;const host=el('div');host.className='ecrl-intelligence';host.dataset.ecrlAsset=id;
  host.append(el('h3',a.assetType==='STATION'?t('stationIntel'):t('infraIntel')),el('strong',a.officialName||a.historicalName));
  const ref=adapter.reference(id);host.append(el('p',ref?.kind==='HISTORICAL'?t('referenceWarning'):ref?.kind==='MARITIME'?t('portReferenceWarning'):ref?t('reference'):t('noPoint')));
  for(const [label,value] of [['assetType',a.assetType],['section',a.section],['status',a.assetStatus],['verification',a.verificationStatus],['service',a.serviceType],['geometry',a.geometryProvenance||a.geometryType],['chainage',a.chainageStartKm==null&&a.chainageEndKm==null?null:[a.chainageStartKm??'UNKNOWN',a.chainageEndKm??'UNKNOWN'].join(' – ')],['trackCount',a.trackCount]])host.append(el('p',t(label)+': '+(value==='CONFIRMED'&&label==='verification'?t('confirmed')+' · CONFIRMED':value??(t('unknown')+' · UNKNOWN'))));
  host.append(el('p',t('notOperational')));
  host.append(el('p','assetId: '+a.assetId),el('p',t('noTrack')));
  if(ref)host.append(el('p','REFERENCE_ONLY · '+ref.kind+' · '+ref.sourceId));
  if(id==='ecrl-stn-16')host.append(el('p','PLANNED_CONNECTION · LRT KJ1 Gombak · '+t('notOperational')));
  for(const rel of adapter.registry.topology.filter(r=>r.from===id||r.to===id))host.append(el('p',rel.relation+' · '+rel.status+' · '+(rel.from===id?rel.to:rel.from)));
  for(const conflict of a.conflicts||[])host.append(el('p',t('conflict')+' · SOURCE_CONFLICT · '+conflict.field+' · '+conflict.sourceIds.join(' / ')+' · '+conflict.reason));
  if(a.notes){const d=el('details'),summary=el('summary',t('note'));d.append(summary,el('p',a.notes));host.append(d)}
  const sources=el('details'),summary=el('summary',t('sources'));sources.append(summary);
  const ids=[...new Set([...(a.sourceIds||[]),...(ref?[ref.sourceId]:[])])];
  for(const sid of ids){const source=adapter.registry.sources[sid];if(!source)continue;const p=el('p'),link=el('a',sid+' · '+source.kind);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';p.append(link,el('span',' · '+source.revision));sources.append(p)}host.append(sources);return host;
 }
 return {render,content};
}
root.MRS10ECRLIntegrationUI=Object.freeze({create});
})(window);
