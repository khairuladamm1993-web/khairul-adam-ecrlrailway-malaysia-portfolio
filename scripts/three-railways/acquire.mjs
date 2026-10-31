// Read-only public OSM acquisition. Raw source is preserved; no guessed positions.
import fs from 'node:fs/promises';
const dir='artifacts/three-railways-source';await fs.mkdir(dir,{recursive:true});
for(const [name,bbox,rail] of [['sentosa','1.248,103.812,1.269,103.826','monorail'],['changi','1.345,103.975,1.369,103.996','people_mover|monorail|light_rail']]){
 const query=`[out:json][timeout:90];(way[railway~"^(${rail})$"](${bbox});nwr[railway~"station|halt|stop"](${bbox}););(._;>;);out body;`;
 let raw;for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
  try{const res=await fetch(endpoint,{method:'POST',body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(110000)});if(!res.ok)throw Error('HTTP '+res.status);raw=await res.json();if(!raw.elements?.length)throw Error('EMPTY');break}catch(e){console.log(name,endpoint,e.message)}
 }
 if(!raw)throw Error('SOURCE_ACQUISITION_FAILED '+name);
 await fs.writeFile(`${dir}/${name}-osm.json`,JSON.stringify({...raw,acquiredAt:new Date().toISOString(),query}));
 console.log(name,'elements',raw.elements.length,'ways',raw.elements.filter(e=>e.type==='way').length);
}
