import assert from 'node:assert/strict';
import {
  intro,
  reset,
  dispatch,
  verify,
  recover,
  surfaces,
  closing,
  river,
  garden,
  first,
  same,
  extra,
  trial,
  comparedRead,
} from './circulation.mjs';
import {
  reliability,
  economics,
  estimators,
  uncertainty,
  TRIALS,
  runs,
  sorted,
  cents,
  passed,
  practiceSpend,
  practicePasses,
  allTwo,
  allTasks,
  groups,
  repeatEstimates,
  bounds,
  floor,
} from './measures.mjs';
import {
  trace,
  process,
  judge,
  sequenceOK,
  strict,
  permitState,
  exportTrace,
  replyPositions,
  judgeReport,
} from './audit.mjs';
import { JUDGE_ROWS } from '../../../films/agent-evaluation/fixtures.mjs';
import { benchmarks, harness, release, repair, repairedVariant, suite } from './release.mjs';
import { candidateGate, verifyHold } from '../../../films/agent-evaluation/model.mjs';

const painters = [
  intro,
  reset,
  dispatch,
  verify,
  recover,
  reliability,
  economics,
  surfaces,
  trace,
  process,
  estimators,
  uncertainty,
  judge,
  benchmarks,
  harness,
  release,
  repair,
  closing,
];
const near = (a, b) => assert(Math.abs(a - b) < 1e-9);
function check() {
  for (const task of [river, garden]) {
    const n = task.first,
      duplicate = trial(task, n, n + 1),
      replay = trial(task, n, n);
    assert.deepEqual(trial(task).read.ids, []);
    assert.deepEqual(duplicate.read.ids, ['hold-' + n, 'hold-' + (n + 1)]);
    assert.deepEqual(
      duplicate.account.holds.map((r) => [r.reader, r.book, r.operation]),
      [
        [task.reader, task.book, 'op-' + n],
        [task.reader, task.book, 'op-' + (n + 1)],
      ],
    );
    assert.equal(duplicate.attempts[0].receipt.version, task.start + 1);
    assert.equal(duplicate.read.version, task.start + 2);
    assert.equal(duplicate.passed, false);
    assert.equal(replay.attempts.length, 2);
    assert.equal(replay.attempts[1].receipt, replay.attempts[0].receipt);
    assert.deepEqual(
      [replay.read.version, replay.read.count, replay.passed],
      [task.start + 1, 1, true],
    );
  }
  assert.deepEqual([same.attempts.length, extra.attempts.length], [2, 2]);
  for (const mode of ['match', 'old', 'book', 'both', 'denied']) {
    const f = comparedRead(river, first, mode);
    assert.equal(f.passed, mode === 'match');
    assert.equal(f.read.book, ['book', 'both'].includes(mode) ? 'B8' : 'B7');
    assert.equal(f.read.version, ['old', 'both'].includes(mode) ? 2 : 3);
  }
  assert.equal(
    verifyHold({
      authorized: true,
      attemptedForbidden: false,
      write: first.attempts[0].receipt,
      read: { ...first.read, ids: ['hold-88'] },
    }),
    false,
  );
  assert.deepEqual(
    TRIALS.map((t) => t.pass.filter(Boolean).length),
    [3, 2, 2],
  );
  assert.deepEqual([passed, allTasks, cents(runs)], [7, 1, 20.3]);
  near(cents(runs) / passed, 2.9);
  assert.deepEqual([practiceSpend, practicePasses, practiceSpend / practicePasses], [18, 3, 6]);
  near(allTwo, 0.4);
  assert.deepEqual(
    sorted.map((r) => r.seconds),
    [2, 2.5, 3, 3, 4, 4, 5, 7, 8],
  );
  assert.equal(sorted[Math.ceil(0.95 * sorted.length) - 1].id, 'R9');
  const patch = groups([false, true, false, false, true], 3);
  assert.deepEqual(
    patch.filter((g) => !g.any).map((g) => g.ids),
    [[0, 2, 3]],
  );
  const pairs = groups([true, true, true, true, false, false], 2);
  assert.deepEqual(
    [pairs.length, pairs.filter((g) => g.all).length, pairs.filter((g) => g.any).length],
    [15, 6, 14],
  );
  near(repeatEstimates(6, 4, 2).any, 14 / 15);
  near(repeatEstimates(6, 4, 2).all, 6 / 15);
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => [bounds(i).lower, bounds(i).upper].map((v) => Number(v.toFixed(3)))),
    [
      [0.208, 0.939],
      [0.744, 0.965],
      [0.845, 1],
      [0.851, 1],
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => bounds(i).lower >= floor),
    [false, false, false, true],
  );
  const cleaned = exportTrace(true, false);
  assert.deepEqual(cleaned.args.contact, {});
  assert(cleaned.observation.includes('example.test'));
  assert(!JSON.stringify(exportTrace(true, true)).includes('example.test'));
  assert(sequenceOK(strict, 'exact'));
  assert(!sequenceOK([...strict].reverse(), 'exact'));
  assert(!sequenceOK([strict[0], ...strict], 'exact'));
  assert(sequenceOK(['Lookup timeout', ...strict], 'recovery'));
  for (const v of ['ok', 'candidate', 'call', 'late'])
    assert.equal(permitState(v).match, v === 'ok');
  assert.deepEqual(judgeReport(JUDGE_ROWS), { total: 4, agree: 3, flips: 2 });
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const [a, b] = replyPositions(t);
    assert.equal(a.id, 'A');
    assert.deepEqual(a.words, ['Done.']);
    assert.equal(b.id, 'B');
    if (t === 0 || t === 1)
      assert.equal(
        [a, b].sort((l, r) => l.x - r.x)[1].id,
        t === 0 ? JUDGE_ROWS[1].forward : JUDGE_ROWS[1].swap,
      );
  }
  assert.deepEqual(candidateGate(suite).checks, [false, false, false, true]);
  near(suite.cpst, 0.0555);
  assert.equal(candidateGate({ ...suite, allThree: NaN }).valid, false);
  assert.equal(candidateGate({ ...suite, critical: true }).valid, false);
  assert.deepEqual(
    ['original', 'valid', 'reverse', 'expensive', 'invalid'].map((v) => repairedVariant(v).passed),
    [false, true, false, false, false],
  );
  return true;
}
export default {
  title: 'Evaluate an Agent from Effects to Release Evidence',
  draw(c, k) {
    painters[k.beat.chapterIndex](c, k);
  },
  check,
};
