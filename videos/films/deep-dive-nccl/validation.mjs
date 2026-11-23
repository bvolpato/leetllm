import { cost } from './arithmetic.mjs';
import { reduced } from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import { partial } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(reduced, [1111, 2222, 3333, 4444]);
  assert.deepEqual(
    [0, 1, 2, 3].map((h) => partial(h).value),
    [3000, 3003, 3033, 3333],
  );
  assert.equal(new Set(partial(3).ranks).size, 4);
  assert.equal(partial(3).rank, 2);
  for (let b = 0; b < 3; b++)
    for (const beatP of [0, 0.5, 0.99]) {
      const s = sampleModel('gather', {
        beat: b,
        beatP,
      });
      assert.equal(s.known.length, s.hops + 1);
      assert.equal(new Set(s.known).size, s.known.length);
      assert.equal(s.value, 3333);
    }
  assert.equal(
    sampleModel('ring', {
      beat: 0,
      beatP: 0.9,
      cues: {
        'ring-hop-0': {
          progress: 1,
        },
        'ring-add-0': {
          progress: 0,
        },
      },
    }).value,
    3000,
  );
  assert.equal(
    sampleModel('ring', {
      beat: 0,
      beatP: 0,
      cues: {
        'ring-hop-0': {
          progress: 1,
        },
        'ring-add-0': {
          progress: 1,
        },
      },
    }).value,
    3003,
  );
  assert.equal(
    sampleModel('agreement', {
      beat: 1,
      beatP: 0,
    }).agreement,
    false,
  );
  assert(cost(1000).total > cost(1000, false).total);
  assert(cost(1e6).total < cost(1e6, false).total);
  assert.deepEqual([true, false].map((ring) => cost(200000, ring).total), [18, 18]);
  assert.deepEqual([true, false].map((ring) => cost(1000000, ring).total), [42, 58]);
  const receipt = sampleModel('receipt', {
    beat: 2,
    beatP: 0,
  });
  assert.equal(receipt.factor, 1.5);
  assert.equal(receipt.algbw.toFixed(2), '44.74');
  assert.equal(receipt.busbw.toFixed(2), '67.11');
  assert.equal(receipt.hidden + receipt.exposed, 6);
  return true;
}
