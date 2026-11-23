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
  forward,
  differenceLamp,
  triangle,
  targetCurve,
  approximation,
  standardize,
  sigmoid,
  sigmoidBranch,
  stableBce,
} from '../../../films/neural-networks/arithmetic.mjs';
import { CASES, REQUESTS, REQUEST_IDS } from '../../../films/neural-networks/fixtures.mjs';
import { requestForward } from '../../../films/neural-networks/model.mjs';

export const scaleExample = { raw: [8, 900], means: [5, 500], spread: [2, 200], coefficient: 0.3 };
export function units(ctx, s) {
  const { raw, means, spread, coefficient } = scaleExample;
  const z = standardize(raw, means, spread),
    transformed = s.at(2, 'We change the horizontal axis', 0);
  const v = (transformed ? z : raw).map((n) => n * coefficient);
  const scaledValues = [s.at(3, 'one and a half', 0), s.at(3, 'That gives two', 0)];
  const contributions = [s.at(3, 'point four five', 0), s.at(3, 'point six', 0)];
  const max = transformed ? 0.7 : 280;
  const X = (a) => 327 + (719 * a) / max;
  text(
    ctx,
    transformed
      ? 'Contribution after training-set standardization'
      : 'Contribution in the original feature units',
    77,
    154,
    27,
  );
  for (const [i, name] of ['Queue score', 'Prompt tokens'].entries()) {
    const yy = 227 + i * 88,
      c = i ? C.violet : C.green;
    text(ctx, name, 81, yy, 23, c);
    line(ctx, X(0), yy, X(max), yy, C.grid, 3);
    if (!transformed || contributions[i]) {
      line(ctx, X(0), yy, X(v[i]), yy, c, 12);
      text(ctx, num(v[i]), X(v[i]) + 16, yy, 23, c, 'left', 'Mono');
    } else text(ctx, '?', X(0) - 25, yy, 25, c, 'right', 'Mono');
  }
  rail(ctx, X(0), 379, 719, 0, max, transformed ? [0, 0.2, 0.4, 0.6] : [0, 100, 200, 280]);
  if (transformed) {
    for (const [i, label] of ['Queue', 'Tokens'].entries()) {
      const equation = '(' + raw[i] + ' − ' + means[i] + ') / ' + spread[i] + ' = ';
      text(
        ctx,
        label + '   ' + equation + (scaledValues[i] ? num(z[i]) : '?'),
        i ? 603 : 83,
        477,
        25,
        i ? C.violet : C.green,
        'left',
        'Mono',
      );
    }
  } else
    text(ctx, 'Illustrative coefficient   0.3 for both features', 600, 480, 23, C.soft, 'center');
  result(
    ctx,
    s.b >= 4
      ? 'Reuse the fitted training statistics for validation and inference.'
      : transformed
        ? 'Contribution = standardized feature × ' + num(coefficient)
        : 'Both bars use the same ruler and the same illustrative coefficient.',
  );
}
const logit = -1000,
  target = 1;
export function finiteLoss(ctx, s) {
  face(ctx, 57, 165, 267, 272, true);
  text(ctx, 'Saved logit', 89, 213, 24, C.teal);
  text(ctx, num(logit), 89, 298, 49, C.gold, 'left', 'Mono');
  text(ctx, 'Target   ' + target, 89, 384, 25, C.light, 'left', 'Mono');
  arrow(ctx, [336, 300], [420, 300], C.soft);
  if (s.b === 1) {
    text(ctx, 'Naive sigmoid', 458, 202, 27, C.soft);
    text(ctx, '1 / (1 + exp(1000))', 455, 280, 37, C.ink, 'left', 'Mono');
    if (s.at(1, 'Python raises', 0))
      text(ctx, 'exp(1000)  →  overflow', 457, 376, 31, C.copper, 'left', 'Mono');
  } else if (s.b === 2) {
    const parts = sigmoidBranch(logit);
    text(ctx, 'Stable negative branch', 458, 201, 27, C.soft);
    text(ctx, 'exp(z) / (1 + exp(z))', 455, 277, 37, C.green, 'left', 'Mono');
    if (s.at(2, 'The score rounds', 0))
      text(
        ctx,
        num(parts.numerator) +
          ' / ' +
          num(parts.denominator) +
          ' = ' +
          num(sigmoid(logit)) +
          '   (rounded)',
        455,
        378,
        29,
        C.copper,
        'left',
        'Mono',
      );
  } else {
    text(ctx, 'Binary cross-entropy from the logit', 453, 201, 26, C.soft);
    text(ctx, 'max(z, 0) − yz', 454, 271, 38, C.green, 'left', 'Mono');
    text(ctx, '+ log1p(exp(−|z|))', 454, 329, 33, C.green, 'left', 'Mono');
    if (s.at(3, 'The large penalty', 0))
      text(
        ctx,
        '0 + ' + stableBce(logit, target) + ' + 0 = ' + stableBce(logit, target),
        455,
        414,
        32,
        C.copper,
        'left',
        'Mono',
      );
  }
  result(
    ctx,
    s.b === 1
      ? s.at(1, 'Python raises', 0)
        ? 'Python’s math.exp overflows on the positive exponent.'
        : 'Which intermediate value would the denominator need?'
      : s.b === 2
        ? s.at(2, 'The score rounds', 0)
          ? 'Taking the logarithm of the rounded zero loses information.'
          : 'Evaluate exp(z) on the negative branch.'
        : s.at(3, 'The large penalty', 0)
          ? 'The loss retains the large penalty because it still has the original logit.'
          : 'Evaluate each term using the saved logit and target.',
    C.green,
    { raised: true },
  );
}
export const scores = REQUESTS.map((x) => requestForward(x).score);
export const routes = (threshold) => scores.map((p) => p >= threshold);
export const bucket = Array.from({ length: 100 }, (_, i) => (37 * i) % 100 < 93);
export function policy(ctx, s) {
  if (s.b <= 2) {
    const t = s.at(2, 'Slide the line', 1.1),
      threshold = mix(0.6, 0.62, t);
    const X = (x) => 330 + (625 * (x - 0.38)) / (0.67 - 0.38);
    text(ctx, 'Request', 81, 151, 23, C.soft);
    text(ctx, 'Score', 299, 151, 23, C.soft, 'right');
    text(ctx, 'Routing threshold', 613, 151, 23, C.violet);
    const route = routes(threshold);
    scores.forEach((value, i) => {
      const y = 224 + i * 70;
      text(ctx, REQUEST_IDS[i], 82, y, 25, C.ink, 'left', 'Mono');
      line(ctx, X(0.38), y, X(0.67), y, C.grid, 2);
      dot(ctx, X(value), y, 9, route[i] ? C.copper : C.green);
      text(ctx, num(value, 4), 299, y, 21, C.ink, 'right', 'Mono');
      text(ctx, route[i] ? 'slow' : 'fast', 1088, y, 25, route[i] ? C.copper : C.green, 'center');
    });
    line(ctx, X(threshold), 194, X(threshold), 459, C.violet, 4);
    text(ctx, num(threshold, 4), X(threshold), 488, 25, C.violet, 'center', 'Mono');
    result(
      ctx,
      s.b === 1
        ? 'Which request changes route if the threshold rises from 0.60 to 0.62?'
        : t < 1
          ? 'Raise the threshold and follow CA-208.'
          : 'The boundary moves. CA-208 now takes the fast path with the same score.',
    );
  } else {
    const inspected = Math.round(100 * s.at(3, 'Check their outcomes', 1.9));
    let observed = 0;
    for (let i = 0; i < 100; i++) {
      const known = i < inspected,
        timed = bucket[i];
      if (known && timed) observed++;
      const x = 126 + (i % 10) * 34,
        y = 157 + Math.floor(i / 10) * 35;
      box(ctx, x, y, 26, 26, known ? (timed ? C.copper : '#dae4d4') : C.paper, C.rim, 5);
    }
    reading(ctx, 'Assigned score', '0.93', 592, 161, C.green, 45);
    reading(
      ctx,
      'Verified timeouts',
      inspected ? observed + ' / ' + inspected : 'Awaiting outcomes',
      592,
      275,
      C.copper,
      inspected ? 43 : 32,
    );
    if (inspected === 100)
      reading(ctx, 'Observed frequency', num(observed / inspected), 592, 389, C.copper, 43);
    result(ctx, 'One held-out bucket gives a sample frequency. Check other score ranges too.');
  }
}
export function sampledError(segments) {
  let error = 0;
  for (let i = 0; i <= 400; i++) {
    const x = i / 100;
    error = Math.max(error, Math.abs(approximation(x, segments) - targetCurve(x)));
  }
  return error;
}
export function basis(ctx, s) {
  const one = s.b === 1;
  const p = plot(
    ctx,
    [107, 165, 683, 321],
    [0, 4],
    one ? [-2, 2] : [0, 1],
    [0, 1, 2, 3, 4],
    one ? [-2, -1, 0, 1, 2] : [0, 0.5, 1],
  );
  if (one) {
    const g = Math.round(s.at(1, 'Add a third shifted ReLU', 1.5) * 100) / 100;
    const two = (x) => Math.max(0, x) - 2 * Math.max(0, x - 1);
    p.curve(two, C.rim, 3);
    p.curve((x) => g * Math.max(0, x - 2), C.violet, 3);
    p.curve((x) => two(x) + g * Math.max(0, x - 2), C.copper, 6);
    reading(ctx, 'Weighted third hinge', num(g) + ' × ReLU(x−2)', 813, 210, C.violet, 27);
    reading(ctx, 'Peak height', '1', 834, 338, C.copper, 39);
    result(ctx, 'Sum = ReLU(x) − 2 ReLU(x − 1) + ' + num(g) + ' × ReLU(x − 2)');
  } else {
    const r = s.at(3, 'Make the spacing finer', 2),
      n = r > 0.66 ? 8 : r > 0.16 ? 4 : 2;
    const progress = s.at(2, 'Place shifted triangles', 1.5);
    const h = 4 / n;
    p.curve(targetCurve, C.soft, 3);
    for (let i = 1; i < n; i++)
      p.curve(
        (x) => (targetCurve(i * h) - 0.2) * triangle((x - (i - 1) * h) / h),
        C.violet,
        2,
        Math.max(0, (i - 1) * h),
        Math.min(4, (i + 1) * h),
      );
    p.curve((x) => approximation(x, n), C.copper, 5, 0, 4 * progress);
    for (let i = 0; i <= n * progress; i++) p.mark(i * h, approximation(i * h, n), C.copper, 5);
    reading(ctx, 'Straight segments', String(n), 835, 183, C.green);
    if (progress === 1) reading(ctx, 'Max grid error', num(sampledError(n), 4), 835, 318, C.copper);
    result(
      ctx,
      'Gray target     •     Violet basis contributions     •     Copper sum, including baseline 0.2',
    );
  }
}
export const arch = (x, amplitude = 1) => x + amplitude * 4 * x * (1 - x);
export const fitProbe = 0.5;
export function limits(ctx, s) {
  if (s.b <= 2) {
    const p = plot(ctx, [107, 176, 556, 291], [0, 4], [0, 1], [0, 1, 2, 3, 4], [0, 0.5, 1]);
    p.curve(targetCurve, C.soft, 4);
    p.curve((x) => approximation(x, 8), C.copper, 3);
    text(ctx, 'A continuous target on a compact domain', 704, 216, 22, C.soft);
    text(ctx, 'One hidden layer with biases', 704, 283, 24, C.green);
    text(ctx, 'Continuous, non-polynomial activation', 704, 339, 22, C.green);
    text(ctx, 'Linear output', 704, 395, 24, C.green);
    result(ctx, 'Sufficient width permits uniformly small error over the whole domain.');
  } else if (s.b <= 4) {
    const n =
      1 +
      Number(s.at(3, 'Add another squared unit', 0.5) > 0) +
      Number(s.at(3, 'then another', 0.5) > 0);
    const coeff = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const a = i + 1,
        b = 1 - i;
      coeff[0] += a * a;
      coeff[1] += 2 * a * b;
      coeff[2] += b * b;
      const y = 198 + i * 92;
      box(ctx, 90, y - 30, 376, 61, C.paper, C.rim);
      text(
        ctx,
        '(' + num(a) + 'x ' + (b < 0 ? '−' : '+') + ' ' + num(Math.abs(b)) + ')²',
        278,
        y,
        27,
        C.green,
        'center',
        'Mono',
      );
      path(
        ctx,
        [
          [466, y],
          [550, y],
          [618, 295],
        ],
        C.rim,
        3,
      );
    }
    face(ctx, 623, 210, 493, 176, true);
    text(ctx, 'Collected powers', 655, 251, 23, C.teal);
    const poly =
      num(coeff[0]) +
      'x² ' +
      (coeff[1] < 0 ? '−' : '+') +
      ' ' +
      num(Math.abs(coeff[1])) +
      'x + ' +
      num(coeff[2]);
    text(ctx, poly, 655, 323, 34, C.gold, 'left', 'Mono');
    result(
      ctx,
      s.b === 3
        ? 'A sum of squared affine units still has degree at most two.'
        : 'At any width, a linear sum of degree-d units has degree at most d.',
    );
  } else {
    const amp = s.at(5, 'Now bow the line', 1.6),
      t = fitProbe;
    const p = plot(
      ctx,
      [107, 163, 588, 326],
      [0, 1],
      [0, 1.6],
      [0, 0.25, 0.5, 0.75, 1],
      [0, 0.5, 1, 1.5],
    );
    p.curve((x) => x, C.green, 4);
    p.curve((x) => arch(x, amp), C.violet, 4);
    p.mark(0, 0, C.gold);
    p.mark(1, 1, C.gold);
    if (s.at(5, 'Read them halfway', 0)) {
      path(ctx, [p.p(t, t), p.p(t, arch(t, amp))], C.copper, 2);
      p.mark(t, t, C.green);
      p.mark(t, arch(t, amp), C.violet);
      reading(
        ctx,
        'Straight fit at ' + num(t),
        s.at(5, 'one half', 0) ? num(t) : '?',
        753,
        185,
        C.green,
      );
      reading(
        ctx,
        'Bowed fit at ' + num(t),
        s.at(5, 'one and a half', 0) ? num(arch(t, amp)) : '?',
        753,
        326,
        C.violet,
      );
    }
    result(ctx, 'Both functions pass through the two endpoint observations.', C.green, {
      raised: true,
    });
  }
}

export const probe = [0.8, 0.5];
export const cornerBrightness = [0, 1, 1, 0];

function lampSettings(ctx, point, atCorner, measure) {
  face(ctx, 58, 123, 378, 410);
  text(ctx, 'Dimmer settings', 247, 161, 27, C.ink, 'center');
  const { p } = plot(ctx, [146, 196, 234, 234], [0, 1], [0, 1], [0, 0.5, 1], [0.5, 1]);
  text(ctx, 'A', 263, 473, 24, C.ink, 'center');
  text(ctx, 'B', 90, 313, 24, C.ink, 'center');
  if (point) {
    const [a, b] = point;
    const [x, y] = p(a, b);
    if (!atCorner) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      path(ctx, [p(0, b), [x, y], p(a, 0)], C.green, 2);
      ctx.restore();
    }
    dot(ctx, x, y, measure ? 21 : 17, C.light, C.green);
    if (!atCorner) dot(ctx, x, y, 7, C.green);
    text(ctx, 'A = ' + num(a) + '    B = ' + num(b), 247, 508, 24, C.green, 'center', 'Mono');
  }
  for (const [i, corner] of CASES.entries()) {
    dot(ctx, ...p(...corner), 9, cornerBrightness[i] ? C.gold : C.face, C.ink);
  }
}

export function finalProbe(ctx, s) {
  const showProbe = s.after(1, 'Set the first dimmer to point eight and the second to point five');
  const showHinges = s.after(2, 'The hinges give one point three and point three', 'one point three');
  const showSum = s.after(2, 'That puts the lamp at point seven', 'point seven');
  const showGap = s.after(5, 'Their gap is point three', 'point three. Put the two predictions');
  const replay = s.at(3, 'Try the four corners', 2.4);
  const backAtProbe = s.after(4, 'Now put the dimmers back at point eight and point five');
  const atCorner = replay > 0 && !backAtProbe;
  const cornerIndex = Math.min(CASES.length - 1, Math.floor(replay * CASES.length));
  const point = atCorner ? CASES[cornerIndex] : probe;
  const measure = s.after(6, 'Measure here, between the corners');
  const sum = forward(point);
  const gap = differenceLamp(point);
  lampSettings(ctx, showProbe ? point : null, atCorner, measure);

  const startX = 710;
  const scaleWidth = 390;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  text(ctx, 'Brightness', startX + scaleWidth / 2, 131, 28, C.ink, 'center');
  const brightnessX = rail(ctx, startX, 160, scaleWidth, 0, 1, ticks);
  for (const tick of ticks) {
    line(ctx, brightnessX(tick), 202, brightnessX(tick), 485, C.grid, 1);
  }
  const rows = [
    { label: 'Sum circuit', value: showSum ? sum.y : null, color: C.copper },
    { label: 'Gap circuit', value: atCorner || showGap ? gap.y : null, color: C.violet },
    { label: 'Real lamp', value: atCorner ? cornerBrightness[cornerIndex] : null, color: C.green },
  ];
  for (const [i, { label, value, color }] of rows.entries()) {
    if (i === 1 && !s.at(3, 'Someone else wired a second circuit', 0)) continue;
    if (i === 2 && !s.at(3, 'Try the four corners', 0)) continue;
    const y = 252 + 108 * i;
    text(ctx, label, 482, y, 27, color);
    line(ctx, startX, y, startX + scaleWidth, y, C.rim, 2);
    if (value === null) {
      text(ctx, i === 2 ? 'Unmeasured' : 'Predict', 482, y + 30, 23, color);
    } else {
      const x = brightnessX(value);
      line(ctx, startX, y, x, y, color, 8);
      dot(ctx, x, y, 8, color, C.light);
      text(ctx, num(value), x, y - 28, 28, color, 'center', 'Mono');
    }
  }

  const formula = (words, y, color) => text(ctx, words, startX, y, 21, color, 'left', 'Mono');
  const subtract = s.at(2, 'Subtract twice the second', 0);
  if (subtract) {
    const operands = s.b === 2 ? ' = ' + num(sum.h[0]) + ' − 2 × ' + num(sum.h[1]) : '';
    formula('h₁ − 2h₂' + operands, 282, C.copper);
  } else {
    if (s.at(1, 'Our first hinge counts their sum', 0)) {
      formula('h₁ = ReLU(A + B)' + (showHinges ? ' = ' + num(sum.h[0]) : ''), 282, C.copper);
    }
    if (s.at(1, 'The second counts', 0)) {
      formula('h₂ = ReLU(A + B − 1)' + (showHinges ? ' = ' + num(sum.h[1]) : ''), 312, C.copper);
    }
  }
  if (s.at(3, 'One hidden unit keeps', 0)) {
    const secondTerm = s.at(3, 'The other keeps', 0) ? ' + ReLU(B − A)' : '';
    formula('ReLU(A − B)' + secondTerm, 393, C.violet);
  }

  if (measure) {
    result(ctx, 'Measure the real lamp at this setting.');
  } else if (atCorner) {
    result(ctx, 'Compare each prediction with the observed corner reading.');
  } else if (showGap) {
    result(ctx, 'Which setting would tell the two circuits apart?');
  } else if (backAtProbe) {
    result(ctx, 'What brightness does the gap circuit predict?');
  } else if (!showSum && s.at(1, 'What brightness would those two hidden values give', 0)) {
    result(ctx, 'What brightness does the sum circuit predict?');
  } else if (s.b === 1) {
    result(ctx, 'The four corner dots record the switch readings.');
  }
}
