import assert from 'node:assert/strict';
import { featureScene, vectorsScene, historyScene } from './feature-scenes.mjs';
import { budgetScene, shadowScene } from './rollout-scenes.mjs';
import { controllerScene } from './controller-scene.mjs';
import { recoveryScene } from './recovery-scene.mjs';
import {
  replay,
  vectorState,
  countAt,
  budget,
  pairedSummary,
  assigned,
  readings,
  arbitrate,
  streak,
  revisions,
  measured,
  hashes,
  letter,
  stale,
  fail,
  retry,
  syncBranch,
  releases,
  finalProbe,
  assessProbe,
} from './mechanics.mjs';

const painters = [
  featureScene,
  vectorsScene,
  historyScene,
  budgetScene,
  shadowScene,
  controllerScene,
  recoveryScene,
];
function check() {
  assert.deepEqual(replay.online, [3, 4]);
  assert.deepEqual(replay.offline, [0.6, 0.8]);
  assert.equal(replay.offlineScore, 0.7);
  assert.equal(replay.onlineScore, 3.5);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const [a, b] = vectorState(t);
    assert.equal(a.point[0], a.score);
    assert.equal(b.point[0], b.score);
    assert.ok(Math.abs(a.point[1] / a.point[0] - 4 / 3) < 1e-10);
    assert.equal(b.point[1], 0);
  }
  assert.deepEqual(
    vectorState(0).map((r) => r.score),
    [3, 2],
  );
  assert.deepEqual(
    vectorState(1).map((r) => r.score),
    [0.6, 1],
  );
  assert.deepEqual([countAt(0, 24), countAt(0, 3), countAt(0, 1), countAt(1, 1)], [5, 5, null, 2]);
  for (const [tokens, gap, pass] of [
    [790, 77, false],
    [714, 1, false],
    [713, 0, true],
  ]) {
    const r = budget(tokens);
    assert.deepEqual([r.cap, r.tokens, r.over, r.pass], [713, tokens, gap, pass]);
  }
  const s = pairedSummary();
  assert.deepEqual(s.totals, [1860, 2180]);
  assert.deepEqual([s.gain.toFixed(3), s.growth.toFixed(1), s.review], ['0.020', '17.2', true]);
  const pinned = assigned(17, 10);
  assert.deepEqual([pinned, assigned(17, 20, pinned), assigned(17, 20)], ['B', 'B', 'C']);
  for (const malformed of [false, true]) {
    const r = readings(malformed);
    assert.deepEqual(
      r.map((row) => row.valid),
      [!malformed, !malformed],
    );
    assert.deepEqual(
      r.map((row) => row.action),
      ['rollback', 'review'],
    );
    assert.equal(arbitrate(r), 'rollback');
  }
  assert.deepEqual(
    streak.map((r) => r.count),
    [1, 2, 0, 1, 2, 3, 3],
  );
  assert.deepEqual(
    streak.map((r) => r.latched),
    [false, false, false, false, false, true, true],
  );
  assert.deepEqual(
    revisions.map((t) => [letter(t), t.generation]),
    [
      ['C', 12],
      ['B', 13],
      ['C', 14],
    ],
  );
  assert.equal(hashes.C, measured.release);
  assert.equal(hashes.C.length, 64);
  for (const rejection of [stale, fail]) {
    assert.deepEqual(rejection.pointer, revisions[2]);
    assert.equal(rejection.audit, null);
    assert.equal(rejection.committed, false);
  }
  assert.deepEqual(retry.pointer, { release: hashes.B, generation: 15 });
  assert.deepEqual(retry.audit, { from: hashes.C, to: hashes.B, generation: 15 });
  for (const desired of ['B', 'C']) {
    assert.equal(syncBranch(desired, false, false).route, 'B');
    assert.equal(syncBranch(desired, true, false).trace, null);
    assert.equal(syncBranch(desired, true, true).trace, releases[desired]);
  }
  assert.deepEqual(assessProbe(finalProbe), { age: 20, lead: 5, error: 1, ok: true });
  assert.equal(assessProbe({ ...finalProbe, available: 61 }).ok, false);
  assert.equal(assessProbe({ ...finalProbe, estimate: 15 }).ok, false);
  return true;
}
export default {
  title: 'Release the Whole AI System Together',
  check,
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
};
