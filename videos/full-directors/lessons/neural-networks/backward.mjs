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
  rail,
  arrow,
  mix,
} from './bench.mjs';
import {
  PARAMETERS,
  REQUESTS,
  REQUEST_IDS,
  TARGETS,
  OWNER_IDS,
} from '../../../films/neural-networks/fixtures.mjs';
import {
  requestForward,
  backward,
  batchGradient,
  freshGradient,
} from '../../../films/neural-networks/model.mjs';
import {
  sigmoid,
  stableBce,
  gradientStep,
  gradientVector,
  parameterVector,
  finiteReluSecant,
  binaryMeanGradients,
} from '../../../films/neural-networks/arithmetic.mjs';

export const timeout = backward([1, 4], 1);
export const batchGrad = batchGradient();
export const updated = gradientStep(PARAMETERS, batchGrad);
export const afterBatch = batchGradient(updated);
export const signed = freshGradient();
export const afterSigned = requestForward(signed.x, gradientStep(PARAMETERS, signed));
export const labels = [
  [1, 0, 1],
  [0, 1, 0],
];
export const meanGrad = binaryMeanGradients(
  labels.map((r) => r.map(() => 0)),
  labels,
);
export function lossProbe(ctx, s) {
  const g = timeout;
  const excursion = s.b === 4 ? s.at(4, 'Try sliding', 1.8) : 0;
  const z = mix(g.z2, 0, excursion),
    p = sigmoid(z),
    loss = stableBce(z, 1);
  text(ctx, 'Observed timeout   y = 1', 80, 136, 23, C.soft);
  const chart = plot(
    ctx,
    [112, 193, 581, 266],
    [-1.1, 1.1],
    [0, 1.5],
    [-1, -0.5, 0, 0.5, 1],
    [0, 0.5, 1, 1.5],
  );
  chart.curve((v) => stableBce(v, 1), C.green, 4);
  chart.mark(g.z2, g.loss, C.soft, 6);
  chart.mark(z, loss, C.copper, 9);
  if (s.b >= 5)
    chart.curve((v) => g.loss + g.dz2 * (v - g.z2), C.copper, 3, g.z2 - 0.36, g.z2 + 0.36);
  text(ctx, 'Output logit   z', 405, 516, 22, C.soft, 'center');
  if (s.b === 1) {
    reading(ctx, 'Inputs to the gates', vec(g.z1), 768, 167, C.soft, 30);
    reading(ctx, 'After ReLU', vec(g.h), 768, 271, C.green, 30);
    reading(ctx, 'Timeout score', num(g.score), 768, 376, C.copper, 36);
  } else {
    reading(ctx, 'Logit', num(z), 774, 153, C.green, 31);
    reading(ctx, 'Sigmoid score', num(p), 774, 265, C.green, 31);
    reading(ctx, 'Loss   −log(p)', num(loss), 774, 375, C.copper, 39);
  }
  if (s.b >= 5) {
    const formula =
      s.b === 5 ? 'dL/dz = [(p − y) / (p(1 − p))] × p(1 − p)' : 'dL/dz = p − y ≈ ' + num(g.dz2);
    result(ctx, formula);
  } else
    result(
      ctx,
      s.b === 3
        ? 'Which way would you move the logit to reduce the loss?'
        : 'For a timeout, the loss uses p. For a completed request, it uses 1 − p.',
    );
}
export function breaker(ctx, s) {
  const g = timeout;
  const split = s.at(1, 'Each hidden unit gets', 0);
  const stopped = s.at(3, 'Its correction stops', 0);
  const contact = s.at(3, 'Its slope is one', 0.8);
  const passing = contact === 1;
  text(ctx, 'Output slope', 68, 176, 22, C.soft);
  text(ctx, num(g.dz2), 66, 226, 39, C.copper, 'left', 'Mono');
  text(ctx, 'Output weight', 318, 164, 21, C.soft);
  text(ctx, 'Saved gate input', 566, 164, 21, C.soft);
  text(ctx, 'Input-weight gradients', 865, 164, 21, C.soft);
  for (let i = 0; i < 2; i++) {
    const y = 284 + i * 157,
      c = i ? C.green : C.violet;
    path(
      ctx,
      [
        [177, 338],
        [227, 338],
        [282, y],
        [509, y],
      ],
      c,
      4,
    );
    text(ctx, '× ' + num(PARAMETERS.w2[i]), 357, y - 38, 27, c, 'center', 'Mono');
    text(ctx, split ? num(g.dh[i], 4) : '?', 386, y + 37, 24, c, 'center', 'Mono');
    const known = i ? passing : stopped;
    line(ctx, 510, y, 575, y, C.soft, 4);
    dot(ctx, 580, y, 7, C.face);
    const tilt = i ? mix(-0.58, 0, contact) : -0.58;
    if (known || (i && contact)) {
      line(ctx, 580, y, 580 + 75 * Math.cos(tilt), y + 75 * Math.sin(tilt), c, 8);
    }
    dot(ctx, 655, y, 7, C.face);
    text(ctx, 'z = ' + num(g.z1[i]), 614, y - 66, 22, c, 'center', 'Mono');
    text(ctx, '× ' + (known ? Number(g.z1[i] > 0) : '?'), 614, y + 40, 24, c, 'center', 'Mono');
    if (s.b === 4) {
      if (g.z1[i] > 0) arrow(ctx, [665, y], [803, y], c);
      else line(ctx, 665, y, 803, y, C.rim, 1);
      const products = i ? s.at(4, 'Those two products', 0) : s.at(4, 'zero for both', 0);
      text(ctx, products ? vec(g.dw1[i], 4) : '[ ?, ? ]', 830, y, 27, c, 'left', 'Mono');
      if (s.at(4, 'Each hidden bias', 0))
        text(ctx, 'bias  ' + num(g.db1[i], 4), 831, y + 43, 19, C.soft, 'left', 'Mono');
    }
  }
  result(
    ctx,
    s.b === 1
      ? s.at(1, 'The output bias gets', 0)
        ? 'Output weights receive (p − y)h = ' + vec(g.dw2, 4) + '. The output bias receives p − y.'
        : 'Follow the output slope through each output weight.'
      : s.b === 2
        ? 'Which saved gate input allows a small change to pass backward?'
        : s.b === 3
          ? passing
            ? 'Only the positive branch passes its arriving sensitivity.'
            : 'Use the saved input at each contact.'
          : 'Each surviving sensitivity multiplies the original features [1, 4].',
  );
}
export function reduction(ctx, s) {
  const count = s.at(1, 'Add two more', 0.6) > 0 ? 3 : 1;
  const divide = s.at(3, 'minus or plus one twelfth', 0);
  const weighted = s.at(5, 'Give positive labels', 0.6) > 0;
  const labelsText = ['Timeout', 'Cache hit', 'Retry'];
  text(ctx, 'Request', 66, 193, 23, C.soft);
  for (let j = 0; j < count; j++) text(ctx, labelsText[j], 400 + j * 282, 193, 24, C.ink, 'center');
  for (const [i, row] of labels.entries()) {
    const y = 273 + i * 137;
    text(ctx, String(i + 1).padStart(2, '0'), 81, y + 11, 38, C.soft, 'left', 'Mono');
    for (let j = 0; j < count; j++) {
      const x = 400 + j * 282,
        yTrue = row[j],
        residual = 0.5 - yTrue,
        c = yTrue ? C.copper : C.green;
      box(ctx, x - 113, y - 37, 226, 98, '#fffbee', c, 8);
      const before = weighted && yTrue ? residual * 3 : residual;
      const residualCue =
        i === 0 && j === 0
          ? 'minus one half'
          : i === 0 && j === 1
            ? 'plus one half'
            : 'To take the mean';
      const value =
        s.b === 1
          ? yTrue
            ? 'Yes'
            : 'No'
          : s.b === 2 && !s.at(2, residualCue, 0)
            ? '?'
            : weighted
              ? num(before / 6, 3)
              : divide
                ? meanGrad[i][j] < 0
                  ? '−1/12'
                  : '+1/12'
                : num(residual);
      text(ctx, value, x, y, 34, c, 'center', 'Mono');
      text(
        ctx,
        s.b === 1
          ? 'observed label'
          : weighted
            ? num(before) + ' ÷ 6'
            : divide
              ? 'mean gradient'
              : '0.5 − ' + yTrue,
        x,
        y + 37,
        17,
        C.soft,
        'center',
      );
    }
  }
  result(
    ctx,
    weighted
      ? 'Positive-target weight = 3. A separate whole-entry weight scales either label’s gradient.'
      : s.at(3, 'three times too large', 0)
        ? 'Mean across B × C entries     •     Dividing only by B triples these gradients.'
        : s.b === 3
          ? 'Mean over 2 requests × 3 labels. Divide each residual by 6.'
          : s.b === 2
            ? 'Each logit is zero. How many residuals share the mean?'
            : 'Each request can have several positive labels.',
    C.green,
    { raised: weighted },
  );
}
export function storage(ctx, s) {
  if (s.b === 1) {
    const cols = [85, 315, 585, 836];
    ['Request', 'Saved h', '(p − y) / 4', 'W₂ gradient term'].forEach((a, i) =>
      text(ctx, a, cols[i], 158, 21, C.soft),
    );
    const progress = s.at(1, 'sums each request', 2);
    batchGrad.rows.forEach((g, i) => {
      const y = 222 + i * 68;
      text(ctx, REQUEST_IDS[i], cols[0], y, 23, C.ink, 'left', 'Mono');
      text(ctx, vec(g.h), cols[1], y, 23, C.green, 'left', 'Mono');
      text(ctx, num(g.dz2 / 4, 4), cols[2], y, 23, C.violet, 'left', 'Mono');
      if (i < progress * 4)
        text(
          ctx,
          vec(
            g.dw2.map((v) => v / 4),
            4,
          ),
          cols[3],
          y,
          22,
          C.copper,
          'left',
          'Mono',
        );
    });
    if (progress === 1)
      text(
        ctx,
        'Sum of unrounded terms  ' + vec(batchGrad.dw2, 4),
        1107,
        495,
        28,
        C.copper,
        'right',
        'Mono',
      );
    result(ctx, 'Match each residual to the hidden activations from that request.', C.green, {
      raised: true,
    });
    return;
  }
  const x = REQUESTS[0],
    h = requestForward(x).h;
  const omitted = s.at(2, 'Save them', 0),
    restored = s.at(2, 'reruns omitted forward work', 1);
  face(ctx, 72, 175, 407, 263, true);
  text(ctx, 'Retained boundary', 104, 213, 26, C.teal);
  text(ctx, 'CA-104   ' + vec(x), 104, 280, 28, C.light, 'left', 'Mono');
  text(ctx, 'Weights   v1', 104, 342, 26, C.light, 'left', 'Mono');
  text(ctx, 'Same stochastic state', 104, 402, 22, C.light);
  arrow(ctx, [500, 309], [674, 309], restored ? C.green : C.rim);
  text(ctx, 'forward', 586, 269, 22, C.soft, 'center');
  face(ctx, 698, 175, 430, 263);
  text(ctx, 'Hidden activations', 733, 213, 25, C.soft);
  text(
    ctx,
    omitted && restored < 1 ? (restored ? 'recomputing' : 'omitted') : vec(h),
    733,
    287,
    43,
    C.green,
    'left',
    'Mono',
  );
  if (restored === 1)
    text(
      ctx,
      'Gate mask   ' + vec(h.map((v) => Number(v > 0))),
      733,
      381,
      25,
      C.ink,
      'left',
      'Mono',
    );
  result(
    ctx,
    s.b === 3
      ? 'Checkpointing stores fewer activations and reruns forward work.'
      : 'Checkpointing retains a boundary and recomputes the matching forward values.',
  );
}
export function step(ctx, s) {
  const t = s.at(2, 'Subtract a tenth', 1.4),
    rerun = s.at(2, 'point four nine eight', 0);
  const before = parameterVector(PARAMETERS),
    after = parameterVector(updated),
    d = gradientVector(batchGrad);
  const names = ['w₁₁', 'w₁₂', 'w₂₁', 'w₂₂', 'b₁', 'b₂', 'v₁', 'v₂', 'c'];
  for (let i = 0; i < OWNER_IDS.length; i++) {
    const col = i % 3,
      row = Math.floor(i / 3),
      x = 73 + col * 357,
      y = 161 + row * 104;
    box(ctx, x, y, 335, 87, '#fffbea', C.rim, 5);
    text(ctx, names[i], x + 17, y + 28, 23, C.soft);
    text(ctx, num(mix(before[i], after[i], t), 4), x + 311, y + 28, 28, C.green, 'right', 'Mono');
    text(ctx, 'pre-step gradient  ' + num(d[i], 4), x + 17, y + 62, 18, C.copper, 'left', 'Mono');
  }
  text(ctx, rerun ? 'Batch mean loss, before → after' : 'Batch mean loss before step', 83, 508, 24, C.soft);
  text(
    ctx,
    num(batchGrad.loss, 4) + (rerun ? '    →    ' + num(afterBatch.loss, 4) : ''),
    1095,
    508,
    33,
    C.copper,
    'right',
    'Mono',
  );
  result(ctx, 'New parameter = old parameter − 0.1 × its mean gradient');
}
export function secant(ctx, s) {
  if (s.b === 1) {
    const vals = batchGrad.rows.map((g) => g.z1);
    text(ctx, 'Hidden pre-activations for our four requests', 80, 156, 26);
    vals.forEach((a, i) => {
      const x = 85 + i * 275;
      face(ctx, x, 218, 216, 145);
      text(ctx, REQUEST_IDS[i], x + 108, 256, 20, C.soft, 'center');
      text(ctx, vec(a), x + 108, 315, 27, C.green, 'center', 'Mono');
    });
    text(ctx, 'Finite differences   All nine parameters', 85, 427, 27, C.green);
    text(ctx, 'Article   Separate autograd example', 644, 427, 27, C.violet);
    result(
      ctx,
      'All hidden pre-activations in this batch are positive under the small perturbations.',
    );
    return;
  }
  const z = s.b === 2 ? 0 : 0.05,
    eps = 0.15 - 0.13 * s.at(3, 'Bring it back', 1.75);
  const relu = (v) => Math.max(0, v),
    slope = finiteReluSecant(z, eps);
  const p = plot(
    ctx,
    [112, 180, 581, 294],
    [-0.22, 0.26],
    [-0.03, 0.24],
    [-0.2, -0.1, 0, 0.1, 0.2],
    [0, 0.1, 0.2],
  );
  p.curve(relu, C.green, 5);
  const a = [z - eps, relu(z - eps)],
    b = [z + eps, relu(z + eps)];
  path(ctx, [p.p(...a), p.p(...b)], C.copper, 4);
  p.mark(...a);
  p.mark(...b);
  reading(ctx, 'Step on each side  ε', num(eps), 758, 160, C.soft, 33);
  reading(ctx, 'Secant slope', num(slope), 758, 269, C.copper, 33);
  reading(ctx, 'Backward value', String(Number(z > 0)), 758, 378, C.green, 33);
  text(ctx, 'Hidden pre-activation', 403, 523, 21, C.soft, 'center');
  result(
    ctx,
    z === 0
      ? 'At zero, the two one-sided slopes differ. PyTorch chooses zero for backward.'
      : a[0] < 0
        ? 'The left probe still samples the flat branch.'
        : 'Both probes lie on the positive branch. Tiny steps can lose precision through cancellation.',
    C.green,
    { raised: true },
  );
}
export function signedStep(ctx, s) {
  const g = signed;
  const params = gradientStep(PARAMETERS, g);
  const t = s.at(5, 'Watch the two marks', 1.25);
  const rerun = s.at(6, 'Its score rises', 0);
  const trace = rerun ? afterSigned : g;
  const blocked = s.b === 4;
  const unit = blocked ? 0 : 1;
  const outputWeight = rerun ? params.w2[unit] : PARAMETERS.w2[unit];
  face(ctx, 61, 135, 425, 402, true);
  text(ctx, rerun ? 'After the full update' : 'Original timeout trace', 86, 171, 25, C.teal);
  const rows = [
    ['Features', vec(g.x)],
    ['Gate inputs', vec(trace.z1, 4)],
    ['Logit', num(trace.z2, 4)],
    ['Score  p', num(trace.score, 4)],
    ['Observed target  y', num(g.y)],
    [blocked ? 'Unit 1 output weight' : 'Active output weight', '+' + num(outputWeight, 4)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 228 + i * 54;
    text(ctx, label, 86, y, 21, C.light);
    text(ctx, value, 461, y, 25, C.gold, 'right', 'Mono');
  });

  const hidden = s.at(3, 'about minus point', 0);
  const operands = [
    s.at(3, 'Multiply it by the prompt', 0),
    s.at(3, 'Multiply the same sensitivity', 0),
  ];
  const gradients = [
    s.at(3, 'prompt gradient is positive', 0),
    s.at(3, 'queue gradient is negative', 0),
  ];
  const masked = s.at(4, 'backward multiplier is zero', 0);
  const zeroGradients = s.at(4, 'Both gradients are zero', 0);
  for (const [j, y] of [238, 428].entries()) {
    const old = PARAMETERS.w1[unit][j];
    const cur = mix(old, params.w1[unit][j], t);
    const c = j ? C.green : C.violet;
    text(
      ctx,
      'Unit ' + (unit + 1) + (j ? ' queue' : ' prompt') + ' weight    x = ' + num(g.x[j]),
      528,
      y - 63,
      25,
      c,
    );
    const pos = rail(ctx, 549, y, 544, old - 0.02, old + 0.02, [old - 0.02, old, old + 0.02]);
    dot(ctx, pos(old), y, 9, C.paper, c);
    dot(ctx, pos(cur), y, 7, c);
    if (rerun) {
      text(
        ctx,
        'Starting weight   ' + num(old) + '   →   ' + num(cur, 4),
        529,
        y + 67,
        21,
        c,
        'left',
        'Mono',
      );
    } else if (blocked ? masked : operands[j]) {
      const product = 'Gradient  ' + num(g.dz1[unit], 5) + ' × (' + num(g.x[j]) + ')';
      const known = blocked ? zeroGradients : gradients[j];
      const answer = (blocked ? ' = ' : ' ≈ ') + (known ? num(g.dw1[unit][j], 4) : '?');
      text(ctx, product + answer, 529, y + 67, 21, c, 'left', 'Mono');
    }
    if (t) text(ctx, 'w = ' + num(cur, 4), 1096, y - 30, 21, c, 'right', 'Mono');
  }
  let caption = 'Which input weight should increase, and which should decrease?';
  if (s.b === 3) {
    const residual = '(' + num(g.score, 4) + ' − ' + num(g.y) + ')';
    const timesWeight = s.at(3, 'Multiply that residual', 0);
    caption = timesWeight
      ? 'Hidden sensitivity   ' +
        residual +
        ' × ' +
        num(outputWeight) +
        (hidden ? ' ≈ ' + num(g.dz1[1], 5) : ' ≈ ?')
      : 'Output residual   p − y = ' + residual;
  }
  if (blocked)
    caption = masked
      ? 'Unit 1 sensitivity   (' +
        num(g.score, 4) +
        ' − ' +
        g.y +
        ') × ' +
        num(outputWeight) +
        ' × 0 = 0'
      : 'The first gate received ' + num(g.z1[0]) + '. Which multiplier applies?';
  if (s.b >= 5) caption = 'SGD subtracts 0.1 × gradient from each starting weight.';
  if (rerun)
    caption = 'After the full SGD step     ' + num(g.score, 4) + ' → ' + num(afterSigned.score, 4);
  result(ctx, caption, C.green, { raised: true });
}
