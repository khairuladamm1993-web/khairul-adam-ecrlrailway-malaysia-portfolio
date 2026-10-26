# KTM V3 — North/South GIS recovery via official KTMB GTFS

This isolated branch does not modify main, MR-S10 Integrated, Vercel Production, other transit modules or Supabase.

Previous Safari user evidence: neither Komuter Utara nor Shuttle Selatan displayed markers after category focus, because the existing browser source served the Klang Valley only. Live MyGeoMap station REST requests were not proven accessible; relying on browser CORS is fragile.

Remediation: Government KTMB GTFS static (CC BY 4.0) `https://api.data.gov.my/gtfs-static/ktmb` supplies actual `stops.txt` station coordinates, downloaded on the GitHub Actions runner and packaged as a public JSON artifact. The North/South four-service coverage is required to be complete (13/13, 13/13, 7/7, 2/2); job fails on insufficient evidence. No fabricated stop coordinates or geographic rail polylines. Station service memberships retain the catalogue order and do not infer operational service status from GTFS stops alone.

If GTFS is down or names change, the pipeline fails rather than manufacturing geometry. The browser loads the verified bundled JSON without cross-domain CORS dependencies, and falls back to previously verified secondary GIS points if needed.

Security: public four-file allowlist, SHA256 provenance, no Production deployment. Artifacts are generated for separate Codespace CLI Preview deployment only after successful CI and project-ID verification. Safari iPad Owner QA required to verify marker visibility, Focus/All/Reset, popups, and label collisions. This is not a production rail operational data source.

Cross-project: unchanged Integrated four-route shell and existing KTM branch Preview. Only integrate after actual UAT and independent integration QA.
