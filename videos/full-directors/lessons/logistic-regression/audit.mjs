import assert from 'node:assert/strict';
import {
  validationScores,
  auditProbabilities,
  plattFitStates,
} from '../../../films/logistic-regression/fixtures.mjs';
import { sigmoid } from '../../../films/logistic-regression/arithmetic.mjs';
import {
  rankingMetrics,
  prevalenceFixture,
  calibrationAudit,
  harmonicFixture,
  isotonicFixture,
} from '../../../films/logistic-regression/model.mjs';
import { sorted } from './dispatch.mjs';
import {
  ink,
  muted,
  teal,
  rust,
  blue,
  gold,
  white,
  light,
  sea,
  rose,
  yellow,
  board,
  text,
  label,
  rect,
  dot,
  line,
  path,
  ticket,
  readout,
  gridTable,
  plot,
  curve,
  cue,
  f,
  lerp,
  sum,
} from './paint.mjs';
const audit = (c, title) => board(c, 'Validation lab   /   closed case files', title);
const stats = rankingMetrics(validationScores);
const tieRows = validationScores.map((r) => ({ ...r, p: ['V3', 'V4'].includes(r.id) ? 0.6 : r.p }));
const tieStats = rankingMetrics(tieRows);
const iso = isotonicFixture(),
  isoAudit = rankingMetrics(iso.map((r) => ({ ...r, p: r.mapped })));
const flipped = validationScores.map((r) => (r.id === 'V4' ? 1 : r.label));
const calibration = calibrationAudit(),
  finer = calibrationAudit({ binCount: 8 }),
  changed = calibrationAudit({ labels: flipped });
const populations = ['base', 'repeat', 'easy'].map((mode) => prevalenceFixture(mode));

export function harmonic(c, k) {
  const b = k.beat.beatIndex,
    empty = b === 3 && cue(k, 3, 'zero-division convention', 0.6) === 1;
  const v = empty ? harmonicFixture(0, 0, 0) : harmonicFixture();
  audit(c, 'How much does one successful review tell us?');
  label(
    c,
    empty ? 'NO POSITIVES AND NO REVIEWS' : '100 REQUIRED CASES   /   ONE SELECTED',
    100,
    300,
    ink,
  );
  for (let i = 0; i < 100; i++) {
    const x = 115 + (i % 10) * 68,
      y = 381 + Math.floor(i / 10) * 51;
    rect(c, x, y, 46, 34, empty ? light : i === 0 ? teal : rose, 5);
    if (!empty && i === 0) text(c, '✓', x + 23, y + 16, 26, white, 'center');
  }
  readout(c, 'PRECISION     /     RECALL', empty ? '0/0     0/0' : '1/1     1/100', 960, 333);
  if (b >= 1) {
    readout(c, 'ARITHMETIC MEAN', empty ? 'Undefined' : f(v.arithmetic), 959, 518, muted);
    readout(
      c,
      b >= 2 ? '2 TP / (2 TP + FP + FN)' : 'HARMONIC MEAN   /   F1',
      empty ? '0/0' : f(v.f1, 4),
      959,
      708,
      rust,
    );
  } else text(c, 'F1 = 2 / (1/P + 1/R)', 957, 635, 48, ink, 'left', 'Mono');
}
function rankBars(c, rows, focus = []) {
  rows.forEach((v, i) => {
    const y = 340 + i * 65;
    label(c, v.id, 111, y, ink);
    rect(c, 199, y - 15, 655, 30, '#dee1cf', 5);
    rect(c, 199, y - 15, 655 * v.p, 30, v.label ? rust : blue, 5);
    label(c, f(v.p), 882, y, focus.includes(v.id) ? ink : muted, 'left', 28);
    if (focus.includes(v.id)) dot(c, 199 + 655 * v.p, y, 11, yellow, ink);
  });
}
export function ranking(c, k) {
  const b = k.beat.beatIndex,
    switchOpp = cue(k, 1, 'switch its opponent', 0.5) === 1;
  const focus = ['V3', switchOpp ? 'V6' : 'V4'];
  const firstPair = cue(k, 1, 'Point five nine five', 0) === 1;
  const secondPair = cue(k, 2, 'V three scores above', 0) === 1;
  audit(c, 'Which required request outranks its routine partner?');
  rankBars(c, sorted, b < 3 ? focus : []);
  const pos = validationScores.filter((r) => r.label),
    neg = validationScores.filter((r) => !r.label);
  if (b === 4) {
    const g = plot(c, {
      x: 1195,
      y: 343,
      w: 545,
      h: 342,
      xrange: [0, 1],
      yrange: [0, 1],
      xticks: [0, 0.5, 1],
      yticks: [0, 0.5, 1],
      xlabel: 'False-positive rate',
      ylabel: 'True-positive rate',
    });
    const pathPoints = [
      g.xy(0, 0),
      ...stats.groups.map((a) => g.xy(a.fp / neg.length, a.tp / pos.length)),
    ];
    path(c, [...pathPoints, g.xy(1, 0)], null, 0, sea);
    path(c, pathPoints, teal, 5);
    const pick = Math.min(7, Math.floor(8 * cue(k, 4, 'Sweep the cut', 3.2)));
    const group = stats.groups[pick];
    dot(c, ...g.xy(group.fp / neg.length, group.tp / pos.length), 12, rust);
    label(
      c,
      'Cut ' + f(group.score) + '   /   ' + (group.tp + group.fp) + ' reviews',
      1195,
      796,
      ink,
      'left',
      29,
    );
    return;
  }
  label(c, 'VS. ROUTINE REQUEST', 1250, 282);
  const count = b >= 3 ? 16 : Math.round(16 * cue(k, 2, 'Compare each required', 2.2));
  neg.forEach((r, j) => label(c, r.id, 1275 + j * 142, 354, ink, 'center'));
  pos.forEach((p, i) => {
    label(c, p.id, 1151, 427 + 91 * i, ink);
    neg.forEach((n, j) => {
      const known =
        i * 4 + j < count ||
        (p.id === 'V3' && ((n.id === 'V4' && firstPair) || (n.id === 'V6' && secondPair)));
      const x = 1212 + j * 142,
        y = 384 + i * 91,
        win = Number(p.p > n.p);
      rect(c, x, y, 126, 83, known ? (win ? sea : rose) : '#dfe1d0', 6);
      text(c, known ? win : '·', x + 63, y + 40, 44, ink, 'center', 'Mono');
    });
  });
  if (b >= 3)
    text(
      c,
      'AUC   ' + stats.pairWins + ' / ' + stats.pairCount + '  =  ' + f(stats.auc, 4),
      1480,
      806,
      38,
      ink,
      'center',
      'Mono',
    );
}
export function population(c, k) {
  const b = k.beat.beatIndex;
  audit(c, 'Which rates travel with a change in case mix?');
  if (b < 2) {
    const positives = b === 0 ? 4 : 0;
    for (let i = 0; i < 100; i++) {
      rect(
        c,
        109 + (i % 20) * 76,
        366 + Math.floor(i / 20) * 65,
        56,
        48,
        i < positives ? rose : sea,
        6,
      );
    }
    readout(c, 'ALL AUTOMATIC   /   ACCURACY', 100 - positives + ' / 100', 113, 762);
    readout(c, 'RECALL', '0 / ' + positives, 825, 762, rust);
    readout(c, 'PRECISION', '0 / 0', 1390, 762, rust);
    return;
  }
  const i = b === 2 ? 0 : b === 3 ? 1 : 2,
    v = populations[i];
  label(
    c,
    [
      'Original eight requests',
      'Every negative appears 25 times',
      '100 extra negatives with score zero',
    ][i],
    104,
    302,
    ink,
    'left',
    34,
  );
  const max = 104;
  [
    ['All routine cases', v.negatives, blue],
    ['Routine in review', v.fp, rust],
    ['Required in review', v.tp, teal],
  ].forEach(([name, n, color], j) => {
    const y = 430 + j * 130;
    text(c, name, 95, y, 36);
    rect(c, 460, y - 20, 777, 39, light, 4);
    rect(c, 460, y - 20, (777 * n) / max, 39, color, 4);
    label(c, n, 1265, y, color);
  });
  readout(c, 'PRECISION', f(v.precision, 4), 1395, 340);
  readout(c, 'FPR', f(v.fpr, 4), 1395, 500);
  readout(c, 'AUC', f(v.auc, 4), 1395, 658);
  text(
    c,
    'TPR = 1     ·     ' + v.pairWins + ' wins / ' + v.pairCount + ' positive–negative comparisons',
    96,
    794,
    39,
  );
}
export function thresholds(c, k) {
  const b = k.beat.beatIndex,
    v = b >= 3 ? tieStats : stats,
    groups = v.groups;
  audit(
    c,
    b >= 3
      ? 'What happens when two files have the same score?'
      : 'Collect everyone who shares the cut',
  );
  const n =
    b === 0
      ? Math.max(1, Math.ceil(groups.length * cue(k, 0, 'as the cut moves', 2.6)))
      : groups.length;
  gridTable(c, {
    x: 89,
    y: 263,
    columns: [247, 151, 199, 186, 210],
    headers: ['Group', 'Score', 'Precision', 'Recall', 'Δrecall × P'],
    rowH: 60,
    rows: groups.map((g, i) => [
      g.rows.map((r) => r.id).join(' + '),
      f(g.score),
      i < n ? f(g.precision, 2) : '·',
      i < n ? f(g.recall, 2) : '·',
      b >= 1 ? f(g.contribution, 3) : '·',
    ]),
    highlight: b >= 3 ? groups.findIndex((g) => g.rows.length > 1) : n - 1,
  });
  const g = plot(c, {
    x: 1200,
    y: 347,
    w: 540,
    h: 301,
    xrange: [0, 1],
    yrange: [0, 1],
    xticks: [0, 0.5, 1],
    yticks: [0, 0.5, 1],
    xlabel: 'Recall',
    ylabel: 'Precision',
  });
  const data = [[0, 1], ...groups.slice(0, n).map((r) => [r.recall, r.precision])];
  if (b >= 4)
    path(
      c,
      data.map((p) => g.xy(...p)),
      rust,
      4,
    );
  let prev = data[0];
  for (const pt of data.slice(1)) {
    path(c, [g.xy(...prev), g.xy(prev[0], pt[1]), g.xy(...pt)], teal, 5);
    dot(c, ...g.xy(...pt), 7, teal);
    prev = pt;
  }
  if (b >= 2) text(c, 'AP  ' + f(v.ap, 4), 1210, 752, 43, teal, 'left', 'Mono');
  if (b >= 4) {
    const trapezoid = sum(
      data.slice(1).map(([rec, prec], i) => ((rec - data[i][0]) * (prec + data[i][1])) / 2),
    );
    label(c, 'Trapezoids  ' + f(trapezoid, 4), 1210, 803, rust);
  } else if (b === 3) label(c, 'Tied pair earns ½ credit in AUC.', 1185, 803, ink);
}
export function rescale(c, k) {
  audit(c, 'Can every score change while the ranking holds?');
  const q = cue(k, 0, 'Watch the same request bars', 2.1);
  const transform = (p) => lerp(p, p * p, q);
  const cut = lerp(0.5, 0.25, cue(k, 1, 'Moving the numeric cut', 1.5));
  const X = (i) => 181 + i * 220,
    Y = (v) => 750 - v * 392;
  sorted.forEach((v, i) => {
    const p = transform(v.p);
    rect(c, X(i) - 64, Y(p), 128, 750 - Y(p), v.label ? rust : blue, 4);
    label(c, f(p), X(i), Y(p) - 25, ink, 'center');
    label(c, v.id, X(i), 784, ink, 'center');
  });
  if (k.beat.beatIndex === 1) {
    line(c, 100, Y(cut), 1830, Y(cut), gold, 6);
    label(c, 'Cut ' + f(cut, 2), 105, 302, ink);
  }
  text(
    c,
    'Same ' + stats.pairWins + ' wins in ' + stats.pairCount + ' pairs',
    1810,
    301,
    36,
    ink,
    'right',
    'Serif',
  );
}
export function frequencies(c, k) {
  audit(c, 'What did the closed labels add to each bin?');
  const n = Math.round(8 * cue(k, 1, 'Open the outcome covers', 3.2));
  const flip = cue(k, 2, 'Change just one label', 0.5) === 1;
  const auditState = flip ? changed : calibration;
  for (const [i, bin] of auditState.bins.entries()) {
    const x = 102 + i * 437,
      open = bin.rows.filter((r) => Number(r.id.slice(1)) <= n);
    rect(c, x, 311, 407, 547, '#e0e4d4', 12);
    label(c, f(i / 4, 2) + ' – ' + f((i + 1) / 4, 2), x + 204, 348, ink, 'center', 30);
    bin.rows.forEach((r, j) => {
      const shown = open.includes(r);
      const X = x + 22 + j * 121;
      rect(c, X, 402, 113, 96, shown ? (r.label ? rose : sea) : white, 5);
      label(c, r.id, X + 57, 428, ink, 'center');
      label(c, shown ? 'y = ' + r.label : 'sealed', X + 57, 470, muted, 'center', 21);
    });
    const y = 760,
      h = 205;
    rect(c, x + 70, y - h * bin.forecast, 89, h * bin.forecast, teal, 4);
    label(c, f(bin.forecast), x + 115, y - h * bin.forecast - 24, teal, 'center', 23);
    line(c, x + 37, y, x + 371, y, muted, 2);
    if (open.length === bin.n) {
      rect(c, x + 243, y - h * bin.observed, 89, h * bin.observed || 2, rust, 3);
      label(
        c,
        sum(open.map((r) => r.label)) + '/' + bin.n,
        x + 288,
        y - h * bin.observed - 24,
        rust,
        'center',
      );
    }
    label(c, 'forecast', x + 115, 809, ink, 'center');
    label(c, 'observed', x + 288, 809, ink, 'center');
  }
  if (flip) text(c, 'Counterfactual   ·   V4 changed to required', 960, 860, 37, rust, 'center');
}
export function gaps(c, k) {
  const b = k.beat.beatIndex;
  const eight = cue(k, 3, 'from four bins to eight', 0.3) === 1 &&
    cue(k, 4, 'Return to four bins', 0.4) < 1;
  const flip = b >= 4 && cue(k, 4, 'from routine to required', 0.3) === 1;
  const v = flip ? changed : eight ? finer : calibration;
  audit(c, 'How much does each bin add to the error?');
  const rows = v.bins.map((g) => [
    f(g.index / v.bins.length, 3),
    g.n,
    g.n ? f(g.forecast) : '·',
    g.n ? f(g.observed) : '·',
    g.n ? f(g.gap) : '·',
    f(g.contribution, 4),
  ]);
  gridTable(c, {
    x: 90,
    y: 298,
    columns: [150, 115, 173, 172, 158, 214],
    headers: ['Bin start', 'Count', 'Forecast', 'Observed', '|Gap|', 'Weighted gap'],
    rows,
    rowH: eight ? 66 : 99,
    highlight: b === 1 ? 0 : flip ? 2 : -1,
  });
  readout(c, 'BIN WEIGHT', 'bin count / 8', 1200, 306);
  if (b >= 2) {
    readout(c, v.bins.length + '-BIN ECE', f(v.ece, 4), 1200, 468, rust);
    readout(c, 'ROW-WISE BRIER', f(v.brier, 4), 1200, 619);
  }
  if (b === 2 && cue(k, 2, 'V four scored', 0.5) === 1)
    label(
      c,
      'V4    (0.624 − 0)² = ' + f((auditProbabilities[3] - 0) ** 2),
      1195,
      814,
      ink,
      'left',
      27,
    );
  if (b >= 4 && !eight) readout(c, 'F1 AT 0.50', f(v.f1, 3), 1200, 724, blue, 47);
  text(
    c,
    flip
      ? 'V4 now required   ·   V3 and V4 both positive in bin 3'
      : eight
        ? '·   No observations in this bin. Its contribution to ECE is zero.'
        : 'Weighted gap = count / 8 × |forecast − observed|',
    93,
    255,
    34,
  );
}
export function maps(c, k) {
  const b = k.beat.beatIndex,
    step = Math.round(1000 * cue(k, 0, 'Platt scaling fits', 1.8));
  const [a, d] = plattFitStates[step];
  const map = (p) => sigmoid(a * Math.log(p / (1 - p)) + d);
  const isoVisible = cue(k, 0, 'Isotonic regression', 0.4) > 0;
  audit(c, 'What does a calibration map do to the ordering?');
  const g = plot(c, {
    xrange: [0, 1],
    yrange: [0, 1],
    xticks: [0, 0.25, 0.5, 0.75, 1],
    yticks: [0, 0.25, 0.5, 0.75, 1],
    h: 420,
    xlabel: 'Raw review score',
    ylabel: 'Mapped probability',
  });
  line(c, ...g.xy(0, 0), ...g.xy(1, 1), light, 3);
  curve(c, g, map, 0.001, 0.999, teal, 6);
  if (isoVisible) {
    iso.forEach((r, i) => {
      dot(c, ...g.xy(r.p, r.mapped), 10, rust);
      if (i) {
        const prev = iso[i - 1];
        path(c, [g.xy(prev.p, prev.mapped), g.xy(r.p, prev.mapped), g.xy(r.p, r.mapped)], rust, 4);
      }
    });
  }
  if (b === 0) {
    readout(c, 'PLATT   /   SIGMOID', f(a, 2) + ' z + ' + f(d, 2), 1290, 344, teal, 40);
    if (isoVisible) readout(c, 'ISOTONIC', 'Pooled labels', 1290, 559, rust, 43);
  } else if (b === 1) {
    readout(c, 'RAW AUC', f(stats.auc, 4), 1290, 330);
    readout(c, 'ISOTONIC AUC', f(isoAudit.auc, 4), 1290, 499, rust);
    label(c, 'T > 0 preserves logit order.', 1260, 715, ink);
  } else {
    const r = iso.find((r) => r.id === 'V4');
    readout(c, 'V4   /   RAW → MAPPED', f(r.p) + ' → ' + f(r.mapped), 1240, 329, rust, 45);
    readout(c, 'AT CUT 0.60', r.mapped >= 0.6 ? 'Review' : 'Automatic', 1240, 500);
    text(c, 'Verify on fresh labels.', 1240, 745, 43, ink, 'left', 'Serif');
  }
}
export function checkAudit() {
  assert.equal(f(stats.ap, 4), '0.8542');
  assert.equal(tieStats.groups.filter((g) => g.rows.length === 2).length, 1);
  assert.equal(tieStats.pairWins, 13.5);
  assert.equal(f(changed.ece), '0.209');
  assert.equal(f(changed.f1), '0.889');
  assert.equal(f(finer.ece, 4), '0.1539');
  assert.deepEqual(finer.bins.filter((g) => !g.n).map((g) => [g.index, g.contribution]),
    [[3, 0], [5, 0], [6, 0]]);
  assert.equal(f(calibration.brier), '0.158');
  assert.equal(iso.find((r) => r.id === 'V4').mapped, 0.5);
  assert(isoAudit.auc !== stats.auc);
  assert.deepEqual(
    populations.map((v) => v.tp + v.fp),
    [6, 54, 6],
  );
  assert.equal(f(populations[2].auc, 4), '0.9928');
  assert.deepEqual(
    sorted.map((r) => r.p >= 0.5),
    sorted.map((r) => r.p * r.p >= 0.25),
  );
}
