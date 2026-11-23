import { flatRoute, ivfRoute } from '../vector-search.mjs';
import { drawBoundaryDetail, drawCheckCounts, drawProbeMap, names } from '../probe-map.mjs';
import { picture } from '../picture.mjs';

function comparison(p) {
  const { C, label, rule, target, after } = p;
  label('Same passages, same centers', 150, 280, 48, C.ink, 'left', 'serif');
  const xs = [435, 1000, 1535];
  ['Flat exact', 'One probe', 'Two probes'].forEach((heading, i) =>
    label(heading, xs[i], 400, 39, C.ink, 'center'),
  );
  label('Query', 150, 400, 34, C.muted);
  [4.9, 5.2].forEach((q, i) => {
    const y = 490 + 195 * i;
    label(q, 150, y + 52, 54, C.yellow);
    rule(140, y - 36, 1790, y - 36, C.panel, 3);
    [flatRoute(q), ivfRoute(q), ivfRoute(q, 2)].forEach((route, j) => {
      const hide = j === 2 && !after(i === 0 ? 'fresh-spend' : 'fresh-extra');
      target(j === 2 ? 'receipt-two-' + i : 'receipt-run-' + j, () => {
        label(
          hide ? '?' : names[route.ranked[0].id],
          xs[j],
          y + 39,
          44,
          hide ? C.muted : C.ink,
          'center',
        );
        if (!hide) label(route.checks + ' distance checks', xs[j], y + 102, 32, C.cyan, 'center');
      });
    });
  });
  target('receipt-question', () => {
    const text = after('fresh-decision')
      ? 'Compare eligible IDs. Judge the evidence. Measure latency.'
      : after('fresh-spend')
        ? 'Only the 4.9 query recovers a different passage.'
        : 'For which query would a second probe change the returned page?';
    label(text, 150, 982, 40, C.yellow);
  });
}

export function drawFreshProbe(ctx, scene, state, api) {
  const p = picture(ctx, state, api);
  const { C, label, progress, started, after, target } = p;
  if (state.beat >= 2) return comparison(p);
  const q = 4.9 + 0.3 * progress('fresh-move');
  const route = ivfRoute(q);
  const answered = after('fresh-answer');
  drawProbeMap(p, {
    query: q,
    route: after('fresh-centers') ? route : null,
    budget: 1,
    showCenters: answered,
    showPassages: after('fresh-distances'),
  });
  if (started('fresh-count')) {
    const rows = [['One probe', route.centroids.length, route.visited.length]];
    if (started('fresh-flat')) rows.push(['Flat exact', 0, flatRoute(q).checks]);
    drawCheckCounts(p, rows);
  } else drawBoundaryDetail(p, q, after('fresh-distances'));
  target('probe-caption', () => {
    const text = answered
      ? 'Returned   ' + names[route.ranked[0].id] + '   ·   ' + route.checks + ' distance checks'
      : started('fresh-ask')
        ? 'One probe. Which passage returns, and how many distance checks?'
        : 'Move the query. Keep the index fixed.';
    label(text, 150, 1004, 41, answered ? C.green : C.yellow);
  });
}
export default {
  id: 'fresh-probe',
  draw: drawFreshProbe,
  cues: [
    'fresh-move',
    'fresh-ask',
    'fresh-answer',
    'fresh-centers',
    'fresh-distances',
    'fresh-count',
    'fresh-flat',
    'fresh-compare',
    'fresh-spend',
    'fresh-extra',
    'fresh-decision',
  ],
};
