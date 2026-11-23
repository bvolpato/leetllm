import { seededRandom } from 'vizmatic';
import {
  weeklySample,
  weeklyQueue,
  batches100,
  batches400,
  coverageIntervals,
  sliceModel,
} from '../../../films/estimation/fixtures.mjs';
import { count, wilson, scoreStatistic } from '../../../films/estimation/model.mjs';
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
} from './paint.mjs';

export const first = weeklySample.slice(0, 100);
export const limit = weeklyQueue.capacity / weeklyQueue.size;
export const se = (p, n) => Math.sqrt((p * (1 - p)) / n);
export const axis = lerpScale(160, 1760, 0, 0.4);
export function opening(g, s) {
  const b = s.beat.beatIndex;
  scene(g, 'Weekly message audit', 'Would you book the extra shift?');
  const flip = cue(s, 0, 'Turn over', 1.5);
  const rest = cue(s, 1, 'Open the rest', 4);
  const n = Math.floor(5 * flip) + Math.floor(95 * rest);
  const k = count(first.slice(0, n));
  txt(g, 'First five messages', 150, 276, 38);
  line(g, 139, 413, 1163, 413, C.faint, 6);
  first.slice(0, 5).forEach((r, i) => {
    const x = 155 + i * 202;
    envelope(g, x, 314, 179, 89, i < n ? r.specialist : null, i < n ? r.id : '');
    if (i < n)
      txt(
        g,
        r.specialist ? 'Specialist' : 'Routine',
        x + 90,
        447,
        26,
        r.specialist ? C.pink : C.blue,
        'center',
      );
  });
  txt(g, 'Specialist / reviewed', 1310, 283, 32, C.dim);
  txt(g, n ? k + ' / ' + n : '? / 5', 1310, 391, 95, C.ink, 'left', 'Serif');
  if (b === 0 && cue(s, 0, 'pencil in'))
    txt(g, 'Regular or extra?', 1310, 533, 43, C.gold, 'left', 'Serif');
  if (b >= 1) {
    txt(g, 'Next 95 messages', 150, 519, 31, C.dim);
    matrix(
      g,
      first.slice(5).map((r, i) => (i + 5 < n ? r.specialist : null)),
      153,
      559,
      19,
      49,
      33,
      40,
      24,
    );
  }
  if (b >= 2) {
    const plan = cue(s, 2, 'four hundred distinct IDs', 0.9);
    if (plan) {
      txt(g, 'Planned random draw', 1300, 528, 31, C.dim);
      for (let i = 0; i < 4; i++) {
        box(g, 1300 + i * 110, 575, 94, 66, i === 0 ? C.blue : C.teal, 7, C.faint);
        txt(g, '100', 1347 + i * 110, 607, 28, i === 0 ? C.dark : C.dim, 'center', 'Mono');
      }
      txt(g, '400 of 100,000', 1300, 685, 31);
    }
  }
  const railY = 811;
  ruler(g, axis, [0, 0.1, 0.2, 0.3, 0.4], railY);
  line(g, axis(limit), 773, axis(limit), railY, C.pink, 5);
  txt(g, 'Regular capacity', axis(limit), 747, 30, C.pink, 'center');
  if (n === first.length && cue(s, 1, 'Draw the interval', 0)) {
    const range = wilson(k, n);
    interval(g, axis, railY, range, k / n, C.mint);
    txt(g, '95% Wilson', axis(range.high) + 24, railY - 27, 27, C.mint);
  }
  if (n >= 5 && cue(s, 0, 'Put that share')) {
    const x = axis(k / n);
    dot(g, x, railY, 14, C.gold);
    txt(g, pc(k / n), x + 27, railY - 20, 36, C.gold, 'left', 'Mono');
  }
  if (b === 3 && cue(s, 3, 'keep the regular shift'))
    txt(g, 'Upper end below 20% → regular', 1300, 751, 29, C.mint);
}

export const smallRates = batches100.map((rows) => count(rows) / rows.length);
export const largeRates = batches400.map((rows) => count(rows) / rows.length);

function sampleCloud(g, X, rates, n, y, color, picked) {
  const levels = new Map();
  rates.slice(0, n).forEach((p, i) => {
    const stack = levels.get(p) || 0;
    dot(g, X(p), y - stack * 20, 9, i === picked ? C.gold : color);
    levels.set(p, stack + 1);
  });
}
export function sampling(g, s) {
  const b = s.beat.beatIndex;
  scene(g, 'Repeated random audits', 'How far can a fresh sample move?');
  const a = Math.floor(cue(s, 0, 'Its fraction', 0.45) + 39 * cue(s, 0, 'Repeat with fresh', 4.4));
  const d = Math.floor(40 * cue(s, 2, 'second cloud', 4.4));
  const far = smallRates.reduce(
    (j, p, i) => (Math.abs(p - 0.16) > Math.abs(smallRates[j] - 0.16) ? i : j),
    0,
  );
  const index = b === 1 ? far : Math.max(0, (b === 2 ? d : a) - 1);
  const rows = (b === 2 ? batches400 : batches100)[index];
  const columns = b === 2 ? 20 : 10,
    spacing = b === 2 ? 25 : 49;
  const visible =
    b === 0 && a === 0
      ? Math.floor(rows.length * cue(s, 0, 'Count one random batch', 1.4))
      : rows.length;
  txt(g, 'One batch', 155, 276, 38);
  rows.forEach((r, i) => {
    const x = 156 + (i % columns) * spacing,
      y = 351 + Math.floor(i / columns) * spacing;
    box(
      g,
      x,
      y,
      spacing * 0.77,
      spacing * 0.63,
      i < visible ? (r.specialist ? C.pink : C.blue) : C.teal,
      3,
    );
  });
  const result = count(rows.slice(0, visible));
  txt(
    g,
    visible ? result + ' / ' + visible + ' specialist' : rows.length + ' labels to count',
    153,
    321,
    30,
    C.gold,
    'left',
    'Mono',
  );
  const X = lerpScale(795, 1745, 0.04, 0.28);
  line(g, X(0.16), 310, X(0.16), 811, C.gold, 3);
  txt(g, 'Fixed rate 16%', X(0.16), 267, 32, C.gold, 'center');
  txt(g, '100 per batch', 795, 386, 31, C.dim);
  sampleCloud(g, X, smallRates, a, 543, C.blue, b === 2 ? -1 : index);
  const flight = cue(s, 0, 'Its fraction', 0.45);
  if (flight > 0 && flight < 1) {
    const x = mix(615, X(smallRates[0]), flight),
      y = mix(700, 543, flight) - 80 * Math.sin(Math.PI * flight);
    dot(g, x, y, 10, C.gold);
  }
  if (b === 2) {
    txt(g, '400 per batch', 795, 626, 31, C.dim);
    sampleCloud(g, X, largeRates, d, 778, C.mint, d - 1);
  }
  ruler(g, X, [0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28], 811);
  txt(g, 'Share in one completed batch', 1265, 218, 33, C.dim, 'center');
}

export function score(g, s) {
  const b = s.beat.beatIndex,
    k = count(first),
    n = first.length,
    ph = k / n;
  const X = lerpScale(184, 1244, 0.04, 0.36),
    Y = lerpScale(765, 302, 0, 4.5);
  scene(
    g,
    'Two-sided 95% interval',
    b === 0 ? 'How wide is a quick interval?' : 'Which candidate rates fit this count?',
  );
  if (b === 0) {
    summary(g, 'Observed share', k + ' / ' + n, 160, 330);
    const scale = se(ph, n);
    if (cue(s, 0, 'Multiply the sample share')) txt(g, 'SE = √(0.16 × 0.84 / 100)', 160, 535, 40);
    if (cue(s, 0, 'The quick Wald interval', 0)) txt(g, '≈ ' + pc(scale, 2), 160, 628, 54, C.blue);
    const WX = lerpScale(850, 1740, 0, 0.32);
    ruler(g, WX, [0, 0.08, 0.16, 0.24, 0.32], 705);
    dot(g, WX(ph), 556, 15, C.gold);
    const w = { low: ph - 1.96 * scale, high: ph + 1.96 * scale };
    interval(g, WX, 556, w, ph, C.blue, cue(s, 0, 'extends one point nine six', 1.7));
    txt(g, 'Wald interval', 1295, 398, 43, C.ink, 'center', 'Serif');
    if (cue(s, 0, 'Its width comes', 0))
      txt(g, pc(w.low, 1) + ' to ' + pc(w.high, 1), 1295, 624, 35, C.blue, 'center', 'Mono');
    return;
  }
  const v = wilson(k, n);
  const threshold = cue(s, 2, 'one point nine six', 0.8);
  const accept = cue(s, 3, 'Project the two crossings', 1.2);
  if (threshold) {
    box(g, X(0.04), Y(1.96), X(0.36) - X(0.04), Y(0) - Y(1.96), '#243e42');
    line(g, X(0.04), Y(1.96), X(0.36), Y(1.96), C.mint, 3);
    txt(g, '1.96', X(0.04) - 15, Y(1.96), 28, C.mint, 'right', 'Mono');
  }
  const curve = [];
  for (let i = 0; i <= 320; i++) {
    const p = 0.04 + i * 0.001,
      score = scoreStatistic(k, n, p);
    if (score <= 4.5) curve.push([X(p), Y(score)]);
  }
  path(g, curve, C.blue, 5);
  txt(g, 'Distance in candidate standard deviations', 185, 254, 32, C.dim);
  ruler(g, X, [0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36], Y(0));
  const p = mix(0.16, 0.2, cue(s, 1, 'Slide a candidate', 2.3));
  const z = scoreStatistic(k, n, p);
  line(g, X(p), Y(0), X(p), Y(z), C.gold);
  dot(g, X(p), Y(z), 12, C.gold);
  txt(g, 'Candidate rate', 1353, 332, 31, C.dim);
  txt(g, pc(p, 1), 1352, 410, 66, C.gold, 'left', 'Serif');
  if (cue(s, 1, 'expect twenty cases')) {
    txt(g, 'Expected   ' + Math.round(n * p), 1354, 518, 33, C.dim, 'left', 'Mono');
    txt(g, 'Observed   ' + k, 1354, 580, 33, C.ink, 'left', 'Mono');
  }
  if (b > 1 || s.elapsed >= s.speechDuration) txt(g, '|16 − 20| / 4 = 1', 1353, 687, 35, C.blue);
  if (accept) {
    for (const end of [v.low, v.high]) {
      const bottom = mix(Y(1.96), 895, accept);
      line(g, X(end), Y(1.96), X(end), Math.min(bottom, Y(0) - 15), C.mint, 2);
      if (bottom > Y(0) + 67) line(g, X(end), Y(0) + 67, X(end), bottom, C.mint, 2);
    }
    interval(g, X, 895, v, ph, C.mint, accept);
    if (accept === 1 && cue(s, 3, 'That is the Wilson interval', 0))
      txt(g, pc(v.low, 1) + ' to ' + pc(v.high, 1), X(ph) + 20, 957, 37, C.mint, 'center', 'Mono');
  }
}

export function accumulating(g, s) {
  scene(g, 'Controlled trays', 'What if every tray has the same mix?');
  const t =
    1 +
    Math.floor(cue(s, 1, 'Slide in the second tray', 1)) +
    Math.floor(14 * cue(s, 1, 'Bring in the remaining trays', 4.4));
  const n = t * 25,
    k = t * 4,
    p = k / n;
  const X = lerpScale(937, 1776, 0, 0.4);
  txt(g, '4 specialist cases per tray of 25', 127, 268, 34, C.dim);
  for (let j = 0; j < 16; j++) {
    const x = 130 + (j % 4) * 175,
      y = 333 + Math.floor(j / 4) * 132;
    box(g, x, y, 151, 111, j < t ? C.dark : '#192a34', 7, j < t ? C.faint : C.teal);
    if (j < t)
      for (let i = 0; i < 25; i++)
        dot(
          g,
          x + 24 + (i % 5) * 25,
          y + 19 + Math.floor(i / 5) * 18,
          6,
          [2, 9, 14, 22].includes(i) ? C.pink : C.blue,
        );
  }
  txt(g, k + ' / ' + n + ' = ' + pc(p), 130, 309, 40, C.gold, 'left', 'Serif');
  txt(g, 'First tray', 942, 364, 31, C.dim);
  const base = wilson(4, 25),
    current = wilson(k, n);
  interval(g, X, 455, base, p, C.faint);
  line(g, X(p), 475, X(p), 664, C.gold, 2);
  txt(g, t + ' ' + (t === 1 ? 'tray' : 'trays'), 942, 589, 31, C.dim);
  interval(g, X, 684, current, p);
  ruler(g, X, [0, 0.1, 0.2, 0.3, 0.4], 810);
  if (cue(s, 2, 'halfway between the caps')) {
    for (const [v, y] of [
      [base, 455],
      [current, 684],
    ])
      path(
        g,
        [
          [X(v.center) - 9, y - 34],
          [X(v.center) + 9, y - 34],
          [X(v.center), y - 18],
        ],
        C.ink,
        1,
        true,
      );
    txt(g, 'Triangles mark the Wilson midpoints', 942, 268, 30, C.ink);
  }
}

export function boundary(g, s) {
  const b = s.beat.beatIndex;
  if (b >= 6) {
    scene(g, 'Repeated coverage', 'Which intervals miss the fixed rate?');
    const X = lerpScale(414, 1655, 0, 0.35),
      truth = 0.16;
    const drawn = Math.floor(24 * cue(s, 6, 'Draw twenty-four', 5));
    line(g, X(truth), 273, X(truth), 830, C.gold, 4);
    txt(g, 'Fixed 16%', X(truth), 235, 31, C.gold, 'center');
    let misses = 0;
    coverageIntervals.slice(0, drawn).forEach((r, i) => {
      const y = 291 + i * 22;
      const color = r.covers ? C.blue : C.pink;
      if (!r.covers) misses++;
      line(g, X(r.interval.low), y, X(r.interval.high), y, color, 5);
      dot(g, X(r.k / r.n), y, 5, C.ink);
    });
    ruler(g, X, [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35], 851);
    txt(g, drawn + ' fresh audits of 100', 145, 964, 36, C.dim);
    if (cue(s, 7, 'in this run'))
      txt(g, misses + ' intervals miss', 1700, 964, 40, C.pink, 'right');
    return;
  }
  scene(
    g,
    'Boundary cases',
    b === 5
      ? 'What if every case needs a specialist?'
      : 'How much risk can hide in an empty count?',
  );
  const extra = Math.floor(10 * cue(s, 3, 'Open ten more', 1.5));
  const n = b === 5 ? 10 : 10 + extra;
  const visible = b === 0 ? Math.floor(10 * cue(s, 0, 'Open ten messages', 1.4)) : n;
  const allPositive = b === 5 && cue(s, 5, 'all ten messages need a specialist') > 0;
  const k = allPositive ? n : 0,
    v = wilson(k, n);
  matrix(
    g,
    Array.from({ length: n }, (_, i) => (i < visible ? allPositive : null)),
    157,
    316,
    10,
    101,
    76,
    82,
    56,
  );
  txt(g, k + ' specialist / ' + visible + ' reviewed', 155, 550, 41, C.ink);
  const X = lerpScale(170, 1747, 0, 1);
  ruler(g, X, [0, 0.25, 0.5, 0.75, 1], 850);
  if (cue(s, 1, 'collapses there') && !allPositive) {
    dot(g, X(0), 704, 10, C.blue);
    txt(g, 'Wald', X(0) + 25, 703, 28, C.blue);
  }
  const showTen = b > 2 || (b === 2 && s.elapsed >= s.speechDuration);
  const showTwenty = cue(s, 4, 'A population rate', 0);
  if (showTen && (!allPositive || cue(s, 5, 'Flip the interval', 0))) {
    if (b === 3 || (b === 4 && !showTwenty)) {
      interval(g, X, 775, wilson(0, 10), 0, C.faint);
      txt(g, 'First 10', X(0.278) + 22, 775, 28, C.dim);
    } else {
      interval(g, X, 775, v, k / n, allPositive ? C.pink : C.mint);
      if (!allPositive || s.elapsed >= s.speechDuration)
        txt(
          g,
          pc(allPositive ? v.low : v.high, 1),
          X(allPositive ? v.low : v.high),
          723,
          32,
          allPositive ? C.pink : C.mint,
          'center',
          'Mono',
        );
    }
  }
  if (cue(s, 1, 'upper end')) {
    txt(
      g,
      allPositive ? 'Reflected interval' : 'Upper end at zero positives',
      1267,
      330,
      33,
      C.dim,
    );
    txt(
      g,
      allPositive ? '1 − U  to  1' : '1.96² / (n + 1.96²)',
      1267,
      410,
      44,
      C.ink,
      'left',
      'Serif',
    );
    if (cue(s, 2, 'Put ten in the denominator', 0) && !allPositive) {
      const operand = b === 3 || (b === 4 && !cue(s, 4, 'Put twenty', 0)) ? '?' : n;
      const expr = '1.96² / (' + operand + ' + 1.96²)';
      txt(g, expr, 1267, 509, 35, C.gold);
    }
  }
}

export const weighted = sliceModel.reduce((sum, r) => sum + r.share * r.rate, 0);
const laneX = [150, 709, 1268];
const laneColors = [C.blue, C.gold, C.pink];
const sizes = sliceModel.map((lane) => Math.round(1000 * lane.share));
const ends = sizes.map((_, i) => sizes.slice(0, i + 1).reduce((a, b) => a + b, 0));

function drawIds(rng, start, size, n) {
  const ids = new Set();
  while (ids.size < n) ids.add(start + Math.floor(rng() * size));
  return [...ids].map((id) => {
    const lane = ends.findIndex((end) => id < end);
    const local = id - (ends[lane] - sizes[lane]);
    return {
      id,
      lane,
      slot: Math.floor(local / 10),
      tag: ['R', 'B', 'A'][lane] + String(local + 1).padStart(3, '0'),
    };
  });
}
const random = seededRandom(89);
export const queueDraw = drawIds(random, 0, ends.at(-1), 10);
export const laneDraws = sizes.map((size, i) => drawIds(random, ends[i] - size, size, 3));

function idTicket(g, item, x, y, w) {
  box(g, x, y, w, 62, laneColors[item.lane], 5);
  txt(g, item.tag, x + w / 2, y + 31, 31, C.dark, 'center', 'Mono');
}

export function design(g, s) {
  const b = s.beat.beatIndex;
  const pooled = cue(s, 4, 'Sample across the target queue', 0);
  const separate = cue(s, 4, 'Or draw a random sample', 0);
  const weighting = cue(s, 4, 'Weight each lane', 0);
  const sampleN =
    cue(s, 0, 'Select only routine questions', 0) * 100 +
    Math.floor(3 * cue(s, 0, 'More routine labels', 2.6)) * 100;
  const take = cue(s, 4, 'Sample across the target queue', 3.5);
  const perLane = Math.floor(3 * cue(s, 4, 'Or draw a random sample', 2.4));
  const draws = separate
    ? laneDraws.flatMap((ids) => ids.slice(0, perLane))
    : queueDraw.slice(0, Math.floor(take * queueDraw.length));

  scene(g, 'Three-lane queue', 'Who can enter the sample?');
  txt(
    g,
    pooled
      ? 'Each slot holds ten messages. A dot marks a slot used in this draw.'
      : 'One slot represents ten messages',
    151,
    228,
    27,
    C.dim,
  );
  let total = 0;
  sliceModel.forEach((r, i) => {
    const x = laneX[i],
      size = sizes[i],
      color = laneColors[i];
    txt(g, r.name, x, 305, 43, C.ink, 'left', 'Serif');
    txt(g, size + ' messages', x, 361, 31, C.dim);
    for (let j = 0; j < size / 10; j++) {
      const sx = x + (j % 10) * 41,
        sy = 418 + Math.floor(j / 10) * 29;
      const selected = !pooled && i === 0 && j < sampleN / 10;
      box(g, sx, sy, 33, 20, selected ? '#739bc0' : C.teal, 3, selected ? undefined : C.faint);
      path(
        g,
        [
          [sx + 2, sy + 2],
          [sx + 16, sy + 12],
          [sx + 31, sy + 2],
        ],
        selected ? C.dark : C.faint,
        1.5,
      );
      if (draws.some((d) => d.lane === i && d.slot === j)) dot(g, sx + 16, sy + 10, 8, color);
    }
    const eligible = i === 0 || pooled;
    line(g, x, 650, x + 399, 650, eligible ? color : C.faint, 7);
    if (b < 2 || b === 4) {
      const label = eligible ? 'Eligible' : 'Excluded';
      txt(
        g,
        b === 4 && !pooled && i === 0 ? 'Earlier sample: 400 routine' : label,
        x,
        692,
        30,
        eligible ? color : C.dim,
      );
    }
    const known = cue(
      s,
      2,
      ['Twelve percent', 'At twenty-five percent', 'At forty-two percent'][i],
      0,
    );
    if (known && b < 4) {
      const finished =
        i === 2
          ? b > 2 || s.elapsed >= s.speechDuration
          : cue(s, 2, ['At twenty-five percent', 'At forty-two percent'][i], 0);
      txt(
        g,
        pc(r.rate) + ' × ' + size + (finished ? ' = ' + r.expected : ''),
        x,
        711,
        36,
        color,
        'left',
        'Mono',
      );
      if (finished) total += r.expected;
    }
  });
  if (b < 2) {
    const X = lerpScale(701, 1600, 0, 0.28);
    ruler(g, X, [0, 0.07, 0.14, 0.21, 0.28], 810);
    if (sampleN) {
      const k = Math.round(sampleN * sliceModel[0].rate);
      txt(g, sampleN + ' routine labels', 150, 791, 36, C.blue);
      interval(g, X, 769, wilson(k, sampleN), k / sampleN, C.blue);
      txt(g, 'Binomial approximation', 1150, 724, 29, C.dim, 'center');
      if (cue(s, 1, 'finite-population correction'))
        txt(
          g,
          'SE correction × ' + Math.sqrt((sizes[0] - sampleN) / (sizes[0] - 1)).toFixed(2),
          148,
          844,
          31,
          C.gold,
        );
    }
    return;
  }
  if (b === 3 && cue(s, 3, 'Join those contributions', 0)) {
    txt(
      g,
      total + ' / 1,000' + (s.elapsed >= s.speechDuration ? ' = ' + pc(weighted, 1) : ''),
      960,
      871,
      70,
      C.mint,
      'center',
      'Serif',
    );
  }
  if (b !== 4) return;
  if (separate) {
    laneDraws.forEach((ids, i) => {
      const x = laneX[i];
      box(g, x - 9, 740, 405, 93, C.deep, 8, laneColors[i]);
      ids.slice(0, perLane).forEach((item, j) => idTicket(g, item, x + 7 + j * 128, 755, 119));
      txt(
        g,
        weighting ? 'Target weight  ' + pc(sliceModel[i].share) : 'Within-lane draw',
        x,
        879,
        32,
        laneColors[i],
      );
    });
  } else if (pooled) {
    box(g, 146, 740, 1610, 93, C.deep, 8, C.mint);
    draws.forEach((item, j) => idTicket(g, item, 169 + j * 158, 755, 139));
    txt(g, 'One random draw from the whole queue', 960, 878, 37, C.mint, 'center', 'Serif');
  }
  const parts = sliceModel.map((r) => r.expected);
  txt(
    g,
    'Known example   (' + parts.join(' + ') + ') / 1,000 = ' + pc(weighted, 1),
    960,
    961,
    32,
    C.dim,
    'center',
    'Mono',
  );
}
