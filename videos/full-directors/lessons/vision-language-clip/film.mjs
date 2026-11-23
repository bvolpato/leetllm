import assert from 'node:assert/strict';
import { paintWall } from './artwork.mjs';
import {
  opening,
  openingState,
  towers,
  cosine,
  cosineComparisonState,
  matrix,
  objective,
  training,
  zeroShot,
  search,
  matrixTurn,
  promptState,
} from './clip-scenes.mjs';
import {
  service,
  capacity,
  evidence,
  pairs,
  patches,
  slots,
  budget,
  reduction,
  evaluation,
  transfer,
} from './inspection-scenes.mjs';
import {
  batch,
  computeClipFixture,
  TEMPERATURE,
  arrows,
  scaledArrows,
  bowlTemplates,
  oppositeTemplates,
  combineTemplates,
  candidateSet,
  ranking,
  contrastiveStep,
  pct,
  rawGB,
  workerSchedule,
  allowedRecords,
  actor,
  archive,
  cachedImageAllowed,
  imageLedgerSnapshot,
  pairLogisticLoss,
  patchAttention,
  prefixCosts,
  reductionDecision,
  recall,
  exact,
  boxScore,
  gates,
  chooseCandidate,
  initialPrompts,
  revisedPrompts,
} from './comparisons.mjs';

const chapters = {
  c01: opening,
  c02: towers,
  c03: cosine,
  c04: matrix,
  c05: objective,
  c06: training,
  c07: zeroShot,
  c08: search,
  service,
  capacity,
  c09: evidence,
  'pair-labels': pairs,
  patches,
  queries: slots,
  budget,
  reduction,
  evaluation,
  transfer,
};
function draw(g, k) {
  g.save();
  g.scale(1.2, 1.2);
  paintWall(g);
  chapters[k.beat.chapterId](g, k);
  g.restore();
}

function check() {
  const near = (a, b, tolerance = 1e-10) =>
    assert(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
  const held = openingState({ beat: { beatIndex: 0 } });
  const moving = openingState({ beat: { beatIndex: 1 }, reveal: () => 0.5 });
  const pinned = openingState({ beat: { beatIndex: 1 }, reveal: () => 1 });
  assert.equal(held.move, 0);
  assert.equal(pinned.move, 1);
  assert(held.x > moving.x && moving.x > pinned.x);
  assert(held.y < moving.y && moving.y < pinned.y);
  for (const frame of [held, moving, pinned]) assert.equal(frame.caption, 'Rear wheel against brick');
  assert.deepEqual(openingState({ beat: { beatIndex: 2 }, reveal: () => 0 }), pinned);
  assert.deepEqual(openingState({ beat: { beatIndex: 2 }, reveal: () => 1 }), {
    ...pinned, caption: 'A red bicycle',
  });
  for (const v of [...batch.images, ...batch.texts]) near(Math.hypot(...v), 1);
  assert.throws(() => computeClipFixture([[0, 0]], [[1, 0]]));
  assert.throws(() => computeClipFixture([[Infinity, 1]], [[0, 1]]));
  assert(arrows[1][0] > arrows[0][0]);
  assert(scaledArrows[0][0] > scaledArrows[1][0]);
  assert.deepEqual(scaledArrows, [
    [0.8, 0.6],
    [0.6, 0.8],
  ]);
  const comparisonCues = {
    'A already has length one': { start: 0, end: 1 },
    'Divide B by fifteen': { start: 2, end: 4 },
    'Its horizontal reach becomes point six': { start: 4, end: 6 },
    'A wins at point eight': { start: 6, end: 8 },
  };
  const comparison = (elapsed) =>
    cosineComparisonState({
      beat: { beatIndex: 2 },
      elapsed,
      reveal: () => {},
      wordCue: (phrase) => comparisonCues[phrase],
    });
  assert.deepEqual(comparison(0).currentB, arrows[1]);
  assert(!comparison(0).showUnitA && comparison(1).showUnitA);
  const shrinking = comparison(3);
  near(shrinking.length, 8);
  near(shrinking.currentB[0] / shrinking.currentB[1], arrows[1][0] / arrows[1][1]);
  assert.deepEqual(comparison(4).currentB, scaledArrows[1]);
  assert(!comparison(5.99).showUnitB && comparison(6).showUnitB);
  assert(!comparison(7.99).showWinner && comparison(8).showWinner);
  assert.deepEqual(bowlTemplates.units, [[0.6, 0.8], [0.6, -0.8]]);
  assert.deepEqual(bowlTemplates.mean, [0.6, 0]);
  near(bowlTemplates.length, 0.6);
  assert.deepEqual(bowlTemplates.direction, [1, 0]);
  assert.deepEqual(oppositeTemplates.mean, [0, 0]);
  assert.equal(oppositeTemplates.length, 0);
  assert.equal(oppositeTemplates.direction, null);
  assert.throws(() => combineTemplates([0, 0], [0, 1]), RangeError);
  assert.throws(() => combineTemplates([0, Infinity], [0, 1]), RangeError);
  for (let i = 0; i < 3; i++) {
    batch.cosine[i].forEach((v, j) => near(batch.logits[i][j], v / TEMPERATURE));
    assert.equal(batch.logits[i].indexOf(Math.max(...batch.logits[i])), i);
  }
  const before = matrixTurn({ beat: { beatIndex: 1 } });
  const midway = matrixTurn({ beat: { beatIndex: 2 }, reveal: () => 0.5 });
  const after = matrixTurn({ beat: { beatIndex: 3 } });
  assert.deepEqual(before.values.map(pct), ['98.0%', '1.2%', '0.8%']);
  assert.equal(midway.turn, 0.5);
  assert.equal(midway.column, false);
  assert.deepEqual(after.values.map(pct), ['97.9%', '1.3%', '0.7%']);
  near(before.loss, -Math.log(before.values[0]));
  near(after.loss, -Math.log(after.values[0]));
  near(batch.symmetricLoss, (batch.imageToTextLoss + batch.textToImageLoss) / 2);
  assert.equal(batch.symmetricLoss.toFixed(3), '0.022');
  let previous = contrastiveStep(0);
  const order = (shares) => shares.map((_, i) => i).sort((a, b) => shares[b] - shares[a]);
  for (const p of [0.25, 0.5, 0.75, 1]) {
    const f = contrastiveStep(p);
    assert(f.symmetricLoss < previous.symmetricLoss);
    for (const direction of ['rowProbabilities', 'columnProbabilities']) {
      f[direction].forEach((shares, i) => {
        assert.equal(order(shares)[0], i);
        assert.deepEqual(order(shares), order(previous[direction][i]));
        assert(shares[i] > previous[direction][i][i]);
      });
    }
    for (const i of [1, 2]) assert(f.rowProbabilities[0][i] < previous.rowProbabilities[0][i]);
    for (const side of ['images', 'texts'])
      for (let i = 0; i < 3; i++) {
        near(Math.hypot(...f[side][i]), 1);
        assert.notDeepEqual(f[side][i], previous[side][i]);
      }
    previous = f;
  }
  assert.equal(previous.symmetricLoss.toFixed(5), '0.00894');
  const promptClock = (beatIndex, events) => ({
    beat: { beatIndex },
    reveal: (phrase) => Number(events.includes(phrase)),
  });
  const scenarios = [
    [promptClock(1, []), [0, 1, 2], ['98.0%', '1.2%', '0.8%'], true],
    [promptClock(2, ['Remove the bicycle']), [1, 2], ['61.3%', '38.7%'], false],
    [
      promptClock(2, ['Remove the bicycle', 'The bowl now gets']),
      [1, 2],
      ['61.3%', '38.7%'],
      true,
    ],
    [promptClock(2, ['Remove the bicycle', 'The bowl now gets', 'Now remove the dog']), [2], ['100%'], false],
    [promptClock(3, ['One hundred percent']), [2], ['100%'], true],
  ];
  const originalBowl = candidateSet([0, 1, 2]).at(-1);
  for (const [k, ids, shares, visible] of scenarios) {
    const { rows, showShare } = promptState(k);
    assert.deepEqual(
      rows.map((r) => r.i),
      ids,
    );
    assert.deepEqual(
      rows.map((r) => pct(r.share)),
      shares,
    );
    assert.equal(showShare, visible);
    near(rows.at(-1).cos, originalBowl.cos);
    near(rows.at(-1).weight, originalBowl.weight);
    near(
      rows.reduce((a, r) => a + r.share, 0),
      1,
    );
  }
  assert.equal(originalBowl.cos.toFixed(3), '0.027');
  assert.equal(originalBowl.weight.toFixed(2), '1.15');
  const retrieval = ranking(0);
  assert.equal(retrieval.prompt, 'A red bicycle');
  assert.deepEqual(
    retrieval.items.map((r) => [r.i, r.score.toFixed(3)]),
    [
      [0, '0.999'],
      [1, '0.142'],
      [2, '0.017'],
    ],
  );
  near(rawGB, 15.36);
  assert.deepEqual(
    [1, 2, 3].map((x) => [imageLedgerSnapshot(x).result.status, imageLedgerSnapshot(x).count]),
    [
      ['accepted', 1],
      ['replayed', 1],
      ['conflict', 1],
    ],
  );
  assert.deepEqual(allowedRecords(actor, ['East', 'West'], 13), [archive[0]]);
  assert(!cachedImageAllowed({ ...actor, sites: [] }, archive[0]));
  for (const [cap, ends] of [
    [2, [1100, 1100]],
    [1, [100, 200]],
  ]) {
    const work = workerSchedule(cap);
    assert.deepEqual(
      work.filter((j) => j.type === 'search').map((j) => j.end),
      ends,
    );
    near(
      work.reduce((ms, j) => ms + j.end - j.start, 0),
      2200,
    );
  }
  near((4 * pairLogisticLoss(0, true)) / 2, 2 * Math.log(2));
  near(pairLogisticLoss(0, false), Math.log(2));
  for (const [index, q] of [
    [0, [Math.SQRT2, 0]],
    [1, [0, Math.SQRT2]],
  ]) {
    const a = patchAttention(q);
    near(
      a.weights.reduce((s, v) => s + v, 0),
      1,
    );
    assert.equal(a.weights.indexOf(Math.max(...a.weights)), index);
    near(a.output[0], 2 * a.weights[0]);
    near(a.output[1], 2 * a.weights[1]);
  }
  const costs = prefixCosts();
  assert.deepEqual(
    [costs.visual, costs.total, costs.bytesPerToken / 1024, costs.visualMiB],
    [2304, 2484, 320, 720],
  );
  assert.equal(64 + 180, 244);
  assert.deepEqual(reductionDecision(2).selected, ['vent', 'tag']);
  assert.equal(reductionDecision(2).route, 'review');
  assert.deepEqual(reductionDecision(3).selected, ['vent', 'tag', 'layout']);
  assert.equal(reductionDecision(3).route, 'bounded analysis');
  near(recall, 2 / 3);
  near(exact, 0.5);
  near(boxScore(0.2).iou, 2 / 7);
  near(boxScore(0.1).intersection, 0.25);
  assert.deepEqual(
    gates.map((g) => g.pass),
    [true, false, true],
  );
  for (const [set, second, gap, passes] of [
    [initialPrompts, 0.53, 0.15, true],
    [revisedPrompts, 0.64, 0.04, false],
  ]) {
    const d = chooseCandidate(set);
    near(d.second.score, second);
    near(d.gap, gap);
    assert.equal(d.passes, passes);
    near(d.best.score, 0.68);
  }
}
export default { title: 'From Shared Embeddings to Visual Evidence', draw, check };
