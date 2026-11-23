import { forwardValue, mixture } from './arithmetic.mjs';
import { CENTERS, MAX_ADDED_VARIANCE, SHADOW_PIXEL, TOP_PIXEL } from './fixtures.mjs';
import { reverseSampleProgress } from './construction.mjs';
import { ddimTerms, worksheet } from './pixel-study.mjs';
import { fileDecision } from './release-study.mjs';
import {
  crossReadFixture,
  densityContours,
  freshDiffusionSnapshot,
  image,
  imageNoise,
  posteriorFixture,
  releaseJob,
  scalarReverseTrace,
  trajectories,
  trajectoryPoint,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.equal(reverseSampleProgress(0, 1), reverseSampleProgress(1, 0));
  assert.equal(reverseSampleProgress(1, 0), reverseSampleProgress(2, 0));
  assert.equal(image.length, 16 * 16);
  assert.equal(image.filter((value) => value === 1).length, 60);
  assert(image.every((value) => value === 1 || value === -0.8));
  assert.equal(imageNoise.length, image.length);
  assert(imageNoise.every(Number.isFinite));
  for (const alphaBar of [0, 0.1, 0.5, 0.9, 1]) {
    const signal = forwardValue(1, 0, alphaBar);
    const noise = forwardValue(0, 1, alphaBar);
    assert(Math.abs(signal ** 2 + noise ** 2 - 1) < 1e-12);
  }
  assert.equal(forwardValue(1, -0.4, 1), 1);
  assert.equal(forwardValue(1, -0.4, 0), -0.4);
  const step = 0.2,
    start = -8,
    samples = 80;
  for (const addedVariance of [0, 0.7, MAX_ADDED_VARIANCE]) {
    let totalMass = 0;
    for (let y = 0; y < samples; y++)
      for (let x = 0; x < samples; x++) {
        totalMass +=
          mixture([start + (x + 0.5) * step, start + (y + 0.5) * step], addedVariance).density *
          step ** 2;
      }
    assert(
      Math.abs(totalMass - 1) < 0.002,
      `mixture density integrates to ${totalMass} at variance ${addedVariance}`,
    );
  }
  assert.equal(trajectories.length, 72);
  assert(trajectories.every((path) => path.length === 721));
  assert(
    trajectories.every((path) =>
      path.every((point) => point.length === 2 && point.every(Number.isFinite)),
    ),
  );
  const meanDistanceToCenter = (points) =>
    points.reduce(
      (sum, point) =>
        sum +
        Math.min(
          ...CENTERS.map((center) => Math.hypot(point[0] - center[0], point[1] - center[1])),
        ),
      0,
    ) / points.length;
  const initialDistance = meanDistanceToCenter(trajectories.map((path) => path[0]));
  const finalDistance = meanDistanceToCenter(trajectories.map((path) => path.at(-1)));
  assert(initialDistance > 1);
  assert(finalDistance < 0.5 && finalDistance < initialDistance / 2);
  assert.deepEqual(trajectoryPoint(0, -1), trajectoryPoint(0, 0));
  assert.deepEqual(trajectoryPoint(72, 0.41), trajectoryPoint(0, 0.41));
  assert.deepEqual(trajectoryPoint(0, 2), trajectoryPoint(0, 1));
  const contours = densityContours(MAX_ADDED_VARIANCE / 2);
  assert(contours.length > 0);
  for (const contour of contours) {
    assert(contour.level > 0 && contour.level <= 0.5);
    assert(contour.points.length >= 2);
    for (const point of contour.points) {
      assert(Number.isFinite(point[0]) && Number.isFinite(point[1]));
      assert(point[0] >= -4.4 && point[0] <= 4.4 && point[1] >= -2.75 && point[1] <= 2.75);
    }
  }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  for (const [t, s, pixel, input, partial, end] of [
    [0.5, 0.9, TOP_PIXEL, 0.424, 0.949, 0.822],
    [0.36, 0.64, SHADOW_PIXEL, 0, -0.640, -0.280],
  ]) {
    const jump = worksheet(t, s);
    assert(Math.abs(jump.input[pixel] - input) < 0.0005);
    assert.equal(Number(jump.scaled[pixel].toFixed(3)), partial);
    assert.equal(Number(jump.destination[pixel].toFixed(3)), end);
    assert(jump.destination.every((v, i) => Math.abs(v - jump.reference[i]) < 1e-12));
    assert(jump.recovered.every((v, i) => Math.abs(v - image[i]) < 1e-12));
  }
  const fork = ddimTerms(image[TOP_PIXEL], imageNoise[TOP_PIXEL], 0.5, 0.9, 1);
  assert.equal((fork.center - fork.sigma).toFixed(3), '0.608');
  assert.equal((fork.center + fork.sigma).toFixed(3), '1.205');
  const [expired, resized] = releaseJob.candidates;
  assert.notEqual(resized.file.digest, resized.checked.digest);
  assert.equal(fileDecision(expired, releaseJob.currentAttempt, true), 'fenced');
  assert.equal(fileDecision(resized, releaseJob.currentAttempt, true), 'hold');
  const checked = { ...resized, checked: resized.file };
  assert.equal(fileDecision(checked, releaseJob.currentAttempt, false), 'hold');
  assert.equal(fileDecision(checked, releaseJob.currentAttempt, true), 'publish');
  const r = scalarReverseTrace();
  assert.equal(r.rows[0].next.toFixed(3), '1.141');
  assert.equal(r.rows[1].next.toFixed(3), '1.174');
  assert.equal(r.final.toFixed(3), '1.111');
  assert.notEqual(r.resetNext, r.restoredNext);
  assert(Math.abs(posteriorFixture().total - 5 / 9) < 1e-12);
  const a = crossReadFixture();
  assert.equal(a.output[0].toFixed(3), '0.589');
  assert.equal(a.output[1].toFixed(3), '0.311');
  for (const name of ['fresh-work', 'fresh-old', 'fresh-current']) {
    const s = freshDiffusionSnapshot({
      beat: 1,
      beatP: 1,
      cues: {
        ['df-' + name]: {
          phase: 'during',
          progress: 0.999,
        },
      },
    });
    assert.equal(
      s[
        {
          'fresh-work': 'work',
          'fresh-old': 'old',
          'fresh-current': 'current',
        }[name]
      ],
      null,
    );
  }
  return true;
}
