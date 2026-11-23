import {
  exactPairedP,
  preferenceProbability,
  rankedPrecision,
  strictMetricRecord,
  subsetCoverage,
  wilsonInterval,
} from './arithmetic.mjs';
import { PAIRS, RELEASES, sceneIds } from './fixtures.mjs';
import {
  checkProbe,
  freshAuditDecision,
  freshAuditReveal,
  releaseResult,
  sampleModel,
  scoreCases,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(
    ['A', 'B'].map((model) => scoreCases(model).correct),
    [90, 90],
  );
  assert.deepEqual(
    ['A', 'B'].map((model) => scoreCases(model, 'renewal').correct),
    [2, 9],
  );
  assert.deepEqual(
    [0, 1, 2].map((index) => checkProbe(index).literal),
    [true, true, false],
  );
  assert.deepEqual(
    [0, 1, 2].map((index) => checkProbe(index).reviewed),
    [true, false, true],
  );
  assert.equal(PAIRS.length, 28);
  assert.equal(PAIRS.filter((pair) => pair.pass).length, 13);
  assert(Math.abs(subsetCoverage(8, 2, 2) - 13 / 28) < 1e-12);
  assert.equal(subsetCoverage(8, 2, 1), 0.25);
  assert.equal(subsetCoverage(8, 0, 2), 0);
  assert.equal(subsetCoverage(8, 8, 2), 1);
  for (const id of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 1e-6, 0.08, 0.25, 0.5, 0.84, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'candidates') {
          assert.equal(s.successes, s.revealed.filter((pair) => pair.pass).length);
          assert(s.visible >= 0 && s.visible <= 28);
          if (s.selected) assert.equal(s.selected.pass, false);
        }
        if (id === 'exposure') {
          assert.equal(s.regression, s.rows.filter((row) => row.used && row.settled).length);
          assert.equal(s.holdout, s.rows.filter((row) => !row.used && row.settled).length);
          for (const row of s.rows) assert([row.x, row.y].every(Number.isFinite));
        }
        if (id === 'uncertainty') assert.equal(s.allPass, 0.8 ** s.n);
        if (id === 'gates') {
          assert.equal(s.visibleRows, beat === 0 ? Math.min(3, Math.floor(s.p * 3) + 1) : 3);
          for (const row of s.rows) {
            assert([row.quality, row.ms, row.cost, row.schema].every(Number.isFinite));
            assert.equal(row.qualityPass, row.quality >= 0.98);
            assert.equal(row.latencyPass, row.ms <= 900);
          }
        }
      }
  assert.deepEqual(
    [0.02, 0.5, 0.98].map(
      (beatP) =>
        sampleModel('gates', {
          beat: 0,
          beatP,
        }).visibleRows,
    ),
    [1, 2, 3],
  );
  const end = sampleModel('exposure', {
    beat: 2,
    beatP: 0.99,
  });
  assert.deepEqual([end.regression, end.holdout], [2, 2]);
  assert(end.rows.find((row) => row.id === 'C').used);
  const arrived = sampleModel('exposure', {
    beat: 2,
    beatP: 0.75,
  });
  assert.equal(arrived.holdout, 2);
  assert(arrived.rows.every((row) => !row.settled || row.y === 660));
  assert.deepEqual(
    RELEASES.map((row) => releaseResult(row, 0).eligible),
    [false, true, true],
  );
  assert.deepEqual(
    RELEASES.map((row) => releaseResult(row, 2).eligible),
    [false, true, false],
  );
  assert(
    Math.abs(
      sampleModel('uncertainty', {
        beat: 0,
        beatP: 0.5,
      }).allPass - 0.512,
    ) < 1e-12,
  );
  assert(
    Math.abs(
      sampleModel('uncertainty', {
        beat: 1,
        beatP: 0.5,
      }).allPass - 0.001237940039,
    ) < 1e-12,
  );
  return validateAuditExpansion();
}
export function validateAuditExpansion() {
  assert(Math.abs(rankedPrecision([1, 0, 1]) - 5 / 6) < 1e-12);
  assert(Math.abs(preferenceProbability(400) - 10 / 11) < 1e-12);
  assert.equal(preferenceProbability(0), 0.5);
  assert(Math.abs(exactPairedP(9, 1) - 0.021484375) < 1e-12);
  assert.equal(exactPairedP(3, 1), 0.625);
  assert.equal(exactPairedP(5, 0), 0.0625);
  assert(Math.abs(wilsonInterval(3, 3).low - 0.4384939195509822) < 1e-12);
  assert(Math.abs(wilsonInterval(40, 40).low - 40 / (40 + 1.96 ** 2)) < 1e-12);
  const f = freshAuditDecision();
  assert.equal(f.bothPass + f.fixed + f.broken + f.bothFail, f.total);
  assert.equal(f.bothPass + f.broken, f.baselinePass);
  assert.equal(f.bothPass + f.fixed, f.candidatePass);
  assert.equal(f.ship, false);
  assert(Math.abs(f.criticalLower - 0.5958436145024278) < 1e-12);
  const valid = {
    policy: 0.99,
    schema: 1,
    ms: 0,
    cost: 0,
  };
  assert(strictMetricRecord(valid));
  for (const bad of [false, NaN, -1, Infinity, '0'])
    assert(
      !strictMetricRecord({
        ...valid,
        ms: bad,
      }),
    );
  assert.deepEqual(
    freshAuditReveal({
      beat: 0,
      beatP: 1,
    }),
    {
      paired: false,
      bound: false,
      hold: false,
    },
  );
  assert.deepEqual(
    freshAuditReveal({
      beat: 1,
      beatP: 1,
      cues: {
        'ba-fresh-report-pvalue': {
          phase: 'before',
        },
        'ba-fresh-report-bound': {
          phase: 'before',
        },
      },
    }),
    {
      paired: false,
      bound: false,
      hold: false,
    },
  );
  return true;
}
