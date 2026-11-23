import assert from 'node:assert/strict';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function transpose(n) {
  return Array.from(
    {
      length: n * n,
    },
    (_, i) => {
      const r = Math.floor(i / n),
        c = i % n;
      return {
        value: i,
        source: [r, c],
        target: [c, r],
      };
    },
  );
}
export function sectorTransition(converted) {
  assert(Number.isInteger(converted) && converted >= 0 && converted <= 32);
  const addresses = Array.from(
      {
        length: 32,
      },
      (_, i) => (i < converted ? i : i * 4096) * 4,
    ),
    sectors = [...new Set(addresses.map((a) => Math.floor(a / 32)))];
  return {
    converted,
    addresses,
    sectors,
    payload: 128,
    fraction: 128 / (sectors.length * 32),
  };
}
export function sectorModel(adjacent) {
  return sectorTransition(adjacent ? 32 : 0);
}
export function bankModel(stride) {
  const counts = Array(32).fill(0);
  for (let lane = 0; lane < 32; lane++) counts[(lane * stride) % 32]++;
  return {
    counts,
    used: counts.filter(Boolean).length,
    conflict: Math.max(...counts),
    sharedBytes: 32 * stride * 4,
  };
}
export function laneSectorCoverage(startWord, active = 32) {
  assert(Number.isInteger(startWord) && startWord >= 0);
  assert(Number.isInteger(active) && active >= 1 && active <= 32);
  const words = Array.from(
      {
        length: active,
      },
      (_, i) => startWord + i,
    ),
    sectors = [...new Set(words.map((word) => Math.floor(word / 8)))];
  return {
    words,
    sectors,
    payloadBytes: active * 4,
    sectorBytes: sectors.length * 32,
    fraction: (active * 4) / (sectors.length * 32),
  };
}
export function edgeOwnership(n, bx, by) {
  assert(Number.isInteger(n) && n > 0 && n <= 4096);
  assert(Number.isInteger(bx) && bx >= 0 && Number.isInteger(by) && by >= 0);
  const producers = [],
    consumers = [];
  for (let ty = 0; ty < 8; ty++)
    for (let tx = 0; tx < 32; tx++)
      for (let offset = 0; offset < 32; offset += 8) {
        const row = by * 32 + ty + offset,
          col = bx * 32 + tx;
        if (row < n && col < n)
          producers.push({
            row,
            col,
            value: row * n + col,
            shared: [ty + offset, tx],
            thread: [tx, ty],
            warp: ty,
          });
        const outRow = bx * 32 + ty + offset,
          outCol = by * 32 + tx;
        if (outRow < n && outCol < n)
          consumers.push({
            row: outRow,
            col: outCol,
            index: outRow * n + outCol,
            shared: [tx, ty + offset],
            thread: [tx, ty],
            warp: ty,
          });
      }
  const byShared = new Map(producers.map((v) => [v.shared.join(','), v]));
  const pairs = consumers.map((consumer) => {
    const producer = byShared.get(consumer.shared.join(','));
    assert(producer);
    assert.equal(producer.row, consumer.col);
    assert.equal(producer.col, consumer.row);
    return {
      producer,
      consumer,
    };
  });
  return {
    n,
    bx,
    by,
    producers,
    consumers,
    pairs,
    barrierArrivals: 256,
  };
}
export function resourceCapacity(registersPerThread) {
  assert(Number.isInteger(registersPerThread) && registersPerThread > 0);
  const registersPerBlock = registersPerThread * 256,
    registerBlocks = Math.floor(65536 / registersPerBlock),
    sharedBlocks = Math.floor(65536 / 4224),
    warpBlocks = 64 / 8,
    blocks = Math.min(registerBlocks, sharedBlocks, warpBlocks);
  return {
    registersPerThread,
    registersPerBlock,
    registerBlocks,
    sharedBlocks,
    warpBlocks,
    blocks,
    warps: blocks * 8,
    fraction: (blocks * 8) / 64,
  };
}
