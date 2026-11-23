import assert from 'node:assert/strict';
import { opening, trace, quota, memory, placement, demand } from './gateway.mjs';
import { worker, capacity, stream, queueState } from './worker.mjs';
import { permissions, cache, agent, claims } from './ownership.mjs';
import { evaluation, rollout, rehearsal } from './release.mjs';
import {
  arrival,
  service,
  balance,
  memoryBudget,
  trafficBudget,
  claim,
  nextIteration,
  stageStatus,
  expertScores,
  selectedExpert,
  expertDevices,
  acceptedPrefixLength,
  draftTokens,
  targetTokens,
  latency,
  arrivals,
  eligibleDocuments,
  freshness,
  reuse,
  cached,
  claimEdge,
  retryMode,
  release,
  windows,
  canary,
  canaryPacket,
  releaseGate,
  practice,
} from './examples.mjs';

const scenes = {
  c01: opening,
  c02: trace,
  quota,
  c03: memory,
  placement,
  c04: demand,
  c05: worker,
  capacity,
  stream,
  c06: permissions,
  reuse: cache,
  c07: agent,
  claims,
  c08: evaluation,
  canary: rollout,
  practice: rehearsal,
};

function check() {
  assert.deepEqual(arrival(5), { units: 5, wait: 400, status: 503 });
  assert.deepEqual(arrival(2), { units: 2, wait: 160, status: 'admit' });
  assert.equal(arrival(0, false).status, 429);
  assert.equal(arrival(3.125).status, 'admit');
  for (const [ms, owner, line, finished, wait, used, owned] of [
    [0, 'A', ['B', 'R-104'], [], 0, 2, 0],
    [79, 'A', ['B', 'R-104'], [], 79, 2, 0],
    [80, 'B', ['R-104'], ['A'], 80, 2, 0],
    [120, 'B', ['R-104'], ['A'], 120, 2, 0],
    [159, 'B', ['R-104'], ['A'], 159, 2, 0],
    [160, 'R-104', [], ['A', 'B'], 160, 2, 2],
    [180, 'R-104', [], ['A', 'B'], 160, 2, 2],
    [199, 'R-104', [], ['A', 'B'], 160, 2, 2],
    [200, null, [], ['A', 'B', 'R-104'], 160, 0, 0],
  ]) {
    const s = service(ms, true);
    assert.deepEqual(
      [s.active, s.waiting, s.completed, s.wait, s.usedKv, s.blocks],
      [owner, line, finished, wait, used, owned],
    );
    assert.equal(s.usedKv + s.freeKv, 8);
    assert.equal(s.usedSlots, Number(owner !== null));
    assert.equal(s.service, Math.max(0, ms - 160));
    assert.equal(s.requestComplete, ms === 200);
  }
  assert.deepEqual(service(0, false).waiting, ['B']);
  for (const [beat, ratio, ms, owner] of [
    [2, 0.5, 40, 'A'],
    [2, 1, 80, 'B'],
    [3, 0.5, 120, 'B'],
    [3, 1, 160, 'R-104'],
    [4, 0.5, 180, 'R-104'],
    [4, 1, 200, null],
  ]) {
    const s = queueState({ beat: { beatIndex: beat }, reveal: () => ratio });
    assert.equal(s.ms, ms);
    assert.equal(s.active, owner);
  }
  assert.deepEqual(balance(false, false), { available: 10000, pending: 0, used: 0 });
  assert.deepEqual(balance(true, false), { available: 8200, pending: 1800, used: 0 });
  assert.deepEqual(balance(true, true), { available: 8480, pending: 0, used: 1520 });
  const m = memoryBudget();
  assert.deepEqual(
    [m.weightsGb, m.perTokenGqa, m.mhaGb, m.gqaGb],
    [16, 131072, 17.179869184, 4.294967296],
  );
  const base = trafficBudget(),
    long = trafficBudget({ outputTokens: 900 });
  assert.deepEqual(
    [
      base.tokensPerMinute,
      base.tokensPerSecond,
      base.headroomFraction,
      long.tokensPerSecond,
      long.headroom,
    ],
    [6600000, 110000, 0.12, 140000, -15000],
  );
  assert.deepEqual(
    [claim(false).admitted, claim(true).admitted, claim(true).freeKvBlocks],
    [true, false, 0],
  );
  const replay = claim(true, 16);
  assert.deepEqual(
    [replay.activeDecode, replay.freeKvBlocks, replay.prefill.estimatedWait, replay.kv, replay.decode, replay.admitted],
    [64, 16, 0.125, true, false, false],
  );
  assert.deepEqual(stageStatus(0), ['Computing', 'Idle']);
  assert.deepEqual(stageStatus(0.5), ['Sent activation', 'Waiting']);
  assert.deepEqual(stageStatus(1), ['Idle', 'Computing']);
  assert.deepEqual([selectedExpert, expertScores[selectedExpert], expertDevices[selectedExpert]], [3, 0.55, 'B']);
  for (const joined of [false, true]) {
    const s = nextIteration(joined);
    assert.equal(s.activeDecode, joined ? 64 : 63);
    assert.equal(s.maxDecode, 64);
    assert.equal(s.owner, joined ? 'R-203' : null);
    assert.deepEqual(s.pages, joined ? [2, 6] : []);
    assert.equal(s.freeKvBlocks, joined ? 14 : 16);
    assert.equal(s.neededKvBlocks, 2);
    assert.equal(s.freeKvBlocks + s.pages.length, 16);
  }
  const prefix = acceptedPrefixLength(draftTokens, targetTokens);
  assert.deepEqual(draftTokens.slice(0, prefix), ['Meet', 'at']);
  assert.deepEqual([draftTokens[prefix], targetTokens[prefix]], ['noon', 'two']);
  assert.equal(acceptedPrefixLength(['Meet', 'at', 'two'], ['Call', 'at', 'two']), 0);
  assert.deepEqual(latency(arrivals), { first: 200, gaps: [10, 10, 280], mean: 100, max: 280 });
  assert.equal(latency([150]).mean, null);
  assert.deepEqual(
    eligibleDocuments().map((d) => d.id),
    ['public-access-policy'],
  );
  assert.deepEqual(
    [5, 45, 80, null].map((n) => freshness(n, 45)),
    [true, true, false, false],
  );
  assert.deepEqual(
    [reuse({ ...cached, positions: '1 2 3' }, true), reuse(cached, false), reuse(cached, true)],
    [false, false, true],
  );
  assert.deepEqual(
    [
      claimEdge('review', 'review', 'complete'),
      claimEdge('review', 'review', 'failed'),
      claimEdge('complete', 'review', 'complete'),
    ],
    [true, false, false],
  );
  assert.deepEqual(
    [
      retryMode('create_commit', 'True'),
      retryMode('sandbox_provision', true),
      retryMode('repo_read', false),
    ],
    ['reconcile-or-review', 'automatic-with-idempotency', 'automatic'],
  );
  assert.deepEqual(release().failures, ['faithfulness']);
  const packet = canaryPacket(0);
  assert.equal(releaseGate(packet).launchAllowed, true);
  for (const leaks of [null, false, 1])
    assert.deepEqual(releaseGate(canaryPacket(leaks)).failures, ['permission_leaks']);
  const copy = canaryPacket(0, true);
  assert.deepEqual(copy, { ...packet, recallMinimum: 0.90 });
  const held = releaseGate(copy);
  assert.equal(held.minima.recall, 0.92);
  assert.deepEqual(held.failures, ['recall']);
  assert.equal(held.launchAllowed, false);
  assert.deepEqual(
    windows.map((w) => canary(...w)),
    ['Expand', 'Hold', 'Rollback'],
  );
  assert.equal(canary(null, 800, 0), 'Hold');
  assert.equal(canary(0.01, 900, false), 'Hold');
  for (const refreshed of [false, true]) {
    const s = practice(refreshed);
    assert.equal(s.cap.prefill.estimatedWait, 0.2);
    assert.equal(s.cap.admitted, true);
    assert.equal(s.fresh, refreshed);
    assert.equal(s.gate.launchAllowed, refreshed);
    assert.equal(s.finance, false);
  }
  return true;
}
export default {
  title: 'AI Lab System Design From the Constraint',
  draw(g, k) {
    g.save();
    g.scale(2, 2);
    scenes[k.beat.chapterId](g, k);
    g.restore();
  },
  check,
};
