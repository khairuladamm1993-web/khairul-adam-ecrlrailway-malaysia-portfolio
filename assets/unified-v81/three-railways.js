/* Source-preserving Singapore extension. No service-order interpolation. */
(function(root){'use strict';
const SENTOSA='https://www.sentosa.com.sg/en/faqs';
const CHANGI='https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html';
const MANUAL='https://www.changiairport.com/content/dam/changiairport/sg/corporate/evergreen/resources/forms-and-manuals/documents/aos-manual-rev-34-effective-27-november-2025.pdf';
const SPECS=[['SENTOSA','SG-SENTOSA-VVC',12844038341,'VivoCity'],['SENTOSA','SG-SENTOSA-RWS',1316097199,'Resorts World'],['SENTOSA','SG-SENTOSA-IMB',1316098766,'Imbiah'],['SENTOSA','SG-SENTOSA-BEA',6589739733,'Beach'],['CHANGI_APM','SG-CHANGI-T1',6532304174,'Terminal 1'],['CHANGI_APM','SG-CHANGI-T2',6532304181,'Terminal 2'],['CHANGI_APM','SG-CHANGI-T3',6532304169,'Terminal 3']];
const COPY={
 ms:{areas:'Kawasan Public dan Transit berasingan. Akses Transit tertakluk kepada imigresen dan kelayakan penumpang.',point:'Penanda rujukan terminal pada nod OSM; bukan setiap platform Skytrain.',noJewel:'Terminal 4 menggunakan bas; Jewel bukan stesen Skytrain.',track:'Guideway OSM · bukan ukur as-built. Kawasan akses setiap way: UNKNOWN.'},
 en:{areas:'Public and Transit areas are separate. Transit access depends on immigration and passenger eligibility.',point:'Terminal reference marker at an OSM node; not every Skytrain platform.',noJewel:'Terminal 4 uses buses; Jewel is not a Skytrain station.',track:'OSM guideway · not an as-built survey. Access area of each way: UNKNOWN.'},
 zh:{areas:'公共区与中转区分开；中转区通行取决于入境手续及旅客资格。',point:'航站楼参考标记位于 OSM 节点，并非每个 Skytrain 站台。',noJewel:'第四航站楼使用接驳巴士；星耀樟宜没有 Skytrain 车站。',track:'OSM 导轨，非竣工测量；各路段通行区域：UNKNOWN。'},
 th:{areas:'พื้นที่สาธารณะและพื้นที่เปลี่ยนเครื่องแยกกัน การเข้าพื้นที่เปลี่ยนเครื่องขึ้นกับการตรวจคนเข้าเมืองและสิทธิ์ผู้โดยสาร',point:'หมุดอ้างอิงอาคารผู้โดยสารจากโหนด OSM ไม่ใช่ทุกชานชาลา Skytrain',noJewel:'อาคาร 4 ใช้รถรับส่ง Jewel ไม่ใช่สถานี Skytrain',track:'รางนำทาง OSM ไม่ใช่ผลสำรวจจริง พื้นที่เข้าถึงแต่ละช่วง: UNKNOWN'}
};
function create(raws,geometry){
 const byRoute=new Map(raws.map((raw,i)=>[i===0?'SENTOSA':'CHANGI_APM',raw]));
 const points=SPECS.map(([rid,id,nodeId,name])=>{const raw=byRoute.get(rid),n=raw.elements.find(n=>n.type==='node'&&n.id===nodeId);if(!n)throw Error('MISSING_SOURCE_NODE:'+id);
  return {type:'Feature',geometry:{type:'Point',coordinates:[n.lon,n.lat]},properties:{stationId:id,stationName:name,routeIds:[rid],status:'OPERATIONAL',sourceUrl:'https://www.openstreetmap.org/node/'+nodeId,confidence:'OSM_REFERENCE_NOT_SURVEYED',sourceDate:raw.sourceDate,osmNodeId:nodeId,referenceKind:rid==='CHANGI_APM'?'TERMINAL_REFERENCE_NOT_ALL_PLATFORMS':'OSM_STATION_NODE'}};
 });
 const parts=raws.map((raw,i)=>{const net=geometry.fromOSM(raw,raw.sourceDate);for(const s of net.segments){s.routeIds=[i===0?'sg-SENTOSA':'sg-CHANGI_APM'];s.accessArea='UNKNOWN';s.operationalStatus='OSM_REFERENCE_NOT_OPERATIONAL_AUTHORITY';}return net});
 const nodes=[...new Map(parts.flatMap(n=>n.nodes).map(n=>[n.id,n])).values()],segments=parts.flatMap(n=>n.segments);
 geometry.validate({nodes,segments});
 function apply(sg){
  for(const f of points)sg.stationById.set(f.properties.stationId,f);
  for(const r of sg.routes().filter(r=>['SENTOSA','CHANGI_APM'].includes(r.sgId))){
   r.source=r.sgId==='SENTOSA'?SENTOSA:CHANGI;r.expected=r.sgId==='SENTOSA'?4:3;
   for(const s of r.stops){const f=sg.stationById.get(s.id);s.name=f.properties.stationName;}
   if(r.sgId==='CHANGI_APM'){
    const links=[['T1','T2'],['T1','T3'],['T2','T3']];
    r.paths=['PUBLIC','TRANSIT'].flatMap(area=>links.map(([from,to])=>({pathId:`SKYTRAIN_${area}_${from}_${to}`,label:`${area==='PUBLIC'?'Public':'Transit'} · ${from} ↔ ${to}`,accessArea:area,orderedStationIds:['SG-CHANGI-'+from,'SG-CHANGI-'+to],terminalIds:['SG-CHANGI-'+from,'SG-CHANGI-'+to],operatingStatus:'OPERATIONAL',bidirectional:true,connectionType:'TERMINAL_CONNECTIVITY_NOT_PLATFORM_SERVICE',geometryVerification:'SERVICE_TOPOLOGY_NOT_TRACK_SURVEY',sourceUrl:CHANGI})));
    r.topologyStatus='PARTIAL_PLATFORM_SERVICE_PATTERN_UNKNOWN';
   }
  }
  // Explicit documented walking transfer, never a physical railway junction.
  for(const other of ['SG-CC29','SG-NE1'])sg.topology.interchanges.push({stationId:'SG-SENTOSA-VVC',connectingStationId:other,connectingRouteIds:[other==='SG-CC29'?'CCL':'NEL'],connectionType:'PASSENGER_TRANSFER',sourceUrl:'https://www.rwsentosa.com/en/about/getting-here'});
 }
 return {points,nodes,segments,apply,copy:locale=>COPY[locale]||COPY.en,sources:{sentosa:SENTOSA,changi:CHANGI,guideway:MANUAL},status:'PARTIAL_OSM_NOT_AS_BUILT'};
}
async function load(geometry){const raws=await Promise.all(['sentosa','changi'].map(async n=>{const r=await fetch('./data/unified-v81-integration/'+n+'-osm.json');if(!r.ok)throw Error('INTEGRATION_HTTP_'+r.status);return r.json()}));return create(raws,geometry)}
const api={create,load,SPECS,COPY};if(typeof module==='object')module.exports=api;if(root)root.MRS10ThreeRailways=api;
})(typeof window!=='undefined'?window:null);
