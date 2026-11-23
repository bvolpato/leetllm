import {
  exclusive,
  hierarchyCounts,
  reductionLevels,
  scanWork,
  shuffleRead,
} from './arithmetic.mjs';
import {
  ALL,
  ARTICLE_INPUT,
  ARTICLE_PREFIX,
  ATTENTION,
  BLELLOCH,
  FIRST,
  INPUT,
  LEFT,
  ODD_ROW,
  REDUCTION,
  RIGHT,
  SCAN,
  SHUFFLE,
  SWAPPED_ROW,
} from './fixtures.mjs';
import { boundaries } from './score-trace.mjs';
import { freshPrefixSnapshot, onlineRescale, scanTeachingSnapshot } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateExtendedModel();
  assert.deepEqual(REDUCTION, [[3, -1, 4, 1, 5, -9, 2, 6], [2, 5, -4, 8], [7, 4], [11]]);
  assert.deepEqual(reductionLevels([1, 2, 3]), [[1, 2, 3], [3, 3], [6]]);
  assert.deepEqual(SCAN.levels, [
    [3, -1, 4, 1],
    [3, 2, 3, 5],
    [3, 2, 6, 7],
  ]);
  assert.equal(SCAN.additions, 5);
  assert.equal(scanTeachingSnapshot(1, 0.43).round1, 1);
  assert.equal(scanTeachingSnapshot(1, 0.43).round2, 0);
  assert.equal(scanTeachingSnapshot(1, 0.94).round2, 1);
  for (let level = 1; level < SCAN.levels.length; level++)
    for (let lane = 0; lane < 4; lane++) {
      const stride = 2 ** (level - 1),
        previous = SCAN.levels[level - 1];
      assert.equal(
        SCAN.levels[level][lane],
        previous[lane] + (lane >= stride ? previous[lane - stride] : 0),
      );
    }
  assert.deepEqual(SHUFFLE.at(-1), Array(8).fill(INPUT.reduce((a, z) => a + z, 0)));
  assert.equal(shuffleRead(INPUT, 6, 1, new Set([0, 1, 2, 3, 4, 5, 6])), undefined);
  assert.equal(shuffleRead(INPUT, 6, 1, new Set(INPUT.map((_, i) => i))), 6);
  assert.ok(Math.abs(LEFT - 3.14) < 1e-6);
  assert.equal(RIGHT, 0);
  assert.equal(FIRST.maximum, 2);
  assert.equal(ALL.maximum, 4);
  assert.ok(
    Math.abs(ALL.denominator - [2, 1, 4, 0].reduce((sum, value) => sum + Math.exp(value - 4), 0)) <
      1e-12,
  );
  assert.ok(
    Math.abs(
      onlineRescale(1).oldContribution + onlineRescale(1).newContribution - ALL.denominator,
    ) < 1e-12,
  );
  assert.equal(onlineRescale(0.02).stage, 0);
  assert.equal(onlineRescale(0.35).stage, 1);
  assert.equal(onlineRescale(0.55).stage, 2);
  assert.equal(onlineRescale(0.75).stage, 3);
  assert.equal(onlineRescale(0.98).stage, 4);
  // The consumer may run only after both shared slots are written and every required participant arrives.
  const shared = [undefined, undefined],
    arrived = new Set();
  shared[0] = REDUCTION.at(-2)[0];
  arrived.add(0);
  const consume = () =>
    arrived.size === 2 && shared.every(Number.isFinite) ? shared[0] + shared[1] : null;
  assert.equal(consume(), null);
  shared[1] = REDUCTION.at(-2)[1];
  assert.equal(consume(), null);
  arrived.add(1);
  assert.equal(consume(), 11);
  return true;
}
export function validateExtendedModel() {
  assert.deepEqual(ARTICLE_PREFIX, [0, 3, 2, 6, 7, 12, 3, 5]);
  assert.equal(
    ARTICLE_INPUT.reduce((a, b) => a + b, 0),
    11,
  );
  assert.deepEqual(
    BLELLOCH.states.map((s) => s.values),
    [
      [3, -1, 4, 1],
      [3, 2, 4, 5],
      [3, 2, 4, 7],
      [3, 2, 4, 0],
      [3, 0, 4, 2],
      [0, 3, 2, 6],
    ],
  );
  assert.equal(BLELLOCH.total, 7);
  assert.deepEqual(hierarchyCounts(4194304), [8192, 16, 1]);
  assert.deepEqual(hierarchyCounts(262144), [512, 1]);
  assert.deepEqual(hierarchyCounts(262145), [513, 2, 1]);
  assert.deepEqual(scanWork(32), {
    hillis: 129,
    blelloch: 62,
    hillisStages: 5,
    blellochStages: 10,
  });
  assert.equal(scanWork(512).hillis, 4097);
  assert.equal(scanWork(512).blelloch, 1022);
  assert.deepEqual(exclusive([7, 4]), [0, 7]);
  assert.deepEqual(
    exclusive([5, -9, 2, 6]).map((v) => v + 7),
    [7, 12, 3, 5],
  );
  assert.deepEqual([2, 2 + 3, 2 + 3 + 4, 2 + 3 + 4 + 7], [2, 5, 9, 16]);
  assert.equal(16 - 2, 14);
  const flags = ARTICLE_INPUT.map((v) => Number(v > 0));
  assert.deepEqual(exclusive(flags), [0, 1, 1, 2, 3, 4, 4, 5]);
  assert.deepEqual(
    ARTICLE_INPUT.filter((v) => v > 0),
    [3, 4, 1, 5, 2, 6],
  );
  assert.deepEqual(
    [
      ARTICLE_INPUT.slice(0, 4).reduce((a, b) => a + b, 0),
      0,
      ARTICLE_INPUT.slice(4).reduce((a, b) => a + b, 0),
    ],
    [7, 0, 4],
  );
  assert.equal(Math.fround(Math.fround(Math.fround(1e8) + 1) + Math.fround(-1e8)), 0);
  assert.equal(Math.fround(Math.fround(Math.fround(1e8) + Math.fround(-1e8)) + 1), 1);
  assert.equal(2n ** 63n - 1n + 1n, 2n ** 63n);
  assert(Math.abs(ATTENTION.output[0] - 0.1538279106) < 1e-9);
  assert(Math.abs(ATTENTION.output.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.deepEqual(freshPrefixSnapshot(0, 0.99).output, null);
  assert.deepEqual(freshPrefixSnapshot(1, 0.9).output, [0, 2, -1, 4, 5, 3, 7]);
  assert.equal(freshPrefixSnapshot(1, 0.9).total, 13);
  assert.deepEqual(boundaries(ODD_ROW), [0, 2, -1, 4, 5, 3, 7, 13]);
  assert.deepEqual(boundaries(SWAPPED_ROW), [0, 2, -1, 4, 8, 6, 7, 13]);
  return true;
}
