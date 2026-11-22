'use strict';
// Candidate-only ECRL GeoJSON evidence gate. Never draw or publish a rejected alignment.
// GeoJSON positions are [longitude, latitude] in WGS84. Chainage is metres.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const distanceMetres=(a,b)=>{const rad=x=>x*Math.PI/180,R=6371000,dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]);const h=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));};
const validPoint=p=>Array.isArray(p)&&(p.length===2||p.length===3)&&p.every(finite)&&p[0]>=99.5&&p[0]<=104.8&&p[1]>=1&&p[1]<=7.5;
function validateAlignment(featureCollection){
 const errors=[];
 if(!featureCollection||featureCollection.type!=='FeatureCollection'||!Array.isArray(featureCollection.features))return {status:'REJECTED',errors:['Expected GeoJSON FeatureCollection'],segments:0};
 const meta=featureCollection.metadata||{};
 if(meta.crs!=='EPSG:4326')errors.push('Explicit EPSG:4326 CRS required');
 if(typeof meta.source!=='string'||!meta.source.trim())errors.push('Source provenance required');
 if(typeof meta.license!=='string'||!meta.license.trim())errors.push('Source license required');
 if(typeof meta.accuracyMetres!=='number'||!finite(meta.accuracyMetres)||meta.accuracyMetres<=0)errors.push('Positive source accuracyMetres required');
 if(meta.approvedForUse!==true)errors.push('Explicit approvedForUse=true required');
 const segments=[];
 for(const [index,feature] of featureCollection.features.entries()){
  if(feature?.type!=='Feature'||feature.geometry?.type!=='LineString'){
   errors.push('Feature '+index+': LineString required');continue;
  }
  const coords=feature.geometry.coordinates;
  if(!Array.isArray(coords)||coords.length<2||coords.some(p=>!validPoint(p))){
   errors.push('Feature '+index+': invalid WGS84 ECRL coordinates');continue;
  }
  const p=feature.properties||{},start=p.chainageStartMetres,end=p.chainageEndMetres;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start){
   errors.push('Feature '+index+': monotonic integer chainage metres required');continue;
  }
  if(coords.every((point,i)=>i===0||point[0]===coords[0][0]&&point[1]===coords[0][1]))errors.push('Feature '+index+': degenerate line');
  if(coords.slice(1).some((point,i)=>point[0]===coords[i][0]&&point[1]===coords[i][1]))errors.push('Feature '+index+': repeated adjacent coordinate');
  const straightMetres=distanceMetres(coords[0],coords[coords.length-1]);
  if(straightMetres>(end-start)+Math.max(10,meta.accuracyMetres||0))errors.push('Feature '+index+': geographic endpoint separation exceeds chainage span');
  const lineMetres=coords.slice(1).reduce((sum,point,i)=>sum+distanceMetres(coords[i],point),0);
  if(lineMetres>(end-start)+Math.max(10,meta.accuracyMetres||0))errors.push('Feature '+index+': polyline distance exceeds chainage span');
  segments.push({start,end,coords,index});
 }
 segments.sort((a,b)=>a.start-b.start);
 const close=(a,b)=>distanceMetres(a,b)<=Math.min(1,meta.accuracyMetres||1);
 for(let i=1;i<segments.length;i++){
  const a=segments[i-1],b=segments[i];
  if(a.end!==b.start)errors.push('Chainage gap/overlap between features '+a.index+' and '+b.index);
  if(!close(a.coords[a.coords.length-1],b.coords[0]))errors.push('Coordinate discontinuity between features '+a.index+' and '+b.index);
 }
 if(segments.length===0)errors.push('No valid line segments');
 return {status:errors.length?'REJECTED':'CANDIDATE_ONLY',errors,segments:segments.length,
  coverageMetres:segments.length?[segments[0].start,segments[segments.length-1].end]:null};
}
module.exports={validateAlignment};
