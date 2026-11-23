import {
  deviceEnumeration,
  jsonl,
  newlineCount,
  pipelineStatus,
  sameProcess,
  score,
} from './arithmetic.mjs';
import { freshRows, freshWrong, job, replacement, rows, wrongRow } from './fixtures.mjs';
import {
  bisectTrace,
  pipelineResult,
  recordContract,
  searchResult,
  shutdownFrame,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(score(rows).fraction, 2 / 3);
  assert(score(rows).passes);
  assert(!score([...rows, wrongRow]).passes);
  assert.equal(jsonl(rows).split('\n').length - 1, 3);
  assert.equal(searchResult().status, 1);
  assert.equal(
    searchResult({
      exists: false,
    }).status,
    2,
  );
  assert.deepEqual(
    bisectTrace().checks.map((c) => [c.mid, c.good]),
    [
      [3, true],
      [5, false],
      [4, true],
    ],
  );
  assert.equal(bisectTrace().firstBad, 5);
  assert.equal(pipelineResult(false).status, 0);
  assert.equal(pipelineResult(true).status, 2);
  assert(!sameProcess(job, replacement));
  assert.equal(
    shutdownFrame({
      beat: 1,
      beatP: 0.4,
    }).waitStatus,
    null,
  );
  assert.equal(newlineCount(jsonl(rows).slice(0, -1)), 2);
  assert.equal(recordContract(jsonl(rows).slice(0, -1)).result.total, 3);
  assert(!recordContract('[]\n').valid);
  assert(!recordContract('{"prompt":"x"}\n').valid);
  assert(!recordContract('').valid);
  assert.equal(pipelineStatus([2, 7, 0], true), 7);
  assert.equal(pipelineStatus([2, 7, 0]), 0);
  assert.deepEqual(deviceEnumeration([0, 1, 2], '2,0'), [
    {
      logical: 0,
      physical: 2,
    },
    {
      logical: 1,
      physical: 0,
    },
  ]);
  assert.equal(score(freshRows).correct, 5);
  assert(score(freshRows).passes);
  assert(!score([...freshRows, freshWrong]).passes);
  return true;
}
