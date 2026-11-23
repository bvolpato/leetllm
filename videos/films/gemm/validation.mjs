import assert from 'node:assert/strict';
import { multiplyMatrices } from 'vizmatic';
import { bankAddress, bf16, registerDemand } from './arithmetic.mjs';
import { doubleBuffer, fragmentAccumulation } from './construction.mjs';
import { A, B, bottomEdge, rightEdge } from './fixtures.mjs';
import { cooperativeCell, partialProduct, warpRequests } from './model.mjs';

export function validateModel() {
  const full = multiplyMatrices(A, B);
  assert.deepEqual(full, [[4, 7], [7, 13]]);
  assert.deepEqual(partialProduct(0, 1), [[2, -1], [-2, 1]]);
  assert.deepEqual(partialProduct(0, 2), [[4, 7], [1, 13]]);
  assert.deepEqual(partialProduct(2, 3), [[0, 0], [6, 0]]);
  assert.deepEqual(partialProduct(0, 3), full);

  for (const [fixture, expected, lost] of [[rightEdge, 7, 4], [bottomEdge, 9, 3]]) {
    const reference = multiplyMatrices(fixture.a, fixture.b)[fixture.row][fixture.col];
    assert.equal(reference, expected);
    assert.equal(cooperativeCell(fixture).sum, reference);
    assert.equal(cooperativeCell(fixture, true).sum, lost);
  }
  assert.deepEqual(cooperativeCell(bottomEdge).panels.map((p) => p.sum), [7, 5, 9]);
  assert.deepEqual(cooperativeCell(bottomEdge).panels.map((p) => p.right[1][1]), [4, -2, 0]);
  assert.deepEqual(cooperativeCell(rightEdge, true).steps.map((s) => s.product), [-2, 0, 6]);
  assert.deepEqual(warpRequests(false).sectors, [16, 1, 16]);
  assert.deepEqual(warpRequests(true).sectors, [1, 4, 4]);
  assert.deepEqual([0, 1, 2, 16].map((lane) => warpRequests(false).lanes[lane].a), [0, 256, 512, 0]);

  const lanes = Array.from({ length: 32 }, (_, lane) => lane);
  assert.equal(new Set(lanes.map((lane) => bankAddress(lane, 3).word)).size, 32);
  assert.equal(new Set(lanes.map((lane) => bankAddress(lane, 3).bank)).size, 1);
  assert.equal(new Set(lanes.map((lane) => bankAddress(lane, 3, 33).bank)).size, 32);
  assert.deepEqual([0, 1, 2, 3].map((col) => col ^ 1), [1, 0, 3, 2]);
  assert.equal(registerDemand(1, 1).ratio, 0.25);
  assert.equal(registerDemand(1, 4).ratio, 0.4);
  assert.equal(registerDemand(8, 8).ratio, 2);
  assert.equal(registerDemand(16, 16).ratio, 4);
  assert.equal(2 * 16 ** 3, 8192);
  assert.equal(2 * 16 ** 2 * 4, 2048);
  assert.deepEqual([73, 61, 67].map((size) => size % 16), [9, 13, 3]);
  assert.equal(Math.ceil(67 / 16), 5);

  for (const p of [0, 0.5, 1]) {
    const f = fragmentAccumulation(p);
    const delta = multiplyMatrices(f.activeA, f.activeB);
    assert.deepEqual(f.output, partialProduct(0, f.count));
    assert.deepEqual(f.previous.map((r, i) => r.map((v, j) => v + delta[i][j])), f.output);
  }
  assert.deepEqual(doubleBuffer(2.5).output, partialProduct(0, 2));
  assert.deepEqual(doubleBuffer(3).output, full);
  assert.deepEqual(doubleBuffer(1.5).stages.map((s) => s.status), ['reading', 'loading']);

  const wide = Math.fround(1024 + bf16(1.125) * bf16(1.25));
  assert.equal(wide, 1025.40625);
  assert.equal(bf16(wide), 1024);
  assert.equal((Math.fround(1.0001) - 1).toFixed(8), '0.00010002');
  assert.equal(72 / (4 * (6 + 36 + 6)), 0.375);
  return true;
}
