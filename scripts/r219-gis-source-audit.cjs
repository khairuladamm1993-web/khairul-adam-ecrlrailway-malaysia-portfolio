'use strict';
// R2.19 read-only evidence audit; never modifies a feature service or commits source geometry.
const service=require('../assets/mrs10-r219-ampang-service.js');
const gis=require('../assets/mrs10-r219-ampang-gis.js');
const aliases=['STN_NAME','STATION_NAME','station_name','Station_Name','Station','STATION','NAME','Name','name','NAMA','NAMA_STESEN'];
const codes=['STN_CODE','STATION_CODE','station_code','Station_Code','CODE','Code','code'];
const field=(o,keys)=>keys.map(k=>o?.[k]).find(v=>typeof v==='string'&&v.trim())||'';
async function main(){
 const res=await fetch(gis.requestUrl,{signal:AbortSignal.timeout(18000)});
 if(!res.ok){console.log('GIS_AUDIT_HTTP',res.status);return}
 const source=await res.json();
 if(source.error||!Array.isArray(source.features)){console.log('GIS_AUDIT_SCHEMA_ERROR',JSON.stringify(source.error||{}));return}
 const out=gis.decode(source.features,service);
 const found=new Set(out.data.map(x=>x.code));
 console.log('GIS_AUDIT_TOTAL',source.features.length,'MATCHED',out.matched,'MISSING',out.missing,'REJECTED',out.rejected);
 console.log('GIS_MISSING_CODES',service.stations.filter(x=>!found.has(x.serviceCode)).map(x=>x.serviceCode+' '+x.name).join(' | '));
 for(const f of source.features){
   const attrs=f.attributes||{},n=field(attrs,aliases),c=field(attrs,codes),p=f.geometry||{};
   const normalized=gis.canonical(n.replace(/^AG(?:1[0-8]|[1-9])\s+/i,''));
   const expected=service.stations.find(s=>gis.canonical(s.name)===normalized);
   const issue=!expected||!found.has(expected.serviceCode);
   if(issue||/titiwangsa|tiwangsa|titiwang/i.test(JSON.stringify(attrs))){
     const lon=Number(p.x),lat=Number(p.y);
     const withinBounds=Number.isFinite(lon)&&Number.isFinite(lat)&&lon>=gis.bbox.minLon&&lon<=gis.bbox.maxLon&&lat>=gis.bbox.minLat&&lat<=gis.bbox.maxLat;
     console.log('GIS_SOURCE_AUDIT_RECORD',JSON.stringify({name:n,code:c,sourceId:attrs.FID??attrs.OBJECTID,keys:Object.keys(attrs),matchedOfficial:expected?.serviceCode||null,withinBounds}));
   }
 }
}
main().catch(e=>console.log('GIS_AUDIT_NETWORK_UNAVAILABLE',String(e?.message||e).slice(0,160)));
