import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import * as safety from '../animations/safety-guardrails.mjs';

registerLessonFonts();
const paint = (id, beat, beatP) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Guardrail state' },
    { t: 1, duration: 20, opacity: 1, beat, beatP },
    safety.draw,
  );

test('policy outcomes wait for identified requests to capture their revisions', () => {
  const before = paint('policy-snapshot', 0, 0.9);
  assert(!before.labels.some((label) => /block|allow/i.test(label.text)));
  const captured = safety.policySnapshot(1, 1);
  assert.equal(captured.r1.policy.revision, 'policy-7');
  assert.equal(captured.r1.decision.admitted, false);
  assert.equal(captured.r2, null);
  const reloaded = safety.policySnapshot(2, 1);
  assert.equal(reloaded.active.revision, 'policy-8');
  assert.equal(reloaded.r1.policy.revision, 'policy-7');
  assert.equal(reloaded.r1.policy.injectionThreshold, 0.8);
  assert.equal(reloaded.r1.decision.admitted, false);
  assert.equal(reloaded.r2.policy.revision, 'policy-8');
  assert.equal(reloaded.r2.decision.admitted, true);
});

test('the same request clock preserves the draft boundary and never rewinds across paragraphs', () => {
  const beforeReview = safety.latencySnapshot(0, 1),
    reviewStart = safety.latencySnapshot(1, 0);
  assert.equal(beforeReview.elapsed, 2600);
  assert.deepEqual(reviewStart, beforeReview);
  assert.equal(beforeReview.draftReady, true);
  assert.equal(beforeReview.released, false);
  let previous = 0;
  for (const beat of [0, 1, 2])
    for (let i = 0; i <= 100; i++) {
      const state = safety.latencySnapshot(beat, i / 100);
      assert(state.elapsed >= previous);
      assert.equal(
        state.intervals.reduce((sum, stage) => sum + stage.elapsed, 0),
        state.elapsed,
      );
      assert.equal(state.released, state.elapsed === 3000);
      previous = state.elapsed;
    }
});

test('review completes on its spoken clause before the retained request is released', () => {
  const held = paint('order-and-latency', 1, 4 / 10.854);
  assert(held.labels.some((label) => label.text === '2600 ms · Draft held for output review'));
  assert.equal(safety.latencySnapshot(1, 5.9 / 10.854).reviewComplete, true);
  assert.equal(safety.latencySnapshot(1, 5.9 / 10.854).released, false);
  const released = paint('order-and-latency', 1, 6.45 / 10.854);
  assert(released.labels.some((label) => label.text === '3000 ms · Text released'));
  assert.deepEqual(safety.latencySnapshot(1, 1), safety.latencySnapshot(2, 0));
});
