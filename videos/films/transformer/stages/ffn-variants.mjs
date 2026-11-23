import { event } from '../arithmetic.mjs';
import { withTransformerExtendedFrame } from '../defaults.mjs';

function affineExample(ctx, api, state) {
  const { C } = api;
  const plot = api.teaching.axes({
    x: 175,
    y: 310,
    width: 815,
    height: 510,
    xDomain: [-1.3, 2.2],
    yDomain: [-6, 15],
    xTicks: [-1, 0, 1, 2],
    yTicks: [-5, 1, 7, 13],
    xLabel: 'input x',
    yLabel: 'branch output',
    fontSize: 27,
  });
  const xs = [-1, -0.5, 0, 1, 2];
  const affine = (x) => 3 * (2 * x + 1) - 2;
  const withRelu = (x) => 3 * Math.max(0, 2 * x + 1) - 2;
  const trace = event(state, 0, 'tr-ffn-variants-affine', 0.15, 0.52);
  const clipped = event(state, 0, 'tr-ffn-variants-relu', 0.6, 0.75) === 1;
  const bend = event(state, 0, 'tr-ffn-variants-bent-output', 0.75, 0.87) === 1;
  if (trace > 0) {
    const end = -1 + 3 * trace;
    api.path(ctx, [plot.point(-1, affine(-1)), plot.point(end, affine(end))], {
      id: 'affine-output',
      color: bend ? C.muted : C.blue,
      width: 6,
    });
  }
  if (bend > 0) {
    const points = xs.map((x) => plot.point(x, withRelu(x)));
    api.path(ctx, points, { id: 'rectified-output', color: C.green, width: 5 });
  }
  for (const x of [-1, 0, 1, 2]) {
    if (trace === 0 || x > -1 + 3 * trace) continue;
    const point = plot.point(x, bend ? withRelu(x) : affine(x));
    api.circle(ctx, point.x, point.y, 9, bend ? C.green : C.blue);
  }
  api.text(ctx, 'Take x = −1', 1160, 360, 43, C.ink);
  api.text(ctx, 'First map     2x + 1 = −1', 1160, 481, 34, C.blue);
  api.text(
    ctx,
    clipped ? 'ReLU          max(0, −1) = 0' : 'Pass −1 to the second map',
    1160,
    597,
    32,
    clipped ? C.green : C.muted,
  );
  if (trace === 1) {
    api.text(
      ctx,
      bend ? '3 × 0 − 2 = −2' : clipped ? '3 × 0 − 2 = ?' : '3 × (−1) − 2 = −5',
      1160,
      730,
      41,
      bend ? C.green : C.blue,
    );
    api.text(
      ctx,
      bend ? 'A bend at x = −½' : '3(2x + 1) − 2 = 6x + 1',
      960,
      938,
      39,
      C.ink,
      'center',
    );
  }
}

function signedGate(ctx, api, state) {
  const { C } = api;
  const value = 2,
    z = -1,
    gate = z / (1 + Math.exp(-z));
  const x = (v) => 300 + (v + 1) * 420;
  const activated = event(state, 1, 'tr-ffn-variants-gate', 0.22, 0.48);
  const multiplied = event(state, 1, 'tr-ffn-variants-multiply', 0.55, 0.78);
  api.text(ctx, 'One coordinate from each upward projection', 960, 298, 37, C.ink, 'center');
  api.text(ctx, 'Upward value   +2', 330, 438, 42, C.blue);
  api.text(
    ctx,
    activated === 1 ? 'SiLU(−1) ≈ ' + gate.toFixed(3) : 'Gate input   −1',
    1080,
    438,
    42,
    C.pink,
  );
  api.line(ctx, x(-1), 685, x(2), 685, C.muted, 3);
  for (const tick of [-1, 0, 1, 2]) {
    api.line(ctx, x(tick), 673, x(tick), 704, C.muted, 3);
    api.text(ctx, String(tick), x(tick), 756, 32, C.muted, 'center');
  }
  api.circle(ctx, x(value), 649, 12, C.blue);
  if (multiplied > 0) {
    const tip = x(value + (value * gate - value) * multiplied);
    api.arrow(ctx, x(value) - 17, 607, Math.min(x(value) - 18, tip), 607, C.green, 5);
    if (multiplied === 1) {
      api.circle(ctx, tip, 649, 12, C.green);
      api.text(ctx, '2 × SiLU(−1) ≈ ' + (value * gate).toFixed(3), 960, 881, 43, C.green, 'center');
    }
  }
  api.text(ctx, 'SwiGLU  ·  SiLU(z) = z × sigmoid(z)', 960, 971, 30, C.muted, 'center');
}

const modelWidth = 12;
const plainWidth = 4 * modelWidth;
const budget = 2 * modelWidth * plainWidth;
const matchedWidth = budget / (3 * modelWidth);

function matrixBudget(ctx, api, state) {
  const { C } = api;
  const add = event(state, 2, 'tr-ffn-variants-add-gate', 0.3, 0.62);
  const narrow = event(state, 3, 'tr-ffn-variants-budget', 0.22, 0.58);
  const hidden = plainWidth - Math.round((plainWidth - matchedWidth) * narrow);
  const left = 190,
    scale = 1390 / (3 * modelWidth * plainWidth);
  const limit = left + budget * scale;
  api.text(ctx, 'Model width 12   ·   no biases', left, 303, 35, C.ink);
  api.text(ctx, 'budget  ' + budget, limit, 383, 30, C.yellow, 'center');
  for (const [a, b] of [
    [399, 430],
    [545, 603],
    [752, 788],
  ])
    api.line(ctx, limit, a, limit, b, C.yellow, 4);
  function drawMatrices(y, width, names, portion) {
    let x = left;
    names.forEach((name, i) => {
      const w = modelWidth * width * scale;
      const visible = name === 'gate' ? portion : 1;
      const colors = [C.blue, C.pink, C.green];
      if (visible > 0) {
        const barWidth = Math.max(1, (w - 6) * visible);
        api.rect(ctx, x, y, barWidth, 90, colors[i], undefined, 3);
        if (barWidth > 175)
          api.text(
            ctx,
            name + '  ' + modelWidth * width,
            x + barWidth / 2,
            y + 56,
            31,
            C.panel,
            'center',
          );
      }
      x += w;
    });
  }
  api.text(ctx, 'Two matrices   ·   intermediate width ' + plainWidth, left, 422, 31, C.ink);
  drawMatrices(445, plainWidth, ['up', 'down'], 1);
  const label = add === 1 ? 'Three matrices' : 'Adding the gate';
  api.text(ctx, label + '   ·   intermediate width ' + hidden, left, 633, 31, C.ink);
  drawMatrices(650, hidden, ['up', 'down', 'gate'], add);
  const weights = 3 * modelWidth * hidden;
  if (add === 1) {
    api.text(
      ctx,
      '3 × 12 × ' + hidden + ' = ' + weights + ' weights',
      960,
      868,
      44,
      weights > budget ? C.pink : C.green,
      'center',
    );
    if (state.beat === 3 && narrow === 1) {
      api.text(ctx, '3dh = 8d²     ·     h = 8d/3', 960, 965, 34, C.muted, 'center');
    }
  }
}

export function paintFfnVariants(ctx, scene, state, api, C, id, s, b) {
  if (b === 0) affineExample(ctx, api, state);
  else if (b === 1) signedGate(ctx, api, state);
  else matrixBudget(ctx, api, state);
}
export function drawFfnVariantsStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintFfnVariants);
}
export default {
  id: 'ffn-variants',
  draw: drawFfnVariantsStage,
  cues: [
    'tr-ffn-variants-affine',
    'tr-ffn-variants-relu',
    'tr-ffn-variants-bent-output',
    'tr-ffn-variants-gate',
    'tr-ffn-variants-multiply',
    'tr-ffn-variants-add-gate',
    'tr-ffn-variants-budget',
  ],
};
