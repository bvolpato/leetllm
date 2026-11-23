import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  draw,
  memoryRecipe,
  paddedWorkingSet,
  tokenObjective,
  ringSends,
  accumulationContract,
  sampleModel,
  gradientGate,
} from '../animations/deep-dive-deepspeed.mjs';

test('different gradient precision changes owned storage while full gathered buffers coexist', () => {
  assert.equal(memoryRecipe(2, 8, 2, 4, 12, 2).total, 8);
  assert.equal(memoryRecipe(2, 8, 2, 4, 12, 3).total, 4.5);
  assert.deepEqual(paddedWorkingSet([7, 10, 3], 3, [1]), {
    shards: [3, 4, 1],
    padded: [9, 12, 3],
    resident: 8,
    gathered: 12,
    total: 20,
  });
  assert.equal(paddedWorkingSet([7, 10, 3], 3, [1, 0]).total, 29);
});

test('the valid-token objective and microstep contract preserve different weighting and clocks', () => {
  const objective = tokenObjective([-1, 5], [1, 3]);
  assert.equal(objective.mean, 3.5);
  assert.equal(objective.equalRank, 2);
  assert.deepEqual(accumulationContract(8, 1, 8, true), {
    backwards: 8,
    microsteps: 1,
    updates: 0,
  });
  assert.equal(accumulationContract(8, 8, 8, true).updates, 1);
  assert.equal(accumulationContract(8, 1, 8, false).updates, 1);
  assert.equal(ringSends(24, 3, 1), 16);
  assert.equal(ringSends(24, 3, 3), 48);
});

test('prefetch allocation begins on its own spoken operation instead of the beat boundary', () => {
  const id = 'ds-gather-b2-s0';
  assert.equal(
    sampleModel('gather', { beat: 2, beatP: 0.7, cues: { [id]: { phase: 'before', progress: 0 } } })
      .total,
    16,
  );
  assert.equal(
    sampleModel('gather', {
      beat: 2,
      beatP: 0.7,
      cues: { [id]: { phase: 'during', progress: 0.1 } },
    }).total,
    24,
  );
});

test('a known expected gradient is not a received contribution and both update gates are required', () => {
  assert.deepEqual(gradientGate(true, [1, null]), {
    ready: false,
    gradient: null,
    next: [1, 0, 0],
  });
  assert.equal(gradientGate(false, [1, 3]).ready, false);
  assert.equal(gradientGate(true, [1, true]).ready, false);
  const received = gradientGate(true, [1, 3]);
  assert.equal(received.gradient, 2);
  assert.equal(received.next[1], 0.2);
  assert.equal(received.next[2], 0.004);
  assert(Math.abs(received.next[0] - 0.99) < 1e-9);
});

test('new working-set prediction conceals padded capacities and reveals only completed arithmetic', async () => {
  const lesson = await readRepositoryLesson('videos/lessons/deep-dive-deepspeed.lesson.yaml');
  const scene = lesson.scenes.find((s) => s.id === 'fresh-plan');
  const cues = Object.fromEntries(
    scene.beats.flatMap((b) =>
      (b.visual_cues ?? []).map((c) => [c.id, { phase: 'before', progress: 0 }]),
    ),
  );
  function paint(beat, done = []) {
    const texts = [],
      grids = [],
      current = structuredClone(cues);
    for (const id of done) current[id] = { phase: 'after', progress: 1 };
    const api = {
      C: new Proxy({}, { get: (_, key) => String(key) }),
      focus: { target: (_, fn) => fn() },
      text: (_, v) => texts.push(String(v)),
      rect() {},
      line() {},
      arrow() {},
      path() {},
      components: {
        card: (o) => {
          texts.push(String(o.label));
          return o;
        },
        particle() {},
      },
      teaching: {
        grid: (o) => {
          grids.push(o.labels);
          return o;
        },
      },
    };
    draw({}, scene, { beat, beatP: 0.99, cues: current }, api);
    return { labels: texts, grids };
  }
  const held = paint(0);
  assert(held.grids.every((rows) => rows[0].length === 3));
  assert(!held.labels.some((v) => v.startsWith('Live parameter elements:')));
  const resident = paint(1, ['ds-fresh-plan-b1-s0']);
  assert(resident.labels.includes('Live parameter elements: 3 + 4 + 2 = 9'));
  assert(!resident.grids.some((rows) => rows[0].length === 12));
  const gather = paint(1, ['ds-fresh-plan-b1-s0', 'ds-fresh-plan-b1-s1']);
  assert(gather.labels.includes('Live parameter elements: 9 + 12 = 21'));
  assert(!gather.grids.some((rows) => rows[0].length === 9));
  const final = paint(1, ['ds-fresh-plan-b1-s0', 'ds-fresh-plan-b1-s1', 'ds-fresh-plan-b1-s2']);
  assert(final.labels.includes('Live parameter elements: 9 + 12 + 9 = 30'));
});
