import { maskStepTime, normalizedWeights, retryBudget } from './arithmetic.mjs';
import {
  CI_RUN,
  EOS,
  FAIL_PREFIX,
  LANGUAGE,
  OPENING_REPLIES,
  SUFFIX,
  VALUE_PREFIX,
} from './fixtures.mjs';
import { maskScheduleClock, recursiveConstructionState } from './construction.mjs';
import {
  decode,
  digestIdentity,
  legal,
  masked,
  nullableRecord,
  rankedSteps,
  recursiveCandidate,
  tokenTrace,
  treeRelationships,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.throws(() => JSON.parse(OPENING_REPLIES[0]), SyntaxError);
  assert.notEqual(JSON.parse(OPENING_REPLIES[1]).status, CI_RUN.status);
  assert.equal(legal('', ''), false);
  assert.equal(legal(FAIL_PREFIX, EOS), false);
  for (let n = 0; n <= SUFFIX.length; n++) assert(tokenTrace(SUFFIX + '!', n).possible);
  assert.equal(tokenTrace(SUFFIX, SUFFIX.length).complete, true);
  assert.equal(tokenTrace(SUFFIX + '!', SUFFIX.length + 1).possible, false);
  assert.deepEqual(rankedSteps(4), [VALUE_PREFIX, 'fa', SUFFIX, EOS]);
  assert.throws(() => decode(rankedSteps(3)), /token budget ended before complete output/);
  assert.equal(decode(rankedSteps(4)), LANGUAGE[1]);
  assert.equal(legal(LANGUAGE[1], EOS), true);
  assert.deepEqual(masked([0.45, 0.3, 0.15, 0.1], '', ['The', '{', 'Sure', 'JSON']), [0, 1, 0, 0]);
  assert.throws(() => masked([1], FAIL_PREFIX, ['!']));
  assert.deepEqual(normalizedWeights([2, 6], [0, 1]), [0.25, 0.75]);
  assert.equal(
    maskScheduleClock({
      beat: 1,
      cues: {
        'sg-schedule-result': {
          progress: 1,
        },
      },
    }),
    9,
  );
  assert.equal(
    maskScheduleClock({
      beat: 2,
      cues: {
        'sg-schedule-slow-result': {
          progress: 1,
        },
      },
    }),
    11,
  );
  for (const d of [1, 2, 3, 4, 8]) {
    const p = '{"child":'.repeat(d - 1) + '{',
      a = recursiveCandidate(p, '}'.repeat(d));
    assert(a.accepted);
    assert.equal(a.committedFrames.length, 0);
    assert(a.eosAfter);
  }
  const fresh = recursiveConstructionState(true, 0.999, 0);
  assert.equal(fresh.committed.frames.length, 4);
  assert.equal(recursiveConstructionState(true, 1, 1).committed.frames.length, 0);
  assert.deepEqual(normalizedWeights([2, 3, 5], [0, 1]), [0.4, 0.6, 0]);
  assert.equal(maskStepTime(8, 3, 1), 9);
  assert.equal(maskStepTime(8, 10, 1), 11);
  assert.equal(
    treeRelationships([
      {
        id: 'r',
        parent: null,
      },
      {
        id: 'a',
        parent: 'b',
      },
      {
        id: 'b',
        parent: 'a',
      },
    ]).valid,
    false,
  );
  assert(
    nullableRecord({
      run_id: 'RUN-915',
      status: 'failed',
      failing_job: null,
    }),
  );
  assert(
    !nullableRecord({
      run_id: 'RUN-915',
      status: 'failed',
    }),
  );
  const fixed = {
    call: 3,
    validation: 1,
    cost: 3,
    deadline: 12,
    limit: 8,
    output: 500,
    modelLimit: 600,
  };
  assert(
    retryBudget({
      ...fixed,
      status: 'length',
      elapsed: 7,
      spent: 4,
    }).allowed,
  );
  assert(
    !retryBudget({
      ...fixed,
      status: 'length',
      elapsed: 8.5,
      spent: 4,
    }).allowed,
  );
  assert.equal(
    digestIdentity(
      [
        {
          service: 'a',
        },
        {
          service: 'a',
        },
      ],
      ['a'],
    ).valid,
    false,
  );
}
