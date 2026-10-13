(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MRS10MalaysiaCatalogue=Object.freeze(api)})(typeof window!=='undefined'?window:null,function(){
'use strict';
/* Public catalogue. Region centers are navigation hints, never railway/station coordinates. */
const rows=[
['ecrl','ECRL','Project corridor','Malaysia Rail Link','East Coast Malaysia',4.4,103.1,7],
['ktmb','KTMB','Conventional / commuter','Keretapi Tanah Melayu','Peninsular Malaysia',3.1,101.7,7],
['mrt','MRT','Urban rapid transit','Rapid Rail / MRT operators','Klang Valley',3.14,101.69,10],
['lrt','LRT','Urban light rail','Rapid Rail','Klang Valley',3.14,101.69,10],
['monorail','Monorail','Urban monorail','Rapid Rail','Kuala Lumpur',3.145,101.706,12],
['erl','ERL','Airport rail','Express Rail Link','KLIA / KL Sentral region',2.92,101.7,10],
['rts','RTS Link','Cross-border project','RTS Link project','Johor Bahru / Singapore',1.46,103.77,11]
];
const records=Object.freeze(rows.map(([id,name,category,operator,region,lat,lon,zoom])=>Object.freeze({id,name,category,operator,region,center:Object.freeze([lat,lon]),zoom,note:'Reference catalogue only. Tracks, stations and operating status not verified by this dataset.'})));
const categories=Object.freeze(['All',...new Set(records.map(r=>r.category))]);
const norm=x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const search=(query='',category='All')=>records.filter(r=>(category==='All'||r.category===category)&&(!norm(query)||norm([r.name,r.operator,r.region,r.category].join(' ')).includes(norm(query))));
return Object.freeze({records,categories,search});
});
