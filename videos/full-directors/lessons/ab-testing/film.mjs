import assert from 'node:assert/strict';
import { Surface } from './workshop.mjs';
import { opening, routing, contrast, metric, maturity, lift, copies } from './incidents.mjs';
import { traffic, power, allocation, peeking, spending, likelihood } from './monitoring.mjs';
import { adjustment, bandit, pairing, judge } from './designs.mjs';
import { guardrails, practice, receipt, finalPractice } from './decisions.mjs';
import {
  assign,
  incidentOutcome,
  meter,
  split,
  groundingPacket,
  gate,
  sim,
  planningPower,
  alphaSpend,
  mixtureEvidence,
  cupedVariance,
  pairedContrastVariance,
  receiptMismatches,
  locked,
  shortcutEnrollment,
} from './evidence.mjs';

const chapters = [
  opening,
  routing,
  contrast,
  metric,
  maturity,
  lift,
  copies,
  traffic,
  power,
  allocation,
  peeking,
  spending,
  likelihood,
  adjustment,
  bandit,
  pairing,
  judge,
  guardrails,
  practice,
  receipt,
  finalPractice,
];
function draw(ctx, clock) {
  const s = new Surface(ctx);
  s.bed();
  chapters[clock.beat.chapterIndex](s, clock);
}
function check() {
  assert.deepEqual(
    ['inc-014', 'inc-001', 'inc-014'].map((id) => assign(id).bucket),
    [58, 27, 58],
  );
  const score = (time, page) =>
    incidentOutcome({ observedMinutes: time, usableAt: 8, newPageAt: page });
  assert.deepEqual(
    [score(9, 10), score(10, 10), score(18, 18)],
    ['pending', 'unresolved', 'resolved'],
  );
  const one = meter(),
    four = meter(4);
  assert.deepEqual(
    four.arms.map((a) => [a.resolved, a.n]),
    [
      [3040, 8000],
      [3360, 8000],
    ],
  );
  assert.deepEqual(
    one.arms.map((a) => [a.resolved, a.n]),
    [
      [760, 2000],
      [840, 2000],
    ],
  );
  assert.equal(four.delta, one.delta);
  assert.equal(four.se * 2, one.se);
  assert.deepEqual(
    [four.low, four.high, one.low, one.high].map((n) => n.toFixed(1)),
    ['2.5', '5.5', '1.0', '7.0'],
  );
  assert.equal(shortcutEnrollment, 9246);
  assert.equal((100 * planningPower(9246).power).toFixed(1), '79.6');
  assert.ok(planningPower(9336).power >= 0.8);
  assert.ok(planningPower(9335).power < 0.8);
  assert.deepEqual(
    [split([1650, 2350]), split([1900, 2100])].map((v) => [v.parts, v.total, v.alert]),
    [
      [[61.25, 61.25], 122.5, true],
      [[5, 5], 10, false],
    ],
  );
  assert.deepEqual(
    [3, 19].map((i) => sim.peeking.path[i].z.toFixed(2)),
    ['2.58', '1.61'],
  );
  assert.deepEqual(sim.peeking.alarms, [231, 708, 961, 1244]);
  assert.equal((100 * alphaSpend(0.5)).toFixed(2), '0.56');
  const m = mixtureEvidence();
  assert.deepEqual(
    [m[10].current, m[20].current, m[20].maximum].map((x) => x.toFixed(3)),
    ['28.833', '0.509', '28.833'],
  );
  assert.equal(m[20].p.toFixed(4), '0.0347');
  assert.equal(mixtureEvidence([1, 0])[2].current.toFixed(3), '0.833');
  assert.equal(cupedVariance(9, 4, 3), 6.75);
  assert.equal(pairedContrastVariance(9, 4, 3), 7);
  const { cuped, bandit } = sim,
    r = cuped.sampleRows[0];
  assert.equal((r.y - cuped.theta * (r.x - cuped.center)).toFixed(3), '0.747');
  assert.ok(bandit.pullTrace[0].sampleControl > bandit.pullTrace[0].sampleTreatment);
  assert.equal(bandit.pullTrace[0].betaC, 2);
  assert.deepEqual(
    receiptMismatches(locked, { ...locked, decoder: 'greedy / incident-answer-v3' }),
    ['decoder'],
  );
  for (const [n, d, hi, pass] of [
    [23, '0.05', '0.70', false],
    [18, '-0.20', '0.42', true],
  ]) {
    const p = groundingPacket(n);
    assert.equal((100 * p.delta).toFixed(2), d);
    assert.equal((100 * p.upper).toFixed(2), hi);
    assert.equal(p.passes, pass);
    assert.equal(gate({ failures: n }).launch, pass);
  }
  const practice = groundingPacket(18);
  assert.equal((100 * (practice.upper - practice.delta)).toFixed(2), '0.62');
  assert.equal(gate({ p95: 1490 }).ms, 310);
  assert.equal(gate({ p95: 1490 }).speed, false);
  assert.equal(gate({ target: 5 }).benefit, false);
  assert.deepEqual(gate({ alert: true }), { alert: true });
}
const captionStarts = {
  'c11-b02': [
    'two point five eight standard errors',
    'A team that stops on the first crossing',
    'would call that a difference',
    'This team planned',
    'Does the planned final look',
  ],
  'c11-b03': [
    'The earlier incidents',
    'At look twenty',
    'inside the lines',
    'Those two rules',
  ],
};
function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const starts = captionStarts[entry.beat.id];
    if (!starts) continue;
    for (const phrase of starts) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
export default {
  title: 'How to Tell Whether a Product Change Helped',
  draw,
  check,
  preparePicture: prepareCaptions,
};
