import {
  C,
  mix,
  fmt,
  pair,
  words,
  numeral,
  heading,
  box,
  line,
  poly,
  circle,
  arrow,
  alpha,
  ruler,
  plane,
  cue,
  pivot,
  pin,
  span,
  labelValue,
  subtitle,
} from './drawing.mjs';
import {
  request,
  ratios,
  overlaps,
  bound,
  leakage,
  dictionary,
  code,
  target,
  encoderFixture,
  decode,
  shortCode,
  cost,
  mse,
  amount,
  mul,
  shrinkCase,
} from './experiment.mjs';

function shutter(c, x, y, w, h, t) {
  c.save();
  c.beginPath();
  c.rect(x - 10, y - 10, w + 20, h + 24);
  c.clip();
  c.translate(0, -(h + 24) * t);
  const metal = c.createLinearGradient(x, y, x + w, y + h);
  metal.addColorStop(0, '#6d807e');
  metal.addColorStop(0.48, '#b3beb3');
  metal.addColorStop(1, '#687c78');
  box(c, x + 2, y + 6, w, h, '#30464330', null, 10);
  box(c, x, y, w, h, metal, '#65726e', 10);
  for (let yy = y + 14; yy < y + h - 5; yy += 13)
    line(c, x + 8, yy, x + w - 8, yy, '#f2f0d833', 1.6);
  box(c, x + w / 2 - 61, y + h - 43, 122, 15, '#465a56', '#e2dfc7', 7);
  c.restore();
}
function resetInstrument(c, clock) {
  const b = clock.beat.beatIndex + 1;
  const now = cue(clock, 1, 'now', 0),
    open = cue(clock, 2, 'Lift the cover', 1.05);
  const state = request(now);
  words(c, 'Request', 104, 112, 35, C.muted);
  const prompt = 'Reset my password';
  words(c, prompt, 100, 218, 92, C.ink, { face: 'Serif' });
  const edge = 100 + c.measureText(prompt).width;
  if (now) words(c, 'now', edge + 22, 218, 92, C.pink, { face: 'Serif' });
  line(c, 100, 290, 1800, 290);
  const x = 232,
    y = 706,
    u = 499;
  const d = plane(c, x, y, u, { xmin: 0, xmax: 2.92, ymin: 0, ymax: 0.67, step: 0.25 });
  const elbow = [1.5, 0],
    tip = state.x;
  d.vector([0, 0], elbow, C.blue, 24);
  pivot(c, x, y);
  words(c, 'credential', x + 200, y - 60, 42, C.blue);
  if (now) {
    d.vector(elbow, tip, C.pink, 24);
    d.point(tip);
    if (open === 1) words(c, 'urgency', x + u * 1.73, y - 246, 39, C.pink);
  }
  if (open < 1) shutter(c, x + 1.27 * u, y - 0.68 * u, 1.36 * u, 0.78 * u, open);
  ruler(c, x, 790, u, 3, { major: 0.5 });
  const mark = x + u * tip[0];
  pin(c, mark, 764, 787, C.ink);
  box(c, mark - 64, 851, 128, 63, C.ink, null, 5);
  numeral(c, fmt(tip[0]), mark, 882, 45, C.light, 'center');
  words(c, 'First coordinate', x, 907, 35, C.muted);
  if (open === 1) {
    pin(c, mark, y - 0.6 * u + 12, y - 2, C.pink);
    span(c, x + 1.5 * u, mark, 752, C.pink);
    numeral(c, '+0.8', (x + 1.5 * u + mark) / 2, 722, 39, C.pink, 'center');
    if (b >= 3) numeral(c, '(2.3, 0.6)', mark + 23, y - 0.6 * u - 29, 37);
  }
}
export function opening(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 3) return resetInstrument(c, k);
  if (b === 4) {
    heading(c, 'Turn both directions together');
    const p = plane(c, 610, 680, 345, { xmin: -1.45, xmax: 1.7, ymin: -0.3, ymax: 1.38 });
    const angle = 0.64 * cue(k, 4, 'Turn them together', 1.5),
      a = [Math.cos(angle), Math.sin(angle)],
      d = [-Math.sin(angle), Math.cos(angle)];
    [a, d].forEach((v, i) => {
      const col = [C.blue, C.pink][i];
      p.vector([0, 0], v, col, 18);
      line(c, ...p.p(v), ...p.p([v[0], 0]), col, 3, [8, 8]);
      span(c, 610, 610 + 345 * v[0], 726 + 47 * i, col);
    });
    labelValue(c, 'Dimensions', '2', 1320, 340);
    labelValue(c, 'Orthogonal directions', '2', 1320, 585);
    return;
  }
  heading(c, b === 5 ? 'Where is the reading taken?' : 'From a point to a testable edit');
  if (b === 5) {
    line(c, 150, 500, 1740, 500, C.blue, 18);
    arrow(c, 1480, 500, 1760, 500, C.blue, 18);
    circle(c, 530, 500, 19, C.ink);
    words(c, 'residual stream', 175, 574, 45, C.blue);
    line(c, 530, 500, 530, 290, C.ink, 4);
    numeral(c, 'x₁ = 2.3', 370, 240, 64);
    line(c, 885, 500, 885, 703, C.muted, 5);
    line(c, 885, 703, 1220, 703, C.muted, 5);
    box(c, 1180, 639, 360, 126, C.light, C.muted, 14);
    words(c, 'MLP neuron', 1360, 705, 45, C.ink, { align: 'center' });
    subtitle(c, 'nonlinear activation', 1180, 817);
    return;
  }
  const p = plane(c, 200, 690, 380, { xmax: 2.8, ymax: 1.1 });
  const t = cue(k, 6, 'taking its contribution out', 0.95),
    state = request(1, 1, 1 - t);
  circle(c, ...p.p(target), 14, null, C.muted, 3);
  p.vector([0, 0], [1.5, 0], C.blue, 18);
  p.vector([1.5, 0], state.x, C.pink, 18);
  p.point(state.x);
  subtitle(c, 'Observed activation', 1180, 285);
  numeral(c, pair(target), 1180, 360, 66);
  if (t > 0) {
    subtitle(c, 'Edited activation', 1180, 558);
    numeral(c, pair(state.x), 1180, 633, 66, C.green);
  }
}
export function packing(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    heading(c, 'Can a third arrow miss both axes?');
    const p = plane(c, 670, 670, 385, { xmin: -1.25, xmax: 1.4, ymin: -0.4, ymax: 1.16 });
    const ang = 0.18 + 1.2 * cue(k, 1, 'Where could a third arrow', 3.1),
      v = [Math.cos(ang), Math.sin(ang)];
    p.vector([0, 0], [1, 0], C.blue, 16);
    p.vector([0, 0], [0, 1], C.pink, 16);
    p.vector([0, 0], v, C.gold, 13);
    line(c, ...p.p(v), ...p.p([v[0], 0]), C.blue, 3, [10, 8]);
    line(c, ...p.p(v), ...p.p([0, v[1]]), C.pink, 3, [10, 8]);
    labelValue(c, 'Horizontal shadow', fmt(v[0]), 1270, 342, C.blue);
    labelValue(c, 'Vertical shadow', fmt(v[1]), 1270, 583, C.pink);
    return;
  }
  if (b <= 4) {
    heading(c, 'One map, eight points, twenty-eight pairs');
    subtitle(c, 'Squared distance after projection ÷ squared distance before', 90, 221);
    const x = (v) => 205 + (v - 0.45) * 1340;
    box(c, x(0.5), 328, x(1.5) - x(0.5), 398, '#d9e5d6');
    line(c, x(1), 309, x(1), 752, C.green, 3, [9, 8]);
    const n = Math.ceil(28 * cue(k, 2, 'Each tick', 1.25));
    ratios.slice(0, n).forEach((v, i) => {
      const y = 345 + i * 13;
      line(c, x(1), y, x(v), y, '#84998d', 2);
      line(c, x(v), y - 6, x(v), y + 6, C.blue, 6);
    });
    [0.5, 1, 1.5].forEach((v) => numeral(c, fmt(v), x(v), 777, 39, C.ink, 'center'));
    words(c, '256 → 64 dimensions   ·   ε = 0.5', 99, 877, 40);
    if (b >= 3) numeral(c, 'D = O(log N / ε²)', 1020, 877, 43, C.green);
    return;
  }
  if (b <= 7) {
    const d = cue(k, 6, 'Go back to sixteen', 0)
      ? 16
      : cue(k, 6, 'two hundred and fifty-six', 0)
        ? 256
        : 64;
    heading(c, 'All pairs of random sign directions');
    const mat = overlaps[d],
      s = 23,
      ox = 185,
      oy = 232;
    mat.forEach((row, i) =>
      row.forEach((v, j) => {
        const color = i === j ? C.faint : i === 0 ? C.pink : C.blue;
        alpha(c, i === j ? 1 : 0.1 + Math.abs(v) * 0.9, () =>
          box(c, ox + j * s, oy + i * s, s - 1, s - 1, color),
        );
      }),
    );
    words(c, 'Highlighted row = one probe', ox, 852, 36, C.pink);
    labelValue(c, 'Independent ±1/√D coordinates', 'D = ' + d, 945, 258);
    subtitle(c, 'M = 24 unit directions     ε = 0.5', 945, 447);
    words(c, 'P(any |overlap| > ε)', 945, 546, 47);
    numeral(c, '≤ M(M−1) exp(−Dε²/2)', 945, 619, 44);
    const v = bound(d);
    numeral(
      c,
      v < 0.001 ? 'bound < 0.001' : 'bound = ' + fmt(v, 3),
      945,
      748,
      55,
      v > 1 ? C.pink : C.green,
    );
    if (v > 1) subtitle(c, 'Probability itself is at most 1.', 945, 848);
    return;
  }
  heading(c, 'Can an absent feature trip its detector?');
  const first = cue(k, 9, 'First admit four directions', 1.2),
    rest = cue(k, 9, 'Add the remaining eight', 1.9);
  const n = Math.round(first * 4 + rest * 8),
    v = leakage(n),
    u = 1040,
    x = 190,
    y = 624;
  words(c, 'Probe coefficient', 100, 254, 36);
  numeral(c, '0', 100, 337, 70, C.muted);
  words(c, 'Each active direction writes 0.1 along the probe.', 530, 284, 40);
  for (let i = 0; i < 12; i++)
    box(c, x + i * u * 0.1, y - 95, u * 0.1 - 5, 90, i < n ? C.blue : C.faint, null, 4);
  ruler(c, x, y, u, 1.4, { major: 0.2 });
  line(c, x + u, y - 160, x + u, y + 27, C.pink, 5);
  words(c, 'Threshold 1', x + u, y - 209, 40, C.pink, { align: 'center' });
  numeral(c, n + ' × 0.1 = ' + fmt(v), x, 797, 59);
  words(c, v > 1 ? 'Fires' : 'Silent', 1430, 794, 56, v > 1 ? C.pink : C.green);
  subtitle(
    c,
    'Inactive probe j: |dⱼ · x| ≤ μ Σ |aᵢ|   for unit columns and j outside the support',
    150,
    919,
  );
}
function vectorMix(c, z, origin = [192, 706], u = 330, scale = 1) {
  const p = plane(c, ...origin, u, { xmin: 0, xmax: 2.7, ymin: -0.1, ymax: 1.15 });
  const elbow = mul(dictionary[0], z[0] * scale),
    end = decode(z, scale);
  p.vector([0, 0], elbow, C.blue, 17);
  p.vector(elbow, end, C.pink, 17);
  circle(c, ...p.p(target), 17, null, C.ink, 4);
  p.point(end, C.ink, 8);
  if (Math.hypot(end[0] - target[0], end[1] - target[1]) > 0.015)
    line(c, ...p.p(end), ...p.p(target), C.green, 5, [10, 9]);
  return p;
}
export function dictionaryLesson(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    heading(c, 'A five-column dictionary');
    const t = cue(k, 1, 'then add', 1.1);
    const z = code;
    const p = plane(c, 192, 706, 330, { xmax: 2.7, ymax: 1.15 });
    p.vector([0, 0], [1.5, 0], C.blue, 17);
    circle(c, ...p.p(target), 17, null, C.ink, 4);
    alpha(c, t, () => {
      p.vector([1.5, 0], target, C.pink, 17);
      p.point(target);
    });
    subtitle(c, 'Two coordinates at the hook', 186, 805);
    words(c, 'Slot', 1195, 225, 33, C.muted);
    words(c, 'Direction', 1340, 225, 33, C.muted);
    words(c, 'Weight', 1618, 225, 33, C.muted);
    dictionary.forEach((v, i) => {
      const y = 318 + i * 103,
        col = [C.blue, C.pink, C.muted, C.muted, C.muted][i];
      numeral(c, i + 1, 1210, y, 42);
      arrow(c, 1450 - 32 * v[0], y + 32 * v[1], 1450 + 32 * v[0], y - 32 * v[1], col, 9);
      numeral(c, fmt(z[i]), 1650, y, 45, col);
    });
    return;
  }
  if (b === 3) {
    heading(c, 'What does the blue slot read?');
    vectorMix(c, code, [160, 708], 305);
    const e = encoderFixture(target);
    labelValue(c, 'Point at the hook', pair(target), 1100, 258);
    subtitle(c, 'Blue detector', 1100, 435);
    numeral(c, '2.3 − (4/3) × 0.6', 1100, 508, 45);
    alpha(c, cue(k, 3, 'That cancels'), () => {
      numeral(c, '= ' + fmt(e.estimated[0]), 1100, 595, 70, C.blue);
      words(c, 'Blue writer', 1100, 744, 35, C.muted);
      numeral(c, pair(dictionary[0]), 1100, 804, 50, C.blue);
    });
    return;
  }
  const large = b === 4 && cue(k, 4, 'For example', 0);
  heading(
    c,
    b === 4
      ? large
        ? 'From 512 coordinates to 4,096 readings'
        : 'Five readings, two output coordinates'
      : 'Which weights can move independently?',
  );
  const wide = (x, y, rows, cols, col) => {
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) box(c, x + j * 52, y + i * 52, 45, 45, col, null, 3);
  };
  if (large) {
    box(c, 278, 286, 172, 346, C.blue, null, 4);
    box(c, 1020, 389, 346, 172, C.pink, null, 4);
    words(c, 'Wenc', 364, 460, 49, C.light, { align: 'center' });
    words(c, 'Wdec', 1193, 476, 49, C.light, { align: 'center' });
  } else {
    wide(311, 339, 5, 2, C.blue);
    wide(1030, 418, 2, 5, C.pink);
  }
  words(c, 'Encoder', 263, 685, 51);
  words(c, 'Decoder', 1050, 685, 51);
  numeral(c, large ? '4,096 × 512' : 'M × D', 288, 754, 43, C.blue);
  numeral(c, large ? '512 × 4,096' : 'D × M', 1067, 754, 43, C.pink);
  arrow(c, 504, 498, 923, 498, C.muted, 7);
  if (b === 4) {
    subtitle(
      c,
      large
        ? 'The reconstruction has the same width as the input.'
        : 'Subtract decoder bias before encoding. Add it back after decoding.',
      175,
      882,
    );
  } else {
    const free = cue(k, 5, 'permits independent later updates', 0);
    words(c, free ? 'Tied at initialization' : 'Tied throughout training', 835, 240, 48, C.ink, {
      align: 'center',
    });
    box(c, 363, 339, 45, 45, C.light, C.blue, 3);
    box(c, 1030, 470, 45, 45, C.light, C.pink, 3);
    numeral(c, free ? '2' : '1', 385, 361, 30, C.blue, 'center');
    numeral(c, '1', 1052, 491, 30, C.pink, 'center');
    words(
      c,
      free
        ? 'After an encoder update, the decoder entry can stay at 1.'
        : 'A pair of transposed entries must match at every update.',
      201,
      882,
      41,
    );
  }
}
function objectiveComparison(c, k, b) {
  const after = (phrase, captionStart = phrase) => {
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart }) === 1;
  };
  const atTie = b === 5 && after('two and a half', false);
  const atFour = b === 6 || (b === 5 && after('At four', false));
  const tieSpoken = b === 5 && after('Both codes cost one point two five');
  const oneSpoken = b === 6 || (b === 5 && after('the one-arrow code costs one point seven', 'At four'));
  const twoSpoken = b === 6 || (b === 5 && after('The two-arrow code costs two'));
  const price = atFour ? 4 : atTie ? 2.5 : 1;
  const showOne = atFour ? oneSpoken : !atTie || tieSpoken;
  const showTwo = atFour ? twoSpoken : !atTie || tieSpoken;
  const oneCost = cost(shortCode, price);
  const twoCost = cost(code, price);
  const tied = Math.abs(oneCost - twoCost) < 1e-9;
  const oneWins = oneCost < twoCost;

  heading(c, 'What is the second arrow worth?');
  if (b < 5) {
    const pink =
      b === 1
        ? cue(k, 1, 'Restore the pink arrow', 0.9) - cue(k, 1, 'Drop it again', 0.9)
        : 1 - cue(k, 4, 'With one arrow', 0.9);
    const z = [code[0], code[1] * pink, ...code.slice(2)];
    vectorMix(c, z, [142, 675], 292);
    if (pink === 0 || pink === 1) {
      words(c, 'Reconstruction ' + pair(decode(z)), 138, 805, 42, C.ink);
    }
    words(c, 'Target ' + pair(target), 138, 871, 34, C.muted);
  } else {
    const p = vectorMix(c, code, [142, 675], 292);
    const oneTip = decode(shortCode);
    const [oneX, oneY] = p.p(oneTip);
    const [twoX, twoY] = p.p(target);
    p.point(oneTip, C.blue, 10);
    words(c, 'One arrow', oneX, oneY + 60, 38, C.blue, { align: 'center' });
    words(c, 'Two arrows', twoX, twoY - 57, 38, C.pink, { align: 'center' });
    if (atFour && showOne && showTwo && !tied)
      circle(c, ...p.p(oneWins ? oneTip : target), 27, null, C.green, 5);
  }

  const left = 1020;
  const unit = 325;
  words(c, 'MSE + λ × mean |z|', left, 217, 52, C.ink, { face: 'Serif' });
  numeral(c, 'λ = ' + fmt(price), left, 300, 52, C.ink);
  const penaltyX = left + 374;
  words(c, 'Reconstruction MSE', left, 376, 35, C.green);
  words(c, 'Magnitude penalty', penaltyX, 376, 35, C.gold);
  [
    { name: 'Two arrows', z: code, color: C.pink, total: twoCost, showTotal: showTwo },
    { name: 'One arrow', z: shortCode, color: C.blue, total: oneCost, showTotal: showOne },
  ].forEach(({ name, z, color, total, showTotal }, i) => {
    const y = 454 + i * 164;
    const error = mse(target, decode(z));
    const meanMagnitude = amount(z) / z.length;
    words(c, name, left, y, 41, color);
    numeral(c, fmt(error), left, y + 50, 37, C.green);
    numeral(c, '+', left + 280, y + 50, 37);
    numeral(c, fmt(price) + ' × ' + fmt(meanMagnitude), penaltyX, y + 50, 37, C.gold);
    const barY = y + 85;
    if (error > 0) box(c, left, barY, error * unit, 26, C.green);
    if (showTotal) {
      box(c, left + error * unit, barY, (total - error) * unit, 26, C.gold);
      numeral(c, fmt(total), left + total * unit + 22, barY + 13, 40);
    }
  });
  ruler(c, left, 762, unit, 2, { step: 0.25, major: 0.5 });

  if (b === 2 || b === 3) {
    subtitle(c, 'Positive entry gives penalty gradient λ / 5', left, 873);
  } else if (b >= 5 && showOne && showTwo && (atTie || atFour)) {
    const winner = oneWins ? 'One arrow costs less' : 'Two arrows cost less';
    const result = tied ? 'Tie. Which cost grows faster?' : winner;
    words(c, result, left, 873, 42, C.green);
  }
}

export function objective(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b >= 7) {
    heading(c, 'Can a change of scale lower the bill?');
    const scale = 1 + cue(k, 7, 'double the lengths', 1.4),
      z = mul(code, 1 / scale);
    vectorMix(c, z, [125, 663], 333, scale);
    labelValue(c, 'Column length', fmt(scale), 1115, 255, C.blue);
    labelValue(
      c,
      'Two nonzero coefficients',
      fmt(z[0], 3) + '  /  ' + fmt(z[1], 3),
      1115,
      438,
      C.pink,
    );
    labelValue(c, 'Mean |z|', fmt(amount(z) / 5, 3), 1115, 623);
    words(
      c,
      b === 8
        ? 'Unit columns fix the scale. Norm-aware cost uses |zᵢ| ‖dᵢ‖.'
        : 'The two weighted arrows still reach their original tip.',
      115,
      886,
      41,
    );
    return;
  }
  objectiveComparison(c, k, b);
}
export function shrinkage(c, k) {
  heading(c, 'The cost of one more unit of pink');
  const {
    weight: l,
    z,
    count,
  } = shrinkCase(
    cue(k, 2, 'one point two', 1),
    cue(k, 3, 'Raise the weight again', 1),
    cue(k, 3, 'reaches zero', 0.65),
  );
  const x = (v) => 230 + v * 617,
    y = (v) => 752 - v * 142,
    loss = (v) => (1 - v) ** 2 + l * v;
  ruler(c, x(0), y(0), 617, 1.4, { major: 0.2 });
  line(c, x(0), y(0), x(0), y(3.15), C.muted);
  words(c, 'Cost', 118, 247, 35);
  words(c, 'Pink coefficient z ≥ 0', 444, 854, 39);
  c.beginPath();
  for (let j = 0; j <= 140; j++) {
    const v = j / 100;
    j ? c.lineTo(x(v), y(loss(v))) : c.moveTo(x(v), y(loss(v)));
  }
  c.strokeStyle = C.pink;
  c.lineWidth = 8;
  c.stroke();
  line(c, x(z), y(loss(z)), x(z), y(0), C.pink, 3, [8, 7]);
  circle(c, x(z), y(loss(z)), 13, C.ink, C.light);
  numeral(c, '(1 − z)² + λz', 1220, 278, 47);
  labelValue(c, 'Effective weight λ', fmt(l), 1220, 397, C.gold);
  labelValue(c, 'Minimum at z', fmt(z, 3), 1220, 579, C.pink);
  numeral(c, 'Active: ' + count + ' of 5', 1220, 823, 46);
  subtitle(c, 'z* = max(0, 1 − λ/2)   for z ≥ 0', 1115, 907);
}
