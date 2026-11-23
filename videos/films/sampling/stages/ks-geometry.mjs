import { sampleFunction } from 'vizmatic';
import { ksGeometry, normalCdf } from '../arithmetic.mjs';
import { cueStep } from '../construction.mjs';
import { samplingFilmData } from '../fixtures.mjs';
import { durationCdf } from '../model.mjs';

const tiny = [2, 3, 4, 5];
const uniform = (t) => Math.min(t / 5, 1);
const mean = 6 * Math.exp(0.55 ** 2 / 2);
const sd = mean * Math.sqrt(Math.expm1(0.55 ** 2));
const normal = (t) => normalCdf((t - mean) / sd);
function worst(rows) {
  return rows.reduce((a, b) => (a.gap > b.gap ? a : b));
}
const smallRows = ksGeometry(tiny, uniform);
const fullRows = ksGeometry(samplingFilmData.ks, durationCdf);
const cases = [
  { name: 'Normal', cdf: normal, worst: worst(ksGeometry(samplingFilmData.ks, normal)) },
  { name: 'Lognormal', cdf: durationCdf, worst: worst(fullRows) },
];

export function drawKsGeometry(ctx, scene, state, api) {
  const { C } = api;
  const small = state.beat < 2;
  const domain = small ? 6 : 32;
  const steps = cueStep(state, 'ks-steps', 0, 0.1, 0.42);
  const compare = cueStep(state, 'sp-ks-geometry-0', 0, 0.58, 0.8);
  const answer = cueStep(state, 'ks-left', 1, 0.08, 0.3);
  const second = cueStep(state, 'sp-ks-geometry-1', 2, 0.46, 0.67);
  const fitting = cueStep(state, 'sp-ks-geometry-2', 3, 0.26, 0.5);
  api.focus.target('sp-ks-geometry-visual', () => {
    const plot = api.teaching.axes({
      x: 215,
      y: 333,
      width: 1044,
      height: 452,
      xDomain: [0, domain],
      yDomain: [0, 1],
      xTicks: small ? [0, 1, 2, 3, 4, 5, 6] : [0, 8, 16, 24, 32],
      yTicks: small ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1],
      xLabel: 'completion time (seconds)',
      yLabel: 'fraction finished',
    });
    const count = small ? Math.floor(4 * steps) : fullRows.length;
    const rows = small ? smallRows : fullRows;
    const path = [plot.point(0, 0)];
    for (const row of rows.slice(0, count))
      path.push(plot.point(row.x, row.before), plot.point(row.x, row.after));
    if (count === rows.length) path.push(plot.point(domain, 1));
    if (path.length > 1) api.path(ctx, path, { color: C.cyan, width: 5 });
    const candidate = cases[second > 0 ? 1 : 0];
    api.teaching.curve({
      plot,
      color: C.yellow,
      width: 4,
      points: sampleFunction(small ? uniform : candidate.cdf, 0, domain, 220),
    });
    if (small) {
      api.text(ctx, 'Four observed finishes', 1498, 368, 34, C.cyan, 'center');
      api.text(ctx, '2, 3, 4, 5 s', 1498, 439, 40, C.ink, 'center');
      api.text(ctx, 'Uniform from 0 to 5 s', 1498, 540, 34, C.yellow, 'center');
      const row = smallRows[0];
      if (compare > 0) {
        const bottom = plot.point(row.x, row.before),
          top = plot.point(row.x, row.after);
        api.circle(ctx, bottom.x, bottom.y, 11, C.bg, C.cyan, 3);
        api.circle(ctx, top.x, top.y, 10, C.cyan);
        api.text(ctx, 'At 2 s', 1498, 646, 34, C.ink, 'center');
        api.text(ctx, '0 → 0.25', 1498, 708, 42, C.cyan, 'center');
        api.text(ctx, 'model   0.40', 1498, 779, 37, C.yellow, 'center');
      }
      if (answer > 0) {
        const end = plot.point(row.x, row.cdf);
        api.line(
          ctx,
          end.x - 16,
          end.y,
          end.x - 16,
          plot.point(row.x, row.cdf * (1 - answer)).y,
          C.pink,
          6,
        );
        api.text(
          ctx,
          'Largest gap  ' + worst(smallRows).gap.toFixed(2),
          1498,
          926,
          42,
          C.pink,
          'center',
        );
      }
    } else {
      api.text(ctx, '200 observed finishes', 1498, 371, 35, C.cyan, 'center');
      cases.slice(0, second > 0 ? 2 : 1).forEach((item, i) => {
        const y = 502 + 145 * i;
        api.text(ctx, item.name, 1498, y, 35, item === candidate ? C.yellow : C.muted, 'center');
        api.text(ctx, 'D = ' + item.worst.gap.toFixed(3), 1498, y + 67, 44, C.ink, 'center');
      });
      const w = candidate.worst;
      const empirical = Math.abs(w.before - w.cdf) > Math.abs(w.after - w.cdf) ? w.before : w.after;
      api.path(ctx, [plot.point(w.x, w.cdf), plot.point(w.x, empirical)], {
        color: C.pink,
        width: 7,
      });
      if (fitting > 0)
        api.text(
          ctx,
          'For fitted parameters, refit each bootstrap sample.',
          960,
          968,
          36,
          C.muted,
          'center',
        );
    }
  });
}

export default {
  id: 'ks-geometry',
  draw: drawKsGeometry,
  cues: ['ks-steps', 'sp-ks-geometry-0', 'ks-left', 'sp-ks-geometry-1', 'sp-ks-geometry-2'],
};
