import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exposureFrame,
  rankingResponse,
  sampleModel,
} from '../animations/capstone-product-ranking-recommendation.mjs';

test('measured learning cues keep the old direction until the spoken update begins', () => {
  const sample = (progress) =>
    sampleModel('pairwise', { beat: 1, beatP: 0.9, cues: { 'pairwise-b2-2': { progress } } });
  assert.deepEqual(sample(0).w, [1, 0]);
  assert.equal(sample(0.5).n, 6);
  assert.equal(sample(1).n, 12);
  assert.deepEqual(sample(1).w, rankingResponse().weights);
});

test('the learned response sorts eligible product identities by the actual fitted scores', () => {
  assert.deepEqual(
    rankingResponse(0).slate.map((row) => row.id),
    ['P4', 'P6', 'P5'],
  );
  const response = rankingResponse();
  assert.deepEqual(
    response.slate.map((row) => row.id),
    ['P5', 'P6', 'P4'],
  );
  assert.deepEqual(
    response.slate.map((row) => row.rank),
    [1, 2, 3],
  );
  const features = { P4: [0.95, 0.3], P5: [0.85, 0.9], P6: [0.88, 0.6] };
  for (const row of response.slate) {
    assert.equal(
      row.score,
      features[row.id].reduce((sum, value, i) => sum + value * response.weights[i], 0),
    );
    assert(!['P8', 'P11'].includes(row.id));
  }
});

test('painted impression events conserve counts and the matched ten-impression comparison', () => {
  for (const progress of [0, 0.1, 0.35, 0.7, 1]) {
    const rows = exposureFrame(progress);
    assert.equal(
      rows.reduce((sum, row) => sum + row.impressions, 0),
      Math.ceil(130 * progress),
    );
    for (const row of rows) {
      assert.equal(row.clicks, row.events.filter((event) => event.clicked).length);
      assert(row.clicks <= row.impressions);
    }
  }
  const rows = exposureFrame();
  assert.deepEqual(
    rows.map((row) => [row.id, row.impressions, row.clicks]),
    [
      ['P4', 100, 10],
      ['P5', 20, 6],
      ['P6', 10, 4],
    ],
  );
  assert.deepEqual(
    rows.map((row) => [row.equalImpressions, row.equalClicks]),
    [
      [10, 1],
      [10, 3],
      [10, 4],
    ],
  );
  assert.deepEqual(
    rows.map((row) => row.rate),
    [0.1, 0.3, 0.4],
  );
});
