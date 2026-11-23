import { weeklySample, weeklyQueue } from '../../../films/estimation/fixtures.mjs';
import {
  count,
  clusterBootstrapModel,
  biasVarianceState,
  wilson,
} from '../../../films/estimation/model.mjs';
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
  pc,
  lerpScale,
  mix,
  stamp,
} from './paint.mjs';
import { first, axis, limit, weighted } from './sampling.mjs';
import { calibration, curve, posterior } from './audit.mjs';

const sourceOrder = [...'FCABDGEIHJ'];
export const redraw = [...'BBGCEJFICD'];
export const swapped = [...redraw.slice(0, -1), 'B'];
const positive = (id) => id === 'A' || id === 'B';
export const clusterCount = (ids) => 10 * ids.filter(positive).length;
const cluster = clusterBootstrapModel();

function cord(g, x, y, id, spacing = 28, size = 10, oneLoose = false, pull = 0) {
  dot(g, x, y - 14, 8, C.gold);
  line(g, x, y - 14, x, y + 28 + size * spacing, C.gold, 2.5);
  box(g, x - 18, y + 3, 36, 35, C.paper, 5);
  txt(g, id, x, y + 20, 24, C.dark, 'center', 'Mono');
  for (let j = 0; j < size; j++) {
    const cx = x + pull * Math.max(0, j - 7) * 9,
      cy = y + 56 + j * spacing;
    const color = positive(id) || (oneLoose && j === size - 1) ? C.pink : C.blue;
    if (cx !== x) line(g, x, cy, cx, cy, C.gold, 2);
    dot(g, cx, cy, spacing * 0.43, C.deep);
    dot(g, cx, cy - 1, spacing * 0.37, color);
    dot(g, cx - spacing * 0.1, cy - spacing * 0.14, spacing * 0.082, C.ink);
  }
}
function rail(g, ids, x, y, dx, selected, offset = 0, loose = false, pull = 0) {
  box(g, x - 42, y - 41, 9 * dx + 84, 22, C.faint, 6);
  for (let j = 0; j < 10; j++) {
    const cx = x + j * dx;
    line(g, cx, y - 21, cx, y - 10, C.gold, 4);
    if (j < selected)
      cord(
        g,
        cx,
        y + (j === 9 ? offset : 0),
        ids[j],
        28,
        10,
        loose && j === 9,
        ids[j] === 'B' && j === 3 ? pull : 0,
      );
  }
}
export function campaigns(g, s) {
  const b = s.beat.beatIndex;
  if (b <= 3) {
    scene(g, 'Cluster bootstrap', 'What travels with one signup?');
    txt(g, 'Reviewed campaigns', 143, 287, 42, C.ink, 'left', 'Serif');
    const pull = cue(s, 0, 'Pull one signup', 0.6) + cue(s, 0, 'pull its neighbor', 0.6);
    rail(g, sourceOrder, 179, 396, 71, 10, 0, false, pull * 0.7);
    txt(g, '20 abusive signups / 100', 143, 810, 34, C.pink);
    if (b < 2) {
      txt(
        g,
        b === 0 ? 'One campaign enters as a group' : 'How many independent draws?',
        1037,
        382,
        46,
        C.ink,
        'left',
        'Serif',
      );
      if (b === 0 && pull > 0) {
        const dx = 1075;
        box(g, dx - 40, 478, 550, 12, C.faint, 3);
        for (let i = 0; i < Math.min(2, Math.ceil(pull)); i++) {
          line(g, dx + 125 + i * 194, 492, dx + 125 + i * 194, 625, C.gold, 3);
          dot(g, dx + 125 + i * 194, 626, 40, C.pink);
          txt(g, 'B', dx + 125 + i * 194, 626, 35, C.dark, 'center', 'Mono');
        }
        txt(g, pull > 1 ? 'Two signups from B' : 'One signup from B', 1040, 767, 36, C.pink);
      }
    } else {
      const n =
        Math.floor(2 * cue(s, 2, 'same campaign twice', 0.9)) +
        Math.floor(8 * cue(s, 2, 'Each copy brings', 2.2));
      txt(g, 'Draw whole campaigns', 1012, 287, 42, C.ink, 'left', 'Serif');
      rail(g, redraw, 1048, 396, 71, n);
      txt(g, n + ' campaign copies · ' + 10 * n + ' signups', 1012, 810, 34, C.gold);
      if (b === 3)
        txt(
          g,
          'Which spreads more: rows or whole campaigns?',
          960,
          941,
          39,
          C.gold,
          'center',
          'Serif',
        );
    }
    return;
  }
  if (b <= 5) {
    scene(g, 'Two resampling units', 'How wide is the redraw distribution?');
    const X = lerpScale(548, 1690, 0, 1);
    txt(g, 'Height relative to each distribution’s peak', 550, 241, 27, C.dim);
    for (const [i, [label, mass, range, color]] of [
      ['Individual signups', cluster.rowMass, cluster.rowRange, C.blue],
      ['Whole campaigns', cluster.campaignMass, cluster.campaignRange, C.pink],
    ].entries()) {
      const q = cue(s, 4, i ? 'Now draw whole campaigns' : 'Draw rows one', 1.7);
      const y = 435 + i * 318;
      txt(g, label, 145, y - 33, 36, color, 'left', 'Serif');
      if (!q) continue;
      const max = Math.max(...mass);
      mass.forEach((prob, j) => {
        const p = j / (mass.length - 1);
        if (p > q) return;
        const x = X(p),
          h = (140 * prob) / max;
        line(g, x, y, x, y - h, color, i === 0 ? 9 : 14);
      });
      const reported = cue(s, 4, i ? 'Each pink draw' : 'Now draw whole campaigns', 0);
      if (reported) {
        interval(g, X, y + 29, range, 0.2, color);
        txt(g, pc(range.low) + ' to ' + pc(range.high), 148, y + 38, 34, color);
      }
    }
    ruler(g, X, [0, 0.2, 0.4, 0.6, 0.8, 1], 835);
    txt(
      g,
      b === 5
        ? 'Variance ratio    (0.2 × 0.8 / 10) ÷ (0.2 × 0.8 / 100)' +
            (s.elapsed >= s.speechDuration ? ' = 10' : '')
        : '2.5th and 97.5th percentiles of resampled fractions',
      960,
      960,
      35,
      C.dim,
      'center',
    );
    return;
  }
  if (b === 6) {
    scene(g, 'Whole-campaign redraw', 'Can 21 of the 100 signups be abusive?');
    const flip = cue(s, 6, 'Swap one negative campaign', 1.6);
    const loose = cue(s, 6, 'changed one signup', 0.7) === 1 && !flip;
    const ids = flip >= 0.5 ? swapped : redraw;
    const shift = -Math.sin(Math.PI * flip) * 60;
    rail(g, ids, 207, 367, 100, 10, shift, loose);
    const positives = clusterCount(ids) + Number(loose);
    txt(g, 'Abusive / all signups', 1270, 392, 33, C.dim);
    const reported = loose
      ? cue(s, 6, 'Could a whole-campaign redraw', 0)
      : ids === redraw || cue(s, 6, 'With only ten independent', 0);
    txt(
      g,
      (reported ? positives : '?') + ' / 100',
      1265,
      499,
      82,
      loose ? C.pink : C.gold,
      'left',
      'Serif',
    );
    if (loose) txt(g, '1 pink bead on D', 1270, 608, 37, C.pink);
    if (flip === 1) txt(g, 'Whole cord: D → B', 1270, 608, 37, C.mint);
    return;
  }
  scene(g, 'Unequal campaign sizes', 'What belongs in the denominator?');
  const more = cue(s, 7, 'campaign of twenty', 1);
  cord(g, 433, 327, 'D', 25, 10);
  txt(g, '10 signups', 432, 690, 35, C.blue, 'center');
  if (more) {
    cord(g, 809, 327, 'B', 25, 20);
    txt(g, '20 signups', 810, 917, 35, C.pink, 'center');
    txt(g, 'Two campaign draws', 1195, 427, 39, C.dim);
    txt(
      g,
      s.elapsed >= s.speechDuration ? '10 + 20 = 30' : '10 + 20',
      1195,
      518,
      63,
      C.gold,
      'left',
      'Serif',
    );
    txt(g, 'signups in this redraw', 1195, 612, 36);
  }
}

export function bias(g, s) {
  const b = s.beat.beatIndex;
  if (b < 2) {
    scene(g, 'Routine-only sampling', 'Where does the scatter settle?');
    const q = cue(s, 0, 'ten thousand independent draws', 3);
    const n = Math.round(100 * Math.pow(100, q)),
      model = biasVarianceState(n);
    const X = lerpScale(173, 1730, 0.04, 0.24),
      x = X(0.12);
    txt(g, 'Routine lane   n = ' + n.toLocaleString('en-US'), 155, 292, 36, C.blue, 'left', 'Mono');
    const bandY = 574;
    const r = model.standardError;
    line(g, X(0.12 - r), bandY, X(0.12 + r), bandY, C.blue, 20);
    dot(g, x, bandY, 13, C.gold);
    txt(g, '±1 standard error', x, 632, 31, C.blue, 'center');
    txt(g, 'Expected 12%', x, 501, 38, C.blue, 'center', 'Serif');
    line(g, X(weighted), 403, X(weighted), 741, C.pink, 4);
    txt(g, 'Queue 17.6%', X(weighted), 360, 36, C.pink, 'center');
    ruler(g, X, [0.04, 0.08, 0.12, 0.16, 0.2, 0.24], 744);
    const gap = cue(s, 0, 'Follow the gap', 1.1);
    if (gap) bracket(g, x, mix(x, X(weighted), gap), 430, -15, C.gold);
    if (b === 1 && cue(s, 1, 'That persistent gap', 0))
      txt(g, 'Bias = −5.6 points', mix(x, X(weighted), 0.5), 872, 41, C.gold, 'center', 'Serif');
    if (cue(s, 1, 'Mean squared error'))
      txt(g, 'MSE = bias² + variance', 960, 953, 34, C.dim, 'center', 'Mono');
    return;
  }
  if (b < 4) {
    scene(g, 'Five labels · Beta(2, 2) prior', 'Where are the peak and the mean?');
    const X = lerpScale(154, 1197, 0, 1),
      y = 757;
    const k = count(first.slice(0, 5)),
      p = posterior(k, 5);
    const shown = cue(s, 2, 'Beta three-six posterior', 1.1);
    txt(g, 'Relative density', 155, 303, 31, C.dim);
    curve(g, X, y, 300, 1, 1, C.faint);
    if (shown) curve(g, X, y, 300, p.a - 1, p.b - 1, C.mint, shown);
    const mode = cue(s, 2, 'peak of the green curve', 0.7),
      mean = cue(s, 2, 'mean lies', 0.7);
    if (mode) {
      line(g, X(p.map), y - 300, X(p.map), y, C.mint, 3);
      dot(g, X(p.map), y - 300, 10, C.mint);
    }
    if (mean) line(g, X(p.mean), y - 321, X(p.mean), y, C.gold, 3);
    ruler(g, X, [0, 0.25, 0.5, 0.75, 1], y);
    txt(g, 'Candidate rate', 675, 870, 30, C.dim, 'center');
    txt(g, 'Prior  Beta(2, 2)', 1293, 334, 33, C.dim);
    if (shown) txt(g, 'Posterior  Beta(3, 6)', 1293, 431, 37, C.mint);
    if (cue(s, 2, 'Its mean lies', 0))
      txt(g, 'Mode   2/7 = ' + pc(p.map, 1), 1293, 553, 35, C.mint, 'left', 'Mono');
    if (cue(s, 2, 'For this prior', 0))
      txt(g, 'Mean   3/9 = ' + pc(p.mean, 1), 1293, 643, 35, C.gold, 'left', 'Mono');
    if (cue(s, 2, 'adds two to the positive count'))
      txt(g, '(k + 2) / (n + 4)', 1293, 710, 30, C.gold, 'left', 'Mono');
    if (cue(s, 3, 'score test')) txt(g, 'Wilson midpoint from score test', 1293, 830, 30, C.dim);
    return;
  }
  if (b === 4) {
    scene(g, 'Held-out calibration', 'What can one bucket establish?');
    calibration(g, true, cue(s, 4, 'interval around its observed rate', 1), true);
    return;
  }
  scene(g, 'Evidence for a new audit', 'Which check addresses the uncertainty?');
  const parts = [
    ['Random sample', 'More representative labels', 'sampling variation', C.blue],
    ['Ambiguous case', 'Independent review', 'ambiguous case', C.pink],
    ['Unfamiliar traffic', 'Sample the new traffic', 'new type of traffic', C.gold],
  ];
  for (const [i, [label, repair, phrase, color]] of parts.entries()) {
    if (!cue(s, 5, phrase, 0.7)) continue;
    const x = 153 + i * 567;
    txt(g, label, x, 360, 42, color, 'left', 'Serif');
    if (i === 0)
      for (let j = 0; j < 12; j++)
        envelope(g, x + (j % 4) * 101, 460 + Math.floor(j / 4) * 65, 82, 46, j % 5 === 0);
    if (i === 1) {
      envelope(g, x + 12, 496, 134, 95, false);
      envelope(g, x + 202, 496, 134, 95, true);
    }
    if (i === 2) for (let j = 0; j < 3; j++) envelope(g, x + 103 * j, 500, 86, 68, null);
    txt(g, repair, x, 773, 32, C.ink);
  }
}

const counts = [first, weeklySample].map((rows) => ({ k: count(rows), n: rows.length }));
export const intervals = counts.map(({ k, n }) => wilson(k, n));
export const chooseShift = (upper) => (upper < limit ? 'Regular shift' : 'Extra shift');
function endpointLens(g, upper, showCap) {
  const x = 1059,
    y = 713,
    w = 704,
    h = 194;
  const low = limit - 0.0025,
    high = limit + 0.0025;
  const X = lerpScale(x + 66, x + w - 65, low, high);
  if (showCap)
    path(
      g,
      [
        [axis(upper), 591],
        [axis(upper), 646],
        [X(upper), y],
      ],
      C.faint,
      2,
    );
  box(g, x, y, w, h, C.dark, 12, C.faint);
  txt(g, 'Upper end · enlarged', x + 34, y + 34, 28, C.dim);
  const rail = y + 108;
  line(g, X(low), rail, X(high), rail, C.faint, 2);
  if (showCap) {
    line(g, X(low), rail, X(upper), rail, C.mint, 8);
    line(g, X(upper), rail - 18, X(upper), rail + 18, C.mint, 5);
    txt(g, pc(upper, 2), X(upper), rail + 47, 31, C.mint, 'center', 'Mono');
  }
  line(g, X(limit), rail - 35, X(limit), rail + 29, C.pink, 5);
  txt(g, pc(limit, 2), X(limit) + 12, rail - 42, 29, C.pink, 'left', 'Mono');
}
export function decision(g, s) {
  const b = s.beat.beatIndex,
    upper = intervals[1].high;
  if (b === 5) {
    scene(g, 'Observed workload · toy week', 'How much room did the shift have?');
    const filled = cue(s, 5, 'Fill the regular team', 2.2);
    const n = Math.round(weeklyQueue.specialist * filled);
    const x = 170,
      w = 1540,
      y = 533;
    txt(g, 'Regular team capacity', x, 341, 36, C.dim);
    txt(
      g,
      weeklyQueue.capacity.toLocaleString('en-US') + ' places',
      x,
      416,
      59,
      C.ink,
      'left',
      'Serif',
    );
    for (let i = 0; i < 20; i++) {
      const left = x + (i * w) / 20,
        slot = w / 20 - 8;
      box(g, left, y, slot, 97, C.teal, 6, C.faint);
      const fraction = Math.min(1, Math.max(0, n / 1000 - i));
      if (fraction) box(g, left, y, slot * fraction, 97, C.gold, 6);
    }
    txt(g, n.toLocaleString('en-US') + ' cases placed', x, y + 168, 46, C.gold, 'left', 'Serif');
    if (cue(s, 5, 'places stayed open')) {
      const x1 = x + (w * weeklyQueue.specialist) / weeklyQueue.capacity;
      bracket(g, x1, x + w - 8, y + 163, 22, C.mint);
      txt(
        g,
        (weeklyQueue.capacity - weeklyQueue.specialist).toLocaleString('en-US') + ' places open',
        x + w,
        y + 240,
        40,
        C.mint,
        'right',
      );
    }
    if (cue(s, 5, 'draw whole weeks'))
      txt(g, 'Next · simulate the load across many weeks', x, 932, 36, C.dim);
    return;
  }
  scene(g, 'Planned audit · one staffing decision', 'Does the upper end clear the staffing limit?');
  const showEstimate = cue(s, 1, 'The dot is still at sixteen percent', 0);
  const showLens = cue(s, 1, 'Look at the magnified scale', 0);
  const endpointWords = 'nineteen point nine one percent';
  const showCap =
    b > 3 ||
    (b === 3 &&
      cue(s, 3, endpointWords, 0, { captionStart: endpointWords }) &&
      s.elapsed >= s.wordCue(endpointWords).end);
  line(g, axis(limit), 280, axis(limit), 648, C.pink, 4);
  txt(g, 'Regular limit ' + pc(limit), axis(limit), 249, 34, C.pink, 'center');
  for (const [i, { k, n }] of counts.entries()) {
    const y = i ? 559 : 379;
    if (i && !showEstimate) continue;
    txt(g, k + ' / ' + n, 164, y - 32, 43, i ? C.ink : C.dim, 'left', 'Serif');
    if (!i || showCap) interval(g, axis, y, intervals[i], k / n, i ? C.mint : C.faint);
    else dot(g, axis(k / n), y, 10, C.gold);
    if (!i)
      txt(
        g,
        pc(intervals[i].low, 1) + ' to ' + pc(intervals[i].high, 1),
        axis(intervals[i].high) + 24,
        y,
        30,
        C.dim,
      );
  }
  if (showEstimate) {
    const estimate = counts[1].k / counts[1].n;
    line(g, axis(estimate), 404, axis(estimate), 535, C.gold, 2);
    txt(g, pc(estimate), axis(estimate) - 18, 474, 31, C.gold, 'right', 'Mono');
  }
  ruler(g, axis, [0, 0.1, 0.2, 0.3, 0.4], 651);
  if (b === 0) {
    const done = 1 + Math.floor(3 * cue(s, 0, 'Review the remaining', 2.3));
    txt(g, 'Randomly selected IDs', 155, 785, 31, C.dim);
    for (let i = 0; i < 4; i++) {
      envelope(g, 155 + i * 138, 830, 118, 67, null);
      if (i < done) {
        box(g, 155 + i * 138, 830, 118, 67, C.blue, 5);
        txt(g, '100', 214 + i * 138, 865, 30, C.dark, 'center', 'Mono');
      }
    }
    txt(g, done * 100 + ' reviewed / 400 planned', 812, 865, 39, C.ink);
    return;
  }
  if (showLens) endpointLens(g, upper, showCap);
  if (b >= 2 && !showCap)
    txt(g, 'Where must the cap land?', 154, 813, 52, C.gold, 'left', 'Serif');
  if (cue(s, 3, 'Save the count', 0)) {
    stamp(g, chooseShift(upper), 153, 742, 430, C.mint);
    const { k, n } = counts[1];
    txt(
      g,
      k + ' / ' + n + ' · 95% Wilson ' + pc(intervals[1].low, 2) + ' to ' + pc(upper, 2),
      153,
      864,
      32,
      C.ink,
    );
    if (cue(s, 4, 'reviewed them independently', 0))
      txt(g, 'Simple random IDs · independent reviews', 153, 913, 28, C.dim);
  }
}
