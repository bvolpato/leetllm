import assert from 'node:assert/strict';
import { predictionRows } from '../../../films/model-monitoring/fixtures.mjs';
import { confusion } from '../../../films/model-monitoring/model.mjs';
import {
  C,
  surface,
  box,
  circle,
  line,
  txt,
  mono,
  serif,
  heading,
  paper,
  pct,
  fix,
  sum,
} from './instruments.mjs';

const archive = predictionRows.filter((r) => r.dueHours <= 0);
function replay(t) {
  const rows = archive.map((r) => {
    const reviewed = r.score >= t;
    const cost = reviewed && !r.label ? 2 : !reviewed && r.label ? 10 : 0;
    return { ...r, reviewed, cost };
  });
  return { rows, stats: confusion(rows, t), t };
}
export function decisions(c, s) {
  surface(c);
  heading(c, 'FROZEN OUTCOMES    /    THRESHOLD REPLAY', 'Which miss would leave review?');
  const change = s.motion(4, 'Move the threshold', 1.8);
  const a = replay(Math.round(50 + 30 * change) / 100);
  const x = (v) => 480 + 590 * v,
    y0 = 379;
  box(c, x(a.t), 321, x(1) - x(a.t), 454, '#d2ddc4');
  line(
    c,
    [
      [x(a.t), 295],
      [x(a.t), 775],
    ],
    C.brass,
    5,
  );
  mono(c, 'τ ' + fix(a.t), x(a.t), 250, 36, C.brass, 'center');
  ['Score', 'Review', 'Outcome', 'Charge'].forEach((v, i) =>
    txt(c, v, [319, 1140, 1370, 1668][i], 273, 35, C.muted),
  );
  a.rows.forEach((r, i) => {
    const y = y0 + i * 86;
    mono(c, r.id, 98, y, 39);
    line(
      c,
      [
        [x(0), y],
        [x(1), y],
      ],
      C.rule,
      2,
    );
    circle(c, x(r.score), y, 14, r.reviewed ? C.sea : C.muted);
    mono(c, fix(r.score), 320, y, 34, C.ink);
    txt(c, r.reviewed ? 'Yes' : 'No', 1150, y, 38, r.reviewed ? C.sea : C.muted);
    txt(c, r.label ? 'Missed' : 'Met', 1375, y, 38, r.label ? C.red : C.ink);
    if (s.beat >= 2) mono(c, r.cost ? String(r.cost) : '0', 1692, y, 39, r.cost ? C.red : C.muted);
  });
  if (s.beat === 3) {
    txt(c, 'Try 0.80', 108, 873, 49);
    txt(c, '2 units per false alert', 500, 873, 48);
    txt(c, '10 units per unflagged miss', 1120, 873, 48);
    return;
  }
  if (s.beat === 4 && change < 1) return;
  const { tp, fp, fn, cost } = a.stats;
  mono(c, 'Precision  ' + tp + '/' + (tp + fp), 108, 873, 42, C.sea);
  if (s.beat >= 2) mono(c, 'Recall  ' + tp + '/' + (tp + fn), 738, 873, 42, C.sea);
  if (s.at(2, 'Total error cost') && (s.beat < 4 || s.at(5, 'END')))
    mono(c, 'Total cost  ' + cost, 1300, 873, 42, C.red);
  if (s.beat === 6)
    txt(c, 'The outcomes here came from the original review policy.', 111, 817, 36, C.muted);
}
function groups(extra) {
  const high = archive.filter((r) => r.score >= 0.5);
  const more = { score: sum(high.map((r) => r.score)) / high.length, label: true };
  return [archive.filter((r) => r.score < 0.5), extra ? [...high, more] : high].map((rows) => {
    const n = rows.length,
      hits = rows.filter((r) => r.label).length;
    return { rows, n, hits, mean: sum(rows.map((r) => r.score)) / n, frac: hits / n };
  });
}
export function calibration(c, s) {
  surface(c);
  if (s.beat <= 2) {
    heading(c, 'OUTCOME COUNTS    /    STORED POLICY 0.50', 'Two rates use different denominators');
    const a = replay(0.5);
    const bins = [
      ['Caught a miss', a.rows.filter((r) => r.reviewed && r.label)],
      ['False alert', a.rows.filter((r) => r.reviewed && !r.label)],
      ['Miss slipped through', a.rows.filter((r) => !r.reviewed && r.label)],
      ['On time, no review', a.rows.filter((r) => !r.reviewed && !r.label)],
    ];
    bins.forEach(([l, rows], i) => {
      const x = 116 + (i % 2) * 861,
        y = 288 + Math.floor(i / 2) * 235;
      line(
        c,
        [
          [x, y + 172],
          [x + 762, y + 172],
        ],
        C.rule,
        3,
      );
      txt(c, l, x, y + 32, 41);
      mono(c, rows.length, x + 664, y + 28, 48, C.sea);
      mono(c, rows.map((r) => r.id).join('   ') || '·', x, y + 115, 35, C.muted);
    });
    mono(c, 'Precision  2/3     Recall  2/2', 116, 762, 48, C.ink);
    if (s.beat === 2) txt(c, 'Cost per 1,000  =  2 units × 1,000 / 5  =  400', 116, 851, 44, C.red);
    return;
  }
  heading(c, 'CALIBRATION    /    VERIFIED OUTCOMES', 'Compare forecast with frequency');
  const extra = s.at(4, 'The mean prediction stays');
  groups(extra).forEach((g, i) => {
    const y = 360 + i * 270,
      x = 672,
      w = 1000;
    serif(c, i ? 'High scores' : 'Low scores', 114, y + 16, 52);
    mono(c, g.n + ' jobs', 120, y + 105, 39, C.muted);
    const bars = [
      ['Mean score', g.mean, C.sea],
      ['Missed', g.frac, C.red],
    ];
    bars.forEach(([l, v, col], j) => {
      const yy = y + j * 85;
      txt(c, l, x - 30, yy + 14, 32, col, { align: 'right' });
      box(c, x, yy, w, 30, '#cdd0b9', 4);
      if (v > 0) box(c, x, yy, v * w, 30, col, 4);
      mono(c, j ? g.hits + '/' + g.n : fix(v, 3), x + w + 24, yy + 15, 35, col);
    });
  });
  txt(
    c,
    s.beat === 5
      ? 'Log which jobs got help. Review can change the observed outcome.'
      : 'Each pair uses the same jobs and the same probability scale.',
    116,
    928,
    43,
    C.muted,
  );
}
export function checkOutcomes() {
  const [before, after] = [0.5, 0.8].map(replay);
  assert.deepEqual(
    [before.stats.tp, before.stats.fp, before.stats.fn, before.stats.cost],
    [2, 1, 0, 2],
  );
  assert.deepEqual(
    [after.stats.tp, after.stats.fp, after.stats.fn, after.stats.cost],
    [1, 0, 1, 10],
  );
  for (const t of [0.5, 0.68, 0.68001, 0.78, 0.78001, 0.8]) {
    const a = replay(t);
    assert.equal(sum(a.rows.map((r) => r.cost)), a.stats.cost);
    assert.equal(a.rows.filter((r) => r.reviewed).length, a.stats.tp + a.stats.fp);
  }
  const [small, high] = groups(false),
    changed = groups(true)[1];
  assert.equal(fix(small.mean, 3), '0.235');
  assert.equal(high.hits, 2);
  assert.deepEqual([changed.hits, changed.n, fix(changed.mean)], [3, 4, '0.79']);
}
