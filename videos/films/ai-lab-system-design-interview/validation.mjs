import { SCENES } from './fixtures.mjs';
import {
  GATE,
  LARGE_QUEUE,
  MEMORY,
  SMALL_QUEUE,
  TRAFFIC,
  TWO_RESOURCES,
  admissionSnapshot,
  memoryTrace,
  sampleModel,
  systemExtensionFrame,
} from './construction.mjs';
import {
  canTransition,
  dualResourceAdmission,
  eligibleDocuments,
  queueAdmission,
  releaseGate,
  retryMode,
  servingSnapshot,
  trafficBudget,
} from './model.mjs';
import { drawAdmission as validateAdmissionPainter } from './stages/admission.mjs';
import assert from 'node:assert/strict';
export function validateSystemExtension() {
  assert.equal(
    systemExtensionFrame('cache-bytes', {
      beat: 0,
      beatP: 1,
    }).perToken,
    131072,
  );
  assert.equal(
    systemExtensionFrame('demand-sensitivity', {
      beat: 1,
      beatP: 1,
    }).traffic.tokensPerSecond,
    140000,
  );
  assert.equal(
    systemExtensionFrame('quota-reservation', {
      beat: 0,
      beatP: 1,
    }).balance,
    8480,
  );
  assert.deepEqual(
    systemExtensionFrame('phase-latency', {
      beat: 1,
      beatP: 1,
    }).gaps,
    [10, 10, 280],
  );
  assert.equal(
    systemExtensionFrame('phase-latency', {
      beat: 1,
      beatP: 1,
    }).tpot,
    100,
  );
  assert.equal(
    systemExtensionFrame('decision-rehearsal', {
      beat: 1,
      beatP: 1,
    }).total,
    45,
  );
  for (const beatP of [0, 0.3, 0.9, 1]) {
    const before = systemExtensionFrame('fresh-boundary', {
      beat: 0,
      beatP,
    });
    assert.equal(before.answersReady, false);
  }
  const cue = {
      phase: 'before',
      progress: 0,
    },
    late = systemExtensionFrame('fresh-boundary', {
      beat: 1,
      beatP: 0.99,
      cues: {
        'sd-fresh-release': cue,
      },
    });
  assert.equal(late.answersReady, false);
  const after = systemExtensionFrame('fresh-boundary', {
    beat: 2,
    beatP: 1,
  });
  assert(after.capacity && after.acl && after.release);
  assert.equal(after.financeGranted, false);
  return true;
}
export function validateModel() {
  validateSystemExtension();
  assert.equal(memoryTrace(0, 0).kvGb, 0);
  assert.equal(memoryTrace(0, 1).kvGb, MEMORY.mhaGb);
  assert.equal(memoryTrace(1, 1).kvGb, MEMORY.gqaGb);
  assert.equal(memoryTrace(1, 1).weightsGb, memoryTrace(0, 0).weightsGb);
  assert.equal(MEMORY.weightsGb, 16);
  assert.equal(MEMORY.perTokenMha, 524_288);
  assert.equal(MEMORY.perTokenGqa, 131_072);
  assert(Math.abs(MEMORY.mhaGb - 17.179869184) < 1e-9);
  assert(Math.abs(MEMORY.gqaGb - 4.294967296) < 1e-9);
  assert(MEMORY.mhaGb > MEMORY.weightsGb && MEMORY.gqaGb < MEMORY.weightsGb);
  assert.equal(TRAFFIC.tokensPerMinute, 6_600_000);
  assert.equal(TRAFFIC.tokensPerSecond, 110_000);
  assert.equal(TRAFFIC.headroom, 15_000);
  assert.equal(TRAFFIC.headroomFraction, 0.12);
  assert.equal(SMALL_QUEUE.estimatedWait, 0.16);
  assert.equal(SMALL_QUEUE.admitted, true);
  assert.equal(LARGE_QUEUE.estimatedWait, 0.4);
  assert.equal(LARGE_QUEUE.admitted, false);
  assert.deepEqual(TWO_RESOURCES, {
    prefill: {
      ...queueAdmission(10_000, 80_000, 0.25),
    },
    decode: true,
    kv: true,
    admitted: true,
  });
  assert.equal(eligibleDocuments().length, 1);
  assert.deepEqual(
    eligibleDocuments().map((document) => document.id),
    ['public-access-policy'],
  );
  assert.equal(canTransition('running', 'review'), true);
  assert.equal(canTransition('complete', 'running'), false);
  assert.equal(retryMode('repo_read'), 'automatic');
  assert.equal(retryMode('create_commit'), 'reconcile-or-review');
  assert.equal(retryMode('create_commit', true), 'automatic-with-idempotency');
  assert.deepEqual(GATE.failures, ['faithfulness']);
  assert.equal(GATE.launchAllowed, false);
  assert.equal(
    releaseGate({
      recall: 0.92,
      faithfulness: 0.95,
      leaks: 0,
    }).launchAllowed,
    true,
  );
  assert.equal(
    releaseGate({
      recall: 0.91,
      faithfulness: 0.99,
      leaks: 0,
    }).launchAllowed,
    false,
  );
  assert.equal(
    releaseGate({
      recall: 0.99,
      faithfulness: 0.99,
      leaks: 1,
    }).launchAllowed,
    false,
  );
  assert.throws(() => queueAdmission(-1, 100, 0.25), /invalid queue/);
  assert.throws(() => queueAdmission(1, 0, 0.25), /invalid queue/);
  assert.throws(
    () =>
      dualResourceAdmission({
        activeDecode: 48.5,
      }),
    /nonnegative integers/,
  );
  assert.throws(
    () =>
      trafficBudget({
        assumedCapacity: 0,
      }),
    /finite and nonnegative/,
  );
  assert.throws(() => servingSnapshot(-0.01), /nonnegative/);
  const beforeJoin = admissionSnapshot(0, 0),
    joined = admissionSnapshot(0, 1);
  assert.deepEqual(beforeJoin.waiting, ['B']);
  assert.deepEqual(joined.waiting, ['B', 'R-104']);
  assert.equal(servingSnapshot(0.079).active, 'A');
  assert.equal(servingSnapshot(0.08).active, 'B');
  assert.equal(servingSnapshot(0.159).active, 'B');
  assert.equal(servingSnapshot(0.16).active, 'R-104');
  assert.equal(servingSnapshot(0.16).observedWait, 0.16);
  assert(!servingSnapshot(0.199).requestComplete);
  assert(servingSnapshot(0.2).requestComplete);
  assert.equal(servingSnapshot(0.2).usedKv, 0);
  assert.equal(servingSnapshot(0.2).usedSlots, 0);
  for (let frame = 0; frame <= 200; frame++) {
    const sim = servingSnapshot(frame / 1000);
    assert(sim.waiting.length <= sim.waitingCapacity);
    assert(sim.usedSlots <= sim.capacity);
    assert.equal(sim.usedKv + sim.freeKv, sim.kvCapacity);
    assert.equal(sim.usedKv, sim.active ? 2 : 0);
    assert(sim.remainingWait >= 0);
    const counts = {
      A: 10_000,
      B: 10_000,
      'R-104': 5_000,
    };
    const remaining = sim.remaining + sim.waiting.reduce((sum, id) => sum + counts[id], 0);
    assert(Math.abs(remaining - Math.max(0, 25_000 - (frame / 1000) * 125_000)) < 1e-7);
  }
  assert(!admissionSnapshot(2, 0).rejectReady);
  assert(admissionSnapshot(2, 1).rejectReady);
  assert(admissionSnapshot(3, 0).rejectReady);
  const before = { phase: 'before', progress: 0 };
  const after = { phase: 'after', progress: 1 };
  const serviceCues = Object.fromEntries(
    ['admission-drain-a', 'admission-drain-b', 'admission-drain-own'].map((id) => [id, before]),
  );
  const service = () => admissionSnapshot(1, 0.99, { cues: serviceCues });
  assert.equal(service().active, 'A');
  serviceCues['admission-drain-a'] = after;
  assert.equal(service().active, 'B');
  serviceCues['admission-drain-b'] = after;
  assert.equal(service().active, 'R-104');
  assert.equal(service().observedWait, 0.16);
  serviceCues['admission-drain-own'] = after;
  assert(service().requestComplete);
  assert.equal(service().freeKv, 8);
  assert(!admissionSnapshot(2, 1, { cues: { 'admission-verdict': before } }).rejectReady);
  assert(admissionSnapshot(2, 0, { cues: { 'admission-verdict': after } }).rejectReady);
  const admittedComparison = sampleModel('admission', {
    beat: 2,
    beatP: 1,
    comparisonQueuedTokens: 20_000,
  }).sim;
  assert(admittedComparison.comparison.admitted);
  assert.equal(admittedComparison.comparisonLabel, 'ADMIT · budget fits');
  assert.doesNotMatch(admittedComparison.comparisonLabel, /503/);
  assert.match(admittedComparison.comparisonDetail, /joins the queue/);
  assert.equal(admittedComparison.comparison.estimatedWait, 0.16);
  const atBudget = admissionSnapshot(2, 1, {
      comparisonQueuedTokens: 31_250,
    }),
    pastBudget = admissionSnapshot(2, 1, {
      comparisonQueuedTokens: 31_251,
    });
  assert.equal(atBudget.comparisonLabel, 'ADMIT · budget fits');
  assert.equal(pastBudget.comparisonLabel, '503 shared overload');
  assert.equal(admissionSnapshot(2, 1).comparisonLabel, '503 shared overload');
  for (const queued of [20_000, 50_000]) {
    const texts = [],
      bars = [];
    validateAdmissionPainter(
      null,
      { id: 'admission' },
      { beat: 2, beatP: 1, comparisonQueuedTokens: queued },
      {
        C: { blue: 'blue' },
        focus: { target: (_id, paint) => paint() },
        text: (_ctx, value) => texts.push(value),
        rect: (_ctx, _x, _y, width) => bars.push(width),
        line() {},
      },
    );
    assert(texts.includes(queued === 20_000 ? 'Admit to queue' : '503  ·  Shared overload'));
    assert(
      texts.includes(
        queued === 20_000 ? 'Joins the waiting queue' : 'No service slot or cache allocated',
      ),
    );
    assert.deepEqual(bars, [512, (queued / 125_000) * 3200]);
  }
  for (const scene of SCENES)
    for (const beat of [0, 1])
      for (const beatP of [0, 0.15, 0.5, 0.85, 1]) {
        const sample = sampleModel(scene, {
          beat,
          beatP,
        });
        assert.equal(sample.step, beatP === 1 && beat === 0 ? 1 : beat);
        assert(Number.isFinite(sample.q));
        if (scene === 'memory') {
          const expectedHeads = sample.step ? MEMORY.groupedHeads : MEMORY.heads;
          const expectedKvGb = sample.step ? MEMORY.gqaGb : MEMORY.mhaGb;
          assert.equal(sample.activeHeads, expectedHeads);
          assert.equal(sample.compared, sample.step ? 'GQA' : 'MHA');
          assert.equal(sample.currentKvGb, expectedKvGb);
          assert.equal(
            sample.currentKvGb,
            ((sample.perTokenMha * sample.batch * sample.sequence) / 1e9) *
              (sample.activeHeads / sample.heads),
          );
        }
        if (scene === 'admission')
          assert.equal(
            sample.dual.admitted,
            sample.dual.prefill.admitted && sample.dual.decode && sample.dual.kv,
          );
        if (scene === 'permissions' && sample.selected)
          assert.equal(sample.selected, 'public-access-policy');
      }
  return true;
}
