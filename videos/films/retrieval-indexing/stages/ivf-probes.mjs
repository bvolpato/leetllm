import { ivfRoute, flatRoute } from '../vector-search.mjs';
import { drawBoundaryDetail, drawCheckCounts, drawProbeMap, names } from '../probe-map.mjs';
import { picture } from '../picture.mjs';

export function drawIvfProbes(ctx, scene, state, api) {
  const p = picture(ctx, state, api);
  const { C, label, target, progress, started, after } = p;
  const query = 4.9,
    one = ivfRoute(query),
    two = ivfRoute(query, 2);
  const first = after('ivf-left'),
    widen = after('ivf-second'),
    found = after('ivf-found');
  const route = widen ? two : first ? one : null;
  const showQuery = started('ivf-query');
  drawProbeMap(p, {
    query: showQuery ? query : null,
    route,
    budget: showQuery ? (widen ? 2 : 1) : null,
    showCenters: after('ivf-centers'),
    showPassages: (first && !widen) || found,
    assign: progress('ivf-build'),
  });
  if (started('ivf-counts')) {
    const rows = [
      ['One probe', one.centroids.length, one.visited.length],
      ['Two probes', two.centroids.length, two.visited.length],
    ];
    if (started('ivf-flat')) rows.push(['Flat exact', 0, flatRoute(query).checks]);
    drawCheckCounts(p, rows);
  } else drawBoundaryDetail(p, showQuery ? query : null, after('ivf-gap'));
  target('probe-caption', () => {
    let text = 'Each passage belongs to its nearest center.';
    if (showQuery) text = 'One probe. Which passage will the search return?';
    if (first)
      text =
        'Returned   ' +
        names[one.ranked[0].id] +
        '   ·   distance ' +
        one.ranked[0].distance.toFixed(1);
    if (widen)
      text = found
        ? 'Returned   ' +
          names[two.ranked[0].id] +
          '   ·   distance ' +
          two.ranked[0].distance.toFixed(1)
        : 'Compare the passages in the second list.';
    label(text, 150, 1004, 41, (first && !widen) || found ? C.green : C.yellow);
  });
}
export default {
  id: 'ivf-probes',
  draw: drawIvfProbes,
  cues: [
    'ivf-build',
    'ivf-lists',
    'ivf-query',
    'ivf-ask',
    'ivf-left',
    'ivf-centers',
    'ivf-gap',
    'ivf-second',
    'ivf-found',
    'ivf-counts',
    'ivf-flat',
  ],
};
