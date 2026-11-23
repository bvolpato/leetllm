import {
  dot,
  evaluatedRanking,
  fits,
  meanPairGradient,
  pending,
  rankingFeatures,
  rankingResponse,
  requests,
  selectedFit,
  split,
  sum,
  TRAINING_PAIRS,
} from './experiment.mjs';
import {
  blue,
  box,
  caption,
  colors,
  cue,
  dotMark,
  f,
  head,
  ink,
  lineColor,
  mono,
  muted,
  red,
  stamp,
  strip,
  stroke,
  sub,
  teal,
  type,
} from './studio.mjs';

export function preference(c, k) {
  const step = Math.floor(12 * cue(k, 3, 'Watch the direction turn', 3.2)),
    w = rankingResponse(step).weights,
    norm = Math.hypot(...w),
    u = w.map((x) => x / norm);
  head(c, 'A score has a direction');
  const X = (x) => 94 + x * 311,
    Y = (y) => 412 - y * 311;
  for (const v of [0, 0.5, 1]) {
    stroke(c, X(v), Y(0), X(v), Y(1), lineColor, 1);
    stroke(c, X(0), Y(v), X(1), Y(v), lineColor, 1);
    mono(c, String(v), X(v), 436, 13, muted, 'center');
  }
  sub(c, 'Quality', 49, 90);
  sub(c, 'Text match', 296, 465);
  stroke(c, X(0), Y(0), X(1.22 * u[0]), Y(1.22 * u[1]), '#bd8b24', 4);
  for (const id of ['P4', 'P5']) {
    const xy = rankingFeatures[id],
      v = dot(xy, u),
      px = X(v * u[0]),
      py = Y(v * u[1]),
      x = X(xy[0]),
      y = Y(xy[1]);
    stroke(c, x, y, px, py, colors[id], 2, [4, 5]);
    dotMark(c, px, py, 6, colors[id]);
    dotMark(c, x, y, 8, colors[id]);
    mono(c, id, x + 14, y - 8, 18, colors[id]);
  }
  sub(c, 'Weights after ' + step + ' of 12 updates', 529, 144);
  mono(c, '[' + w.map((x) => f(x, 3)).join(',  ') + ']', 529, 189, 24);
  for (const [i, id] of ['P4', 'P5'].entries()) {
    const y = 277 + 86 * i,
      score = dot(rankingFeatures[id], w);
    mono(c, id, 529, y);
    box(c, 589, y - 10, score * 112, 20, colors[id], 4);
    mono(c, f(score, 3), 870, y, 20, ink, 'right');
  }
  sub(c, step === 12 ? 'P5 now out-scores P4.' : 'Features stay fixed.', 529, 449, teal);
}
export function onePair(c, k) {
  const b = k.beat.beatIndex,
    pair = TRAINING_PAIRS.find((p) => p.better === 'A2' && p.worse === 'A1');
  const d = pair.difference,
    grad = meanPairGradient([0, 0], 0, [pair]),
    w = grad.map((x) => -0.3 * x);
  const updated = cue(k, 5, 'Apply those weights'),
    gradient = cue(k, 4, 'Quality has the larger');
  head(c, 'A2 over A1');
  sub(c, 'TRAIN-1    /    One preferred pair', 47, 109);
  for (const [i, p] of requests[0].products.slice(0, 2).reverse().entries()) {
    const y = 190 + i * 78;
    const sc = dot(updated ? w : [0, 0], p.slice(1, 3));
    mono(c, p[0], 53, y, 26, i ? blue : teal);
    mono(c, f(p[1]) + '      ' + f(p[2]), 153, y, 22);
    stroke(c, 445, y, 656, y, lineColor);
    dotMark(c, 445 + sc * 2600, y, 7, i ? blue : teal);
    mono(c, f(sc, 4), 710, y, 24);
  }
  sub(c, 'Match', 154, 144);
  sub(c, 'Quality', 281, 144);
  sub(c, 'Scores from the same weights', 446, 144);
  if (b >= 1) mono(c, 'Δ features     [' + d.map((v) => f(v, 2)).join(',  ') + ']', 53, 333, 20);
  if (b === 2) mono(c, 'margin = w · Δ      loss = log(1 + exp(−margin))', 53, 404, 21);
  if (b === 3 || b === 4) {
    mono(
      c,
      gradient ? 'Gradient   [' + grad.map((v) => f(v, 2)).join(',  ') + ']' : 'sigmoid(0) = 0.5',
      53,
      387,
      20,
    );
    if (updated)
      mono(c, 'New weights  [' + w.map((v) => f(v, 3)).join(',  ') + ']', 53, 448, 21, teal);
    if (cue(k, 5, 'That gap favors')) mono(c, 'margin  ' + f(dot(w, d), 4), 555, 448, 21, teal);
  }
  if (b >= 5) {
    mono(c, 'Mean pair loss + ½ λ (w₁² + w₂²)', 53, 393, 25, teal);
    type(c, 'Mean pair gradient + λw', 53, 445, 22);
  }
}
export function ninePairs(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Nine preferences in one step');
  sub(c, 'Better minus worse, within each request', 45, 106);
  const visible = b ? 9 : Math.min(9, Math.floor(cue(k, 1, 'Form a directed pair', 2.9) * 9));
  for (let j = 0; j < 3; j++) {
    const x = 44 + j * 303;
    strip(c, x, 151, 270, 180);
    sub(c, requests[j].id, x + 18, 184);
    for (let i = 0; i < 3; i++) {
      const index = 3 * j + i,
        row = TRAINING_PAIRS[index],
        y = 226 + i * 38;
      if (index < visible) {
        mono(c, row.better + ' > ' + row.worse, x + 17, y, 16);
        mono(c, row.difference.map((a) => f(a, 2)).join('   '), x + 112, y, 16, teal);
      }
    }
  }
  const g = meanPairGradient([0, 0]);
  if (b === 0) mono(c, visible + ' preferred pairs', 47, 408, 25);
  if (b >= 1) mono(c, 'Mean gradient   [' + g.map((v) => f(v, 5)).join(',  ') + ']', 45, 378, 22);
  if (b >= 2)
    mono(
      c,
      '−0.3 × mean gradient   →   [' + g.map((v) => f(-0.3 * v, 5)).join(',  ') + ']',
      45,
      427,
      21,
      teal,
    );
  if (b >= 3)
    sub(c, '3 of 9 pairs per request here. Larger groups would contribute more.', 46, 479);
}
export function freeze(c, k) {
  const reset = cue(k, 5, 'return to the original file'),
    early = !reset && cue(k, 2, 'Move all three labels'),
    late = !reset && cue(k, 4, 'at three in the afternoon'),
    r = pending(early, late);
  const clock = (d) => {
    const hour = Math.round((d - Math.floor(d)) * 24);
    return (hour < 10 ? '0' : '') + hour + ':00';
  };
  head(c, 'At the May 5 training freeze');
  sub(c, 'PENDING-4    /    D1, D2 and D3 travel together    /    UTC', 46, 105);
  const X = (d) => 243 + (d - 4.36) * 548;
  stroke(c, X(5), 150, X(5), 374, '#bb872d', 3, [5, 4]);
  mono(c, 'May 5  00:00', X(5), 136, 17, ink, 'center');
  [
    ['Features', Math.max(...r.features), late ? red : blue],
    ['Search served', r.served, teal],
    ['Last label', Math.max(...r.labelTimes), ink],
  ].forEach(([name, d, color], i) => {
    const y = 196 + i * 76;
    sub(c, name, 46, y);
    stroke(c, 225, y, 913, y, lineColor);
    dotMark(c, X(d), y, 9, color);
    mono(c, 'May ' + Math.floor(d) + '   ' + clock(d), X(d), y + 23, 16, color, 'center');
  });
  const state = split(r);
  if (reset) stamp(c, 'Original CSV   /   3 training requests', 48, 447, teal);
  else if (k.beat.beatIndex === 0) caption(c, 'Can all three rows enter training?');
  else if (state === 'Pending') stamp(c, 'Exclude request   /   3 training requests', 48, 447, red);
  else if (early && k.beat.beatIndex < 2) caption(c, 'Compare the new label time with midnight.');
  else if (state === 'Train') stamp(c, 'Include request   /   4 training requests', 48, 447);
  else stamp(c, 'Reject feature   /   First available after serving', 48, 447, red);
}
export function calendar(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Eight requests, three cutoffs');
  sub(c, 'May 2026   /   UTC', 46, 105);
  const X = (d) => 181 + (d - 1) * 75;
  for (let d = 1; d <= 10; d++) {
    const x = X(d);
    stroke(c, x, 147, x, 414, lineColor, 1);
    mono(c, d, x, 133, 15, muted, 'center');
  }
  if (b >= 2)
    for (const day of [5, 7, 10]) stroke(c, X(day), 146, X(day), 417, '#be8f31', 3, [5, 3]);
  requests.forEach((r, i) => {
    const y = 167 + i * 33,
      tail = Math.max(...r.labelTimes),
      excluded = b >= 4 && split(r) === 'Pending';
    mono(c, r.id, 47, y, 17, excluded ? red : ink);
    stroke(c, X(r.served), y, X(tail), y, excluded ? red : muted, 3);
    dotMark(c, X(r.served), y, 6, '#009aaf');
    dotMark(c, X(tail), y, 7, ink);
    dotMark(c, X(tail), y, 4, 'white');
    if (excluded) mono(c, '+12 h', X(tail) + 14, y, 14, red);
  });
  if (b < 2) {
    dotMark(c, 64, 458, 6, '#009aaf');
    sub(c, 'Served', 77, 458);
    dotMark(c, 235, 458, 7, ink);
    dotMark(c, 235, 458, 4, 'white');
    sub(c, 'Last label ready', 248, 458);
  } else if (b < 4)
    sub(c, 'Serving windows close May 5, 7 and 9. Labels freeze May 5, 7 and 10.', 46, 460);
  else
    caption(
      c,
      ['Train', 'Validation', 'Test']
        .map((s) => s + '   ' + requests.filter((r) => split(r) === s).length)
        .join('        '),
    );
}
export function learning(c, k) {
  const b = k.beat.beatIndex,
    n = b ? 600 : Math.round(600 * cue(k, 1, 'Watch the quality weight', 4));
  head(c, 'Which fit goes to test?');
  const X = (i) => 86 + i * 0.815,
    Y = (v) => 399 - v * 34;
  sub(c, 'Quality weight', 46, 110);
  for (const v of [0, 2, 4, 6, 8]) {
    stroke(c, X(0), Y(v), X(600), Y(v), lineColor, 1);
    mono(c, v, 65, Y(v), 14, muted);
  }
  for (const [j, fit] of fits.entries()) {
    const color = j ? '#008c93' : blue;
    c.strokeStyle = color;
    c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = X(i),
        y = Y(fit.history[i][1]);
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.stroke();
    dotMark(c, X(n), Y(fit.history[n][1]), 5, color);
    mono(c, 'λ ' + fit.lambda, 617, 176 + 80 * j, 18, color);
    mono(c, f(fit.history[n][1], 3), 743, 176 + 80 * j, 25, color);
  }
  mono(c, 'Gradient step    ' + n + ' / 600', 86, 436, 17, muted);
  if (b === 1) {
    sub(c, 'Validation NDCG', 617, 333);
    mono(c, f(fits[0].valid, 3) + '  /  ' + f(fits[1].valid, 3), 617, 369, 22);
    if (cue(k, 2, 'The cyan fit goes to test')) stamp(c, 'Choose λ = 0.1', 618, 423);
  }
  if (b >= 2) {
    sub(c, 'Selected weights', 618, 324);
    mono(c, selectedFit.weights.map((x) => f(x, 3)).join('    '), 618, 357, 19);
    const match =
      sum(
        requests.filter((r) => split(r) === 'Test').map((r) => evaluatedRanking(r, [1, 0]).ndcg),
      ) / 2;
    if (cue(k, 3, 'The fitted model scores one')) {
      sub(c, 'Two held-out requests', 618, 408);
      mono(c, f(match, 3) + ' → ' + f(selectedFit.test, 3), 618, 446, 22, teal);
    }
  }
}
