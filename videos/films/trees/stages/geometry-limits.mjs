import { rows } from '../fixtures.mjs';
import { drawConstructionDot as dot, drawConstructionText as label } from '../defaults.mjs';

export function drawGeometryLimits(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  if (beat === 0) {
    const q = api.teaching.axes({
      x: 190,
      y: 340,
      width: 970,
      height: 470,
      xDomain: [0.5, 5],
      yDomain: [0, 9],
      xTicks: [1, 2, 3, 4, 5],
      yTicks: [0, 3, 6, 9],
      xLabel: 'ambiguity',
      yLabel: 'policy support',
      fontSize: 29,
    });
    api.path(ctx, [q.point(0.5, 5.5), q.point(5, 1)], { color: C.muted, width: 3, clip: q.bounds });
    const built = api.phase(p, 0.47, 0.84) * 5;
    for (let i = 0; i < Math.ceil(built); i++) {
      const x = 0.5 + i * 0.9;
      const y = 6 - x;
      const fraction = Math.min(1, built - i);
      const stepX = x + 0.9 * Math.min(1, fraction * 2);
      const stepY = y - 0.9 * Math.max(0, 2 * fraction - 1);
      api.path(ctx, [q.point(x, y), q.point(stepX, y), q.point(stepX, stepY)], {
        color: C.yellow,
        width: 5,
        clip: q.bounds,
      });
    }
    rows.forEach((row, i) => {
      const at = q.point(row[0], row[1]);
      dot(ctx, api, at.x, at.y, row[2], 13);
      label(ctx, api, 'R' + (i + 1), at.x, at.y + (i === 2 ? 48 : -29), 26, C.ink);
    });
    label(ctx, api, 'Diagonal target', 1490, 478, 40);
    label(ctx, api, 'ambiguity + support = 6', 1490, 549, 36, C.muted);
    if (built > 0) label(ctx, api, 'Tree approximation', 1490, 697, 36, C.yellow);
    return;
  }
  const squared = beat > 1 || api.focus.progress('square-endpoints', api.phase(p, 0.46, 0.61)) > 0;
  const reveal = beat === 2 && api.focus.progress('squared-route', api.phase(p, 0, 0.15)) === 1;
  const probe = 2.8;
  const drawScale = (transform, y, name, showPoint) => {
    const [lo, hi] = [1, 4].map(transform);
    const cut = (lo + hi) / 2;
    const x = (v) => 465 + (1200 * (v - lo)) / (hi - lo);
    label(ctx, api, name, 105, y + 10, 36, C.ink, 'left');
    api.line(ctx, x(lo), y, x(hi), y, C.muted, 3);
    [lo, hi].forEach((v) => {
      api.circle(ctx, x(v), y, 16, C.blue);
      label(ctx, api, v, x(v), y + 65, 38);
    });
    api.line(ctx, x(cut), y - 54, x(cut), y + 42, C.yellow, 4);
    label(ctx, api, 'midpoint ' + cut, x(cut), y + 91, 32, C.yellow);
    if (showPoint) {
      const v = transform(probe);
      api.circle(ctx, x(v), y, 21, C.pink);
      label(ctx, api, Number(v.toFixed(2)), x(v), y - 68, 41, C.pink);
    }
  };
  drawScale((x) => x, 436, 'Original', true);
  api.focus.target('squared-scale', () => {
    if (squared) drawScale((x) => x * x, 748, 'Squared', reveal);
    else label(ctx, api, 'What if we square the feature before fitting?', 960, 752, 36, C.muted);
  });
  if (squared)
    label(
      ctx,
      api,
      reveal ? '2.8² = 7.84 < 8.5     ·     left branch' : '2.8² = ?     ·     Which side of 8.5?',
      960,
      978,
      43,
      C.ink,
    );
}
export default {
  id: 'geometry-limits',
  draw: drawGeometryLimits,
  cues: ['square-endpoints', 'squared-route'],
};
