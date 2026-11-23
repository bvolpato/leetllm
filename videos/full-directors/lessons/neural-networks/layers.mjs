import {
  C,
  text,
  line,
  box,
  dot,
  face,
  reading,
  result,
  num,
  vec,
  path,
  plot,
  arrow,
  mix,
} from './bench.mjs';
import {
  activations,
  PARAMETERS,
  REQUESTS,
  REQUEST_IDS,
} from '../../../films/neural-networks/fixtures.mjs';
import { denseParameterCount } from '../../../films/neural-networks/arithmetic.mjs';
import { requestForward, transposeExample } from '../../../films/neural-networks/model.mjs';

export function bounded(ctx, s) {
  const z =
    -3 +
    3 * s.at(1, 'Move the input', 1.5) +
    3 * s.at(1, 'into the tails', 2) -
    3 * s.at(2, 'even at its center', 1.2);
  const p = plot(ctx, [105, 171, 665, 308], [-4, 4], [-1.1, 1.1], [-4, -2, 0, 2, 4], [-1, 0, 1]);
  for (const [name, c, y] of [
    ['sigmoid', C.copper, 175],
    ['tanh', C.green, 302],
  ]) {
    const fn = activations[name],
      v = fn.value(z),
      slope = fn.derivative(z);
    p.curve(fn.value, c);
    p.curve((x) => v + slope * (x - z), c, 2, z - 0.78, z + 0.78);
    p.mark(z, v, c);
    reading(ctx, name + ' slope', num(slope, 4), 832, y, c);
  }
  text(ctx, 'Pre-activation  z', 420, 531, 22, C.soft, 'center');
  result(
    ctx,
    s.b === 1
      ? 'The probe measures the height. Its tangent measures the slope.'
      : 'Sigmoid’s peak slope is 0.25. Tanh’s peak slope is 1.',
  );
}
export function reluProbe(s) {
  const approach = s.at(1, 'Slide the probe', 1.2);
  const depart = s.at(1, 'Now move onto', 1.2);
  return Math.round((-1 + approach + depart) * 1000) / 1000;
}
export function gates(ctx, s) {
  const hard = s.b === 1;
  const p = plot(
    ctx,
    [103, 164, 635, 310],
    hard ? [-2, 2] : [-2, 0],
    hard ? [-0.25, 2] : [-0.35, 0.08],
    hard ? [-2, -1, 0, 1, 2] : [-2, -1, 0],
    hard ? [0, 1, 2] : [-0.3, -0.2, -0.1, 0],
  );
  const z = hard ? reluProbe(s) : -1;
  const names = hard ? ['ReLU'] : ['ReLU', 'GELU', 'SiLU'];
  names.forEach((name, i) => {
    const c = [C.copper, C.violet, C.green][i],
      f = activations[name];
    p.curve(f.value, c, 4);
    p.mark(z, f.value(z), c);
    reading(
      ctx,
      name + ' at z = ' + (z > 0 ? '+' : '') + num(z),
      num(f.value(z)),
      808,
      hard ? 199 : 147 + i * 110,
      c,
      34,
    );
  });
  if (!hard && s.at(2, 'Their slopes', 0.5))
    text(
      ctx,
      'Local slopes at −1     ' +
        ['ReLU', 'GELU', 'SiLU'].map((k) => num(activations[k].derivative(-1), 3)).join('     '),
      600,
      535,
      22,
      C.ink,
      'center',
      'Mono',
    );
  if (hard)
    reading(
      ctx,
      z === 0 ? 'Chosen backward multiplier' : 'Local backward multiplier',
      num(activations.ReLU.derivative(z)),
      808,
      341,
      C.green,
    );
  if (hard || !s.at(2, 'Their slopes', 0.5)) text(ctx, 'Input  z', 408, 526, 22, C.soft, 'center');
  result(
    ctx,
    hard
      ? z < 0
        ? 'Negative branch: the output stays at zero.'
        : z > 0
          ? 'Positive branch: the output follows the input.'
          : 'The slopes differ at the corner. This backward pass uses zero.'
      : 'At −1 the smooth gates have negative outputs and different local slopes.',
  );
}
export const swiglu = () => {
  const u = [1, -2],
    v = [3, -1],
    a = u.map(activations.SiLU.value),
    products = a.map((n, i) => n * v[i]);
  return { u, v, a, products, y: 0.5 * products[0] - products[1] };
};
export const incomingSignal = 3;
export function signals(ctx, s) {
  if (s.b <= 2) {
    const n = Math.round(6 * s.at(2, 'Pass a unit signal', 2.4));
    text(ctx, 'Six hidden units at their peak slopes', 88, 154, 27);
    for (const [i, [name, gain, c]] of [
      ['Sigmoid', 0.25, C.copper],
      ['Tanh', 1, C.green],
    ].entries()) {
      const y = 264 + 153 * i;
      text(ctx, name, 57, y, 24, c);
      line(ctx, 181, y, 1083, y, C.rim, 3);
      for (let j = 0; j < 6; j++) {
        const x = 234 + j * 139;
        dot(ctx, x, y, 33, j < n ? c : C.paper, c);
        text(ctx, '×' + num(gain), x, y, 18, j < n ? C.light : c, 'center', 'Mono');
      }
      text(ctx, num(gain ** n, 6), 1091, y + 59, 24, c, 'right', 'Mono');
    }
    result(ctx, 'Starting sensitivity = 1. Each gate multiplies it by its local slope.');
  } else if (s.b <= 4) {
    text(ctx, 'Incoming sensitivity   +' + incomingSignal, 78, 161, 28);
    const cues = ['its signal stops', 'its signal reverses sign', 'its signal stays positive'];
    ['ReLU', 'GELU', 'SiLU'].forEach((name, i) => {
      const f = activations[name],
        c = [C.copper, C.violet, C.green][i],
        y = 244 + i * 107;
      text(ctx, name, 83, y, 33, c);
      text(ctx, '× ' + num(f.derivative(-1), 4), 302, y, 32, C.ink, 'left', 'Mono');
      arrow(ctx, [524, y], [648, y], C.soft, 3);
      const seen = s.at(3, cues[i], 0);
      text(
        ctx,
        seen ? num(incomingSignal * f.derivative(-1), 4) : '?',
        704,
        y,
        42,
        c,
        'left',
        'Mono',
      );
    });
    result(
      ctx,
      s.b === 3
        ? 'At z = −1, multiply the incoming signal by the unrounded local slope.'
        : 'To get a weight gradient, multiply the gated signal by that weight’s input.',
    );
  } else {
    const { u, v, a, products, y } = swiglu();
    const vals = s.b >= 7,
      pair = s.at(7, 'Pair each', 0.6),
      out = s.at(8, 'That one number', 0);
    const lanes = [
      ['First projection  u', vals ? vec(u) : 'xW', C.green],
      ['Second projection  v', vals ? vec(v) : 'xV', C.violet],
    ];
    lanes.forEach(([name, value, c], i) => {
      const yy = 167 + i * 178;
      face(ctx, 58, yy, 351, 126);
      text(ctx, name, 82, yy + 32, 22, c);
      text(ctx, value, 82, yy + 81, 34, c, 'left', 'Mono');
      if (!i) {
        arrow(ctx, [418, yy + 66], [489, yy + 66], C.green);
        text(ctx, 'SiLU(u)', 505, yy + 41, 25, C.green);
        text(ctx, vals ? vec(a) : 'u × σ(u)', 505, yy + 88, 24, C.ink, 'left', 'Mono');
      }
    });
    if (s.b >= 6) {
      path(
        ctx,
        [
          [410, 410],
          [802, 410],
          [802, 331],
        ],
        C.violet,
        3,
      );
      path(
        ctx,
        [
          [730, 236],
          [802, 236],
          [802, 275],
        ],
        C.green,
        3,
      );
      dot(ctx, 802, 302, 25, C.face);
      text(ctx, '×', 802, 302, 34, C.gold, 'center');
      const resolved = s.at(8, 'Now give', 0);
      text(
        ctx,
        resolved ? vec(products) : pair ? '[ ?, ? ]' : 'pairwise',
        959,
        300,
        26,
        C.copper,
        'center',
        'Mono',
      );
      if (pair && !resolved)
        text(ctx, '0.731 × 3       (−0.238) × (−1)', 681, 492, 26, C.copper, 'center', 'Mono');
    }
    if (out) text(ctx, '0.5r₁ − r₂  ≈  ' + num(y), 752, 500, 30, C.copper, 'center', 'Mono');
    result(
      ctx,
      s.b === 5
        ? 'SiLU(z) = z σ(z). GELU(z) = z Φ(z), where Φ is the Gaussian CDF.'
        : 'Each coordinate takes its own multiplier from the other projection.',
    );
  }
}

export function parameters(ctx, s) {
  const xs = [166, 594, 1022],
    ys = [[251, 429], [251, 429], [340]];
  const weights = s.at(1, 'Count one weight', 1.4),
    bias = s.at(2, 'Add one bias', 1);
  const edges = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) edges.push([0, j, i, PARAMETERS.w1[i][j]]);
  for (let i = 0; i < 2; i++) edges.push([1, i, 0, PARAMETERS.w2[i]]);
  edges.forEach(([layer, j, k, w], n) => {
    const x = xs[layer],
      xx = xs[layer + 1],
      y = ys[layer][j],
      yy = ys[layer + 1][k];
    const color = n < weights * 6 ? C.green : C.rim;
    line(ctx, x, y, xx, yy, color, 4);
    const t = j === k ? 0.51 : j ? 0.3 : 0.65;
    const mx = mix(x, xx, t),
      my = mix(y, yy, t);
    box(ctx, mx - 37, my - 20, 74, 40, C.paper, color, 12);
    text(ctx, num(w), mx, my, 22, color, 'center', 'Mono');
  });
  ys.forEach((list, layer) =>
    list.forEach((y, j) => {
      const x = xs[layer];
      dot(ctx, x, y, 33, C.face);
      text(
        ctx,
        layer === 0 ? (j ? '5' : '2') : layer === 1 ? 'h' + (j + 1) : 'z',
        x,
        y,
        27,
        C.light,
        'center',
        'Mono',
      );
      const biasIndex = layer === 1 ? j : 2;
      if (layer && bias * 3 > biasIndex) {
        line(ctx, x, y - 34, x, y - 55, C.copper, 3);
        text(
          ctx,
          'b = ' + num(layer === 1 ? 0 : PARAMETERS.b2),
          x,
          y - 74,
          22,
          C.copper,
          'center',
          'Mono',
        );
      }
    }),
  );
  result(
    ctx,
    s.at(2, 'For any dense layer', 0)
      ? 'Dense layer with bias     •     (input width + 1) × output width'
      : bias === 1
        ? '6 weights  +  3 biases  =  ' + denseParameterCount([2, 2, 1]) + ' trainable parameters'
        : 'Count each weight once, wherever it is used.',
  );
}
const widths = [784, 256, 128, 10];
export const counts = widths.slice(1).map((n, i) => denseParameterCount([widths[i], n]));
export function imageScale(ctx, s) {
  const n = 28,
    pitch = 9.8,
    left = 91,
    top = 177;
  const edge = 9 + Math.round(8 * s.at(4, 'Move an edge', 1.7));
  ctx.save();
  if (s.b === 1) {
    ctx.globalAlpha = 0.72;
  }
  text(ctx, '28 × 28 input pixels', 90, 139, 23, C.soft);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      box(
        ctx,
        left + x * pitch,
        top + y * pitch,
        pitch - 0.8,
        pitch - 0.8,
        x >= edge ? C.green : '#d8dfc9',
        null,
        0,
      );
    }
  if (s.b === 4)
    box(
      ctx,
      left + (edge - 1) * pitch - 1,
      top + 12 * pitch - 1,
      3 * pitch + 2,
      3 * pitch + 2,
      null,
      C.gold,
      2,
    );
  text(
    ctx,
    s.b === 4 ? 'Shared 3 × 3 window' : 'Flatten to 784 inputs',
    228,
    493,
    22,
    C.ink,
    'center',
  );
  ctx.restore();
  const names = ['784 → 256', '256 → 128', '128 → 10'];
  if (s.b === 1) {
    face(ctx, 503, 202, 588, 231, true);
    text(ctx, 'Toy scorer', 540, 247, 25, C.teal);
    text(ctx, '2 requests     9 parameters', 540, 325, 30, C.gold, 'left', 'Mono');
    text(ctx, 'Both requests reuse the same weights.', 540, 387, 22, C.light);
  } else
    counts.forEach((v, i) => {
      const y = 203 + 114 * i,
        visible = i === 0 || (i === 1 && s.at(2, 'The next layer', 0)) || (i === 2 && s.b >= 3);
      text(ctx, names[i], 487, y - 20, 23, C.soft, 'left', 'Mono');
      line(ctx, 493, y + 17, 1086, y + 17, C.grid, 3);
      if (visible) {
        line(
          ctx,
          493,
          y + 17,
          493 + (580 * v) / counts[0],
          y + 17,
          i === 0 ? C.copper : C.green,
          13,
        );
        text(ctx, v.toLocaleString('en-US'), 1093, y - 20, 24, C.ink, 'right', 'Mono');
      }
    });
  result(
    ctx,
    s.b < 3
      ? 'Dense layer parameters = input width × output width + output width'
      : counts.reduce((a, b) => a + b).toLocaleString('en-US') +
          ' parameters. A moving pattern can reuse a convolution’s local weights.',
  );
}
export function batch(ctx, s) {
  const hidden = s.at(1, 'Multiplying by', 1.5),
    output = s.at(2, 'Run the output layer', 1.4);
  const cols = [
    ['Request', 87],
    ['X   [4, 2]', 318],
    ['H   [4, 2]', 650],
    ['Score   [4, 1]', 943],
  ];
  cols.forEach(([label, x]) => text(ctx, label, x, 151, 23, C.soft));
  REQUESTS.forEach((x, i) => {
    const f = requestForward(x),
      y = 213 + 86 * i;
    box(
      ctx,
      66,
      y - 28,
      1063,
      60,
      i % 2 ? '#edf0dc' : '#fff9e8',
      !i && s.at(2, 'Follow one oh four', 0) ? C.copper : null,
      4,
    );
    text(ctx, REQUEST_IDS[i], 86, y, 25, C.ink, 'left', 'Mono');
    text(ctx, vec(x), 316, y, 27, C.ink, 'left', 'Mono');
    arrow(ctx, [470, y], [566, y], C.rim, 2);
    if (i < hidden * 4) text(ctx, vec(f.h), 640, y, 26, C.green, 'left', 'Mono');
    if (i < output * 4) {
      arrow(ctx, [821, y], [893, y], C.rim, 2);
      text(ctx, num(f.score), 946, y, 29, C.copper, 'left', 'Mono');
    }
  });
  result(
    ctx,
    s.at(2, 'All four rows', 0)
      ? 'CA-104 still scores ' +
          num(requestForward(REQUESTS[0]).score) +
          '. All four rows used the same nine parameters.'
      : 'Transpose the neuron rows, then add the same bias vector to every request.',
  );
}
export function transpose(ctx, s) {
  const v = transposeExample();
  const rowResult = s.at(2, 'point one and three', 0, { captionStart: 'Pairing two and five' }) === 1;
  const columnResult = s.at(2, 'one point one', 0, { captionStart: 'Pairing with the columns' }) === 1;
  const traceMatch = s.at(2, 'Only the first pair', 0);
  for (const [i, title] of ['X × transpose(W)', 'X × W'].entries()) {
    const x = 62 + 553 * i,
      c = i ? C.violet : C.green;
    face(ctx, x, 141, 520, 376);
    text(ctx, title, x + 27, 180, 26, c);
    text(ctx, 'X = [2, 5]', x + 29, 241, 26, C.ink, 'left', 'Mono');
    for (let r = 0; r < 2; r++)
      for (let j = 0; j < 2; j++) {
        const xx = x + 251 + 98 * j,
          yy = 231 + 47 * r;
        box(ctx, xx - 40, yy - 19, 81, 39, (i ? j : r) ? '#e6e1ed' : '#d8e9db', null, 4);
        text(ctx, num(PARAMETERS.w1[r][j]), xx, yy, 23, C.ink, 'center', 'Mono');
      }
    line(ctx, x + 26, 317, x + 491, 317, C.rim, 1);
    text(ctx, i ? '2(0.3) + 5(0.1)' : '2(0.3) − 5(0.1)', x + 31, 357, 26, c, 'left', 'Mono');
    text(ctx, i ? '2(−0.1) + 5(0.6)' : '2(0.1) + 5(0.6)', x + 31, 405, 26, c, 'left', 'Mono');
    text(
      ctx,
      (i ? columnResult : rowResult) ? vec(i ? v.wrong : v.right) : '[ ?, ? ]',
      x + 259,
      473,
      30,
      c,
      'center',
      'Mono',
    );
  }
  result(
    ctx,
    traceMatch
      ? 'The row pairing reproduces the hidden values saved for CA-104.'
      : rowResult
        ? 'Compare the products with the saved trace for CA-104.'
        : 'Both products have shape [1, 2]. Predict which one matches the hand trace.',
  );
}
