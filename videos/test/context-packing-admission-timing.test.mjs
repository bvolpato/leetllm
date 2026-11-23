import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw, sampleModel } from '../animations/context-packing.mjs';
import { drawFrame } from '../lib/scene.mjs';

const ids = ['admit-newest', 'middle-exchange', 'oldest-excluded'];
const stateAt = (beat, phase, progress, beatP = 0.01) => ({
  beat,
  beatP,
  opacity: 1,
  t: 1,
  duration: 60,
  cues: { [ids[beat]]: { phase, progress, strength: 0 } },
});
const paint = (state) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'complete-turns', title: 'Pack complete exchanges' },
    state,
    draw,
  );

test('spoken admission completes the same packet and its accounting before paragraph progress advances', () => {
  for (const [beat, expectedTotal, count] of [
    [0, 22, 1],
    [1, 30, 2],
  ]) {
    const state = stateAt(beat, 'after', 1),
      result = sampleModel('complete-turns', state);
    assert.equal(result.kept.length, count);
    assert.equal(result.total, expectedTotal);
    const frame = paint(state);
    assert(
      frame.labels.some(
        (label) =>
          label.text === `Input ${expectedTotal - 8} + output reserve 8 = ${expectedTotal} / 32`,
      ),
    );
    assert(
      frame.labels.some(
        (label) => label.text === (beat === 0 ? 'E3 newest' : 'E2 middle') && label.y >= 690,
      ),
    );
    assert(
      frame.targets.some(
        (target) =>
          target.id === `recent-exchange-${beat}` &&
          target.y === 690 &&
          target.markCounts.shapes > 0,
      ),
    );
  }
});

test('a late paragraph cannot admit the next exchange before its measured clause', () => {
  for (const beat of [0, 1]) {
    const state = stateAt(beat, 'before', 0, 0.99),
      result = sampleModel('complete-turns', state);
    assert.equal(result.kept.length, beat);
    assert.equal(result.total, beat === 0 ? 16 : 22);
  }
});

test('oldest rejection exposes the actual attempted total and retains both prior packets', () => {
  const state = stateAt(2, 'after', 1),
    result = sampleModel('complete-turns', state);
  assert.deepEqual(
    result.kept.map((item) => item.id),
    ['E3 newest', 'E2 middle'],
  );
  assert.deepEqual(
    result.dropped.map((item) => item.id),
    ['E1 oldest'],
  );
  assert.equal(result.total, 30);
  assert.equal(result.attemptedTotal, 42);
  assert(paint(state).labels.some((label) => label.text.includes('30 + 12 = 42 > 32')));
  for (const beatP of [0.01, 0.5, 0.99]) {
    const held = sampleModel('complete-turns', stateAt(2, 'after', 1, beatP));
    assert.equal(held.total, 30);
    assert.equal(held.remaining, 2);
    assert.equal(held.dropped[0].id, 'E1 oldest');
  }
});
