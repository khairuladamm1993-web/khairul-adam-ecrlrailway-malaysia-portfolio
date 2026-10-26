#!/usr/bin/env python3
"""Create reviewable *representative train trips* from official KTMB GTFS.
No route geometry, no interpolation, no unsourced places or fabricated train calling patterns.
"""
import argparse, csv, datetime, hashlib, io, json, urllib.request, zipfile
from pathlib import Path
URL="https://api.data.gov.my/gtfs-static/ktmb"
TARGETS=[
 ("ETS","ktmb-ets-v1","KTM ETS · GTFS example train","#3157C8",36),
 ("ERT","ktmb-ert","Ekspres Rakyat Timuran · GTFS example train","#A15B29",20),
 ("SH","ktmb-shuttle-timuran","Shuttle Timur · GTFS example train","#A8772F",20)
]
def build(raw):
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  def table(name):
   n=next((p for p in z.namelist() if p.rsplit("/",1)[-1].lower()==name),None)
   if n is None: raise ValueError("MISSING_GTFS_"+name)
   return list(csv.DictReader(io.StringIO(z.read(n).decode("utf-8-sig"))))
  routes={r["route_id"]:r for r in table("routes.txt")}
  stops={s["stop_id"]:s for s in table("stops.txt")}
  trips=table("trips.txt");times=table("stop_times.txt")
  timesByTrip={}
  for t in times:timesByTrip.setdefault(t["trip_id"],[]).append(t)
  for rows in timesByTrip.values():rows.sort(key=lambda t:int(t["stop_sequence"]))
  result=[]
  for rid,sid,title,color,minStops in TARGETS:
   if rid not in routes: raise ValueError("GTFS_ROUTE_NOT_FOUND_"+rid)
   candidates=[(t,timesByTrip.get(t["trip_id"],[])) for t in trips if t["route_id"]==rid]
   candidates=[(t,rows) for t,rows in candidates if len(rows)>=minStops]
   if not candidates:raise ValueError("NO_GTFS_TRAIN_PATTERN_"+rid)
   candidates.sort(key=lambda x:(-len(x[1]),x[0]["trip_id"]))
   trip,pattern=candidates[0]
   features=[];seen=set()
   for row in pattern:
    sid0=row["stop_id"];st=stops.get(sid0)
    if not st:raise ValueError("MISSING_STOP_"+sid0)
    name=(st.get("stop_name") or "").strip()
    try:lat=float(st["stop_lat"]);lon=float(st["stop_lon"])
    except (ValueError,TypeError):raise ValueError("BAD_COORD_"+sid0)
    if not (1.0<=lat<=7.5 and 99.5<=lon<=105.0) or not name or sid0 in seen:
     raise ValueError("INVALID_GTFS_STATION_"+sid0)
    seen.add(sid0)
    features.append({"id":sid0,"name":name,"lat":lat,"lon":lon,"order":len(features)+1})
   result.append({"id":sid,"routeId":rid,"name":title,"color":color,
    "sourceRouteName":routes[rid].get("route_long_name") or title,
    "tripId":trip["trip_id"],"direction":trip.get("direction_id"),"totalTrips":len([t for t in trips if t["route_id"]==rid]),
    "serviceStatus":"REPRESENTATIVE_OFFICIAL_GTFS_TRIP_NOT_ALL_SERVICE_VARIANTS",
    "stops":features})
 return {"schemaVersion":1,"source":"KTMB_OFFICIAL_GTFS_TRIP_PATTERNS","sourceUrl":URL,
   "snapshotUtc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
   "zipSha256":hashlib.sha256(raw).hexdigest(),"license":"CC BY 4.0",
   "physicalTrackGeometry":None,
   "note":"This is an observed stop order on one representative train trip per service, not an all-stop service map or physical railway line.",
   "services":result}
def main():
 a=argparse.ArgumentParser();a.add_argument("--output",required=True);a.add_argument("--feed-zip");o=a.parse_args()
 if o.feed_zip:raw=Path(o.feed_zip).read_bytes()
 else:
  req=urllib.request.Request(URL,headers={"User-Agent":"MR-S10-KTM-Unified-Source-Validation/1.0"})
  with urllib.request.urlopen(req,timeout=60) as resp:raw=resp.read(30_000_001)
 if len(raw)>30_000_000:raise ValueError("GTFS feed size limit exceeded")
 result=build(raw);p=Path(o.output);p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("UNIFIED_GTFS_VERIFIED",json.dumps({"sha":result["zipSha256"],"services":[{"routeId":s["routeId"],"trip":s["tripId"],"stops":len(s["stops"]),"first":s["stops"][0]["name"],"last":s["stops"][-1]["name"]} for s in result["services"]]},ensure_ascii=False))
if __name__=="__main__":main()
