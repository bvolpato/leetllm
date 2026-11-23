import { mean, qUpdate, quantile, shaping } from './arithmetic.mjs';
import { RS_REPORTED_SOURCE, RS_REPORTED_UNITS, RS_SENTENCES, seedRows } from './fixtures.mjs';
import {
  RS_NEW_IDS,
  controlledRun,
  deltas,
  researchConstructionModel,
  sampleModel,
  shapingSnapshot,
  visibleControlRows,
} from './model.mjs';
import assert from 'node:assert/strict';
import { controlStep, ledger, openingRuns, summary } from './evidence.mjs';
export function validateOriginalResearchModel() {
  assert.equal(shapingSnapshot(1, 0.1 / 18.562).position, 0);
  assert.equal(shapingSnapshot(1, 1.7 / 18.562).completed, 1);
  assert(shapingSnapshot(1, 2.4 / 18.562).position > 0);
  assert(shapingSnapshot(1, 2.4 / 18.562).position < 1);
  assert.equal(shapingSnapshot(1, 2.95 / 18.562).completed, 2);
  assert.equal(shapingSnapshot(1, 7.6 / 18.562).completed, 3);
  assert(Math.abs(shaping(0, 1) - 0.20833333333333337) < 1e-12);
  assert(Math.abs(shaping(1, 0) + 0.11666666666666659) < 1e-12);
  assert.deepEqual(controlledRun(false), controlledRun(true, true));
  assert.notDeepEqual(controlledRun(false), controlledRun(true));
  assert.equal(qUpdate(0, 1, 100, true), 0.2);
  assert(qUpdate(0, shaping(1, 0), 0.4) > 0);
  assert.deepEqual(
    seedRows.filter((r, i) => deltas[i] < 0).map((r) => r.seed),
    [6, 11, 17, 19, 23],
  );
  assert(Math.abs(mean(deltas) - 0.14305555555555557) < 1e-12);
  assert(seedRows.every((r) => r.final_sparse === r.final_shaped));
  assert.equal(seedRows[18].final_sparse, 0.455);
  assert.equal(
    visibleControlRows(
      sampleModel({
        beat: 0,
        beatP: 0.02,
      }),
    ),
    1,
  );
  assert.equal(
    visibleControlRows(
      sampleModel({
        beat: 0,
        beatP: 0.5,
      }),
    ),
    4,
  );
  assert.equal(
    visibleControlRows(
      sampleModel({
        beat: 0,
        beatP: 0.99,
      }),
    ),
    6,
  );
  assert.equal(
    visibleControlRows(
      sampleModel({
        beat: 1,
        beatP: 0.02,
      }),
    ),
    6,
  );
  return true;
}
export function validateResearchConstruction() {
  assert.equal(RS_REPORTED_UNITS.length, 10000);
  const all = RS_REPORTED_UNITS.map((v) => v / 720);
  assert(Math.abs(quantile(all, 0.05) - 0.06111111111111111) < 1e-14);
  assert(Math.abs(quantile(all, 0.95) - 0.225) < 1e-14);
  assert.equal(
    RS_REPORTED_SOURCE.sha256,
    '4c64bf5665d7260e566ef241d54428c836029e9c40f4891abd61972ec30de53a',
  );
  const a = researchConstructionModel('actual-update', {
    beat: 1,
    beatP: 1,
  });
  assert.equal(a.alpha, 0.35);
  assert(Math.abs(a.updated - 0.0921666666666667) < 1e-12);
  const c = researchConstructionModel('covariance', {
    beat: 2,
    beatP: 1,
  });
  assert.equal(c.cov, -0.15625);
  assert.equal(c.independent, 0.0625);
  assert.equal(c.paired, 0.125);
  const f = researchConstructionModel('fresh-interpretation', {
    beat: 2,
    beatP: 1,
  });
  assert(
    f.earlyPass && f.finalPass && !f.strongerPass && !f.competenceEstablished && f.reportRepaired,
  );
  const second = researchConstructionModel('fresh-interpretation', { beat: 4, beatP: 1 });
  assert(second.earlyPass && !second.finalPass && !second.supported);
  assert.deepEqual(second.input, { ...f.input, finalInterval: [-0.03, 0.015] });
  assert.deepEqual(
    openingRuns.map((run) => run.slice(11)),
    [
      [2, 1],
      [5, 6],
    ],
  );
  assert.deepEqual(
    [ledger[14].sparse, ledger[14].shaped, ledger[6].sparse, ledger[6].shaped],
    [1, 21, 11, 2],
  );
  assert.equal(summary(ledger).gain, 103);
  assert.equal(summary(ledger.filter((row) => row.gain >= 0)).gain, 136);
  assert.equal(summary([6, 6, 14, 0].map((seed) => ledger[seed])).gain, 5);
  assert(
    controlStep(false, true).match &&
      !controlStep(true, true).match &&
      controlStep(true, false).match,
  );
  for (const beatP of [0.01, 0.5, 0.99, 1]) {
    const before = researchConstructionModel('fresh-interpretation', {
      beat: 0,
      beatP,
    });
    assert(
      !before.earlyVisible &&
        !before.finalVisible &&
        !before.limitsVisible &&
        !before.reportRepaired,
    );
  }
  const cue = 'rsx-fresh-interpretation-b1-s0';
  for (const progress of [0, 0.5, 0.99999]) {
    const pending = researchConstructionModel('fresh-interpretation', {
      beat: 1,
      cues: {
        [cue]: {
          phase: 'during',
          progress,
        },
      },
    });
    assert(!pending.earlyVisible);
  }
  for (const id of RS_NEW_IDS)
    for (const beat of RS_SENTENCES[id].keys())
      for (const beatP of [0, 0.2, 0.5, 0.9, 1, 0.4, 1])
        assert.equal(
          researchConstructionModel(id, {
            beat,
            beatP,
          }).id,
          id,
        );
  return true;
}
export function validateModel() {
  validateOriginalResearchModel();
  validateResearchConstruction();
  return true;
}
