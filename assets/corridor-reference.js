/* Shared public-safe Corridor reference projection.
   Names/types/coordinates originate from the earlier validated ECRL map build.
   Coordinates are public reference positions only, never railway survey/GIS alignment points.
   Protected station codes, chainage, layouts, notes and Member records are intentionally absent. */
(()=>{
 'use strict';
 const rows=[
  ['Kota Bharu','STN',6.05136,102.23264,'public-reference'],
  ['Pasir Puteh','STN',5.80648,102.36769,'public-reference'],
  ['Jerteh','STN',5.70102,102.48321,'public-reference'],
  ['Bandar Permaisuri','STN',5.52084,102.73814,'public-reference'],
  ['Pekan Sg. Tong','PL',5.35123,102.89995,'public-reference'],
  ['Kuala Terengganu','STN',5.17328,103.09777,'public-reference'],
  ['Bukit Payung','PL',5.23269,103.10281,'public-reference'],
  ['Dungun','STN',4.73388,103.38748,'public-reference'],
  ['Kemasik','STN',4.50287,103.42200,'public-reference'],
  ['Chukai','STN',4.24895,103.38249,'public-reference'],
  ['Cherating','STN',4.15156,103.37487,'public-reference'],
  ['Kuantan Port City Depot','Depot',null,null,'coordinate-pending'],
  ['Kuantan Port City','STN',3.96685,103.34673,'public-reference'],
  ['Kota SAS','STN',3.86503,103.29351,'public-reference'],
  ['Paya Besar','STN',3.74690,103.12168,'public-reference'],
  ['Felda Lepar','PL',3.67709,103.03001,'public-reference'],
  ['Kampung Alur Gading','PL',3.61430,102.83280,'public-reference'],
  ['Maran','STN',3.54089,102.66381,'public-reference'],
  ['Chenor','PL',3.48992,102.58141,'public-reference'],
  ['Temerloh','STN',3.44351,102.31911,'public-reference'],
  ['Lanchang','PL',3.50746,102.19129,'public-reference'],
  ['Bentong','STN',3.47825,101.91328,'public-reference'],
  ['Alang Sedayu','PL',null,null,'coordinate-pending'],
  ['Gombak North EMU Depot','Depot',null,null,'coordinate-pending'],
  ['ITT Gombak','STN',3.23169,101.72284,'public-reference']
 ];
 window.RailwayCorridorReference=Object.freeze(rows.map(([name,type,lat,lon,coordinateClass],index)=>Object.freeze({id:'ref-'+index,name,type,lat,lon,coordinateClass,phase:'current'})));
})();
