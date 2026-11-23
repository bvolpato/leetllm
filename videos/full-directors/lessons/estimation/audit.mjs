import {
  firstDraw,
  bootstrapRates,
  bootstrapRange,
  readerPairs,
} from '../../../films/estimation/fixtures.mjs';
import { count, wilson, missingLabelBounds } from '../../../films/estimation/model.mjs';
import {
  C,
  cue,
  scene,
  txt,
  dot,
  box,
  line,
  path,
  bracket,
  ruler,
  interval,
  envelope,
  matrix,
  summary,
  pc,
  lerpScale,
  mix,
  stamp,
} from './paint.mjs';
import { first } from './sampling.mjs';

export const drawn = firstDraw.map((i) => first[i]);
export function tallyBins(rates) {
  const bins = Array(101).fill(0);
  for (const r of rates) bins[Math.round(r * 100)]++;
  return bins;
}
const fullBins = tallyBins(bootstrapRates);
function imprint(g, row, ordinal, x, y, w) {
  box(g, x, y, w, 60, C.paper, 3);
  line(g, x + 60, y + 4, x + 60, y + 56, '#b4a48c', 2);
  txt(g, String(ordinal).padStart(2, '0'), x + 30, y + 31, 22, C.dark, 'center', 'Mono');
  txt(g, row.id, x + 84, y + 31, 31, C.dark, 'left', 'Mono');
  envelope(g, x + w - 62, y + 13, 44, 33, row.specialist);
}
export function bootstrap(g, s) {
  const b = s.beat.beatIndex;
  if (b === 2) {
    scene(g, 'Bootstrap at the boundary', 'Where could a positive label come from?');
    txt(g, 'Original ten labels', 149, 293, 38);
    matrix(g, Array(10).fill(false), 154, 360, 10, 109, 70, 92, 62);
    const completed = Math.floor(1000 * cue(s, 2, 'Make a thousand resamples', 3.8));
    for (let r = 0; r < Math.min(3, completed); r++) {
      txt(g, 'Draw ' + (completed - Math.min(3, completed) + r + 1), 155, 535 + r * 100, 30, C.dim);
      for (let j = 0; j < 10; j++) envelope(g, 370 + 75 * j, 507 + r * 100, 62, 45, false);
      txt(g, '0 / 10', 1160, 534 + r * 100, 30, C.blue, 'left', 'Mono');
    }
    if (cue(s, 2, 'percentile interval collapses'))
      summary(g, 'Percentile endpoints', '0%, 0%', 1375, 492, C.blue);
    return;
  }
  scene(
    g,
    'Bootstrap with replacement',
    b === 0 ? 'Where did the second imprint come from?' : 'What does one histogram entry count?',
  );
  const n =
    Math.floor(cue(s, 0, 'Press the first selected', 1.1)) +
    Math.floor(cue(s, 0, 'second draw picks', 1.1)) +
    Math.floor(98 * cue(s, 0, 'Finish all hundred', 5));
  const runProgress = cue(s, 0, 'Finish all hundred', 5) * 98;
  const inFlight = runProgress % 1 > 0;
  const active = firstDraw[inFlight ? Math.min(n, 99) : Math.max(0, n - 1)];
  if (b === 0) {
    txt(g, 'Source tray · 100 reviewed', 144, 272, 33, C.dim);
    for (let i = 0; i < 100; i++) {
      const x = 145 + (i % 10) * 48,
        y = 334 + Math.floor(i / 10) * 39;
      envelope(g, x, y, 38, 27, first[i].specialist);
      if (i === active && n) {
        g.strokeStyle = C.gold;
        g.lineWidth = 4;
        g.strokeRect(x - 4, y - 4, 46, 35);
      }
    }
    txt(g, 'Selected source', 145, 783, 29, C.dim);
    envelope(g, 145, 822, 390, 83, first[active].specialist, first[active].id);
    const hits = [cue(s, 0, 'Press the first selected', 1.1), cue(s, 0, 'second draw picks', 1.1)];
    // Send a facsimile from the selected source to its exact cell on the receipt.
    const run = 98 * cue(s, 0, 'Finish all hundred', 5);
    const moving = hits[0] < 1 ? hits[0] : hits[1] < 1 ? hits[1] : run % 1;
    const next = Math.min(99, n);
    const source = first[firstDraw[next]];
    const x = 1085;
    txt(g, 'Imprints in draw order', x, 272, 33, C.dim);
    const slots = [0, 1];
    const keepRecent = moving > 0 ? 4 : 5;
    for (let j = Math.max(2, n - keepRecent); j < n; j++) slots.push(j);
    slots.forEach((index, j) => {
      const y = 323 + j * 70;
      if (index < n) imprint(g, drawn[index], index + 1, x, y, 565);
      else {
        box(g, x, y, 565, 60, C.teal, 3, C.line);
        if (index !== n || !moving) txt(g, 'Draw ' + (index + 1), x + 26, y + 31, 25, C.dim);
      }
    });
    if (moving > 0 && n < 100) {
      const slot = Math.min(next, 6),
        destinationY = 323 + slot * 70 + 9;
      const approach = Math.min(1, moving * 2);
      const mx = moving <= 0.5 ? mix(565, 826, approach) : mix(826, x + 72, 2 * moving - 1);
      const my = mix(823, destinationY, approach);
      envelope(g, mx, my, 213, 44, source.specialist, source.id);
    }
    if (n >= 8) txt(g, 'First two and most recent imprints', x, 841, 27, C.dim);
    if (n > 0)
      txt(
        g,
        count(drawn.slice(0, n)) + ' specialist / ' + n + (n === 1 ? ' draw' : ' draws'),
        x,
        914,
        38,
        C.gold,
      );
    return;
  }
  const deposit = cue(s, 1, 'Add that fraction', 1.2);
  const repeat = cue(s, 1, 'Repeat the whole draw', 5);
  const completed = Number(deposit === 1) + Math.floor(399 * repeat);
  const data = tallyBins(bootstrapRates.slice(0, completed));
  const X = lerpScale(781, 1755, 0, 0.36),
    max = Math.max(...fullBins);
  const firstCount = count(drawn);
  const firstRate = firstCount / drawn.length;
  const plotBase = 767;
  txt(g, 'First resample', 149, 312, 36, C.dim);
  imprint(g, drawn[0], 1, 150, 375, 435);
  imprint(g, drawn[1], 2, 150, 449, 435);
  summary(g, 'Specialist / draws', firstCount + ' / ' + drawn.length, 150, 617);
  txt(g, '100 original labels', 150, 851, 34, C.blue);
  data.forEach((v, i) => {
    if (!v) return;
    const h = (370 * v) / max;
    box(g, X(i / 100) - 10, plotBase - h, 20, h, C.mint, 3);
  });
  if (!repeat) {
    const binX = X(firstRate);
    if (deposit < 1) {
      const x = mix(245, binX, deposit);
      const y = mix(762, 638, deposit) - 40 * Math.sin(Math.PI * deposit);
      box(g, x - 76, y - 31, 152, 62, C.gold, 8);
      txt(g, pc(firstRate), x, y, 38, C.dark, 'center', 'Mono');
    } else {
      const barTop = plotBase - 370 / max;
      dot(g, binX, barTop, 9, C.gold);
      line(g, binX, 661, binX, barTop - 16, C.gold, 3);
      txt(g, pc(firstRate) + ' · 1 resample', binX, 638, 34, C.gold, 'center', 'Mono');
    }
  }
  ruler(g, X, [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36], plotBase + 5);
  txt(
    g,
    completed + (completed === 1 ? ' resample plotted' : ' resamples plotted'),
    1265,
    312,
    38,
    C.mint,
    'center',
  );
  if (completed === 400 && cue(s, 1, 'Take the two and a half')) {
    bracket(g, X(bootstrapRange[0]), X(bootstrapRange[1]), 880, 15);
    txt(
      g,
      'Percentile interval · ' + pc(bootstrapRange[0]) + ' to ' + pc(bootstrapRange[1]),
      mix(X(bootstrapRange[0]), X(bootstrapRange[1]), 0.5),
      938,
      30,
      C.gold,
      'center',
    );
  }
}

export function posterior(k, n) {
  return { mle: k / n, map: (k + 1) / (n + 2), mean: (k + 2) / (n + 4), a: k + 2, b: n - k + 2 };
}
export function curve(g, X, base, h, k, fail, color, q = 1) {
  const mode = k / (k + fail);
  const peak = mode ** k * (1 - mode) ** fail;
  const pts = [];
  for (let i = 0; i <= Math.round(250 * q); i++) {
    const p = i / 250;
    pts.push([X(p), base - (h * p ** k * (1 - p) ** fail) / peak]);
  }
  if (pts.length > 1) path(g, pts, color, 5);
}
export function calibration(g, showCount, showBand, allBins) {
  const X = lerpScale(580, 1690, 0, 0.4),
    k = 16,
    n = 100,
    v = wilson(k, n);
  txt(g, 'Score bucket', 137, 280, 32, C.dim);
  const ys = allBins ? [373, 530, 687] : [530],
    rates = allBins ? [0.1, 0.2, 0.3] : [0.2];
  ys.forEach((y, i) => {
    const rate = rates[i];
    txt(g, pc(rate) + ' forecast', 139, y, 40, rate === 0.2 ? C.gold : C.dim, 'left', 'Serif');
    if (rate !== 0.2) {
      txt(g, 'No held-out labels', X(rate), y, 29, C.faint, 'center');
      return;
    }
    line(g, X(rate), y - 124, X(rate), y + 98, C.gold, 4);
    if (showCount) {
      dot(g, X(k / n), y, 13, C.pink);
      txt(g, '16 of 100', X(k / n) - 12, y + 63, 34, C.pink, 'right', 'Mono');
    }
    if (showBand) {
      interval(g, X, y, v, k / n, C.mint, showBand);
      if (showBand === 1) txt(g, pc(v.low, 1) + ' to ' + pc(v.high, 1), X(0.26), y, 31, C.mint);
    }
  });
  ruler(g, X, [0, 0.1, 0.2, 0.3, 0.4], 817);
  txt(g, 'Outcome rate in held-out messages', 1135, 930, 36, C.dim, 'center');
}
export function prior(g, s) {
  const b = s.beat.beatIndex;
  if (b >= 5) {
    scene(g, 'Held-out messages', 'Does the forecast fit this bucket?');
    const show = cue(s, 5, 'twenty-percent chance', 0.6);
    if (show)
      calibration(
        g,
        cue(s, 6, 'sixteen need a specialist'),
        cue(s, 7, 'across the forecast line', 1.1),
        false,
      );
    else {
      for (let i = 0; i < 8; i++) envelope(g, 187 + i * 191, 462, 149, 99, null);
      txt(g, 'Set aside before training', 960, 677, 45, C.ink, 'center', 'Serif');
    }
    return;
  }
  scene(g, 'Binomial model · Beta(2, 2) prior', 'How far does the prior move the peak?');
  const X = lerpScale(702, 1748, 0, 1);
  const priorOn = cue(s, 1, 'add one success term', 1.2);
  const second = cue(s, 3, 'full hundred labels', 1.2);
  for (let i = 0; i < (second ? 2 : 1); i++) {
    const n = i ? 100 : 5,
      k = count(first.slice(0, n)),
      p = posterior(k, n),
      y = i ? 769 : 507;
    txt(g, k + ' of ' + n, 146, y - 110, 59, C.ink, 'left', 'Serif');
    txt(g, 'MLE   ' + pc(p.mle, 0), 153, y - 32, 37, C.blue, 'left', 'Mono');
    const currentPrior = i ? cue(s, 3, 'posterior peaks', 1.2) : priorOn;
    const reported = i
      ? cue(s, 3, 'Compare the two rows', 0)
      : b > 1 || (b === 1 && s.elapsed >= s.speechDuration);
    if (currentPrior === 1 && reported)
      txt(
        g,
        'MAP   ' + (k + 1) + '/' + (n + 2) + ' = ' + pc(p.map, 1),
        153,
        y + 36,
        33,
        C.mint,
        'left',
        'Mono',
      );
    line(g, X(0), y, X(1), y, C.line);
    curve(g, X, y, 158, k, n - k, C.blue);
    if (currentPrior) curve(g, X, y, 158, k + 1, n - k + 1, C.mint, currentPrior);
    dot(g, X(p.mle), y - 158, 7, C.blue);
    if (currentPrior === 1) dot(g, X(p.map), y - 158, 9, C.mint);
  }
  txt(g, 'Curves scaled to their own peak', 708, 262, 29, C.dim);
  if (b === 2 && cue(s, 2, 'add one to the positive count'))
    txt(g, 'MAP = (k + 1) / (n + 2)', 153, 674, 38, C.mint, 'left', 'Mono');
  ruler(g, X, [0, 0.25, 0.5, 0.75, 1], 830);
  txt(g, 'Candidate specialist rate', 1220, 804, 31, C.dim, 'center');
}

export const fullMissing = missingLabelBounds(100, 80, 16);
export const practiceMissing = missingLabelBounds(60, 45, 9);

const missingCues = {
  audit: {
    beat: 3,
    bracket: 'Count the eighty',
    widen: 'Widen the bracket',
    lower: 'Suppose none',
    upper: 'Suppose all twenty',
    resolved: ['Sixteen out of eighty', 'twenty percent'],
    low: ['Sixteen out of a hundred', 'sixteen percent'],
    high: ['Thirty-six out of a hundred', 'thirty-six percent'],
  },
  practice: {
    beat: 1,
    bracket: 'Close the bracket',
    widen: 'Now include all sixty',
    lower: 'Suppose the fifteen',
    upper: 'Suppose every sealed',
    resolved: ['Nine out of forty-five', 'twenty percent'],
    low: ['Nine out of sixty', 'fifteen percent'],
    high: ['Twenty-four out of sixty', 'forty percent'],
  },
};

function fractionLine(g, s, beat, [fraction, percent], k, n, x, y, size, color) {
  if (!cue(s, beat, fraction, 0)) return;
  const evaluated = cue(s, beat, percent, 0, { captionStart: false });
  txt(
    g,
    k + ' / ' + n + (evaluated ? ' = ' + pc(k / n) : ''),
    x,
    y,
    size,
    color,
    'left',
    'Serif',
  );
}

function missing(g, s, data, steps) {
  const { selected, resolved, positive, unknown } = data;
  const { beat } = steps;
  const whole = cue(s, beat, steps.widen, 0);
  const upper = cue(s, beat + 1, steps.upper, 0);
  const stage = upper ? 3 : whole ? 2 : cue(s, beat, steps.bracket, 0) ? 1 : 0;
  const fill = upper ? cue(s, beat + 1, steps.upper, 1.5) : cue(s, beat, steps.lower, 1.5);
  const cols = selected === 60 ? 15 : 10,
    dx = selected === 60 ? 62 : 80,
    dy = selected === 60 ? 88 : 42;
  const w = dx - 12,
    h = selected === 60 ? 60 : 31,
    top = selected === 60 ? 399 : 330,
    left = 146;
  const states = Array.from({ length: selected }, (_, i) => {
    if (i < resolved) return i < positive;
    if (upper) return i - resolved < Math.round(fill * unknown);
    if (whole && i - resolved < Math.round(fill * unknown)) return false;
    return null;
  });
  txt(
    g,
    data === practiceMissing ? 'Practice tray · 60 selected' : 'Separate audit · 100 selected',
    left,
    267,
    34,
    C.dim,
  );
  matrix(g, states, left, top, cols, dx, dy, w, h);
  const last = stage === 1 ? resolved : selected;
  if (stage > 0) {
    const bottom = top + Math.ceil(last / cols) * dy - 8;
    path(
      g,
      [
        [left - 9, top - 7],
        [left - 24, top - 7],
        [left - 24, bottom],
        [left - 9, bottom],
      ],
      C.gold,
      4,
    );
  }
  if (stage >= 2) {
    const firstUnknownY = top + Math.floor(resolved / cols) * dy;
    // Keep a gold rim on the original unknowns while their hypothetical outcomes change.
    for (let i = resolved; i < selected; i++) {
      const x = left + (i % cols) * dx,
        y = firstUnknownY + (Math.floor(i / cols) - Math.floor(resolved / cols)) * dy;
      g.strokeStyle = C.gold;
      g.lineWidth = 2.5;
      g.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }
  }
  txt(g, 'Original review', left, 790, 28, C.dim);
  txt(g, positive + ' specialist', left, 841, 31, C.pink);
  txt(g, resolved - positive + ' routine', left + 248, 841, 31, C.blue);
  txt(g, unknown + (stage > 1 ? ' originally sealed' : ' unresolved'), left + 475, 841, 31, C.gold);
  const x = 1192;
  if (stage === 0) {
    txt(g, 'Of the resolved cases?', x, 400, 47, C.ink, 'left', 'Serif');
    txt(g, 'Of the whole tray?', x, 519, 47, C.ink, 'left', 'Serif');
    return;
  }
  txt(g, 'Resolved cases', x, 329, 31, C.dim);
  fractionLine(g, s, beat, steps.resolved, positive, resolved, x, 407, 60, C.blue);
  if (cue(s, beat, steps.lower, 0)) {
    txt(g, 'If every sealed case is routine', x, 527, 30, C.dim);
    if (upper || fill === 1)
      fractionLine(g, s, beat, steps.low, positive, selected, x, 590, 47, C.mint);
  }
  if (upper) {
    txt(g, 'If every sealed case is specialist', x, 698, 30, C.dim);
    if (fill === 1)
      fractionLine(g, s, beat + 1, steps.high, positive + unknown, selected, x, 765, 47, C.pink);
  }
}
export function practice(g, s) {
  scene(g, 'Unresolved labels', 'What range can the sealed row hide?');
  missing(g, s, practiceMissing, missingCues.practice);
}
function readerSheet(g, s) {
  const b = s.beat.beatIndex;
  txt(g, 'Case 17', 147, 308, 41, C.gold, 'left', 'Mono');
  txt(g, 'The customer got back in.', 147, 402, 43, C.ink, 'left', 'Serif');
  txt(g, 'Then the account locked again.', 147, 468, 43, C.ink, 'left', 'Serif');
  if (b >= 6) {
    stamp(g, 'Score hidden', 148, 596, 397, C.faint);
    txt(g, 'Both reviewers use the same rule', 148, 759, 32, C.dim);
    txt(g, 'Both keep their original labels', 148, 822, 32, C.dim);
  }
  if (b < 6) return;
  const compared = cue(s, 7, 'Now compare their labels', 1);
  const extra = cue(s, 7, 'three more cases', 1.2);
  txt(g, 'Case', 976, 317, 31, C.dim);
  txt(g, 'Reviewer A', 1200, 317, 31, C.dim, 'center');
  txt(g, 'Reviewer B', 1524, 317, 31, C.dim, 'center');
  const visible = 1 + Math.floor(3 * extra);
  readerPairs.slice(0, visible).forEach((r, i) => {
    const y = 389 + i * 84;
    txt(g, r.id, 979, y + 25, 32, C.dim, 'left', 'Mono');
    [r.a, r.b].forEach((label, j) => {
      const x = 1094 + j * 321;
      const open = compared === 1,
        specialist = label === 'Specialist';
      box(g, x, y - 5, 216, 61, open ? (specialist ? C.pink : C.blue) : C.teal, 5);
      txt(g, open ? label : 'Private', x + 108, y + 25, 30, open ? C.dark : C.dim, 'center');
    });
    if (b === 8 && cue(s, 8, 'Three pairs match'))
      txt(g, r.a === r.b ? '=' : '≠', 1364, y + 25, 35, r.a === r.b ? C.mint : C.pink, 'center');
  });
  if (cue(s, 8, 'observed agreement')) {
    const match = readerPairs.filter((r) => r.a === r.b).length;
    txt(
      g,
      match + ' / ' + readerPairs.length + ' = ' + pc(match / readerPairs.length) + ' agreement',
      976,
      829,
      42,
      C.mint,
    );
    if (cue(s, 8, 'for adjudication')) txt(g, 'Case 17 → adjudication', 976, 911, 34, C.pink);
  }
}

export function target(g, s) {
  const b = s.beat.beatIndex;
  if (b >= 5 && (b > 5 || cue(s, 5, 'Look at this one'))) {
    scene(g, 'Independent review', 'Where did the reviewers disagree?');
    readerSheet(g, s);
    return;
  }
  if (b >= 2) {
    scene(g, 'Unresolved labels', 'Which cases belong in the denominator?');
    missing(g, s, fullMissing, missingCues.audit);
    return;
  }
  scene(
    g,
    b ? 'Flagged signup audit' : 'Weekly message audit',
    b ? 'Who was eligible for review?' : 'What does the sample estimate?',
  );
  if (b === 0) {
    for (let i = 0; i < 160; i++)
      envelope(g, 146 + (i % 16) * 44, 345 + Math.floor(i / 16) * 35, 35, 23, null);
    txt(g, 'Population · 100,000 messages', 146, 773, 33);
    if (cue(s, 0, 'unknown specialist share'))
      txt(g, 'Estimand · weekly specialist share', 146, 840, 31, C.gold);
    if (cue(s, 0, 'draw messages at random')) {
      matrix(
        g,
        first.map((r) => r.specialist),
        1012,
        344,
        10,
        53,
        35,
        40,
        24,
      );
      txt(g, 'Sample · 100 random IDs', 1012, 773, 33);
      if (cue(s, 0, 'Divide the specialist count'))
        txt(g, 'Estimator · specialist / reviewed', 1012, 840, 31, C.gold);
    }
  } else {
    const rows = [
      ['Precision', 'Abusive flags', 'All flags'],
      ['Recall', 'Abusive flags', 'All abusive signups'],
      ['False-positive rate', 'Clean flags', 'All clean signups'],
      ['Prevalence', 'Abusive signups', 'All signups'],
    ];
    txt(g, 'Measure', 144, 298, 32, C.dim);
    txt(g, 'Numerator', 737, 298, 32, C.dim);
    txt(g, 'Denominator', 1281, 298, 32, C.dim);
    for (const [i, [name, k, n]] of rows.entries()) {
      if (
        !cue(
          s,
          1,
          ['Only flagged signups', 'Recall needs', 'false-positive rate', 'Prevalence needs'][i],
        )
      )
        continue;
      const y = 408 + i * 126;
      line(g, 145, y + 57, 1758, y + 57, C.line, 2);
      txt(g, name, 145, y, 45, i === 0 ? C.gold : C.ink, 'left', 'Serif');
      txt(g, k, 737, y, 36, C.dim);
      txt(g, n, 1281, y, 36, i === 0 ? C.gold : C.dim);
    }
  }
}
