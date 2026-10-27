/* V7 isolated lab: popup-embedded public source status, never inferred railway operating limits. */
(function(root){'use strict';
const valid='KTMB_OFFICIAL_GTFS_REALTIME_VEHICLE_POSITION';
const official='https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb';
function accept(payload){
 return payload&&payload.source===valid&&payload.sourceUrl===official&&
 ['CONNECTED','STALE','UNAVAILABLE'].includes(payload.status)&&
 ['stationApproachSpeed','stationThroughSpeed','temporarySpeedRestriction']
 .every(k=>payload[k]?.status==='NOT_PUBLISHED'&&payload[k]?.valueKmh===null);
}
function enhancePopup(host,point){
 if(!host||!point)return;
 const box=document.createElement('details');box.open=true;box.className='rail-live-data';
 box.style.cssText='border-top:1px solid #91a5aa;padding-top:9px;margin-top:8px;font:12px/1.45 system-ui;color:inherit';
 const title=document.createElement('summary');title.style.cssText='font-weight:700;cursor:pointer';
 title.textContent='Speed & Live Data · sumber rasmi';box.append(title);
 const desc=document.createElement('p');
 desc.textContent='Had pendekatan stesen: — · Kelajuan laluan terus: — · TSR: — (belum diterbitkan dalam API awam)';
 box.append(desc);
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Memeriksa KTMB GTFS-Realtime…';box.append(status);
 const disclaimer=document.createElement('small');disclaimer.textContent='Data tren semasa tidak menentukan had kelajuan stesen. Bukan untuk operasi tren.';box.append(disclaimer);
 const link=document.createElement('a');link.href='https://developer.data.gov.my/realtime-api/gtfs-realtime.en';
 link.target='_blank';link.rel='noopener noreferrer';link.textContent=' Sumber: data.gov.my';box.append(link);
 host.append(box);
 // Source probe is network-wide, and is NOT inferred to be at the tapped station.
 fetch('./api/ktmb-public-telemetry',{credentials:'omit',cache:'no-store'})
 .then(r=>r.json()).then(r=>{
  if(!accept(r))throw Error('UNVERIFIED_LIVE_SCHEMA');
  if(r.status==='CONNECTED')status.textContent='Feed KTMB tersambung · '+r.reportedVehicles+
   ' tren dilaporkan · '+r.withObservedSpeed+' bacaan kelajuan disertakan · masa feed '+r.feedTimestampUtc+
   ' (seluruh rangkaian, bukan stesen '+point.name+')';
  else status.textContent='Feed KTMB '+(r.status==='STALE'?'tidak terkini':'tidak dapat dicapai')+
   ' · tiada had kelajuan/TSR boleh dipaparkan.';
 }).catch(()=>{status.textContent='Feed KTMB tidak dapat dicapai · had kelajuan dan TSR kekal tidak tersedia.'});
}
const api=Object.freeze({accept,enhancePopup,official});
if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MRS10RailLiveGate=api;
})(typeof window!=='undefined'?window:null);
