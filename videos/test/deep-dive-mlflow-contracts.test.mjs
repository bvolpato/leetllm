import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assess,
  cacheClockTrace,
  canonicalContent,
  mergeIntervals,
  queueTimeline,
  sampleMlflowChapter,
} from '../animations/deep-dive-mlflow.mjs';

test('a required assessment join rejects duplicates, untyped passes and unexpected rows', () => {
  const passing = ['A', 'B', 'C'].map((id) => ({ id, pass: true }));
  assert.equal(assess(passing).promote, true);
  for (const rows of [
    [...passing, passing[0]],
    [...passing, { id: 'D', pass: true }],
    passing.map((row) => ({ ...row, pass: 1 })),
  ])
    assert.equal(assess(rows).promote, false);
  const failed = assess([
    { id: 'A', pass: true },
    { id: 'B', pass: false },
  ]);
  assert.deepEqual(failed.missing, ['C']);
  assert.equal(failed.coverage, 2 / 3);
  assert.equal(failed.mean, 0.5);
  assert.equal(assess([...failed.rows, { id: 'C', pass: true }]).promote, false);
});

test('the direct-child interval union excludes double-counted overlap', () => {
  const union = mergeIntervals([
    [200, 650],
    [0, 300],
  ]);
  assert.deepEqual(union, { intervals: [[0, 650]], duration: 650 });
  assert.equal(800 - union.duration, 150);
  assert.throws(() => mergeIntervals([[10, 5]]), /ordered/);
});

test('FIFO service conserves named traces and rejects reuse of an arrival identity', () => {
  const states = queueTimeline(
    4,
    ['A', 'B', 'C'],
    [
      { service: 2, arrivals: ['D', 'E', 'F', 'G'] },
      { service: 2, arrivals: ['H'] },
    ],
  );
  for (const state of states) {
    assert.equal(
      state.queue.length + state.sentIds.length + state.droppedIds.length,
      state.arrivedIds.length,
    );
    assert.equal(
      new Set([...state.queue, ...state.sentIds, ...state.droppedIds]).size,
      state.arrivedIds.length,
    );
  }
  assert.deepEqual(states.at(-1).sentIds, ['A', 'B', 'C', 'D']);
  assert.deepEqual(states.at(-1).queue, ['E', 'F', 'H']);
  assert.deepEqual(states.at(-1).droppedIds, ['G']);
  assert.throws(() => queueTimeline(2, ['A'], [{ service: 0, arrivals: ['A'] }]), /identity/);
});

test('cache keys, inclusive deadlines and explicit zero TTL preserve a held object', () => {
  const trace = cacheClockTrace();
  assert.equal(trace.states[2].value, 17);
  assert.equal(trace.states[2].refresh, false);
  assert.equal(trace.states[3].name, 'summary');
  assert.equal(trace.states[3].value, 5);
  assert.equal(trace.states[3].refresh, true);
  assert.equal(trace.states[4].value, 18);
  assert.equal(trace.states[5].refresh, true);
  assert.equal(trace.held.version, 17);
  assert.equal(
    canonicalContent({ temperature: 0.2, index: 'I9', prompt: 21 }),
    canonicalContent({ prompt: 21, temperature: 0.2, index: 'I9' }),
  );
});

test('fresh loaded values and mismatch verdict wait for their complete spoken clauses', () => {
  const predict = sampleMlflowChapter('fresh-config', { beat: 0, beatP: 1 });
  assert.equal(predict.registry, 0.8);
  assert.equal(predict.fresh, null);
  assert.equal(predict.mismatch, false);
  const cue = (phase, progress) => ({ phase, progress });
  const state = {
    beat: 1,
    beatP: 0.8,
    cues: {
      'mf-sentence-fresh-config-1-0': cue('after', 1),
      'mf-sentence-fresh-config-1-1': cue('active', 0.9),
      'mf-sentence-fresh-config-1-2': cue('before', 0),
    },
  };
  assert.equal(sampleMlflowChapter('fresh-config', state).fresh, null);
  state.cues['mf-sentence-fresh-config-1-1'] = cue('after', 1);
  assert.equal(sampleMlflowChapter('fresh-config', state).fresh, 0.8);
  assert.equal(sampleMlflowChapter('fresh-config', state).mismatch, false);
  state.cues['mf-sentence-fresh-config-1-2'] = cue('after', 1);
  assert.equal(sampleMlflowChapter('fresh-config', state).mismatch, true);
});

test('a later replay and timeout alter the actual ledger without erasing old losses', () => {
  const reveal = sampleMlflowChapter('fresh-telemetry', { beat: 1, beatP: 1 });
  assert.deepEqual(
    [reveal.sentIds.length, reveal.queue.length, reveal.droppedIds.length],
    [1, 2, 1],
  );
  const repair = sampleMlflowChapter('fresh-telemetry', { beat: 2, beatP: 1 });
  assert.deepEqual(repair.droppedIds, ['D']);
  assert.deepEqual(repair.sentIds, ['A', 'B', 'C', 'D′']);
  const timeout = sampleMlflowChapter('export-queue', { beat: 2, beatP: 1 });
  assert.deepEqual(timeout.queue, ['F', 'H']);
  assert.deepEqual(timeout.droppedIds, ['G', 'E']);
  assert.equal(
    timeout.arrivedIds.length,
    timeout.queue.length + timeout.sentIds.length + timeout.droppedIds.length,
  );
  sampleMlflowChapter('fresh-telemetry', { beat: 0, beatP: 0.2 });
  assert.deepEqual(sampleMlflowChapter('fresh-telemetry', { beat: 2, beatP: 1 }), repair);
});
