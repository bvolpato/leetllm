import assert from 'node:assert/strict';
import {
  jointDifferenceMoments,
  usefulLiftDecision,
} from '../../../films/hypothesis-testing/arithmetic.mjs';
import {
  taskRows,
  developmentBootstrap,
  holdoutBootstrap,
  pairedIntervalStudies,
} from '../../../films/hypothesis-testing/fixtures.mjs';
import {
  P,
  bi,
  rect,
  line,
  dot,
  text,
  label,
  title,
  note,
  captionSafeNote,
  lerp,
  smooth,
  cue,
  mark,
  ticket,
  meter,
  interval,
  points,
} from './art.mjs';
import { tally } from './pairs.mjs';
const population = jointDifferenceMoments();
function widths(c, v, indN = 40) {
  const independent = (v.va + v.vb) / indN,
    x = 545,
    w = 1090;
  const max = 0.023;
  for (const [i, rate, name] of [
    [0, v.paired, 'Paired · 40'],
    [1, independent, 'Separate · ' + indN + ' each'],
  ]) {
    const y = 439 + 163 * i,
      color = i ? P.rust : P.teal;
    text(c, name, 153, y + 32, 38, P.ink, { max: 354 });
    rect(c, x, y, (rate / max) * w, 65, color, 3);
    label(c, rate.toFixed(4), x + (rate / max) * w + 24, y + 32, 37, color);
  }
  label(c, 'Variance of the difference in mean pass rates', x, 773, 30);
}
export function variance(c, k) {
  const b = bi(k);
  if (b <= 2) {
    const joint = population.rows.flatMap((r, j) => Array(Math.round(r.p * 100)).fill(j));
    const filtered = cue(k, 1, 'Only joint passes count', 1.1);
    joint.forEach((j, i) => {
      const color = [P.teal, P.rust, P.gold, P.slate][j],
        x = 140 + (i % 10) * 52,
        y = 298 + Math.floor(i / 10) * 51;
      rect(c, x, y, 44, 42, j && filtered ? P.faint : color, 4);
      if (i === 0 || joint[i - 1] !== j) line(c, x, y + 46, x + 43, y + 46, P.ink, 2);
    });
    const labels = ['Both pass', 'A alone', 'B alone', 'Both fail'];
    population.rows.forEach((r, i) => {
      const x = 830,
        y = 376 + 104 * i;
      dot(c, x, y, 14, [P.teal, P.rust, P.gold, P.slate][i]);
      text(c, labels[i], x + 41, y, 43);
      label(c, Math.round(r.p * 100) + '%', 1520, y, 43, P.ink, 'right');
    });
    note(
      c,
      b === 0
        ? 'One square represents one percent of the population.'
        : 'Covariance = joint pass rate − product of pass rates',
      b === 0
        ? 'A  ½      B  ½'
        : b === 2 || k.reveal('is the covariance', 0.6) === 1
          ? '0.45 − 0.25 = 0.20'
          : '',
    );
  } else if (b === 5 || b === 6) {
    const at = meter(c, {
      x: 205,
      y: 746,
      w: 1500,
      min: -0.25,
      max: 0.25,
      ticks: [-0.2, -0.1, 0, 0.1, 0.2],
      threshold: null,
      axis: '',
    });
    line(c, at(0), 314, at(0), 744, P.line, 2, [10, 7]);
    for (const [i, se, name] of [
      [0, population.pairedSE, 'Paired'],
      [1, population.independentSE, 'Independent'],
    ]) {
      const y = 417 + i * 179,
        lo = -1.96 * se,
        hi = -lo;
      label(c, name + '   /   SE ' + (100 * se).toFixed(1) + ' points', 205, y - 60, 28);
      interval(c, at, y, [lo, hi], 0, i ? P.rust : P.teal);
    }
    captionSafeNote(
      c,
      'Normal reference margins around a known zero effect.',
      b === 6 ? '4 expected disagreements' : '±1.96 SE',
    );
  } else {
    let v = population,
      indN = 40;
    if (b === 7) {
      const t1 = cue(k, 7, 'At zero covariance', 1.2),
        t2 = cue(k, 7, 'With negative covariance', 1.3);
      v = jointDifferenceMoments(0.45 - 0.2 * smooth(t1) - 0.2 * smooth(t2));
    }
    if (b >= 8)
      indN = Math.round(lerp(40, 200, smooth(cue(k, 8, 'enlarge the independent batches', 2.4))));
    label(c, 'Covariance   ' + v.cov.toFixed(2), 150, 327, 31);
    if (b === 3) {
      text(c, 'Paired · 40', 153, 475, 40);
      rect(c, 545, 439, (v.paired / 0.023) * 1090, 65, P.teal, 3);
      label(c, v.paired.toFixed(4), 545 + (v.paired / 0.023) * 1090 + 24, 472, 37, P.teal);
      title(c, '(0.25 + 0.25 − 2 × 0.20) / 40', 545, 650, 54);
    } else widths(c, v, indN);
    captionSafeNote(
      c,
      b >= 8
        ? 'Match variance by changing the independent batch size.'
        : b === 7
          ? 'Keep both marginal pass rates at one half.'
          : 'The covariance term belongs to the paired design.',
      b >= 8 ? indN + ' tasks per model' : '',
    );
  }
}
const perBin = new Map();
for (const v of developmentBootstrap.means) perBin.set(v, (perBin.get(v) || 0) + 1);
const histogram = [...perBin.entries()].sort((a, b) => a[0] - b[0]);
const [lowerEndpoint, upperEndpoint] = developmentBootstrap.interval;
const enclosedMeans = developmentBootstrap.means.filter(
  (value) => value >= lowerEndpoint && value <= upperEndpoint,
).length;
function pairedStamp(c, row, x, y, w = 110, h = 63) {
  ticket(c, x, y, w, h, row.difference > 0 ? P.sea : row.difference < 0 ? P.blush : P.white);
  label(c, row.id, x + w / 2, y + h * 0.29, Math.min(24, w * 0.24), P.slate, 'center');
  mark(c, x + w * 0.32, y + h * 0.72, row.a, h * 0.16);
  mark(c, x + w * 0.68, y + h * 0.72, row.b, h * 0.16);
}
export function bootstrap(c, k) {
  const b = bi(k);
  if (b === 0) {
    const phase = cue(k, 0, 'draw forty whole task rows', 3.0),
      count = Math.floor(phase * 40);
    label(c, 'OBSERVED   /   40 paired tickets', 144, 311, 29);
    label(c, 'ONE RESAMPLE   /   with replacement', 1005, 311, 29);
    taskRows.forEach((r, i) =>
      pairedStamp(c, r, 144 + (i % 8) * 94, 372 + Math.floor(i / 8) * 86, 83, 69),
    );
    const sampled = developmentBootstrap.first.slice(0, count);
    sampled.forEach((j, i) =>
      pairedStamp(c, taskRows[j], 1006 + (i % 8) * 95, 372 + Math.floor(i / 8) * 86, 83, 69),
    );
    const source = sampled.at(-1);
    if (source !== undefined) {
      const x = 144 + (source % 8) * 94,
        y = 372 + Math.floor(source / 8) * 86;
      rect(c, x - 4, y - 4, 91, 77, null, 5, P.gold);
    }
    line(c, 144, 816, 1760, 816, P.line, 2);
    title(c, 'Copy the ID and both outcomes together.', 144, 854, 43);
    text(c, count + ' / 40 drawn', 1760, 854, 42, P.teal, { face: 'Mono', align: 'right' });
  } else {
    const q = cue(k, 1, 'eight thousand resampled means', 2.8),
      count = Math.max(1, Math.floor(8000 * q));
    const bins = new Map();
    if (count === 8000) for (const [v, j] of histogram) bins.set(v, j);
    else
      for (let j = 0; j < count; j++) {
        const v = developmentBootstrap.means[j];
        bins.set(v, (bins.get(v) || 0) + 1);
      }
    const peak = Math.max(...bins.values()),
      x = (v) => 178 + (v + 0.3) * 2040,
      y = 705;
    const ci = developmentBootstrap.interval,
      trim = cue(k, 2, 'The endpoints are about', 0.9);
    const showTies = cue(k, 2, 'All values tied', 0, { captionStart: false }) === 1;
    label(c, 'Paired lift in each resample', 160, 311, 33);
    if (showTies) {
      const total = developmentBootstrap.means.length;
      label(c, 'Ties at both ends included', 160, 356, 31, P.gold);
      text(
        c,
        enclosedMeans.toLocaleString('en-US') + ' / ' + total.toLocaleString('en-US') +
          ' inside  ·  ' + (100 * enclosedMeans / total).toFixed(1) + '%',
        1759, 356, 37, P.teal, { face: 'Mono', align: 'right' },
      );
    }
    for (const [v, j] of bins) {
      const h = (302 * j) / peak;
      rect(
        c,
        x(v) - 21,
        y - h,
        42,
        h,
        trim && (v < ci[0] || v > ci[1]) ? P.line : v < 0 ? P.rust : P.teal,
        3,
      );
      if (showTies && ci.includes(v)) {
        rect(c, x(v) - 24, y - h - 3, 48, h + 3, null, 3, P.gold);
        line(c, x(v) - 24, y - h - 3, x(v) + 24, y - h - 3, P.gold, 6);
      }
    }
    line(c, x(-0.31), y, x(0.42), y, P.ink, 3);
    for (const v of [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4])
      label(c, points(v), x(v), y + 37, 28, P.slate, 'center');
    if (trim) {
      line(c, x(ci[0]), 795, x(ci[1]), 795, P.gold, 9);
      for (const v of ci) {
        line(c, x(v), 782, x(v), 808, P.gold, 5);
        if (showTies) dot(c, x(v), 795, 12, P.gold);
      }
    }
    line(c, 94, 830, 1826, 830, P.line, 2);
    title(
      c,
      trim
        ? '2.5th and 97.5th percentiles, in points.'
        : 'One mean difference per forty-ticket draw.',
      94,
      859,
      43,
      P.ink,
      'left',
      1060,
    );
    text(
      c,
      trim ? '−10  to  +25' : count.toLocaleString('en-US') + ' resamples',
      1826,
      859,
      43,
      P.teal,
      { face: 'Mono', align: 'right', max: 642 },
    );
  }
}
const wald = (success, n) => {
  const p = success / n,
    se = Math.sqrt((p * (1 - p)) / n);
  return [p - 1.96 * se, p + 1.96 * se];
};
export function intervalLimits(c, k) {
  const b = bi(k);
  if (b < 2) {
    const sampleCount = Math.ceil(pairedIntervalStudies.length * cue(k, 0, 'Take a fresh sample', 2.8));
    const samples = pairedIntervalStudies.slice(0, sampleCount);
    const x = (v) => 972 + v * 2540;
    label(c, 'Paired Wald interval', 94, 280, 31, P.ink);
    label(c, '20 simulated studies   /   40 pairs each', 1826, 280, 27, P.slate, 'right');
    line(c, x(0), 317, x(0), 807, P.gold, 5);
    label(c, 'true lift = 0', x(0), 280, 27, P.gold, 'center');
    samples.forEach((r, i) => {
      const y = 340 + 23.6 * i,
        col = r.covers ? P.teal : P.rust;
      line(c, x(r.interval[0]), y, x(r.interval[1]), y, col, 6);
      dot(c, x(r.mean), y, 6, col);
      if (!r.covers)
        line(
          c,
          x(r.interval[1] < 0 ? r.interval[1] : r.interval[0]),
          y,
          x(0),
          y,
          P.rust,
          2,
          [4, 6],
        );
    });
    line(c, 94, 818, 1826, 818, P.line, 2);
    title(c, 'Mean paired difference ± 1.96 standard errors', 94, 856, 45, P.ink, 'left', 1060);
    if (sampleCount) {
      const hits = samples.filter((r) => r.covers).length;
      label(c, hits + ' / ' + sampleCount + ' cover zero', 1826, 856, 39, P.teal, 'right');
    }
  } else if (b < 5) {
    const change = cue(k, 2, 'Now change the last pass', 0.35),
      s = change ? 3 : 4;
    for (let i = 0; i < 4; i++) mark(c, 236 + i * 105, 423, i < s, 34);
    label(c, 'One assistant   /   ' + s + ' of 4 pass', 175, 342, 30);
    const at = meter(c, {
      x: 210,
      y: 697,
      w: 1490,
      min: 0,
      max: 1.25,
      ticks: [0, 0.25, 0.5, 0.75, 1, 1.25],
      threshold: null,
      axis: 'Pass rate (%)',
      tickLabel: (v) => String(v * 100),
    });
    line(c, at(1), 402, at(1), 697, P.gold, 4, [8, 6]);
    label(c, '100% ceiling', at(1), 367, 28, P.gold, 'center');
    const show = s === 4 || cue(k, 3, 'Past a hundred percent', 1) === 1;
    if (show) {
      const ci = wald(s, 4);
      line(c, at(ci[0]), 566, at(ci[1]), 566, P.rust, 9);
      for (const v of ci) line(c, at(v), 551, at(v), 581, P.rust, 4);
      label(c, 'Wald interval', s === 4 ? at(1) - 24 : at(s / 4), 516, 30, P.rust, s === 4 ? 'right' : 'center');
      if (s !== 4) label(c, (ci[1] * 100).toFixed(1) + '%', at(ci[1]), 617, 28, P.rust, 'center');
    }
    dot(c, at(s / 4), 566, 14, P.teal);
    captionSafeNote(
      c,
      b === 4
        ? 'The switch requires an interval for the paired difference.'
        : cue(k, 3, 'Wilson can give', 0)
          ? 'Wilson gives a separate interval for one pass rate.'
          : 'Wald uses the variation observed in four trials.',
      s === 4 ? 'SE = 0' : show ? 'upper end > 100%' : '3 / 4',
    );
  } else {
    const ds = [1, 4, 1, 1, 3, 5],
      show = cue(k, 5, 'Pick six of those rows', 2.0);
    label(c, 'Fresh fixture   /   six tied pairs', 165, 315, 30);
    for (let i = 0; i < 6; i++) {
      const x = 178 + i * 259;
      ticket(c, x, 395, 221, 107);
      label(c, 'T' + (i + 1) + '   Δ 0', x + 110, 449, 32, P.ink, 'center');
      if (i < Math.ceil(6 * show)) {
        ticket(c, x, 620, 221, 107, P.sea);
        label(c, 'T' + ds[i] + '   Δ 0', x + 110, 674, 32, P.ink, 'center');
      }
    }
    note(c, 'Each resampled difference stays at zero.', show === 1 ? 'interval  [0, 0]' : '');
  }
}
export function liftGauge(c, k) {
  const ci = developmentBootstrap.interval,
    at = meter(c),
    dotAt = tally(taskRows).lift;
  label(c, 'DEVELOPMENT   /   40 paired tasks', 163, 311, 30);
  const show = cue(k, 0, 'Open the interval', 1.4);
  dot(c, at(dotAt), 543, 17, P.teal);
  if (show > 0) {
    const partial = ci.map((v) => lerp(dotAt, v, smooth(show)));
    interval(c, at, 543, partial, dotAt, P.teal, show === 1);
  }
  const decision =
    cue(k, 1, 'Hold the switch', 0.6) === 1 && usefulLiftDecision(ci) !== 'clears-useful-lift';
  captionSafeNote(
    c,
    decision
      ? 'Keep A and freeze B for a fresh comparison.'
      : 'B must gain more than two passes per hundred tasks.',
    decision ? 'HOLD' : '',
  );
}
export function checkIntervals() {
  assert(Math.abs(population.paired - 0.0025) < 1e-10);
  assert.equal(population.independent, 0.0125);
  assert(jointDifferenceMoments(0.05).paired > population.independent);
  assert.deepEqual(developmentBootstrap.interval, [-0.1, 0.25]);
  assert.equal(developmentBootstrap.first[0], 1);
  assert.equal(developmentBootstrap.first[2], 1);
  assert.equal(developmentBootstrap.means.length, 8000);
  assert.equal(enclosedMeans, 7711);
  assert(pairedIntervalStudies.some((r) => !r.covers));
  assert(wald(3, 4)[1] > 1);
  assert.deepEqual(wald(4, 4), [1, 1]);
  assert.equal(usefulLiftDecision(developmentBootstrap.interval), 'inconclusive');
  assert.equal(usefulLiftDecision(holdoutBootstrap.interval), 'clears-useful-lift');
}
