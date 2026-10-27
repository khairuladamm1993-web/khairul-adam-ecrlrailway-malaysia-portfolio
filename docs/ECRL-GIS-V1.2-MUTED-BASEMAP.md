# ECRL GIS V1.2 — Muted-road basemap visual refinement
Date: 27 October 2026. Scoped to isolated Preview only.

Owner feedback: previous OpenFreeMap Liberty basemap makes road network too high contrast, distracting from railway station and port-reference assets.

Implementation: OpenFreeMap Positron is the default light grayscale basemap; OpenFreeMap Liberty remains accessible by tapping a compact “Jalan malap / Jalan biasa” control. Labels localized in Bahasa Melayu, English, Chinese, and Thai. MapLibre map instance is preserved using `setStyle`, current zoom/viewport, asset selection, language, markers and references persist; style source and hitbox layers are restored from existing data via `style.load` / `idle` lifecycle with no looped updates.

No surveyed geometry, railway routing, fake railway track, station positioning, basemap source substitution or production merge. C2 EIA 2017 and PKA maritime markers remain explicitly historical/area references. Existing data gates preserved.

QA requires 27 static/data checks plus actual Chromium/WebKit Desktop/iPad/iPhone style-toggle round-trip, all four languages and marker integrity. Owner iPad visual contrast UAT still required.
