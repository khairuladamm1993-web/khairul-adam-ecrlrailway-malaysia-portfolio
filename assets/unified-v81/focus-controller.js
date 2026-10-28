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
function tapTracker(){
 const active=new Set();let first=null;
 return {down(e){active.add(e.pointerId);first=active.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp}:null},move(e){if(first&&Math.hypot(e.clientX-first.x,e.clientY-first.y)>10)first=null},cancel(e){active.delete(e.pointerId);first=null},up(e){active.delete(e.pointerId);const hit=first&&first.id===e.pointerId&&active.size===0&&e.timeStamp-first.t<800&&Math.hypot(e.clientX-first.x,e.clientY-first.y)<=10;first=null;return !!hit}};
}
const api={create,component,tapTracker};if(typeof module==='object')module.exports=api;if(root)root.MRS10V81Focus=api;
})(typeof window!=='undefined'?window:null);
