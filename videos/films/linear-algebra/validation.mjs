import { A, common, contrast, dispatchWeights } from './fixtures.mjs';
import {
  compressionFrame,
  conditioningState,
  decisionFrame,
  gramCalculation,
  pcaFrame,
  rankFrame,
  solverRoundingExample,
  ticketMeasurement,
  svdBuild,
} from './model.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export function validateModel() {
  const g = gramCalculation();
  assert.deepEqual(g.gram, [
    [2, 1],
    [1, 2],
  ]);
  assert.deepEqual(
    g.directions.map((d) => d.eigenvalue),
    [3, 1],
  );
  assert(Math.abs(dotProduct(common, contrast)) < 1e-12);
  for (const p of [0, 0.25, 0.5, 0.75, 1])
    for (const sign of [1, -1]) {
      const frame = svdBuild(p, sign);
      frame.output.forEach((value, i) => assert(Math.abs(value - [p, 0, p][i]) < 1e-12));
      frame.reconstruction.forEach((row, i) =>
        row.forEach((v, j) => assert(Math.abs(v - A[i][j]) < 1e-12)),
      );
    }
  const centered = pcaFrame({
    beat: 3,
  });
  assert(Math.abs(centered.energies[0] - 1 / 3) < 1e-12);
  assert(Math.abs(centered.energies[1] - 1) < 1e-12);
  const [commonScores, contrastScores] = centered.scores;
  assert(Math.abs(commonScores[0] + 1 / (3 * Math.SQRT2)) < 1e-12);
  assert.equal(commonScores[0], commonScores[1]);
  const crossTerms = commonScores.map((v, i) => v * contrastScores[i]);
  crossTerms.forEach((value, i) => assert(Math.abs(value - [1 / 6, -1 / 6, 0][i]) < 1e-12));
  assert(Math.abs(dotProduct(commonScores, contrastScores)) < 1e-12);
  assert(Math.abs(dotProduct(centered.currentQuery, contrast) + 1 / Math.SQRT2) < 1e-12);
  assert(Math.abs(dotProduct(centered.currentQuery, contrast) - contrastScores[0]) < 1e-12);
  const compressed = compressionFrame({
    beat: 1,
  });
  assert(Math.abs(compressed.error - 1) < 1e-12);
  compressed.rows[0].forEach((v, i) => assert(Math.abs(v - compressed.rows[1][i]) < 1e-12));
  const routed = decisionFrame({ beat: 2 });
  assert(routed.scores[0] < 0 && routed.scores[1] > 0 && routed.scores[2] === 0);
  assert.deepEqual(routed.routes, ['Performance', 'Release repair', 'Both teams']);
  assert.equal(dotProduct([0, 0], contrast), routed.scores[2]);
  assert.deepEqual([...A, [0, 0]].map(row => dotProduct(row, dispatchWeights)), [1, 2, 3, 0]);
  const counters = [
    [0, 0],
    [4, 4],
  ];
  assert.deepEqual(ticketMeasurement(counters, 1).scores, [0, 0]);
  ticketMeasurement(counters, 0).scores.forEach((score, i) =>
    assert(Math.abs(Math.SQRT2 * score - counters[i][0] - counters[i][1]) < 1e-12),
  );
  for (const p of [0, 0.5, 1]) {
    const r = rankFrame({
      beat: 1,
      cues: {
        'nullspace-rule': {
          phase: 'during',
          progress: p,
        },
      },
    });
    assert.deepEqual(r.prediction, [1.5, 0, 1.5]);
  }
  const c = conditioningState({
    beat: 2,
  });
  assert.equal(c.measuredOutput[1], 0.003);
  assert(Math.abs(c.recovered[1] - 0.3) < 1e-12);
  assert.equal(c.conditionNumber ** 2, 10_000);
  const exact = solverRoundingExample(3, 0);
  const rounded = solverRoundingExample(3, 1);
  exact.storedTarget.forEach((v, i) => assert(Math.abs(v - [6.081, 6.20424][i]) < 1e-12));
  assert(Math.abs(exact.normalWeights[1] - 2.025) < 1e-10);
  assert(Math.abs(rounded.normalWeights[1] - 1.15) < 1e-10);
  return true;
}
