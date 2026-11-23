import {
  advise,
  coverage,
  eligible,
  memory,
  stopReason,
  puctWorksheet,
  visitScore,
} from './arithmetic.mjs';
import { deadlineLedger } from './tokens.mjs';
import { candidates, observation, steps } from './fixtures.mjs';
import { budgetTrace, inspect, sampleModel, search } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(advise(null), 'NEED EVIDENCE');
  assert.equal(advise(observation), 'HOLD');
  assert.equal(
    advise({
      ...observation,
      latency: 300,
    }),
    'ROLLBACK',
  );
  for (const beatP of [0, 0.25, 0.5, 0.98]) {
    const boundary = sampleModel({
      beat: 1,
      beatP,
    });
    assert.equal(boundary.latency, 300);
    assert.equal(
      advise({
        ...observation,
        latency: boundary.latency,
      }),
      'ROLLBACK',
    );
  }
  assert.equal(
    advise({
      ...observation,
      latency: 199,
    }),
    'CONTINUE',
  );
  assert.equal(
    advise({
      ...observation,
      revision: 6,
    }),
    'REJECT RECORD',
  );
  assert.equal(
    advise({
      ...observation,
      smoke: 'true',
    }),
    'REJECT RECORD',
  );
  assert.equal(advise(observation, 131), 'REFRESH EVIDENCE');
  assert.equal(advise(observation, 130), 'HOLD');
  assert.equal(advise({ ...observation, observedAt: 99 }, 130), 'REFRESH EVIDENCE');
  const otherBranch = visitScore(0.5, 0.15, 17, 1);
  assert.ok(puctWorksheet().total > visitScore(0.5, 0.15, 16, 1).total);
  assert.ok(puctWorksheet(true, 1).total > otherBranch.total);
  assert.ok(puctWorksheet(true, 0).total < otherBranch.total);
  assert.equal(puctWorksheet(true, 1).bonus, puctWorksheet(true, 0).bonus);
  const { initial, receipt, admitted } = deadlineLedger();
  assert.deepEqual([initial.free, receipt.free, admitted.free], [1100, 1700, 200]);
  assert.equal(
    admitted.reservations.reduce((total, x) => total + x.value, 0),
    3500,
  );
  assert.ok(Math.abs(coverage(0.3, 5) - 0.83193) < 1e-12);
  assert.ok(Math.abs(coverage(1e-20, 100) - 1e-18) < 1e-30);
  assert.equal(coverage(1, 0), 0);
  assert.equal(eligible(candidates[0].path), false);
  assert.equal(eligible(candidates[1].path), true);
  assert.equal(search(0).winner, null);
  assert.equal(search(1).winner, null);
  assert.equal(search(2).winner.name, 'Patch sanitizer');
  assert.equal(search(5).winner.name, 'Patch sanitizer');
  assert.equal(search(2).completed.length, 2);
  assert.ok(search(2).rounds[1].pruned.includes('Defer security fix'));
  assert.equal(inspect(steps).checked.length, 3);
  assert.throws(() =>
    inspect([
      {
        score: 0.9,
        exact: 'false',
      },
    ]),
  );
  assert.throws(() =>
    inspect([
      {
        score: NaN,
        exact: true,
      },
    ]),
  );
  const budgets = budgetTrace();
  assert.deepEqual(
    budgets.map((v) => v.free),
    [1000, 1600, 100],
  );
  for (const row of budgets)
    assert.ok(row.spent + row.reservations.reduce((a, b) => a + b.value, 0) <= 4000);
  assert.equal(memory().bytesPerToken, 327680);
  assert.equal(memory().unshared, 40);
  assert.equal(memory().shared, 13.75);
  assert.equal(
    stopReason({
      repeat: true,
    }),
    'REPEATED STATE',
  );
  assert.equal(
    stopReason({
      used: 4000,
    }),
    'TOKEN CAP',
  );
  assert.equal(
    stopReason({
      elapsed: 3000,
    }),
    'WALL-CLOCK CAP',
  );
  assert.equal(
    stopReason({
      scores: [0.72, 0.7, 0.71, 0.69],
    }),
    'NO RECENT IMPROVEMENT',
  );
  assert.equal(
    stopReason({
      scores: [0.4, 0.55],
    }),
    'CONTINUE',
  );
  assert.equal(
    sampleModel({
      beat: 0,
      beatP: 1,
    }).n,
    5,
  );
  return true;
}
