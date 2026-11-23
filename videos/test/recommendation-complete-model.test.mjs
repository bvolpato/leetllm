import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  judgedListState,
  reciprocalPrecision,
  crossVectorState,
  crossMatrixState,
  preferredPairs,
  rankNetStep,
  metricSwapState,
  lambdaPairLedger,
  listDistributionStep,
  examinationState,
  sourceSlate,
  eventIntegrity,
  developerAggregation,
  permissionTransfer,
  TOWER_OBSERVED,
  draw,
} from '../animations/recommendation.mjs';
registerLessonFonts();
const near = (a, b) => assert(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('a missing useful record lowers the system denominator while a survivor-only ranker can remain perfect', () => {
  const m = judgedListState(['api-guide', 'blog-post', 'legacy-changelog']);
  assert.equal(m.local, 1);
  assert(m.system < 0.7);
  assert.equal(m.recall, 1 / 3);
  assert.equal(judgedListState(['private-draft']).valid, false);
  const changed = judgedListState(['retry-runbook', 'sdk-example', 'blog-post'], {
    revoked: ['api-guide'],
  });
  assert.deepEqual(changed.ideal, [2, 2, 0]);
  assert.equal(changed.system, 1);
});
test('reciprocal rank, thresholded precision and cutoff denominators preserve their separate contracts', () => {
  const m = reciprocalPrecision([0, 3, 1, 2], { threshold: 2, totalRelevant: 2 });
  assert.equal(m.rr, 0.5);
  near(m.ap, 0.5);
  assert.equal(reciprocalPrecision([2], { cutoff: 1, totalRelevant: 2 }).ap, 1);
  assert.equal(
    reciprocalPrecision([2], { cutoff: 1, totalRelevant: 2, fullDenominator: true }).ap,
    0.5,
  );
});
test('moving the bias inside the cross product changes the output and joint-query coordinates remain effective', () => {
  assert.deepEqual(crossVectorState().result, [15.5, 23]);
  assert.deepEqual(crossMatrixState().result, [16, 31]);
  const weights = [0.5, 0.25, 0.5, 0.25],
    item = [1, 2];
  const first = crossVectorState([0, 1, ...item], [0, 1, ...item], weights, [0, 0, 0, 0]);
  const second = crossVectorState([1, 0, ...item], [1, 0, ...item], weights, [0, 0, 0, 0]);
  assert.deepEqual(first.result.slice(2), [2.25, 4.5]);
  assert.deepEqual(second.result.slice(2), [2.5, 5]);
});
test('strict preferred pairs exclude ties and the RankNet parameter gradient matches central differences', () => {
  assert.equal(preferredPairs().length, 8);
  const a = [0.8, 0.3],
    z = [0.2, 0.9],
    w = [0.15, -0.4],
    m = rankNetStep(a, z, w, 0.2),
    eps = 1e-6;
  w.forEach((_, i) => {
    const plus = w.map((v, j) => v + (j === i ? eps : 0)),
      minus = w.map((v, j) => v - (j === i ? eps : 0));
    near(m.gradient[i], (rankNetStep(a, z, plus).loss - rankNetStep(a, z, minus).loss) / (2 * eps));
  });
  assert(m.nextLoss < m.loss);
  const f = rankNetStep(a, z),
    r = rankNetStep(z, a);
  r.gradient.forEach((v, i) => near(v, -f.gradient[i]));
});
test('metric weighting uses the full grade-and-position swap and yields opposite document signals', () => {
  const a = metricSwapState(),
    b = metricSwapState([0, 2, 3, 0, 2], 4, 3);
  assert(a.delta > b.delta * 20);
  near(a.preferredDerivative, -a.delta / 2);
  near(a.otherDerivative, -a.preferredDerivative);
  const noChange = metricSwapState([2, 2, 0], 0, 1);
  assert.equal(noChange.delta, 0);
});
test('a shared list normalizer couples score gradients and the implemented derivative matches finite differences', () => {
  const target = [0.6, 0.1, 0.3],
    scores = [0.3, -0.2, 0.1],
    m = listDistributionStep(target, scores),
    eps = 1e-6;
  near(
    m.gradient.reduce((s, v) => s + v, 0),
    0,
  );
  scores.forEach((_, i) => {
    const plus = scores.map((v, j) => v + (i === j ? eps : 0)),
      minus = scores.map((v, j) => v - (i === j ? eps : 0));
    near(
      m.gradient[i],
      (listDistributionStep(target, plus).loss - listDistributionStep(target, minus).loss) /
        (2 * eps),
    );
  });
  assert.notEqual(
    listDistributionStep([0.5, 0.5], [0, 0]).predicted[0],
    listDistributionStep([0.5, 0.25, 0.25], [0, 0, 0]).predicted[0],
  );
});
test('relative examination anchors and clipping change the target while zero exposure remains undefined', () => {
  near(examinationState({ probability: 0.8 }).corrected, 0.5);
  near(examinationState({ clicks: 20, probability: 0.4 }).corrected, 0.5);
  near(examinationState({ probability: 0.02, cap: 10, relevance: 0.5 }).expected, 0.1);
  assert.equal(examinationState({ probability: 0 }).corrected, null);
});
test('hard source capacity and a current revocation cannot be repaired by a high score or a private reserve', () => {
  assert.deepEqual(sourceSlate().selected, ['api-guide', 'retry-runbook', 'blog-post']);
  assert.equal(sourceSlate({ onlySource: 'platform' }).underfilled, true);
  assert.equal(sourceSlate({ onlySource: 'platform' }).selected.length, 2);
  const m = permissionTransfer();
  assert.deepEqual(m.current.selected, ['retry-runbook', 'sdk-example', 'blog-post']);
  assert.equal(m.newReport.system, 1);
  assert.equal(m.oldEligibilityVersion, 'E1');
  assert.equal(m.newEligibilityVersion, 'E2');
});
test('orphan ownership, duplicate event identity and developer aggregation fail independently', () => {
  const m = eventIntegrity(
    [
      { request: 'R1', document: 'A' },
      { request: 'R1', document: 'B' },
    ],
    [
      { id: 'E1', request: 'R1', document: 'A' },
      { id: 'E1', request: 'R1', document: 'B' },
      { id: 'E3', request: 'R2', document: 'B' },
    ],
  );
  assert.equal(m.join, false);
  assert.equal(m.unique, false);
  assert.equal(m.orphans.length, 1);
  assert.deepEqual(m.duplicateIds, ['E1']);
  const a = developerAggregation();
  near(a.mean, 5 / 9);
  near(a.pooled, 0.2);
});
test('the observed selected tower vectors remain compatible with the retained query and dimensional work', () => {
  assert.equal(TOWER_OBSERVED.query.length, 16);
  assert.equal(TOWER_OBSERVED.catalogCount, 1000);
  assert.equal(TOWER_OBSERVED.crossDimension, 32);
  for (const row of TOWER_OBSERVED.selected) {
    assert.equal(row.embedding.length, 16);
    near(
      row.embedding.reduce((s, v, i) => s + v * TOWER_OBSERVED.query[i], 0),
      row.score,
    );
  }
});
function paintFresh(phases) {
  const cues = Object.fromEntries(
    [
      'permission-revoked',
      'permission-block',
      'permission-reserve',
      'permission-ideal',
      'permission-result',
    ].map((id) => [
      id,
      {
        phase: phases[id] ?? 'before',
        progress: phases[id] === 'after' ? 1 : 0,
        active: false,
        strength: 0,
        targets: ['fresh-permission-construction'],
      },
    ]),
  );
  const ctx = createCanvas(1920, 1080).getContext('2d');
  return drawFrame(
    ctx,
    {},
    { id: 'fresh-permission', title: 'Rebuild current permission' },
    { beat: 1, beatP: 0.98, opacity: 1, cues },
    draw,
  );
}
test('the permission transfer withholds replacement identities and the new-universe result until their own payoffs', () => {
  const before = paintFresh({ 'permission-revoked': 'after', 'permission-block': 'after' });
  assert(!before.labels.some((l) => l.x > 1000 && l.text === 'runbook'));
  const reserve = paintFresh({
    'permission-revoked': 'after',
    'permission-block': 'after',
    'permission-reserve': 'after',
  });
  for (const title of ['runbook', 'SDK example', 'general blog'])
    assert(reserve.labels.some((l) => l.x > 1000 && l.text === title));
  assert(!reserve.labels.some((l) => l.text === 'E2 system NDCG = 1.000'));
  const after = paintFresh({
    'permission-revoked': 'after',
    'permission-block': 'after',
    'permission-reserve': 'after',
    'permission-ideal': 'after',
    'permission-result': 'after',
  });
  assert(after.labels.some((l) => l.text === 'E2 system NDCG = 1.000'));
  assert.deepEqual(layoutIssues(after), []);
});

test('all-pair LambdaRank accumulation retains opposite ownership and a zero total signal', () => {
  const m = lambdaPairLedger();
  assert.equal(m.pairs.length, 8);
  near(
    m.total.reduce((s, v) => s + v, 0),
    0,
  );
  for (const pair of m.pairs) {
    near(
      pair.values.reduce((s, v) => s + v, 0),
      0,
    );
    assert(pair.values[pair.preferred] < 0);
    assert(pair.values[pair.other] > 0);
  }
  assert(m.total[2] < 0);
  assert(m.total[0] > 0);
});
test('the capacity traversal moves each document once and stops the SDK object before the full-source gate', () => {
  for (let i = 0; i <= 40; i++) {
    const q = i / 40,
      ctx = createCanvas(1920, 1080).getContext('2d'),
      audit = drawFrame(
        ctx,
        {},
        { id: 'policy-underfill', title: 'Source capacity' },
        {
          beat: 1,
          beatP: 0.99,
          opacity: 1,
          cues: {
            'slate-capacity': {
              phase: q === 0 ? 'before' : q === 1 ? 'after' : 'during',
              progress: q,
              active: false,
              strength: 0,
            },
            'slate-two': { phase: 'before', progress: 0, active: false, strength: 0 },
          },
        },
        draw,
      );
    for (const title of ['API guide', 'runbook', 'SDK example', 'general blog'])
      assert.equal(
        audit.labels.filter((l) => l.text === title).length,
        1,
        title + ' has one current owner at ' + q,
      );
    assert.deepEqual(layoutIssues(audit), [], 'capacity traversal ' + q);
    if (q === 1) {
      assert(audit.labels.find((l) => l.text === 'SDK example').x < 960);
      assert(audit.labels.find((l) => l.text === 'general blog').x > 960);
    }
  }
});

test('metric-pair labels stay clear of the full swap arc throughout the comparison', () => {
  for (const progress of [0, 0.2, 0.4, 0.5, 0.5490379008746361, 0.6, 0.8, 1]) {
    const canvas = createCanvas(1920, 1080),
      state = {
        beat: 1,
        beatP: 0.4901365705614569,
        t: 37,
        duration: 86.53333333333333,
        opacity: 1,
        cues: {
          'lambda-swaps': {
            phase: 'during',
            progress,
            active: true,
            strength: 1,
            targets: ['metric-pair-construction'],
          },
          'lambda-derivatives': {
            phase: 'before',
            progress: 0,
            active: false,
            strength: 0,
            targets: ['metric-pair-construction'],
          },
        },
      };
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'metric-pair', title: 'Weight the actual swap' },
      state,
      draw,
    );
    assert.deepEqual([...(frame.issues ?? []), ...layoutIssues(frame)], []);
  }
});
