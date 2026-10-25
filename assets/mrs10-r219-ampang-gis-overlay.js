/* P01 R2.19: defensive live ArcGIS Ampang POI overlay. No authored coordinates.
 * A GIS candidate is NOT a survey-certified station, track or turnout.
 */
(function(root){
 'use strict';
 let active=null;
 function attach({map,service,lib,locale,region}){
  const gis=root.MRS10AmpangGISR219,status=document.getElementById('r219-gis-status');
  if(!gis||!service?.validate?.()||!map||!status)return;
  let result=null,loading=null,geoVisible=true,alreadyFit=false;
  const label=()=>{
   const lang=locale?.value||'ms',count=result?.matched||0;
   if(!result){
    status.textContent=lang==='ms'?'GIS: Menunggu padanan koordinat sumber; tiada titik rekaan.':
     lang==='en'?'GIS: Awaiting source coordinates; no fabricated markers.':
     lang==='zh'?'GIS：等待来源坐标核实；不创建虚构标记。':'GIS: กำลังรอพิกัดแหล่งข้อมูล; ไม่มีหมุดสมมติ';
    return;
   }
   const part=lang==='ms'?count+'/18 stesen dipadankan daripada GIS awam (bukan pengukuran operasi)':
    lang==='zh'?count+'/18 个车站来自公共 GIS 匹配（非运营测绘）':
    lang==='th'?count+'/18 จุดสถานีจาก GIS สาธารณะ (ไม่ใช่การสำรวจเพื่อปฏิบัติการ)':
    count+'/18 stations matched to public GIS references (not operational survey)';
   status.textContent=part+(result.missing?' · '+result.missing+' unmatched':'');
  };
  function render(){
   if(!map?.getStyle?.()?.sources)return;
   const sourceId='r219-ampang-gis-source',points='r219-ampang-gis-points',names='r219-ampang-gis-names';
   const data=gis.toFeatureCollection(result);
   try{
    if(!map.getSource(sourceId))map.addSource(sourceId,{type:'geojson',data});
    else map.getSource(sourceId).setData(data);
    if(!map.getLayer(points))map.addLayer({id:points,type:'circle',source:sourceId,
      paint:{'circle-color':'#A65100','circle-radius':7,'circle-stroke-color':'#ffffff',
       'circle-stroke-width':2}});
    if(!map.getLayer(names))map.addLayer({id:names,type:'symbol',source:sourceId,
      layout:{'text-field':['get','code'],'text-size':11,'text-offset':[0,1.25],
       'text-allow-overlap':false},
      paint:{'text-color':'#A65100','text-halo-color':'#ffffff','text-halo-width':1.5}});
    for(const id of [points,names])
     map.setLayoutProperty(id,'visibility',geoVisible?'visible':'none');
   }catch(e){
    status.textContent='GIS source matched but map layer failed / Lapisan GIS gagal';
   }
  }
  function toggle(next){
   geoVisible=next==='malaysia';
   if(active){active.remove();active=null}
   render();
  }
  function at(e){
   if(!geoVisible||!result?.data?.length||!map.getLayer('r219-ampang-gis-points'))return false;
   const p=e.point,b=[[p.x-12,p.y-12],[p.x+12,p.y+12]];
   let hit;
   try{hit=(map.queryRenderedFeatures(b,{layers:['r219-ampang-gis-points']})||[])[0]}catch{return false}
   if(!hit)return false;
   const s=result.data.find(x=>x.id===hit.properties?.stationId);
   if(!s)return false;
   const lng=locale?.value||'ms',rootEl=document.createElement('div');
   rootEl.className='r219-popup';
   const heading=document.createElement('strong');heading.textContent=s.code+' · '+s.name;rootEl.append(heading);
   const message=document.createElement('p');
   message.textContent=lng==='ms'?'Sumber titik: GIS awam · BUKAN koordinat operasi/ukur':
    lng==='zh'?'公共 GIS 位置来源 · 非运营测绘坐标':
    lng==='th'?'พิกัดจาก GIS สาธารณะ · ไม่ใช่พิกัดสำรวจเพื่อปฏิบัติการ':
    'Source location: public GIS · NOT operational/survey coordinates';
   rootEl.append(message);
   if(s.sharedPassengerService){
    const shared=document.createElement('p');
    shared.textContent='Ampang + Sri Petaling · shared passenger-service stop';
    rootEl.append(shared);
   }
   const link=document.createElement('a');link.href=gis.sourceUrl;link.textContent='GIS source / Sumber';link.target='_blank';link.rel='noopener noreferrer';
   rootEl.append(link);
   if(active)active.remove();
   active=new lib.Popup({offset:14,maxWidth:'255px'}).setLngLat(s.coordinates).setDOMContent(rootEl).addTo(map);
   return true;
  }
  async function load(){
   if(loading)return loading;
   loading=(async()=>{
    try{
     const response=await fetch(gis.requestUrl,{credentials:'omit',mode:'cors'});
     if(!response.ok)throw new Error('HTTP '+response.status);
     const payload=await response.json();
     if(payload?.error||!Array.isArray(payload?.features))throw new Error('UNEXPECTED_GIS_RESPONSE');
     result=gis.decode(payload.features,service);
     if(!result.ok)throw new Error(result.reason);
     render();label();
     if(result.data.length&&!alreadyFit&&region()==='malaysia'){
      alreadyFit=true;
      const x=result.data.map(r=>r.coordinates[0]),y=result.data.map(r=>r.coordinates[1]);
      map.fitBounds([[Math.min(...x),Math.min(...y)],[Math.max(...x),Math.max(...y)]],
       {padding:56,maxZoom:12.7,duration:550});
     }
    }catch(e){
     result=null;
     status.textContent='GIS source unavailable / GIS tidak boleh dicapai; lokasi belum dipaparkan.';
     render();
    }
   })();
   return loading;
  }
  map.on('style.load',()=>{render();void load()});
  locale?.addEventListener('change',label);
  root.MRS10AmpangGISOverlay=Object.freeze({at,toggle,sourceStatus:()=>result?.matched||0});
  void load();
 }
 root.MRS10AmpangGISOverlay=Object.freeze({attach});
})(typeof window!=='undefined'?window:null);
