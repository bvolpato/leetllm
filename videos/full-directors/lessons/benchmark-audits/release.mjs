import assert from 'node:assert/strict';
import { RELEASES } from '../../../films/benchmark-audits/fixtures.mjs';
import {
  strictMetricRecord,
  wilsonInterval,
  binomialChoose,
  exactPairedP,
} from '../../../films/benchmark-audits/arithmetic.mjs';
import {
  C,
  base,
  line,
  fill,
  path,
  dot,
  sheet,
  letter,
  mono,
  serif,
  label,
  medallion,
  arrow,
  mix,
  cue,
  note,
  reading,
  ticks,
} from './art.mjs';
import { tails } from './sampling.mjs';

const limits = { quality: 0.98, ms: 900, schema: 1, cost: 0.015 };
const evaluate = (r) => ({
  quality: r.quality >= limits.quality,
  ms: r.ms <= limits.ms,
  schema: r.schema === limits.schema,
  cost: r.cost <= limits.cost,
});
const metrics = [
  { ms: 0, cost: 0 },
  { ms: false, cost: 0.01 },
  { ms: 500, cost: NaN },
  { ms: -1, cost: 0.01 },
].map((r) => ({ ...r, policy: 0.99, schema: 1 }));
const brokenIds = ['F031', 'F118'];
const archive = Array.from({ length: 200 }, (_, i) => {
  const n = i + 1,
    id = 'F' + String(n).padStart(3, '0');
  return {
    id,
    baseline: n > 10 && n <= 190,
    candidate: n <= 190 && !brokenIds.includes(id),
    permission: n >= 22 && n <= 31,
  };
});
const fixes = archive.filter((r) => !r.baseline && r.candidate);
const breaks = archive.filter((r) => r.baseline && !r.candidate);
const slice = archive.filter((r) => r.permission);
const hits = slice.filter((r) => r.candidate).length;
const permissionMiss = slice.find((r) => !r.candidate);
const observation = hits / slice.length,
  interval = wilsonInterval(hits, slice.length),
  floor = 0.85;
const pairedP = exactPairedP(fixes.length, breaks.length);
const percent = (n) => (100 * n).toFixed(1) + '%';
const basePass = archive.filter((r) => r.baseline).length,
  candidatePass = archive.filter((r) => r.candidate).length;
const reportRows = [
  ['Case and source', 'Q91  /  renewal policy v3'],
  ['Final input', 'Three passages  /  full context saved'],
  ['System', 'Dated model  /  prompt and tool settings'],
  ['Answer and scorer', 'Returned text  /  frozen grader'],
  ['Attempt log', 'Timeouts, elapsed time and cost'],
];
export function checkRelease() {
  assert.deepEqual(
    RELEASES.map((r) => Object.values(evaluate(r)).every(Boolean)),
    [false, true, false],
  );
  assert.deepEqual(metrics.map(strictMetricRecord), [true, false, false, false]);
  assert.ok(!strictMetricRecord({ policy: 1.1, schema: 1, ms: 500, cost: 0.01 }));
  assert.ok(!strictMetricRecord({ policy: NaN, schema: 1, ms: NaN, cost: 0 }));
  assert.ok(!(NaN < limits.quality || NaN > limits.ms));
  assert.deepEqual(
    [basePass, candidatePass, fixes.length, breaks.length, hits, slice.length],
    [180, 188, 10, 2, 9, 10],
  );
  assert.deepEqual(
    breaks.map((r) => r.id),
    brokenIds,
  );
  assert.equal(permissionMiss.id, 'F031');
  assert.equal(percent(interval.low), '59.6%');
  assert.equal(percent(interval.high), '98.2%');
  assert.ok(interval.low < floor && observation >= floor);
  assert.equal(pairedP.toFixed(4), '0.0386');
}
export function gates(c, k) {
  base(c, 'Interactive service  /  Release envelope', 'Which system clears all four gates?');
  const x0 = 213,
    x1 = 1203,
    y0 = 776,
    Y = (v) => y0 - (365 * v) / 2000,
    X = (v) => mix(x0, x1, (v - 0.9) / 0.1);
  const latency = cue(k, 1, 'latency limit');
  const cost = cue(k, 2, 'schema validity and cost');
  const top = latency ? Y(limits.ms) : Y(2000);
  fill(c, X(limits.quality), top, x1 - X(limits.quality), y0 - top, C.pale);
  ticks(c, x0, x1, y0, 0.9, 1, 0.02, (v) => Math.round(100 * v) + '%');
  [0, 500, 1000, 1500, 2000].forEach((v) => {
    line(c, x0, Y(v), x1, Y(v));
    mono(c, v, x0 - 16, Y(v), 26, C.fine, { align: 'right' });
  });
  label(c, 'p95 latency (ms)', 108, 326);
  label(c, 'Policy pass rate', 508, 901);
  line(c, X(limits.quality), Y(2000) - 15, X(limits.quality), y0, C.cold, 4);
  mono(c, '98%', X(limits.quality), Y(2000) - 45, 34, C.cold, { align: 'center' });
  if (latency > 0) {
    line(c, x0, top, x1, top, C.fail, 4);
    mono(c, '900 ms', x0 + 12, top - 28, 30, C.fail);
  }
  RELEASES.forEach((r) => {
    const x = X(r.quality),
      y = Y(r.ms);
    dot(c, x, y, 15, C.ink);
    letter(
      c,
      r.id,
      x + (r.id === 'Specialist' ? -26 : 19),
      r.id === 'Balanced' ? y + 32 : y - 29,
      32,
      C.ink,
      { align: r.id === 'Specialist' ? 'right' : 'left' },
    );
  });
  if (cost > 0) {
    label(c, 'Cost per case ≤ $0.015', 1281, 390);
    label(c, 'Schema must be 100%', 1281, 447);
    RELEASES.forEach((r, i) => {
      const y = 533 + i * 96;
      letter(c, r.id, 1281, y, 35);
      mono(c, '$' + r.cost.toFixed(3), 1497, y, 32);
      medallion(c, 1747, y, evaluate(r).cost && evaluate(r).schema, 20);
    });
    letter(c, 'All three have valid schema.', 1281, 807, 32);
    const eligible = RELEASES.filter((row) => Object.values(evaluate(row)).every(Boolean));
    letter(
      c,
      eligible.map((r) => r.id).join(', ') + ' clears all four gates.',
      1281,
      872,
      36,
      C.pass,
      { bold: true, max: 533 },
    );
  } else
    reading(
      c,
      1296,
      426,
      'Permitted region',
      latency ? ['Quality ≥ 98%', 'p95 ≤ 900 ms'] : ['Quality ≥ 98%'],
      475,
    );
}
export function finite(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Telemetry reader  /  Admission',
    b >= 4 ? 'What does valid telemetry permit?' : 'Which records contain usable measurements?',
  );
  if (b === 2) {
    sheet(c, 101, 337, 1051, 433);
    label(c, 'Reject if a comparison is bad', 141, 400);
    mono(c, 'NaN < 0.98', 142, 520, 50);
    mono(c, 'NaN > 900', 142, 647, 50);
    const show = cue(k, 2, 'both false') > 0;
    if (show) {
      [520, 647].forEach((y) => mono(c, 'False', 834, y, 48, C.fail));
    }
    reading(c, 1238, 396, 'Strict validator', ['NaN is nonfinite.', 'Reject this report.'], 560);
    note(c, 'A reject-if-bad comparison alone can let missing evidence through.');
    return;
  }
  if (b >= 4) {
    const r = RELEASES[b === 4 && cue(k, 4, 'Look at Specialist') < 1 ? 1 : 2];
    label(c, r.id + '   /   Interactive route', 109, 320);
    const entries = [
      ['Policy pass', r.quality, limits.quality, '≥', 'quality'],
      ['Schema pass', r.schema, limits.schema, '=', 'schema'],
      ['p95 ms', r.ms, limits.ms, '≤', 'ms'],
      ['Dollars per case', r.cost, limits.cost, '≤', 'cost'],
    ];
    entries.forEach(([t, v, l, op, key], i) => {
      const x = 111 + i * 432;
      sheet(c, x, 394, 390, 326);
      label(c, t, x + 20, 448);
      mono(c, v, x + 20, 556, 58);
      mono(c, op + ' ' + l, x + 20, 655, 38);
      medallion(c, x + 313, 651, evaluate(r)[key], 25);
    });
    note(c, 'Keep the measured values with the route decision.');
    return;
  }
  ['Record', 'p95 latency (ms)', 'Cost per case ($)', 'Metric validation'].forEach((s, i) =>
    label(c, s, [111, 552, 1000, 1430][i], 319),
  );
  const verdictCues = ['Zero time', 'False is a Boolean', "the third row's cost", 'the last latency'];
  metrics.forEach((r, i) => {
    const y = 405 + i * 109;
    line(c, 103, y + 54, 1810, y + 54);
    mono(c, String.fromCharCode(65 + i), 115, y, 44);
    mono(c, r.ms === false ? 'False' : r.ms, 554, y, 42);
    mono(c, String(r.cost), 1000, y, 42);
    if (cue(k, 1, verdictCues[i], 0)) medallion(c, 1560, y, strictMetricRecord(r), 26);
  });
  note(
    c,
    b === 3
      ? 'A rate of 1.1 is finite and outside [0, 1]. Reject it before comparing thresholds.'
      : 'All rows report a policy pass rate of 0.99 and a schema pass rate of 1.0.',
  );
}
export function packageRun(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Reproduction file  /  Run record',
    b === 3 ? 'What needs a matched rerun?' : 'Could another reviewer reconstruct this run?',
  );
  if (b === 3) {
    ['Setting', 'Baseline', 'Candidate'].forEach((v, i) => label(c, v, [114, 843, 1355][i], 331));
    [
      ['Model', 'A', 'B'],
      ['Retrieved passages', '3', '5'],
      ['Judge tuning', 'Unreported', 'Used holdout'],
      ['Approval negation', 'Unreported', 'Phrase pass'],
    ].forEach(([t, a, z], i) => {
      const y = 431 + i * 99;
      line(c, 109, y + 46, 1812, y + 46);
      letter(c, t, 114, y, 39);
      mono(c, a, 843, y, 37);
      mono(c, z, 1355, y, 37, C.fail);
    });
    note(
      c,
      'Freeze the repaired scorer, retire exposed cases and rerun both systems on fresh cases.',
    );
    return;
  }
  sheet(c, 98, 305, 1724, 558);
  reportRows.forEach(([field, v], i) => {
    const y = 375 + i * 97;
    line(c, 136, y + 48, 1786, y + 48);
    label(c, field, 145, y);
    mono(
      c,
      b === 1 && i === 3 ? 'Actual output missing' : v,
      721,
      y,
      36,
      b === 1 && i === 3 ? C.fail : C.ink,
    );
  });
  note(
    c,
    b === 1
      ? 'Matching settings cannot reconstruct the missing answer.'
      : b === 2
        ? 'Pin a snapshot, date the run, retain repeats and rerun the baseline alongside the candidate.'
        : 'Bind the manifest to the actual input, output and recorded work.',
  );
}
function permissionRuler(c, k) {
  const Y = (p) => 850 - (p - 0.5) * 950;
  const axis = 1300,
    bar = 1505;
  label(c, 'Permission pass rate', 1247, 302);
  line(c, axis, Y(0.5), axis, Y(1), C.ink, 3);
  for (let i = 5; i <= 10; i++) {
    const p = i / 10;
    line(c, axis - 14, Y(p), axis + 12, Y(p), C.fine, 3);
    mono(c, i * 10 + '%', axis - 25, Y(p), 28, C.fine, { align: 'right' });
  }
  if (cue(k, 0, 'must reach eighty-five percent') > 0) {
    line(c, axis, Y(floor), 1810, Y(floor), C.fail, 4);
    mono(c, '85% floor', 1637, Y(floor) + 30, 31, C.fail);
  }
  const point = cue(k, 3, 'The dot marks ninety percent');
  const band = cue(k, 3, 'The interval runs', 1.2);
  if (band > 0) {
    const low = Y(interval.low),
      high = Y(interval.high);
    c.save();
    c.globalAlpha = band;
    line(c, bar, high, bar, low, C.cold, 13);
    [low, high].forEach((y) => line(c, bar - 31, y, bar + 31, y, C.cold, 6));
    c.restore();
    if (band === 1) {
      mono(c, percent(interval.low), bar + 50, low, 35, C.cold);
      mono(c, percent(interval.high), bar + 50, high, 32, C.cold);
    }
  }
  if (point > 0) {
    dot(c, bar, Y(observation), 18, C.gold);
    dot(c, bar, Y(observation), 8, C.ink);
    mono(c, '90%', bar + 57, Y(observation) - 8, 39);
  }
  if (cue(k, 4, 'Hold this release') > 0) {
    fill(c, 1242, 886, 554, 64, C.rose);
    letter(
      c,
      interval.low < floor ? 'HOLD   ·   Lower end below floor' : 'Permission gate cleared',
      1262,
      917,
      32,
      C.fail,
      { bold: true, max: 515 },
    );
  }
}
export function archiveGate(c, k) {
  const b = k.beat.beatIndex;
  base(
    c,
    'Archive access  /  Release file',
    b < 5
      ? 'Would you sign the archive release?'
      : b < 7
        ? 'Where did F031 first go wrong?'
        : 'Which cases can test the repair?',
  );
  permissionRuler(c, k);
  if (b === 0) {
    sheet(c, 102, 348, 1017, 437, C.paper);
    label(c, 'Archive access policy', 145, 422);
    serif(c, 'Staff approval is required.', 141, 527, 62, C.ink, { max: 924 });
    line(c, 144, 598, 1072, 598);
    letter(c, 'Predeclared gate: two-sided 95% Wilson lower end', 145, 682, 37, C.ink, {
      max: 902,
    });
    return;
  }
  if (b === 1) {
    label(c, '200 matched case IDs', 109, 322);
    const nf = Math.round(cue(k, 1, 'Ten cases', 1) * fixes.length),
      nb = Math.round(cue(k, 1, 'Two went', 1) * breaks.length);
    let f = 0,
      r = 0;
    archive.forEach((q, i) => {
      const fix = !q.baseline && q.candidate,
        br = q.baseline && !q.candidate;
      const color = fix && ++f <= nf ? C.pass : br && ++r <= nb ? C.fail : C.steel;
      fill(c, 114 + (i % 20) * 47, 377 + Math.floor(i / 20) * 37, 38, 28, color);
    });
    mono(c, '+' + nf + ' fixes     −' + nb + ' regressions', 113, 796, 43);
    if (nf === fixes.length && nb === breaks.length)
      mono(c, basePass + ' → ' + candidatePass + ' passes', 113, 885, 47);
    return;
  }
  if (b === 2) {
    label(c, '12 discordant pairs   /   both tails', 109, 319);
    tails(c, fixes.length, breaks.length, { x: 128, y: 713, w: 958, h: 310 });
    label(c, 'Number of fixes', 421, 804);
    if (cue(k, 2, 'exact two-sided p-value') > 0) {
      const n = fixes.length + breaks.length,
        coef = Array.from({ length: breaks.length + 1 }, (_, i) =>
          Math.round(binomialChoose(n, i)),
        );
      mono(
        c,
        '2 × (' + coef.join(' + ') + ') / ' + 2 ** n + ' ≈ ' + pairedP.toFixed(4),
        119,
        895,
        38,
      );
    }
    return;
  }
  if (b <= 4) {
    label(c, 'Permission cases   /   Candidate', 108, 330);
    const show = cue(k, 3, 'Nine passed', 1);
    slice.forEach((r, i) => {
      const x = 113 + (i % 5) * 198,
        y = 409 + Math.floor(i / 5) * 164;
      sheet(c, x, y, 178, 132);
      mono(c, r.id, x + 89, y + 37, 32, C.ink, { align: 'center' });
      if (show * 10 > i) medallion(c, x + 89, y + 92, r.candidate, 23);
    });
    if (show === 1) mono(c, hits + ' / ' + slice.length + ' passed', 113, 805, 63);
    return;
  }
  if (b === 7) {
    const t = cue(k, 7, 'draw untouched permission cases', 1.25);
    label(c, 'Regression suite', 110, 386);
    label(c, 'Next release sample', 602, 386);
    fill(c, 106, 547, 446, 142, C.steel);
    fill(c, 596, 547, 495, 142, C.steel);
    sheet(c, 127, 503, 403, 126, C.rose);
    mono(c, 'F031  /  replay', 151, 565, 37);
    if (t > 0) {
      const y = mix(442, 503, t);
      sheet(c, 615, y, 453, 126, C.pale);
      letter(c, 'Untouched permissions', 637, y + 62, 36);
    }
    note(c, 'Freeze the repair before sampling again.', 112, 819);
    return;
  }
  label(c, 'Two regressions   /   ' + breaks.map((r) => r.id).join(' and '), 113, 320);
  const left = cue(k, 5, 'context the model received'),
    right = cue(k, 5, 'Its answer says');
  if (left > 0) {
    sheet(c, 104, 386, 987, 157, C.pale);
    label(c, permissionMiss.id + ' final context', 131, 428);
    serif(c, 'Staff approval is required.', 130, 499, 52);
  }
  if (right > 0) {
    sheet(c, 104, 568, 987, 157, C.rose);
    label(c, permissionMiss.id + ' returned answer', 131, 610);
    serif(c, 'Staff approval is optional.', 130, 677, 52);
  }
  if (b === 6) note(c, 'Inspect generation, then replay the full request.', 110, 839);
}
