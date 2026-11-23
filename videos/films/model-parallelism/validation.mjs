import { denseMLP, localPlacement, parallelMLP, pipeline } from './arithmetic.mjs';
import { B, W, X } from './fixtures.mjs';
import { attentionExample, columnTeachingState, introWeightLayout, shards } from './model.mjs';
import { poolGB } from './memory-rails.mjs';
import assert from 'node:assert/strict';
import { multiplyMatrices } from 'vizmatic';
export function validateModel() {
  for (const input of [
    [1, 2],
    [-1, 3],
  ]) {
    const dense = denseMLP(input);
    const close = (values) => values.every((value, i) => Math.abs(value - dense[i]) < 1e-12);
    assert.ok(close(parallelMLP(input).output));
    assert.ok(!close(parallelMLP(input, 'mean').output));
    assert.ok(!close(parallelMLP(input, 'sum', true).output));
  }
  const equal = attentionExample(false),
    boosted = attentionExample(true);
  assert.equal(equal.shares[2], 1 / 3);
  assert.equal(equal.output, 3);
  assert.ok(Math.abs(boosted.shares[2] - 0.5) < 1e-12);
  assert.ok(Math.abs(boosted.output - 4.5) < 1e-12);
  assert.equal(equal.wrongMean, boosted.wrongMean);
  assert.equal(poolGB, 29);
  assert.deepEqual(localPlacement([31, 15], poolGB).free, [-2, 14]);
  assert.deepEqual(localPlacement([23, 23], poolGB).free, [6, 6]);
  const s = shards();
  assert.deepEqual(s.y, [1, 4, 6, 5]);
  assert.deepEqual(s.first, [1, 4]);
  assert.deepEqual(s.second, [16, 1]);
  assert.deepEqual(s.total, [17, 5]);
  assert.deepEqual(multiplyMatrices([s.y], B)[0], s.total);
  const rowParts = W.map((row, i) => row.map((v) => v * X[0][i]));
  assert.deepEqual(
    rowParts[0].map((v, i) => v + rowParts[1][i]),
    s.y,
  );
  assert.notDeepEqual(
    [3, -2].map((v, i) => Math.max(0, v) + Math.max(0, [-1, 4][i])),
    [3, -2].map((v, i) => Math.max(0, v + [-1, 4][i])),
  );
  const columnAt = (seconds) =>
    columnTeachingState({
      beat: 1,
      t: 17.536 + seconds,
    });
  assert.equal(
    columnTeachingState({
      beat: 0,
    }).mode,
    'local-products',
  );
  assert.equal(columnAt(5.9625).mode, 'concatenation');
  assert.deepEqual(columnAt(5.9625).visibleJoined, []);
  assert.deepEqual(columnAt(7.675).visibleJoined, [1, 4]);
  assert.deepEqual(columnAt(9.3875).visibleJoined, s.y);
  assert.deepEqual(columnAt(16.487).visibleJoined, s.y);
  const localActivation = columnTeachingState({
    beat: 2,
    beatP: 0.5,
  });
  assert.equal(localActivation.mode, 'local-activation');
  assert.equal(localActivation.count, 0);
  assert.deepEqual(localActivation.activated, [s.left, s.right]);
  assert.deepEqual(
    localActivation.activated.flat(),
    s.y.map((value) => Math.max(0, value)),
  );
  const layout = pipeline();
  assert.equal(layout.flat().filter(Boolean).length, 12);
  assert.equal(layout[0].length, 6);
  assert.deepEqual(
    introWeightLayout(0).map(({ x, y }) => [x, y]),
    [
      [390, 590],
      [530, 590],
      [390, 720],
      [530, 720],
      [1170, 590],
      [1310, 590],
      [1170, 720],
      [1310, 720],
    ],
  );
  assert.deepEqual(
    introWeightLayout(1).map(({ x, y }) => [x, y]),
    [
      [260, 640],
      [390, 640],
      [660, 640],
      [790, 640],
      [1060, 640],
      [1190, 640],
      [1460, 640],
      [1590, 640],
    ],
  );
  for (let frame = 0; frame <= 240; frame++) {
    const cards = introWeightLayout(frame / 240);
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i],
          b = cards[j];
        assert.ok(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
          `Weight cards ${i + 1} and ${j + 1} overlap at ${frame}/240`,
        );
      }
  }
  return true;
}
