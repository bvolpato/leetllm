import assert from 'node:assert/strict';
import {
  PAIRS,
  SLOTS,
  TABLE,
  QUERY,
  readThrough,
  attend,
  KIB,
  MIB,
  GIB,
  bytesPerToken,
  blocksFor,
  HOLES,
  NEEDED,
  C_TABLE,
} from '../../../films/kv-cache/model.mjs';
export {
  PAIRS,
  SLOTS,
  TABLE,
  QUERY,
  KIB,
  MIB,
  GIB,
  bytesPerToken,
  blocksFor,
  HOLES,
  NEEDED,
  C_TABLE,
};
export const promptLength = 512;
export const prefixWords = ['This', 'service', 'contract', 'says', 'renew', 'in'];
export const steps = [1, 2, 3, 4, 5, 6];
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 3 });
export const bill = (layers, heads = 8, bytes = 2) =>
  bytesPerToken({ layers, heads, bytes, width: 128 });
export function address(pos, table = TABLE, size = SLOTS) {
  const logical = Math.floor(pos / size);
  return { logical, block: table[logical], slot: pos % size };
}
export const reference = attend(QUERY, PAIRS);
export function kernel(count) {
  const pairs = readThrough(count);
  const scores = pairs.map(([k]) => (k[0] * QUERY[0] + k[1] * QUERY[1]) / Math.sqrt(2));
  const max = Math.max(...scores);
  const exp = scores.map((v) => Math.exp(v - max));
  const weights = exp.map((v) => v / sum(exp));
  return { pairs, weights, out: attend(QUERY, pairs) };
}
export function allocation(tokens, size) {
  const blocks = blocksFor(tokens, size);
  return { tokens, blocks, empty: blocks * size - tokens };
}
export function occupancy(entries, size) {
  const rows = entries.map(([owner, tokens]) => ({ owner, ...allocation(tokens, size) }));
  return { rows, total: sum(rows.map((r) => r.blocks)) };
}
export function prefixLedger(tokens, size, requests) {
  const shared = Math.floor((tokens - 1) / size),
    used = shared * size;
  const tail = tokens - used,
    privateEach = blocksFor(tail, size);
  return {
    shared,
    used,
    tail,
    cold: requests * (shared + privateEach),
    warm: shared + requests * privateEach,
  };
}
export function recovery(positions = 3200, rate = 5000, replayRate = 4000) {
  const per = bill(80) / KIB,
    mib = (positions * per) / 1024,
    leg = mib / rate;
  return {
    positions,
    per,
    mib,
    rate,
    replayRate,
    leg,
    both: 2 * leg,
    replay: positions / replayRate,
  };
}
export function fork(stage) {
  const blocks = { 7: prefixWords.slice(0, 4), 2: prefixWords.slice(4) };
  const tables = { A: [7, 2], B: [7, 2] };
  if (stage >= 1) {
    blocks[5] = blocks[2].slice();
    tables.A[1] = 5;
  }
  if (stage >= 2) blocks[5].push('March');
  if (stage >= 3) blocks[2].push('June');
  if (stage >= 4) delete tables.A;
  if (stage >= 5) {
    blocks[5] = ['New'];
    tables.C = [5];
  }
  return {
    blocks,
    tables,
    owners: (id) =>
      Object.entries(tables)
        .filter(([, table]) => table.includes(id))
        .map(([name]) => name),
  };
}
export function fullFork(appended) {
  const blocks = { 7: prefixWords.slice(0, 4) },
    tables = { A: [7], B: [7] };
  if (appended) {
    blocks[5] = ['March'];
    blocks[9] = ['June'];
    tables.A.push(5);
    tables.B.push(9);
  }
  return { blocks, tables };
}
export function retry(stage) {
  const tables = { A: [1], B: [0] },
    lens = { A: 4, B: 0 },
    free = [];
  const append = () => {
    if (lens.A % 4 === 0) {
      if (!free.length) return false;
      tables.A.push(free.pop());
    }
    lens.A++;
    return true;
  };
  if (stage >= 1) assert.equal(append(), false);
  if (stage >= 2) {
    for (const id of tables.B) free.push(id);
    delete tables.B;
    delete lens.B;
  }
  if (stage >= 3) assert.ok(append());
  return { tables, lens, free };
}
export function checkMechanics() {
  assert.equal(promptLength + 1, 513);
  assert.equal(sum(steps), 21);
  assert.deepEqual(address(5), { logical: 1, block: 2, slot: 1 });
  assert.deepEqual(address(6), { logical: 1, block: 2, slot: 2 });
  assert.deepEqual(kernel(6).pairs, PAIRS);
  assert.deepEqual(kernel(6).out, reference);
  assert.deepEqual(
    reference.map((n) => n.toFixed(2)),
    ['1.91', '1.53'],
  );
  assert.equal(kernel(7).weights[6], 1);
  assert.deepEqual(kernel(7).out, [999, 999]);
  for (const n of [6, 7]) {
    const run = kernel(n);
    for (let d = 0; d < 2; d++)
      assert.ok(
        Math.abs(sum(run.weights.map((v, i) => v * run.pairs[i][1][d])) - run.out[d]) < 1e-9,
      );
  }
  assert.deepEqual(
    [bill(32) / KIB, (bill(32) * 4096) / MIB, (40 * GIB) / (bill(32) * 4096)],
    [128, 512, 80],
  );
  assert.deepEqual(
    [bill(80) / KIB, (bill(80) * 4096) / GIB, (bill(80) * 4096 * 128) / GIB],
    [320, 1.25, 160],
  );
  assert.equal(sum(HOLES), 36);
  assert.ok(Math.max(...HOLES) < NEEDED);
  assert.deepEqual([allocation(17, 8).empty, allocation(17, 16).empty], [7, 15]);
  assert.deepEqual(
    [
      occupancy(
        [
          ['A', 64],
          ['B', 10],
        ],
        16,
      ).total,
      occupancy(
        [
          ['B', 10],
          ['C', 20],
        ],
        16,
      ).total,
    ],
    [5, 3],
  );
  for (const stage of [0, 1, 2, 3]) {
    const f = fork(stage);
    assert.deepEqual(f.blocks[7], prefixWords.slice(0, 4));
    assert.deepEqual(f.owners(7), ['A', 'B']);
    assert.deepEqual(f.tables.A, [7, stage === 0 ? 2 : 5]);
    assert.deepEqual(f.tables.B, [7, 2]);
    assert.deepEqual(f.blocks[2], stage < 3 ? ['renew', 'in'] : ['renew', 'in', 'June']);
    if (stage)
      assert.deepEqual(f.blocks[5], stage === 1 ? ['renew', 'in'] : ['renew', 'in', 'March']);
  }
  const sharedFullTail = { 7: prefixWords.slice(0, SLOTS) };
  assert.deepEqual(fullFork(false), { blocks: sharedFullTail, tables: { A: [7], B: [7] } });
  assert.deepEqual(fullFork(true), {
    blocks: { ...sharedFullTail, 5: ['March'], 9: ['June'] },
    tables: { A: [7, 5], B: [7, 9] },
  });
  assert.deepEqual(fork(4).owners(5), []);
  assert.deepEqual(fork(5).owners(5), ['C']);
  assert.deepEqual(fork(5).tables.B, [7, 2]);
  assert.deepEqual(fork(5).blocks[5], ['New']);
  assert.deepEqual(prefixLedger(500, 16, 200), {
    shared: 31,
    used: 496,
    tail: 4,
    cold: 6400,
    warm: 231,
  });
  assert.deepEqual(retry(1), retry(0));
  assert.deepEqual(retry(2).free, [0]);
  assert.deepEqual(retry(3), { tables: { A: [1, 0] }, lens: { A: 5 }, free: [] });
  const r = recovery();
  assert.deepEqual([r.mib, r.leg, r.both, r.replay], [1000, 0.2, 0.4, 0.8]);
  assert.deepEqual(
    [bill(80, 64) / KIB, bill(80, 8) / KIB, bill(80, 1) / KIB, bill(80, 8, 1) / KIB],
    [2560, 320, 40, 160],
  );
  assert.equal((bill(80) * 131072) / GIB, 40);
  assert.deepEqual(
    [(102 * bill(80)) / MIB, (128 * bill(80)) / MIB, (128 * bill(80, 8, 1)) / MIB],
    [31.875, 40, 20],
  );
  assert.deepEqual(
    [
      allocation(100, 32).empty,
      occupancy(
        [
          ['A', 100],
          ['B', 32],
        ],
        32,
      ).total,
      occupancy(
        [
          ['B', 32],
          ['C', 70],
        ],
        32,
      ).total,
    ],
    [28, 5, 4],
  );
  assert.deepEqual(address(40, C_TABLE, 32), { logical: 1, block: 11, slot: 8 });
}
