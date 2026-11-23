export const vectorDot = (a, b) => a.reduce((v, x, i) => v + x * b[i], 0);
export const vectorCosine = (a, b) => {
  const denom = Math.hypot(...a) * Math.hypot(...b);
  return denom ? vectorDot(a, b) / denom : null;
};
export function reciprocalFusion(lanes, constant = 60) {
  const totals = {};
  for (const lane of lanes) {
    if (new Set(lane).size !== lane.length) throw Error('Duplicate document identity in one lane');
    lane.forEach((id, i) => (totals[id] = (totals[id] ?? 0) + 1 / (constant + i + 1)));
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
export const coarseCenters = [0, 10];
export const indexedPassages = [
  { id: 'generic_api', value: 0 },
  { id: 'key_rotation', value: 5.1 },
  { id: 'quota_page', value: 9 },
];
const centersByDistance = (q) =>
  coarseCenters
    .map((value, i) => ({ i, distance: Math.abs(q - value) }))
    .sort((a, b) => a.distance - b.distance || a.i - b.i);
export const listOwner = (value) => centersByDistance(value)[0].i;
function rankPassages(query, passages) {
  return passages
    .map((row) => ({ ...row, distance: Math.abs(row.value - query) }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
}
export function flatRoute(query) {
  return { ranked: rankPassages(query, indexedPassages), checks: indexedPassages.length };
}
const buckets = coarseCenters.map((_, i) =>
  indexedPassages.filter((d) => listOwner(d.value) === i),
);
export function ivfRoute(query, probes = 1) {
  const lists = centersByDistance(query)
    .slice(0, probes)
    .map((row) => row.i);
  const visited = lists.flatMap((i) => buckets[i]);
  return {
    centroids: coarseCenters,
    documents: indexedPassages,
    lists,
    visited,
    ranked: rankPassages(query, visited),
    checks: coarseCenters.length + visited.length,
  };
}
export const graphPoints = { S: [0, 0], A: [3, 0.8], B: [2, 2], G: [3.9, 0.8] };
export const graphLinks = { S: ['A', 'B'], A: ['S'], B: ['S', 'G'], G: ['B'] };
export const graphQuery = [4, 0.8];
export const graphDistance = (id) =>
  Math.hypot(graphPoints[id][0] - graphQuery[0], graphPoints[id][1] - graphQuery[1]);
export function frontierSearch(ef) {
  if (!Number.isInteger(ef) || ef < 1) throw Error('ef must be positive');
  const byDistance = (a, b) => graphDistance(a) - graphDistance(b) || a.localeCompare(b);
  let frontier = ['A'],
    best = ['A'];
  const visited = new Set(['A']),
    expanded = [],
    steps = [];
  const save = () =>
    steps.push({
      frontier: [...frontier],
      best: [...best],
      visited: [...visited],
      expanded: [...expanded],
    });
  save();
  while (frontier.length) {
    frontier.sort(byDistance);
    const id = frontier.shift();
    if (graphDistance(id) > graphDistance(best.at(-1))) break;
    expanded.push(id);
    for (const n of graphLinks[id]) {
      if (visited.has(n)) continue;
      visited.add(n);
      if (best.length < ef || graphDistance(n) < graphDistance(best.at(-1))) {
        frontier.push(n);
        best.push(n);
        best.sort(byDistance);
        if (best.length > ef) best.pop();
      }
    }
    save();
  }
  return {
    steps,
    best,
    expanded,
  };
}
