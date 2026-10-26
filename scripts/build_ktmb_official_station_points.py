#!/usr/bin/env python3
"""Build source-backed KTMB station point data from Malaysia Open API GTFS (CC BY 4.0)."""
import argparse, csv, datetime, hashlib, io, json, re, unicodedata, urllib.request, zipfile
from pathlib import Path

SOURCE = "https://api.data.gov.my/gtfs-static/ktmb"
ROOT = Path(__file__).resolve().parents[1]
REGIONS = {
 "central": (100.8, 2.2, 102.4, 3.95),
 "north": (99.5, 4.0, 101.8, 6.95),
 "south": (102.0, 1.2, 104.5, 2.95),
}
REQUIRED_SERVICE_IDS = {
 "ktm-padang-besar", "ktm-ipoh",
 "ktm-shuttle-selatan-paloh", "ktm-shuttle-selatan-pasirgudang"
}
def norm(s):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", str(s or ""))
                  .encode("ascii", "ignore").decode().lower())

def build(feed_bytes, catalogue, source_time=None):
    with zipfile.ZipFile(io.BytesIO(feed_bytes)) as z:
        file_name = next((n for n in z.namelist() if n.rsplit("/", 1)[-1].lower()=="stops.txt"), None)
        if not file_name:
            raise ValueError("stops.txt absent from official GTFS")
        raw_stops=z.read(file_name)
    reader=csv.DictReader(io.StringIO(raw_stops.decode("utf-8-sig")))
    required={"stop_id","stop_name","stop_lat","stop_lon"}
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        raise ValueError("GTFS stops.txt lacks required fields")
    index={}
    for row in reader:
        k=norm(row["stop_name"])
        if not k:
            continue
        try:
            lon=float(row["stop_lon"]); lat=float(row["stop_lat"])
        except (TypeError,ValueError):
            continue
        if not (99.5<=lon<=105.0 and 1.0<=lat<=7.5):
            continue
        index.setdefault(k,[]).append((row,lat,lon))
    entries={}
    coverage=[]
    for route in catalogue["services"]:
        got=0; missing=[]
        bounds=REGIONS[route["sector"]]
        for station in route["stationSequence"]:
            k=norm(station["name"])
            # Ambiguous duplicate stop names fail closed; no arbitrary coordinate choice.
            candidates=[x for x in index.get(k,[]) if
                        bounds[0]<=x[2]<=bounds[2] and bounds[1]<=x[1]<=bounds[3]]
            unique={(round(x[1],6), round(x[2],6)) for x in candidates}
            if len(unique)!=1:
                missing.append(station["name"])
                continue
            record,lat,lon=candidates[0]
            existing=entries.get(k)
            if existing is None:
                existing={
                    "name":station["name"], "gtfsStopName":record["stop_name"],
                    "gtfsStopId":record["stop_id"],"lat":lat,"lon":lon,
                    "serviceIds":[route["id"]],"sourceStatus":"OFFICIAL_KTMB_GTFS_STOP",
                }
                entries[k]=existing
            elif route["id"] not in existing["serviceIds"]:
                if abs(existing["lat"]-lat)>1e-6 or abs(existing["lon"]-lon)>1e-6:
                    raise ValueError("Inconsistent GTFS coordinates for shared station "+station["name"])
                existing["serviceIds"].append(route["id"])
            got+=1
        coverage.append({"serviceId":route["id"],"matched":got,
                         "catalogueStops":len(route["stationSequence"]), "missing":missing})
        if route["id"] in REQUIRED_SERVICE_IDS and missing:
            raise ValueError("North/South missing official station points: "+route["id"]+" "+", ".join(missing))
    if len([c for c in coverage if c["serviceId"] in REQUIRED_SERVICE_IDS])!=4:
        raise ValueError("Required northern/southern service missing")
    return {"schemaVersion":1,"source":"KTMB_GTFS_STATIC_STOP_COORDINATES",
            "sourceUrl":SOURCE,"license":"CC BY 4.0",
            "retrievedAtUtc":source_time or datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "zipSha256":hashlib.sha256(feed_bytes).hexdigest(),
            "stopsTxtSha256":hashlib.sha256(raw_stops).hexdigest(),
            "stops":list(entries.values()),"coverage":coverage,
            "note":"GTFS public stop coordinates, not surveyed rail alignment nor verification of current train service."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    p.add_argument("--feed-zip",help="Optional local test fixture: no network")
    args=p.parse_args()
    if args.feed_zip:
        b=Path(args.feed_zip).read_bytes()
    else:
        req=urllib.request.Request(SOURCE,headers={"User-Agent":"MR-S10-railway-GTFS-public-data-validation/1.0"})
        with urllib.request.urlopen(req,timeout=60) as response:
            b=response.read(30*1024*1024+1)
        if len(b)>30*1024*1024: raise ValueError("Official GTFS exceeds bounded download limit")
    cat=json.loads((ROOT/"assets/mrs10-r223-ktm-catalogue.json").read_text(encoding="utf-8"))
    out=build(b,cat)
    target=Path(args.output);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    for c in out["coverage"]:
        print("GTFS_COVERAGE:",c["serviceId"],f'{c["matched"]}/{c["catalogueStops"]}',"MISSING:",repr(c["missing"]))
    print("GTFS_UNIQUE_STATION_POINTS:",len(out["stops"]))
    print("GTFS_ZIP_SHA256:",out["zipSha256"])
    print("GTFS_PUBLIC_OUTPUT:",str(target))

if __name__=="__main__":main()
