import {
  frontierSearch,
  graphDistance,
  graphLinks,
  graphPoints,
  graphQuery,
} from '../vector-search.mjs';
import { picture } from '../picture.mjs';

const layout = { A: [820, 745], S: [235, 745], B: [493, 486], G: [970, 488] };
const narrow = frontierSearch(1),
  wide = frontierSearch(2);

export function drawHnswLayers(ctx, scene, state, api) {
  const { C, label, rule, dot, target, started, progress, after } = picture(ctx, state, api);
  const broad = after('hnsw-wide');
  const step = broad
    ? wide.steps[after('hnsw-guard') ? 4 : after('hnsw-g') ? 3 : after('hnsw-b') ? 2 : 1]
    : narrow.steps[after('hnsw-narrow') ? 1 : 0];
  target('hnsw-layers-construction', () => {
    label('Query   [' + graphQuery.join(', ') + ']', 135, 249, 42, C.yellow);
    label('Links show the route. Coordinates determine distance.', 1760, 247, 30, C.muted, 'right');
    if (state.beat === 0 && started('hnsw-copies')) {
      const y = 352;
      rule(layout.S[0], y, layout.A[0], y, C.blue, 4);
      for (const id of ['S', 'A']) {
        const x = layout[id][0];
        dot(x, y, 29, C.panel);
        label(id, x, y + 10, 30, C.blue, 'center');
      }
      if (started('hnsw-upper')) {
        const from = layout.S[0] + 35,
          to = layout.A[0] - 35;
        rule(from, y, from + (to - from) * progress('hnsw-upper'), y, C.yellow, 4);
      }
      if (started('hnsw-descent')) {
        const [x, bottom] = layout.A;
        const end = y + 43 + (bottom - y - 87) * progress('hnsw-descent');
        rule(x, y + 43, x, end, C.yellow, 3);
      }
    }
    Object.entries(graphLinks).forEach(([from, links]) => {
      for (const to of links) {
        if (from > to) continue;
        const [sx, sy] = layout[from],
          [tx, ty] = layout[to];
        const length = Math.hypot(tx - sx, ty - sy),
          dx = (tx - sx) / length,
          dy = (ty - sy) / length;
        const explored =
          (step.expanded.includes(from) && step.visited.includes(to)) ||
          (step.expanded.includes(to) && step.visited.includes(from));
        rule(
          sx + dx * 38,
          sy + dy * 38,
          tx - dx * 38,
          ty - dy * 38,
          explored ? C.cyan : C.muted,
          explored ? 5 : 2,
        );
      }
    });
    Object.entries(layout).forEach(([id, [x, y]]) => {
      const color = step.frontier.includes(id)
        ? C.yellow
        : step.best.includes(id)
          ? C.green
          : C.ink;
      dot(x, y, 35, color);
      label(id, x, y + 14, 39, C.bg, 'center');
      // Put labels on the outside of the graph, away from its links.
      const top = id === 'B' || id === 'G';
      label(
        '[' + graphPoints[id].join(', ') + ']',
        x,
        top ? y - 101 : y + 97,
        30,
        C.muted,
        'center',
      );
      label(graphDistance(id).toFixed(2) + ' away', x, top ? y - 57 : y + 142, 32, C.ink, 'center');
    });
    const left = 1185;
    label(
      state.beat === 0 ? 'Bottom layer' : 'Query ef = ' + (broad ? 2 : 1),
      left,
      425,
      49,
      C.ink,
    );
    label('Next to explore', left, 520, 33, C.muted);
    label(step.frontier.join('  ·  ') || 'Empty', left, 585, 46, C.yellow);
    label('Best retained', left, 675, 33, C.muted);
    label(step.best.join('  ·  '), left, 740, 46, C.green);
    label('Expanded   ' + (step.expanded.join(' → ') || '—'), left, 852, 31, C.cyan);
    let note = 'Upper layers contain subsets of the same points.';
    if (state.beat === 1)
      note = started('hnsw-ask')
        ? 'Which point must stay on the frontier to leave A?'
        : 'One place in the retained set.';
    if (state.beat === 2)
      note = started('hnsw-guard')
        ? 'hnswlib requires query ef ≥ requested neighbor count.'
        : 'Same graph and entry point. Replay the bottom-layer search.';
    if (state.beat === 3)
      note = 'M and construction ef shape the build. Search ef sets the query budget.';
    label(note, 135, 1000, 35, C.ink);
  });
}
export default {
  id: 'hnsw-layers',
  draw: drawHnswLayers,
  cues: [
    'hnsw-copies',
    'hnsw-upper',
    'hnsw-descent',
    'hnsw-narrow',
    'hnsw-ask',
    'hnsw-answer',
    'hnsw-wide',
    'hnsw-s',
    'hnsw-b',
    'hnsw-g',
    'hnsw-guard',
    'hnsw-build',
    'hnsw-limit',
  ],
};
