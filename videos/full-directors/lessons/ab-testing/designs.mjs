import { P, beat, cue, scale, integer, pct, signed } from './workshop.mjs';
import {
  sim,
  cupedVariance,
  pairedContrastVariance,
  locked,
  receiptMismatches,
} from './evidence.mjs';

export function adjustment(s, k) {
  const b = beat(k),
    m = sim.cuped;
  if (b <= 3) {
    s.page('PRE-EXPERIMENT ADJUSTMENT', 'What was already predictable?');
    s.small('FIRST INCIDENT', 165, 304);
    const data = [
      ['Frozen service flag', 'X = 1'],
      ['Resolved', 'Y = 1'],
    ];
    data.forEach(([name, v], i) => {
      const x = 167 + i * 815;
      s.txt(name, x, 399, 46);
      s.txt(v, x, 511, 82, i ? P.rewrite : P.control, { face: 'Serif' });
    });
    s.line([
      [166, 595],
      [1715, 595],
    ]);
    const on = cue(k, 2, 'end'),
      r = m.sampleRows[0];
    s.txt('Y − θ(X − mean X)', 165, 710, 58);
    if (on) s.txt(r.adjusted.toFixed(3), 1114, 707, 82, P.control, { face: 'Mono' });
    s.small(
      b === 3
        ? 'Freeze the service flag before randomization. Rewrite latency comes later.'
        : 'θ = ' + m.theta.toFixed(3) + '     mean X = ' + m.center.toFixed(3),
      166,
      835,
    );
  } else if (b <= 5) {
    s.page('VARIANCE WORKSHEET', 'Choose the coefficient');
    s.txt('Var(Y) = 9', 164, 355, 47);
    s.txt('Var(X) = 4', 739, 355, 47);
    s.txt('Cov(X,Y) = 3', 1232, 355, 47);
    s.line([
      [164, 445],
      [1730, 445],
    ]);
    s.txt('Var(Yadj) = 9 + 4θ² − 6θ', 165, 554, 62);
    if (cue(k, 5, 'Residual variance')) s.txt('θ = 3 / 4', 166, 702, 59, P.rewrite);
    if (cue(k, 5, 'The fraction'))
      s.txt(
        'Variance left   ' + cupedVariance(9, 4, 3).toFixed(2) + ' / 9',
        836,
        703,
        55,
        P.control,
      );
    s.small('Freeze one common center and coefficient for both arms.', 164, 840);
  } else {
    s.page('20,000 SIMULATED INCIDENTS', 'Precision after adjustment');
    const X = scale(2.5, 6.5, 642, 1690);
    for (const [i, [name, delta, se]] of [
      ['Raw', m.rawLift, m.rawSe],
      ['Adjusted', m.adjustedLift, m.adjustedSe],
    ].entries()) {
      if (i && !cue(k, 7, 'Look at the interval')) continue;
      const y = 380 + i * 222,
        lo = 100 * (delta - 1.96 * se),
        hi = 100 * (delta + 1.96 * se);
      s.txt(name, 166, y, 51);
      s.small(signed(100 * delta) + ' pp', 167, y + 62);
      s.span(X, lo, hi, y, i ? P.rewrite : P.control);
      s.dot(X(100 * delta), y, 15, P.ink);
      s.center('±' + (196 * se).toFixed(2) + ' pp', X(100 * delta), y - 52, 33);
    }
    s.axis(X, [2.5, 3.5, 4.5, 5.5, 6.5], 720);
    s.small(
      'Resolution lift in percentage points    /    outcome variance down ' +
        pct(m.varianceReduction, 1),
      164,
      840,
    );
  }
}

export function bandit(s, k) {
  const b = beat(k),
    a = sim.bandit,
    pull = a.pullTrace[0];
  if (b === 4) {
    s.page('IMMEDIATE-FEEDBACK SIMULATION', 'Where the first 2,000 choices went');
    const share = a.controlPulls / 2000;
    s.box(165, 418, 1580 * share, 130, P.control);
    s.box(165 + 1580 * share, 418, 1580 * (1 - share), 130, P.rewrite);
    s.txt('Control', 166, 332, 48, P.control);
    s.txt('Rewrite', 852, 332, 48, P.rewrite);
    s.txt(integer(a.controlPulls), 166, 636, 80);
    s.txt(integer(a.treatmentPulls), 852, 636, 80);
    s.small(
      pct(a.treatmentPulls / 2000, 1) + ' of simulated choices went to the rewrite.',
      166,
      825,
    );
    return;
  }
  s.page(
    'THOMPSON SAMPLING',
    b <= 3 ? 'Draw a possible rate for each arm' : 'Update once the outcome matures',
  );
  const drawn = !!cue(k, 3, 'Choose the largest'),
    selected = !!cue(k, 3, 'Thompson sampling');
  const updated = !!cue(k, 6, 'Its curve shifts');
  for (const [i, sample] of [pull.sampleControl, pull.sampleTreatment].entries()) {
    const x = 171 + 830 * i,
      X = scale(0, 1, x, x + 670),
      y = 614;
    const beta = i || !updated ? 1 : pull.betaC,
      col = i ? P.rewrite : P.control;
    s.txt(i ? 'Rewrite' : 'Control', x, 319, 50, col);
    s.small('Beta(1, ' + beta + ')', x, 397);
    const pts = Array.from({ length: 61 }, (_, j) => [
      X(j / 60),
      y - 80 * (beta === 1 ? 1 : 2 * (1 - j / 60)),
    ]);
    s.poly([[X(0), y], ...pts, [X(1), y]], i ? '#dcd3df' : '#c2d8ce');
    s.line(pts, col, 5);
    s.axis(X, [0, 0.5, 1], y);
    if (drawn && b <= 3) {
      s.line(
        [
          [X(sample), y - 74],
          [X(sample), y],
        ],
        col,
        5,
      );
      s.center(sample.toFixed(2), X(sample), y - 118, 36, col);
    }
  }
  const state = updated
    ? 'Control failure recorded. Follow-ups keep their stored arm.'
    : b >= 5
      ? 'Control assigned   ·   window open   ·   update pending'
      : selected
        ? 'Incident 1 assigned to control'
        : b === 3
          ? 'Two draws from the same prior'
          : 'New incidents can receive new draws.';
  s.txt(state, 166, 812, 47, P.ink, { max: 1600 });
}
export function pairing(s, k) {
  const b = beat(k),
    a = sim.paired;
  if (b <= 3) {
    s.page('OFFLINE EVALUATION', 'Subtract scores on the same prompt');
    if (b === 1) {
      s.small('ONE SHARED PROMPT', 165, 295);
      const r = a.sampleRows[0],
        X = scale(0, 7, 490, 1674);
      for (const [i, v] of [r.control, r.treatment].entries()) {
        const y = 424 + i * 160;
        s.txt(i ? 'Rewrite' : 'Control', 160, y, 47);
        s.line(
          [
            [X(0), y],
            [X(r.difficulty), y],
          ],
          P.rule,
          24,
        );
        s.line(
          [
            [X(r.difficulty), y],
            [X(v), y],
          ],
          i ? P.rewrite : P.control,
          11,
        );
        s.dot(X(v), y, 15, i ? P.rewrite : P.control);
        s.center(v.toFixed(2), X(v), y - 53, 32);
      }
      s.line(
        [
          [X(r.difficulty), 338],
          [X(r.difficulty), 655],
        ],
        P.soft,
        3,
        [6, 9],
      );
      s.small(
        'Shared difficulty ' + r.difficulty.toFixed(2) + ' cancels when we subtract.',
        166,
        784,
      );
    } else {
      s.txt('Var(T − C) = Var(T) + Var(C) − 2 Cov(T,C)', 165, 357, 51);
      s.line([
        [160, 433],
        [1748, 433],
      ]);
      for (const [i, cov] of [0, 3].entries()) {
        const y = 533 + i * 151;
        s.txt(i ? 'Paired prompts' : 'Separate prompts', 169, y, 46);
        s.txt('9 + 4 − 2 × ' + cov, 760, y, 46, P.soft);
        if (!i || cue(k, 2, 'end'))
          s.txt('= ' + pairedContrastVariance(9, 4, cov), 1460, y, 57, i ? P.rewrite : P.control);
      }
      s.small('Negative covariance increases the variance of a difference.', 167, 844);
    }
  } else if (b <= 6) {
    s.page('SAME BUDGET   /   2,000 ANSWERS', 'Precision with separate and paired prompts');
    const X = scale(0.25, 0.85, 655, 1685);
    [
      [a.independentLift, a.independentSe],
      [a.pairedLift, a.pairedSe],
    ].forEach(([v, se], i) => {
      if (i && !cue(k, 5, "That's about")) return;
      const y = 392 + i * 209;
      s.txt(i ? '1,000 pairs' : 'Separate prompts', 164, y, 47);
      s.small('SE ' + se.toFixed(3), 165, y + 65);
      s.span(X, v - 1.96 * se, v + 1.96 * se, y, i ? P.rewrite : P.control);
      s.dot(X(v), y, 13, P.ink);
      s.center(v.toFixed(3), X(v), y - 55, 36);
    });
    s.axis(X, [0.25, 0.4, 0.55, 0.7, 0.85], 720);
    s.small('Mean score difference   /   approximate 95% interval', 166, 840);
  } else {
    s.page(
      'JUDGMENT UNIT',
      b === 7
        ? 'Which system supplied the clicked result?'
        : 'Which complete answer does the judge prefer?',
    );
    if (b === 7) {
      ['Raw · document 7', 'Rewrite · document 3', 'Raw · document 2'].forEach((v, i) => {
        const y = 363 + i * 129;
        s.small('RANK ' + (i + 1), 170, y);
        s.txt(v, 570, y, 47, i === 1 ? P.rewrite : P.control);
        if (i === 1) s.txt('← click', 1300, y, 44, P.ink);
      });
      s.small('Interleaving assigns click credit under a declared rule.', 170, 824);
    } else {
      s.center('Same prompt', 961, 318, 51);
      s.line(
        [
          [960, 369],
          [960, 429],
          [520, 429],
          [520, 490],
        ],
        P.rule,
        4,
      );
      s.line(
        [
          [960, 429],
          [1400, 429],
          [1400, 490],
        ],
        P.rule,
        4,
      );
      s.center('Answer A', 520, 563, 60, P.control);
      s.center('Answer B', 1400, 563, 60, P.rewrite);
      s.center('Blind the judge   ·   randomize order   ·   define ties', 960, 761, 44);
    }
  }
}

export function judge(s, k) {
  const b = beat(k);
  if (b <= 4) {
    s.page('CALIBRATION   /   ROLLBACK RUNBOOK', 'Compare labels on the same two answers');
    s.small('Source: rollback requires owner acknowledgement.', 160, 294);
    const show = cue(k, 2, 'How many'),
      score = cue(k, 3, 'Inspect the second');
    s.small('ANSWER', 160, 402);
    s.small('HUMAN', 1020, 402);
    s.small('MODEL JUDGE', 1390, 402);
    ['“Acknowledgement is required.”', '“Acknowledgement alone is enough.”'].forEach((v, i) => {
      const y = 516 + i * 132;
      s.txt(v, 160, y, 43, P.ink, { face: 'Serif', max: 820 });
      s.txt(i ? 'Unsupported' : 'Supported', 1020, y, 39, i ? P.bad : P.good);
      s.txt(show ? 'Supported' : 'Covered', 1390, y, 39, show ? P.good : P.soft);
    });
    if (score) s.txt('1 / 2 labels agree', 163, 821, 54, P.bad);
  } else {
    const moved = !!cue(k, 5, 'The receipt check rejects'),
      t = { ...locked, ...(moved ? { decoder: 'greedy / incident-answer-v3' } : {}) };
    const diff = receiptMismatches(locked, t);
    s.page('CONFIGURATION RECEIPT', 'What else changed?');
    s.small('LOCKED FIELD', 160, 292);
    s.small('CONTROL', 552, 292, P.control);
    s.small('REWRITE', 1190, 292, P.rewrite);
    Object.keys(locked).forEach((key, i) => {
      const y = 378 + i * 113;
      s.txt(key, 162, y, 42);
      s.txt(locked[key], 552, y, 36, P.ink, { max: 589 });
      s.txt(t[key], 1190, y, 36, diff.includes(key) ? P.bad : P.ink, { max: 568 });
      s.line([
        [163, y + 52],
        [1755, y + 52],
      ]);
    });
    s.txt(
      moved ? 'Reject the decoder change' : 'Query policy is the planned difference',
      164,
      844,
      43,
      moved ? P.bad : P.control,
    );
  }
}
