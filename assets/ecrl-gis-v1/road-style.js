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
   // An absent opacity setting has the MapLibre default of 1.
   // Older style functions are not equivalent to expressions: use fixed 0.6.
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
       map.setPaintProperty(layer.id,prop,scaledOpacity(layer.paint?.[prop]));
       changed++;
     }
   }
   return changed;
 }
 root.MRS10ECRLRoadStyle=Object.freeze({factor,isRoadLayer,scaledOpacity,apply});
})(window);
