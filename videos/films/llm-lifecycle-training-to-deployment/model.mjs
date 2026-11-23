import {
  bpeState,
  checkReply,
  computeRows,
  fixtureReport,
  mergePair,
  pairCounts,
  policyDiagnosis,
  policyShift,
  postTrainingCases,
  quantizationToy,
  releaseExample,
  releaseGate,
  replayShortKey,
  replyRequest,
  reportMatchesRelease,
  responseCacheDecision,
  scorePolicyCase,
  servingWindow,
  storeReply,
  weightMemory,
} from './arithmetic.mjs';
import { corpus, policyCases, sceneIds } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-0',
        snapshot: {
          step: 0,
        },
      },
      cues: [1, 2].map((step) => ({
        id: id + '-' + step,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export function snapshot(sceneId, step, p) {
  if (sceneId === 'opening')
    return {
      step,
      p,
      ...policyShift(step),
    };
  if (sceneId === 'pretraining')
    return {
      step,
      p,
      ...bpeState(step),
    };
  if (sceneId === 'compute-budget')
    return {
      step,
      p,
      rows: computeRows().slice(0, step + 1),
    };
  if (sceneId === 'post-training')
    return {
      step,
      p,
      cases: postTrainingCases(),
    };
  if (sceneId === 'evaluation')
    return {
      step,
      p,
      cases: policyCases.map((row) => ({
        ...row,
        pass: scorePolicyCase(row),
      })),
      passed: policyCases.filter(scorePolicyCase).length,
      report: fixtureReport(),
    };
  if (sceneId === 'compression')
    return {
      step,
      p,
      ...weightMemory(),
    };
  if (sceneId === 'serving') {
    const schedule = servingWindow();
    const time = step === 0 ? 15 * p : step === 1 ? 15 + 20 * p : 35;
    const cachePositions = step === 2 ? 15 + 5 * p : Math.min(time, 15);
    return {
      step,
      p,
      ...schedule,
      time,
      tokensStored: Math.floor(cachePositions),
      blocksNeeded: Math.ceil(Math.floor(cachePositions) / schedule.cacheBlockTokens),
    };
  }
  return {
    step,
    p,
    ...policyDiagnosis(step),
  };
}
export function sampleModel(sceneId, state) {
  const sampled = tracks[sceneId].sample(state).snapshot.step;
  const p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const step = p === 1 && state.beat < 2 ? state.beat + 1 : sampled;
  return snapshot(sceneId, step, p);
}
export function validateModel() {
  validateLifecycleUpgrade();
  assert.equal(policyShift(0).decision, 'eligible');
  assert.equal(policyShift(1).decision, 'ineligible');
  assert.equal(policyShift(1).checkerDecision, 'eligible');
  assert.equal(policyShift(2).checkerDecision, 'ineligible');
  assert.equal(policyShift(0).weightsRevision, policyShift(1).weightsRevision);
  const initialPairs = pairCounts(
    corpus.map((row) => ({
      ...row,
      tokens: [...row.word],
    })),
  );
  assert.equal(initialPairs.get('t|a'), 5);
  assert.equal(initialPairs.get('k|e'), 4);
  assert.deepEqual(
    bpeState(0).counts,
    [...initialPairs].sort((a, b) => b[1] - a[1]),
  );
  assert.deepEqual(
    bpeState(1).counts,
    [...pairCounts(bpeState(1).rows)].sort((a, b) => b[1] - a[1]),
  );
  assert.equal(pairCounts(bpeState(1).rows).has('t|a'), false);
  assert.deepEqual(mergePair([...'played'], 'a|y'), ['p', 'l', 'ay', 'e', 'd']);
  assert(Math.abs(-Math.log(0.2) - 1.6094379) < 1e-6);
  assert(Math.abs(-Math.log(0.8) - 0.2231436) < 1e-6);
  const compute = computeRows();
  assert.equal(compute[0].flops, 5.04e23);
  assert.equal(compute[1].flops, 5.88e23);
  assert.equal(compute[2].flops, 7.2e23);
  const post = postTrainingCases();
  assert.deepEqual(
    post.map((row) => row.score),
    [1, 0, 1],
  );
  assert.equal(post[2].textChecked, false);
  assert.equal(policyCases.filter(scorePolicyCase).length, 2);
  assert.deepEqual(fixtureReport(), {
    policyCasesPassed: 2,
    policyCasesTotal: 5,
    actionClaims: 1,
    p95DecisionMs: null,
    budgetMs: 1000,
  });
  assert.deepEqual(releaseGate(fixtureReport()), {
    verdict: 'BLOCK',
    blockers: ['policy cases', 'action claims', 'latency measurement pending'],
  });
  const memory = weightMemory();
  assert(Math.abs(memory.bytes[0] - 130.385) < 0.01);
  assert(Math.abs(memory.bytes[2] - 32.596) < 0.01);
  assert.equal(memory.cachePerRequest, 10);
  assert.equal(weightMemory(memory.tokens / 2).cachePerRequest, 5);
  assert(Math.abs(memory.twoRequestSubtotal - 52.596) < 0.01);
  assert(Math.abs(memory.shortfallAt48 - 4.596) < 0.01);
  assert(Math.abs(memory.remainingAt60 - 7.404) < 0.01);
  assert.equal(servingWindow().staticIdle, 585);
  assert.equal(
    sampleModel('serving', {
      beat: 1,
      beatP: 0,
    }).time,
    15,
  );
  assert.equal(
    sampleModel('serving', {
      beat: 1,
      beatP: 0.5,
    }).time,
    25,
  );
  assert.equal(
    sampleModel('serving', {
      beat: 2,
      beatP: 0,
    }).time,
    35,
  );
  const beforeFifthBlock = sampleModel('serving', {
    beat: 2,
    beatP: 0,
  });
  const afterFifthBlock = sampleModel('serving', {
    beat: 2,
    beatP: 0.5,
  });
  assert.equal(beforeFifthBlock.tokensStored, 15);
  assert.equal(beforeFifthBlock.blocksNeeded, 4);
  assert.equal(afterFifthBlock.tokensStored, 17);
  assert.equal(afterFifthBlock.blocksNeeded, 5);
  assert.equal(
    sampleModel('serving', {
      beat: 2,
      beatP: 1,
    }).tokensStored,
    20,
  );
  assert.deepEqual(
    policyDiagnosis(2).boundary.map((row) => row.decision),
    ['ineligible', 'eligible'],
  );
  for (const id of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.1, 0.5, 0.9, 1]) {
        const sample = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(sample.step, beatP === 1 && beat < 2 ? beat + 1 : beat);
      }
  return true;
}
export function validateLifecycleUpgrade() {
  const { report, bundle } = releaseExample;
  assert.equal(releaseGate(report).verdict, 'PROMOTE');
  assert.equal(releaseGate({ ...report, p95DecisionMs: 780.5 }).verdict, 'BLOCK');
  assert.equal(reportMatchesRelease(bundle, { ...bundle }), true);
  assert.equal(reportMatchesRelease(bundle, { ...bundle, template: '5' }), false);
  assert.deepEqual(policyCases.map(scorePolicyCase), [true, true, false, false, false]);
  assert.equal(replayShortKey(replyRequest, replyRequest).eligible, true);
  const recomputed = checkReply(replyRequest);
  assert.equal(recomputed.eligible, false);
  assert.equal(recomputed.executed, false);
  const saved = storeReply(recomputed);
  assert.equal(checkReply(replyRequest, saved).kind, 'hit');
  const edge = { ...replyRequest, age: 90 };
  assert.equal(checkReply({ ...edge, age: 89 }, saved).eligible, false);
  const atMinimum = checkReply(edge, saved);
  assert.equal(atMinimum.kind, 'recompute');
  assert.equal(atMinimum.eligible, true);
  const changedFlag = checkReply({ ...edge, stale: false }, storeReply(atMinimum));
  assert.equal(changedFlag.kind, 'recompute');
  assert.equal(changedFlag.eligible, false);
  assert.equal(changedFlag.executed, false);
  assert.equal(bpeState(0).selected, 't|a');
  assert.equal(bpeState(0).selectedCount, 5);
  assert.deepEqual(bpeState(1).rows.find((r) => r.word === 'rotation').tokens, [
    'r',
    'o',
    'ta',
    't',
    'i',
    'o',
    'n',
  ]);
  const q = quantizationToy();
  for (const [v, x] of [
    [q.exact, 2.84],
    [q.plain, 2.4],
    [q.scaledExact, 2.84],
    [q.scaled, 2.9],
  ])
    assert(Math.abs(v - x) < 1e-12);
  const request = {
      id: 'K10234',
      age: 75,
      stale: true,
      model: 'v4',
    },
    policy = {
      version: 'P7v3',
      threshold: 90,
    },
    checker = {
      version: 'C3',
      policyVersion: 'P7v3',
      threshold: 90,
    };
  const a = responseCacheDecision({
    request,
    policy,
    checker,
    cached: {
      identity: 'K10234|v4',
      answer: {
        eligible: true,
      },
    },
  });
  assert.equal(a.kind, 'recompute');
  assert.equal(a.eligible, false);
  assert.equal(
    responseCacheDecision({
      request: {
        ...request,
        age: 90,
      },
      policy,
      checker,
    }).eligible,
    true,
  );
  assert.equal(
    responseCacheDecision({
      request,
      policy,
      checker: {
        ...checker,
        threshold: 60,
      },
    }).kind,
    'checker_mismatch',
  );
  return true;
}
