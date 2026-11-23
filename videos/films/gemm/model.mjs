import { A, B } from './fixtures.mjs';

export function partialProduct(start, end) {
  return A.map((row) =>
    B[0].map((_, j) => row.slice(start, end).reduce((sum, v, k) => sum + v * B[start + k][j], 0)),
  );
}

// Trace one valid output in the first 2 × 2 block. Reset shared slots to zero
// for each panel so a deliberately skipped copy has a reproducible value.
export function cooperativeCell({ a, b, row, col }, earlyReturn = false) {
  const steps = [];
  const panels = [];
  let sum = 0;
  for (let start = 0; start < b.length; start += 2) {
    const left = [[0, 0], [0, 0]];
    const right = [[0, 0], [0, 0]];
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        if (earlyReturn && (ty >= a.length || tx >= b[0].length)) continue;
        left[ty][tx] = a[ty]?.[start + tx] ?? 0;
        right[ty][tx] = b[start + ty]?.[tx] ?? 0;
      }
    }
    for (let offset = 0; offset < 2 && start + offset < b.length; offset++) {
      const av = left[row][offset];
      const bv = right[offset][col];
      const product = av * bv;
      sum += product;
      steps.push({ k: start + offset, a: av, b: bv, product, sum });
    }
    panels.push({ start, left, right, sum });
  }
  return { steps, panels, sum };
}

export function warpRequests(columnsFirst) {
  const blockWidth = columnsFirst ? 32 : 16;
  const lanes = Array.from({ length: 32 }, (_, lane) => {
    const x = lane % blockWidth;
    const y = Math.floor(lane / blockWidth);
    const row = columnsFirst ? y : x;
    const col = columnsFirst ? x : y;
    return { a: 4 * row * 64, b: 4 * col, c: 4 * (row * 64 + col) };
  });
  const sectors = ['a', 'b', 'c'].map((key) =>
    new Set(lanes.map((lane) => Math.floor(lane[key] / 32))).size,
  );
  return { lanes, sectors };
}
