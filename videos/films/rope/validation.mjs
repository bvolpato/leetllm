import { CLOCK_FREQUENCIES, content } from './fixtures.mjs';
import { frequencySchedules, rotaryScore, rotatePair, softmax, toBfloat16 } from './arithmetic.mjs';
import { freshPositionFrame } from './construction.mjs';
import { cacheChunkInSlots, cacheFixture, contentOutputs, pairingTrace } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  for (const angle of [0, 0.5, Math.PI, -2]) {
    const v = rotatePair([0.8, 0.6], angle);
    assert(Math.abs(Math.hypot(...v) - 1) < 1e-12);
  }
  const q = [0.3, 0.7, -0.8, 0.1],
    k = [0.6, -0.2, 0.4, 0.9],
    f = [0.5, 0.05];
  for (const shift of [0, 1, 17, 100])
    assert(
      Math.abs(rotaryScore(q, k, 5 + shift, 3 + shift, f) - rotaryScore(q, k, 5, 3, f)) < 1e-12,
    );
  const reversed = [...content].reverse();
  const reversedOutputs = reversed.map((q) => {
    const w = softmax(reversed.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2)));
    return [0, 1].map((d) => w.reduce((sum, a, j) => sum + a * reversed[j][d], 0));
  });
  reversedOutputs.forEach((row, i) =>
    row.forEach((value, d) => assert(Math.abs(value - contentOutputs[2 - i][d]) < 1e-12)),
  );
  assert(softmax([4, 4 - 0.5 * 4])[1] < softmax([4, 4 - 4 / 16])[1]);
  assert.equal(toBfloat16(4096), 4096);
  assert.equal(toBfloat16(4097), 4096);
  const pairing = pairingTrace();
  assert(Math.abs(pairing.adjacent - pairing.converted) < 1e-12);
  assert(Math.abs(pairing.adjacent + 0.760002) < 1e-6);
  const cache = cacheFixture();
  cache.full.forEach((row, i) =>
    row.forEach((value, j) => assert(Math.abs(value - cache.incremental[i][j]) < 1e-12)),
  );
  assert(Math.abs(cache.full[1][2]) < 1e-12);
  assert(cache.unmasked[1][2] > 0);
  const unitHead = CLOCK_FREQUENCIES.flatMap(() => [1, 0]);
  const headDot = rotaryScore(unitHead, unitHead, 4, 2, CLOCK_FREQUENCIES);
  assert.equal(headDot.toFixed(3), '2.564');
  assert.equal((headDot / Math.sqrt(unitHead.length)).toFixed(3), '0.906');
  for (const masked of [true, false]) {
    const chunk = cacheChunkInSlots([1, 2], [2, 0, 1], masked);
    const expected = (masked ? cache.full : cache.unmasked).slice(1);
    chunk.outputs.forEach((row, i) =>
      row.forEach((weight, col) => assert(Math.abs(weight - expected[i][col]) < 1e-12)),
    );
    assert.equal(chunk.outputs[0][2].toFixed(3), masked ? '0.000' : '0.538');
    assert.equal(chunk.outputs[1][2].toFixed(3), '0.568');
  }
  const schedules = frequencySchedules();
  assert(Math.abs(schedules.yarn[2] - 0.003835) < 1e-6);
  assert(
    Math.abs(
      freshPositionFrame({
        beat: 1,
        beatP: 1,
      }).score - Math.cos(1.2),
    ) < 1e-12,
  );
  return true;
}
