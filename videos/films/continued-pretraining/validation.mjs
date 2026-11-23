import { CHECKPOINT_PIECES, FRESH_CHECKPOINTS, RETAINED_CHECKS } from './fixtures.mjs';
import {
  adaptationSnapshot,
  centroidCoordinates,
  checkpointTokenize,
  chooseCheckpoint,
  corpusSnapshot,
  dependencyModel,
  evaluationSnapshot,
  exactLearningRate,
  groupedSplit,
  learningRate,
  manifestAdmission,
  mixtureReduction,
  normalizedFingerprint,
  packedCorpus,
  packingOwners,
  replayGradient,
  selectedPackage,
  selectionSnapshot,
  vocabularyMass,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateExtension();
  assert.deepEqual(
    corpusSnapshot(2, 1).retained.map((x) => x.id),
    ['D1'],
  );
  assert.deepEqual(checkpointTokenize('The tide rises near the reef.'), CHECKPOINT_PIECES);
  assert(corpusSnapshot(0, 1).nearDuplicateSimilarity > 0.7);
  assert.equal(selectionSnapshot(1, 1).winner.label, 'CPT 4k');
  assert.equal(selectionSnapshot(1, 1).rows.at(-1).eligible, false);
  assert.equal(evaluationSnapshot(0, 1).domain.length, 5);
  assert(evaluationSnapshot(0, 1).tasks.every((x) => x === 62));
  assert.equal(replayGradient(0), -0.5);
  assert.equal(replayGradient(0.25), -0.25);
  assert.equal(replayGradient(0.5), 0);
  assert.equal(replayGradient(1), 0.5);
  assert(Math.abs(learningRate(0) - 1.65) < 1e-12);
  assert.equal(learningRate(1), 3);
  assert.equal(learningRate(11), 0.3);
  assert.throws(() => replayGradient(1.1), RangeError);
  assert.throws(() => learningRate(12), RangeError);
  const before = adaptationSnapshot(0),
    after = adaptationSnapshot(1);
  assert.equal(before.logit, 0);
  assert.equal(after.logit, 0.25);
  assert(after.domainLoss < before.domainLoss);
  assert(after.broadLoss > before.broadLoss);
  assert.equal(
    after.probabilities.reduce((a, v) => a + v, 0),
    1,
  );
  assert.deepEqual(
    RETAINED_CHECKS.safety.map((row) => row.filter(Boolean).length),
    [10, 10, 9, 8, 7],
  );
  assert.deepEqual(
    RETAINED_CHECKS.reasoning.map((row) => row.filter(Boolean).length),
    [8, 8, 7, 7, 6],
  );
  const artifact = selectedPackage();
  assert.equal(artifact.checkpoint, 'CPT 4k');
  assert.deepEqual(artifact.manifest, ['D1']);
  assert.equal(artifact.corpusHash.length, 64);
  assert.equal(artifact.tokenCounts.unique, 8);
  assert.equal(artifact.winner.eligible, true);
  return true;
}
export function validateExtension() {
  const p = packedCorpus();
  assert.equal(p.stream.length, 14);
  assert.equal(new Set(p.stream.map((o) => o.id)).size, 14);
  assert.deepEqual(
    p.blocks.map((b) => b.map((o) => o.token)),
    [
      [11, 12, 13, 0, 21, 22],
      [0, 31, 32, 33, 34, 0],
    ],
  );
  assert.deepEqual(
    p.remainder.map((o) => o.token),
    [41, 0],
  );
  for (let k = 0; k <= 100; k++) {
    const a = packingOwners(k / 100);
    assert.equal(a.length, 14);
    assert.equal(new Set(a.map((o) => o.id)).size, 14);
  }
  assert(Math.abs(dependencyModel().loss - 1.861994804058251) < 1e-12);
  assert.deepEqual(dependencyModel().inputGradients[2], [0, 0]);
  assert(Math.abs(dependencyModel().inputGradients[0][0] - 1.2669563947545546) < 1e-12);
  assert(Math.abs(dependencyModel().inputGradients[0][1] + 0.4223187982515182) < 1e-12);
  assert(
    centroidCoordinates().every(
      (v, i) =>
        Math.abs(
          v -
            [
              0.9390323162078857, 0.992136538028717, 0.003613670589402318, -1.0231796503067017,
              -0.2691980004310608, -0.2385524958372116, -0.003701925277709961, 0.27946633100509644,
            ][i],
        ) < 1e-7,
    ),
  );
  assert.equal(vocabularyMass(true).probabilities[0], 1 / 3);
  assert.equal(mixtureReduction().pooledGradient, -0.4);
  assert.equal(mixtureReduction().blockGradient, -0.25);
  assert(Math.abs(mixtureReduction(4, 2, 3, 1).pooledGradient + 5 / 14) < 1e-12);
  assert(Math.abs(exactLearningRate(49) - 3e-5) < 1e-15);
  assert(Math.abs(exactLearningRate(50) - 3e-5) < 1e-15);
  assert(Math.abs(exactLearningRate(999) - 3e-6) < 1e-15);
  assert.equal(groupedSplit('auth-docs-v3').split, 'train');
  assert.equal(groupedSplit('payments-api').split, 'validation');
  assert.equal(normalizedFingerprint(' AUTH_TIMEOUT  X '), normalizedFingerprint('auth_timeout x'));
  assert.equal(
    manifestAdmission({
      rights: true,
      scrubbed: true,
      evalOnly: false,
      tokens: true,
    }).pass,
    false,
  );
  assert.equal(chooseCheckpoint(FRESH_CHECKPOINTS, 18, 1).label, 'C');
  assert.equal(
    chooseCheckpoint(
      [
        {
          label: 'edge',
          domain: 2,
          general: 19,
          task: 80,
        },
      ],
      18,
      1,
    ).label,
    'edge',
  );
  return true;
}
