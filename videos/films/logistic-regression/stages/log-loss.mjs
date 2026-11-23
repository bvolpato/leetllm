import { mix, progress, smooth } from '../construction.mjs';
import { M, T, chip, mark } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawLogLoss(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat < 2) {
    const wrong = progress(state, 'loss-wrong', 1),
      correct = progress(state, 'loss-correct', 1),
      p =
        currentBeat === 0
          ? 0.5
          : correct > 0
            ? mix(0.1, 0.9, smooth(correct))
            : mix(0.5, 0.1, smooth(wrong));
    T(ctx, api, 'Completed training case: review required', 960, 275, 34, api.C.pink);
    mark(api, 'outcome-probability', () => {
      api.rect(ctx, 260, 385, 1400 * p, 125, api.C.pink);
      api.rect(ctx, 260 + 1400 * p, 385, 1400 * (1 - p), 125, api.C.blue);
    });
    T(ctx, api, 'p = ' + p.toFixed(2), 260, 355, 38, api.C.pink, 'left');
    T(ctx, api, '1 − p = ' + (1 - p).toFixed(2), 1660, 355, 36, api.C.blue, 'right');
    const q = api.teaching.axes({
      x: 270,
      y: 610,
      width: 940,
      height: 245,
      xDomain: [0, 1],
      yDomain: [0, 3],
      xTicks: [0.1, 0.5, 0.9],
      yTicks: [0, 1, 2, 3],
      xLabel: 'assigned positive probability',
      yLabel: 'loss',
    });
    api.teaching.curve({
      plot: q,
      points: sampleFunction((x) => -Math.log(x), 0.05, 0.99, 120),
      color: api.C.pink,
      width: 4,
    });
    const at = q.point(p, -Math.log(p));
    mark(api, 'loss-probe', () => api.circle(ctx, at.x, at.y, 12, api.C.yellow));
    M(ctx, api, '-\\log(' + p.toFixed(2) + ')', 1480, 690, 43, api.C.pink);
    T(ctx, api, (-Math.log(p)).toFixed(3) + ' nats', 1480, 780, 46, api.C.yellow);
  } else {
    const q = progress(state, 'stable-loss', 2);
    T(ctx, api, 'Same finite wrong logit: z = −1000 · label y = 1', 960, 290, 38, api.C.pink);
    chip(ctx, api, 'rounded p = 0', 230, 420, 560, 120, api.C.red, 43);
    M(ctx, api, '-\\log(0)=+\\infty', 510, 650, 47, api.C.red);
    mark(api, 'stable-log-loss', () => {
      chip(ctx, api, 'Work directly from z', 1110, 420, 580, 120, api.C.green, 40);
      M(ctx, api, '\\ell=\\operatorname{softplus}(z)-yz', 1400, 650, 39, api.C.cyan);
      if (progress(state, 'lr-stable-loss-result', 2) === 1)
        M(ctx, api, '\\ell(-1000,1)=1000', 1400, 800, 45, api.C.green);
      else T(ctx, api, 'finite loss pending', 1400, 800, 35, api.C.muted);
    });
    const result = progress(state, 'lr-stable-loss-result', 2),
      parts = [
        ['max(0,z)', 0],
        ['exp(−|z|)', Math.exp(-1000)],
        ['log1p(exp(−|z|))', Math.log1p(Math.exp(-1000))],
      ];
    parts.forEach(([name, value], i) => {
      const x = 290 + i * 520,
        shown = q > (i + 0.3) / 3;
      T(ctx, api, name, x + 150, 900, 27, api.C.muted);
      if (shown) T(ctx, api, String(value), x + 150, 945, 33, api.C.cyan);
    });
    T(ctx, api, 'Float64 evaluation: exp(−1000) underflows to 0', 960, 1020, 28, api.C.muted);
  }
}
export default {
  id: 'log-loss',
  draw: drawLogLoss,
  cues: [
    'loss-select-outcome',
    'loss-wrong',
    'loss-correct',
    'stable-loss',
    'lr-stable-loss-result',
  ],
};
