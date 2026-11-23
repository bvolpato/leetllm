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
  lamp,
  switchLever,
} from './bench.mjs';
import { forward, sigmoid } from '../../../films/neural-networks/arithmetic.mjs';
import { PARAMETERS } from '../../../films/neural-networks/fixtures.mjs';
import { requestForward, affineWitness } from '../../../films/neural-networks/model.mjs';

const cases = [
  [1, 0],
  [0, 0],
  [0, 1],
  [1, 1],
];
export function switches(ctx, s) {
  const visited = [
    s.at(1, 'Turn A off', 0),
    s.at(1, 'Now turn B on', 0),
    s.at(2, 'Flip A', 0),
  ].filter(Boolean).length;
  const pair = cases[visited];
  face(ctx, 58, 134, 478, 401);
  lamp(ctx, 295, 298, forward(pair).y, 1.38);
  path(
    ctx,
    [
      [166, 366],
      [166, 332],
      [265, 332],
    ],
    C.soft,
    4,
  );
  path(
    ctx,
    [
      [423, 366],
      [423, 332],
      [324, 332],
    ],
    C.soft,
    4,
  );
  switchLever(ctx, 167, 410, pair[0], 'A');
  switchLever(ctx, 423, 410, pair[1], 'B');
  const x = (a) => 728 + 278 * a,
    y = (b) => 469 - 268 * b;
  const corner = (a, b) => [x(a), y(b)];
  box(ctx, x(0), y(1), 278, 268, '#fffaeb', C.rim, 2);
  if (s.at(2, 'Make the shaded side', 0) && s.b < 4) {
    path(
      ctx,
      [
        [0, 0.5],
        [0, 1],
        [1, 1],
        [1, 0],
        [0.5, 0],
      ].map((p) => corner(...p)),
      null,
      0,
      '#e9c882',
    );
    path(ctx, [corner(0, 0.5), corner(0.5, 0)], C.copper, 3);
  }
  const lightJoin = s.at(4, 'Join the two lit settings', 1.1);
  const darkJoin = s.at(4, 'Now join the dark settings', 1.1);
  if (lightJoin) path(ctx, [corner(0, 1), corner(lightJoin, 1 - lightJoin)], C.copper, 5);
  if (darkJoin) path(ctx, [corner(0, 0), corner(darkJoin, darkJoin)], C.green, 5);
  if (darkJoin === 1) dot(ctx, ...corner(0.5, 0.5), 9, C.light, C.ink);
  for (const [i, [a, b]] of cases.entries()) {
    const [px, py] = corner(a, b);
    dot(ctx, px, py, 13, i > visited ? C.paper : forward([a, b]).y ? C.gold : C.face, C.ink);
    text(ctx, '(' + a + ', ' + b + ')', px, py + (b ? -30 : 31), 20, C.ink, 'center', 'Mono');
  }
  const [px, py] = corner(...pair);
  ctx.beginPath();
  ctx.arc(px, py, 21, 0, 2 * Math.PI);
  ctx.strokeStyle = C.copper;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'Switch A →', 865, 535, 22, C.soft, 'center');
  text(ctx, 'B ↑', 670, 330, 20, C.soft, 'center');
  result(
    ctx,
    s.b >= 4
      ? 'A straight cut must keep the segment between two points on the same side.'
      : s.b >= 3
        ? 'Both switches on     •     cut predicts light     •     bulb is dark'
        : 'Which switch settings light the bulb?',
  );
}

export function cascade(ctx, s) {
  const x = 4,
    h = 2 * x + 1,
    y = 3 * h - 2;
  const showH = s.at(1, 'A second layer', 0),
    showY = s.at(1, 'Could one scale', 0);
  const stages = [
    ['Input', x, true],
    ['Double, then add 1', h, showH],
    ['Triple, then subtract 2', y, showY],
  ];
  stages.forEach(([label, value, visible], i) => {
    const left = 68 + i * 385;
    face(ctx, left, 171, 286, 171, i === 2);
    text(ctx, label, left + 143, 208, 22, i === 2 ? C.teal : C.soft, 'center');
    text(
      ctx,
      visible ? value : '?',
      left + 143,
      278,
      64,
      i === 2 ? C.gold : C.green,
      'center',
      'Mono',
    );
    if (i < 2) arrow(ctx, [left + 297, 256], [left + 369, 256], C.soft);
  });
  if (s.at(2, 'six times the input', 0)) {
    path(
      ctx,
      [
        [210, 352],
        [210, 424],
        [981, 424],
        [981, 360],
      ],
      C.copper,
      3,
    );
    box(ctx, 397, 389, 398, 68, C.paper, C.copper);
    text(ctx, '6 × ' + x + ' + 1 = ' + y, 596, 423, 36, C.copper, 'center', 'Mono');
  }
  result(
    ctx,
    s.at(2, 'Matrix layers collapse', 0)
      ? 'Merged weight   W₂W₁       Merged bias   W₂b₁ + b₂'
      : s.b === 2
        ? s.at(2, 'six times the input', 0)
          ? '3(2x + 1) − 2  =  6x + 1'
          : 'Substitute h = 2x + 1 into 3h − 2.'
        : 'Follow the same value through both operations.',
  );
}
export function hinges(ctx, s) {
  const definition = s.b === 1
    && s.at(1, 'returns zero for anything below zero', 0, { captionStart: false })
    && !s.at(1, 'With both switches off', 0, { captionStart: false });
  const first = (a) => Math.max(0, a);
  const unit = (a) => Math.max(0, a - 1);
  const second = s.at(2, 'Subtract one', 1);
  const weight = 2 * s.at(3, 'Turn up the subtraction', 1.8);
  const n = s.b >= 4 ? 1 : s.at(1, 'Turn one on', 0.65) + s.at(1, 'Turn on both', 0.65);
  const output = (a) => first(a) - weight * unit(a);
  const p = plot(
    ctx,
    [112, 164, 570, 321],
    [definition ? -1 : 0, 2],
    [0, 2.1],
    definition ? [-1, 0, 1, 2] : [0, 1, 2],
    [0, 1, 2],
  );
  p.curve(first, C.green, 4);
  if (second) p.curve(unit, C.violet, 4, 0, 2 * second);
  if (weight > 0) p.curve(output, C.copper, 7);
  if (definition) p.mark(0, 0, C.green, 8);
  else if (s.b < 4 || s.at(5, "That's a prediction", 0)) p.mark(n, output(n), C.copper, 9);
  text(ctx, definition ? 'Input sum s' : 'Sum of switch settings', 395, 535, 22, C.soft, 'center');
  reading(ctx, 'First hinge', 'max(0, s)', 766, 170, C.green, 31);
  if (second) reading(ctx, 'Delayed hinge', 'max(0, s − 1)', 766, 269, C.violet, 31);
  if (weight > 0)
    reading(ctx, 'Combined response', 'h₁ − ' + num(weight, 2) + 'h₂', 766, 370, C.copper, 33);
  const switchNote = definition
    ? 'Zero on the negative side. The positive side keeps the input.'
    : 'Count the switches that are on.';
  const subtractionNote = weight === 2
    ? 'At a sum of two, the hinges cancel and the lamp goes dark.'
    : 'Turn the second hinge’s multiplier up to two.';
  result(
    ctx,
    s.b === 4
      ? 'A = 0.5     B = 0.5     What brightness would you predict?'
      : s.b === 5 && !s.at(5, "That's a prediction", 0)
        ? 'A + B = 1. Read the height of each hinge.'
        : s.b === 5
          ? 'At the midpoint, h₁ = 1 and h₂ = 0. The model predicts full light.'
          : s.b === 1
            ? switchNote
            : s.b === 3
              ? subtractionNote
              : 'Move the second hinge one switch setting to the right.',
  );
}
export const risk = ([a, b]) => {
  const terms = [a * 0.7, b * 0.3, -4];
  const z = terms.reduce((sum, v) => sum + v, 0);
  return { terms, z, p: sigmoid(z) };
};
export function scorer(ctx, s) {
  const load = risk([6, 8]),
    quiet = risk([2, 3]);
  const build = [
    s.at(1, 'Six times point seven', 0.8),
    s.at(1, 'Eight times point three', 0.8),
    s.at(2, 'Add the bias', 1.2),
  ];
  const named = [s.at(1, 'four point two', 0), s.at(1, 'two point four', 0), true];
  const pos = rail(ctx, 136, 466, 914, -4, 8, [-4, -2, 0, 2, 4, 6, 8]);
  let sum = 0;
  for (const [i, v] of load.terms.entries()) {
    const y = 203 + i * 83,
      to = sum + v * build[i],
      c = [C.green, C.violet, C.copper][i];
    text(
      ctx,
      ['Prompt   6 × 0.7', 'Queue    8 × 0.3', 'Bias      −4'][i],
      88,
      y - 35,
      23,
      c,
      'left',
      'Mono',
    );
    if (build[i] > 0) {
      arrow(ctx, [pos(sum), y], [pos(to), y], c, 8);
      if (build[i] === 1 && named[i])
        text(
          ctx,
          (v > 0 ? '+' : '') + num(v),
          mix(pos(sum), pos(to), 0.5),
          y - 22,
          22,
          c,
          'center',
          'Mono',
        );
      line(ctx, pos(to), y + 8, pos(to), i === 2 ? 461 : y + 64, C.rim, 1);
    }
    sum += v;
  }
  if (build[1] === 1 && s.at(1, 'six point six', 0))
    text(
      ctx,
      'subtotal  ' + num(load.terms[0] + load.terms[1]),
      pos(load.terms[0] + load.terms[1]),
      324,
      19,
      C.ink,
      'center',
      'Mono',
    );
  if (s.at(3, 'We can use a threshold', 0)) {
    dot(ctx, pos(quiet.z), 466, 8, C.green);
    text(ctx, 'quiet   ' + num(quiet.z), pos(quiet.z), 522, 23, C.green, 'center', 'Mono');
  }
  if (s.b === 3) {
    dot(ctx, pos(load.z), 466, 9, C.copper);
    text(ctx, 'z = ' + num(load.z), pos(load.z), 522, 25, C.copper, 'center', 'Mono');
  }
  result(
    ctx,
    s.at(3, 'We can use a threshold', 0)
      ? 'High load   ' +
          num(load.p) +
          '          Quiet request   ' +
          num(quiet.p) +
          '          Alert threshold   0.5'
      : s.at(3, 'The quiet request', 0)
        ? 'Sigmoid(2.6) = ' + num(load.p)
        : 'The logit adds signed contributions on a common scale.',
  );
}

export function forwardTrace(ctx, s) {
  const trace = requestForward([2, 5]);
  const rows = [s.at(1, 'one tenth', 0), s.at(2, 'three point two', 0)];
  text(ctx, 'Request CA-104', 61, 177, 26, C.ink);
  text(ctx, '[2, 5]', 62, 238, 38, C.green, 'left', 'Mono');
  for (const [i, y] of [238, 406].entries()) {
    const c = i ? C.violet : C.green;
    path(
      ctx,
      [
        [207, 255],
        [265, 255],
        [318, y],
      ],
      c,
      3,
    );
    face(ctx, 321, y - 72, 420, 135);
    text(ctx, 'Hidden unit ' + (i + 1), 346, y - 39, 20, c);
    text(
      ctx,
      i ? '2 × 0.1  +  5 × 0.6' : '2 × 0.3  −  5 × 0.1',
      346,
      y + 2,
      25,
      C.ink,
      'left',
      'Mono',
    );
    text(ctx, 'ReLU  →  ' + (rows[i] ? num(trace.h[i]) : '?'), 346, y + 40, 21, c, 'left', 'Mono');
    path(
      ctx,
      [
        [741, y],
        [786, y],
        [833, 318],
      ],
      c,
      3,
    );
    text(ctx, '× ' + num(PARAMETERS.w2[i]), 780, y + (i ? 32 : -32), 21, c, 'center');
  }
  face(ctx, 835, 231, 285, 181, true);
  text(ctx, 'Bias   −0.5', 977, 264, 20, C.teal, 'center', 'Mono');
  text(
    ctx,
    s.at(3, 'minus point one four', 0) ? num(trace.z2) : '?',
    977,
    331,
    53,
    C.gold,
    'center',
    'Mono',
  );
  text(ctx, 'output logit', 977, 384, 20, C.light, 'center');
  result(
    ctx,
    s.at(3, 'point four six five', 0)
      ? 'Score = sigmoid(' + num(trace.z2) + ') ≈ ' + num(trace.score)
      : 'One row of weights belongs to one hidden unit.',
  );
}
export function witness(ctx, s) {
  const w = affineWitness();
  if (s.b <= 2) {
    const ops = [
      ['Input', 'x'],
      ['First layer', 'W₁x + b₁'],
      ['Second layer', 'W₂h + b₂'],
    ];
    ops.forEach(([name, v], i) => {
      const x = 87 + i * 387;
      face(ctx, x, 180, 245, 143);
      text(ctx, name, x + 122, 213, 21, C.soft, 'center');
      text(ctx, v, x + 122, 266, 30, C.green, 'center', 'Mono');
      if (i < 2) arrow(ctx, [x + 260, 252], [x + 359, 252], C.soft);
    });
    text(ctx, '(W₂W₁)x  +  (W₂b₁ + b₂)', 600, 421, 42, C.copper, 'center', 'Mono');
    result(
      ctx,
      s.b === 2
        ? 'The rank of the merged weight matrix is limited by its narrowest factor.'
        : 'With both gates removed, the second layer also multiplies the first bias.',
    );
    return;
  }
  const showOpp = s.at(4, 'Now reverse', 0.5),
    showZero = s.at(4, 'Finally', 0.5);
  const vals = [w.positive, w.negative, w.zero];
  ['[1, 4]', '[−1, −4]', '[0, 0]'].forEach((label, i) => {
    const x = 79 + i * 377;
    face(ctx, x, 151, 285, 135);
    text(ctx, label, x + 142, 186, 24, C.soft, 'center', 'Mono');
    text(
      ctx,
      [true, showOpp, showZero][i] ? num(vals[i]) : '?',
      x + 142,
      241,
      38,
      C.green,
      'center',
      'Mono',
    );
  });
  const pos = rail(ctx, 170, 444, 852, -1.2, 0, [-1.2, -1, -0.8, -0.6, -0.4, -0.2, 0]);
  const show = s.at(5, 'That gap rules', 0);
  if (show) {
    dot(ctx, pos(w.pair), 444, 10, C.copper);
    dot(ctx, pos(w.doubleZero), 444, 10, C.violet);
    text(ctx, 'sum  ' + num(w.pair), pos(w.pair), 379, 25, C.copper, 'center');
    text(ctx, 'twice f(0)  ' + num(w.doubleZero), pos(w.doubleZero), 411, 23, C.violet, 'center');
  }
  result(
    ctx,
    show
      ? 'The two readings differ by ' +
          num(w.pair - w.doubleZero) +
          '. The gated network violates the affine identity.'
      : 'For every affine map, f(x) + f(−x) = 2f(0).',
  );
}
