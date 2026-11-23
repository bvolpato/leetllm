import { ECONOMIC_RUNS } from './fixtures.mjs';
import { economicsFrame, episodeSnapshot, recoverySnapshot, report, verifyHold } from './model.mjs';
import assert from 'node:assert/strict';
import { garden, river, runHolds } from './circulation.mjs';
export function validateModel() {
  for (const task of [river, garden]) {
    const key = 'op-' + task.first;
    const same = runHolds(task, [key, key]);
    const different = runHolds(task, [key, 'op-' + (task.first + 1)]);
    assert.equal(same.attempts.length, different.attempts.length);
    assert.equal(same.attempts[1].receipt, same.attempts[0].receipt);
    assert.deepEqual([same.read.count, same.read.version, same.passed], [1, task.start + 1, true]);
    assert.deepEqual(
      [different.read.count, different.read.version, different.passed],
      [2, task.start + 2, false],
    );
    assert.equal(
      verifyHold(
        {
          authorized: true,
          attemptedForbidden: false,
          write: same.attempts[0].receipt,
          read: { ...same.read, ids: ['unrelated-hold'] },
        },
        task,
      ),
      false,
    );
  }
  for (let i = 0; i <= 100; i++) {
    const f = economicsFrame(0, i / 100);
    assert.equal(
      f.total,
      ECONOMIC_RUNS.slice(0, f.spent).reduce((sum, row) => sum + row.cost, 0),
    );
    assert.equal(f.successes, ECONOMIC_RUNS.slice(0, f.checked).filter((row) => row.pass).length);
  }
  assert.equal(economicsFrame(0, 5.25 / 16.054).spent, 9);
  assert.equal(economicsFrame(0, 6.12 / 16.054).successes, 7);
  assert.equal(economicsFrame(1, 9 / 14.526).p95.seconds, 8);
  assert.equal(recoverySnapshot(0, 0.9).writeKnown, false);
  assert.equal(recoverySnapshot(1, 0.6).writeAttempts, 2);
  assert.equal(recoverySnapshot(1, 0.9).writeKnown, true);
  const r = report();
  assert.equal(r.passes, 7);
  assert.equal(r.allThree, 1 / 3);
  assert(Math.abs(r.total - 0.203) < 1e-12);
  assert(Math.abs(r.costPerSuccess - 0.029) < 1e-12);
  assert.equal(r.p95, 8);
  const run = {
    authorized: true,
    attemptedForbidden: false,
    write: {
      book: 'B7',
      reader: 'Lena',
      version: 3,
    },
    read: {
      book: 'B7',
      reader: 'Lena',
      count: 1,
      version: 3,
      hold: true,
    },
  };
  assert(verifyHold(run));
  assert.equal(
    verifyHold({
      ...run,
      read: {
        ...run.read,
        book: 'B8',
      },
    }),
    false,
  );
  assert.equal(
    verifyHold({
      ...run,
      read: {
        ...run.read,
        version: 2,
      },
    }),
    false,
  );
  assert.equal(
    verifyHold({
      ...run,
      attemptedForbidden: true,
    }),
    false,
  );
  assert.equal(
    verifyHold({
      ...run,
      read: {
        ...run.read,
        reader: 'Mira',
      },
    }),
    false,
  );
  assert.equal(
    verifyHold({
      ...run,
      read: {
        ...run.read,
        count: 2,
      },
    }),
    false,
  );
  assert.equal(episodeSnapshot('episode-contract', 0, 1).holds[0].book, 'B8');
  assert.equal(episodeSnapshot('episode-contract', 1, 0.35).holds.length, 0);
  assert.equal(episodeSnapshot('action-trace', 1, 1).written, false);
  assert.equal(episodeSnapshot('action-trace', 2, 0.159).holds.length, 0);
  assert.equal(episodeSnapshot('action-trace', 2, 0.16).holds.length, 1);
  assert.equal(episodeSnapshot('hard-gates', 0, 0.319).readReady, false);
  assert.equal(episodeSnapshot('hard-gates', 0, 0.32).readReady, true);
  assert.equal(episodeSnapshot('hard-gates', 1, 0.7).passed, true);
  assert.equal(episodeSnapshot('hard-gates', 2, 0).passed, true);
  assert.equal(episodeSnapshot('hard-gates', 2, 0.139).forbidden, false);
  assert.equal(episodeSnapshot('hard-gates', 2, 0.14).forbidden, true);
  assert.equal(episodeSnapshot('hard-gates', 2, 1).passed, false);
  const held = {
      book: 'B7',
      reader: 'Lena',
      id: 'hold-17',
    },
    observed = (holds, version = 3) =>
      episodeSnapshot('hard-gates', 1, 1, {
        holds,
        version,
      });
  assert.equal(observed([held]).passed, true);
  assert.equal(
    observed([
      {
        ...held,
        book: 'B8',
      },
    ]).read.count,
    0,
  );
  assert.equal(
    observed([
      {
        ...held,
        book: 'B8',
      },
    ]).passed,
    false,
  );
  assert.equal(
    observed([
      held,
      {
        ...held,
        id: 'hold-18',
      },
    ]).read.count,
    2,
  );
  assert.equal(
    observed([
      held,
      {
        ...held,
        id: 'hold-18',
      },
    ]).passed,
    false,
  );
  assert.equal(observed([held], 2).read.version, 2);
  assert.equal(observed([held], 2).passed, false);
  assert.equal(
    observed([
      {
        ...held,
        reader: 'Mira',
      },
    ]).read.count,
    0,
  );
  assert.equal(
    observed([
      {
        ...held,
        reader: 'Mira',
      },
    ]).passed,
    false,
  );
}
