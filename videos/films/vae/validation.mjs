import { collapseCaption, collapseProgress, gaussianPixelLoss, kl } from './arithmetic.mjs';
import { center, collapseCodes, coordinateSwapStudy, eps, lv, mu, pixels } from './fixtures.mjs';
import {
  binaryInformationState,
  codebookFrame,
  codesFrame,
  collapseDifference,
  collapseOutputs,
  decode,
  dist,
  freeBitsState,
  freshCollisionState,
  gaussianEvidenceState,
  mse,
  priorDecodeFrame,
  reparameterizationFrame,
  sample,
  sig,
  z,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.equal(z[0], 0.8875);
  for (const progress of [0, 0.25, 0.5, 1]) {
    const current = reparameterizationFrame(1, 0.1, {
      'encoder-mean-b2-1': {
        phase: 'after',
        progress: 1,
      },
      'encoder-scale-b2-2': {
        phase: 'during',
        progress,
      },
    });
    assert.equal(current.mean[0], mu[0] + 0.7);
    assert.equal(current.scale[0], sig[0] + 0.55 * progress);
    assert.equal(current.sample[0], current.mean[0] + current.scale[0] * eps[0]);
    assert.deepEqual(current.noise, eps);
    assert.equal(current.changingScale, true);
    assert.equal(current.stage, 'change scale · noise stays fixed');
  }
  assert.ok(Math.abs(mse - 0.0027) < 0.0001);
  assert.ok(Math.abs(kl(mu, lv) - 0.200878) < 1e-5);
  assert.equal(kl([0, 0], [0, 0]), 0);
  assert.ok(Math.abs(sample[0] - 0.752344) < 1e-5);
  const priorOutput = priorDecodeFrame(1);
  assert.deepEqual(reparameterizationFrame(2, 1, {}).sample, priorOutput.latent);
  assert.deepEqual(priorOutput.pixels, decode(priorOutput.latent));
  assert(priorOutput.pixels.every((value) => value >= 0 && value <= 1));
  assert.notDeepEqual(priorOutput.pixels, decode([0, 0]));
  assert.equal(priorDecodeFrame(0.5).reveal, 0.5);
  assert.equal(dist.indexOf(Math.min(...dist)), 1);
  assert.deepEqual(
    codebookFrame(0, 0).distances.map((v) => Number(v.toFixed(4))),
    [2.4004, 0.0074, 1.3844],
  );
  const spatialStart = codesFrame(2, 0.25, {
      'latent-patch-b3-1': {
        phase: 'before',
        progress: 0,
      },
    }),
    spatialMiddle = codesFrame(2, 0.25, {
      'latent-patch-b3-1': {
        phase: 'during',
        progress: 0.5,
      },
    }),
    spatialEnd = codesFrame(2, 0.25, {
      'latent-patch-b3-1': {
        phase: 'after',
        progress: 1,
      },
    });
  assert.equal(codesFrame(0, 0).mode, 'codebook');
  assert.equal(codesFrame(1, 0).mode, 'codebook');
  assert.equal(spatialStart.mode, 'spatial');
  assert.equal(spatialStart.revealedPatchPositions, 0);
  assert.equal(spatialMiddle.revealedPatchPositions, 64);
  assert.equal(spatialEnd.revealedPatchPositions, 64);
  assert.equal(spatialMiddle.transportProgress, 0);
  assert.equal(spatialMiddle.targetPositionVisible, false);
  assert.equal(spatialEnd.transportProgress, 1);
  assert.equal(spatialEnd.targetPositionVisible, true);
  assert.equal(spatialEnd.stride, 8);
  assert.equal(spatialEnd.positionReduction, 64);
  assert.equal(spatialEnd.inputPositionCount, 512 * 512);
  assert.equal(spatialEnd.latentPositionCount, 64 * 64);
  assert.equal(codesFrame(2, 0.02, {}).countVisible, false);
  assert.equal(codesFrame(2, 0.5, {}).countVisible, true);
  assert.equal(codesFrame(2, 0.5, {}).costVisible, false);
  assert.equal(codesFrame(2, 0.75, {}).costVisible, true);
  assert.equal(
    codesFrame(2, 0.5, {
      'latent-position-count-b3-2': {
        phase: 'before',
        progress: 0,
      },
    }).countVisible,
    false,
  );
  assert.equal(
    codesFrame(2, 0.02, {
      'latent-position-count-b3-2': {
        phase: 'during',
        progress: 0.1,
      },
    }).countVisible,
    true,
  );
  for (let i = 0; i <= 1000; i++) {
    const gain = 1 - i / 1000,
      outputs = collapseOutputs(i / 1000);
    assert.deepEqual(collapseCodes, [
      [0.9, 0.15],
      [0.15, 0.9],
    ]);
    assert(Math.abs(collapseDifference(i / 1000) - gain * collapseDifference(0)) < 1e-12);
    assert(outputs.every((row) => row.every(Number.isFinite)));
  }
  assert.equal((512 * 512) / (64 * 64), 64);
  assert.equal(collapseProgress(0, 1), 0);
  assert.equal(collapseProgress(1, 0.25), 0);
  const collapseMiddle = collapseProgress(1, 0.35);
  assert.ok(collapseMiddle > 0 && collapseMiddle < 1);
  assert.equal(collapseProgress(1, 0.8), 1);
  assert.equal(collapseProgress(2, 0), 1);
  assert.ok(collapseDifference(0) > 0);
  assert.ok(collapseDifference(collapseMiddle) > 0);
  assert.equal(collapseDifference(1), 0);
  assert.equal(collapseCaption(1, 0), 'different codes, different output');
  assert.equal(collapseCaption(1, collapseMiddle), 'decoder sensitivity to the code falls');
  assert.equal(collapseCaption(1, 1), 'same output for both codes');
  assert.equal(collapseCaption(2, collapseProgress(2, 0)), 'same output for both codes');
  return true;
}
export function validateConstructionModel() {
  const x = [0.10, 0.90, 0.85, 0.12], prediction = [0.12, 0.84, 0.80, 0.14];
  const four = gaussianPixelLoss(x, prediction, 0.25);
  const eight = gaussianPixelLoss([...x, ...x], [...prediction, ...prediction], 0.25);
  assert(Math.abs(four.error - 0.0138) < 1e-12);
  assert(Math.abs(eight.error - 0.0276) < 1e-12);
  assert(Math.abs(eight.mean - four.mean) < 1e-12);
  assert(Math.abs(eight.nll - 2 * four.nll) < 1e-12);
  assert(Math.abs(four.mean - four.error / 8) < 1e-12);
  assert.equal(center.filter((i) => pixels[i] > 0.9).length, 1);
  assert.equal(center.filter((i) => decode(z)[i] > 0.9).length, 4);
  const { batchMSE, firstOnlyRows } = coordinateSwapStudy;
  assert.equal(batchMSE.first.toFixed(4), batchMSE.own.toFixed(4));
  assert.equal(batchMSE.second.toFixed(4), batchMSE.both.toFixed(4));
  assert(batchMSE.second > 200 * batchMSE.first);
  assert(firstOnlyRows[0][6] > 0.85 && firstOnlyRows[0][16] < 0.20);
  assert(firstOnlyRows[1][6] < 0.20 && firstOnlyRows[1][16] > 0.85);
  for (let i = 0; i <= 1000; i++) {
    const e = gaussianEvidenceState(i / 1000);
    assert(e.elbo <= e.logEvidence + 1e-12);
    assert(Math.abs(e.elbo + e.gap - e.logEvidence) < 1e-12);
    const q = binaryInformationState(i / 1000);
    assert(Math.abs(q.joint.flat().reduce((a, v) => a + v, 0) - 1) < 1e-12);
    assert(q.mutualInformation >= -1e-12);
  }
  assert(Math.abs(gaussianEvidenceState(1).gap) < 1e-12);
  assert(Math.abs(gaussianEvidenceState(0).gap - 0.17592640972002732) < 1e-12);
  const f = freeBitsState();
  assert(Math.abs(f.groupCharge - 1.2) < 1e-12);
  assert.equal(f.exampleCharge, 1.6);
  assert.deepEqual(f.groupGradients, [0.5, 0.5]);
  assert.deepEqual(f.exampleGradients, [0, 0.5]);
  const collision = freshCollisionState(2, 1);
  assert(
    collision.codes.every((v) => Math.abs(v[0] - 0.7) < 1e-12 && Math.abs(v[1] - 0.3) < 1e-12),
  );
  assert.deepEqual(collision.codes[0], collision.codes[1]);
  assert.deepEqual(collision.outputs[0], collision.outputs[1]);
  assert(Math.abs(collision.mse[0] - 0.01322896) < 1e-12);
  assert(Math.abs(collision.mse[1] - 0.00682896) < 1e-12);
  const peak = (row) => Math.max(...center.map((i) => row[i]));
  assert.deepEqual(collision.inputs.map(peak), [1, 0.8]);
  assert(collision.outputs.every((row) => Math.abs(peak(row) - 0.78) < 1e-12));
  return true;
}
export function validateModel() {
  validateOriginalModel();
  validateConstructionModel();
  return true;
}
