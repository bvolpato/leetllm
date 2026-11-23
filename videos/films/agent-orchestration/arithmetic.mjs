import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function readSchedule(elapsed) {
  const branches = [
    {
      id: 'Eval',
      duration: 2,
    },
    {
      id: 'Health',
      duration: 3,
    },
    {
      id: 'Policy',
      duration: 1,
    },
  ].map((row) => ({
    ...row,
    complete: elapsed >= row.duration,
  }));
  return {
    branches,
    allReads: branches.every((row) => row.complete),
    mergeComplete: elapsed >= 3.5,
  };
}
export function buildWaitingJoinTrace() {
  function waitingJoinTrace(elapsed) {
    const arrivals = [
      {
        id: 'Policy',
        at: 1,
      },
      {
        id: 'Eval',
        at: 2,
      },
      {
        id: 'Health prep',
        at: 1,
      },
      {
        id: 'Health',
        at: 4,
      },
    ];
    return {
      arrivals: arrivals.map((x) => ({
        ...x,
        done: elapsed >= x.at,
      })),
      separateMerges: [2, 4].filter((t) => elapsed >= t),
      waitingMerges: elapsed >= 4 ? [4] : [],
    };
  }
  assert.equal(waitingJoinTrace(2).separateMerges.length, 1);
  assert.equal(waitingJoinTrace(2).waitingMerges.length, 0);
  assert.equal(waitingJoinTrace(4).waitingMerges.length, 1);
  return {
    waitingJoinTrace,
  };
}
export const { waitingJoinTrace } = buildWaitingJoinTrace();
