# MR-S10 P01 · D102 R1.6 — Owner-Gated Journey, Station/PL Layout and Infrastructure Events

## Scope and protection
- Isolated Preview branch; no merge into Production, P02 or P03.
- Continue existing localStorage session R1.5; no automatic restart or destruction of previous CH data.
- Only a CH-only educational simulation until lawful continuous rail-vector geometry and calibration are verified. Never place train on roads or interpolate a GPS point from station/CH.
- This Preview **is not an authenticated Owner portal**. Do not upload confidential railway drawings, private access data or restricted location materials.

## Interaction sequence
1. At STN01 `CH000+670`, choose **Ke checkpoint seterusnya**, **Set CH** or slider.
2. Modal `DEPARTURE`: current CH, station code, latitude/longitude source status and unknown geometry. Owner **OK · Rekod & Teruskan** records event and opens **NEXT** popup.
3. Modal `NEXT`: next known CH (nearest STN/PL or manually sourced infrastructure CH), latitude/longitude (when candidate exists), source and uncertainties; click **OK** to update simulated numeric CH.
4. Modal `ARRIVAL`: review and acknowledge arrival, preserving note, compared observed CH, residual and source in append-only local journal.
5. For BRIDGE, TUNNEL, QZ_CURVE (and other supported infrastructure), register CH and provenance first. On crossing its CH the model pauses at **INFRASTRUCTURE**; acknowledge and it automatically resumes its **CH-only** movement to the next mandatory stop. No physical train motion is implied.
6. After refresh/resume the session CH, ledger, infrastructure and layouts are restored on the **same browser origin and storage**.
7. **Bina semula simulasi** requires explicit Owner confirmation; earlier journal is not erased. In-progress data can be exported as private JSON.

### CH and coordinates
- Popups always show CH reference, WGS84 latitude/longitude input, evidence source and note.
- At STN: Owner candidate (if present) has precedence; else legacy GIS public locality reference.
- At PL: no physical WGS84 unless entered by Owner and stored as candidate.
- At bridge/tunnel/QZ: coordinates only if imported; otherwise display `BELUM DISAHKAN`. No automatic terrain, bridge portal, curve radius, cant, grade or TS orientation.
- `observedCH` may differ from accepted CH; stored as residual, **never silently updates official Owner chainage registry**.
- Source metadata remains simulation-only and non-surveyed, regardless of Owner acknowledgement.

## Supported imported layouts
The existing **Import GeoJSON rel + anchor** input additionally recognizes source-linked layout JSON and infrastructure event JSON. The new separate importer has a clearer validation status. Layout is rendered as a local SVG and may add a `▣` layout icon at known **reference locality** / Owner-reviewed coordinate. This is a private lab marker, **not public publication**.

Example *SCHEMA ONLY*, points below are **not** real STN01 engineering geometry:
```json
{
  "code":"STN01",
  "source":"Your permitted public station track schematic reference",
  "title":"STN01 test schematic",
  "tracks":[
    {"id":"L1","role":"mainline","points":[[5,35],[95,35]]},
    {"id":"L2","role":"loop","points":[[10,70],[90,70]]}
  ]
}
```
- Coordinates for SVG layout only use normalized [x,y] range 0..100; **not longitude/latitude**.
- Batch format: `{"layouts":[{...},{...}]}`. 1–24 source tracks per asset, max 23 layouts per import.
- The browser does **not** extract or certify rail lines from PDF/photographs/engineering drawings. Those require lawful conversion and engineering validation; no raster-traced turnouts.

## Infrastructure event import
```json
{
  "infrastructure":[
    {"id":"EXAMPLE-QZ-001","type":"QZ_CURVE","CH":20000,
     "name":"Illustrative curve reference, NOT a real QZ",
     "source":"Public source document of a real feature (replace this example)",
     "latitude":null,"longitude":null}
  ]
}
```
- Valid `type`: BRIDGE, TUNNEL, QZ_CURVE, CURVE, TURNOUT, SIGNAL, CROSSING, OTHER.
- A real event must have source evidence and a CH before it can be inserted.
- CH must be between 670 and 524160; WGS84 inputs are optional, never generated from CH.
- Unregistered infrastructure will **not** trigger stop popups, even when it exists physically. No fictional complete bridge/tunnel inventory.

## Acceptance gate
- Unit tests: departure, next, arrival, import, pending-resume, QZ hold, CH override residual, non-publication, no bypass.
- Browser QA: Chromium/WebKit desktop/iPad/iPhone plus reload persistence and camera/previous registry remain intact.
- Safari Owner UAT still required. No full geographic D102 run while centerline, model CH/geo anchors and field geometry are missing.
- localStorage is not secure cloud storage and can be cleared by device/browser reset. Export JSON backup privately.
