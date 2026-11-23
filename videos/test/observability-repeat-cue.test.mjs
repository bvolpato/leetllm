import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleModel, draw } from '../animations/observability-monitoring-llm-systems.mjs';

const at = (progress, changed = false) => ({
  beat: 0,
  beatP: 0.34,
  cues: {
    'repeat-observations': { phase: progress === 1 ? 'after' : 'active', progress },
    'changed-marker': { phase: changed ? 'after' : 'before', progress: changed ? 1 : 0 },
  },
});

test('the measured observation clause advances the actual dispatch guard to its third receipt', () => {
  for (const [progress, count] of [
    [0.01, 1],
    [0.4, 2],
    [0.95, 3],
    [1, 3],
  ]) {
    const state = sampleModel('budget', at(progress));
    assert.equal(state.observations.length, count);
    assert.equal(state.repeats, count);
    assert.equal(state.dispatch.executed, count < 3);
    assert.equal(state.callbackExecutions, count < 3 ? 1 : 0);
  }
  assert.equal(sampleModel('budget', { ...at(1), beatP: 0.7 }).stopped, true);
  const changed = sampleModel('budget', at(1, true));
  assert.equal(changed.repeats, 1);
  assert.equal(changed.observations[2][2], 'scan:18');
  assert.equal(changed.dispatch.executed, true);
});

test('the actual painter displays all three observations and the blocked callback at clause completion', () => {
  const labels = [],
    cards = [];
  draw({}, { id: 'budget' }, at(0.95), {
    C: {
      blue: 'blue',
      green: 'green',
      pink: 'pink',
      yellow: 'yellow',
      muted: 'gray',
      ink: 'white',
      panel: 'navy',
    },
    focus: { target: (_id, paint) => paint() },
    teaching: {},
    components: { card: (spec) => cards.push(spec.label) },
    text: (_ctx, label) => labels.push(label),
    math: () => {},
  });
  assert.equal(cards.length, 3);
  assert.ok(labels.includes('Consecutive same state 3 / 3 · STOP before another call'));
  assert.ok(labels.includes('Simulated guarded dispatch · callback executions 0'));
});
