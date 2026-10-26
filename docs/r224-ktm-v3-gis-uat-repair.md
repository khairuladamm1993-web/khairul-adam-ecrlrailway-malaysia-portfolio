# KTM Komuter V3 · GIS coverage and reset remediation candidate

Branch: `feature/mrs10-p01-ktm-v3-gis-uat-repair`
Base: `a62d23bd7545a8e9b0e69e48695c576459112b82`
Scope: isolated KTM source only. No changes to `main`, Integrated Preview, Supabase, ECRL or Vercel Production.

## Implemented
- Reset/focus clears obsolete selected-station message and closes the previous popup before showing an updated regional GIS status.
- Secondary government MyGeoMap KTM Station layer can supply *candidate* North/South station points. Matching is exact canonical name and restrictive northern/southern bounding boxes, with strict duplicate rejection and no invented coordinates.
- Existing Klang Valley ArcGIS points remain; sources load independently and fail closed on unavailable CORS/network, invalid payloads, duplicate identities or implausible locations.
- GIS status labels show numbers of matched points for the selected service; missing matches are explicit instead of displaying a stale status.
- Popup attribution points to source specific to selected station.

## Evidence / outstanding
- MyGeoMap service metadata lists KTM stations across Peninsula, but direct REST reachability and browser CORS remain **UNVERIFIED**. Candidate positions are NOT KTMB surveyed locations. Official national GTFS feed publishes stop information but has NOT been imported or reconciled.
- No real geographic rail alignments/LineString were created. South color codes remain UI provisional.
- Automated GitHub QA must PASS on this branch; real iPad Safari UAT on a safe Preview is still PENDING.
- The previously verified KTM Preview remains untouched. Do not deploy this branch to Production or merge into Integrated without release review.
