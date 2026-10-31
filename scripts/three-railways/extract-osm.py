"""Filter public OSM API XML into reproducible railway source snapshots.
Usage: python3 ... sentosa.xml changi.xml. Never infer nodes or station coordinates.
"""
import sys,json,xml.etree.ElementTree as E,hashlib,pathlib
out=pathlib.Path('data/unified-v81-integration');out.mkdir(exist_ok=True)
for name,p,bbox in [('sentosa',sys.argv[1],(103.812,1.248,103.826,1.269)),('changi',sys.argv[2],(103.978,1.347,103.995,1.369))]:
 r=E.parse(p).getroot();nodes={int(n.attrib['id']):n for n in r.findall('node')};tags=lambda n:{a.attrib['k']:a.attrib['v'] for a in n.findall('tag')}
 within=lambda n:bbox[0]<=float(n.attrib['lon'])<=bbox[2] and bbox[1]<=float(n.attrib['lat'])<=bbox[3]
 ways=[]
 for w in r.findall('way'):
  t=tags(w);ids=[int(n.attrib['ref']) for n in w.findall('nd')]
  if t.get('railway')!='monorail' or not all(i in nodes and within(nodes[i]) for i in ids):continue
  ways.append(dict(type='way',id=int(w.attrib['id']),version=int(w.attrib['version']),timestamp=w.attrib['timestamp'],nodes=ids,tags=t))
 ids={i for w in ways for i in w['nodes']}
 ids.update(i for i,n in nodes.items() if within(n) and tags(n).get('monorail')=='yes' and tags(n).get('railway') in ['station','stop'])
 ns=[dict(type='node',id=i,lat=float(nodes[i].attrib['lat']),lon=float(nodes[i].attrib['lon']),version=int(nodes[i].attrib['version']),timestamp=nodes[i].attrib['timestamp'],tags=tags(nodes[i])) for i in sorted(ids)]
 data=dict(sourceUrl='https://api.openstreetmap.org/api/0.6/map?bbox='+','.join(map(str,bbox)),sourceDate='2026-11-01',license='ODbL-1.0',attribution='© OpenStreetMap contributors',licenseUrl='https://www.openstreetmap.org/copyright',elements=ns+ways)
 dest=out/(name+'-osm.json');dest.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False));print(name,len(ns),'nodes',len(ways),'ways',hashlib.sha256(dest.read_bytes()).hexdigest())
