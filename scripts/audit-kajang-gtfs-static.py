#!/usr/bin/env python3
"""R2.17.4 — read-only licensed Prasarana GTFS service-shape audit.

Does NOT create map geometry, approve physical track IDs, or store downloaded ZIP.
Only exact candidate service routes; rejects mixed-route and implausible geometry.
"""
import csv
import hashlib
import io
import json
import math
import urllib.request
import zipfile

URL = "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl"
DOCS = "https://developer.data.gov.my/realtime-api/gtfs-static"
LICENSE = "https://developer.data.gov.my/faq"
MAX_ZIP_BYTES = 16_000_000
REQUIRED = frozenset(("routes.txt", "trips.txt", "stop_times.txt", "stops.txt", "shapes.txt"))


def _rows(archive, name):
    with archive.open(name) as handle:
        raw = handle.read(3_000_000)
        if len(raw) == 3_000_000:
            raise ValueError("GTFS_CSV_EXCEEDS_READ_CAP")
        # UTF-8 BOM is tolerated; corrupt encodings must not be converted silently.
        return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig", errors="strict"))))


def _km(a, b):
    radius, rad = 6371.0088, math.pi / 180
    lat1, lon1 = a[0] * rad, a[1] * rad
    lat2, lon2 = b[0] * rad, b[1] * rad
    u = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 2*radius*math.asin(min(1, math.sqrt(u)))


def analyze(blob):
    """Return bounded metadata, never geometry. Candidate approval is SERVICE-only."""
    if len(blob) > MAX_ZIP_BYTES:
        raise ValueError("GTFS_SIZE_EXCEEDS_CAP")
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        names = {n.split("/")[-1]: n for n in z.namelist() if not n.endswith("/")}
        missing = sorted(REQUIRED - names.keys())
        if missing:
            return {"status":"GTFS_REQUIRED_FILES_MISSING", "missing":missing, "serviceGeometryCandidate":False}
        def records(name):
            with z.open(names[name]) as f:
                raw = f.read(3_000_001)
                if len(raw)>3_000_000:
                    raise ValueError("GTFS_CSV_EXCEEDS_READ_CAP")
                return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig", errors="strict"))))
        routes, trips = records("routes.txt"), records("trips.txt")
        stops, stop_times = records("stops.txt"), records("stop_times.txt")
        shapes = records("shapes.txt")
    candidates = [r for r in routes
        if any(term in (" ".join(str(v) for v in r.values()).lower()) for term in ("kajang", "sbk", "sungai buloh-kajang"))]
    overview = {"source":URL,"license":"CC-BY-4.0","licenseUrl":LICENSE,
        "sha256":hashlib.sha256(blob).hexdigest(),"feedRoutes":len(routes),
        "feedStops":len(stops),"feedShapesPoints":len(shapes),
        "candidateNames":[(r.get("route_short_name","")+" "+r.get("route_long_name","")).strip()[:90] for r in candidates][:6]}
    if len(candidates)!=1:
        return {**overview,"status":"KAJANG_ROUTE_NOT_UNIQUE","candidateCount":len(candidates),
                "serviceGeometryCandidate":False,"physicalTrackVerified":False}
    r=candidates[0]
    route_id=r.get("route_id","")
    route_trips=[t for t in trips if t.get("route_id")==route_id]
    trip_ids={t.get("trip_id") for t in route_trips}
    stop_ids={st.get("stop_id") for st in stop_times if st.get("trip_id") in trip_ids}
    stop_locations={s.get("stop_id"):s for s in stops}
    selected_shape_ids={t.get("shape_id") for t in route_trips if t.get("shape_id")}
    points={sid:[] for sid in selected_shape_ids}
    for p in shapes:
        sid=p.get("shape_id")
        if sid not in points:
            continue
        try:
            lat,lon=float(p["shape_pt_lat"]),float(p["shape_pt_lon"])
            seq=int(float(p["shape_pt_sequence"]))
        except (KeyError, ValueError):
            return {**overview,"status":"INVALID_GTFS_SHAPE_VALUES","serviceGeometryCandidate":False}
        if not (2.8<=lat<=3.35 and 101.3<=lon<=101.95):
            return {**overview,"status":"SHAPE_OUTSIDE_KAJANG_REGION","serviceGeometryCandidate":False}
        points[sid].append((seq,(lat,lon)))
    profiles=[]
    for sid,p in points.items():
        ordered=[coords for _,coords in sorted(p)]
        km=sum(_km(a,b) for a,b in zip(ordered,ordered[1:]))
        profiles.append({"shapeId":str(sid)[:65],"pointCount":len(ordered),
                         "approxKm":round(km,2),"validLength":35<=km<=65})
    profiles.sort(key=lambda x:(-x["pointCount"],x["shapeId"]))
    valid_stop_names=[stop_locations[st].get("stop_name","") for st in stop_ids if st in stop_locations]
    station_count=len(stop_ids)
    lengths_ok=bool(profiles) and all(x["validLength"] for x in profiles)
    candidate_ok=station_count==29 and lengths_ok and len(profiles)<=6
    return {**overview,"status":"SERVICE_GEOMETRY_CANDIDATE" if candidate_ok else "GTFS_GEOMETRY_REVIEW_REQUIRED",
        "routeId":route_id[:65],"routeStopCount":station_count,"matchedStopLocations":len(valid_stop_names),
        "shapeProfiles":profiles[:6],"shapeCount":len(profiles),
        "serviceGeometryCandidate":candidate_ok,"physicalTrackVerified":False,
        "osmPhysicalWayIds":[],"sourceNote":"GTFS service shapes do not prove physical ways, track IDs or platforms; no station coordinates or shapes are copied into app."}


def probe(opener=None):
    req=urllib.request.Request(URL,headers={"User-Agent":"MRS10-Research/1.0 public-source-audit","Accept":"application/zip"})
    opener=opener or urllib.request.urlopen
    try:
        with opener(req,timeout=14) as res:
            data=res.read(MAX_ZIP_BYTES+1)
        return analyze(data)
    except (OSError, ValueError, RuntimeError, UnicodeError, zipfile.BadZipFile) as ex:
        return {"source":URL,"licenseUrl":LICENSE,"status":"SOURCE_UNAVAILABLE_OR_INVALID",
            "reason":type(ex).__name__[:35],"serviceGeometryCandidate":False,"physicalTrackVerified":False}


if __name__=="__main__":
    print("R2.17.4 GTFS source-only audit:",json.dumps(probe(),ensure_ascii=True))
