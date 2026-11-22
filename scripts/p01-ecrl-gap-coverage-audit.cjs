'use strict';
const fs = require('node:fs');
function provenanceGate(meta) {
  const m = meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
  const required = ['sourceId','sourceRevision','coordinateReferenceSystem','license','chainageDatum','independentControlReference'];
  const missing = required.filter(k => typeof m[k] !== 'string' || !m[k].trim());
  const restricted = m.redistributionApproved !== true;
  return {status:'HOLD_NOT_VERIFIED', missing, redistributionAllowed:!restricted, eligibleForAutomaticPromotion:false};
}
function sourceGraphReachability(features, start, target) {
  const graph = new Map();
  for (const nodes of features) {
    for (let i=0;i<nodes.length;i++) {
      if (!graph.has(nodes[i])) graph.set(nodes[i],new Set());
      if (i>0) {
        graph.get(nodes[i]).add(nodes[i-1]);
        graph.get(nodes[i-1]).add(nodes[i]);
      }
    }
  }
  const seen = new Set([start]), pending=[start];
  while (pending.length) {
    const node=pending.pop();
    for (const next of graph.get(node)||[]) if (!seen.has(next)) {seen.add(next);pending.push(next);}
  }
  return {connected:graph.has(start) && graph.has(target) && seen.has(target), componentNodeCount:graph.has(start)?seen.size:0};
}
function audit(candidate, detailed) {
  if (candidate?.type !== 'FeatureCollection' || detailed?.type !== 'FeatureCollection' || !Array.isArray(candidate.features) || !Array.isArray(detailed.features)) throw Error('Expected two GeoJSON FeatureCollections');
  const byWay = new Map();
  for (const f of detailed.features) {
    const p = f.properties || {}, way = String(p.osm_way_id ?? '');
    if (!way) continue;
    const nodes = p.source_node_ids;
    if (!Array.isArray(nodes)) throw Error('Missing source_node_ids for detailed way ' + way);
    if (!byWay.has(way)) byWay.set(way, []);
    byWay.get(way).push({nodes:nodes.map(String), revision:p.rechecked_way_version, snapshot:p.source_snapshot});
  }
  const rows = candidate.features.map((f, i) => {
    const p = f.properties || {}, way = String(p.osm_way_id ?? ''), ends = p.original_adjacent_osm_nodes;
    if (!way || !Array.isArray(ends) || ends.length !== 2 || String(ends[0]) === String(ends[1])) throw Error('Invalid candidate #' + (i+1));
    if (p.approved_alignment !== false || p.do_not_use_for_train_movement !== true) throw Error('Unsafe approval flags candidate #' + (i+1));
    const entries = byWay.get(way) || [], features = entries.map(e=>e.nodes), [a,b] = ends.map(String);
    const revisionComparable = entries.length > 0 && p.rechecked_way_version != null && entries.every(e => e.revision != null);
    const revisionMatch = revisionComparable ? entries.every(e => String(e.revision) === String(p.rechecked_way_version)) : null;
    const snapshotMatch = entries.length > 0 && entries.every(e => typeof e.snapshot === 'string' && e.snapshot && e.snapshot === p.source_snapshot);
    const aFound = features.some(ns => ns.includes(a)), bFound = features.some(ns => ns.includes(b));
    const same = features.some(ns => ns.includes(a) && ns.includes(b));
    const adjacent = features.some(ns => ns.some((n,j) => j+1 < ns.length && ((n===a && ns[j+1]===b) || (n===b && ns[j+1]===a))));
    const graph = sourceGraphReachability(features,a,b);
    return {candidate_index:i+1, osm_way_id:way, node_a:a, node_b:b, edge_length_m:p.original_edge_length_m ?? null, detailed_features_same_way:features.length, source_revision_comparable:revisionComparable, source_revision_match:revisionMatch, source_snapshot_match:snapshotMatch, node_a_in_detailed:aFound, node_b_in_detailed:bFound, both_nodes_same_feature:same, adjacent_nodes_same_feature:adjacent, same_way_source_graph_connected:graph.connected, source_component_node_count:graph.componentNodeCount, provenance:provenanceGate(p.provenance), decision:'HOLD_NOT_ACCEPTED'};
  });
  return {rows, summary:{candidates:rows.length, one_endpoint:rows.filter(r=>r.node_a_in_detailed !== r.node_b_in_detailed).length, both_separate:rows.filter(r=>r.node_a_in_detailed && r.node_b_in_detailed && !r.both_nodes_same_feature).length, same_feature:rows.filter(r=>r.both_nodes_same_feature).length, adjacent:rows.filter(r=>r.adjacent_nodes_same_feature).length, graph_connected:rows.filter(r=>r.same_way_source_graph_connected).length, promoted:0}};
}
if (require.main === module) {
  const [a,b] = process.argv.slice(2);
  if (!a || !b) { console.error('Usage: node scripts/p01-ecrl-gap-coverage-audit.cjs candidates.geojson detailed.geojson'); process.exit(2); }
  console.log(JSON.stringify(audit(JSON.parse(fs.readFileSync(a,'utf8')), JSON.parse(fs.readFileSync(b,'utf8'))), null, 2));
}
module.exports = {audit, provenanceGate, sourceGraphReachability};
