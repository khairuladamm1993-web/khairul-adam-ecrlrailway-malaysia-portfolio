"""R2.17.4 isolated, no-network regression tests for licensed GTFS shape gate."""
import csv
import importlib.util
import io
import pathlib
import unittest
import zipfile

P = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "audit-kajang-gtfs-static.py"
spec = importlib.util.spec_from_file_location("audit_r2174", P)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def csv_bytes(cols, rows):
    b = io.StringIO()
    w=csv.DictWriter(b,fieldnames=cols,lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
    return b.getvalue().encode("utf-8")

def feed(route_name="MRT Kajang Line", stop_count=29, shape_count=40, include_shapes=True, foreign=False):
    content={}
    content["routes.txt"]=csv_bytes(["route_id","route_short_name","route_long_name"],[
        {"route_id":"mrt_kg","route_short_name":"KG","route_long_name":route_name},
        {"route_id":"ktm","route_short_name":"KTM","route_long_name":"KTM Komuter"}])
    content["trips.txt"]=csv_bytes(["route_id","trip_id","shape_id"],[
        {"route_id":"mrt_kg","trip_id":"kg_a","shape_id":"kg_shape"},
        {"route_id":"ktm","trip_id":"ktm_a","shape_id":"ktm_shape"}])
    stops=[{"stop_id":str(i),"stop_name":f"Station {i}"} for i in range(stop_count)]
    content["stops.txt"]=csv_bytes(["stop_id","stop_name"],stops)
    content["stop_times.txt"]=csv_bytes(["trip_id","stop_id"],[
        {"trip_id":"kg_a","stop_id":str(i)} for i in range(stop_count)])
    pts=[{"shape_id":"kg_shape","shape_pt_lat":f"{3.15-(0.15*i/(shape_count-1)):.6f}",
          "shape_pt_lon":f"{101.56+(0.25*i/(shape_count-1)):.6f}",
          "shape_pt_sequence":str(i)} for i in range(shape_count)]
    if foreign:
        pts[1]["shape_pt_lat"]="6.55"
    if include_shapes:
        pts.append({"shape_id":"ktm_shape","shape_pt_lat":"6.50000","shape_pt_lon":"100.50000","shape_pt_sequence":"0"})
        content["shapes.txt"]=csv_bytes(["shape_id","shape_pt_lat","shape_pt_lon","shape_pt_sequence"],pts)
    b=io.BytesIO()
    with zipfile.ZipFile(b,"w",compression=zipfile.ZIP_DEFLATED) as z:
        for n,v in content.items():
            z.writestr(n,v)
    return b.getvalue()

class Gate(unittest.TestCase):
    def test_exact_operator_route_and_29_stops(self):
        x=mod.analyze(feed())
        # ~33km test geometry deliberately below 35km, so must not approve.
        self.assertEqual(x["routeStopCount"],29)
        self.assertEqual(x["candidateCount"] if "candidateCount" in x else 1,1)
        self.assertEqual(x["status"],"GTFS_GEOMETRY_REVIEW_REQUIRED")
        self.assertFalse(x["serviceGeometryCandidate"])
        self.assertFalse(x["physicalTrackVerified"])
        self.assertEqual(x["osmPhysicalWayIds"],[])
        self.assertEqual(x["shapeCount"],1)
        self.assertEqual(x["feedRoutes"],2)
    def test_station_count_mismatch_not_approved(self):
        x=mod.analyze(feed(stop_count=28))
        self.assertEqual(x["status"],"GTFS_GEOMETRY_REVIEW_REQUIRED")
        self.assertFalse(x["serviceGeometryCandidate"])
    def test_ambiguous_or_wrong_route_rejected(self):
        x=mod.analyze(feed(route_name="MRT Putrajaya Line"))
        self.assertEqual(x["status"],"KAJANG_ROUTE_NOT_UNIQUE")
        self.assertFalse(x["serviceGeometryCandidate"])
    def test_missing_shapes_rejected(self):
        x=mod.analyze(feed(include_shapes=False))
        self.assertEqual(x["status"],"GTFS_REQUIRED_FILES_MISSING")
        self.assertIn("shapes.txt",x["missing"])
    def test_foreign_geometry_rejected(self):
        x=mod.analyze(feed(foreign=True))
        self.assertEqual(x["status"],"SHAPE_OUTSIDE_KAJANG_REGION")
        self.assertFalse(x["serviceGeometryCandidate"])
    def test_invalid_archive_is_unavailable_not_approved(self):
        with self.assertRaises(zipfile.BadZipFile):
            mod.analyze(b"not a ZIP")
    def test_http_unavailable_reports_status_without_fabricating_geometry(self):
        import urllib.error
        def unavailable(_request, timeout):
            raise urllib.error.HTTPError(mod.URL,429,"Too Many Requests",{},None)
        result=mod.probe(opener=unavailable)
        self.assertEqual(result["status"],"HTTP_SOURCE_UNAVAILABLE")
        self.assertEqual(result["httpStatus"],429)
        self.assertFalse(result["serviceGeometryCandidate"])
        self.assertFalse(result["physicalTrackVerified"])
    def test_source_is_bounded_and_public(self):
        self.assertEqual(mod.URL,"https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl")
        self.assertLessEqual(mod.MAX_ZIP_BYTES,16_000_000)
        self.assertEqual(mod.LICENSE,"https://developer.data.gov.my/faq")

if __name__=="__main__":
    unittest.main(verbosity=2)
