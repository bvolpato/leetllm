import {
  C,
  base,
  big,
  bidx,
  bracket,
  cue,
  foot,
  hatch,
  kv,
  label,
  line,
  mark,
  mid,
  mono,
  rect,
  txt,
  weight,
} from './art.mjs';
import { deficits, expected, P, proposed, Q, sampling, streams, uniform } from './model.mjs';

export function verify(c, k) {
  const rejected = cue(k, 1, 'Reject it'),
    discard = cue(k, 1, 'Drop the pending tail'),
    diff = cue(k, 1, 'subtract the draft'),
    normalize = cue(k, 2, 'The correction therefore');
  base(c, k, 'Target verification', 'Which draft tokens survive verification?');
  const x = 120,
    columns = [774, 1084, 1394],
    y = 376,
    dx = 220;
  label(c, 'Conditional probabilities', x, 296);
  for (let i = 0; i < 3; i++) {
    const xx = columns[i];
    mono(c, 'ID ' + i, xx + dx / 2, 297, 34, C.ink, 'center');
    for (const [j, p, fill] of [
      [0, Q[i], C.blue],
      [1, P[i], C.green],
    ]) {
      const yy = y + j * 91;
      rect(c, xx, yy, dx, 48, C.white, C.rule);
      rect(c, xx, yy, p * dx, 48, fill);
      mono(c, p.toFixed(2), xx + dx + 10, yy + 36, 25, C.ink);
    }
    if (diff) {
      const v = normalize ? sampling.residual[i] : deficits[i];
      rect(c, xx, y + 205, dx, 48, C.white, C.rule);
      rect(c, xx, y + 205, v * dx, 48, C.amber);
      mono(c, v.toFixed(normalize ? 3 : 2), xx + dx / 2, y + 306, 35, C.ink, 'center');
    }
  }
  txt(c, 'Draft q', x, y + 37, 41, C.blue);
  txt(c, 'Target p', x, y + 128, 41, C.sea);
  if (diff)
    txt(
      c,
      normalize ? 'Correction distribution' : 'Positive part of p − q',
      x,
      y + 242,
      40,
      C.orange,
    );
  const tokenY = 731;
  mono(c, 'Draft', x, tokenY + 32, 28, C.dim);
  [
    ['0', 216],
    ['…', 315],
    ['…', 414],
  ].forEach(([v, xx], i) => {
    rect(c, xx, tokenY - 11, 84, 62, discard && i > 0 ? C.bare : C.white, C.rule);
    mid(c, v, xx + 42, tokenY + 32, 35, C.blue);
    if (i === 0 ? rejected : discard)
      line(c, xx + 4, tokenY + 47, xx + 80, tokenY - 7, C.orange, 4);
  });
  mono(
    c,
    rejected
      ? 'u = 0.4    >    threshold = ' + sampling.threshold
      : 'u = ' + uniform + '      min(1, ' + P[proposed] + ' / ' + Q[proposed] + ') = ?',
    764,
    tokenY + 31,
    35,
  );
  foot(
    c,
    normalize
      ? 'Normalize the missing mass. Token 1 gets 7/8 and token 2 gets 1/8.'
      : rejected
        ? 'The first refusal ends this draft path. Its pending tokens used the rejected context.'
        : 'Check proposals in order, even when the target scores their prefixes together.',
  );
}
export function yieldCost(c, k) {
  const b = bidx(k),
    m = expected,
    answer = cue(k, 2, 'Only slightly');
  base(c, k, 'Speculative decode', 'Do the accepted tokens pay for the draft?');
  label(c, 'Long replies  ·  independent acceptance 0.5  ·  three draft positions', 100, 302);
  const xs = [127, 482, 837, 1192],
    baseline = 618,
    scale = 231;
  const on = [
    1,
    cue(k, 0, 'To get a second'),
    cue(k, 0, 'To get a third'),
    cue(k, 0, 'To get a fourth'),
  ];
  for (let i = 0; i < m.masses.length; i++) {
    const xx = xs[i],
      mass = m.masses[i];
    if (on[i]) {
      const yy = baseline - mass * scale;
      kv(c, xx, yy, 214, mass * scale, i);
      mono(c, String(mass), xx + 107, yy - 18, 36, C.sea, 'center');
    }
    line(c, xx - 10, baseline + 1, xx + 228, baseline + 1, C.rule);
    mid(c, 'Token ' + (i + 1), xx + 107, baseline + 46, 34, C.ink);
  }
  if (b > 0 && cue(k, 1, 'One plus a half')) {
    mono(c, m.expected + ' expected tokens / cycle', 105, 741, 39);
  }
  if (b > 0 && cue(k, 1, 'Verification and overhead')) {
    mono(c, 'Cycle  3 × 0.2 + 1.2 = ' + m.cost.toFixed(1) + ' steps', 1020, 739, 33);
  }
  foot(
    c,
    answer
      ? m.expected +
          ' tokens ÷ ' +
          m.cost.toFixed(1) +
          ' target steps = ' +
          m.rate.toFixed(3) +
          '× ordinary decode.'
      : b > 0
        ? 'Compare the full draft and verification cost with the output earned per cycle.'
        : 'Each height is the probability that this cycle emits at least that many tokens.',
  );
}
export function compression(c, k) {
  const b = bidx(k),
    weightTest = cue(k, 1, 'Compress the weights alone'),
    cacheTest = cue(k, 2, 'Halve only the cache');
  base(c, k, 'Fixed-batch replay', 'Which bytes should we shrink?');
  label(
    c,
    'One read of each stream  ·  same batch and bandwidth  ·  conversion overhead excluded',
    100,
    299,
  );
  const rows = ['Original', 'Quarter weights', 'Halve cache'],
    x = 504,
    scale = 25;
  const present = [true, weightTest, cacheTest];
  for (let i = 0; i < 3; i++) {
    const s = streams[i],
      y = 370 + i * 135;
    txt(c, rows[i], 101, y + 51, 38);
    rect(c, x, y, 40 * scale, 74, C.white, C.rule);
    if (!present[i]) {
      mono(c, '?', x + 30, y + 49, 36, C.dim);
      continue;
    }
    weight(c, x, y, s.w * scale, 74);
    kv(c, x + s.w * scale, y, s.k * scale, 74);
    if (s.w >= 4) mid(c, s.w + ' GB', x + (s.w * scale) / 2, y + 49, 30, C.white);
    else mono(c, s.w + ' GB weights', x, y + 106, 26, C.blue);
    mid(c, s.k + ' GB cache', x + (s.w + s.k / 2) * scale, y + 44, 31, C.white);
    mono(c, s.total + ' GB', 1541, y + 34, 33);
    if (i > 0 && cue(k, i, i === 1 ? 'by a factor' : "That's one point"))
      mono(c, s.ratio.toFixed(2) + '× rate', 1541, y + 75, 31, C.sea);
  }
  foot(
    c,
    b === 2
      ? 'Weight compression and cache compression remove different bytes from the same read.'
      : 'Which remaining byte stream sets the time for this batch?',
  );
}
