#!/usr/bin/env python3
"""Read-only audit of route, trip, stop and stop_times metadata in official KTMB feed."""
import csv, io, json, os, urllib.request, zipfile, hashlib, collections
U="https://api.data.gov.my/gtfs-static/ktmb"
req=urllib.request.Request(U,headers={"User-Agent":"MR-S10-Official-KTMB-GTFS-Audit/1.0"})
with urllib.request.urlopen(req,timeout=60) as r:
 b=r.read(30_000_001)
if len(b)>30_000_000: raise ValueError("Oversized GTFS")
with zipfile.ZipFile(io.BytesIO(b)) as z:
 def table(name):
  p=next((p for p in z.namelist() if p.rsplit("/",1)[-1].lower()==name),None)
  if not p:return []
  return list(csv.DictReader(io.StringIO(z.read(p).decode("utf-8-sig"))))
 routes=table("routes.txt");trips=table("trips.txt");times=table("stop_times.txt");stops=table("stops.txt")
 stopdict={s.get("stop_id"):s for s in stops}
 tripdict={t.get("trip_id"):t for t in trips}
 counts=collections.Counter(t.get("route_id") for t in trips)
 tripstops=collections.defaultdict(list)
 for t in times:tripstops[t.get("trip_id")].append(t)
 routesummary=[]
 for r in routes:
  rid=r.get("route_id")
  samples=sorted((t for t in trips if t.get("route_id")==rid),key=lambda t:len(tripstops[t.get("trip_id")]),reverse=True)[:2]
  routesummary.append({"routeId":rid,"short":r.get("route_short_name"),"long":r.get("route_long_name"),"desc":r.get("route_desc"),"type":r.get("route_type"),"trips":counts[rid],
   "examples":[{"id":t.get("trip_id"),"heads":t.get("trip_headsign"),"direction":t.get("direction_id"),"stopCount":len(tripstops[t.get("trip_id")]),"firstAndLast":[{"name":stopdict.get(x.get("stop_id"),{}).get("stop_name"),"id":x.get("stop_id")} for x in sorted(tripstops[t.get("trip_id")],key=lambda x:int(x.get("stop_sequence") or 0))][0::max(len(tripstops[t.get("trip_id")])-1,1)]} for t in samples]})
 print("KTMB_GTFS_AUDIT",json.dumps({"zipSha256":hashlib.sha256(b).hexdigest(),"files":z.namelist(),"routes":routesummary,"uniqueStops":len(stops),"totalTrips":len(trips),"totalStopTimes":len(times)},ensure_ascii=False))
