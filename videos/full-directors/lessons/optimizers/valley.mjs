import { RUNS, UNSAFE, PRESCRIBED } from '../../../films/optimizers/fixtures.mjs';
import { loss } from '../../../films/optimizers/arithmetic.mjs';
import {
  C,
  f,
  pair,
  cue,
  mix,
  face,
  head,
  label,
  number,
  note,
  rail,
  line,
  box,
  circle,
  poly,
  pin,
  wash,
  plot,
} from './instrument.mjs';

function profile(c, { x, w, base, h, k, a, start = 1, color, tangent = false, trail = [] }) {
  const X = (t) => x + (w * (t + 1.15)) / 2.3,
    Y = (t) => base - h * (k / 100) * t * t;
  const pts = Array.from({ length: 125 }, (_, i) => {
    const t = -1.15 + (2.3 * i) / 124;
    return [X(t), Y(t)];
  });
  poly(
    c,
    [...pts, [x + w, base + 27], [x, base + 27]],
    wash(c, 0, base - h, 0, base + 28, ['#d9ad72', '#ba8460', '#8b6353']),
  );
  c.save();
  c.beginPath();
  pts.forEach(([xx, yy], i) => (i ? c.lineTo(xx, yy) : c.moveTo(xx, yy)));
  c.lineTo(x + w, base + 27);
  c.lineTo(x, base + 27);
  c.closePath();
  c.clip();
  for (let i = 0; i < 46; i++)
    line(c, x, base + 26 - i * 4, x + w, base + 24 - i * 4, 'rgba(255,231,190,0.17)', 0.7);
  c.restore();
  c.beginPath();
  pts.forEach(([xx, yy], i) => (i ? c.lineTo(xx, yy) : c.moveTo(xx, yy)));
  c.strokeStyle = '#845535';
  c.lineWidth = 3;
  c.stroke();
  for (let i = -1; i <= 1; i += 0.1) {
    const xx = X(i);
    line(c, xx, base + 28, xx, base + 36, C.steel);
  }
  for (const v of [-1, 0, 1]) label(c, f(v), X(v), base + 54, 16, C.soft, 'center', 'Mono');
  line(c, X(0), base - 30, X(0), base + 25, C.soft);
  for (const v of trail)
    poly(
      c,
      [
        [X(v) - 4, Y(v) - 3],
        [X(v) + 4, Y(v) - 3],
        [X(v), Y(v) + 4],
      ],
      C.caseDark,
    );
  for (const step of [4, 5]) {
    if (trail.length < step) continue;
    const v = trail[step - 1],
      xx = X(v),
      yy = Y(v);
    line(c, xx, yy + 4, xx, yy + 14, C.ink, 1);
    label(c, step, xx, yy + 26, 15, C.caseDark, 'center', 'Mono');
  }
  circle(c, X(start), Y(start), 7, C.paper, color);
  if (tangent)
    line(
      c,
      X(0.83),
      Y(1) + ((h * k) / 100) * 0.34,
      X(1.12),
      Y(1) - ((h * k) / 100) * 0.24,
      C.gold,
      4,
    );
  const xx = X(a),
    yy = Y(a);
  box(c, xx - 7, yy - 43, 14, 25, wash(c, xx - 7, 0, xx + 7, 0, [color, '#e2e7d6', color]));
  poly(
    c,
    [
      [xx - 6, yy - 18],
      [xx + 6, yy - 18],
      [xx, yy - 2],
    ],
    C.ink,
  );
  circle(c, xx, yy, 4, color);
}
function first(c, q, opening) {
  const b = q.beat.beatIndex + 1,
    r = RUNS.sgd.records[0];
  if (!opening && b >= 5) {
    const n = 1 + Number(cue(q, 5, 'Subtracting it') > 0.5);
    face(
      c,
      'Measure the slope again',
      'Full gradient   ·   L = (100a² + b²) / 2   ·   learning rate 0.018',
    );
    const points = RUNS.sgd.points.slice(0, n + 1);
    plot(c, {
      x: 120,
      y: 177,
      w: 653,
      h: 274,
      xmax: 2,
      ymin: -1,
      ymax: 1.2,
      series: [
        { values: points.map((v) => v.x), color: C.blue, dots: true },
        { values: points.map((v) => v.y), color: C.green, dots: true },
      ],
      ticks: [-1, 0, 1],
      xticks: [0, 1, 2],
    });
    head(c, 'Update ' + n, 836, 205);
    number(c, 'a  ' + f(points.at(-1).x), 836, 274, C.blue);
    number(c, 'b  ' + f(points.at(-1).y), 836, 334, C.green);
    label(c, 'Completed updates', 445, 503, 20, C.soft, 'center');
    note(
      c,
      n === 1
        ? 'The next slope for a is −80. Which way will it move?'
        : 'Subtracting a negative gradient sends a back to the right.',
      b === 6
        ? 'A random minibatch supplies an estimate of this full gradient.'
        : 'The green trace still slopes toward zero.',
    );
    return;
  }
  const p = opening
    ? cue(q, 1, 'Release the two carriages', 1.6)
    : cue(q, 3, 'Release the carriages', 1.5);
  face(
    c,
    opening ? 'Which carriage crosses zero?' : 'Read the two slopes',
    'Starting errors (1, 1)   ·   same horizontal and loss scales   ·   rate 0.018',
  );
  [0, 1].forEach((j) => {
    const col = j ? C.green : C.blue,
      x = j ? 634 : 78,
      a = mix(1, r.next[j], p);
    head(c, j ? 'b   ·   shallow coordinate' : 'a   ·   steep coordinate', x, 161, col);
    profile(c, { x, w: 483, base: 397, h: 126, k: j ? 1 : 100, a, color: col, tangent: !opening });
    number(c, (p === 0 ? 'start  ' : 'position  ') + f(a), x, 502, col, 27);
    if (opening || j === 0 || b > 1)
      label(c, j ? 'initial slope  1' : 'initial slope  100', x, 207, 21, C.ink);
  });
  note(
    c,
    opening
      ? p === 0
        ? 'Release both from the same mark.'
        : p < 1
          ? 'Read both tips against their starting rings.'
          : 'The distance traveled differs by a factor of 100.'
      : b === 4
        ? 'Curvatures 100 and 1 give this quadratic a condition number of 100.'
        : 'Each subtraction is the learning rate times that coordinate’s slope.',
    opening
      ? 'Height measures the loss from one coordinate. The target sits at zero.'
      : p === 1
        ? 'L = 50a² + ½b²     ·     total loss 50.5 → ' + f(r.loss)
        : 'Steep subtraction   0.018 × 100      ·      shallow subtraction   0.018 × 1',
  );
}
export function opening(c, q) {
  first(c, q, true);
}
export function slopes(c, q) {
  first(c, q, false);
}
export function stability(c, q) {
  const b = q.beat.beatIndex + 1,
    run = b === 1 ? RUNS.sgd : UNSAFE;
  const n =
    b === 1
      ? Math.floor(8 * cue(q, 1, 'Follow eight', 4))
      : Math.floor(8 * cue(q, 3, 'Run the larger rate', 4));
  face(
    c,
    'Eight marks on the same scale',
    'Quadratic loss   ·   reset at (1, 1)   ·   steep error after each completed update',
  );
  const series = [
    {
      values: RUNS.sgd.points.slice(0, (b === 1 ? n : 8) + 1).map((p) => p.x),
      color: C.blue,
      dots: true,
    },
  ];
  if (b > 1)
    series.push({
      values: UNSAFE.points.slice(0, n + 1).map((p) => p.x),
      color: C.copper,
      dots: true,
    });
  const { px, py } = plot(c, {
    x: 115,
    y: 168,
    w: 683,
    h: 297,
    xmax: 8,
    ymin: -2.25,
    ymax: 2.25,
    ticks: [-2, -1, 0, 1, 2],
    xticks: [0, 2, 4, 6, 8],
    series,
  });
  if (cue(q, 3, 'With rate point zero two one', 0)) {
    const showFactor = cue(q, 3, 'point one', 0.35) === 1;
    label(c, 'Completed updates', (px(0) + px(8)) / 2, 516, 23, C.ink, 'center');
    for (const [trace, color] of [[RUNS.sgd, C.blue], [UNSAFE, C.copper]]) {
      const end = trace.points[n].x;
      const y = py(end);
      const rate = trace.records[0].eta;
      const factor = 1 - 100 * rate;
      line(c, px(n) + 7, y, 821, y, color, 2);
      number(c, 'η = ' + f(rate), 830, y + 9, color, 31);
      number(c, '1 − 100 × ' + f(rate), 830, y + 44, C.ink, 25);
      if (showFactor) number(c, '= ' + f(factor), 830, y + 79, color, 29);
    }
    let rule = 'a after one step = (1 − 100η) × a before the step';
    if (cue(q, 3, 'To shrink the error', 0)) {
      rule = 'Size of the multiplier    |1 − 100η|';
      if (cue(q, 3, 'be below one', 0.55) === 1) rule = 'The steep error shrinks when   |1 − 100η| < 1';
      // The upper bound is spoken near the end of the existing rate-interval caption.
      if (cue(q, 3, 'The rate must lie', 2.4) === 1) rule += '    ⇒    0 < η < 0.02';
    }
    label(c, rule, 49, 555, 33, C.cream);
    return;
  }
  head(c, 'Completed updates', 850, 189);
  number(c, n + ' / 8', 850, 239);
  label(c, 'η = 0.018', 850, 300, 24, C.blue);
  if (b > 1) label(c, 'η = 0.021', 850, 342, 24, C.copper);
  number(c, 'a  ' + f(run.points[n].x), 850, 420, b === 1 ? C.blue : C.copper);
  number(c, 'b  ' + f(run.points[n].y), 850, 466, C.green);
  note(
    c,
    b === 1
      ? n === 0
        ? 'Release the first run at rate 0.018.'
        : 'Each blue crossing is smaller.'
      : n === 0
        ? 'Raise the rate from 0.018 to 0.021. Will the crossings shrink?'
        : 'Compare each copper mark with the last one across zero.',
    'Horizontal axis   ·   completed updates',
  );
}
export function momentum(c, q) {
  const run = RUNS.momentum,
    row = run.records[4];
  const b = q.beat.beatIndex + 1;
  const continuing = cue(q, 3, 'Continue to the eighth punch', 3);
  const turnsRight = b === 3 && q.elapsed >= q.wordCue('the carriage finally moves right').end;
  const k =
    Math.floor(4 * cue(q, 1, 'replay four', 3)) +
    Number(cue(q, 2, 'The fifth punch', 1) > 0.5) +
    (turnsRight ? 3 : Math.min(2, Math.floor(3 * continuing)));
  const a = run.points[k].x;
  face(
    c,
    turnsRight ? 'The eighth punch turns right' : continuing > 0 ? 'Follow the next momentum marks' : 'Cut the fifth momentum mark',
    'Normalized momentum   ·   β = 0.9   ·   η = 0.018   ·   each notch records a completed position',
  );
  head(c, 'Steep-coordinate loss', 82, 166, C.blue);
  profile(c, {
    x: 86,
    w: 510,
    base: 404,
    h: 141,
    k: 100,
    a,
    color: C.blue,
    trail: run.points.slice(1, k + 1).map((p) => p.x),
  });
  number(c, '#' + k + '    a = ' + f(a), 86, 507, C.blue, 25);
  if (k < 4) {
    const first = run.records[0];
    const store = cue(q, 1, 'Store the first weighted gradient', 1.1);
    const firstInput = store > 0 && k <= 1;
    const stored = k ? run.records[k - 1] : first;
    const mean = store === 1 ? stored.mean[0] : 0;
    head(c, firstInput ? 'First signed average' : 'From an empty signed buffer', 659, 192);
    const equation = firstInput ? '0.9 × 0 + 0.1 × ' + f(first.gradient[0]) : 'm ← 0.9m + 0.1g';
    number(c, equation, 659, 265);
    label(c, 'Carriage travel = −0.018 × m', 659, 321);
    number(c, 'm[a] = ' + f(mean), 659, 405, C.copper);
  } else if (continuing > 0 || turnsRight) {
    const latest = run.records[k - 1];
    const displacement = latest.update[0];
    const color = turnsRight ? C.green : C.copper;
    head(c, 'Displacement for update ' + k, 659, 167, color);
    rail(c, {
      x: 661,
      y: 305,
      w: 467,
      lo: -0.75,
      hi: -0.15,
      from: latest.before[0],
      to: latest.next[0],
      color,
      ticks: [-0.75, -0.45, -0.15],
    });
    label(c, 'Previous position → new position', 661, 376, 20);
    number(c, f(latest.before[0]) + ' → ' + f(latest.next[0]), 661, 417, C.ink, 25);
    number(c, 'Δa = ' + (displacement > 0 ? '+' : '') + f(displacement, 4), 661, 474, color, 27);
    label(c, 'm[a] = ' + f(latest.mean[0]), 1128, 474, 23, color, 'right', 'Mono');
  } else {
    const X = (v) => 925 + v * 440,
      old = run.records[3].update[0],
      fresh = -row.eta * row.gradient[0],
      actual = row.update[0];
    head(c, 'Displacement for update 5', 659, 167);
    const pins = cue(q, 2, 'Put the last displacement', 1),
      collar = cue(q, 2, 'Read the collar', 1);
    line(c, 661, 252, 1128, 252, C.steel, 6);
    line(c, 661, 403, 1128, 403, C.steel, 6);
    line(c, X(0), 204, X(0), 413, C.soft);
    label(c, '0', X(0), 198, 19, C.soft, 'center');
    label(c, 'Previous   ' + f(old), 661, 230, 20, C.blue);
    pin(c, X(old), 252, C.blue);
    if (pins > 0) {
      line(c, X(old), 252, X(fresh), 403, C.ink, 10);
      line(c, X(old), 252, X(fresh), 403, C.steel, 5);
      pin(c, X(old), 252, C.blue);
      pin(c, X(fresh), 403, C.green);
      label(c, 'Fresh descent   +' + f(fresh), 1126, 443, 20, C.green, 'right');
    }
    if (collar > 0) {
      pin(c, X(actual), mix(252, 403, 0.1), C.gold, 10);
      number(c, 'Collar  ' + f(actual), 659, 498, C.copper, 25);
    }
  }
  note(
    c,
    k < 4
      ? 'A tenth of each new gradient enters the signed buffer.'
      : k === 4
        ? cue(q, 2, 'Read the collar', 1) > 0
          ? 'The collar gives the signed displacement of the next punch.'
          : 'The fourth notch is left of the minimum. Where will the fifth land?'
        : k < 8
          ? 'A positive buffer drives the punch farther left, up the cut face.'
          : 'At update eight, the punch turns back downhill.',
    'Total loss at the current notch   ' + f(loss([a, run.points[k].y])),
  );
}
export function convention(c, q) {
  const b = q.beat.beatIndex + 1,
    t =
      b === 4
        ? 2
        : cue(q, 1, 'A tenth', 0) +
          cue(q, 2, 'That leaves one', 0) +
          cue(q, 3, 'The third steep buffer', 0) +
          cue(q, 3, 'and the fourth', 0);
  const v = t ? PRESCRIBED[t - 1].mean : [0, 0];
  const pendingSecond = b === 2 && cue(q, 2, 'minus eighty', 0) && t === 1;
  face(
    c,
    b === 4
      ? 'Rewind to input two'
      : b < 5
        ? 'Replay four supplied gradients'
        : 'Translate the buffer units at input four',
    'Prescribed inputs   ·   signed average   ·   β = 0.9   ·   start from zero',
  );
  if (b < 5) {
    [0, 1].forEach((j) => {
      const x = 94,
        y = j ? 365 : 189,
        col = j ? C.green : C.blue;
      head(c, j ? 'b   ·   repeated sign' : 'a   ·   alternating sign', x, y, col);
      PRESCRIBED.forEach((r, i) => {
        const xx = 365 + i * 177;
        circle(c, xx, y - 8, 23, i < t ? col : C.pale, pendingSecond && i === 1 ? col : undefined);
        label(c, f(r.gradient[j]), xx, y - 1, 16, i < t ? C.cream : C.soft, 'center', 'Mono');
      });
      rail(c, {
        x,
        y: y + 70,
        w: 992,
        lo: 0,
        hi: j ? 0.4 : 11,
        from: 0,
        to: v[j],
        color: col,
        read: 'm = ' + f(v[j]),
        ticks: j ? [0, 0.2, 0.4] : [0, 5, 10],
      });
    });
  } else {
    rail(c, {
      y: 254,
      lo: 0,
      hi: 12,
      from: 0,
      to: v[0],
      title: 'Normalized EMA buffer',
      read: f(v[0]) + ' × 0.018',
      ticks: [0, 6, 12],
    });
    rail(c, {
      y: 421,
      lo: 0,
      hi: 12,
      from: 0,
      to: v[0] / 0.1,
      title: 'PyTorch buffer, default dampening',
      read: f(v[0] / 0.1) + (b >= 6 ? ' × 0.0018' : ''),
      ticks: [0, 6, 12],
      color: C.copper,
    });
  }
  note(
    c,
    b < 5
      ? b === 4
        ? 'Input 2    ·    0.9 × 10 + 0.1 × (−80) = +1'
        : pendingSecond
          ? 'The outlined input comes next. Combine 0.9 × 10 with 0.1 × (−80).'
          : 'Completed inputs    ' + t + ' of 4'
      : b === 5
        ? 'Read each buffer after the same four inputs.'
        : 'A tenfold larger buffer needs one tenth of the rate for the same travel.',
    b < 5
      ? 'New signed memory = 0.9 × old memory + 0.1 × input'
      : b === 5
        ? 'Normalized EMA adds 0.1g. The library buffer adds g.'
        : 'Match initialization and dampening. At input four both products equal ' +
          f(v[0] * 0.018, 5) +
          '.',
  );
}
const squaredBuffer = 1e-12;
const epsilon = 1e-8;
export const rmsDivisors = [Math.sqrt(squaredBuffer) + epsilon, Math.sqrt(squaredBuffer + epsilon)];
export function rms(c, q) {
  const b = q.beat.beatIndex + 1;
  face(
    c,
    b === 6 ? 'Compare the two epsilon placements' : 'Read the RMSProp subtraction',
    'Supplied gradients   ·   ρ = 0.9   ·   learning rate 0.01   ·   ε = 1e-8',
  );
  if (b === 6) {
    head(c, 'Same squared buffer   s = ' + squaredBuffer.toExponential(), 90, 170);
    rail(c, {
      y: 270,
      lo: 0,
      hi: 0.00011,
      from: 0,
      to: rmsDivisors[0],
      title: '√s + ε',
      read: rmsDivisors[0].toExponential(2),
      ticks: [0, 0.0001],
    });
    rail(c, {
      y: 431,
      lo: 0,
      hi: 0.00011,
      from: 0,
      to: rmsDivisors[1],
      title: '√(s + ε)',
      read: rmsDivisors[1].toExponential(2),
      color: C.copper,
      ticks: [0, 0.0001],
    });
    note(
      c,
      'Copying the same epsilon changes the divisor.',
      'Basic RMSProp uses the raw moving average of squares.',
    );
    return;
  }
  const second = cue(q, 4, 'Squaring that minus eighty', 0);
  const r = PRESCRIBED[second];
  const normalized = cue(q, 3, 'Now multiply', 0);
  const rateKnown = cue(q, 3, 'Each coordinate subtracts', 0);
  const firstStep = cue(q, 3, 'The two marks line up', 0);
  const ready = second
    ? [cue(q, 4, 'The second stays positive', 0), cue(q, 4, 'That sends', 0)]
    : [firstStep, firstStep];
  [0, 1].forEach((j) => {
    const col = j ? C.green : C.blue,
      y = 202 + j * 183;
    number(c, 'g = ' + f(r.gradient[j]), 90, y, col, 27);
    label(c, 's = ' + f(r.rms[j], 4) + '     √s ≈ ' + f(Math.sqrt(r.rms[j])), 330, y, 23);
    if (normalized) {
      const ratio = r.gradient[j] / (Math.sqrt(r.rms[j]) + 1e-8);
      number(c, 'g / (√s + ε) ≈ ' + f(ratio), 1100, y, col, 21, 'right');
    }
    rail(c, {
      y: y + 82,
      lo: -0.04,
      hi: 0.04,
      from: 0,
      to: r.rmsUpdate[j],
      p: ready[j],
      color: col,
      read: ready[j] ? 'subtract  ' + f(r.rmsUpdate[j], 5) : 'subtract  ?',
      ticks: [-0.04, 0, 0.04],
    });
  });
  note(
    c,
    b <= 2
      ? 'Will the same rate still produce a hundredfold difference?'
      : second && ready[1]
        ? 'A negative subtraction moves a to the right. The square only sets its scale.'
        : second
          ? 'Read the sign of each new gradient before taking its step.'
          : firstStep
            ? 'The two first-step marks line up at approximately 0.03162.'
            : rateKnown
              ? 'Amount to subtract ≈ 0.01 × 3.162'
              : 'Divide each gradient by its own scale.',
    's ← 0.9s + 0.1g²      ·      amount subtracted = 0.01g / (√s + ε)',
  );
}
