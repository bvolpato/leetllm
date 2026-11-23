import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  incidentOutcome,
  clusterDesignEffect,
  groundingPacket,
  freshGroundingReveal,
  mixtureEvidence,
  cupedVariance,
  pairedContrastVariance,
  planningPower,
  alphaSpend,
  abJoinProbe,
  receiptMismatches,
  draw,
} from '../animations/ab-testing.mjs';
const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);

test('the locked event window distinguishes pending, exact-deadline escalation and missing telemetry', () => {
  assert.equal(incidentOutcome({ observedMinutes: 9, usableAt: 8 }), 'pending');
  assert.equal(incidentOutcome({ observedMinutes: 10, usableAt: 8 }), 'resolved');
  assert.equal(incidentOutcome({ observedMinutes: 20, usableAt: 8, newPageAt: 10 }), 'unresolved');
  assert.equal(incidentOutcome({ observedMinutes: 20, usableAt: 8, newPageAt: 18 }), 'resolved');
  assert.equal(incidentOutcome({ observedMinutes: 20, usableAt: 12 }), 'unresolved');
  assert.equal(incidentOutcome({ observedMinutes: 20, usableAt: null }), 'unresolved');
  assert.equal(
    incidentOutcome({ observedMinutes: 20, usableAt: 8, telemetryComplete: false }),
    'unknown telemetry',
  );
});
test('the separate grounding packet changes evidence without changing its harm budget', () => {
  const original = groundingPacket(23),
    counterfactual = groundingPacket(18);
  assert.equal(original.passes, false);
  assert.equal(counterfactual.passes, true);
  close(counterfactual.delta, -0.002);
  close(counterfactual.upper, 0.00416668455492901);
  assert.equal(original.treatmentFailures, 23);
  assert.throws(() => groundingPacket(-1));
  assert.throws(() => groundingPacket(2001));
});
test('fresh point, interval and full compact-gate reveals are independently held', () => {
  const cues = Object.fromEntries(
    ['fresh-grounding-delta', 'fresh-grounding-upper', 'fresh-grounding-pass'].map((id) => [
      id,
      { phase: 'before', progress: 0 },
    ]),
  );
  assert.deepEqual(freshGroundingReveal({ beat: 0, beatP: 1, cues }), {
    delta: false,
    upper: false,
    pass: false,
  });
  cues['fresh-grounding-delta'].phase = 'active';
  assert.deepEqual(freshGroundingReveal({ beat: 1, beatP: 0.99, cues }), {
    delta: true,
    upper: false,
    pass: false,
  });
  cues['fresh-grounding-upper'].phase = 'active';
  assert.deepEqual(freshGroundingReveal({ beat: 1, cues }), {
    delta: true,
    upper: true,
    pass: false,
  });
});
test('current likelihood may fall while a valid running maximum preserves the crossing', () => {
  const trace = mixtureEvidence();
  close(trace[10].current, 28.8330078125);
  close(trace[20].current, 0.5086707649579163);
  assert.equal(trace[20].maximum, trace[10].maximum);
  assert.equal(trace[20].p, trace[10].p);
  assert.ok(trace[20].p < 0.05);
  const fresh = mixtureEvidence([1, 1, 0], 0.5, [0.25, 0.75]);
  close(fresh.at(-1).current, 0.75);
  close(fresh.at(-1).maximum, 1.25);
  assert.throws(() => mixtureEvidence([2]));
});
test('covariance adjustments retain their sign and feasibility contracts', () => {
  close(clusterDesignEffect(20, 0.1), 2.9);
  assert.equal(cupedVariance(9, 4, 3), 6.75);
  assert.equal(cupedVariance(9, 4, -3), 6.75);
  assert.equal(pairedContrastVariance(16, 9, 10), 5);
  assert.equal(pairedContrastVariance(16, 9, -10), 45);
  assert.throws(() => cupedVariance(1, 1, 2));
  assert.throws(() => pairedContrastVariance(1, 1, 2));
});
test('the fuller normal planning model is distinct from the shortcut and launch floor', () => {
  close(planningPower(9246).power, 0.7962288083208978, 1e-6);
  assert.ok(planningPower(9335).power < 0.8);
  assert.ok(planningPower(9336).power >= 0.8);
  assert.throws(() => planningPower(0));
});
test('cumulative spending has a complete alpha budget without becoming lookwise p cutoffs', () => {
  assert.equal(alphaSpend(0), 0);
  close(alphaSpend(1), 0.05, 1e-6);
  assert.ok(alphaSpend(0.25) < alphaSpend(0.5));
  assert.ok(alphaSpend(0.5) < 0.05);
  assert.throws(() => alphaSpend(1.1));
});
test('declared decoder identity ignores object serialization order and catches actual changes', () => {
  const control = {
    index: 'i',
    generator: 'g',
    prompt: 'p',
    decoder: { selection: 'greedy', schema: 'v2' },
  };
  assert.deepEqual(
    receiptMismatches(control, { ...control, decoder: { schema: 'v2', selection: 'greedy' } }),
    [],
  );
  assert.deepEqual(
    receiptMismatches(control, { ...control, decoder: { selection: 'greedy', schema: 'v3' } }),
    ['decoder'],
  );
});

test('rendered join readouts follow the currently retained analysis IDs', () => {
  registerLessonFonts();
  const canvas = createCanvas(1920, 1080);
  for (const progress of [0, 1]) {
    const probe = abJoinProbe(progress);
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'srm', title: 'Join probe' },
      { beat: 2, beatP: progress, t: 10, duration: 30, opacity: 1 },
      draw,
    );
    const labels = frame.labels.map((l) => l.text);
    assert.ok(
      labels.includes(
        'Enrolled 2 C / 2 T → joined ' + probe.control + ' C / ' + probe.treatment + ' T',
      ),
    );
    assert.equal(labels.filter((l) => l === 'C2 · CONTROL').length, progress === 0 ? 2 : 1);
    assert.equal(labels.filter((l) => l === 'C2 missing').length, progress === 0 ? 0 : 1);
  }
});
