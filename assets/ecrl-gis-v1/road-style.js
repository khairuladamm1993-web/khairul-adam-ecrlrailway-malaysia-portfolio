/* MR-S10 ECRL GIS V1 — diminish only ordinary-road basemap layers by 40%.
   MapLibre feature markers, railway assets and track sources are intentionally untouched. */
(function(root){
 'use strict';
 const factor=0.6;
 function isRoadLayer(layer){
   const id=String(layer&&layer.id||'').toLowerCase();
   return ['line','fill','symbol'].includes(layer&&layer.type)
     &&/(road|highway|motorway|street|residential)/.test(id)
     &&!/(rail|tram|metro|subway|transit|station|train|waterway|aero)/.test(id);
 }
 function scaledOpacity(previous){
   if(typeof previous==='number')return Math.min(1,Math.max(0,previous*factor));
   // Preserve valid MapLibre expression-based opacity while scaling it.
   if(Array.isArray(previous))return ['*',factor,previous];
   // Retain legacy zoom-dependent fading, including roads hidden at low zoom.
   if(previous&&typeof previous==='object'&&Array.isArray(previous.stops)&&!previous.property){
     const stops=previous.stops;
     if(stops.every(s=>Array.isArray(s)&&s.length===2&&Number.isFinite(s[0])&&Number.isFinite(s[1]))){
       if(stops.length===1)return stops[0][1]*factor;
       if(previous.type==='interval')return ['step',['zoom'],stops[0][1]*factor,
         ...stops.slice(1).flatMap(s=>[s[0],s[1]*factor])];
       const interp=Number.isFinite(previous.base)&&previous.base!==1?
         ['exponential',previous.base]:['linear'];
       return ['interpolate',interp,['zoom'],...stops.flatMap(s=>[s[0],s[1]*factor])];
     }
   }
   // Do not override an unsupported data-dependent legacy opacity rule.
   if(previous!==undefined&&typeof previous==='object')return null;
   // An absent opacity setting has the MapLibre default of 1.
   return factor;
 }
 function apply(map){
   if(!map||typeof map.getStyle!=='function'||typeof map.setPaintProperty!=='function')return 0;
   const layers=map.getStyle()?.layers||[];
   let changed=0;
   for(const layer of layers){
     if(!isRoadLayer(layer))continue;
     const props=layer.type==='line'?['line-opacity']:layer.type==='fill'?['fill-opacity']:['text-opacity','icon-opacity'];
     for(const prop of props){
       // Symbol styles may have text only or icons only; do not add unseen content.
       if(layer.type==='symbol'&&layer.paint?.[prop]===undefined){
         const kind=prop==='text-opacity'?'text-field':'icon-image';
         if(layer.layout?.[kind]===undefined)continue;
       }
       const opacity=scaledOpacity(layer.paint?.[prop]);
       if(opacity===null)continue;
       map.setPaintProperty(layer.id,prop,opacity);
       changed++;
     }
   }
   return changed;
 }
 root.MRS10ECRLRoadStyle=Object.freeze({factor,isRoadLayer,scaledOpacity,apply});
})(window);
