import { rate, requiredN } from './arithmetic.mjs';
import { AB_VISUAL_FIXTURES, report } from './fixtures.mjs';
import {
  accumulatedOutcomes,
  alphaSpend,
  assignedArm,
  assignmentTrace,
  clusterDesignEffect,
  cupedVariance,
  freshGroundingReveal,
  groundingDelta,
  groundingPacket,
  groundingUpper,
  incidentOutcome,
  lift,
  liftInterval,
  mixtureEvidence,
  pairedContrastVariance,
  planningPower,
  projectedInterval,
  seLift,
  srmChiSquare,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateABExpansion();
  assert.equal(
    assignmentTrace({
      beat: 0,
      beatP: 0,
    }).hashVisible,
    false,
  );
  assert.equal(
    assignmentTrace({
      beat: 0,
      beatP: 0.3,
    }).hashVisible,
    true,
  );
  assert.equal(
    assignmentTrace({
      beat: 0,
      beatP: 0.3,
    }).armVisible,
    false,
  );
  assert.equal(
    assignmentTrace({
      beat: 0,
      beatP: 0.6,
    }).assignmentWrites,
    1,
  );
  for (const beat of [1, 2]) {
    const trace = assignmentTrace({
      beat,
      beatP: 0,
    });
    assert.equal(trace.incident, 'inc-17');
    assert.equal(trace.hashByte, 226);
    assert.equal(trace.arm, 0);
    assert.equal(trace.laterMessageArm, trace.arm);
    assert.equal(trace.assignmentWrites, 1);
    assert.equal(trace.messageProgress, 1);
  }
  assert.equal(assignedArm('inc-17'), 0);
  assert.equal(assignedArm('inc-42'), 1);
  assert.equal(rate(report.control), 0.38);
  assert.equal(rate(report.treatment), 0.42);
  assert.ok(Math.abs(lift - 0.04) < 1e-12);
  assert.ok(Math.abs(seLift - 0.01548) < 0.00001);
  assert.ok(Math.abs(liftInterval[0] - 0.00966) < 0.0001);
  assert.ok(Math.abs(liftInterval[1] - 0.07034) < 0.0001);
  assert.equal(report.treatment.p95 - report.control.p95, 80);
  assert.ok(Math.abs(report.treatment.pages / 2000 - report.control.pages / 2000 + 0.002) < 1e-12);
  assert.ok(Math.abs(groundingDelta - 0.0005) < 1e-12);
  assert.ok(Math.abs(groundingUpper - 0.007) < 0.0001);
  assert.ok(requiredN(0.38, 0.02) > 9000 && requiredN(0.38, 0.02) < 9500);
  assert.equal(srmChiSquare, 122.5);
  for (const arm of Object.values(report)) {
    let previous = accumulatedOutcomes(arm, 0);
    for (let i = 1; i <= arm.n; i++) {
      const next = accumulatedOutcomes(arm, i / arm.n);
      assert.equal(next.n - previous.n, 1);
      assert.ok([0, 1].includes(next.resolved - previous.resolved));
      assert.equal(next.rate, next.resolved / next.n);
      previous = next;
    }
    assert.equal(previous.resolved, arm.resolved);
  }
  assert.ok(
    projectedInterval(200).high - projectedInterval(200).low >
      projectedInterval(2000).high - projectedInterval(2000).low,
  );
  assert.ok(Math.abs(projectedInterval(2000).low - liftInterval[0]) < 1e-12);
  return true;
}
export function validateABExpansion() {
  assert.equal(
    incidentOutcome({
      observedMinutes: 9,
      usableAt: 8,
    }),
    'pending',
  );
  assert.equal(
    incidentOutcome({
      observedMinutes: 10,
      usableAt: 8,
    }),
    'resolved',
  );
  assert.equal(
    incidentOutcome({
      observedMinutes: 20,
      usableAt: 8,
      newPageAt: 10,
    }),
    'unresolved',
  );
  assert.equal(
    incidentOutcome({
      observedMinutes: 20,
      usableAt: 8,
      newPageAt: 18,
    }),
    'resolved',
  );
  assert.equal(
    incidentOutcome({
      observedMinutes: 20,
      usableAt: null,
    }),
    'unresolved',
  );
  assert.equal(
    incidentOutcome({
      observedMinutes: 20,
      usableAt: 8,
      telemetryComplete: false,
    }),
    'unknown telemetry',
  );
  assert.ok(Math.abs(clusterDesignEffect(20, 0.1) - 2.9) < 1e-12);
  assert.equal(groundingPacket().passes, false);
  assert.equal(groundingPacket(18).passes, true);
  assert.ok(Math.abs(groundingPacket(18).upper - 0.00416668455492901) < 1e-12);
  const mixture = mixtureEvidence();
  assert.ok(Math.abs(mixture[10].current - 28.8330078125) < 1e-9);
  assert.ok(Math.abs(mixture[20].current - 0.5086707649579163) < 1e-8);
  assert.equal(mixture[20].maximum, mixture[10].maximum);
  assert.equal(mixture[20].p, mixture[10].p);
  assert.equal(cupedVariance(9, 4, 3), 6.75);
  assert.equal(cupedVariance(9, 4, -3), 6.75);
  assert.equal(pairedContrastVariance(16, 9, 10), 5);
  assert.ok(Math.abs(planningPower(9246).power - 0.7962288083208978) < 1e-6);
  assert.ok(planningPower(9336).power >= 0.8);
  assert.ok(Math.abs(alphaSpend(1) - 0.05) < 1e-6);
  const cues = Object.fromEntries(
    ['fresh-grounding-delta', 'fresh-grounding-upper', 'fresh-grounding-pass'].map((id) => [
      id,
      {
        phase: 'before',
        progress: 0,
      },
    ]),
  );
  assert.deepEqual(
    freshGroundingReveal({
      beat: 0,
      beatP: 1,
      cues,
    }),
    {
      delta: false,
      upper: false,
      pass: false,
    },
  );
  assert.equal(AB_VISUAL_FIXTURES.peeking.path[3].look, 4);
  assert.ok(AB_VISUAL_FIXTURES.peeking.path[3].z > 1.96);
  assert.ok(AB_VISUAL_FIXTURES.peeking.path.at(-1).z < 1.96);
  assert.deepEqual(AB_VISUAL_FIXTURES.peeking.alarms, [231, 708, 961, 1244]);
}
