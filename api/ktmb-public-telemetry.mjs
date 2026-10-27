/* Read-only KTMB public GTFS-RT source capability probe; not signalling or speed authorities. */
const ORIGIN='https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb';
function varint(b,p,end){let x=0,k=1,i=p;for(let n=0;n<10;n++){if(i>=end)throw Error('TRUNCATED_VARINT');const c=b[i++];x+=(c&127)*k;if(!(c&128)){if(!Number.isSafeInteger(x))throw Error('UNSAFE_VARINT');return [x,i]}k*=128}throw Error('VARINT_OVERFLOW')}
function scan(b,start,end,fn){let i=start,parts=0;while(i<end){if(++parts>50000)throw Error('FIELD_LIMIT');let tag;[tag,i]=varint(b,i,end);const field=tag>>>3,wire=tag&7;if(field<1)throw Error('BAD_FIELD');let p=i,q=i,value=null;if(wire===2){let len;[len,i]=varint(b,i,end);p=i;q=p+len;if(q>end)throw Error('BAD_LENGTH');i=q}
else if(wire===0){[value,i]=varint(b,i,end);q=i}
else if(wire===5){q=i+4;if(q>end)throw Error('BAD_FLOAT');i=q}
else if(wire===1){q=i+8;if(q>end)throw Error('BAD_DOUBLE');i=q}
else throw Error('UNSUPPORTED_WIRE');
fn(field,wire,p,q,value);
}}
export function decodePublicSummary(binary,now=Date.now()){
 const b=Buffer.isBuffer(binary)?binary:Buffer.from(binary);
 if(b.length<3||b.length>4000000)throw Error('BAD_FEED_SIZE');
 let feedTimestamp=null,vehicles=0,withSpeed=0,latestVehicle=null;
 scan(b,0,b.length,(f,w,a,z)=>{
  if(f===1&&w===2)scan(b,a,z,(field,wt,_,__,v)=>{if(field===3&&wt===0)feedTimestamp=v});
  if(f!==2||w!==2)return;
  scan(b,a,z,(field,wt,x,y)=>{
   if(field!==4||wt!==2)return;
   vehicles++;
   if(vehicles>3000)throw Error('VEHICLE_LIMIT');
   scan(b,x,y,(vfield,vwire,u,v,num)=>{
    if(vfield===5&&vwire===0)latestVehicle=Math.max(latestVehicle||0,num);
    if(vfield===2&&vwire===2)scan(b,u,v,(pf,pw,fp)=>{
     if(pf===5&&pw===5){
      const speed=b.readFloatLE(fp);
      if(Number.isFinite(speed)&&speed>=0&&speed<=120)withSpeed++;
     }
    });
   });
  });
 });
 const time=Number(feedTimestamp||latestVehicle||0)*1000;
 const age=now-time;
 return {
  status:time>0&&age>=-30000&&age<=180000?'CONNECTED':'STALE',
  source:'KTMB_OFFICIAL_GTFS_REALTIME_VEHICLE_POSITION',sourceUrl:ORIGIN,
  feedTimestampUtc:time>0&&Number.isFinite(time)?new Date(time).toISOString():null,
  reportedVehicles:vehicles,withObservedSpeed:withSpeed,
  stationApproachSpeed:{status:'NOT_PUBLISHED',valueKmh:null},
  stationThroughSpeed:{status:'NOT_PUBLISHED',valueKmh:null},
  temporarySpeedRestriction:{status:'NOT_PUBLISHED',valueKmh:null},
  note:'Observational vehicle speed != design speed, line speed, permitted approach/through speed or TSR.'
 };
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=90, stale-while-revalidate=10');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end(JSON.stringify({status:'METHOD_NOT_ALLOWED'}))}
 try{
  const r=await fetch(ORIGIN,{headers:{'Accept':'application/x-protobuf, application/octet-stream'},
   signal:AbortSignal.timeout(6000),redirect:'error'});
  if(!r.ok)throw Error('UPSTREAM_STATUS_'+r.status);
  const size=Number(r.headers.get('content-length')||0);if(size>4000000)throw Error('OVERSIZE');
  const b=Buffer.from(await r.arrayBuffer());
  const result=decodePublicSummary(b);
  return res.end(JSON.stringify(result));
 }catch(e){
  res.statusCode=503;
  return res.end(JSON.stringify({status:'UNAVAILABLE',source:'KTMB_OFFICIAL_GTFS_REALTIME_VEHICLE_POSITION',
    sourceUrl:ORIGIN,feedTimestampUtc:null,reportedVehicles:null,withObservedSpeed:null,
    stationApproachSpeed:{status:'NOT_PUBLISHED',valueKmh:null},
    stationThroughSpeed:{status:'NOT_PUBLISHED',valueKmh:null},
    temporarySpeedRestriction:{status:'NOT_PUBLISHED',valueKmh:null},
    error:'PUBLIC_FEED_UNAVAILABLE',note:'No substitute inferred speeds; retry later.'}));
 }
}
