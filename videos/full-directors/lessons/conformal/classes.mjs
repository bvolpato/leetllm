import {
  C,
  classColors,
  head,
  text,
  rect,
  line,
  dot,
  dash,
  fmt,
  bracket,
  slot,
  poly,
} from './drawing.mjs';
import { classRows, confident, equal, edge, sets, pieces, soft, cumulative } from './model.mjs';

function classCalibration(c, t, kind) {
  const individual = kind === 'individual',
    a = individual ? soft : cumulative;
  const sorted = individual ? t.on(2, 'sort the resulting') : true;
  const data = classRows.map((row, i) => ({
    id: 'C' + (i + 1),
    p: row[0],
    s: individual ? 1 - row[0] : pieces(row)[0].end,
  }));
  if (sorted) data.sort((u, v) => u.s - v.s);
  const picked = individual ? t.on(2, 'Keep that score') : t.on(3, "That's the mark");
  head(
    c,
    'CLASSIFIER  /  HELD-OUT ROWS',
    individual ? 'Read the score of the true class' : 'Calibrate on the true label’s right edge',
  );
  text(c, 'True class = 0 on all nine rows', 47, 151, 20, C.dim);
  const labels = ['Request', 'p(true)', 'Score', 'Rank'];
  labels.forEach((w, i) => text(c, w, 45, 217 + i * 56, 16, C.dim));
  data.forEach((r, i) => {
    const x = 208 + i * 84;
    if (picked && i === a.index) rect(c, x - 35, 190, 70, 220, C.gold, 5);
    const ink = picked && i === a.index ? C.dark : C.text;
    for (const [j, v] of [r.id, fmt(r.p), fmt(r.s), sorted ? i + 1 : '·'].entries())
      text(c, v, x, 217 + 56 * j, 18, ink, 'center', 'Mono');
  });
  text(
    c,
    individual
      ? 'score = 1 − p(true)'
      : 'Class 0 ranks first in every row. Its right edge equals its share.',
    individual ? 46 : 382,
    individual ? 449 : 151,
    20,
    C.teal,
    'left',
    individual ? 'Mono' : 'Serif',
  );
}
export function individual(c, t) {
  if (t.b === 2) {
    classCalibration(c, t, 'individual');
    return;
  }
  const flat = t.on(5, 'Now spread'),
    ps = flat ? equal : confident,
    a = sets(ps),
    withCut = t.b >= 3;
  const cutoff = 1 - soft.q,
    xx = (p) => 196 + 646 * p;
  head(c, 'CLASS PROBABILITIES  /  INDIVIDUAL SCORE', 'Which bars reach the probability cutoff?');
  for (const [i, p] of ps.entries()) {
    const y = 179 + i * 66;
    text(c, 'class ' + i, 53, y, 19, classColors[i], 'left', 'Mono');
    rect(c, xx(0), y - 11, 646, 22, C.panel, 3);
    rect(c, xx(0), y - 11, 646 * p, 22, classColors[i], 2);
    text(c, fmt(p), 909, y, 16, C.text, 'right', 'Mono');
  }
  if (withCut) {
    dash(c, xx(cutoff), 138, xx(cutoff), 411, C.gold, 3);
    text(c, 'p ≥ ' + fmt(cutoff), xx(cutoff), 131, 17, C.gold, 'center', 'Mono');
  }
  const show = flat ? t.on(6, 'Each bar') : t.on(5, 'Its probability');
  text(
    c,
    show
      ? 'Class IDs   ' + showSet(a.individual)
      : withCut
        ? 'Keep candidates with 1 − p ≤ ' + fmt(soft.q)
        : 'Candidate score = 1 − p',
    51,
    130,
    24,
    show ? C.teal : C.dim,
    'left',
    'Mono',
  );
}
const showSet = (ids) => (ids.length ? '{ ' + ids.join(', ') + ' }' : '∅  empty');
function mass(c, ps, limit, visible, Q, answer, variant) {
  const a = sets(ps),
    xx = (p) => 245 + p * 560,
    rowY = (i) => 200 + i * 54;
  ps.forEach((p, i) => {
    const x = 54 + i * 221;
    text(c, 'class ' + i, x, 141, 15, classColors[i], 'left', 'Mono');
    text(c, fmt(p), x + 85, 141, 17, C.text, 'left', 'Mono');
  });
  a.parts.forEach((r, i) => {
    const y = rowY(i);
    text(c, 'class ' + r.id, 60, y, 18, classColors[r.id], 'left', 'Mono');
    if (visible) {
      const kept = a.direct.includes(r.id);
      if (kept) text(c, 'inside', 156, y, 14, C.teal);
      else if (answer && variant && a.cross.includes(r.id)) text(c, 'crosses', 156, y, 14, C.gold);
    }
    line(c, xx(0), y, xx(1), y, C.grid);
    if (i >= limit) return;
    if (r.start > 0) rect(c, xx(0), y - 6, 560 * r.start, 12, '#47615e', 2);
    rect(c, xx(r.start), y - 12, Math.max(1, 560 * r.p), 24, classColors[r.id], 2);
    dot(c, xx(r.end), y, 4, C.text);
    text(c, fmt(r.end), 900, y, 15, C.text, 'right', 'Mono');
  });
  if (Q) {
    dash(c, xx(cumulative.q), 164, xx(cumulative.q), 378, C.gold, 2);
    text(c, 'q = ' + fmt(cumulative.q), xx(cumulative.q), 168, 16, C.gold, 'center', 'Mono');
  }
  if (visible) {
    text(c, 'Direct', 48, 398, 18, C.dim);
    text(c, showSet(a.direct), 139, 398, 24, C.teal, 'left', 'Mono');
    if (variant) {
      text(c, 'Through first crossing', 430, 398, 18, C.dim);
      text(c, answer ? showSet(a.cross) : '?', 660, 398, 22, C.gold, 'left', 'Mono');
    }
  } else text(c, 'Cumulative probability  →', 246, 398, 17, C.dim);
}
export function inversion(c, t) {
  if (t.b === 2 || t.b === 3) {
    classCalibration(c, t, 'cumulative');
    return;
  }
  const conf = t.b >= 6;
  head(
    c,
    'CUMULATIVE SCORE  /  DIRECT INVERSION',
    conf ? 'What if the first share passes the mark?' : 'Read the right edge of each ordered share',
  );
  const limit = t.b === 1 ? (t.on(1, 'add the next two') ? 3 : 1) : 4;
  const visible = conf ? t.on(7, 'The first edge') : t.on(5, 'This way');
  mass(c, conf ? confident : equal, limit, visible, t.b >= 4, false, false);
}
export function crossing(c, t) {
  const ps = t.b === 1 ? confident : t.b === 2 ? equal : edge;
  head(
    c,
    'ADAPTIVE PREDICTION SETS',
    t.b >= 3 ? 'Who owns the first edge past the mark?' : 'Include the first crossing label',
  );
  const direct = t.b < 3 || t.on(4, 'The two remaining shares'),
    cross =
      t.b === 1
        ? t.on(1, 'Every label')
        : t.b === 2
          ? t.on(2, 'If nothing crosses')
          : t.on(4, 'Class two comes later');
  if (t.b === 5 && t.on(5, 'Randomized APS')) {
    const single = sets(confident);
    headRandom(c, single);
    return;
  }
  mass(c, ps, t.b >= 3 && !t.on(3, 'Place the two') ? 0 : 4, direct, true, cross, true);
}

function headRandom(c, single) {
  rect(c, 0, 0, 960, 540, C.bg);
  head(
    c,
    'ADAPTIVE PREDICTION SETS  /  RANDOMIZATION',
    'What if the crossing label was the only label?',
  );
  text(c, 'Confident request', 52, 165, 21, C.dim, 'left', 'Serif');
  const x = 55,
    w = 842,
    q = x + w * cumulative.q;
  rect(c, x, 221, w, 38, C.grid, 4);
  rect(c, x, 221, w * confident[0], 38, classColors[0], 4);
  text(c, 'class 0', x + 18, 240, 18, C.ink, 'left', 'Mono');
  dash(c, q, 201, q, 282, C.gold, 3);
  text(c, 'Deterministic q = ' + fmt(cumulative.q), q - 31, 305, 18, C.gold, 'center', 'Mono');
  text(c, 'Through first crossing', 54, 375, 18, C.dim);
  text(c, showSet(single.cross), 54, 424, 28, C.gold, 'left', 'Mono');
  text(c, 'If randomization drops that label', 444, 375, 18, C.dim);
  text(c, '∅  empty', 444, 424, 28, C.teal, 'left', 'Mono');
  text(c, 'Calibrate the randomized score separately.', 444, 475, 16, C.dim);
}
