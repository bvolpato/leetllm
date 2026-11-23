import {
  COSTS,
  MONTHS,
  MAY_EVIDENCE,
  MAY_POLICY,
  APRIL_SCORED_ROWS,
  STAGE_SERIES,
} from '../../../films/boosted-trees/fixtures.mjs';
import {
  BASELINE_DECISIONS,
  APRIL_BOUNDARIES,
  selectedApril,
  evaluateAprilThreshold,
  allAlertApril,
} from '../../../films/boosted-trees/model.mjs';
import { expectedCost, sliceResult } from '../../../films/boosted-trees/arithmetic.mjs';
import { num, mix } from './studio.mjs';

export const stored = selectedApril.threshold,
  printed = +stored.toFixed(6);
export const boundaryRows = APRIL_SCORED_ROWS.filter((r) => r.score === stored);
export const rounded = evaluateAprilThreshold(printed);
const coarse = evaluateAprilThreshold(0.15);
export function riskCost(p, miss, alert) {
  return expectedCost({ risk: p, missCost: miss, alert });
}
export const crossing = (miss) => COSTS.falseAlarm / (COSTS.falseAlarm + miss);
const costs = [COSTS.standardMiss, COSTS.priorityMiss];
const aprBaseline = [
  { name: 'Heartbeat ≥ 18 h', tp: 48, fp: 30, fnStandard: 2, fnPriority: 8 },
  { name: 'Alert on everyone', tp: 58, fp: 82, fnStandard: 0, fnPriority: 0 },
  { name: 'Stay quiet', tp: 0, fp: 0, fnStandard: 25, fnPriority: 33 },
];
export const charges = (r) => [
  r.fp * COSTS.falseAlarm,
  r.fnStandard * COSTS.standardMiss,
  r.fnPriority * COSTS.priorityMiss,
];
const sum = (a) => a.reduce((s, x) => s + x, 0);
export function risk(v) {
  const { c, b, cue, end, txt, mono } = v;
  const priority = b >= 4,
    which = Number(priority),
    example = BASELINE_DECISIONS[which];
  v.heading(
    'True breach risk   /   8% in both tiers',
    priority ? 'Change just the cost of a miss' : 'Who pays for an alert?',
  );
  v.grid(100, 10, 156, 361, 42, 42, (i) => (i < 8 ? c.red : c.blue), 31);
  txt('8 misses', 153, 832, 39, c.red);
  txt('92 on time', 389, 832, 39, c.blue);
  txt('Send an alert', 758, 366, 44, c.blue);
  mono('92 / 100 × 8', 760, 460, 48);
  if (b >= 2) mono('= ' + num(example.alertCost), 1390, 460, 65, c.blue);
  if (b >= 3) {
    txt('Stay quiet   /   ' + example.tier, 758, 596, 44, c.red);
    mono('8 / 100 × ' + example.missCost, 760, 690, 48);
    if ((b === 3 && cue(3, 'Leave the standard')) || (b === 5 && cue(5, 'The alert still')))
      mono('= ' + num(example.noAlertCost), 1390, 690, 65, c.red);
  }
  if ((b === 3 && end(3)) || (b === 5 && end(5)))
    v.serif(priority ? 'Send the alert' : 'Leave the standard job alone', 755, 854, 60, c.gold);
}

export function riskLines(v) {
  const { c, b, cue, txt, mono } = v;
  v.heading(
    'Expected cost per job   /   correct decisions cost zero',
    'Where is an alert cheaper?',
  );
  const { X, Y } = v.axis(
    166,
    802,
    1135,
    458,
    0.16,
    24,
    [0, 0.04, 0.08, 0.12, 0.16],
    [0, 6, 12, 18, 24],
    (p) => Math.round(p * 100) + '%',
  );
  txt('Cost units', 155, 284, 30, c.muted);
  txt('True miss probability', 740, 911, 36, c.muted, 'center');
  const lines = [
    ['Alert', true, 60, c.gold],
    ['Quiet · standard', false, 60, c.blue],
    ['Quiet · priority', false, 150, c.red],
  ];
  lines.forEach(([label, alert, miss, col], i) => {
    const revealed =
      i === 0 || (i === 1 && cue(1, 'Staying quiet')) || (i === 2 && cue(1, 'coral line'));
    if (!revealed) return;
    v.line(X(0), Y(riskCost(0, miss, alert)), X(0.16), Y(riskCost(0.16, miss, alert)), col, 7);
    const y = 392 + i * 149;
    v.line(1380, y, 1442, y, col, 7);
    txt(label, 1470, y, 34, col);
    mono(alert ? '8 × (1 − p)' : miss + ' × p', 1468, y + 52, 33, c.ink);
  });
  if (b === 2) {
    costs.forEach((m, i) => {
      const p = crossing(m),
        col = i ? c.red : c.blue;
      if ((i === 0 && !cue(2, 'For standard jobs')) || (i === 1 && !cue(2, 'For priority jobs')))
        return;
      v.line(X(p), Y(riskCost(p, m, true)), X(p), 802, col, 3, [8, 7]);
      v.dot(X(p), Y(riskCost(p, m, true)), 14, c.gold);
      mono(
        num(100 * p, 2) + '%',
        X(p) + (i ? -15 : 23),
        Y(riskCost(p, m, true)) + (i ? -47 : 52),
        30,
        col,
        i ? 'right' : 'left',
      );
    });
  }
  if (b === 3) {
    const p = 0.08;
    v.line(X(p), 320, X(p), 802, c.muted, 3, [9, 7]);
    lines.forEach(([, alert, miss, col], i) => {
      const y = Y(riskCost(p, miss, alert));
      v.dot(X(p), y, 13, col);
      mono(
        num(riskCost(p, miss, alert)),
        X(p) + (i === 0 ? -25 : i === 1 ? 30 : -25),
        y + (i === 1 ? 35 : -27),
        32,
        col,
        i === 1 ? 'left' : 'right',
      );
    });
  }
}
function bill(
  v,
  rows,
  { maximum = 1100, start = 388, gap = 166, scale = 850, parts = false } = {},
) {
  const { c, txt, mono, line, rect } = v;
  rows.forEach((r, i) => {
    const y = start + i * gap,
      x = 644;
    txt(r.name, 122, y + 20, 43);
    const items = charges(r);
    let edge = x;
    line(x, y + 57, x + scale, y + 57, c.grid, 2);
    items.forEach((value, j) => {
      const w = (scale * value) / maximum;
      if (w) rect(edge, y, w, 40, [c.blue, c.gold, c.red][j]);
      edge += w;
    });
    mono(sum(items), Math.min(edge + 22, 1715), y + 18, 43);
    if (parts)
      mono(items.filter((_, j) => items[j] || j === 0).join(' + '), x, y + 90, 31, c.muted);
  });
}
const observed = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0];
export const brier = sum(observed.map((y) => (0.2 - y) ** 2)) / observed.length;
export function economics(v) {
  const { b, c, cue, end, txt, mono } = v;
  if (b <= 3) {
    riskLines(v);
    return;
  }
  if (b <= 5) {
    v.heading(
      'April baselines   /   same 140 jobs',
      'How much does the cheapest simple policy cost?',
    );
    const n = b === 4 ? 1 : cue(5, 'The booster has') ? 3 : cue(5, 'Never alerting') ? 2 : 1;
    // All rows share the same cost scale, including the expensive silent policy.
    bill(v, aprBaseline.slice(0, n), { maximum: 6450, scale: 867, parts: true });
    if (n === 1 && cue(4, 'Try alerting')) {
      txt('Alert on everyone', 122, 574, 43);
      mono('82 on time × 8 units', 644, 574, 40, c.blue);
    }
    if (n === 2 && cue(5, 'Never alerting')) {
      txt('Stay quiet', 122, 740, 43);
      mono('25 × 60 + 33 × 150', 644, 740, 38, c.red);
    }
    txt('False alarms', 678, 950, 32, c.blue);
    txt('Standard misses', 958, 950, 32, c.gold);
    txt('Priority misses', 1325, 950, 32, c.red);
    return;
  }
  if (b <= 8) {
    v.heading(
      'Calibration check   /   ten jobs with a score of 0.2',
      b === 8 ? 'Square each probability error' : 'How often did this score group miss?',
    );
    const open = b > 6 || end(6);
    observed.forEach((label, i) => {
      const x = 143 + (i % 5) * 148,
        y = 372 + Math.floor(i / 5) * 150;
      v.rect(x, y, 118, 107, open ? (label ? c.red : c.blue) : c.grid);
      mono(open ? (label ? '1' : '0') : '?', x + 59, y + 52, 43, c.bg, 'center');
    });
    txt(open ? '1 = missed     0 = on time' : 'Outcomes covered', 147, 725, 35, c.muted);
    if (b === 7) {
      const { X, Y } = v.axis(1172, 807, 487, 452, 1, 1, [0, 0.5, 1], [0, 0.5, 1]);
      v.line(X(0), Y(0), X(1), Y(1), c.muted, 3, [9, 8]);
      v.dot(X(0.2), Y(0.3), 16, c.gold);
      mono('(0.2, 0.3)', X(0.2) + 25, Y(0.3) - 45, 32, c.gold);
      txt('Score', 1435, 905, 33, c.muted, 'center');
      txt('Observed miss rate', 1150, 290, 34, c.muted);
    } else if (b === 8) {
      mono('3 × (1 − 0.2)²', 1040, 411, 44, c.red);
      mono('7 × (0 − 0.2)²', 1040, 529, 44, c.blue);
      if (cue(8, 'That measures')) mono('Brier = ' + num(brier), 1040, 716, 55, c.gold);
    } else {
      mono('10 × 0.2', 1050, 437, 58);
      txt('2 expected misses', 1052, 540, 46, c.muted);
      if (open) txt('3 observed misses', 1052, 654, 46, c.red);
    }
    return;
  }
  v.heading('Probability or score?', 'Choose the rule that matches the evidence');
  [
    ['Fit trees', 'January through March'],
    ['Select one cutoff', 'Price actual April errors'],
    ['Evaluate', 'Frozen pair on May'],
  ].forEach(([a, s], i) =>
    v.ticket(113 + i * 592, 445, 526, 182, a, s, [c.blue, c.gold, c.green][i]),
  );
  txt('A fitted calibrator also needs rows held out from tree fitting.', 140, 799, 43, c.muted);
}

const bestStage = STAGE_SERIES.reduce((a, r) => (r.validation < a.validation ? r : a));
export function rounds(v) {
  const { c, b, cue, txt, mono } = v;
  v.heading(
    'Stage search   /   160 fitted trees',
    'Read training and April loss at the same stage',
  );
  const pos =
    b === 1
      ? Math.max(1, Math.round(12 * cue(1, 'This seeded', 2)))
      : b === 2
        ? Math.round(mix(12, 50, cue(2, 'Both losses fall', 2)))
        : Math.round(mix(50, 160, cue(3, 'Training loss continues', 2)));
  const { X, Y } = v.axis(182, 801, 1126, 467, 160, 0.75, [1, 50, 100, 160], [0.25, 0.5, 0.75]);
  txt('Log loss', 161, 280, 32, c.muted);
  txt('Number of trees', 760, 913, 35, c.muted, 'center');
  const point = STAGE_SERIES[pos - 1];
  [
    ['train', c.blue, 'Jan–Mar'],
    ['validation', c.red, 'April'],
  ].forEach(([key, col, label], i) => {
    v.path(
      STAGE_SERIES.slice(0, pos).map((r) => [X(r.round), Y(r[key])]),
      col,
      6,
    );
    v.dot(X(pos), Y(point[key]), 11, col);
    txt(label, 1412, 405 + i * 178, 41, col);
    mono(point[key].toFixed(4), 1412, 474 + i * 178, 49, col);
  });
  if (b === 3 && cue(3, 'We paid')) {
    v.line(X(50), Y(bestStage.validation), X(50), 800, c.gold, 4, [8, 6]);
    v.dot(X(50), Y(bestStage.validation), 14, c.gold);
    txt('Keep 50', X(50) + 20, 746, 37, c.gold);
  }
}
export function selection(v) {
  const { c, b, cue, txt, mono } = v;
  if (b === 3) {
    v.heading('Four-stage replay   /   first minimum', 'Which fitted stage survives a tie?');
    const losses = [0.62, 0.58, 0.59, 0.58],
      step = 435;
    const X = (i) => 227 + i * step,
      Y = (p) => 720 - (p - 0.57) * 4500;
    v.path(
      losses.map((p, i) => [X(i), Y(p)]),
      c.blue,
      6,
    );
    const chosen = cue(3, 'All four were trained');
    losses.forEach((p, i) => {
      const col = chosen && i === losses.indexOf(Math.min(...losses)) ? c.gold : c.blue;
      v.dot(X(i), Y(p), 18, col);
      mono(p, X(i), Y(p) - 57, 49, col, 'center');
      txt('Stage ' + (i + 1), X(i), 797, 37, c.muted, 'center');
    });
    if (chosen) txt('Refit 2 stages', X(1), 895, 40, c.gold, 'center');
    return;
  }
  v.heading(
    'Candidate identity   /   depth 2   /   learning rate 0.05   /   seed 11',
    b <= 2 ? 'Search on the fitting rows, select on April' : 'A cutoff belongs to one fitted model',
  );
  const search = STAGE_SERIES.at(-1),
    first = STAGE_SERIES[0];
  if (b <= 2) {
    v.ticket(138, 368, 602, 170, 'Search · 160 trees', 'Jan–Mar fit', c.blue);
    mono('Train   ' + num(first.train, 3) + ' → ' + num(search.train, 3), 140, 650, 45, c.blue);
    if (b === 2) {
      v.ticket(
        989,
        368,
        716,
        170,
        'Refit · ' + bestStage.round + ' trees',
        'Same Jan–Mar rows',
        c.gold,
      );
      mono('April loss', 991, 628, 39, c.muted);
      mono(
        num(bestStage.validation, 4) + ' at 50    ' + num(search.validation, 4) + ' at 160',
        991,
        708,
        36,
      );
    }
  } else {
    [
      [137, 'Jan–Mar', 'Fit 50 trees'],
      [728, 'April', 'Score this refit'],
      [1320, 'May', 'Keep held out'],
    ].forEach(([x, a, s], i) => v.ticket(x, 393, 490, 166, a, s, [c.blue, c.gold, c.green][i]));
    if (b === 4)
      txt(
        'Built-in early stopping uses a random stratified training slice.',
        140,
        762,
        39,
        c.muted,
      );
    else {
      mono('Jan–Mar + April → a different fitted model', 141, 740, 45, c.red);
      txt('That candidate needs fresh policy-selection rows.', 143, 850, 40, c.ink);
    }
  }
}

export function scoreField(v, { cut, showCount = true }) {
  const { c, txt, mono, line } = v,
    X = (p) => 160 + 1546 * p;
  const counts = new Map();
  [...APRIL_SCORED_ROWS]
    .sort((a, b) => a.score - b.score)
    .forEach((row) => {
      const col = Math.min(79, Math.floor(row.score * 80)),
        level = counts.get(col) || 0;
      counts.set(col, level + 1);
      v.dot(
        X(row.score),
        714 - level * 29,
        11,
        row.score < cut ? c.grid : row.label ? c.red : c.blue,
      );
    });
  line(X(0), 742, X(1), 742, c.muted, 3);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) mono(p, X(p), 793, 30, c.muted, 'center');
  line(X(cut), 343, X(cut), 737, c.gold, 5);
  txt('Cutoff', X(cut) + 19, 328, 36, c.gold);
  txt('On time', 1344, 276, 33, c.blue);
  txt('Missed', 1560, 276, 33, c.red);
  if (showCount) {
    const r = evaluateAprilThreshold(cut);
    mono(
      r.tp + ' caught     ' + r.fp + ' false alerts     cost ' + r.cost,
      960,
      920,
      43,
      c.ink,
      'center',
    );
  }
}
const toyScores = [0.2, 0.6, 0.6, 0.9],
  toyY = [0, 1, 0, 1];
export function toyBill(cut) {
  const alerts = toyScores.map((p) => p >= cut);
  const fp = alerts.filter((yes, i) => yes && !toyY[i]).length;
  const fn = alerts.filter((yes, i) => !yes && toyY[i]).length;
  return { alerts: alerts.filter(Boolean).length, fp, fn, cost: 4 * fp + 10 * fn };
}
export function threshold(v) {
  const { c, b, cue, txt, mono } = v;
  if (b === 1) {
    v.heading('Four validation scores   /   inclusive gate', 'Equal scores travel together');
    const cut = cue(1, 'The least costly gate')
      ? 0.6
      : cue(1, 'Above point nine')
        ? 1
        : cue(1, 'At point nine')
          ? 0.9
          : cue(1, 'Both tied jobs')
            ? 0.6
            : 0.2;
    const X = (p) => 164 + p * 1540;
    v.line(X(0), 677, X(1), 677, c.muted, 3);
    toyScores.forEach((p, i) => {
      const active = p >= cut,
        x = X(p),
        y = i === 2 ? 452 : 585;
      v.ticket(
        x - 132,
        y - 48,
        264,
        97,
        'Score ' + p,
        toyY[i] ? 'missed' : 'on time',
        active ? c.blue : c.muted,
      );
    });
    v.line(X(cut), 693, X(cut), 794, c.gold, 6);
    mono('≥ ' + cut, X(cut), 853, 43, c.gold, 'center');
    const r = toyBill(cut);
    txt(r.alerts + (r.alerts === 1 ? ' alert' : ' alerts'), 149, 337, 43, c.gold);
    if (cue(1, 'Start at point two'))
      mono(
        r.fp + ' × 4 false-alarm units  +  ' + r.fn + ' × 10 miss units  =  ' + r.cost,
        960,
        943,
        37,
        c.ink,
        'center',
      );
    return;
  }
  v.heading(
    'All 140 April scores',
    b === 2 ? 'Find the least costly alert set' : 'Open the gate to everyone',
  );
  let cut = stored;
  if (b === 2 && !cue(2, 'At the least costly boundary')) {
    const scan = cue(2, 'Try every distinct score', 4.8);
    cut = APRIL_BOUNDARIES[Math.floor(scan * (APRIL_BOUNDARIES.length - 1))];
  }
  if (b === 3 && cue(3, 'We add eleven')) cut = 0;
  scoreField(v, { cut });
}
function tiedReplay(v, copy, outcomes = true, showCost = true) {
  const { c, txt, mono, line } = v,
    r = copy ? rounded : selectedApril;
  const x = 1170,
    X = 1500;
  txt('Four priority jobs', 147, 297, 40);
  mono(copy ? 'score ≥ ' + printed : 'score ≥ ' + stored, 1004, 300, 37, c.gold);
  const active = copy ? X : x;
  line(active, 360, active, 770, c.gold, 5);
  boundaryRows.forEach((j, i) => {
    const y = 421 + i * 99;
    mono('Job ' + j.id, 145, y, 38);
    txt(
      outcomes ? (j.label ? 'Missed' : 'On time') : 'Outcome covered',
      440,
      y,
      35,
      outcomes && j.label ? c.red : c.muted,
    );
    line(920, y, 1612, y, c.grid, 2);
    v.dot(x, y, 14, j.score >= r.threshold ? c.blue : c.muted);
    txt(
      j.score >= r.threshold ? 'Alert' : 'Quiet',
      1699,
      y,
      34,
      j.score >= r.threshold ? c.blue : c.muted,
      'center',
    );
  });
  mono('Stored score   ' + stored, 138, 831, 36, c.ink);
  if (showCost)
    mono(
      r.fp +
        ' false alarms  +  ' +
        r.priorityMisses +
        (r.priorityMisses === 1 ? ' priority miss' : ' priority misses') +
        '     cost ' +
        r.cost,
      139,
      936,
      40,
      c.gold,
    );
}
export function workload(v, r, showCost) {
  const { c, txt, mono } = v;
  const total = r.tp + r.fp + r.tn + r.fn;
  v.grid(
    total,
    20,
    144,
    386,
    48,
    55,
    (i) => (i < r.tp ? c.red : i < r.tp + r.fp ? c.blue : c.grid),
    34,
  );
  const list = [
    [r.tp, 'misses caught', c.red],
    [r.fp, 'false alerts', c.blue],
    [r.tn, 'on time, quiet', c.muted],
  ];
  list.forEach(([n, name, col], i) => {
    mono(n, 1290, 427 + i * 136, 66, col, 'right');
    txt(name, 1337, 427 + i * 136, 39, col);
  });
  mono(r.tp + r.fp + ' alerts / ' + total + ' jobs', 148, 875, 48);
  if (showCost) mono('Cost ' + r.cost, 1280, 878, 49, c.gold);
}
export function boundary(v) {
  const { c, b, cue, txt, mono } = v;
  if (b === 1) {
    v.heading('April policy search', 'Test every distinct score and both endpoints');
    const cut = cue(1, 'above one') ? 1 + Number.EPSILON : 0;
    scoreField(v, { cut });
    if (cut > 1) txt('next float above 1', 1698, 408, 33, c.gold, 'right');
    return;
  }
  if (b <= 5) {
    v.heading(
      'April   /   enlarged cutoff interval',
      b === 3 ? 'Would the rounded cutoff save money?' : 'Keep the four tied scores fixed',
    );
    const copied = b === 5 && cue(5, 'All four tied') && !cue(5, 'Restore the stored');
    tiedReplay(v, copied, !!cue(2, 'Three finished'), b >= 4);
    if (b === 3 || b === 4) mono('Report   ' + printed, 1010, 831, 36, c.gold);
    return;
  }
  if (b === 6) {
    v.heading('April   /   actual cost', 'A coarse search starts past the cheaper boundary');
    const vals = [
      ['Stored cutoff', selectedApril.cost],
      ['Always alert', allAlertApril.cost],
      ['Grid starts at 0.15', coarse.cost],
    ];
    vals.forEach(([name, n], i) => {
      const y = 424 + i * 170;
      txt(name, 128, y, 44);
      v.rect(737, y - 22, n * 0.67, 44, i === 2 ? c.red : c.blue);
      mono(n, 757 + n * 0.67, y, 43);
    });
    return;
  }
  v.heading(
    'Frozen pair   /   50 trees on May',
    b === 9
      ? 'Higher per-job risk can yield fewer observed misses'
      : 'How many jobs still enter the queue?',
  );
  if (b === 9) {
    mono('logit → logit + 0.18', 140, 362, 60, c.blue);
    [MONTHS[1], MONTHS[2]].forEach((m, i) => {
      const x = 157 + i * 923;
      txt(m.name, x, 497, 44);
      v.grid(m.rows, 20, x, 570, 33, 34, (j) => (j < m.misses ? c.red : c.grid), 25);
      mono(m.misses + ' / ' + m.rows + ' missed', x, 874, 39);
    });
    return;
  }
  workload(v, MAY_EVIDENCE[0], true);
  if (b === 8)
    mono(
      'Always alert  680      Heartbeat  1044      Savings vs. always alert  96',
      143,
      965,
      32,
      c.gold,
    );
}

function missedDeadlineCosts(v) {
  const { c, cue, txt, mono, rect, line } = v;
  const [booster, , heartbeat] = MAY_EVIDENCE;
  const x = 708;
  const pixelsPerUnit = 1.44;
  txt('Heartbeat rule', 150, 312, 56);
  txt('Cost units', x, 312, 42, c.muted);
  const misses = [
    ['standard', heartbeat.fnStandard, COSTS.standardMiss, c.gold],
    ['priority', heartbeat.fnPriority, COSTS.priorityMiss, c.red],
  ];
  misses.forEach(([label, count, price, color], row) => {
    const y = 430 + row * 140;
    const width = price * pixelsPerUnit;
    txt(count + ' ' + label + ' misses', 150, y, 48);
    for (let i = 0; i < count; i++) {
      const left = x + i * width;
      rect(left, y - 37, width, 74, color);
      if (i) line(left, y - 37, left, y + 37, c.bg, 4);
      mono(price, left + width / 2, y, 41, c.bg, 'center');
    }
  });
  const priorityCost = heartbeat.fnPriority * COSTS.priorityMiss;
  const edge = x + priorityCost * pixelsPerUnit;
  if (cue(2, 'Those four alone')) mono(priorityCost, edge + 23, 570, 56, c.red);
  const comparison = cue(2, "That's already", 0.45);
  if (comparison > 0) {
    txt('Booster', 150, 715, 56);
    txt('Entire bill', 150, 818, 48);
    line(edge, 614, edge, 857, c.muted, 3, [10, 8]);
    rect(x, 781, booster.cost * pixelsPerUnit * comparison, 74, c.blue);
    if (cue(2, 'and eighty-four')) mono(booster.cost, edge + 23, 818, 56, c.blue);
  }
}

export function holdout(v) {
  const { c, b, cue, txt, mono } = v;
  v.heading('May evaluation   /   frozen trees and policy', 'Price the jobs each rule gets wrong');
  if (b === 1 || (b === 2 && !cue(2, 'The heartbeat rule'))) {
    [
      ['Booster', MAY_EVIDENCE[0]],
      ['Heartbeat', MAY_EVIDENCE[2]],
    ].forEach(([name, r], i) => {
      const x = 163 + i * 934;
      txt(name, x, 371, 49);
      v.grid(140, 20, x, 463, 32, 40, (j) => (j < r.tp + r.fp ? c.blue : c.grid), 24);
      mono(r.tp + r.fp + ' alerts', x, 826, 58, c.blue);
      if (cue(2, 'Missed deadlines')) txt(r.fn + ' late jobs unflagged', x, 897, 45);
      else if (cue(1, 'Which mistakes'))
        txt(r.tp + ' of ' + (r.tp + r.fn) + ' late jobs caught', x, 897, 45);
    });
    return;
  }
  if (b === 2 && !cue(2, 'Every unit')) {
    missedDeadlineCosts(v);
    return;
  }
  bill(
    v,
    [
      { name: 'Booster', ...MAY_EVIDENCE[0] },
      { name: 'Always alert', ...MAY_EVIDENCE[1] },
      { name: 'Heartbeat', ...MAY_EVIDENCE[2] },
    ],
    { parts: true },
  );
  if (b === 2) txt('False alarm', 160, 940, 31, c.blue);
  if (b === 2) {
    txt('Standard miss', 580, 940, 31, c.gold);
    txt('Priority miss', 1060, 940, 31, c.red);
  } else
    mono(
      'May AUC ' +
        MAY_POLICY.auc +
        '     •     ' +
        (MAY_EVIDENCE[0].tp + MAY_EVIDENCE[0].fp) +
        ' alerts at the chosen cutoff',
      140,
      944,
      37,
      c.blue,
    );
}
const floors = [0.9, 0.85];
export function sliceRows(stress) {
  return [MAY_POLICY.priority, MAY_POLICY.largeModel].map((s, i) =>
    sliceResult(s.positives, stress ? [26, 20][i] : s.caught, floors[i], 10),
  );
}
function sliceMeter(v, r, i) {
  const { c, txt, mono } = v,
    x = 713,
    y = 415 + i * 244,
    w = 818;
  txt(i ? 'Large input' : 'Priority', 130, y + 4, 48);
  for (let j = 0; j < r.positives; j++) {
    const cell = w / r.positives;
    v.rect(x + j * cell, y - 14, cell - 4, 48, j < r.caught ? c.blue : c.grid);
  }
  const min = x + w * floors[i];
  v.line(min, y - 44, min, y + 61, c.gold, 4);
  mono(num(floors[i] * 100) + '% minimum', min, y + 90, 29, c.gold, 'right');
  mono(r.caught + ' / ' + r.positives, 130, y + 78, 38, c.muted);
  mono(num(r.recall, 3), 1580, y + 7, 43, r.passed ? c.green : c.red);
}
export function support(v) {
  const { b, c, txt, mono } = v;
  v.heading(
    'Required May slices',
    b === 3 ? 'What travels with this candidate?' : 'Count the actual positives in each slice',
  );
  if (b <= 2) {
    sliceRows(false).forEach((r, i) => sliceMeter(v, r, i));
    if (b === 2) txt('Each slice needs at least 10 actual misses.', 139, 911, 40, c.ink);
    return;
  }
  [
    ['Feature contract', 'Units, arrival times, missing values'],
    ['Frozen pair', '50 trees + stored cutoff'],
    ['Evidence', 'Split IDs, costs and slice counts'],
  ].forEach(([a, s], i) =>
    v.ticket(125 + i * 584, 409, 528, 191, a, s, [c.blue, c.gold, c.green][i]),
  );
  txt('Capacity, rollback and full-request latency still need operational evidence.', 135, 808, 38);
}
export function sliceStress(v) {
  const { c, b, cue, txt, mono } = v;
  const stress = cue(3, 'Priority now catches') && !cue(5, 'reproduces the original');
  v.heading(
    'Slice gates   /   same fitted trees',
    b === 2
      ? 'Priority needs 10 positives and 90% recall'
      : 'Replay the cutoff against the same positives',
  );
  if (b === 2) {
    [
      [0, 0],
      [9, 9],
      [10, 9],
    ].forEach(([n, k], i) => {
      const x = 140 + 586 * i,
        r = sliceResult(n, k, 0.9);
      txt(n + ' positives', x, 382, 40);
      for (let j = 0; j < 10; j++)
        v.dot(
          x + 19 + (j % 5) * 63,
          515 + Math.floor(j / 5) * 76,
          20,
          j < k ? c.blue : c.grid,
          j >= n,
        );
      mono(r.recall === null ? 'Undefined' : num(r.recall) + ' recall', x, 733, 40);
      txt(r.passed ? 'Pass' : 'Fails support', x, 829, 40, r.passed ? c.green : c.red);
    });
    return;
  }
  sliceRows(stress).forEach((r, i) => sliceMeter(v, r, i));
  mono('Cutoff   ' + (stress ? '0.50' : stored), 140, 914, 40, c.gold);
}
