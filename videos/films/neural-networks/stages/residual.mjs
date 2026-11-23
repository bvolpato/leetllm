import { sigmoid, stableBce } from '../arithmetic.mjs';
import { backward } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import { axes, curve, dot, equation, focusTarget, line, text } from '../defaults.mjs';

export function drawResidual(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  const d = backward([1, 4], 1);
  const trial = f.beat === 1 ? f.progress('try-logit', 1) : 0;
  const z = d.z2 + 0.25 * trial;
  const loss = stableBce(z, d.y);

  focusTarget(ctx, api, 'training-prediction', () => {
    text(
      ctx,
      api,
      'Request [1, 4]     •     observed timeout (y = 1)',
      960,
      250,
      38,
      C.ink,
      'center',
    );
    const plot = axes(ctx, api, {
      x: 260,
      y: 432,
      width: 790,
      height: 405,
      xDomain: [-1.1, 1.1],
      yDomain: [0.15, 1.5],
      xTicks: [-1, -0.5, 0, 0.5, 1],
      yTicks: [0.5, 1, 1.5],
      xLabel: 'output logit z',
      yLabel: 'loss',
    });
    curve(ctx, api, plot, (v) => stableBce(v, d.y), -1.1, 1.1, C.blue);
    const a = plot.point(d.z2, d.loss);
    const q = plot.point(z, loss);
    if (trial > 0) api.circle(ctx, a.x, a.y, 15, C.bg, C.muted, 3);
    if (f.beat >= 2 && f.shown('direction', 2)) {
      const t = 0.46 * f.progress('direction', 2);
      const left = plot.point(d.z2 - t, d.loss - t * d.dz2);
      const right = plot.point(d.z2 + t, d.loss + t * d.dz2);
      line(ctx, api, left.x, left.y, right.x, right.y, C.yellow, 6);
    }
    if (f.completed('score-target', 0)) dot(ctx, api, q.x, q.y, C.yellow, 16);
  });
  focusTarget(ctx, api, 'bce-chain', () => {
    if (f.beat < 2) {
      text(ctx, api, 'Before ReLU', 1160, 412, 32, C.muted);
      text(ctx, api, '−0.1      2.5', 1450, 412, 41, C.ink);
      if (f.completed('training-case', 0)) {
        text(ctx, api, 'After ReLU', 1160, 500, 32, C.muted);
        text(ctx, api, '0          2.5', 1450, 500, 41, C.cyan);
      }
      if (f.completed('score-target', 0)) {
        text(ctx, api, 'Logit', 1160, 630, 32, C.muted);
        text(ctx, api, z.toFixed(2), 1510, 630, 44, C.ink);
        text(ctx, api, 'Score', 1160, 710, 32, C.muted);
        text(ctx, api, sigmoid(z).toFixed(3), 1510, 710, 44, C.ink);
      }
      if (f.completed('bce-loss', 0)) {
        text(ctx, api, 'Loss  −log(p)', 1160, 822, 32, C.muted);
        text(ctx, api, loss.toFixed(3), 1510, 822, 53, C.yellow);
      }
      if (f.beat === 1)
        text(ctx, api, 'Probe the logit directly • weights fixed', 960, 985, 35, C.ink, 'center');
      return;
    }
    text(ctx, api, 'At the original logit  z = −0.25', 1470, 395, 35, C.ink, 'center');
    if (f.completed('bce-cancel', 2)) {
      equation(ctx, api, 'dL/dz = p-y', 1470, 590, 58, C.green);
      text(ctx, api, d.dz2.toFixed(3), 1470, 747, 84, C.yellow, 'center');
    } else {
      equation(ctx, api, 'dL/dp', 1310, 535, 36, C.muted);
      equation(ctx, api, 'dp/dz', 1645, 535, 36, C.muted);
      equation(ctx, api, String.raw`\frac{p-y}{p(1-p)}`, 1310, 667, 54, C.blue);
      text(ctx, api, '×', 1487, 682, 42, C.ink, 'center');
      equation(ctx, api, 'p(1-p)', 1645, 667, 48, C.blue);
    }
  });
}

export default {
  id: 'residual',
  draw: drawResidual,
  cues: [
    'training-case',
    'score-target',
    'bce-loss',
    'try-logit',
    'differentiate-output',
    'bce-cancel',
    'direction',
  ],
};
