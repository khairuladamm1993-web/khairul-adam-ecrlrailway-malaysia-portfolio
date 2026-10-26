#!/usr/bin/env python3
"""Shuttle Timur V2: official GTFS 40-stop audit against independently sourced OSM rail ways.
Fail closed. OSM proximity never authorizes GTFS coordinate replacement.
No straight-line train track inference and no fabricated railway geometry.
"""
import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import math
import os
import re
import time
import unicodedata
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

GTFS_URL="https://api.data.gov.my/gtfs-static/ktmb"
OSM_URLS=[
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
BBOX=(4.12,101.70,6.23,102.36)
MAX_GTFS=30_000_000
CLASSIFICATIONS={"VERIFIED","ACCEPTABLE_STATION_OFFSET","APPROXIMATE","SUSPECTED_MISMATCH","UNRESOLVED"}
# OpenStreetMap railway=station node candidate coordinates, documented 2026-10-27.
# Not engineering track centerline geometry. Five decimal WGS84 coordinates.
OSM_STATION_CANDIDATES={
 "78900":(5.30011,102.02000,"node/2630752129","Kemubu"),
 "78500":(5.24834,102.00964,"node/2630752130","Sri Mahligai"),
 "78700":(5.26824,102.00952,"node/10971399485","Sri Jaya"),
 "78400":(5.23068,102.01027,"node/11416821606","Sri Bintang"),
 "79800":(5.39033,102.06428,"node/6997825867","Kuala Gris"),
 "72200":(4.25781,101.92527,"node/12753679164","Bukit Betong"),
 "72400":(4.29346,101.92210,"node/12753679163","Kampung Berkam"),
 "78300":(5.21338,102.01248,"node/2630752132","Sungai Tasin"),
}

def table(z, name):
    p=next((x for x in z.namelist() if x.rsplit("/",1)[-1].lower()==name), None)
    if not p:raise ValueError("GTFS_MISSING_"+name)
    return list(csv.DictReader(io.StringIO(z.read(p).decode("utf-8-sig"))))

def source_stops(raw):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        stops={s["stop_id"]:s for s in table(z,"stops.txt")}
        trips={t["trip_id"]:t for t in table(z,"trips.txt")}
        if "51" not in trips or trips["51"]["route_id"]!="SH":
            raise ValueError("GTFS_TRIP_51_NOT_SH")
        rows=sorted((t for t in table(z,"stop_times.txt") if t["trip_id"]=="51"),key=lambda a:int(a["stop_sequence"]))
        if len(rows)!=40:raise ValueError("GTFS_TRIP_51_EXPECTED_40_GOT_"+str(len(rows)))
        out=[]
        for n,row in enumerate(rows,1):
            s=stops[row["stop_id"]]
            out.append({"order":n,"stopSequence":int(row["stop_sequence"]),"id":row["stop_id"],
                        "name":s["stop_name"].strip(),"lat":float(s["stop_lat"]),"lon":float(s["stop_lon"])})
        if len(set(x["id"] for x in out))!=40:raise ValueError("GTFS_DUPLICATE_STOP_ID")
        return out

def read_url(url, size, timeout=60, data=None):
    request=urllib.request.Request(url,data=data,headers={"User-Agent":"MR-S10-Shuttle-Timur-GIS-Audit/2.0 (noncommercial public data audit)"})
    with urllib.request.urlopen(request,timeout=timeout) as response:
        payload=response.read(size+1)
    if len(payload)>size:raise ValueError("NETWORK_RESPONSE_TOO_LARGE")
    return payload

def norm(s):
    s=re.sub(r'\bSG[. ]+', 'SUNGAI ', s.upper())
    s=re.sub(r'\bKG[. ]+', 'KAMPUNG ', s)
    s=unicodedata.normalize("NFKD",s)
    s="".join(x for x in s if not unicodedata.combining(x))
    return re.sub(r"[^A-Z0-9]","",s)

def metric(point, segment_a, segment_b):
    lat0=math.radians(point[0])
    x_scale=111_320*math.cos(lat0)
    y_scale=111_195
    px,py=point[1]*x_scale,point[0]*y_scale
    ax,ay=segment_a[1]*x_scale,segment_a[0]*y_scale
    bx,by=segment_b[1]*x_scale,segment_b[0]*y_scale
    vx,vy=bx-ax,by-ay
    t=max(0,min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy))) if vx*vx+vy*vy>0 else 0
    return math.hypot(px-(ax+t*vx),py-(ay+t*vy))

def dist(a,b):
    return 2*6_371_000*math.asin(min(1,math.sqrt(
        math.sin(math.radians(b[0]-a[0])/2)**2+
        math.cos(math.radians(a[0]))*math.cos(math.radians(b[0]))*
        math.sin(math.radians(b[1]-a[1])/2)**2)))

def fetch_osm():
    a,b,c,d=BBOX
    query=f'[out:json][timeout:90];(way["railway"~"^(rail|narrow_gauge)$"]({a},{b},{c},{d});nwr["railway"~"^(station|halt|stop|platform)$"]({a},{b},{c},{d}););out center geom;'
    errors=[]
    for url in OSM_URLS:
        try:
            body=urllib.parse.urlencode({"data":query}).encode()
            payload=json.loads(read_url(url,15_000_000,timeout=105,data=body))
            if not isinstance(payload.get("elements"),list):raise ValueError("OSM_RESPONSE_NOT_ELEMENTS")
            return url,payload,[]
        except Exception as ex:
            errors.append(type(ex).__name__+":"+str(ex)[:110])
            time.sleep(1)
    return None,None,errors

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--feed-zip")
    p.add_argument("--output",required=True)
    p.add_argument("--no-osm",action="store_true",help="Offline fixture mode: missing GIS evidence stays UNRESOLVED")
    args=p.parse_args()
    raw=Path(args.feed_zip).read_bytes() if args.feed_zip else read_url(GTFS_URL,MAX_GTFS)
    stops=source_stops(raw)
    osm_url,osm,errors=(None,None,["OSM_SKIPPED_OFFLINE"]) if args.no_osm else fetch_osm()
    ways=[]
    locations=[]
    if osm:
        for feature in osm["elements"]:
            tags=feature.get("tags") or {}
            if feature["type"]=="way" and tags.get("railway") in ("rail","narrow_gauge"):
                pts=[(v["lat"],v["lon"]) for v in feature.get("geometry",[]) if "lat" in v and "lon" in v]
                if len(pts)>1:ways.append((str(feature["id"]),pts))
            if tags.get("railway") in ("station","halt","stop","platform"):
                xy=feature.get("center") or feature
                if "lat" in xy and "lon" in xy and (tags.get("name") or tags.get("name:en")):
                    locations.append((tags.get("name") or tags.get("name:en"),(xy["lat"],xy["lon"]),feature["type"]+"/"+str(feature["id"])))
    stamp=dt.datetime.now(dt.timezone.utc).isoformat()
    output=[]
    for i,s in enumerate(stops):
        point=(s["lat"],s["lon"])
        best=(float("inf"),None)
        for wid,pts in ways:
            # spatial guard without inventing a snapped position
            if all(abs(v[0]-point[0])>0.06 or abs(v[1]-point[1])>0.06 for v in pts):continue
            for a,b in zip(pts,pts[1:]):
                m=metric(point,a,b)
                if m<best[0]:best=(m,wid)
        similar=sorted((dist(point,xy),oid,name) for name,xy,oid in locations if norm(name)==norm(s["name"]))
        named=similar[0] if similar else None
        offset=round(best[0],1) if best[1] else None
        path=None
        # Independent topology diagnostic only; a chord cannot prove a rail alignment.
        if 0<i<len(stops)-1:
            prev=(stops[i-1]["lat"],stops[i-1]["lon"])
            next_=(stops[i+1]["lat"],stops[i+1]["lon"])
            path=round(metric(point,prev,next_),1)
        if not best[1]:
            cls,conf="UNRESOLVED","LOW"
            why="No reliable OSM railway way geometry returned near this GTFS stop"
        elif named and named[0]<=250 and offset<=130:
            cls,conf="VERIFIED","HIGH"
            why="GTFS point close to named OSM stop and independently mapped railway way; railway topology not surveyed"
        elif named and named[0]<=550 and offset<=550:
            cls,conf="ACCEPTABLE_STATION_OFFSET","MEDIUM"
            why="Named OSM stop correlates within station vicinity; GTFS coordinate retained"
        elif offset>1500:
            cls,conf="SUSPECTED_MISMATCH","LOW"
            why="GTFS coordinate over 1.5 km from the nearest mapped OSM railway way; inspect railway completeness and station identity"
        else:
            cls,conf="APPROXIMATE","LOW"
            why="Only railway-way proximity established; named station or engineering track topology unverified"
        # Named station node is not track geometry; never snap to nearest way.
        candidate=OSM_STATION_CANDIDATES.get(s["id"])
        proposed=point
        replacement_source=None
        correction_reason=None
        original_offset=offset
        if candidate:
            station_xy=(candidate[0],candidate[1])
            if dist(point,station_xy)>1000:
                matches=sorted((dist(station_xy,xy),name,oid) for name,xy,oid in locations if norm(name)==norm(candidate[3]))
                target_track=float("inf")
                for wid,pts in ways:
                    if all(abs(v[0]-station_xy[0])>0.04 or abs(v[1]-station_xy[1])>0.04 for v in pts):continue
                    for a1,b1 in zip(pts,pts[1:]):
                        target_track=min(target_track,metric(station_xy,a1,b1))
                if matches and matches[0][0]<=80 and target_track<=160:
                    proposed=station_xy
                    cls,conf="VERIFIED","HIGH"
                    why="Wrong-looking GTFS point corroborated by named OSM station and independently mapped railway (not survey grade)"
                    replacement_source="https://www.openstreetmap.org/"+candidate[2]
                    correction_reason="OSM named station and rail evidence; GTFS >1 km from documented point"
                    offset=round(target_track,1)
                elif not ways:
                    proposed=station_xy
                    cls,conf="APPROXIMATE","MEDIUM"
                    why="Independent OSM railway station point strongly conflicts with GTFS; track centerline could not be checked"
                    replacement_source="https://www.openstreetmap.org/"+candidate[2]
                    correction_reason="Documented OSM station node, railway alignment unresolved"
                    offset=None
        # Generic verified remedy for a grossly displaced GTFS stop:
        # the OSM point must carry the *same named station* and be within
        # 140 m of mapped railway, while the GTFS original is >750 m away
        # from the named point and >400 m from mapped rail. No interpolation.
        if proposed==point and named and named[0]>750 and original_offset is not None and original_offset>400:
            candidates=sorted((dist(point,xy),xy,oid) for name,xy,oid in locations if norm(name)==norm(s["name"]))
            if candidates and (len(candidates)==1 or dist(candidates[0][1],candidates[1][1])<=250):
                station_xy=candidates[0][1]
                rail_distance=float("inf")
                for wid,pts in ways:
                    if all(abs(v[0]-station_xy[0])>0.04 or abs(v[1]-station_xy[1])>0.04 for v in pts):continue
                    for a1,b1 in zip(pts,pts[1:]):
                        rail_distance=min(rail_distance,metric(station_xy,a1,b1))
                if rail_distance<=140:
                    proposed=station_xy
                    cls,conf="VERIFIED","HIGH"
                    why="Gross GTFS displacement corrected to independently named OSM railway station with nearby railway way; not survey-grade"
                    replacement_source="https://www.openstreetmap.org/"+candidates[0][2]
                    correction_reason="Exact named OSM station, nearby railway, original GTFS rail offset >400 m"
                    offset=round(rail_distance,1)
        changed=proposed!=point
        output.append({
            "order":s["order"],"station":s["name"],"stopId":s["id"],
            "stopSequence":s["stopSequence"],
            "originalCoordinates":{"lat":s["lat"],"lon":s["lon"]},
            "effectiveCoordinates":{"lat":proposed[0],"lon":proposed[1]},
            "coordinatesChanged":changed,
            "originalOffsetMeters":original_offset,
            "replacementSourceUrl":replacement_source,
            "replacementReason":correction_reason,
            "railwayAlignmentEvidence":{
                "osmWayId":best[1],"osmRailwayUrl":("https://www.openstreetmap.org/way/"+best[1]) if best[1] else None,
                "nearestNamedOsmStationId":named[1] if named else None,
                "nearestNamedOsmStation":named[2] if named else None,
                "namedOsmStationOffsetMeters":round(named[0],1) if named else None,
                "neighborChordDeviationMetersDiagnosticOnly":path,
                "topology":"NOT_ENGINEERING_VERIFIED"
            },
            "offsetMeters":offset,"confidence":conf,"decision":cls,
            "reason":why
        })
    counts={v:sum(x["decision"]==v for x in output) for v in sorted(CLASSIFICATIONS)}
    report={
        "schemaVersion":2,"serviceId":"ktmb-shuttle-timuran","routeId":"SH","tripId":"51",
        "sourceUrl":GTFS_URL,"snapshotUtc":stamp,"zipSha256":hashlib.sha256(raw).hexdigest(),
        "gtfsLicense":"CC BY 4.0","alignmentSource":"OpenStreetMap railway ways / station POIs (ODbL 1.0)" if osm else None,
        "alignmentSourceUrl":osm_url,"alignmentSnapshotUtc":stamp if osm else None,
        "alignmentFetchErrors":errors,"osmWayCount":len(ways),"osmNamedStationCount":len(locations),
        "coordinateRepairPolicy":"ORIGINAL_GTFS_IMMUTABLE_AND_SOURCE_BACKED_STATION_REPLACEMENT_WITH_QUALITY_CLASSIFICATION",
        "correctedCount":sum(x["coordinatesChanged"] for x in output),
        "replacementEvidenceDate":"2026-10-27",
        "physicalTrackGeometry":None,
        "qualityGate":"PARTIAL_REVIEW_REQUIRED" if counts["SUSPECTED_MISMATCH"] or counts["UNRESOLVED"] or counts["APPROXIMATE"] else "GIS_EVIDENCE_REVIEWED_NOT_SURVEY_GRADE",
        "decisions":counts,"stops":output
    }
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SHUTTLE_V2_AUDIT_SUMMARY="+json.dumps({k:report[k] for k in ("tripId","zipSha256","osmWayCount","osmNamedStationCount","qualityGate","decisions","alignmentFetchErrors")},separators=(",",":")))
    print("SHUTTLE_V2_AUDIT_JSON="+json.dumps(report,ensure_ascii=True,separators=(",",":")))
if __name__=="__main__":main()
