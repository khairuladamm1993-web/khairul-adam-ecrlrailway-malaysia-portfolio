/* Shared public-safe Corridor reference projection.
   Names/types/coordinates originate from the earlier validated ECRL map build.
   Coordinates are public reference positions only, never railway survey/GIS alignment points. Only a canonical approved Corridor record may promote an asset to Validated Location.
   Protected station codes, chainage, layouts, notes and Member records are intentionally absent. */
(()=>{
 'use strict';
 const rows=[
  ['Kota Bharu','STN',6.05136,102.23264,'Public Reference Location'],
  ['Pasir Puteh','STN',5.80648,102.36769,'Public Reference Location'],
  ['Jerteh','STN',5.70102,102.48321,'Public Reference Location'],
  ['Bandar Permaisuri','STN',5.52084,102.73814,'Public Reference Location'],
  ['Pekan Sg. Tong','PL',null,null,'Pending Validation'],
  ['Kuala Terengganu','STN',5.17328,103.09777,'Public Reference Location'],
  ['Bukit Payung','PL',5.23269,103.10281,'Public Reference Location'],
  ['Dungun','STN',4.73388,103.38748,'Public Reference Location'],
  ['Kemasik','STN',4.50287,103.42200,'Public Reference Location'],
  ['Chukai','STN',4.24895,103.38249,'Public Reference Location'],
  ['Cherating','STN',4.15156,103.37487,'Public Reference Location'],
  ['Kuantan Port City Depot','Depot',3.97450,103.33750,'Pending Validation'],
  ['Kuantan Port City','STN',3.96685,103.34673,'Public Reference Location'],
  ['Kota SAS','STN',3.86503,103.29351,'Public Reference Location'],
  ['Paya Besar','STN',3.74690,103.12168,'Public Reference Location'],
  ['Felda Lepar','PL',3.67709,103.03001,'Public Reference Location'],
  ['Kampung Alur Gading','PL',3.61430,102.83280,'Public Reference Location'],
  ['Maran','STN',3.54089,102.66381,'Public Reference Location'],
  ['Chenor','PL',3.473139,102.518833,'Public Reference Location'],
  ['Temerloh','STN',3.44351,102.31911,'Public Reference Location'],
  ['Lanchang','PL',3.50746,102.19129,'Pending Validation'],
  ['Bentong','STN',3.47825,101.91328,'Public Reference Location'],
  ['Alang Sedayu','PL',3.28426,101.76345,'Pending Validation'],
  ['Gombak North EMU Depot','Depot',3.25918,101.74407,'Pending Validation'],
  ['ITT Gombak','STN',3.23169,101.72284,'Public Reference Location']
 ];
 window.RailwayCorridorReference=Object.freeze(rows.map(([name,type,lat,lon,locationConfidence],index)=>Object.freeze({id:'ref-'+index,name,type,lat,lon,locationConfidence,coordinateSource:locationConfidence==='Public Reference Location'?'Public reference / locality position':'No validated coordinate',phase:'current'})));
})();
