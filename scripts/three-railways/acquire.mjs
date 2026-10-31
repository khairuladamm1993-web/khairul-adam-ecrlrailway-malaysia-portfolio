// Optional read-only refresh. Uses the OSM map API (Overpass was unavailable).
// Refresh is a source candidate: rerun extract-osm.py and review hashes/geometry.
import fs from 'node:fs/promises';
const dir='artifacts/three-railways-source';await fs.mkdir(dir,{recursive:true});
for(const [name,bbox] of [['sentosa','103.812,1.248,103.826,1.269'],['changi','103.978,1.347,103.995,1.369']]){
 const source='https://api.openstreetmap.org/api/0.6/map?bbox='+bbox;
 const r=await fetch(source,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(name+' HTTP '+r.status);
 const xml=await r.text();if(!xml.includes('<osm'))throw Error('SOURCE_NOT_OSM_XML');
 await fs.writeFile(`${dir}/${name}-osm.xml`,xml);console.log(name,'source XML bytes',Buffer.byteLength(xml));
}
