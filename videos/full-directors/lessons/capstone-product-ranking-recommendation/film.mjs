import assert from 'node:assert/strict';
import * as shop from './catalog.mjs';
import * as train from './training.mjs';
import * as log from './feedback.mjs';
import * as trial from './decisions.mjs';
import * as data from './experiment.mjs';
import { background } from './studio.mjs';

const scenes = [
  shop.opening,
  shop.shortlist,
  shop.diversity,
  shop.recheck,
  shop.order,
  shop.metric,
  shop.missing,
  shop.gates,
  train.preference,
  train.onePair,
  train.ninePairs,
  train.freeze,
  train.calendar,
  train.learning,
  log.displays,
  log.examination,
  log.support,
  log.filing,
  log.lineage,
  log.outcome,
  log.assignment,
  trial.purchaseValue,
  trial.returns,
  trial.receipt,
  trial.lampPractice,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  background(ctx);
  scenes[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
function check() {
  const {
    byId,
    measure,
    printers,
    eligible,
    reason,
    ids,
    mmr,
    pending,
    split,
    requests,
    selectedFit,
    join,
    event,
    events,
  } = data;
  assert.equal(reason(byId.P8), 'Policy block');
  assert.equal(reason(byId.P11), 'Outside delivery region');
  assert.deepEqual(ids(printers.slice(0, 3).filter((p) => !reason(p))), ['P5']);
  assert.deepEqual(ids(eligible), ['P5', 'P6', 'P4']);
  assert.equal(reason({ ...byId.P5, stock: false }), 'Sold out');
  assert.deepEqual(ids(data.saveProposal(eligible, printers)), ids(eligible));
  assert.deepEqual(
    data.saveProposal(
      eligible,
      printers.map((p) => ({ ...p, stock: p.stock && p.id !== 'P5' })),
    ),
    [],
  );
  assert.equal(mmr(byId.P5, false).value.toFixed(3), '0.576');
  assert.deepEqual(
    [byId.P6, byId.P4].map((p) => mmr(p, true).value.toFixed(3)),
    ['0.144', '0.230'],
  );
  for (const [rows, found, score] of [
    [data.control, 2, '0.736'],
    [eligible, 2, '1.000'],
    [[byId.P5, byId.P4], 1, '0.812'],
    [[byId.P5, byId.P4, byId.P6], 2, '0.972'],
  ]) {
    const result = measure(rows);
    assert.equal(result.found, found);
    assert.equal(result.total, 2);
    assert.equal(result.ndcg.toFixed(3), score);
    assert.equal(result.observed, data.dcg(rows.map((r) => r.grade)));
  }
  assert.equal(data.percentile(data.latencies, 0.95), 18);
  const controlGain = measure(data.control);
  assert.deepEqual([controlGain.observed, controlGain.ideal].map((x) => x.toFixed(3)), ['6.917', '9.393']);
  assert.equal(data.rankingResponse(0).slate[0].id, 'P4');
  assert.deepEqual(ids(data.rankingResponse(12).slate), ['P5', 'P6', 'P4']);
  assert.equal(data.TRAINING_PAIRS.length, 9);
  const pair = data.TRAINING_PAIRS.find((p) => p.better === 'A2' && p.worse === 'A1');
  const gradient = data.meanPairGradient([0, 0], 0, [pair]);
  const w = gradient.map((x) => -0.3 * x);
  assert.deepEqual(
    w.map((x) => x.toFixed(3)),
    ['-0.015', '0.090'],
  );
  assert.equal(data.dot(w, pair.difference).toFixed(4), '0.0555');
  assert.deepEqual(
    data.meanPairGradient([0, 0]).map((x) => (-0.3 * x).toFixed(5)),
    ['-0.00500', '0.04833'],
  );
  assert.equal(split(pending(false, false)), 'Pending');
  assert.equal(split(pending(true, false)), 'Train');
  assert.equal(split({ ...pending(true, false), labelTimes: [4.75, 5, 4.75] }), 'Pending');
  assert.equal(split(pending(true, true)), 'Invalid feature');
  assert.deepEqual(
    ['Train', 'Validation', 'Test'].map((s) => requests.filter((r) => split(r) === s).length),
    [3, 2, 2],
  );
  assert.equal(selectedFit.lambda, 0.1);
  assert.equal(selectedFit.test, 1);
  assert.deepEqual(
    selectedFit.weights.map((x) => x.toFixed(3)),
    ['-0.109', '1.229'],
  );
  assert.deepEqual(
    data.exposure.map((r) => [r.impressions, r.clicks, r.equalClicks]),
    [
      [100, 10, 1],
      [20, 6, 3],
      [10, 4, 4],
    ],
  );
  for (const [cap, a, b] of [
    [null, 0.5, 0.5],
    [2, 0.5, 0.2],
    [1, 0.4, 0.1],
  ]) {
    assert.equal(data.clickRow(0.8, cap).weighted, a);
    assert.equal(data.clickRow(0.2, cap).weighted, b);
  }
  assert.deepEqual([data.clickRow(0.8, 1, 50).clicks, data.clickRow(0.2, 1, 50).clicks], [20, 5]);
  assert.deepEqual(
    data.responses.slice(0, 2).map((r) => data.arm(r.shopper)),
    ['control', 'treatment'],
  );
  assert.equal(join(events[0]), 'Position 1');
  assert.equal(join(events[1]), 'Position 1');
  assert.equal(join(events[0], [events[0]]), 'Replay, count once');
  assert.equal(join({ ...events[0], product: 'P9' }, [events[0]]), 'ID conflict');
  assert.equal(join({ ...events[0], product: 'P9' }), 'Absent from response');
  assert.equal(join(event('EVT-902', 'REQ-501', 'P6', 3)), 'Before serving');
  assert.equal(data.returnsRule(4, 6).verdict, 'Stop treatment');
  assert.equal(data.returnsRule(0, 6).verdict, 'Hold comparison');
  assert.equal(data.REQUIRED_GATES.length, 17);
  assert.deepEqual(
    data.lamps.map((lamp) => [lamp.id, lamp.score.toFixed(2)]),
    [['J1', '0.16'], ['J2', '1.01'], ['J3', '0.66'], ['J5', '0.31']],
  );
  assert.deepEqual(ids(data.proposed), ['J2', 'J3', 'J1']);
  assert.deepEqual(ids(data.returned), ['J2', 'J5', 'J1']);
  assert.equal(data.returned[1].score.toFixed(2), '0.31');
  assert.equal(join(event('E31', 'L17', 'J3', 60)), 'Absent from response');
  assert.equal(join(event('E32', 'L17', 'J5', 120)), 'Position 2');
}
export default { title: 'Build a Ranking Experiment', draw, check };
