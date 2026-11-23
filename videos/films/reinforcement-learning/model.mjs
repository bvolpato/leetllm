import {
  epsilonDecision,
  evidenceValue,
  indifferenceProbability,
  openingActions,
  reviewValue,
  unit,
} from './arithmetic.mjs';
import {
  abandonmentProbability,
  explorationActions,
  explorationDraws,
  gamma,
  mdpBefore,
  mdpEvent,
  returns,
  transitionSweepCrossoverProgress,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export const explorationEpisodes = Object.freeze(
  explorationDraws.map((draw, i) => ({
    id: 'E' + String(i + 1).padStart(2, '0'),
    ...epsilonDecision(draw.u, draw.v),
  })),
);
export function explorationLedger(completed) {
  const rows = explorationEpisodes.slice(0, completed);
  return {
    rows,
    counts: explorationActions.map(
      (_, action) => rows.filter((row) => row.action === action).length,
    ),
  };
}
export function valueIteration(sweeps = 3) {
  const values = {
    new_request: 0,
    evidence_ready: 0,
    review_queue: 0,
    closed: 0,
  };
  const snapshot = [];
  const transition = (reward, next) => reward + gamma * values[next];
  for (let i = 0; i < sweeps; i++) {
    const next = {
      ...values,
    };
    next.new_request = Math.max(...Object.values(openingActions(values)));
    next.evidence_ready = Math.max(transition(70, 'closed'), transition(-10, 'review_queue'));
    next.review_queue = transition(80, 'closed');
    Object.assign(values, next);
    snapshot.push({
      ...values,
    });
  }
  return snapshot;
}
export function valueIterationSnapshot(beat, beatP) {
  const sweeps = valueIteration(3);
  const count = beat === 0 ? 1 : beat === 1 ? (beatP < 0.48 ? 1 : 2) : 3;
  return {
    new_request: sweeps.slice(0, count).map((v) => v.new_request),
    evidence_ready: beat === 0 ? [] : sweeps.slice(0, count).map((v) => v.evidence_ready),
    review_queue: beat === 0 ? [] : sweeps.slice(0, count).map((v) => v.review_queue),
    count,
  };
}
export function learningSnapshot(beat, beatP) {
  const target = -4 + gamma * 70;
  const targetVisible = beat > 1 || (beat === 1 && beatP >= 0.2);
  const updateP = beat < 1 ? 0 : beat > 1 ? 1 : Math.max(0, Math.min(1, (beatP - 0.48) / 0.3));
  return {
    target,
    targetVisible,
    updateVisible: beat > 1 || (beat === 1 && beatP >= 0.48),
    updated: 0.5 * target * updateP,
  };
}
export function transitionSnapshot(beat, progress) {
  const sweepProgress = unit(progress);
  let probability = abandonmentProbability;
  if (beat === 1) {
    probability =
      sweepProgress <= transitionSweepCrossoverProgress
        ? (indifferenceProbability * sweepProgress) / transitionSweepCrossoverProgress
        : indifferenceProbability +
          ((abandonmentProbability - indifferenceProbability) *
            (sweepProgress - transitionSweepCrossoverProgress)) /
            (1 - transitionSweepCrossoverProgress);
  }
  const askReturn = evidenceValue(probability);
  const difference = askReturn - reviewValue;
  const choice =
    Math.abs(difference) < 1e-8 ? 'tie' : difference > 0 ? 'request evidence' : 'human review';
  return {
    probability,
    askReturn,
    reviewReturn: reviewValue,
    choice,
  };
}
export function observeEnvironment(before, action, event) {
  assert.equal(before.stage, 'new request');
  assert.equal(event.request, before.request);
  assert(Number.isFinite(before.elapsedWait) && before.elapsedWait >= 0);
  assert(Number.isFinite(event.elapsed) && event.elapsed >= 0);
  assert.equal(action, 'ask evidence');
  assert(['evidence received', 'abandoned'].includes(event.outcome));
  return {
    request: before.request,
    stage: event.outcome === 'evidence received' ? 'evidence ready' : 'closed',
    elapsedWait: before.elapsedWait + event.elapsed,
    reward: event.outcome === 'evidence received' ? -4 : -54,
    receipt: event.id,
  };
}
export function mdpSnapshot(beat, beatP) {
  const fieldVisible = beat > 1 || (beat === 1 && beatP >= 0.603);
  const elapsedWait =
    beat > 1 ? 45 : beat === 1 ? Math.round(45 * unit((beatP - 0.603) / 0.245)) : 0;
  const actionProgress = beat < 2 ? 0 : unit((beatP - 0.2663) / 0.11);
  const environmentReady = beat >= 2 && beatP >= 0.499;
  const returnProgress = beat < 2 ? 0 : unit((beatP - 0.499) / 0.06);
  const observed = returnProgress >= 1;
  const receipt = environmentReady ? observeEnvironment(mdpBefore, 'ask evidence', mdpEvent) : null;
  return {
    fieldVisible,
    elapsedWait,
    actionProgress,
    environmentReady,
    returnProgress,
    observed,
    receipt,
    current: observed ? receipt : mdpBefore,
  };
}
export function validateModel() {
  assert.equal(epsilonDecision(0.09, 0.91).action, 2);
  assert.equal(epsilonDecision(0.15, 0.08).action, 0);
  assert.equal(epsilonDecision(0.1, 0.5).action, 1);
  assert.equal(epsilonDecision(0.71).action, 1);
  assert.deepEqual(explorationLedger(0).counts, [0, 0, 0]);
  assert.deepEqual(explorationLedger(2).counts, [0, 1, 1]);
  assert.deepEqual(explorationLedger(8).counts, [1, 6, 1]);
  for (let count = 0; count <= 8; count++)
    assert.equal(
      explorationLedger(count).counts.reduce((a, b) => a + b, 0),
      count,
    );
  assert.deepEqual(returns, {
    approve: -120,
    evidence: 59,
    review: 54,
    evidenceReadyHuman: 62,
  });
  assert.ok(Math.abs(evidenceValue(0.25) - 30.75) < 1e-12);
  assert.ok(Math.abs(indifferenceProbability - 5 / 113) < 1e-12);
  const sweeps = valueIteration(3);
  assert.equal(sweeps[0].new_request, -4);
  assert.equal(sweeps[1].new_request, 59);
  assert.equal(sweeps[2].new_request, 59);
  assert.equal(sweeps[0].review_queue, 80);
  for (const values of [
    {
      closed: 0,
      evidence_ready: 0,
      review_queue: 0,
    },
    sweeps[0],
  ]) {
    const actions = openingActions(values);
    assert(actions.evidence > actions.approve && actions.evidence > actions.review);
  }
  for (const beatP of [0, 0.25, 0.5, 0.75, 0.99]) {
    assert.deepEqual(valueIterationSnapshot(0, beatP).new_request, [-4]);
    assert.deepEqual(valueIterationSnapshot(0, beatP).evidence_ready, []);
    assert.equal(learningSnapshot(0, beatP).targetVisible, false);
    assert.equal(learningSnapshot(0, beatP).updateVisible, false);
  }
  assert.deepEqual(valueIterationSnapshot(1, 0.25), {
    new_request: [-4],
    evidence_ready: [70],
    review_queue: [80],
    count: 1,
  });
  assert.deepEqual(valueIterationSnapshot(1, 0.75).new_request, [-4, 59]);
  assert.equal(learningSnapshot(1, 0.3).targetVisible, true);
  assert.equal(learningSnapshot(1, 0.3).updateVisible, false);
  assert.ok(Math.abs(learningSnapshot(1, 0.63).updated - 14.75) < 1e-12);
  assert.equal(learningSnapshot(2, 0).updated, 29.5);
  const lowAbandonment = transitionSnapshot(1, 0.41);
  const crossover = transitionSnapshot(1, transitionSweepCrossoverProgress);
  const highAbandonment = transitionSnapshot(1, 0.43);
  const currentScenario = transitionSnapshot(0, 0.5);
  assert.ok(lowAbandonment.askReturn > lowAbandonment.reviewReturn);
  assert.equal(crossover.probability, indifferenceProbability);
  assert.equal(crossover.choice, 'tie');
  assert.ok(highAbandonment.askReturn < highAbandonment.reviewReturn);
  assert.equal(currentScenario.probability, abandonmentProbability);
  assert.equal(currentScenario.askReturn, 30.75);
  assert.equal(currentScenario.choice, 'human review');
  assert.deepEqual(observeEnvironment(mdpBefore, 'ask evidence', mdpEvent), {
    request: 'REQ-10234',
    stage: 'evidence ready',
    elapsedWait: 65,
    reward: -4,
    receipt: 'E17',
  });
  assert.equal(
    observeEnvironment(mdpBefore, 'ask evidence', {
      ...mdpEvent,
      outcome: 'abandoned',
    }).reward,
    -54,
  );
  assert.throws(() =>
    observeEnvironment(mdpBefore, 'ask evidence', {
      ...mdpEvent,
      request: 'other',
    }),
  );
  assert.throws(() =>
    observeEnvironment(mdpBefore, 'ask evidence', {
      ...mdpEvent,
      elapsed: NaN,
    }),
  );
  assert.throws(() => observeEnvironment(mdpBefore, 'approve', mdpEvent));
  assert.equal(mdpSnapshot(1, 0.5).fieldVisible, false);
  assert.equal(mdpSnapshot(1, 0.7).elapsedWait, 18);
  assert.equal(mdpSnapshot(1, 0.99).elapsedWait, 45);
  assert.equal(mdpSnapshot(2, 0.45).receipt, null);
  assert.equal(mdpSnapshot(2, 0.52).current.stage, 'new request');
  assert.equal(mdpSnapshot(2, 0.6).current.stage, 'evidence ready');
  assert.equal(mdpSnapshot(2, 0.6).current.elapsedWait, 65);
  return true;
}
