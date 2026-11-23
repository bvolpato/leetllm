import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  assignmentBuckets,
  jobBucket,
  canary,
  delayedCostCohort,
  psi,
  requests,
} from '../../../films/model-monitoring/fixtures.mjs';
import { requestContract, simulateRelease } from '../../../films/model-monitoring/model.mjs';
import { releaseWindow } from '../../../films/model-monitoring/release-cost.mjs';
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
  arrow,
  fix,
  pct,
  sum,
} from './instruments.mjs';

const digest = (v) => createHash('sha256').update(v).digest('hex');
const files = ['weights A', 'weights B'].map(digest);
function manifest(ref) {
  const fields = {
    evaluation: 'job-risk-eval-v1',
    features: 'features-v3',
    model: ref,
    pipeline: 'job-risk-train-v4',
    previous: 'v3',
    snapshot: 'labels-through-2026-02-03',
    threshold: 0.5,
  };
  return { fields, hash: digest(JSON.stringify(fields)) };
}
function bundleState(s) {
  const tomorrow = s.at(3, 'Tomorrow it can'),
    pinned = s.at(4, 'under immutable');
  const file = files[tomorrow ? 1 : 0],
    m = manifest(pinned ? file : 'latest');
  return { file, pinned, tomorrow, m };
}
export function bundle(c, s) {
  surface(c, true);
  const a = bundleState(s),
    selector = s.beat === 5;
  heading(
    c,
    'RELEASE REGISTRY',
    selector ? 'Move the production pointer' : 'What exactly did we freeze?',
    true,
  );
  if (selector) {
    const moved = s.at(5, 'which bundle new requests resolve');
    const yy = moved ? 659 : 394;
    box(c, 135, 410, 560, 220, '#2b4f48', 15);
    txt(c, 'Production alias', 188, 458, 37, C.mint);
    serif(c, 'New requests', 186, 555, 60, C.cream);
    line(
      c,
      [
        [695, 520],
        [860, 520],
        [860, yy],
      ],
      C.gold,
      7,
    );
    arrow(c, 860, yy, 1110, yy, C.gold, 7);
    ['v3   previous', 'v4   candidate'].forEach((l, i) => {
      paper(c, 1140, 310 + i * 265, 584, 167, false);
      mono(c, l, 1183, 395 + i * 265, 45, C.ink);
    });
    txt(
      c,
      'Resolve the artifact and check its feature and schema contract.',
      139,
      924,
      42,
      C.cream,
    );
    return;
  }
  paper(c, 94, 259, 830, 699);
  mono(c, 'Candidate manifest', 141, 335, 42, C.sea);
  const fields = [
    ['Snapshot', 'Feb 3'],
    ['Model', a.pinned ? 'digest ' + a.file.slice(0, 8) : 'latest'],
    ['Pipeline', 'train-v4'],
    ['Features', 'features-v3'],
    ['Threshold', '0.50'],
    ['Evaluation', 'eval-v1'],
    ['Previous', 'v3'],
  ];
  fields.forEach(([k, v], i) => {
    const y = 423 + i * 67;
    txt(c, k, 143, y, 32, C.muted);
    mono(c, v, 442, y, 36, C.ink);
  });
  if (s.beat >= 2) mono(c, 'SHA-256  ' + a.m.hash.slice(0, 12) + '…', 142, 901, 34, C.sea);
  if (s.beat >= 3) {
    arrow(c, 941, 484, 1118, 484, C.gold);
    const x = 1165,
      y = 326;
    box(c, x, y, 595, 441, '#36564d', 18);
    for (let i = 0; i < 5; i++)
      line(
        c,
        [
          [x + 26, y + 231 + i * 23],
          [x + 563, y + 231 + i * 23],
        ],
        '#8da591',
        4,
      );
    txt(c, a.pinned ? 'Pinned content' : 'Resolved file', x + 44, y + 54, 35, C.mint);
    serif(c, 'Weights ' + (a.tomorrow ? 'B' : 'A'), x + 41, y + 137, 67, C.cream);
    mono(c, a.file.slice(0, 15) + '…', x + 42, y + 375, 37, C.cream);
    if (s.at(3, 'The manifest bytes') && !a.pinned)
      txt(c, 'Same manifest fingerprint', 1060, 866, 43, C.gold);
  }
}
const log = [
  [20, 70],
  [31, 5],
  [0, 10],
  [1, 15],
].map(([i, requests]) => ({
  id: 'job-' + String(i).padStart(4, '0'),
  bucket: assignmentBuckets[i],
  requests,
}));
function network(c, bluegreen, moved) {
  const col = [C.mint, C.gold],
    ys = [415, 673],
    labels = bluegreen
      ? ['Blue  ·  stable', 'Green  ·  ready']
      : ['Stable response', 'Shadow copy'];
  txt(c, 'Incoming jobs', 105, 535, 45, C.cream);
  for (let i = 0; i < 2; i++) {
    const active = bluegreen ? i === Number(moved) : i === 0;
    line(
      c,
      [
        [416, 532],
        [572, 532],
        [632, ys[i]],
        [778, ys[i]],
      ],
      active ? col[i] : '#718780',
      active ? 8 : 3,
      active ? [] : [12, 9],
    );
    box(c, 780, ys[i] - 72, 485, 146, '#294e46', 14);
    txt(c, labels[i], 815, ys[i], 44, col[i]);
    arrow(c, 1270, ys[i], 1417, ys[i], active ? col[i] : '#718780', active ? 6 : 3);
    txt(
      c,
      active
        ? 'User response'
        : bluegreen
          ? moved
            ? 'Drain in-flight'
            : 'Validate'
          : 'Compare only',
      1442,
      ys[i],
      37,
      active ? C.cream : C.mint,
    );
  }
}
export function exposure(c, s) {
  surface(c, true);
  if (s.beat === 1 || s.beat >= 8) {
    const bg = s.beat >= 8;
    heading(
      c,
      'SERVING PATHS',
      bg ? 'Switch between two environments' : 'Keep shadow actions isolated',
      true,
    );
    network(c, bg, bg && s.at(8, 'after validation'));
    txt(
      c,
      bg
        ? 'Check fresh serving logs during propagation.'
        : 'Bound shared workers, queues and logs. Only stable scores can open a real review.',
      114,
      935,
      39,
      C.cream,
    );
    return;
  }
  if (s.beat <= 5) {
    heading(c, 'STICKY ASSIGNMENT    /    1,000 JOBS', 'A job keeps its bucket', true);
    const limit = s.at(4, 'Widen the cutoff') ? 25 : 5,
      done = s.at(3, 'A bucket less');
    txt(
      c,
      'SHA-256 of namespace + job ID     →     first 8 bytes, big-endian     →     mod 100',
      113,
      254,
      37,
      C.mint,
    );
    assignmentBuckets.forEach((v, i) => {
      const x = 131 + (i % 50) * 33.7,
        y = 347 + Math.floor(i / 50) * 23.4;
      circle(c, x, y, 7.7, done && v < limit ? (v < 5 ? C.gold : C.mint) : '#617b70');
    });
    if (done) {
      const count = assignmentBuckets.filter((v) => v < limit).length;
      mono(c, 'Bucket < ' + limit, 118, 879, 45, C.cream);
      if (
        (limit === 5 && s.at(4, 'Keep those gold dots')) ||
        (limit === 25 && s.at(4, 'Look for the original'))
      )
        mono(c, count + ' / 1,000 jobs', 1030, 879, 48, C.gold);
    }
    return;
  }
  heading(c, 'FOUR-JOB REQUEST LOG    /    BUCKET < 5', 'Weight the requests each job sends', true);
  log.forEach(({ id, bucket, requests }, i) => {
    const y = 350 + i * 127,
      selected = bucket < 5;
    mono(c, id, 113, y, 39, C.cream);
    mono(c, 'bucket ' + bucket, 505, y, 35, C.mint);
    for (let n = 0; n < requests; n++)
      box(c, 900 + n * 11, y - 18, 8, 37, selected ? C.gold : '#81958b', 2);
    mono(c, requests, 900 + requests * 11 + 23, y, 37, C.cream);
  });
  if (s.at(7, 'Only two')) {
    const admitted = sum(log.filter((r) => r.bucket < 5).map((r) => r.requests));
    mono(
      c,
      admitted + ' / ' + sum(log.map((r) => r.requests)) + ' requests to v4',
      118,
      936,
      54,
      C.gold,
    );
  } else txt(c, 'How much traffic reaches the canary?', 118, 936, 47, C.cream);
}
const offline = [
  { name: 'v3', tp: 8, fp: 20, fn: 2, priority: 1, p95: 40, n: 1000 },
  { name: 'v4', tp: 9, fp: 15, fn: 1, priority: 0, p95: 42, n: 1000 },
].map((r) => ({ ...r, cost: (1000 * (2 * r.fp + 10 * r.fn)) / r.n, recall: r.tp / (r.tp + r.fn) }));
export function fastMetrics(failed = false) {
  const requests = failed ? 600 : 500;
  const errors = failed ? 3 : 1;
  return [
    ['Request count', requests, 500, 'min', ''],
    [
      'Error rate',
      (100 * errors) / requests,
      canary.errorLimit * 100,
      'max',
      '%',
      { errors, requests },
    ],
    ['p95 latency', failed ? 49 : canary.p95Ms, canary.p95LimitMs, 'max', ' ms'],
    ['Review queue', failed ? 85 : canary.peakQueue * 100, canary.queueLimit * 100, 'max', '%'],
  ].map(([name, v, limit, rule, unit, counts]) => ({
    name,
    v,
    limit,
    rule,
    unit,
    counts,
    pass: rule === 'min' ? v >= limit : v <= limit,
  }));
}
export function meters(c, metrics, shown, showErrorCounts, queuePending = false) {
  metrics.forEach(({ name, v, limit, rule, unit, pass, counts }, i) => {
    const y = 349 + i * 135,
      x = 655,
      w = 730;
    txt(c, name, 113, y, 42);
    if (counts && showErrorCounts)
      mono(
        c,
        counts.errors + ' failed / ' + counts.requests + ' requests',
        114,
        y + 53,
        30,
        C.muted,
      );
    box(c, x, y - 11, w * 1.26, 24, '#c6cab2', 4);
    if (i < shown) {
      const color = queuePending && name === 'Review queue' ? C.muted : pass ? C.sea : C.red;
      box(c, x, y - 13, (w * v) / limit, 28, color, 4);
      mono(c, v + unit, 1686, y, 42, color, 'center');
    }
    line(
      c,
      [
        [x + w, y - 27],
        [x + w, y + 40],
      ],
      C.ink,
      4,
    );
    mono(
      c,
      (rule === 'min' ? 'min ' : 'max ') + limit + unit,
      x + w,
      y + 68,
      26,
      C.muted,
      'center',
    );
  });
}
export function gates(c, s) {
  surface(c);
  if (s.beat <= 3) {
    heading(c, 'OFFLINE COMPARISON    /    SAME 1,000 JOBS', 'Ten actual misses in each replay');
    const xs = [128, 348, 780, 1095, 1398, 1655];
    ['Model', 'Caught of 10', 'False alerts', 'Cost / 1k', 'Priority lost', 'p95'].forEach((t, i) =>
      txt(c, t, xs[i], 324, 32, C.muted),
    );
    offline.slice(0, s.beat >= 2 ? 2 : 1).forEach((r, i) => {
      const y = 447 + i * 193;
      mono(c, r.name, xs[0], y, 62, C.ink);
      for (let k = 0; k < r.tp + r.fn; k++)
        circle(c, 351 + k * 33, y, 13, k < r.tp ? C.sea : C.red);
      mono(c, pct(r.recall) + ' recall', xs[1], y + 71, 32, C.muted);
      [r.fp, r.cost, r.priority, r.p95 + ' ms'].forEach((v, j) =>
        mono(c, v, xs[j + 2], y, 42, j === 1 ? C.sea : C.ink),
      );
    });
    if (s.beat === 3)
      txt(c, 'One more missed catch shifts recall by 0.10. Inspect support by tier.', 126, 910, 42);
    return;
  }
  heading(c, 'FAST CANARY CHECKS', 'Each measurement has its own budget');
  const shown =
    s.beat === 5 ? 4 : s.at(4, 'inside fifty') ? 3 : s.at(4, 'The ninety-fifth') ? 2 : 1;
  const metrics = fastMetrics();
  meters(c, metrics, shown, s.at(4, 'That is two tenths'));
  if (s.at(5, 'We can propose') && metrics.every((m) => m.pass))
    stamp(c, 'PROPOSE WIDER EXPOSURE', 120, 945, C.sea, 40);
}
export const delayedWindow = releaseWindow(
  delayedCostCohort.rows,
  delayedCostCohort.rows,
  delayedCostCohort.falseAlerts,
  delayedCostCohort.missedDeadlines,
);
export function triage(c, s) {
  surface(c, true);
  if (s.beat <= 3) {
    heading(c, 'INVESTIGATION    /    FIRST ACTION', 'Trace each alarm to its source', true);
    const alarms = [
      [
        requests
          .filter((r) => requestContract(r) !== 'pass')
          .map((r) => r.id)
          .join(' + '),
        'Trace and repair the input path',
      ],
      ['20 / 50  ≠  20 / 100', 'Share the capacity transform'],
      ['Heartbeat PSI   ' + fix(psi), 'Inspect traffic mix and source'],
    ];
    const showAction = [s.at(1, 'Trace each input'), s.at(1, 'Share the transform'), s.beat >= 2];
    alarms.forEach(([e, r], i) => {
      const y = 350 + i * 179;
      circle(c, 126, y, 13, i === 2 ? C.gold : C.coral);
      mono(c, e, 176, y, 39, C.cream);
      if (showAction[i]) {
        arrow(c, 734, y, 925, y, i === 2 ? C.gold : C.mint);
        txt(c, r, 966, y, 46, C.cream);
      }
    });
    if (s.at(3, 'If cost still regresses'))
      txt(
        c,
        'Train after a persistent regression on comparable, mature jobs.',
        119,
        922,
        44,
        C.gold,
      );
    return;
  }
  heading(c, 'DELAYED RELEASE CHECK', 'A later cohort changes the evidence', true);
  paper(c, 141, 279, 1638, 610);
  const w = delayedWindow;
  mono(c, 'v4   /   ' + w.mature + ' closed   /   ' + w.joined + ' labels', 191, 369, 42, C.muted);
  serif(c, w.fp + ' false alerts', 193, 522, 64);
  serif(c, w.fn + ' unflagged misses', 891, 522, 64);
  line(
    c,
    [
      [191, 598],
      [1712, 598],
    ],
    C.rule,
    4,
  );
  if (s.at(5, 'The simulator')) {
    mono(
      c,
      w.raw + ' units / ' + w.mature + '  =  ' + w.perThousand + ' per 1,000',
      193,
      687,
      49,
      C.red,
    );
  }
  if (s.at(5, 'The controller')) stamp(c, 'PROPOSE v3', 194, 807, C.red, 41);
}
export function checkRollout() {
  assert.notEqual(files[0], files[1]);
  const state = (beat, phrase) =>
    bundleState({ at: (n, p) => beat > n || (beat === n && p === phrase) });
  const today = state(3, ''),
    tomorrow = state(3, 'Tomorrow it can'),
    fixed = state(4, 'under immutable');
  assert.notEqual(today.file, tomorrow.file);
  assert.equal(today.m.hash, tomorrow.m.hash);
  assert.equal(fixed.file, fixed.m.fields.model);
  assert.notEqual(tomorrow.m.hash, fixed.m.hash);
  assert.notEqual(manifest(files[0]).hash, manifest(files[1]).hash);
  assert.deepEqual(
    [5, 25].map((v) => assignmentBuckets.filter((n) => n < v).length),
    [48, 257],
  );
  assert.ok(log.every((r) => jobBucket(r.id) === r.bucket));
  assert.equal(sum(log.filter((r) => r.bucket < 5).map((r) => r.requests)), 75);
  assert.deepEqual(
    offline.map((r) => [r.cost, r.recall]),
    [
      [60, 0.8],
      [40, 0.9],
    ],
  );
  assert.ok(fastMetrics().every((r) => r.pass));
  assert.equal(fastMetrics()[1].v, 100 * canary.errorRate);
  for (const [failed, n, errors, rate] of [
    [false, 500, 1, 0.2],
    [true, 600, 3, 0.5],
  ]) {
    const [volume, measured] = fastMetrics(failed);
    assert.deepEqual([volume.v, measured.counts.requests, measured.counts.errors], [n, n, errors]);
    assert.deepEqual([measured.v, measured.limit, measured.pass], [rate, 0.5, true]);
  }
  assert.deepEqual(
    fastMetrics(true)
      .filter((r) => !r.pass)
      .map((r) => r.name),
    ['Review queue'],
  );
}
