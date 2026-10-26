# KTM Komuter V2 — integration handoff (26 Oct 2026)
Branch: feature/mrs10-p01-ktm-komuter-v2 from R2.22 checkpoint 6f5eafef0f0b333c32cb963e199709744f84e4ae.
Six KTM passenger identities with 96 service-stop memberships, not 96 physical stations.
Southern routes source: https://www.ktmb.com.my/TrainTime.html, https://www.bernama.com/bm/news.php?id=2589900 and https://rac.gov.my/index.php/en/media/news/shuttle-selatan-service-launched-benefit-two-million
GTFS: https://developer.data.gov.my/realtime-api/gtfs-static.en. License CC BY 4.0; live feed NOT imported. Do not claim fresh GTFS reconciliation.
Runtime public GIS: https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/SELANGOR_RAILWAY_MAP/FeatureServer/0. Layer covers central stations only; north/south pending. License not verified and dataset not redistributed.
No railway LineString or invented station position. List line is purely schematic. Station marker fills use each service color. Shared GIS features are one coordinate with different pixel-shifted service markers and a single unique station name label.
Public standalone page uses no member/admin assets, no analytics and no Supabase. UI BM/EN/zh/th, theme, focus/all, 44px touches.
Colors approximate evidence for Central/North; Southern HEX provisional, not official.
External Safari iPad UAT and live GIS geometry count pending. Do not merge into integrated preview before separate integration review; no shared files modified.
