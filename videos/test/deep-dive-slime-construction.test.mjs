import test from 'node:test';
import assert from 'node:assert/strict';
import {
  momentumTrace,
  chooseSlimeCarrier,
  drainGroups,
  sampleSlimeChapter,
  validateModel,
} from '../animations/deep-dive-slime.mjs';
const near = (a, z) => assert(Math.abs(a - z) < 1e-12);

test('Slime replay restores both momentum and weight only with the missing retained update', () => {
  const start = { weight: 2, velocity: 0.1, step: 20 };
  const complete = momentumTrace(start, [0.3, -0.4]),
    skip = momentumTrace(start, [-0.4]);
  near(complete[1].velocity, 0.39);
  near(complete[1].weight, 1.922);
  near(complete[2].velocity, -0.049);
  near(complete[2].weight, 1.9318);
  near(skip[1].velocity, -0.31);
  near(skip[1].weight, 2.062);
  assert.notEqual(skip.at(-1).step, complete.at(-1).step);
  assert.deepEqual(start, { weight: 2, velocity: 0.1, step: 20 });
});
test('The selected mode and placement determine the real synchronization carrier', () => {
  assert.equal(chooseSlimeCarrier({ delta: true, disk: true, colocated: false }), 'delta disk');
  assert.equal(
    chooseSlimeCarrier({ delta: true, disk: true, colocated: true }),
    'reject configuration',
  );
  assert.equal(chooseSlimeCarrier({ delta: true, disk: false }), 'reject configuration');
  assert.equal(chooseSlimeCarrier({ disk: true, colocated: true }), 'full disk');
  assert.equal(chooseSlimeCarrier({ colocated: true }), 'tensor handles');
  assert.equal(chooseSlimeCarrier({}), 'NCCL chunks');
});
test('Drain sorts only its selected groups and preserves every surplus identity', () => {
  const groups = [
    { id: 'G5', index: 5 },
    { id: 'G2', index: 2 },
    { id: 'G4', index: 4 },
    { id: 'G1', index: 1 },
    { id: 'G3', index: 3 },
  ];
  const result = drainGroups(groups, 2);
  assert.deepEqual(
    result.taken.map((v) => v.id),
    ['G5', 'G2'],
  );
  assert.deepEqual(
    result.handedOff.map((v) => v.id),
    ['G2', 'G5'],
  );
  assert.deepEqual(
    result.surplus.map((v) => v.id),
    ['G4', 'G1', 'G3'],
  );
  assert.equal(new Set([...result.handedOff, ...result.surplus].map((v) => v.id)).size, 5);
  assert.equal(groups.length, 5);
});
test('Fresh results remain unknown during their clauses and the prediction hold', () => {
  const state = (beat, sentence, p) => ({
    beat,
    beatP: 0.9,
    cues: {
      [`sl-fresh-replay-b${beat}-s${sentence}`]: { phase: p < 1 ? 'during' : 'after', progress: p },
    },
  });
  const question = sampleSlimeChapter('fresh-replay', state(0, 5, 1));
  assert.equal(question.skipReady, false);
  assert.equal(question.finalReady, false);
  assert.equal(question.repaired, false);
  for (const p of [0, 0.01, 0.5, 0.999]) {
    const s = sampleSlimeChapter('fresh-replay', state(1, 1, p));
    assert.equal(s.skipReady, false);
  }
  assert.equal(sampleSlimeChapter('fresh-replay', state(1, 1, 1)).skipReady, true);
  const repair = sampleSlimeChapter('fresh-replay', state(2, 0, 1));
  near(repair.current.weight, 1.9318);
  near(repair.current.velocity, -0.049);
  assert.equal(repair.repaired, false);
  assert.equal(sampleSlimeChapter('fresh-replay', state(2, 1, 1)).repaired, true);
});
test('All declared chapter states are deterministic and preserve the original executable invariants', () => {
  assert.equal(validateModel(), true);
  for (let n = 0; n <= 100; n++) {
    const state = { beat: 2, beatP: n / 100 };
    assert.deepEqual(
      sampleSlimeChapter('fresh-replay', state),
      sampleSlimeChapter('fresh-replay', state),
    );
  }
});
