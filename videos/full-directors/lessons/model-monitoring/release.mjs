import assert from 'node:assert/strict';
import { delayedErrorCostLimit } from '../../../films/model-monitoring/fixtures.mjs';
import { simulateRelease } from '../../../films/model-monitoring/model.mjs';
import { releaseWindow } from '../../../films/model-monitoring/release-cost.mjs';
import { delayedWindow, fastMetrics, meters } from './rollout.mjs';
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
  stamp,
  pct,
} from './instruments.mjs';

const exactLimitWindow = releaseWindow(600, 600, 10, 1);
const practiceReference = releaseWindow(800, 800, 8, 2);

function costEvidence(s) {
  if (s.at(5, 'Return to the five hundred'))
    return {
      window: delayedWindow,
      showAlerts: s.at(5, 'Ten false alerts'),
      showMisses: s.at(5, 'Two unflagged misses'),
      showRaw: s.at(5, 'END'),
      showRate: s.at(5, 'END'),
      showReceipt: s.at(6, 'proposes rollback', { captionStart: false }),
    };
  return {
    window: exactLimitWindow,
    showAlerts: s.at(4, 'Ten false alerts'),
    showMisses: s.at(4, 'One unflagged miss'),
    showRaw: s.at(5, 'Across six hundred'),
    showRate: s.at(5, 'Keep version four'),
    showReceipt: s.at(5, 'Only a cost above'),
  };
}
function receiptLabel(action) {
  return (
    {
      'not promoted': 'KEEP v3 ACTIVE',
      'insufficient evidence': 'INSUFFICIENT EVIDENCE',
      'invalid metric': 'INVALID METRIC',
      'keep candidate': 'KEEP v4',
      'propose rollback': 'PROPOSE v3',
    }[action] ?? action
  );
}
export function policy(c, s) {
  surface(c);
  if (s.beat === 1) {
    heading(c, 'BEFORE PROMOTION    /    v3 ACTIVE', 'Which gate stops promotion?');
    const fast = fastMetrics(true);
    const decided = s.at(1, 'An offline failure');
    const shown = s.at(1, 'Its budget is eighty')
      ? 4
      : s.at(1, 'The review queue used')
        ? 3
        : s.at(1, 'The ninety-fifth')
          ? 2
          : 1;
    meters(c, fast, shown, s.at(1, 'That is half a percent'), !decided);
    if (decided)
      stamp(
        c,
        receiptLabel(simulateRelease({ healthy: fast.every((m) => m.pass) }).action),
        119,
        944,
        C.red,
        40,
      );
    return;
  }
  if (!s.at(4, 'Now take a separate window')) {
    heading(c, 'AFTER PROMOTION    /    v4 ACTIVE', 'Can the delayed rule use this window?');
    const complete = s.at(4, 'If the cost');
    const n = 500,
      joined = complete ? n : n - 1;
    const action = simulateRelease({ mature: n, joined, cost: null }).action;
    [
      ['Mature jobs', n],
      ['Labels joined', joined],
      ['Cost per 1,000', complete ? 'missing' : 'pending'],
    ].forEach(([l, v], i) => {
      const x = 123 + i * 597;
      txt(c, l, x, 383, 42, C.muted);
      mono(c, v, x, 520, 72, C.ink);
      line(
        c,
        [
          [x, 613],
          [x + 478, 613],
        ],
        C.rule,
        4,
      );
    });
    txt(
      c,
      'At least 500 mature jobs     ·     all labels     ·     rollback only above 50',
      124,
      713,
      43,
    );
    if ((!complete && s.at(3, 'Version four stays')) || (complete && s.at(4, 'Check how the cost')))
      stamp(c, receiptLabel(action), 126, 893, C.red, 45);
    return;
  }
  if (s.beat >= 7) {
    heading(
      c,
      'ROLLBACK PROPOSAL    /    ROUTING AND RECOVERY',
      'Which version serves the next request?',
    );
    const labels = [
      ['1', 'Resolve v3', 'Weights, features and schema'],
      ['2', 'Switch if v4 is active', 'Record which version serves'],
      ['3', 'Join fresh outcomes', 'Measure the restored cost'],
    ];
    labels.forEach(([n, l, sub], i) => {
      const y = 346 + i * 166;
      circle(c, 167, y, 38, i === 2 && s.beat === 8 ? C.sea : C.ink);
      mono(c, n, 167, y, 39, C.cream, 'center');
      txt(c, l, 244, y, 52);
      txt(c, sub, 1080, y, 36, C.muted);
    });
    line(
      c,
      [
        [123, 797],
        [1796, 797],
      ],
      C.rule,
      3,
    );
    mono(c, 'v3 offline   60 / 1k', 132, 886, 42, C.muted);
    mono(c, 'v3 current   ?', 1080, 886, 42, C.sea);
    return;
  }
  const evidence = costEvidence(s);
  const w = evidence.window;
  heading(
    c,
    'MATURE COST    /    ' + w.joined + ' OF ' + w.mature + ' JOINED',
    w === exactLimitWindow
      ? 'Will the rule propose rollback?'
      : 'Two kinds of error add the same cost',
  );
  txt(c, 'Propose rollback above 50 cost units per 1,000 mature jobs.', 129, 250, 37, C.muted);
  const operands = [
    [w.fp, 2, 'False alerts', C.brass, evidence.showAlerts],
    [w.fn, 10, 'Unflagged misses', C.red, evidence.showMisses],
  ];
  operands.forEach(([n, weight, label, col, shown], i) => {
    if (!shown) return;
    const y = 380 + i * 184;
    txt(c, label, 130, y, 42);
    for (let j = 0; j < n; j++) box(c, 650 + j * weight * 35, y - 28, weight * 35 - 4, 64, col, 4);
    mono(c, n + ' × ' + weight, 1441, y, 43, col);
  });
  const color = w.perThousand > 50 ? C.red : C.sea;
  if (evidence.showRaw)
    mono(
      c,
      w.raw + ' × 1,000 / ' + w.mature + ' = ' + (evidence.showRate ? w.perThousand : '?'),
      130,
      752,
      65,
      evidence.showRate ? color : C.ink,
    );
  if (evidence.showReceipt) stamp(c, receiptLabel(w.receipt.action), 131, 921, color, 46);
}
function practiceState(s) {
  const first = { mature: 400, joined: 380 };
  if (s.beat <= 3)
    return {
      ...first,
      coverage: first.joined / first.mature,
      receipt: simulateRelease(first),
      showCoverage: s.at(3, 'Twenty mature'),
      verdict: s.at(3, 'Check the ingestion'),
    };
  const small = s.at(6, 'This one has six hundred');
  const window = small
    ? releaseWindow(600, 600, practiceReference.fp, practiceReference.fn)
    : practiceReference;
  const raw = s.at(5, 'To put this cost');
  const crossed = s.at(7, 'The mark crosses');
  const rate = small
    ? s.at(7, 'The same thirty-six units', { captionStart: false })
    : s.at(5, 'It falls below');
  let progress = Number(!small || s.beat > 7);
  if (small && rate && s.beat === 7) {
    const start = s.clock.wordCue('The same thirty-six units').start;
    const finish = s.clock.wordCue('That gives sixty units per thousand').end;
    progress = Math.max(0, Math.min(1, (s.clock.elapsed - start) / (finish - start)));
  }
  const maySwitch = s.at(7, 'Before switching');
  const verdict = small ? progress === 1 && crossed && maySwitch : s.at(5, 'END');
  return { ...window, small, rawKnown: raw, rateKnown: rate, progress, verdict };
}
function costDimensions(window, progress) {
  const startJobs = practiceReference.mature;
  const jobs = startJobs + (window.mature - startJobs) * progress;
  return { jobs, rate: (1000 * window.raw) / jobs };
}
function costShape(c, a) {
  const x = 282,
    base = 785,
    dx = 1.18,
    dy = 5.5;
  const y = (v) => base - v * dy,
    limit = delayedErrorCostLimit;
  const old = practiceReference;
  [0, 25, 50, 75].forEach((v) => {
    line(
      c,
      [
        [x, y(v)],
        [x + 1040, y(v)],
      ],
      v === limit ? C.brass : '#afbaa6',
      v === limit ? 5 : 2,
      v === limit ? [12, 7] : [],
    );
    mono(c, v, x - 28, y(v), 32, v === limit ? C.brass : C.muted, 'right');
  });
  txt(c, 'Cost per 1,000 jobs', 104, 327, 37);
  // Width is the evaluated job count. Height is cost per thousand, so fixed raw cost preserves area.
  if (a.rateKnown) {
    const { jobs, rate } = costDimensions(a, a.progress);
    box(c, x, y(rate), dx * jobs, dy * rate, '#478f7d');
    // Re-draw the policy line above the measured area.
    line(
      c,
      [
        [x, y(limit)],
        [x + 1040, y(limit)],
      ],
      C.brass,
      5,
      [12, 7],
    );
  }
  if (a.small) {
    c.strokeStyle = C.muted;
    c.lineWidth = 4;
    c.setLineDash([11, 8]);
    c.strokeRect(x, y(old.perThousand), dx * old.mature, dy * old.perThousand);
    c.setLineDash([]);
    txt(
      c,
      old.mature + ' jobs · ' + old.perThousand,
      x + dx * old.mature + 18,
      y(old.perThousand) + 68,
      32,
      C.muted,
    );
  }
  txt(c, 'Limit ' + limit, x + 1033, y(limit) - 33, 30, C.brass, { align: 'right' });
  const w = dx * a.mature;
  line(
    c,
    [
      [x, base + 12],
      [x, base + 32],
      [x + w, base + 32],
      [x + w, base + 12],
    ],
    C.ink,
    4,
  );
  mono(c, a.mature + ' evaluated jobs', x + w / 2, base + 76, 40, C.ink, 'center');
}
export function practice(c, s) {
  const a = practiceState(s);
  if (s.beat <= 3) {
    surface(c, true);
    heading(c, 'ON CALL    /    v4 ACTIVE', 'Is this window ready?', true);
    const x = 166,
      y = 321,
      cols = 10;
    for (let i = 0; i < a.mature / 20; i++) {
      const xx = x + (i % cols) * 95,
        yy = y + Math.floor(i / cols) * 126;
      c.lineWidth = 4;
      c.strokeStyle = C.gold;
      c.strokeRect(xx, yy, 72, 91);
      if (i < a.joined / 20) {
        box(c, xx + 7, yy + 7, 58, 77, C.mint);
        line(
          c,
          [
            [xx + 21, yy + 48],
            [xx + 32, yy + 61],
            [xx + 54, yy + 28],
          ],
          C.sea,
          5,
        );
      }
    }
    txt(c, '20 jobs per mark', 156, 635, 39, C.mint);
    mono(c, a.mature + ' closed', 1199, 353, 50, C.cream);
    mono(c, a.joined + ' joined', 1199, 458, 50, C.cream);
    if (a.showCoverage) mono(c, pct(a.coverage) + ' coverage', 1199, 566, 48, C.gold);
    txt(c, 'Rule    500 or more mature jobs, all labels joined', 156, 766, 46, C.cream);
    if (a.verdict) stamp(c, receiptLabel(a.receipt.action), 156, 930, C.gold, 43);
    return;
  }
  surface(c);
  heading(c, 'ON CALL    /    TWO COMPLETE COHORTS', 'Spread one error bill across the jobs');
  const strip = (x, n, w, col) => {
    for (let i = 0; i < n; i++) box(c, x + i * w, 239, w - 3, 32, col, 3);
  };
  txt(c, '8 false alerts × 2', 116, 255, 33);
  strip(417, a.fp, 25, C.brass);
  txt(c, '2 misses × 10', 713, 255, 33);
  strip(953, a.fn, 125, C.red);
  if (a.rawKnown) mono(c, '=  ' + a.raw + ' units', 1386, 255, 43, C.ink);
  costShape(c, a);
  const side = 1500;
  txt(c, 'Labels joined', side, 383, 31, C.muted);
  mono(c, a.joined + '/' + a.mature, side, 444, 43);
  if (a.rateKnown && a.progress === 1) {
    txt(c, 'Units per 1,000', side, 555, 30, C.muted);
    mono(c, a.perThousand, side, 638, 82, a.small ? C.red : C.sea);
    if (a.verdict) stamp(c, receiptLabel(a.receipt.action), side, 763, a.small ? C.red : C.sea, 31);
  } else if (a.rateKnown) {
    txt(c, 'Same area', side, 625, 40, C.sea);
  } else txt(c, 'Cost per 1,000?', side, 625, 38, C.ink);
  if (s.beat === 8) {
    txt(c, 'Verify the served version,', 1264, 64, 39);
    txt(c, 'then measure cost', 1264, 118, 39);
    txt(c, 'on its next mature cohort.', 1264, 172, 39);
  }
}
export function checkRelease() {
  const at = (beat, ...phrases) => ({
    beat,
    at: (n, p) => beat > n || (beat === n && phrases.includes(p)),
  });
  const question = costEvidence(at(4, 'Ten false alerts', 'One unflagged miss'));
  assert.deepEqual(
    [
      question.showAlerts,
      question.showMisses,
      question.showRaw,
      question.showRate,
      question.showReceipt,
    ],
    [true, true, false, false, false],
  );
  const raw = costEvidence(at(5, 'Across six hundred'));
  assert.deepEqual([raw.showRaw, raw.showRate, raw.showReceipt], [true, false, false]);
  const rate = costEvidence(at(5, 'Across six hundred', 'Keep version four'));
  assert.deepEqual([rate.showRaw, rate.showRate, rate.showReceipt], [true, true, false]);
  const exact = costEvidence(at(5, 'Across six hundred', 'Keep version four', 'Only a cost above'));
  const reset = costEvidence(at(5, 'Return to the five hundred'));
  assert.deepEqual(
    [reset.window, reset.showMisses, reset.showRaw, reset.showReceipt],
    [delayedWindow, false, false, false],
  );
  const pending = costEvidence(at(6));
  assert.deepEqual([pending.showRate, pending.showReceipt], [true, false]);
  const breach = costEvidence(at(6, 'proposes rollback'));
  for (const [state, result] of [
    [exact, [600, 600, 10, 1, 30, 50, 'keep candidate']],
    [breach, [500, 500, 10, 2, 40, 80, 'propose rollback']],
  ]) {
    const w = state.window;
    assert.deepEqual(
      [w.mature, w.joined, w.fp, w.fn, w.raw, w.perThousand, w.receipt.action],
      result,
    );
    assert.ok(state.showRate && state.showReceipt);
  }
  for (const [args, action] of [
    [{ healthy: false }, 'not promoted'],
    [{ mature: 500, joined: 499 }, 'insufficient evidence'],
    [{ mature: 0, joined: 0 }, 'insufficient evidence'],
    [{ mature: 500, joined: 501 }, 'invalid counts'],
    [{ mature: 500, joined: 500, cost: null }, 'invalid metric'],
  ])
    assert.equal(simulateRelease(args).action, action);
  const state = (beat, phrases = [], progress = 1) =>
    practiceState({
      ...at(beat, ...phrases),
      clock: {
        elapsed: progress,
        wordCue: () => ({ start: 0, end: 1 }),
      },
    });
  const first = state(2);
  assert.deepEqual(
    [first.mature, first.joined, first.coverage, first.verdict],
    [400, 380, 0.95, false],
  );
  const old = state(5, ['To put this cost', 'It falls below', 'END']),
    open = state(6, ['This one has six hundred']),
    end = state(7, ['The same thirty-six units', 'The mark crosses', 'Before switching']);
  assert.deepEqual(
    [
      old.mature,
      old.joined,
      old.fp,
      old.fn,
      old.raw,
      old.perThousand,
      old.verdict,
      old.receipt.action,
    ],
    [800, 800, 8, 2, 36, 45, true, 'keep candidate'],
  );
  assert.deepEqual(
    [open.mature, open.joined, open.rawKnown, open.rateKnown, open.verdict],
    [600, 600, true, false, false],
  );
  const beforeRate = state(7);
  assert.equal(beforeRate.rateKnown, false);
  const inFlight = state(7, ['The same thirty-six units', 'The mark crosses', 'Before switching'], 0.5);
  assert.equal(inFlight.verdict, false);
  assert.deepEqual(
    [0, 0.5, 1].map((progress) => costDimensions(end, progress).jobs),
    [800, 700, 600],
  );
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const { jobs, rate } = costDimensions(end, progress);
    assert.ok(Math.abs((jobs * rate) / 1000 - old.raw) < 1e-9);
  }
  assert.deepEqual(
    [
      end.mature,
      end.joined,
      end.fp,
      end.fn,
      end.raw,
      end.perThousand,
      end.rateKnown,
      end.verdict,
      end.receipt.action,
    ],
    [600, 600, 8, 2, 36, 60, true, true, 'propose rollback'],
  );
  assert.equal(old.mature * old.perThousand, end.mature * end.perThousand);
}
