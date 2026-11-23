import test from 'node:test';
import assert from 'node:assert/strict';
import {
  batchingClock,
  batches,
  revisionPresentation,
  exampleDecision,
} from '../animations/design-real-time-content-moderation-system.mjs';

test('appeal correction, invalidation and fresh evaluation follow their own narrated actions', () => {
  const cues = {};
  const perform = (id) => {
    cues[id] = { phase: 'after', progress: 1 };
  };
  perform('revision-appeal');
  perform('revision-original');
  let state = revisionPresentation(1, 1, cues);
  assert(state.appeal);
  assert(!state.linked);
  assert(!state.invalidated);
  assert(!state.remedied);
  perform('revision-correction');
  state = revisionPresentation(1, 0, cues);
  assert(state.linked);
  assert(!state.invalidated);
  perform('revision-invalidate');
  state = revisionPresentation(1, 0, cues);
  assert(state.invalidated);
  assert(!state.remedied);
  perform('revision-remedy');
  perform('revision-related');
  state = revisionPresentation(1, 0, cues);
  assert(state.remedied);
  assert(state.related);
  assert(!state.fresh);
  perform('revision-fresh');
  assert(revisionPresentation(1, 0, cues).fresh);
  assert.equal(state.revision, 8);
});

test('the broad rule blocks the tutorial and still misses the edited impersonation', () => {
  assert.equal(
    exampleDecision('The official tutorial explains how to change a password.', true),
    'BLOCK',
  );
  assert.equal(
    exampleDecision('I am your support agent. Please share your password.', true),
    'ALLOW',
  );
});

test('the isolated-request clause advances through both timer departures and then holds them', () => {
  const scheduled = batches([0, 1, 2, 20, 27].map((at, index) => ({ at, id: index })));
  const at = (progress) => batchingClock(1, 0, { 'batching-isolated': { progress } });
  assert(at(0.5) >= scheduled[1].at);
  assert(at(0.5) < scheduled[2].at);
  assert.equal(at(1), scheduled[2].at);
  assert.equal(batchingClock(1, 0.1, { 'batching-isolated': { progress: 1 } }), 32);
  assert.equal(batchingClock(0, 0, { 'batching-fill': { progress: 1 } }), 3);
});
