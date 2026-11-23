import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maskedMean,
  backpropagationStep,
  evaluateGate,
  GATE_CASES,
  actualModelComparison,
  trainingFrame,
  freshIntake,
  classifierCueProgress,
} from '../animations/capstone-fine-tuned-classifier.mjs';
const report = () => GATE_CASES.map((row) => ({ fixture_id: row.id, score: row.score }));
test('masking retains the live mean and rejects an empty live set', () => {
  assert.deepEqual(
    maskedMean(
      [
        [3, 1],
        [1, 3],
        [900, 900],
      ],
      [1, 1, 0],
    ),
    [2, 2],
  );
  assert.throws(() => maskedMean([[1, 2]], [0]), /live row/);
});
test('the token-gradient update and frozen branch share one head update', () => {
  const trained = backpropagationStep(),
    frozen = backpropagationStep({ trainEmbeddings: false });
  assert.deepEqual(trained.weights, frozen.weights);
  assert.deepEqual(trained.bias, frozen.bias);
  assert.deepEqual(trained.embeddings[0], [0, 0]);
  assert.deepEqual(trained.embeddings[3], [-1, 1]);
  assert(Math.abs(trained.de[1][0] - 0.36552928931500245) < 1e-12);
  assert(trained.probabilities[1] > frozen.probabilities[1]);
  assert.deepEqual(frozen.pooled, [1, 1]);
});
test('gate inventory errors reject before aggregation', () => {
  const base = report();
  assert.equal(evaluateGate(base.slice(1)).reason, 'missing');
  assert.equal(evaluateGate([...base, base[0]]).reason, 'duplicate');
  assert.equal(
    evaluateGate([...base, { fixture_id: 'easy-extra', score: 0 }]).reason,
    'unexpected',
  );
});
test('worker replacement labels and nonnumeric scores cannot clear the gate', () => {
  for (const score of [NaN, Infinity, true, '0.8', null, -0.1, 1.1])
    assert.equal(
      evaluateGate(report().map((r, i) => (i ? r : { ...r, score }))).reason,
      'invalid score',
    );
  assert.equal(
    evaluateGate(report().map((r, i) => (i ? r : { ...r, gold: 0 }))).reason,
    'submitted fields',
  );
});
test('trusted threshold changes the required miss without changing the fixture', () => {
  const base = report(),
    before = structuredClone(base);
  assert.equal(evaluateGate(base, 0.5).FN, 1);
  assert.equal(evaluateGate(base, 0.35).decision, 'eligible_for_shadow');
  assert.deepEqual(base, before);
});
test('actual fixed models fail different constraints on the same six cases', () => {
  const [baseline, tiny] = actualModelComparison();
  assert.deepEqual(
    baseline.rows.map((r) => r.fixture_id),
    tiny.rows.map((r) => r.fixture_id),
  );
  assert.deepEqual([baseline.result.TP, baseline.result.FN, baseline.result.FP], [3, 0, 3]);
  assert.deepEqual([tiny.result.TP, tiny.result.FN, tiny.result.FP], [1, 2, 0]);
  assert.equal(baseline.result.reason, 'review capacity');
  assert.equal(tiny.result.reason, 'required misses');
});
test('recorded optimizer endpoints retain padding and lower the same training loss', () => {
  const first = trainingFrame(0),
    last = trainingFrame(1);
  assert.equal(last.step, 80);
  assert(last.loss < first.loss);
  assert.deepEqual(last.embeddingRows.slice(3), first.embeddingRows.slice(3));
  assert.notDeepEqual(last.embeddingRows[0], first.embeddingRows[0]);
});
test('changed-input answers are independent explicit reveals', () => {
  const hidden = freshIntake();
  assert.equal(hidden.route, null);
  assert.equal(hidden.falseNegative, null);
  assert.equal(hidden.decision, null);
  assert.equal(hidden.approvedEffects, null);
  const route = freshIntake({ route: true });
  assert.equal(route.route, 'guarded_agent');
  assert.equal(route.decision, null);
  assert.equal(freshIntake({ effects: true }).approvedEffects, 0);
});
test('current-scene cues reject missing metadata instead of silently revealing', () => {
  assert.throws(
    () => classifierCueProgress({ cues: {} }, 'fresh-route'),
    /Missing current-scene cue/,
  );
  assert.equal(
    classifierCueProgress({ cues: { 'fresh-route': { progress: 0.25 } } }, 'fresh-route'),
    0.25,
  );
});
