/* MR-S10 P01 KTMB ets isolated foundation: no synthetic points or track geometry. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MRS10ETS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const manifest=Object.freeze({
  "moduleId": "mrs10-p01-ktmb-ets-v1",
  "operator": "KTMB",
  "title": "KTM ETS V1",
  "version": "V1_FOUNDATION",
  "scope": "PASSENGER_VISITOR_MAP_REFERENCE_ONLY",
  "geometryStatus": "NO_VERIFIED_WAY_GEOMETRY",
  "defaultMapPolicy": "DO_NOT_RENDER_PHYSICAL_TRACK",
  "sourceState": "STATION_SEQUENCE_NOT_IMPORTED",
  "colourStatus": "PROVISIONAL_UI_TOKENS_NOT_OPERATOR_CERTIFIED",
  "services": [
    {
      "id": "ktmb-ets-north-south",
      "name": "ETS · North–South Sector",
      "color": "#304BA6",
      "sourceUrl": "https://www.ktmb.com.my/TrainTime.html",
      "stopSequence": [],
      "geometry": null,
      "operatorHexVerified": false
    }
  ],
  "sources": [
    {
      "type": "OFFICIAL_OPERATOR_SCHEDULE",
      "url": "https://www.ktmb.com.my/TrainTime.html",
      "note": "KTMB ETS North–South schedule, 2026-06-01 effective listing; confirm live departures before publish"
    },
    {
      "type": "OFFICIAL_GOV_GTFS",
      "url": "https://developer.data.gov.my/realtime-api/gtfs-static.en",
      "note": "KTMB GTFS feed documented as daily refreshed, CC BY 4.0; feed not yet imported"
    }
  ]
});
  const ids=new Set(manifest.services.map(s=>s.id));
  function validateSourceDataset(dataset){
    const errors=[];
    if(!dataset||typeof dataset!=='object')return Object.freeze({ok:false,errors:['Missing dataset']});
    if(!ids.has(dataset.serviceId))errors.push('Unknown service');
    if(!['OFFICIAL_GOV_GTFS','OFFICIAL_OPERATOR_TIMETABLE'].includes(dataset.sourceType))errors.push('Unverified source type');
    if(typeof dataset.sourceUrl!=='string'||!/^https:\/\//.test(dataset.sourceUrl))errors.push('Source URL missing or non-HTTPS');
    if(typeof dataset.snapshotDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(dataset.snapshotDate))errors.push('Invalid snapshot date');
    if(!Array.isArray(dataset.stops)||dataset.stops.length<2)errors.push('At least two sourced stops required');
    if(dataset.geometry!=null||dataset.polyline!=null||dataset.trackWays!=null)errors.push('Physical line geometry is outside station import scope');
    const seen=new Set();
    if(Array.isArray(dataset.stops))for(const [i,stop] of dataset.stops.entries()){
      if(!stop||typeof stop.id!=='string'||!stop.id.trim()||typeof stop.name!=='string'||!stop.name.trim())errors.push('Missing station ID/name at '+i);
      if(stop&&typeof stop.id==='string'){if(seen.has(stop.id))errors.push('Duplicate station ID '+stop.id);seen.add(stop.id);}
      if(stop&&(stop.lat!=null||stop.lon!=null)){
        if(!Number.isFinite(stop.lat)||!Number.isFinite(stop.lon)||stop.lat<-90||stop.lat>90||stop.lon<-180||stop.lon>180||!/^https:\/\//.test(stop.coordinateSourceUrl||''))errors.push('Unsourced or invalid station coordinates at '+i);
      }
    }
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }
  function getPublishedStops(serviceId){
    if(!ids.has(serviceId))throw new Error('Unknown service');
    // Fail closed: no imported, reviewed station sequence exists on this foundation branch.
    return Object.freeze([]);
  }
  return Object.freeze({manifest,validateSourceDataset,getPublishedStops});
});