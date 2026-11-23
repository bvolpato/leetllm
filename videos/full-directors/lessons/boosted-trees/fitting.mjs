import { DELAY_FIXTURE as delays, MONTHS } from '../../../films/boosted-trees/fixtures.mjs';
import {
  RESIDUALS,
  LEAF_CORRECTIONS,
  UPDATED_DELAY,
  classificationTreeStep,
} from '../../../films/boosted-trees/model.mjs';
import { MSE, sigmoid, splitConstruction } from '../../../films/boosted-trees/arithmetic.mjs';
import { bracket, mix, num, signed, stem } from './studio.mjs';

const after = UPDATED_DELAY[2],
  actual = delays.actual[2],
  initial = delays.initial[2];
export function delayReading(t) {
  return mix(initial, after, t);
}
export function opening(v) {
  const { c, cue, txt, mono, serif, line, path, rect } = v;
  txt('Training run   /   deadline recorder', 98, 88, 34, c.muted);
  const X = (h) => 160 + h * 78;
  const travel = cue(1, 'The trace keeps going', 1.6);
  const finish = cue(1, 'This job has a leaf');
  const quarters = cue(2, 'four equal spaces');
  const move = cue(3, 'Move the notch', 1.0);
  const pos = delayReading(move);
  serif(finish ? 'Large-input leaf' : 'Large-input job', 97, 192, 82);
  if (finish) txt('1 job', 101, 272, 40, c.blue);
  const base = 559,
    last = mix(initial * cue(1, 'Start the trace', 1.6), actual, travel);
  for (let h = 0; h <= 20; h++) {
    const x = X(h);
    line(x, 414, x, 730, c.grid, h % 5 === 0 ? 3 : 1);
    line(x, 695, x, 695 + (h % 5 === 0 ? 20 : 9), c.muted, 2);
  }
  // The heartbeat waveform is a running-job indicator. Horizontal position carries time.
  const pts = [[X(0), base]];
  for (let i = 1; i <= Math.floor(last * 16); i++) {
    const h = i / 16,
      phase = i % 16;
    const pulse = phase === 4 ? -16 : phase === 5 ? 38 : phase === 6 ? -66 : phase === 7 ? 24 : 0;
    pts.push([X(h), base + pulse]);
  }
  path(pts, c.blue, 6);
  v.dot(X(last), base, 11, c.blue);
  line(X(0), 450, X(0), 710, c.ink, 3);
  txt('Deadline', X(0), 778, 38);
  if (finish) {
    line(X(20), 451, X(20), 710, c.blue, 3);
    mono('20 h', X(20), 761, 48, c.blue, 'center');
    txt('Finished', X(20), 821, 34, c.blue, 'center');
  }
  if (quarters)
    for (let i = 0; i < 4; i++) {
      const x = X(initial + ((actual - initial) * i) / 4);
      rect(x + 3, 376, (X(20) - X(6)) / 4 - 6, 16, c.gold);
    }
  else if (cue(1, 'Fourteen hours')) bracket(v, X(6), X(20), 405, '14 h residual', c.gold, true);
  if (move > 0) {
    line(X(6), 467, X(6), 716, c.muted, 3, [9, 8]);
    line(X(6), 640, X(pos), 640, c.gold, 13);
  }
  path(
    [
      [X(pos) - 20, 455],
      [X(pos) + 20, 455],
      [X(pos), 483],
    ],
    c.gold,
    0,
    true,
  );
  line(X(pos), 482, X(pos), 705, c.gold, 5);
  mono(num(pos, 2) + ' h', X(pos), 759, 55, c.gold, 'center');
  txt('Prediction', X(pos), 822, 35, c.gold, 'center');
  if (quarters && !move) txt('Place the next notch', X(13), 881, 42, c.gold, 'center');
  if (move === 1) bracket(v, X(pos), X(20), 880, '10.5 h remaining', c.blue);
}

export function calendar(v) {
  const { c, b, cue, txt, mono, rect, line } = v;
  v.heading(
    'Scheduler study   /   640 simulated jobs',
    'Fit through March. Select on April. Evaluate on May.',
  );
  const widths = [730, 435, 435],
    xs = [100, 875, 1355];
  MONTHS.forEach((m, i) => {
    const x = xs[i],
      w = widths[i],
      active = i + 1 <= b,
      col = active ? [c.blue, c.gold, c.green][i] : c.muted;
    rect(x, 324, w, 500, active ? c.paper : c.bg);
    line(x, 324, x + w, 324, col, 7);
    for (let j = 0; j < 5; j++) v.dot(x + 38 + (j * (w - 76)) / 4, 350, 6, c.grid);
    v.serif(m.name, x + 26, 430, 58, col);
    if (active) {
      v.grid(
        m.rows,
        i ? 20 : 36,
        x + 32,
        515,
        i ? 18 : 18,
        19,
        (j) => (j < m.misses ? col : c.grid),
        12,
      );
      txt(m.misses + ' misses in ' + m.rows + ' jobs', x + 28, 766, 34, c.ink);
    } else txt('Held for later', x + 25, 580, 36, c.muted);
    txt(['Fit the corrections', 'Select the pair', 'Evaluate the pair'][i], x + 16, 880, 35, col);
  });
  if (b === 2 && cue(2, "that model's April scores"))
    mono('trees → scores → cutoff', 1090, 941, 32, c.gold, 'center');
  if (b === 3) mono('rounds + cutoff frozen', 1555, 941, 30, c.green, 'center');
}

export function eligible(v) {
  const { c, b, cue, end, txt, mono, serif, line, ticket } = v;
  if (b <= 2) {
    v.heading('Candidate population', 'Which tables do the results describe?');
    const entries = [
      ['2022 benchmark', 'Medium-sized tables', 'around 10,000 rows'],
      ['TabPFN study', 'Small tables', 'a competitive neural model'],
      ['Our scheduler', 'Training jobs', 'large-input flag at 900 GB'],
    ];
    entries.forEach(([name, what, note], i) => {
      if ((i === 2 && b < 2) || (i === 1 && !cue(1, 'A later'))) return;
      const y = 347 + 190 * i;
      txt(name, 130, y, 38, c.muted);
      serif(what, 560, y, 50, c.ink, 'left', 560);
      txt(note, 1190, y, 36, c.blue, 'left', 'Sans', 584);
      line(132, y + 74, 1780, y + 74, c.grid, 2);
    });
    return;
  }
  if (b <= 4) {
    v.heading('Training eligibility', 'Two clocks govern the same job');
    const dispatch = 726,
      fit = 1354;
    line(150, 534, 1780, 534, c.muted, 5);
    [
      [dispatch, 'Dispatch'],
      [fit, 'Fit cutoff'],
    ].forEach(([x, s]) => {
      line(x, 365, x, 826, c.gold, 4);
      txt(s, x, 315, 40, c.gold, 'center');
    });
    const tags = [
      [340, 440, 'Heartbeat', 'Available at dispatch', c.blue],
      [848, 656, 'Diagnostic', 'Arrived after dispatch', c.red],
      [1440, 440, 'Final label', 'Arrived after cutoff', c.red],
    ];
    tags.forEach(([x, y, name, note, col], i) => {
      if ((i === 1 && !cue(3, 'diagnostic')) || (i === 2 && !cue(3, 'training cutoff'))) return;
      v.dot(x + 85, 534, 11, col);
      line(x + 85, 534, x + 85, y, c.grid, 3);
      ticket(x, y - 47, 330, 100, name, note, col);
    });
    if (b === 4) txt('Keep a shared incident on one side of the split.', 155, 910, 38, c.blue);
    return;
  }
  v.heading('Missing telemetry', 'The heartbeat field is empty');
  ticket(134, 395, 385, 148, 'Heartbeat', 'NaN', c.gold);
  const route = cue(7, 'to the twelve');
  line(520, 467, 780, 467, c.muted, 5);
  stem(v, 780, 467, 1200, 351, route ? c.blue : c.grid);
  stem(v, 780, 467, 1200, 707, c.grid);
  if (b === 5) {
    txt('Classic classifier', 125, 743, 36, c.muted);
    txt('Rejects NaN', 125, 809, 46, c.red);
  }
  txt('Histogram classifier', 760, 274, 44);
  if (b >= 6) {
    ticket(1194, 318, 435, 105, 'Left child', '12 training rows', route ? c.blue : c.muted);
    ticket(1194, 664, 435, 105, 'Right child', '5 training rows', c.muted);
    if (route) {
      v.dot(1165, 351, 17, c.blue);
      txt('NaN goes left', 1228, 482, 39, c.blue);
    } else txt('No training NaNs for this feature', 760, 835, 33, c.muted);
  }
  if (b === 7 && cue(7, 'If you impute'))
    txt('Fit imputation on training rows. Check missing and unseen inputs.', 130, 920, 33, c.ink);
}

export function residual(v) {
  const { c, b, clock, cue, txt, mono, line } = v;
  const updated = cue(3, 'Move the two markers together', 0.8);
  if (b === 4) {
    const beat = 'Now the gap is two and a quarter';
    const spoken = clock.wordCue(beat);
    const move = cue(4, beat, spoken.end - spoken.start);
    const z = mix(initial, UPDATED_DELAY[1], move);
    const oldGap = delays.actual[1] - initial;
    const newGap = delays.actual[1] - UPDATED_DELAY[1];
    v.heading('Job B   /   enlarged delay scale', 'Track the error on the same ruler');
    const X = (h) => 300 + (h - 5.5) * 485;
    line(X(5.5), 560, X(8.4), 560, c.grid, 5);
    for (const [h, s, col, y] of [
      [6, 'Old prediction', c.muted, 348],
      [8, 'Actual delay', c.blue, 348],
    ]) {
      line(X(h), y < 500 ? y + 56 : y - 55, X(h), 560, col, 5);
      v.dot(X(h), 560, 14, col);
      txt(s, X(h), y, 34, col, 'center');
      mono(h + ' h', X(h), y + (y < 500 ? -55 : 58), 47, col, 'center');
    }
    if (clock.elapsed >= clock.wordCue('two hours').end)
      bracket(v, X(initial), X(delays.actual[1]), 469, num(oldGap) + ' h', c.muted, true);
    if (move > 0) {
      line(X(z), 695, X(z), 560, c.gold, 5);
      v.dot(X(z), 560, 14, c.gold);
      txt('New prediction', X(z), 750, 34, c.gold, 'center');
      if (move === 1) mono(num(z) + ' h', X(z), 808, 47, c.gold, 'center');
      bracket(v, X(z), X(delays.actual[1]), 623, move === 1 ? num(newGap) + ' h' : '', c.gold);
    }
    return;
  }
  v.heading('Squared-error fit   /   three delay measurements', 'One correction per leaf');
  const X = (h) => 482 + 57 * h;
  const ys = [405, 590, 804];
  delays.actual.forEach((h, i) => {
    const y = ys[i],
      t = i === 2 ? cue(3, 'giving nine and a half', 0.8) : updated;
    const z = mix(initial, UPDATED_DELAY[i], t);
    txt('Job ' + ['A', 'B', 'C'][i], 124, y - 15, 51);
    txt(i === 2 ? 'large input' : 'shared leaf', 125, y + 45, 30, c.muted);
    line(X(0), y, X(21), y, c.grid, 3);
    line(X(h), y - 40, X(h), y + 20, c.blue, 5);
    v.dot(X(h), y, 11, c.blue);
    mono(h + ' h actual', X(h), y - 65, 31, c.blue, 'center');
    if (t > 0) line(X(6), y - 25, X(6), y + 53, c.muted, 3, [5, 5]);
    v.path(
      [
        [X(z) - 13, y + 35],
        [X(z) + 13, y + 35],
        [X(z), y + 7],
      ],
      c.gold,
      0,
      true,
    );
    mono(num(z, 2) + ' h', X(z), y + 73, 33, c.gold, 'center');
    if (b === 2) {
      const mid = (X(6) + X(h)) / 2;
      mono(signed(RESIDUALS[i]) + ' h', mid, y - 32, 27, c.ink, 'center');
    }
  });
  if (b === 2 && cue(2, 'average to minus one')) {
    v.path(
      [
        [340, 405],
        [370, 405],
        [370, 590],
        [340, 590],
      ],
      c.gold,
      4,
    );
    mono('−1 h', 355, 510, 32, c.gold, 'right');
  }
  if (b === 3 && cue(3, 'Mean squared error')) {
    const oldMse = clock.elapsed >= clock.wordCue('falls from seventy-two').end;
    const newMse = clock.elapsed >= clock.wordCue('hours squared').end;
    mono('Training MSE', 1220, 269, 38);
    if (oldMse) mono(MSE(delays.initial), 1515, 269, 38);
    if (newMse) mono('→ ' + MSE(UPDATED_DELAY) + ' h²', 1580, 269, 38);
  }
}

const fittedStep = classificationTreeStep();
export const classLeaves = fittedStep.leaves.map((leaf) => {
  const members = fittedStep.rows.filter((row) => row.leaf === leaf.leaf);
  return {
    label: members[0].label,
    jobs: members.length,
    gradient: members[0].gradient,
    curvature: members[0].hessian,
    fullMove: leaf.value,
    halfStep: fittedStep.learningRate * leaf.value,
  };
});

export function classification(v) {
  const { c, b, cue, txt, mono } = v;
  v.heading('Binary log loss', 'A tree adds to the logit');
  const X = (z) => 155 + (z + 4) * 85,
    Y = (p) => 800 - p * 438;
  for (const z of [-4, -2, 0, 2, 4]) {
    v.line(X(z), 361, X(z), 800, c.grid, 2);
    mono(z, X(z), 844, 29, c.muted, 'center');
  }
  for (const p of [0, 0.5, 1]) {
    v.line(X(-4), Y(p), X(4), Y(p), c.grid, 2);
    mono(p, 125, Y(p), 30, c.muted, 'right');
  }
  v.path(
    Array.from({ length: 161 }, (_, i) => [X(i / 20 - 4), Y(sigmoid(i / 20 - 4))]),
    c.blue,
    7,
  );
  txt('Miss probability', 160, 292, 37, c.blue);
  txt('Raw score  F', X(0), 908, 37, c.muted, 'center');
  const moved = cue(3, 'Convert back', 1.05);
  mono('p = 1/(1 + exp(−F))', 919, 359, 43, c.blue);
  if (!moved) v.dot(X(0), Y(0.5), 16, c.ink);
  if (b === 1) return;

  const showGradient = cue(2, 'probability minus the observed label');
  const showCurvature = cue(3, 'curvature is a quarter');
  const showMove = cue(3, 'The unpenalized moves');
  const showStep = cue(3, 'A half step');
  const grouped = cue(3, 'two missed jobs together');
  if (showGradient) {
    txt('At F = 0', 919, 432, 34, c.muted);
    mono('g = p − y', 1167, 432, 36);
  }
  if (showCurvature)
    mono('h = ' + num(classLeaves[0].curvature) + ' per job', 1460, 432, 34, c.muted);
  const column = (label, x) => txt(label, x, 544, 30, c.muted, 'center');
  if (showGradient) column('g per job', 1207);
  if (showMove) column('Full move', 1403);
  if (showStep) column('Half step', 1585);
  if (moved === 1) column('p(miss)', 1761);

  classLeaves.forEach((leaf, i) => {
    const y = 637 + 142 * i;
    const col = leaf.label ? c.red : c.gold;
    const name = leaf.label ? 'Missed' : 'On time';
    const z = leaf.halfStep * moved;
    const p = sigmoid(z);
    v.line(916, y - 55, 1832, y - 55, c.grid, 2);
    txt(name, 919, y, 42, col);
    if (grouped) txt(leaf.jobs + (leaf.jobs === 1 ? ' job' : ' jobs'), 920, y + 48, 28, c.muted);
    if (showGradient) mono(signed(leaf.gradient), 1207, y, 42, col, 'center');
    if (showMove) mono(signed(leaf.fullMove), 1403, y, 42, col, 'center');
    if (showStep) mono(signed(leaf.halfStep), 1585, y, 42, col, 'center');
    if (moved > 0) {
      v.dot(X(z), Y(p), 16, col);
      const dx = leaf.label ? 22 : -22;
      txt(name, X(z) + dx, Y(p) + (leaf.label ? 28 : -28), 31, col, leaf.label ? 'left' : 'right');
    }
    if (moved === 1) mono(num(p), 1761, y, 42, col, 'center');
  });
  if (cue(3, 'Divide the negative sum'))
    mono('Unpenalized move = −Σg / Σh', 919, 916, 36, c.muted);
}

export const weight = (g, h, lambda) => -g / (h + lambda);
const saving = (g, h, lambda) => (g * g) / (2 * (h + lambda));
export function curvature(v) {
  const { c, b, cue, end, txt, mono, serif, line } = v;
  if (b <= 3) {
    v.heading('Log loss   /   one training row', 'Slope tells us which way to move');
    const p = b === 3 ? 119 / 360 : 0.5;
    mono('p = ' + (b === 3 ? '119 / 360' : '0.5'), 132, 368, 72, c.blue);
    const terms = [
      ['Miss   y = 1', '−log(p)', p - 1],
      ['On time   y = 0', '−log(1 − p)', p],
    ];
    terms.forEach(([label, loss, g], i) => {
      const x = 140 + i * 860;
      line(x, 463, x + 720, 463, c.grid, 3);
      txt(label, x, 529, 40);
      mono(loss, x, 622, 43, c.muted);
      mono('g = ' + signed(g), x, 710, 48, i ? c.gold : c.red);
      if (b >= 2) mono('h = ' + num(p * (1 - p)), x, 791, 40, c.blue);
    });
    if (b === 3) txt('Starting probability from the fitting rows', 136, 926, 34, c.muted);
    return;
  }
  if (b <= 5) {
    v.heading(
      'Shared leaf   /   quadratic approximation',
      'One move changes the loss for every job in the leaf',
    );
    const reg = b === 5 ? 1 : 0,
      G = -1,
      H = 1,
      w = weight(G, H, reg);
    const X = (a) => 250 + (a + 1) * 322,
      Y = (a) => 714 - (G * a + 0.5 * (H + reg) * a * a) * 58;
    for (const a of [-1, 0, 1, 2, 3]) {
      line(X(a), 315, X(a), 820, c.grid, 2);
      mono(a, X(a), 871, 31, c.muted, 'center');
    }
    line(245, 714, 1546, 714, c.muted, 3);
    v.path(
      Array.from({ length: 81 }, (_, i) => {
        const a = i / 20 - 1;
        return [X(a), Y(a)];
      }),
      c.blue,
      6,
    );
    v.dot(X(w), Y(w), 15, c.gold);
    txt('Leaf move  w', 848, 933, 34, c.muted, 'center');
    mono('G = −1     H = 1     λ = ' + reg, 142, 295, 36);
    txt('Change in penalized loss', 1700, 291, 31, c.muted, 'right');
    if (b === 5 && cue(5, 'best move'))
      mono('w* = −G / (H + λ) = ' + num(w), 1040, 830, 36, c.gold, 'center');
    return;
  }
  if (b <= 8) {
    v.heading('Split proposal   /   λ = 1', 'Does a second leaf pay for itself?');
    const gamma = 0.25,
      S = saving(1, 1, 1);
    v.ticket(715, 317, 490, 115, 'Parent', 'G = 0     H = 2', c.muted);
    [-1, 1].forEach((g, i) => {
      const x = 465 + i * 980;
      stem(v, 960, 433, x, 606, c.blue);
      v.ticket(
        x - 250,
        600,
        500,
        110,
        i ? 'Right child' : 'Left child',
        'G = ' + signed(g) + '     H = 1',
        c.blue,
      );
      if (b >= 7) mono('½ × 1²/(1+1) = ' + num(S), x, 771, 33, c.blue, 'center');
      if (b === 8) mono('w = ' + signed(weight(g, 1, 1)), x, 830, 34, c.ink, 'center');
    });
    if (b >= 8)
      mono(
        'Net gain   ' + num(S) + ' + ' + num(S) + ' − ' + num(gamma) + ' = ' + num(2 * S - gamma),
        960,
        898,
        51,
        c.gold,
        'center',
      );
    return;
  }
  v.heading(
    'One-row leaves   /   both jobs missed',
    'The same curvature can produce very different steps',
  );
  const reg = cue(10, 'the weight falls') ? 1 : 0;
  ['p', 'g = p − 1', 'h = p(1 − p)', '−g / (h + λ)'].forEach((s, i) =>
    txt(s, 200 + 413 * i, 376, 34, c.muted),
  );
  [0.99, 0.01].forEach((p, i) => {
    const h = p * (1 - p),
      g = p - 1;
    [num(p), num(g), num(h, 4), num(weight(g, h, reg), 2)].forEach((s, j) =>
      mono(s, 200 + 413 * j, 512 + i * 151, 56, j === 3 ? c.gold : c.ink),
    );
    line(162, 577 + i * 151, 1758, 577 + i * 151, c.grid, 2);
  });
  mono('λ = ' + reg, 200, 864, 63, c.blue);
}

const grouped = splitConstruction();
const alternate = [1, 0, 1, 0];
const firstBin = 205;
const binSpacing = 379;
const cutX = (cut) => firstBin + binSpacing * cut - 43;
export function partition(gamma) {
  return splitConstruction(alternate, 1, gamma);
}
function bins(v, model, { cut, showGradient, showWeights, cursor = cut?.cut, leafY = 707 }) {
  const { c, txt, mono, line } = v;
  model.rows.forEach((r, i) => {
    const x = firstBin + binSpacing * i,
      col = r.label ? c.red : c.blue;
    v.ticket(x, 354, 298, 130, 'Job ' + (i + 1), r.label ? 'missed' : 'on time', col);
    if (showGradient) {
      mono('g   ' + signed(r.g), x + 15, 550, 37, col);
      mono('h   ' + num(r.h), x + 15, 611, 34, c.muted);
    }
  });
  if (cursor !== undefined) {
    const x = cutX(cursor);
    line(x, 302, x, cut ? 655 : 343, c.gold, 7);
    v.path(
      [
        [x - 12, 304],
        [x + 12, 304],
        [x, 328],
      ],
      c.gold,
      0,
      true,
    );
  }
  if (cut) {
    const pairs = [
      [cut.GL, cut.HL, cut.leftWeight],
      [cut.GR, cut.HR, cut.rightWeight],
    ];
    pairs.forEach(([g, h, w], i) => {
      const X = i ? 1025 : 157;
      txt(i ? 'Right leaf' : 'Left leaf', X, leafY, 32, c.muted);
      mono('G ' + signed(g) + '    H ' + num(h), X, leafY + 62, 38);
      if (showWeights) mono('w ' + signed(w, 4), X, leafY + 116, 33, c.blue);
    });
  }
}
export function histogram(v) {
  const { c, b, cue, end, txt, mono, line } = v;
  if (b >= 9) {
    v.heading('Histogram subtraction', 'Build one child and recover the other');
    const child = grouped.rows.map((r, i) => (i < 2 ? r.g : 0));
    ['Parent G', 'Left G', 'Right G'].forEach((s, i) => txt(s, 135, 410 + i * 146, 42));
    grouped.rows.forEach((r, i) => {
      const x = 626 + i * 298;
      txt('Bin ' + (i + 1), x, 308, 31, c.muted, 'center');
      [r.g, child[i], r.g - child[i]].forEach((val, j) => {
        if (j === 2 && b < 10) return;
        mono(signed(val), x, 410 + j * 146, 52, j === 2 ? c.gold : c.blue, 'center');
      });
    });
    line(120, 624, 1755, 624, c.grid, 3);
    txt(
      b === 10
        ? 'Subtract H the same way. Scan bin totals for each feature.'
        : 'Read rows once to build each feature’s histogram.',
      135,
      855,
      39,
      c.muted,
    );
    return;
  }
  v.heading('Four ordered bins   /   λ = 1   /   γ = 0', 'Slide the split between adjacent jobs');
  const lastCut = grouped.cuts.at(-1).cut;
  const returnToBest = cue(8, 'The center cut', 0.65);
  const cursor =
    b === 8
      ? mix(lastCut, grouped.best.cut, returnToBest)
      : cue(3, 'Slide the cut', 0.65) +
        cue(6, 'Move one more bin', 0.65) +
        cue(7, 'Try moving the cut', 0.65);
  const compare = cue(7, 'Which cut would you keep') && !returnToBest;
  const trial = !compare && Number.isInteger(cursor) ? grouped.cuts[cursor - 1] : undefined;
  if (b >= 3) {
    for (const cut of grouped.cuts) {
      const x = cutX(cut.cut);
      line(x, 350, x, 638, c.grid, 3, [8, 9]);
    }
  }
  bins(v, grouped, {
    cut: trial,
    cursor: cursor && !compare ? cursor : undefined,
    showGradient: b >= 2,
    showWeights: b === 5 || (trial?.cut === 2 && cue(7, 'Its leaf weights')),
    leafY: 655,
  });
  const shownGains = [
    end(4),
    cue(7, 'Its leaf weights'),
    cue(7, 'Which cut would you keep'),
  ];
  if (shownGains[0]) {
    line(157, 799, 1760, 799, c.grid, 2);
    txt('Split gain', 157, 869, 36, c.muted);
    grouped.cuts.forEach((cut, i) => {
      const x = cutX(cut.cut);
      const chosen = returnToBest === 1 && cut === grouped.best;
      const color = chosen ? c.gold : c.ink;
      txt('After bin ' + cut.cut, x, 828, 34, chosen ? color : c.muted, 'center');
      if (shownGains[i]) {
        mono('≈ ' + num(cut.gain, 4), x, 873, 44, color, 'center');
        if (chosen) line(x - 98, 904, x + 98, 904, color, 4);
      }
    });
  }
  if (b <= 2)
    mono(
      b === 1
        ? 'Each job starts at p = 0.5'
        : 'Parent   G = ' + grouped.G + '     H = ' + grouped.H,
      960,
      845,
      43,
      c.muted,
      'center',
    );
}
export function transfer(v) {
  const { c, b, cue, end, txt, mono, line } = v;
  const gamma = cue(4, 'Now both end cuts') ? 0.1 : 0.2;
  const model = partition(gamma);
  if (b <= 4) {
    v.heading('Four ordered bins   /   alternating outcomes', 'Will any cut earn the extra leaf?');
    model.rows.forEach((r, i) =>
      v.ticket(
        140 + i * 430,
        370,
        335,
        141,
        'Job ' + (i + 1),
        r.label ? 'missed' : 'on time',
        r.label ? c.red : c.blue,
      ),
    );
    model.cuts.forEach((cut, i) => {
      const x = 525 + i * 430;
      line(
        x,
        347,
        x,
        546,
        cue(4, 'Follow the right branch') && model.best?.cut === cut.cut ? c.blue : c.grid,
        6,
        [12, 8],
      );
      if (cue(3, 'Subtract a fifth')) {
        mono(num(cut.rawGain) + ' − ' + gamma, x, 592, 34, c.muted, 'center');
        mono(signed(cut.gain, 3), x, 662, 44, cut.gain > 0 ? c.green : c.red, 'center');
      } else mono('Cut ' + cut.cut, x, 611, 34, c.muted, 'center');
    });
    mono('Charge per extra leaf    γ = ' + num(gamma), 960, 781, 40, c.gold, 'center');
    if (b === 3 && cue(3, 'Keep the parent')) txt('Keep one leaf', 960, 881, 53, c.ink, 'center');
    if (b === 4 && cue(4, 'Follow the right branch'))
      txt('Tie → first boundary', 960, 881, 49, c.ink, 'center');
    return;
  }
  const best = model.best;
  if (b <= 6) {
    v.heading('First boundary   /   quarter step', 'Three jobs share the right-hand move');
    bins(v, model, { cut: best, showGradient: true, showWeights: true });
    if (b === 6 && end(6))
      mono(
        'New logits    ' +
          signed(best.leftWeight / 4, 3) +
          '   |   ' +
          signed(best.rightWeight / 4, 4),
        960,
        929,
        43,
        c.gold,
        'center',
      );
    return;
  }
  const probs = model.rows.map((_, i) =>
    sigmoid((i < best.cut ? best.leftWeight : best.rightWeight) / 4),
  );
  v.heading('Supplied alert cutoff   /   0.52', 'Which missed job reaches the operator?');
  const Y = (p) => 800 - (p - 0.47) * 7200;
  line(225, Y(0.52), 1690, Y(0.52), c.gold, 4, [14, 9]);
  mono('0.52', 200, Y(0.52), 32, c.gold, 'right');
  model.rows.forEach((r, i) => {
    const x = 395 + 370 * i,
      p = probs[i],
      y = Y(p);
    line(x, 802, x, y, c.grid, 4);
    v.dot(x, y, 17, r.label ? c.red : c.blue);
    mono(num(p, 3), x, y - 42, 32, c.ink, 'center');
    txt('Job ' + (i + 1), x, 850, 37, c.ink, 'center');
    txt(
      (r.label ? 'Missed' : 'On time') +
        (cue(8, 'Job three is a miss') ? (p >= 0.52 ? '  ·  alert' : '  ·  quiet') : ''),
      x,
      918,
      31,
      r.label ? c.red : c.blue,
      'center',
    );
  });
}

const frontier = [
  { id: 'A', depth: 2, gain: 0.4 },
  { id: 'B', depth: 3, gain: 0.9 },
];
export function nextLeaf(byGain) {
  return [...frontier].sort((a, b) => (byGain ? b.gain - a.gain : a.depth - b.depth))[0];
}
export function growth(v) {
  const { c, b, cue, txt, mono, line } = v;
  if (b <= 2 || b === 4) {
    v.heading('Eligible frontier', 'Which leaf expands next?');
    const gain = cue(1, 'highest-gain');
    const ruleKnown = cue(1, 'closest-to-root');
    const chosen = (gain ? cue(1, 'expands depth three') : cue(1, 'expands depth two'))
      ? nextLeaf(gain)
      : null;
    const root = [530, 316],
      one = [770, 440],
      two = [1010, 566],
      a = [412, 570],
      bb = [1225, 714];
    const edges = [
      [root, [300, 440]],
      [root, one],
      [one, a],
      [one, two],
      [two, [819, 714]],
      [two, bb],
    ];
    edges.forEach(([p, q]) => line(...p, ...q, c.grid, 6));
    [root, one, two, [300, 440], [819, 714]].forEach((p) => v.dot(...p, 16, c.muted));
    [
      [a, frontier[0]],
      [bb, frontier[1]],
    ].forEach(([[x, y], n]) => {
      const col = n === chosen ? c.gold : c.blue;
      v.dot(x, y, 24, col);
      txt('Leaf ' + n.id, x - 70, y + 72, 40, col, 'center');
      mono('depth ' + n.depth + '   gain ' + n.gain, x - 70, y + 125, 31, c.ink, 'center');
    });
    if (ruleKnown) txt(gain ? 'Highest gain' : 'Closest to root', 1245, 350, 42, c.gold);
    if (b === 4) txt('LightGBM limits leaves, depth, support and bins.', 127, 936, 39, c.muted);
    return;
  }
  if (b === 3) {
    v.heading('XGBoost   /   split search', 'Where do the candidate thresholds come from?');
    [
      ['Exact', 'Sorted values', 8],
      ['Approx', 'Hessian-weighted sketch per tree', 4],
      ['Hist', 'Global sample-weighted sketch', 3],
    ].forEach(([name, note, n], i) => {
      const y = 390 + 182 * i;
      txt(name, 138, y, 44);
      line(435, y, 970, y, c.muted, 4);
      for (let j = 0; j < n; j++)
        line(463 + (j * 465) / (n - 1), y - 32, 463 + (j * 465) / (n - 1), y + 32, c.blue, 5);
      txt(note, 1070, y, 37, c.ink);
    });
    return;
  }
  v.heading('Symmetric tree   /   depth 3', 'One predicate per level addresses eight leaves');
  [1, 0, 1].forEach((bit, i) => {
    const x = 202 + 355 * i;
    txt('Level ' + (i + 1), x + 85, 366, 32, c.muted, 'center');
    v.ticket(x, 422, 172, 110, cue(6, 'picks leaf five') ? String(bit) : '0 / 1', '', c.blue);
  });
  const sel = cue(6, 'CatBoost also offers');
  for (let j = 0; j < 8; j++) {
    const x = 145 + 203 * j,
      col = sel && j === 5 ? c.gold : c.grid;
    v.rect(x, 682, 166, 136, col);
    mono(j, x + 83, 752, 51, sel && j === 5 ? c.bg : c.ink, 'center');
  }
  if (sel) mono('101₂ = 5', 1400, 480, 64, c.gold, 'center');
  txt('Leaf index', 140, 865, 40, c.muted);
}
const gradients = [-1.5, 1, -0.1, 0.2, -0.3, 0.4];
const sampled = [true, true, true, false, true, false];
export const weightedDraw = gradients.map((g, i) => (sampled[i] ? g * (i < 2 ? 1 : 2) : 0));
export const orderedStats = [1, 0, 1].map(
  (_, i, labels) => (0.5 + labels.slice(0, i).reduce((a, x) => a + x, 0)) / (1 + i),
);
export function sampling(v) {
  const { c, b, cue, end, txt, mono, line } = v;
  if (b <= 2) {
    v.heading(
      'LightGBM   /   optional gradient sampling',
      'Keep large gradients and reweight a sample of the rest',
    );
    const drawn = cue(1, 'each retained small row');
    gradients.forEach((g, i) => {
      const x = 245 + 283 * i,
        val = drawn ? weightedDraw[i] : g,
        col = i < 2 ? c.gold : c.blue;
      line(x, 568, x, 568 - val * 122, col, 47);
      mono(num(val), x, 826, 41, col, 'center');
      txt(
        i < 2 ? 'Always kept' : drawn ? (sampled[i] ? 'Sample ×2' : 'Omitted') : '½ chance',
        x,
        889,
        30,
        c.muted,
        'center',
      );
    });
    line(103, 568, 1797, 568, c.muted, 3);
    txt('Signed gradient contribution', 123, 325, 37, c.muted);
    if (b === 2)
      mono(
        'This draw  ' +
          num(weightedDraw.reduce((a, x) => a + x, 0)) +
          '      Full sum  ' +
          num(gradients.reduce((a, x) => a + x, 0)),
        960,
        966,
        34,
        c.ink,
        'center',
      );
    return;
  }
  if (b <= 4) {
    v.heading('Exclusive feature bundling', 'Two sparse switches share a bin address');
    ['A', 'B', 'Bundle'].forEach((s, i) => txt(s, 510 + i * 448, 332, 42, c.muted, 'center'));
    [
      [0, 0, '0'],
      [1, 0, '1'],
      [0, 1, '2'],
      [1, 1, 'Conflict'],
    ]
      .slice(0, b === 4 ? 4 : 3)
      .forEach((r, i) => {
        const y = 464 + i * 125;
        line(309, y + 55, 1640, y + 55, c.grid, 2);
        r.forEach((s, j) => {
          if (j < 2) v.dot(510 + j * 448, y, 24, s ? c.blue : c.grid, !s);
          else mono(s, 510 + j * 448, y, 42, i === 3 ? c.red : c.ink, 'center');
        });
      });
    return;
  }
  if (b === 5 && !cue(5, "CatBoost's ordered")) {
    v.heading('LightGBM   /   categorical split', 'Order the groups by their split statistics');
    [
      ['C', '−1'],
      ['A', '0.25'],
      ['B', '1'],
    ].forEach(([name, val], i) =>
      v.ticket(200 + 540 * i, 450, 450, 200, 'Category ' + name, 'Σg / Σh   ' + val, c.blue),
    );
    txt('Try a partition between neighboring groups.', 198, 794, 43, c.ink);
    return;
  }
  v.heading(
    b <= 6 ? 'Ordered target statistic' : 'Ordered boosting',
    b <= 6 ? 'Each row sees the earlier labels' : 'Predict row three before uncovering its label',
  );
  const opened = cue(7, 'It missed');
  [1, 0, 1].forEach((y, i) => {
    const x = 180 + 552 * i;
    v.ticket(
      x,
      420,
      450,
      170,
      'Row ' + (i + 1),
      i === 2 && !opened ? 'label covered' : 'label  ' + y,
      i === 2 ? c.gold : c.blue,
    );
    if (b === 6) mono('stat   ' + num(orderedStats[i]), x + 18, 700, 39, c.blue);
    if (b >= 7 && i === 2) {
      mono('p = 0.5', x + 18, 701, 43, c.gold);
      if (opened) mono('y − p = +0.5', x + 18, 781, 39, c.red);
    }
  });
  if (b <= 6)
    txt('Prior 0.5, smoothing weight 1. Use the prefix of this category.', 170, 889, 34, c.muted);
  else bracket(v, 180, 1182, 733, 'Prefix used to fit the predictor', c.blue);
}
