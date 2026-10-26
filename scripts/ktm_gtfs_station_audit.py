#!/usr/bin/env python3
"""Read-only audit of government KTMB GTFS stop coordinates against MR-S10 KTM catalogue."""
import csv, io, json, re, unicodedata, urllib.request, zipfile
from pathlib import Path

ENDPOINT = "https://api.data.gov.my/gtfs-static/ktmb"
ROOT = Path(__file__).resolve().parents[1]
catalogue = json.loads((ROOT / "assets/mrs10-r223-ktm-catalogue.json").read_text())
request = urllib.request.Request(ENDPOINT, headers={"User-Agent":"MR-S10-KTMB-station-audit/1.0"})
with urllib.request.urlopen(request, timeout=60) as resp:
    content = resp.read(30*1024*1024 + 1)
assert len(content) <= 30*1024*1024, "GTFS too large"
with zipfile.ZipFile(io.BytesIO(content)) as z:
    names = z.namelist()
    print("GTFS_FILES:", ",".join(sorted(names)))
    stopsname = next((x for x in names if x.rsplit("/", 1)[-1].lower()=="stops.txt"),None)
    assert stopsname, "GTFS stops.txt missing"
    rows=list(csv.DictReader(io.StringIO(z.read(stopsname).decode("utf-8-sig"))))
print("GTFS_TOTAL_STOPS:",len(rows))
print("GTFS_COLUMNS:",",".join(rows[0].keys()) if rows else "none")
def key(s):
    s=unicodedata.normalize("NFKD",str(s or "")).encode("ascii","ignore").decode().lower()
    return re.sub(r"[^a-z0-9]","",s)
index={}
for row in rows:
    for n in [row.get("stop_name"),row.get("stop_name_en")]:
        if n: index.setdefault(key(n),[]).append(row)
for r in catalogue["services"]:
    hits=[]
    misses=[]
    for s in r["stationSequence"]:
        candidates=index.get(key(s["name"]),[])
        if candidates: hits.append((s["name"], [(x.get("stop_name"), x.get("stop_lat"),x.get("stop_lon"),x.get("location_type")) for x in candidates[:3]]))
        else: misses.append(s["name"])
    print("SERVICE:",r["id"],"MATCH",len(hits),"/",len(r["stationSequence"]),"MISSING",json.dumps(misses))
    print("MATCH_SAMPLE:",json.dumps(hits[:6],ensure_ascii=False))
print("RAW_STOP_SAMPLE:",json.dumps([(s.get("stop_name"),s.get("stop_lat"),s.get("stop_lon")) for s in rows[:45]],ensure_ascii=False))
