import {
  checkpoint,
  goal,
  mask,
  old,
  segmentTerms,
  slimeSentenceWeights,
  syncOutcome,
} from './fixtures.mjs';
import { momentumTrace, sum, uninterrupted, update, xor } from './arithmetic.mjs';
import {
  applyPatch,
  chooseSlimeCarrier,
  drainGroups,
  patch,
  syncState,
  versionedPatch,
} from './protocols.mjs';
import { sampleModel, segmentState, validateSample } from './model.mjs';
import { sampleSlimeChapter } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert(validateSample(mask));
  assert(!validateSample(mask.slice(0, 4)));
  assert(!validateSample([1, 1, 1, 0, 1, 1]));
  assert(
    Math.abs(
      sampleModel('ledger', {
        beat: 1,
        beatP: 0,
      }).nll - 0.35,
    ) < 1e-12,
  );
  for (const beat of [0, 1, 2])
    assert.equal(
      sampleModel('segments', {
        beat,
        beatP: 0,
      }).result,
      4,
    );
  assert.equal(
    sampleModel('segments', {
      beat: 2,
      beatP: 0,
    }).wrongIndependent,
    6,
  );
  assert.equal(
    sampleModel('segments', {
      beat: 2,
      beatP: 0,
    }).wrongHalved,
    2,
  );
  for (const beatP of [0, 0.5, 0.99]) {
    const uneven = sampleModel('segments', {
      beat: 2,
      beatP,
    });
    assert.deepEqual(uneven.parts, [[1], [3, 5, 7]]);
    assert.deepEqual(uneven.contributions, [0.25, 3.75]);
  }
  const beforeMove = segmentState(1, 0),
    duringMove = segmentState(1, 0.5),
    afterMove = segmentState(1, 1);
  assert.deepEqual(beforeMove.parts, [
    [1, 3],
    [5, 7],
  ]);
  assert(duringMove.boundary > 1 && duringMove.boundary < 2);
  assert.deepEqual(afterMove.parts, [[1], [3, 5, 7]]);
  assert.deepEqual(beforeMove.contributions, [1, 3]);
  assert.deepEqual(afterMove.contributions, [0.25, 3.75]);
  for (let i = 0; i <= 200; i++) {
    const current = segmentState(1, i / 200);
    assert.deepEqual(current.parts.flat(), segmentTerms);
    assert.equal(current.denominator, 4);
    assert.equal(current.result, 4);
    assert.deepEqual(
      current.contributions,
      current.parts.map((part) => sum(part) / current.denominator),
    );
  }
  for (const beat of [0, 1, 2])
    for (const beatP of [0, 0.5, 0.99]) {
      const s = sampleModel('queue', {
        beat,
        beatP,
      });
      assert.equal(s.submitted, 5);
      assert.equal(s.queued.length + s.running, 5);
      if (s.queued.length >= 4) assert.equal(s.launch, false);
    }
  assert.equal(
    sampleModel('queue', {
      beat: 1,
      beatP: 0,
    }).queued.length,
    3,
  );
  assert.equal(
    sampleModel('queue', {
      beat: 1,
      beatP: 0.5,
    }).queued.length,
    4,
  );
  assert.equal(
    sampleModel('queue', {
      beat: 1,
      beatP: 0.9,
    }).queued.length,
    5,
  );
  assert.equal(
    sampleModel('placement', {
      beat: 0,
      beatP: 0,
    }).fits,
    false,
  );
  assert.equal(
    sampleModel('placement', {
      beat: 2,
      beatP: 0,
    }).fits,
    true,
  );
  assert.deepEqual(xor(old, patch), goal);
  assert.deepEqual(xor(xor(old, patch), patch), old);
  const initial = {
      version: 11,
      bytes: [...old],
    },
    applied = applyPatch(initial, versionedPatch);
  assert.equal(applied.applied, true);
  assert.deepEqual(applied.state, {
    version: 12,
    bytes: goal,
  });
  assert.deepEqual(initial, {
    version: 11,
    bytes: old,
  });
  const duplicate = applyPatch(applied.state, versionedPatch);
  assert.equal(duplicate.applied, false);
  assert.equal(duplicate.reason, 'already applied');
  assert.strictEqual(duplicate.state, applied.state);
  assert.deepEqual(duplicate.state.bytes, goal);
  const wrongBase = {
      version: 10,
      bytes: [...old],
    },
    rejected = applyPatch(wrongBase, versionedPatch);
  assert.equal(rejected.applied, false);
  assert.equal(rejected.reason, 'wrong base version');
  assert.strictEqual(rejected.state, wrongBase);
  assert.deepEqual(wrongBase.bytes, old);
  const corrupt = applyPatch(
    {
      version: 11,
      bytes: [9, 2, 3, 4],
    },
    versionedPatch,
  );
  assert.equal(corrupt.reason, 'target bytes mismatch');
  assert.equal(corrupt.applied, false);
  const corruptDestination = applyPatch(
    {
      version: 12,
      bytes: [...old],
    },
    versionedPatch,
  );
  assert.equal(corruptDestination.reason, 'destination bytes mismatch');
  assert.equal(corruptDestination.applied, false);
  assert.equal(syncState(6).reloadSucceeded, true);
  assert.equal(syncState(6).verified, false);
  assert.equal(syncState(6).paused, true);
  assert.equal(syncState(6.2).verified, true);
  assert.equal(syncState(6.2).ready, false);
  assert.equal(syncState(6.3).ready, true);
  for (const outcome of [
    {
      ...syncOutcome,
      reload: {
        ...syncOutcome.reload,
        succeeded: false,
      },
    },
    {
      ...syncOutcome,
      reload: {
        ...syncOutcome.reload,
        loadedVersion: 13,
      },
    },
    {
      ...syncOutcome,
      verification: {
        ...syncOutcome.verification,
        observedVersion: 13,
      },
    },
    {
      ...syncOutcome,
      verification: {
        ...syncOutcome.verification,
        succeeded: false,
      },
    },
  ]) {
    const failed = syncState(9, outcome);
    assert.equal(failed.ready, false);
    assert.equal(failed.paused, true);
  }
  for (const beatP of [0, 0.5, 0.99]) {
    const guarded = sampleModel('delta', {
      beat: 2,
      beatP,
    });
    assert.equal(guarded.duplicateRejected, true);
    assert.deepEqual(guarded.current, goal);
    const synced = sampleModel('sync', {
      beat: 2,
      beatP,
    });
    assert.equal(synced.loaded, synced.expectedVersion);
    assert.equal(synced.observedVersion, synced.expectedVersion);
    assert(synced.reloadSucceeded && synced.verified && synced.ready);
  }
  assert.equal(
    sampleModel('sync', {
      beat: 1,
      beatP: 0.2,
    }).loaded,
    11,
  );
  assert.deepEqual(
    [0.2, -0.5].reduce(update, {
      ...checkpoint,
    }),
    uninterrupted,
  );
  assert.equal(uninterrupted.step, 12);
  validateSlimeChapters();
  return true;
}
export function validateSlimeChapters() {
  const ref = momentumTrace(
      {
        weight: 2,
        velocity: 0.1,
        step: 20,
      },
      [0.3, -0.4],
    ),
    skip = momentumTrace(
      {
        weight: 2,
        velocity: 0.1,
        step: 20,
      },
      [-0.4],
    );
  assert(Math.abs(ref[1].velocity - 0.39) < 1e-12);
  assert(Math.abs(ref[1].weight - 1.922) < 1e-12);
  assert(Math.abs(ref[2].velocity + 0.049) < 1e-12);
  assert(Math.abs(ref[2].weight - 1.9318) < 1e-12);
  assert(Math.abs(skip[1].velocity + 0.31) < 1e-12);
  assert(Math.abs(skip[1].weight - 2.062) < 1e-12);
  assert.equal(
    chooseSlimeCarrier({
      delta: true,
      disk: true,
      colocated: false,
    }),
    'delta disk',
  );
  assert.equal(
    chooseSlimeCarrier({
      delta: true,
      disk: true,
      colocated: true,
    }),
    'reject configuration',
  );
  assert.equal(
    chooseSlimeCarrier({
      disk: false,
      colocated: true,
    }),
    'tensor handles',
  );
  assert.equal(chooseSlimeCarrier({}), 'NCCL chunks');
  const groups = [
      {
        id: 'G5',
        index: 5,
      },
      {
        id: 'G2',
        index: 2,
      },
      {
        id: 'G4',
        index: 4,
      },
      {
        id: 'G1',
        index: 1,
      },
      {
        id: 'G3',
        index: 3,
      },
    ],
    d = drainGroups(groups, 2);
  assert.deepEqual(
    d.handedOff.map((g) => g.id),
    ['G2', 'G5'],
  );
  assert.deepEqual(
    d.surplus.map((g) => g.id),
    ['G4', 'G1', 'G3'],
  );
  assert.equal(groups.length, 5);
  for (const id of Object.keys(slimeSentenceWeights))
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.1, 0.5, 0.9, 1])
        sampleSlimeChapter(id, {
          beat,
          beatP,
        });
  return true;
}
