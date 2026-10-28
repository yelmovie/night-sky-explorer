// Navigation coordinates share the generated terrain's 1672 × 941 space.
export const WORLD = { width: 1672, height: 941 };
export const nodes = {
  spawn: [850, 820], gate: [850, 755], south: [850, 628], steps: [850, 568], core: [850, 463],
  west: [597, 552], westbend: [548, 435], westup: [620, 335], clockturn: [642, 262],
  clockyard: [574, 228], clock: [476, 214], moonyard: [386, 517], moon: [307, 475],
  east: [1037, 581], eastbend: [1187, 530], deckturn: [1254, 476], deckyard: [1353, 467],
  deck: [1398, 447], hill: [1210, 399], hillbend: [1182, 315], labstep: [1099, 266],
  lab: [1130, 228], northbend: [1205, 622], lookout: [1290, 696],
};
export const edges = [
  ['spawn','gate'], ['gate','south'], ['south','steps'], ['steps','core'],
  ['south','west'], ['west','westbend'], ['westbend','westup'], ['westup','clockturn'],
  ['clockturn','clockyard'], ['clockyard','clock'], ['west','moonyard'], ['moonyard','moon'],
  ['south','east'], ['east','eastbend'], ['eastbend','deckturn'], ['deckturn','deckyard'],
  ['deckyard','deck'], ['deckturn','hill'], ['hill','hillbend'], ['hillbend','labstep'],
  ['labstep','lab'], ['eastbend','northbend'], ['northbend','lookout'],
];
export const siteNodes = ['core', 'moon', 'clock', 'lab', 'deck', 'lookout'];
export function routeBetween(start, end) {
  if (!Object.hasOwn(nodes, start) || !Object.hasOwn(nodes, end)) return [];
  const queue = [[start]], seen = new Set([start]);
  while (queue.length) {
    const path = queue.shift(), last = path.at(-1);
    if (last === end) return path;
    for (const [a, b] of edges) {
      const next = a === last ? b : b === last ? a : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push([...path, next]); }
    }
  }
  return [];
}
export function nearestNode(point) {
  return Object.keys(nodes).sort((a, b) =>
    Math.hypot(nodes[a][0] - point.x, nodes[a][1] - point.y) -
    Math.hypot(nodes[b][0] - point.x, nodes[b][1] - point.y))[0];
}
export function nearestEdgePoint(point) {
  let best = null;
  for (const [a, b] of edges) {
    const A = nodes[a], B = nodes[b], dx = B[0] - A[0], dy = B[1] - A[1];
    const t = Math.max(0, Math.min(1, ((point.x - A[0]) * dx + (point.y - A[1]) * dy) / (dx * dx + dy * dy)));
    const x = A[0] + t * dx, y = A[1] + t * dy, dist = Math.hypot(x - point.x, y - point.y);
    if (!best || dist < best.dist) best = { x, y, dist, a, b };
  }
  return best;
}
export function returnPosition(site) {
  const door = nodes[siteNodes[site]];
  if (!door) return { x: nodes.spawn[0], y: nodes.spawn[1] };
  // Return along the actual final approach, outside the 22px doorway trigger.
  const path = routeBetween('spawn', siteNodes[site]), previous = nodes[path.at(-2)];
  const dx = previous[0] - door[0], dy = previous[1] - door[1], length = Math.hypot(dx, dy);
  return { x: door[0] + dx / length * 36, y: door[1] + dy / length * 36 };
}
export function doorAt(point, radius = 22) {
  return siteNodes.findIndex((id) => Math.hypot(nodes[id][0] - point.x, nodes[id][1] - point.y) <= radius);
}
