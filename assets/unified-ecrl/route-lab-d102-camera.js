/* MR-S10 D102 Visual Camera R1.4. All camera follow motion is constrained
   to validated SIMULATION railway geometry, never raster pixel interpolation.
   Without vector geometry, camera may jump to exact registered STN checkpoint
   public locality references only. This does not imply physical train GPS. */
(function(root){'use strict';
const refs=root.MRS10ECRLStationIntelligence,checks=root.MRS10ECRLChainage?.records||[];
let map=null,view='2d',follow=true,mode='WAITING_FOR_MAP',lastCH=null,lastModelPosition=null;
const label={ms:{top:'2D · Pandangan Atas',oblique:'3D · Perspektif',follow:'Ikut D102',reference:'Kamera di stesen rujukan · bukan lokasi tren sebenar',locked:'Jejak geografi D102 terkunci · menunggu geometri rel vektor',vector:'Mengikuti kedudukan D102 pada model rel (bukan GPS sebenar)'},
en:{top:'2D · Top Down',oblique:'3D · Perspective',follow:'Follow D102',reference:'Camera at locality reference, not actual train position',locked:'D102 geographic follow locked pending rail vectors',vector:'Following D102 on rail model (not real GPS)'}};
function t(){return label[root.document.documentElement.lang==='en'?'en':'ms'}
function render(){const x=t();
 for(const [id,active,text] of [['lab-camera-2d',view==='2d',x.top],['lab-camera-3d',view==='3d',x.oblique],['lab-camera-follow',follow,x.follow]]){const b=document.getElementById(id);if(b){b.textContent=text;b.setAttribute('aria-pressed',String(active))}}
 const status=document.getElementById('lab-camera-status');if(status){status.textContent=mode==='VECTOR_FOLLOW'?x.vector:mode==='STATION_REFERENCE'?x.reference:x.locked;status.dataset.mode=mode}}
function angle(){return view==='2d'?0:52}
function setView(next){if(!['2d','3d'].includes(next))throw Error('INVALID_CAMERA_VIEW');view=next;if(map?.getStyle?.())map.easeTo({pitch:angle(),bearing:0,duration:500});render()}
function setFollow(enabled){follow=!!enabled;if(!follow)mode='MANUAL_CAMERA';render();return follow}
function sync({CH,simulationPosition}={}){
 if(!map||!follow||!Number.isInteger(CH))return;
 const valid=Array.isArray(simulationPosition)&&simulationPosition.length===2&&
 simulationPosition.every(Number.isFinite)&&simulationPosition[0]>99&&simulationPosition[0]<105&&simulationPosition[1]>1&&simulationPosition[1]<7;
 if(valid){
  mode='VECTOR_FOLLOW';
  if(lastCH!==CH||!lastModelPosition||lastModelPosition.some((v,i)=>v!==simulationPosition[i]))
   map.easeTo({center:simulationPosition,zoom:Math.max(12.5,map.getZoom?.()||12.5),pitch:angle(),bearing:0,duration:600});
  lastCH=CH;lastModelPosition=[...simulationPosition];render();return;
 }
 lastModelPosition=null;
 const control=checks.find(x=>x.metres===CH&&x.code.startsWith('STN'));
 const p=control?refs?.getStation(control.code)?.referencePoint:null;
 if(p?.length===2){
  mode='STATION_REFERENCE';
  if(lastCH!==CH)map.easeTo({center:p,zoom:Math.max(9.5,Math.min(map.getZoom?.()||10,11)),pitch:angle(),bearing:0,duration:450});
 }else mode='WAITING_FOR_RAIL_VECTOR';
 lastCH=CH;render();
}
function connect(m){map=m;const buttons=[['lab-camera-2d',()=>setView('2d')],['lab-camera-3d',()=>setView('3d')],['lab-camera-follow',()=>setFollow(!follow)]];
 for(const [id,fn] of buttons){const b=document.getElementById(id);if(b)b.addEventListener('click',fn)}
 const reset=()=>{if(map.getStyle?.())map.setPitch(angle())};
 m.on('load',reset);render();
}
const api=Object.freeze({connect,sync,setView,setFollow,snapshot:()=>({view,follow,mode,CH:lastCH,hasVerifiedGeographicSimulationPosition:mode==='VECTOR_FOLLOW',realTimeGPS:false,terrain3D:false,rendering:view==='3d'?'TILTED_2_5D_MAP':'TOP_DOWN_2D_MAP'})});
root.MRS10D102Camera=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
