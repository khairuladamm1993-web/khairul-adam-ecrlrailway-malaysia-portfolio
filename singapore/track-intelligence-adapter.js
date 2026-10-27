// MR-S10 reusable Track Intelligence adapter: never promote missing engineering facts.
export const UNKNOWN = "Belum disahkan";
const fields = ["segmentId","country","infrastructureId","routeIds","operatorId","fromStationId","toStationId","trackGaugeMm","trackCount","railSystemType","electrification","structureType","bridgeName","tunnelName","chainageStartM","chainageEndM","chainageReference","operationalStatus","sourceUrl","sourceFeatureId","sourceTimestamp","confidence"];
export function normalizeRailwayTrackSegment(feature) {
  if (!feature || !feature.geometry || !["LineString","MultiLineString"].includes(feature.geometry.type)) return null;
  const p=feature.properties||{}, s={};
  for (const k of fields) s[k]=p[k] ?? null;
  s.routeIds=Array.isArray(p.routeIds)?p.routeIds.filter(x=>typeof x==="string"):[];
  s.structureType=["AT_GRADE","ELEVATED","BRIDGE","VIADUCT","TUNNEL","UNDERGROUND","UNKNOWN"].includes(p.structureType)?p.structureType:"UNKNOWN";
  s.geometry=feature.geometry;
  if (!Number.isFinite(s.trackGaugeMm)) s.trackGaugeMm=null;
  if (!Number.isFinite(s.chainageStartM)) s.chainageStartM=null;
  if (!Number.isFinite(s.chainageEndM)) s.chainageEndM=null;
  if (!s.sourceFeatureId || !s.sourceUrl) s.confidence="SECONDARY_UNVERIFIED";
  return s;
}
export function fieldValue(value) {return value===null||value===undefined||value===""?UNKNOWN:String(value);}
export function chainageDisplay(m, ref) {if(!Number.isFinite(m)||!ref?.official||!ref?.datum||!ref?.sourceUrl)return UNKNOWN;return "CH "+String(Math.floor(m/1000)).padStart(3,"0")+"+"+String(Math.round(m%1000)).padStart(3,"0");}
export function trackPopupDetails(feature) {
  const s=normalizeRailwayTrackSegment(feature);
  if(!s)return null;
  return { ...s, trackGaugeDisplay:s.trackGaugeMm===null?UNKNOWN:s.trackGaugeMm+" mm",chainageDisplay:chainageDisplay(s.chainageStartM,s.chainageReference),verified:s.confidence!=="SECONDARY_UNVERIFIED"&&Boolean(s.sourceFeatureId)};
}
