import assert from 'node:assert/strict';
import { cooperativeCell, warpRequests } from '../../../films/gemm/model.mjs';
import {
  A as signedA,
  B as signedB,
  rightEdge,
  bottomEdge,
} from '../../../films/gemm/fixtures.mjs';
import { bankAddress, bf16, registerDemand } from '../../../films/gemm/arithmetic.mjs';
import { roundHalf as halfRound } from '../../../films/low-precision-kernels/encoding.mjs';
export { cooperativeCell, signedA, signedB, warpRequests, bankAddress, registerDemand };
export const A = [
    [1, 2, 3],
    [4, 5, 6],
  ],
  B = [
    [1, 2],
    [0, 1],
    [2, 0],
  ];
export const sums = (count) =>
  A.map((row) =>
    B[0].map((_, j) => row.slice(0, count).reduce((sum, v, k) => sum + v * B[k][j], 0)),
  );
export const last = A.map((row) => B[2].map((v) => row[2] * v));
export function accumulatorState(first, flight, store) {
  const coordinates = flight === 1 ? 3 : first === 1 ? 2 : first >= 0.5 ? 1 : 0;
  return { coordinates, values: sums(coordinates), stored: coordinates === 3 && store > 0 };
}
export const selectedB = { k: 1, col: 1, value: B[1][1] };
export const openingProducts = A.map((row) => row[selectedB.k] * selectedB.value);
export const masterEdge = { a: A.slice(0, 1), b: B, row: 0, col: 1 };
export const edge = { good: cooperativeCell(masterEdge), bad: cooperativeCell(masterEdge, true) };
export function edgeReplay({ omit, missing, badStore, copying, copied, read, product, store }) {
  const step = (!omit || read ? edge.good : edge.bad).steps[selectedB.k];
  return {
    reference: edge.good.steps,
    sharedWord: copying && !copied ? null : (copied ? edge.good : edge.bad).steps[selectedB.k].b,
    middleOperand: omit && !(copying ? read : missing) ? null : step.b,
    middleProduct: omit && !(copying ? product : missing) ? null : step.product,
    upperRight: badStore && !store ? edge.bad.sum : edge.good.sum,
  };
}
export const signed = { good: cooperativeCell(rightEdge), bad: cooperativeCell(rightEdge, true) };
export const five = cooperativeCell(bottomEdge);
export function reads(threads) {
  const a = A.map((row) => row.map(() => 0)),
    b = B.map((row) => row.map(() => 0));
  for (let t = 0; t < threads; t++) {
    for (let k = 0; k < B.length; k++) {
      a[Math.floor(t / 2)][k]++;
      b[k][t % 2]++;
    }
  }
  return { a, b, total: [...a.flat(), ...b.flat()].reduce((v, n) => v + n, 0) };
}
export const layout = (byColumn) =>
  [0, 1].map((i) => [0, 1, 2].map((j) => 1 + (byColumn ? j * 2 + i : i * 3 + j)));
const xorColumn = (row, column) => column ^ row;
export function banks(mode) {
  const words = Array.from({ length: 32 }, (_, l) =>
    mode === 'broadcast'
      ? 7
      : bankAddress(l, mode === 'xor' ? xorColumn(l, 7) : 7, mode === 'padded' ? 33 : 32).word,
  );
  const groups = Array.from({ length: 32 }, () => new Set());
  for (const n of words) groups[n % 32].add(n);
  return { words, groups, depth: Math.max(...groups.map((s) => s.size)) };
}
export const xorColumns = [0, 1, 2, 3].map((j) => xorColumn(3, j));
export const frag = { size: 16, M: 73, N: 61, K: 67 };
export const corner = [frag.M, frag.N, frag.K].map((n) => n % frag.size);
export const bfProduct = bf16(1.125) * bf16(1.25);
export const wideSum = Math.fround(1024 + bfProduct);
export const narrowSum = bf16(wideSum);
const f32 = Math.fround;
export const regroup = {
  first: f32(f32(2 ** 24 + 1) - 2 ** 24),
  last: f32(2 ** 24 + f32(1 - 2 ** 24)),
};
export function stored(delta) {
  return { exact: 1024 + delta, narrow: halfRound(1024 + delta), wide: Math.fround(1024 + delta) };
}
const raw = [Math.fround(1.0001), 1];
export const refs = {
  raw,
  rounded: raw.map(halfRound),
  original: raw[0] - raw[1],
  low: halfRound(raw[0]) - halfRound(raw[1]),
};
export function batch(rows) {
  const bytes = 4 * (rows * 6 + 36 + rows * 6),
    flops = 2 * rows * 36;
  return { bytes, flops, ratio: flops / bytes };
}
export const roof = { bw: 1, peak: 200, intensity: 10 };
export const bwRoof = (intensity) => Math.min(roof.peak, roof.bw * intensity);
export const slot = { ready: 1, done: 3, early: 2 };
export const overlap = (start) =>
  Math.max(0, Math.min(slot.done, start + 1) - Math.max(slot.ready, start));
export function checkExamples() {
  assert.deepEqual(openingProducts, [2, 5]);
  assert.deepEqual(sums(1), [
    [1, 2],
    [4, 8],
  ]);
  assert.deepEqual(sums(2), [
    [1, 4],
    [4, 13],
  ]);
  assert.deepEqual(last, [
    [6, 0],
    [12, 0],
  ]);
  assert.deepEqual(sums(3), [
    [7, 4],
    [16, 13],
  ]);
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((n) => reads(n).total),
    [0, 6, 12, 18, 24],
  );
  assert.deepEqual(accumulatorState(1, 0.5, 0), {
    coordinates: 2,
    values: [
      [1, 4],
      [4, 13],
    ],
    stored: false,
  });
  assert.deepEqual(accumulatorState(1, 1, 0), {
    coordinates: 3,
    values: [
      [7, 4],
      [16, 13],
    ],
    stored: false,
  });
  assert.equal(accumulatorState(1, 1, 1).stored, true);
  assert.ok([...reads(4).a.flat(), ...reads(4).b.flat()].every((n) => n === 2));
  assert.deepEqual(warpRequests(false).sectors, [16, 1, 16]);
  assert.deepEqual(warpRequests(true).sectors, [1, 4, 4]);
  assert.deepEqual(layout(true), [
    [1, 3, 5],
    [2, 4, 6],
  ]);
  assert.equal(layout(false)[0][1], 2);
  assert.deepEqual(
    ['broadcast', 'stride', 'padded'].map((m) => banks(m).depth),
    [1, 32, 1],
  );
  assert.deepEqual(banks('padded').words.slice(0, 3), [7, 40, 73]);
  const swizzled = banks('xor');
  assert.deepEqual(swizzled.words.slice(0, 3), [7, 38, 69]);
  assert.deepEqual(
    swizzled.words.slice(0, 3).map((word) => word % 32),
    [7, 6, 5],
  );
  assert.ok(swizzled.groups.every((words) => words.size === 1));
  assert.deepEqual(
    warpRequests(true).lanes.map((lane) => lane.b),
    Array.from({ length: 32 }, (_, lane) => 4 * lane),
  );
  assert.deepEqual(xorColumns, [3, 2, 1, 0]);
  assert.deepEqual(
    [
      [1, 1],
      [1, 4],
      [2, 3],
      [8, 8],
    ].map(([i, j]) => registerDemand(i, j).ratio),
    [0.25, 0.4, 0.6, 2],
  );
  assert.deepEqual([overlap(2), overlap(3)], [1, 0]);
  assert.deepEqual(corner, [9, 13, 3]);
  assert.deepEqual([bfProduct, wideSum, narrowSum], [1.40625, 1025.40625, 1024]);
  assert.deepEqual(regroup, { first: 0, last: 1 });
  assert.deepEqual([stored(0.25).narrow, stored(-0.375).narrow], [1024, 1023.5]);
  assert.ok(refs.original > 0.000099 && refs.original < 0.000101);
  assert.equal(refs.low, 0);
  assert.deepEqual(batch(1), { bytes: 192, flops: 72, ratio: 0.375 });
  assert.equal(bwRoof(10), 10);
  assert.equal(roof.peak / roof.bw, 200);
  assert.deepEqual(
    signed.good.steps.map((s) => s.product),
    [-2, 3, 6],
  );
  assert.equal(signed.bad.sum, 4);
  assert.deepEqual(
    five.panels.map((p) => p.sum),
    [7, 5, 9],
  );
  assert.deepEqual(
    five.panels.map((p) => p.right[1][1]),
    [4, -2, 0],
  );
  assert.deepEqual(
    edge.good.steps.map((s) => s.product),
    [2, 2, 0],
  );
  assert.deepEqual(
    edge.bad.steps.map((s) => s.product),
    [2, 0, 0],
  );
  assert.deepEqual([edge.bad.sum, edge.good.sum], [2, 4]);
  assert.equal(cooperativeCell({ ...masterEdge, col: 0 }, true).sum, 7);
  for (const [milestones, expected] of [
    [{}, [0, 1, 2, 4]],
    [{ omit: true }, [0, null, null, 4]],
    [{ omit: true, missing: true }, [0, 0, 0, 4]],
    [{ omit: true, missing: true, badStore: true }, [0, 0, 0, 2]],
    [{ copying: true }, [null, null, null, 2]],
    [{ copying: true, copied: true }, [1, null, null, 2]],
    [{ copying: true, copied: true, read: true }, [1, 1, null, 2]],
    [{ copying: true, copied: true, read: true, product: true }, [1, 1, 2, 2]],
    [{ copying: true, copied: true, read: true, product: true, store: true }, [1, 1, 2, 4]],
  ]) {
    const replay = edgeReplay({
      ...(milestones.copying && { omit: true, missing: true, badStore: true }),
      ...milestones,
    });
    assert.deepEqual(
      [replay.sharedWord, replay.middleOperand, replay.middleProduct, replay.upperRight],
      expected,
    );
  }
  return true;
}
