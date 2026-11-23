import { C, beat, cue, mix } from './studio.mjs';
import {
  GATE_CASES,
  articleSelectionRows,
} from '../../../films/capstone-fine-tuned-classifier/fixtures.mjs';
import { ACTUAL_COMPARISON } from '../../../films/capstone-fine-tuned-classifier/fixtures/actual-models.mjs';
import {
  evaluateGate,
  thresholdCounts,
  temperature,
  reviewLoss,
  guardedLoss,
  costCutoff,
  extraReviewCost,
  missedEscalationCost,
} from '../../../films/capstone-fine-tuned-classifier/model.mjs';
import { cord, housing, handset } from './telephone.mjs';

export const names = ['After hours', 'Freeze', 'Recovery', 'Rotation', 'Policy', 'Status'];
export const supplied = GATE_CASES.map((r) => ({ fixture_id: r.id, score: r.score }));
export const twoCalls = [
  { name: 'Freeze', p: 0.42, y: 1 },
  { name: 'Guide', p: 0.44, y: 0 },
];
export const fits = ACTUAL_COMPARISON.map((m) => {
  const byId = new Map(m.rows.map((r) => [r.fixture_id, r.score]));
  return {
    scores: GATE_CASES.map((r) => byId.get(r.id)),
    cut: m.threshold,
    result: evaluateGate(m.rows, m.threshold),
  };
});
export const labelRoute = (score, cut) => (score >= cut ? 'Human review' : 'Guarded agent');
export const cutoff14 = (a, b, c) => 0.5 - 0.06 * a - 0.02 * b - 0.07 * c;
export function twoThreshold(p, k) {
  p.surface('desk');
  p.title('Which line rings as the cutoff falls?');
  const cut = Number(
    cutoff14(
      cue(k, 4, 'Move the line down', 1.1),
      cue(k, 4, 'Move to point four two', 1.15),
      cue(k, 4, 'Continue to point three five', 1.1),
    ).toFixed(3),
  );
  const x = (v) => 640 + ((v - 0.3) / 0.25) * 825,
    show = !!cue(k, 2, 'both go to the guarded agent');
  p.paper(106, 248, 1706, 610);
  p.cap('Fixed score', 397, 309);
  p.cap('Human desk', 1536, 311);
  twoCalls.forEach((row, i) => {
    const y = 455 + i * 194;
    p.txt(row.name, 151, y - 28, 62, C.ink, { face: 'Serif' });
    p.txt(row.y ? 'Requires review' : 'Routine question', 151, y + 45, 39, C.muted);
    p.line(x(0.3), y, x(0.55), y, C.rule, 7);
    p.dot(x(row.p), y, 14, C.ink);
    p.num(row.p.toFixed(2), 419, y - 26, 47);
    if (show) p.lampAt(1640, y, row.p >= cut, 0.94);
  });
  if (show) {
    p.line(x(cut), 378, x(cut), 717, C.rust, 7);
    p.mid(
      'Cutoff ' + (Number.isInteger(Math.round(cut * 1000) / 10) ? cut.toFixed(2) : cut.toFixed(3)),
      x(cut),
      766,
      43,
      C.rust,
    );
  }
  if (beat(k) === 5) {
    const n = thresholdCounts(twoCalls, cut);
    p.txt('Required misses   ' + n.FN + '       Extra reviews   ' + n.FP, 119, 942, 51);
  }
}
export const selectionAt = (t) => thresholdCounts(articleSelectionRows, t);
function scoreInventory(p, rows, cut, { top = 258, results = true } = {}) {
  p.grid(
    110,
    top,
    1700,
    ['Ticket', 'Reviewed label', 'Score', 'Route at ' + cut.toFixed(2)],
    rows.map((r) => {
      const label = r.gold ?? r.y,
        score = r.score ?? r.p,
        send = score >= cut;
      return [
        r.label ?? r.id,
        label ? 'Required' : 'Routine',
        score.toFixed(2),
        results ? [send ? 'Review' : 'Guarded', send !== !!label ? C.rust : C.ink] : '…',
      ];
    }),
    [0.35, 0.22, 0.15, 0.28],
    { step: 77, size: 39 },
  );
}
export function selection(p, k) {
  p.surface();
  const b = beat(k);
  if (b <= 5) {
    p.title('Six labeled selection tickets');
    const middle = cue(k, 2, 'Raise the cutoff to one half'),
      high = cue(k, 2, 'Raise the cutoff again');
    const chosen = cue(k, 5, 'It’s the only candidate');
    const cut = chosen ? 0.35 : high ? 0.75 : middle ? 0.5 : 0.35;
    scoreInventory(p, articleSelectionRows, cut);
    const n = selectionAt(cut);
    if (b <= 3)
      p.txt(
        'Caught   ' + n.TP + '        Extra reviews   ' + n.FP + '        Misses   ' + n.FN,
        118,
        853,
        48,
      );
    if (b >= 4) {
      [0.35, 0.5, 0.75].forEach((t, i) => {
        const s = selectionAt(t);
        const x = 113 + i * 573;
        p.box(x, 824, 540, 126, chosen && t === 0.35 ? C.mint : C.page, 12);
        p.txt(t.toFixed(2) + ' cutoff', x + 18, 860, 38);
        p.txt(s.FN + ' missed   /   ' + s.FP + ' extra', x + 18, 910, 35);
      });
      if (chosen) p.txt('Lock 0.35 and evaluate different tickets.', 129, 1003, 38, C.teal);
    }
    return;
  }
  p.title('What would each route cost on average?');
  p.txt('Calibrated p   ·   fixed costs   ·   zero cost on correct routes', 123, 232, 42);
  const x0 = 176,
    y0 = 815,
    w = 869,
    h = 445,
    x = (v) => x0 + (w * v) / 0.5,
    y = (v) => y0 - (h * v) / 3;
  p.line(x0, y0, x(0.5), y0, C.ink, 4);
  p.line(x0, y0, x0, y(3), C.ink, 4);
  [0, 1, 2, 3].forEach((v) => p.num(v, 114, y(v), 31));
  [0, 0.25, 0.5].forEach((v) => p.mid(v.toFixed(2), x(v), 866, 33));
  p.txt('Chance of escalation', 142, 982, 37);
  const exampleP = 0.30;
  p.cap('Cost per mistake', 1196, 318);
  const lines = cue(k, 7, 'Reviewing costs');
  p.txt('Extra review   ' + extraReviewCost, 1196, 393, 46, C.teal);
  p.txt('Missed escalation   ' + missedEscalationCost, 1196, 465, 46, C.rust);
  if (lines) {
    p.cap('Expected cost per ticket', 1196, 568);
    p.line(x(0), y(reviewLoss(0)), x(0.5), y(reviewLoss(0.5)), C.teal, 8);
    p.txt('Review = ' + extraReviewCost + '(1 − p)', 1196, 640, 46, C.teal);
  }
  if (cue(k, 7, 'Passing it to the agent')) {
    p.line(x(0), y(guardedLoss(0)), x(0.5), y(guardedLoss(0.5)), C.rust, 8);
    p.txt('Guarded = ' + missedEscalationCost + 'p', 1196, 710, 46, C.rust);
  }
  if (cue(k, 8, 'In general')) {
    p.dot(x(costCutoff), y(reviewLoss(costCutoff)), 13, C.ink);
    p.txt('Break-even  ' + costCutoff.toFixed(2), 347, 454, 38, C.ink);
  }
  if (cue(k, 8, 'Which lane costs less')) {
    p.line(x(exampleP), y0, x(exampleP), y(2.05), C.muted, 2);
    p.mid('p = ' + exampleP.toFixed(2), x(exampleP), 916, 34, C.muted);
  }
  if (cue(k, 9, 'Choose human review')) {
    for (const [f, c] of [
      [reviewLoss, C.teal],
      [guardedLoss, C.rust],
    ])
      p.dot(x(exampleP), y(f(exampleP)), 11, c);
    p.txt('At p = ' + exampleP.toFixed(2), 1196, 823, 37);
    const comparison =
      reviewLoss(exampleP).toFixed(2) + ' review   <   ' + guardedLoss(exampleP).toFixed(2) + ' guarded';
    p.txt(comparison, 1196, 899, 43, C.teal, { max: 615 });
  }
}
export function gate(p, k) {
  p.surface();
  const b = beat(k),
    v2 = cue(k, 3, 'to the same supplied scores'),
    cut = v2 ? 0.35 : 0.5;
  p.title('Open the evaluator’s six new tickets');
  const visible = cue(k, 2, 'Find the freeze-window ticket');
  scoreInventory(p, GATE_CASES, cut, { results: !!visible });
  const showV1 = cue(k, 2, 'Keep that result'),
    showV2 = cue(k, 3, 'Its return value');
  for (const [i, t, show] of [
    [0, 0.5, showV1],
    [1, 0.35, showV2],
  ])
    if (show) {
      const r = evaluateGate(supplied, t),
        x = 118 + i * 875;
      p.txt('Bundle v' + (i + 1) + '   /   ' + t.toFixed(2) + ' cutoff', x, 842, 41);
      p.txt(
        r.FN +
          ' missed  ·  ' +
          r.FP +
          ' extra  ·  ' +
          (r.decision === 'hold' ? 'Hold' : 'Eligible for shadow'),
        x,
        915,
        43,
        r.FN ? C.rust : C.teal,
        { max: 838 },
      );
    }
  if (b >= 4)
    p.txt(
      b === 4
        ? 'Supplied scores test the evaluator. Actual shadow traffic needs approval and model scores.'
        : 'Check accounts, incidents and copied text across partitions.',
      120,
      1001,
      35,
    );
}
export const flooded = supplied.map((r, i) => ({ ...r, score: GATE_CASES[i].gold ? r.score : 0.8 }));
export function receipt(p, k) {
  p.surface();
  const b = beat(k);
  if (b === 2 || b === 3) {
    p.title(
      b === 2 ? 'Reject a changed inventory before counting' : 'A score has a strict type and range',
    );
    const tests =
      b === 2
        ? [
            ['Omit recovery', supplied.filter((_, i) => i !== 2)],
            ['Add status again', [...supplied, supplied.at(-1)]],
            ['Add an easy fixture', [...supplied, { fixture_id: 'extra', score: 0.1 }]],
            ['Submit gold with a score', supplied.map((r, i) => (i === 1 ? { ...r, gold: 0 } : r))],
          ]
        : [NaN, Infinity, true, '0.41', null].map((v) => [
            typeof v === 'string' ? '“' + v + '”' : String(v),
            supplied.map((r, i) => (i === 1 ? { ...r, score: v } : r)),
          ]);
    p.grid(
      115,
      293,
      1690,
      [b === 2 ? 'Report change' : 'Submitted score', 'Evaluator result', 'Metrics'],
      tests.map(([label, rows]) => [label, evaluateGate(rows).reason, 'Withheld']),
      [0.43, 0.36, 0.21],
      { step: 101, size: 45 },
    );
    p.txt(
      b === 2
        ? 'A changed dataset or cutoff also breaks the pinned report identity.'
        : 'Accept a finite number from 0 through 1.',
      122,
      930,
      44,
    );
    return;
  }
  p.title(b === 1 ? 'Who owns which part of this receipt?' : 'Run the capacity test');
  const changed = cue(k, 4, 'All three routine lines'),
    rows = changed ? flooded : supplied;
  p.grid(
    112,
    263,
    1694,
    ['Evaluator’s fixture', 'Owned label', 'Worker score', b === 4 ? 'Human desk' : 'Submitted fields'],
    rows.map((r, i) => [
      names[i],
      GATE_CASES[i].gold ? 'Required' : 'Routine',
      r.score.toFixed(2),
      b === 4 ? '' : 'ID + score',
    ]),
    [0.29, 0.23, 0.23, 0.25],
    { step: 86, size: 39 },
  );
  if (b === 4) rows.forEach((r, i) => p.lampAt(1530, 263 + 86 * (i + 1), r.score >= 0.35, 0.63));
  if (b === 1)
    p.txt('Pin data, label guide, split, model, selection set and gate policy.', 120, 945, 43);
  else {
    const n = evaluateGate(rows);
    p.txt(
      'Routine reviews   ' + n.FP + ' / 1 allowed      ·      Required misses   ' + n.FN,
      123,
      913,
      45,
      n.FP > 1 ? C.rust : C.teal,
    );
  }
}
export const keyScores = supplied.map((r, i) => ({ ...r, score: GATE_CASES[i].gold }));
export function provenance(p, k) {
  p.surface();
  const b = beat(k);
  p.title('Where did these six scores come from?');
  if (b === 1) {
    p.cap('Evaluator unit test', 118, 288);
    keyScores.forEach((r, i) => {
      const x = 119 + i * 282;
      p.paper(x, 387, 259, 261);
      p.mid(names[i], x + 129, 447, 37);
      p.mid(r.score, x + 129, 556, 88, C.ink, { face: 'Mono' });
    });
    if (cue(k, 1, 'Which model earned')) p.stamp('Arithmetic passes', 123, 746, C.teal);
    if (cue(k, 1, 'These scores came from'))
      p.txt('Source   /   known answer key', 711, 793, 50, C.rust);
    return;
  }
  p.paper(110, 307, 806, 463);
  p.paper(997, 307, 809, 463);
  p.cap('Evaluator', 155, 376);
  p.cap('Scoring execution', 1048, 376);
  p.txt('Owns the six ticket texts', 158, 490, 53, C.ink, { max: 718 });
  p.txt('Owns labels, slices and cutoff', 158, 604, 49, C.ink, { max: 718 });
  p.txt(b === 2 ? 'Which export ran?' : 'Load approved fixed export', 1048, 490, 52, C.ink, {
    max: 712,
  });
  p.txt(
    b === 2 ? 'Which inputs did it see?' : 'Bind scores to this run and text',
    1048,
    604,
    48,
    C.ink,
    { max: 712 },
  );
  p.txt(
    b === 2
      ? 'A read-only label map protects the entries through that view.'
      : 'Check provenance and the resulting gate errors separately.',
    128,
    883,
    47,
  );
}
export function models(p, k) {
  const b = beat(k);
  p.surface('desk');
  if (b <= 2 || !cue(k, 3, 'The three required calls')) {
    p.title('Six calls on the same frozen gate');
    p.grid(
      114,
      275,
      1693,
      ['Call', 'Evaluator', 'TF-IDF', 'Tiny encoder'],
      names.map((n, i) => [
        n,
        GATE_CASES[i].gold ? 'Required' : 'Routine',
        ...fits.map((m) => (m.scores[i] < 0.001 ? '<0.001' : m.scores[i].toFixed(3))),
      ]),
      [0.25, 0.25, 0.25, 0.25],
      { step: 90, size: 45 },
    );
    p.txt('Review at 0.35     ·     0 required misses     ·     at most 1 extra review', 115, 933, 45);
    return;
  }
  const tiny = cue(k, 4, 'Freeze now scores'),
    which = tiny ? 1 : 0,
    m = fits[which];
  const ctx = p.ctx;
  cord(ctx);
  housing(ctx);
  handset(ctx, 0);
  p.box(625, 145, 985, 119, C.dark, 16);
  p.txt(which ? 'Tiny encoder' : 'TF-IDF baseline', 667, 205, 60, C.page);
  p.txt('≥ 0.35', 1360, 205, 43, C.page);
  ['Required calls    /    all three must ring', 'Routine calls    /    one spare review'].forEach(
    (s, j) => p.txt(s, 652, 330 + j * 247, 43),
  );
  names.forEach((n, i) => {
    const x = 789 + 311 * (i % 3),
      y = 407 + 247 * Math.floor(i / 3);
    p.lampAt(x, y, m.scores[i] >= m.cut, 1.09);
    p.mid(n, x, y + 77, 43, C.ink);
    p.mid(m.scores[i] < 0.001 ? '<0.001' : m.scores[i].toFixed(3), x, y + 128, 37, C.teal, {
      face: 'Mono',
    });
  });
  const verdict = which ? cue(k, 4, 'Its quiet routine bank') : cue(k, 3, 'The freeze request made it');
  if (verdict)
    p.stamp(
      which
        ? 'Hold   /   ' + m.result.FN + ' required calls missed'
        : 'Hold   /   ' + m.result.FP + ' routine reviews for 1 slot',
      634,
      907,
      C.rust,
      1160,
    );
  if (b === 6) p.txt('Pretrained candidate still needs its own run.', 633, 1027, 37);
}
export function calibration(p, k) {
  p.surface('lab');
  p.title('Two scores, one fixed cutoff');
  const T = 1 + cue(k, 2, 'The bars move closer', 1.4),
    s = temperature(0.3, T);
  const y0 = 817,
    scale = 618;
  p.line(139, y0, 1284, y0, C.muted, 4);
  const cut = 0.35;
  const b = beat(k);
  const decided = b > 2 || (b === 2 && k.reveal('crosses the cutoff', 0, { captionStart: false }));
  const reviewTop = y0 - s * scale;
  const crossing = y0 - cut * scale;
  [
    [1 - s, 'Guarded class', C.blue],
    [s, 'Review class', C.teal],
  ].forEach(([v, label, col], i) => {
    const x = 248 + i * 537,
      top = y0 - v * scale;
    p.box(x, top, 305, y0 - top, col, 8);
    p.mid(v.toFixed(3), x + 152, y0 - 65, 57, C.page, { face: 'Mono' });
    p.mid(label, x + 152, 858, 47);
  });
  p.line(783, crossing, 1168, crossing, C.rust, 5);
  p.txt('0.35 cutoff', 1175, crossing, 37, C.rust);
  if (decided) {
    p.line(1125, crossing, 1125, reviewTop, C.rust, 5);
    p.line(1114, reviewTop, 1136, reviewTop, C.rust, 5);
  }
  p.cap('Temperature', 1401, 343);
  p.num(T.toFixed(2), 1397, 444, 88);
  p.cap('Intake', 1401, 602);
  const route = b === 2 && !decided ? 'Compare to cutoff' : labelRoute(s, cut);
  p.txt(route, 1400, 687, 55, decided ? C.rust : C.ink, { max: 435 });
  if (b === 3) {
    p.txt('Fit T on held-out logits.', 1401, 755, 35, C.ink, { max: 430 });
    p.txt('Test scores and cutoff', 1401, 805, 35, C.ink, { max: 430 });
    p.txt('on fresh tickets.', 1401, 850, 35, C.ink, { max: 430 });
  }
}
export const bucketGroups = [
  [0, 0.4],
  [0.4, 0.7],
  [0.7, 1.00001],
].map(([lo, hi]) => articleSelectionRows.filter((r) => r.p >= lo && r.p < hi));
export const bucketStats = (g) => ({
  n: g.length,
  positive: g.reduce((n, r) => n + r.y, 0),
  mean: g.reduce((n, r) => n + r.p, 0) / g.length,
});
export function buckets(p, k) {
  p.surface();
  const b = beat(k);
  if (b <= 4) {
    p.title('How often did tickets in each score range need review?');
    ['Below 0.40', '0.40 to < 0.70', '0.70 through 1'].forEach((name, i) => {
      const x = 113 + 575 * i;
      p.paper(x, 272, 546, 578);
      p.cap(name, x + 27, 336);
      if (i >= b) return;
      const group = bucketGroups[i],
        s = bucketStats(group);
      group.forEach((r, j) => {
        const y = 430 + j * 101;
        p.num(r.p.toFixed(2), x + 32, y, 56);
        p.txt(r.y ? 'Required' : 'Routine', x + 223, y, 43, r.y ? C.blue : C.muted);
      });
      p.line(x + 24, 611, x + 520, 611);
      p.txt('Mean score   ' + Number(s.mean.toFixed(3)), x + 28, 673, 41);
      p.txt('Required   ' + s.positive + ' of ' + s.n, x + 28, 766, 47, C.teal);
    });
    p.txt('Selection tickets   /   two observations per bucket', 122, 941, 45);
    return;
  }
  p.title('From a binary score back to a logit difference');
  p.txt('For 0 < p < 1 and T > 0', 123, 261, 46);
  p.num('d = ln(p / (1 − p))', 120, 416, 70);
  if (b >= 6) p.num('d / T', 120, 579, 72);
  if (b >= 7) p.num('p′ = 1 / (1 + exp(−d / T))', 120, 743, 64);
  p.txt(
    b === 5
      ? 'Fit T on held-out logits by minimizing negative log likelihood.'
      : 'A positive temperature preserves class order. The routed lane may change.',
    124,
    924,
    43,
  );
}
