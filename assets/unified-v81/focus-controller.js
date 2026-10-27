/* One focus transaction. Replacement keeps the first snapshot; no GIS fetch. */
(function(root){
'use strict';
function create({capture,apply,restore}){
 let original=null,current={mode:'NORMAL'};
 return {enter(next){if(original===null)original=capture();current=next;apply(current);},exit(){if(original===null)return;const saved=original;original=null;current={mode:'NORMAL'};restore(saved);},reapply(){if(original!==null)apply(current);},get current(){return current},get original(){return original}};
}
function component(network,id){
 const eligible=s=>['OFFICIAL_VERIFIED','OSM_TOPOLOGY_MATCHED'].includes(s.geometryVerification)&&s.fromNode&&s.toNode;
 const seed=network.segments.find(s=>s.segmentId===id);if(!seed)return [];
 if(!eligible(seed))return [id];
 const byNode=new Map();for(const s of network.segments.filter(eligible))for(const node of [s.fromNode,s.toNode]){if(!byNode.has(node))byNode.set(node,[]);byNode.get(node).push(s)}
 const seen=new Set(),queue=[seed];while(queue.length){const s=queue.pop();if(seen.has(s.segmentId))continue;seen.add(s.segmentId);for(const n of [s.fromNode,s.toNode])for(const other of byNode.get(n)||[])if(!seen.has(other.segmentId))queue.push(other)}return [...seen];
}
const api={create,component};if(typeof module==='object')module.exports=api;if(root)root.MRS10V81Focus=api;
})(typeof window!=='undefined'?window:null);
