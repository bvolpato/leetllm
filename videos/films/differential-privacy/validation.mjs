import {
  clipVector,
  eventUpperBound,
  privacyEventBand,
  probabilityWidths,
  updateWithNoise,
} from './arithmetic.mjs';
import {
  adjacencySnapshot,
  clippingProgress,
  gaussianAccountantFixture,
  gaussianReleaseLedger,
  introPrivacySnapshot,
  noiseSnapshot,
  replacementSensitivity,
  userAggregateFixture,
  utilityDiagnostics,
  utilityNoiseScale,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const users = userAggregateFixture();
  assert.deepEqual(
    [users.aliceRaw, users.aliceClipped, users.full, users.withoutAlice, users.sensitivity],
    [1.5, 1, 0.625, 0.125, 0.5],
  );
  const two = gaussianAccountantFixture(2),
    three = gaussianAccountantFixture(3);
  assert.equal(two.best.alpha, 16);
  assert(Math.abs(two.best.epsilon - 1.7675283643313486) < 1e-12);
  assert(Math.abs(three.best.epsilon - 2.2675283643313486) < 1e-12);
  assert(two.best.epsilon < 2 && three.best.epsilon > 2);
  const revised = gaussianReleaseLedger([4, 4, 8]);
  assert.equal(revised.best.alpha, 16);
  assert.deepEqual(revised.best.charges, [0.5, 0.5, 0.125]);
  assert.equal(revised.best.epsilon, two.best.epsilon + 0.125);
  assert(revised.best.epsilon <= 2);
  assert(Math.hypot(0.71, 0.71) > 1);
  assert(Math.abs(Math.sqrt(7e9 / 5e6) - 37.416573867739416) < 1e-12);
  for (const progress of [0, 0.25, 0.5, 0.75, 1])
    for (const normalized of [false, true]) {
      const r = replacementSensitivity({
        cues: {
          'replace-one': {
            phase: 'during',
            progress,
          },
          'public-normalizer': {
            phase: normalized ? 'during' : 'before',
            progress: 0.5,
          },
        },
      });
      assert(Math.hypot(...r.old) <= 1);
      assert(Math.hypot(...r.replacement) <= 1);
      assert.equal(r.pairDistance, 2 * progress);
      assert.equal(r.sensitivity, 2);
      assert.equal(r.bound, normalized ? 2 / 3 : 2);
      assert(r.pairDistance <= r.sensitivity);
    }
  const normalized = replacementSensitivity({
    cues: {
      'replace-one': {
        phase: 'after',
        progress: 1,
      },
      'public-normalizer': {
        phase: 'during',
        progress: 0.5,
      },
    },
  });
  assert.equal(normalized.sensitivity, 2);
  assert.equal(normalized.bound, 2 / 3);
  assert.equal(introPrivacySnapshot(0, 3 / 20.59).baseline > 0, true);
  assert.deepEqual(introPrivacySnapshot(0, 13 / 20.59).neighborRecords, ['R1', 'R2', 'R3']);
  assert.equal(introPrivacySnapshot(1, 0).neighbor, 1);
  assert.deepEqual(adjacencySnapshot(1, 4.8 / 12.094).recordNeighbor, ['T1', 'T2']);
  assert.deepEqual(adjacencySnapshot(1, 10 / 12.094).userNeighbor, []);
  assert.deepEqual(adjacencySnapshot(2, 0).recordNeighbor, ['T1', 'T2']);
  assert.equal(clippingProgress(1, 6.75 / 15.598), 0);
  assert.equal(clippingProgress(1, 10.3375 / 15.598), 1);
  const small = clipVector([0.4, 0.3]);
  const large = clipVector([3, 4]);
  assert.equal(small.norm, 0.5);
  assert.equal(small.scale, 1);
  assert(Math.abs(large.clipped[0] - 0.6) < 1e-12 && Math.abs(large.clipped[1] - 0.8) < 1e-12);
  assert(Math.abs(Math.hypot(...large.clipped) - 1) < 1e-12);
  const aggregate = updateWithNoise(
    [
      [0.4, 0.3],
      [0.6, 0.8],
      [0.6, 0.8],
    ],
    [0.2, -0.3],
  );
  assert(
    Math.abs(aggregate.aggregate[0] - 1.6) < 1e-12 &&
      Math.abs(aggregate.aggregate[1] - 1.9) < 1e-12,
  );
  assert(Math.abs(aggregate.noisy[0] - 1.8) < 1e-12 && Math.abs(aggregate.noisy[1] - 1.6) < 1e-12);
  assert(Math.abs(eventUpperBound(0.001, 0.5) - 0.0016487212707001282) < 1e-15);
  assert.equal(eventUpperBound(0.001, 0.5, 0.0001) > eventUpperBound(0.001, 0.5), true);
  const widths = probabilityWidths(0.001, 0.5, 0.0001);
  assert(Math.abs(widths.multiplicative / widths.reference - Math.exp(0.5)) < 1e-12);
  assert.equal(widths.slack / widths.reference, 0.1);
  const narrow = privacyEventBand(0.1, 0),
    wide = privacyEventBand(1, 0),
    slack = privacyEventBand(1, 0.0001);
  assert(wide.upper > narrow.upper && wide.lower < narrow.lower);
  assert(slack.upper > wide.upper && slack.lower < wide.lower);
  for (const epsilon of [0, 0.1, 0.5, 1])
    for (const delta of [0, 0.0001, 0.002]) {
      const band = privacyEventBand(epsilon, delta);
      for (const probability of [band.lower, band.upper]) {
        assert(probability <= eventUpperBound(band.neighborProbability, epsilon, delta) + 1e-12);
        assert(band.neighborProbability <= eventUpperBound(probability, epsilon, delta) + 1e-12);
      }
    }
  const clean = utilityDiagnostics(0),
    noisy = utilityDiagnostics(1.5);
  assert.equal(clean.clippedCount, 1);
  assert.equal(clean.clippingRate, 0.25);
  assert(Math.abs(clean.utility - 1) < 1e-12);
  assert(
    noisy.utility < utilityDiagnostics(0.5).utility &&
      utilityDiagnostics(0.5).utility < clean.utility,
  );
  assert.throws(() => clipVector([1], 0), RangeError);
  assert.throws(() => utilityDiagnostics(-0.1), RangeError);
  const beforeNoise = noiseSnapshot({
    beat: 0,
    t: 11.325,
  });
  assert.deepEqual(beforeNoise.noisy, beforeNoise.aggregate);
  assert.deepEqual(
    noiseSnapshot({
      beat: 0,
      t: 15.7375,
    }).noisy,
    [1.8, 1.5999999999999999],
  );
  assert.deepEqual(
    noiseSnapshot({
      beat: 1,
      beatP: 0,
    }).noisy,
    noiseSnapshot({
      beat: 2,
      beatP: 0.9,
    }).noisy,
  );
  const earlyScale = utilityNoiseScale({
    beat: 0,
    t: 4.0125,
  });
  const middleScale = utilityNoiseScale({
    beat: 0,
    t: 11.08125,
  });
  const finalScale = utilityNoiseScale({
    beat: 0,
    t: 18.15,
  });
  assert(Math.abs(earlyScale - 0.1) < 1e-12);
  assert(Math.abs(middleScale - 0.3) < 1e-12);
  assert(Math.abs(finalScale - 0.5) < 1e-12);
  assert(utilityDiagnostics(earlyScale).utility > utilityDiagnostics(middleScale).utility);
  assert(utilityDiagnostics(middleScale).utility > utilityDiagnostics(finalScale).utility);
  assert.equal(
    utilityNoiseScale({
      beat: 1,
      beatP: 0.12,
    }),
    finalScale,
  );
  assert.equal(
    utilityNoiseScale({
      beat: 1,
      beatP: 0.88,
    }),
    finalScale,
  );
  return true;
}
