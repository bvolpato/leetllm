import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import {
  weeklySample,
  weeklyQueue,
  firstDraw,
  bootstrapRates,
  coverageIntervals,
  readerPairs,
  sliceModel,
} from '../../../films/estimation/fixtures.mjs';
import {
  count,
  wilson,
  scoreStatistic,
  biasVarianceState,
  clusterBootstrapModel,
} from '../../../films/estimation/model.mjs';
import {
  opening,
  sampling,
  score,
  accumulating,
  boundary,
  design,
  first,
  limit,
  se,
  weighted,
  queueDraw,
  laneDraws,
} from './sampling.mjs';
import {
  bootstrap,
  prior,
  target,
  practice,
  drawn,
  tallyBins,
  posterior,
  fullMissing,
  practiceMissing,
} from './audit.mjs';
import {
  campaigns,
  bias,
  decision,
  chooseShift,
  intervals,
  redraw,
  swapped,
  clusterCount,
} from './decisions.mjs';

const scenes = [
  opening,
  sampling,
  score,
  accumulating,
  boundary,
  design,
  bootstrap,
  prior,
  target,
  campaigns,
  bias,
  practice,
  decision,
];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, a + ' differs from ' + b);
export default {
  title: 'What Can One Sample Tell Us?',
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    assert.equal(new Set(weeklySample.map((r) => r.id)).size, 400);
    assert.deepEqual([count(first.slice(0, 5)), count(first), count(weeklySample)], [1, 16, 64]);
    near(limit, 0.2);
    near(se(0.16, 100) / se(0.16, 400), 2);
    near(scoreStatistic(16, 100, 0.2), 1);
    for (const p of [intervals[0].low, intervals[0].high]) near(scoreStatistic(16, 100, p), 1.96);
    for (let t = 2; t <= 16; t++) {
      const previous = wilson(4 * (t - 1), 25 * (t - 1)),
        next = wilson(4 * t, 25 * t);
      assert.ok(next.low > previous.low && next.high < previous.high);
      assert.ok(Math.abs(next.center - 0.16) < Math.abs(previous.center - 0.16));
    }
    for (const n of [10, 20]) near(wilson(0, n).high, 1.96 ** 2 / (n + 1.96 ** 2));
    near(wilson(10, 10).low, 1 - wilson(0, 10).high);
    assert.equal(coverageIntervals.filter((r) => !r.covers).length, 2);
    assert.deepEqual(
      sliceModel.map((r) => Math.round(1000 * r.share * r.rate)),
      [84, 50, 42],
    );
    near(weighted, 0.176);
    assert.equal(new Set(queueDraw.map((item) => item.id)).size, 10);
    assert.deepEqual(
      sliceModel.map((_, i) => queueDraw.filter((d) => d.lane === i).length),
      [4, 4, 2],
    );
    for (const [i, draw] of laneDraws.entries()) {
      assert.equal(new Set(draw.map((item) => item.id)).size, 3);
      assert.ok(draw.every((item) => item.lane === i && item.slot < 100 * sliceModel[i].share));
    }
    assert.deepEqual(firstDraw.slice(0, 2), [81, 81]);
    assert.equal(drawn[0], first[81]);
    assert.equal(drawn[0], drawn[1]);
    assert.ok(drawn[0].specialist);
    assert.equal(count(drawn) / drawn.length, bootstrapRates[0]);
    near(bootstrapRates[0], 0.17);
    assert.equal(
      tallyBins(bootstrapRates).reduce((a, b) => a + b, 0),
      400,
    );
    const prior5 = posterior(1, 5),
      prior100 = posterior(16, 100);
    near(prior5.map, 2 / 7);
    near(prior5.mean, 3 / 9);
    near(prior100.map, 17 / 102);
    assert.ok(prior5.map - prior5.mle > prior100.map - prior100.mle);
    assert.ok(intervals[0].low < 0.2 && intervals[0].high > 0.2);
    assert.deepEqual(
      [fullMissing.resolvedRate, fullMissing.low, fullMissing.high],
      [0.2, 0.16, 0.36],
    );
    assert.deepEqual(
      [practiceMissing.resolvedRate, practiceMissing.low, practiceMissing.high],
      [0.2, 0.15, 0.4],
    );
    near(readerPairs.filter((r) => r.a === r.b).length / readerPairs.length, 0.75);
    assert.deepEqual([clusterCount(redraw), clusterCount(swapped)], [20, 30]);
    const cluster = clusterBootstrapModel();
    near(cluster.campaignVariance / cluster.rowVariance, 10);
    assert.deepEqual(
      [cluster.rowRange, cluster.campaignRange],
      [
        { low: 0.12, high: 0.28 },
        { low: 0, high: 0.5 },
      ],
    );
    near(biasVarianceState(10000).bias, 0.12 - weighted);
    assert.equal((100 * intervals[1].high).toFixed(2), '19.91');
    assert.equal(chooseShift(intervals[1].high), 'Regular shift');
    assert.equal(chooseShift(limit), 'Extra shift');
    assert.equal(weeklyQueue.capacity - weeklyQueue.specialist, 2000);
  },
};
