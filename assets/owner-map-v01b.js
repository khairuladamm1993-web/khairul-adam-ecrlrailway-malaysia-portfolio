/* MR-S10 V0.1B — Owner-only IN-MEMORY proposal review. No publish, network writes, storage or analytics. */
(function(root){
'use strict';
if(root.RailwayOwnerMapV01B)return;
var S=null;
function eligible(){return Boolean(root.RailwayAccess&&root.RailwayAccess.canAdmin)}
function valid(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=-90&&x<=90&&y>=-180&&y<=180&&!(x===0&&y===0)}
function clean(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dist(a,b){if(!a||!b)return null;var r=Math.PI/180,p=(b.lat-a.lat)*r,q=(b.lon-a.lon)*r,h=Math.sin(p/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(q/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))}
function markerStyle(color){return S.ctx.leaflet.divIcon({className:'railway-map-divicon',html:'<span style="display:block;background:'+color+';border:3px solid #fff;border-radius:50%;width:18px;height:18px"></span>',iconSize:[20,20],iconAnchor:[10,10]})}
function resetMarkers(){var a=S;if(!a)return;['currentPin','proposalPin','gpsPin','gpsCircle'].forEach(function(k){try{if(a[k])a[k].remove()}catch(e){}a[k]=null})}
function clear(){if(!S)return;resetMarkers();S.gps=null;S=null}
function refreshMap(){var a=S;if(!a)return;var l=a.ctx.leaflet,m=a.ctx.map;
if(!a.currentPin)a.currentPin=l.marker([a.current.lat,a.current.lon],{icon:markerStyle('#64748b'),interactive:false}).addTo(m).bindTooltip('CURRENT immutable');
if(!a.proposalPin){a.proposalPin=l.marker([a.proposed.lat,a.proposed.lon],{icon:markerStyle('#eab308'),draggable:true}).addTo(m).bindTooltip('PROPOSED draggable');a.proposalPin.on('dragend',function(){var x=a.proposalPin.getLatLng();move(x.lat,x.lng)})}else a.proposalPin.setLatLng([a.proposed.lat,a.proposed.lon]);
try{if(a.gpsPin)a.gpsPin.remove();if(a.gpsCircle)a.gpsCircle.remove()}catch(e){}a.gpsPin=a.gpsCircle=null;
if(a.gps){a.gpsPin=l.marker([a.gps.lat,a.gps.lon],{icon:markerStyle('#2563eb'),interactive:false}).addTo(m);if(a.gps.accuracy!=null)a.gpsCircle=l.circle([a.gps.lat,a.gps.lon],{radius:a.gps.accuracy,color:'#2563eb',fillOpacity:.08,interactive:false}).addTo(m)}
}
function move(lat,lon){var a=S;lat=Number(lat);lon=Number(lon);if(!a||!eligible()||!valid(lat,lon))return false;a.undo.push({lat:a.proposed.lat,lon:a.proposed.lon});if(a.undo.length>50)a.undo.shift();a.proposed={lat:lat,lon:lon};refreshMap();draw();return true}
function draw(){var a=S;if(!a)return;if(!eligible()){clear();return}
var f=function(p){return p?Number(p).toFixed(1)+' m straight-line':'0 m straight-line'};
a.slot.innerHTML='<section class="owner-review" data-v01b><h4>V0.1B · Owner Mock Review</h4><p>'+clean(a.code+' · '+a.name+' · '+a.chainage)+'</p><p>Review only. All proposal records are temporary; no canonical location is changed.</p>'+
'<p><strong>CURRENT</strong>: '+a.current.lat.toFixed(6)+', '+a.current.lon.toFixed(6)+'</p><p><strong>PROPOSED</strong>: '+a.proposed.lat.toFixed(6)+', '+a.proposed.lon.toFixed(6)+'</p><p><strong>GPS</strong>: '+(a.gps?(a.gps.lat.toFixed(6)+', '+a.gps.lon.toFixed(6)+' · reported accuracy ±'+(a.gps.accuracy==null?'unknown':a.gps.accuracy.toFixed(1)+' m')):'not requested')+'</p><p>Current → Proposed: '+f(dist(a.current,a.proposed))+'; GPS → Proposed: '+(a.gps?f(dist(a.gps,a.proposed)):'—')+'</p>'+
'<label>Latitude<input data-v-lat type="number" step="0.000001" value="'+a.proposed.lat.toFixed(6)+'"></label><label>Longitude<input data-v-lon type="number" step="0.000001" value="'+a.proposed.lon.toFixed(6)+'"></label><div class="owner-map-actions"><button data-v-apply type="button">APPLY</button><button data-v-undo type="button">UNDO</button><button data-v-reset type="button">RESET</button></div>'+
'<div class="owner-map-actions"><button data-v-gps type="button">VERIFY MY LOCATION</button><button data-v-gpsclear type="button">CLEAR GPS</button></div><p role="status">'+clean(a.status)+'</p>'+
'<label>Evidence<select data-v-evidence>'+['OWNER_FIELD_OBSERVATION','PUBLIC_REFERENCE','SOURCE_BASED_ESTIMATE','PENDING_VALIDATION'].map(function(x){return '<option'+(x===a.evidence?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label>'+
'<label>Observation<textarea data-v-note maxlength="500">'+clean(a.note)+'</textarea></label><div class="owner-map-actions"><button data-v-save type="button">SAVE PROPOSAL (MOCK)</button><button data-v-approve type="button">APPROVE</button><button data-v-reject type="button">REJECT</button><button data-v-review type="button">NEEDS REVIEW</button></div><p>Mock saved: '+a.saved.length+' · Mock review events: '+a.reviews.length+'. APPROVE = OWNER_REVIEWED, never SURVEY_VERIFIED.</p><button data-v-close type="button">CLOSE MOCK EDITOR</button></section>';
function q(x){return a.slot.querySelector('[data-v-'+x+']')}
function read(){a.note=q('note').value.slice(0,500);a.evidence=q('evidence').value}
q('apply').onclick=function(){if(!move(Number(q('lat').value),Number(q('lon').value))){a.status='Invalid coordinates';draw()}};
q('undo').onclick=function(){if(!eligible()){clear();return}var p=a.undo.pop();if(p)a.proposed=p;refreshMap();draw()};
q('reset').onclick=function(){if(!eligible()){clear();return}a.undo.push({lat:a.proposed.lat,lon:a.proposed.lon});a.proposed={lat:a.current.lat,lon:a.current.lon};refreshMap();draw()};
q('gps').onclick=function(){if(!navigator.geolocation){a.status='Geolocation unavailable';draw();return}a.status='Requesting one-time GPS location';draw();navigator.geolocation.getCurrentPosition(function(p){if(S!==a||!eligible())return;var c=p.coords;if(!valid(c.latitude,c.longitude))return;a.gps={lat:c.latitude,lon:c.longitude,accuracy:Number.isFinite(c.accuracy)&&c.accuracy>=0?c.accuracy:null};a.status='GPS reported accuracy: '+(a.gps.accuracy==null?'unavailable':a.gps.accuracy.toFixed(1)+' m')+'; not survey-grade';refreshMap();draw()},function(){if(S!==a)return;a.status='GPS denied/unavailable; manual editing remains available';draw()},{maximumAge:0,enableHighAccuracy:true,timeout:15000})};
q('gpsclear').onclick=function(){if(!eligible()){clear();return}a.gps=null;a.status='GPS cleared';refreshMap();draw()};
q('save').onclick=function(){if(!eligible()){clear();return}read();if(!a.note.trim()){a.status='Observation note required';draw();return}a.saved.push({proposal:{lat:a.proposed.lat,lon:a.proposed.lon},evidence:a.evidence,note:a.note,version:a.saved.length+1});a.status='Mock proposal saved in memory';draw()};
[['approve','APPROVE'],['reject','REJECT'],['review','NEEDS_REVIEW']].forEach(function(pair){q(pair[0]).onclick=function(){if(!eligible()){clear();return}read();if(!a.saved.length){a.status='Save mock proposal before review';draw();return}a.reviews.push({proposalVersion:a.saved.length,decision:pair[1],confidence:pair[1]==='APPROVE'?'OWNER_REVIEWED':'UNVERIFIED',timestamp:new Date().toISOString(),gpsAccuracyBand:a.gps&&a.gps.accuracy!=null?(a.gps.accuracy<=30?'UP_TO_30M':'OVER_30M'):'UNKNOWN'});a.status='Mock review recorded. No publication';draw()}});
q('close').onclick=function(){var cb=a.onClose;clear();a.slot.replaceChildren();if(cb)cb()};
}
function mount(ctx,slot,onClose){if(!eligible()||!ctx||!ctx.getSelected||!ctx.leaflet||!ctx.map||!slot)return false;var r=ctx.getSelected(),lat=Number(r&&r.lat),lon=Number(r&&r.lon);if(!r||!valid(lat,lon))return false;clear();S={ctx:ctx,slot:slot,onClose:onClose,code:(r.overlay&&r.overlay.code)||r.id,name:r.name,chainage:(r.overlay&&r.overlay.chainage)||'—',current:Object.freeze({lat:lat,lon:lon}),proposed:{lat:lat,lon:lon},undo:[],gps:null,evidence:'PENDING_VALIDATION',note:'',saved:[],reviews:[],status:'GPS not requested'};refreshMap();draw();return true}
root.RailwayOwnerMapV01B=Object.freeze({mount:mount,unmount:clear,get active(){return Boolean(S)}});
})(window);
