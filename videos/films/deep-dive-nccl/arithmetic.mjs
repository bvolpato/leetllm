import assert from 'node:assert/strict';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const schedules = {
  ring: { rounds: 6, bandwidth: 50 },
  tree: { rounds: 4, bandwidth: 30 },
};
export function cost(bytes, ring = true) {
  const { rounds, bandwidth } = ring ? schedules.ring : schedules.tree;
  const moved = 1.5 * bytes;
  return {
    startup: rounds * 2,
    payload: moved / (bandwidth * 1e3),
    total: rounds * 2 + moved / (bandwidth * 1e3),
  };
}
export const clamp = (v) => Math.max(0, Math.min(1, v));
export function ringTraffic(ranks, bytes) {
  assert(Number.isInteger(ranks) && ranks > 0);
  assert(Number.isFinite(bytes) && bytes >= 0);
  return {
    chunk: bytes / ranks,
    phase: (bytes * (ranks - 1)) / ranks,
    sent: (2 * bytes * (ranks - 1)) / ranks,
    received: (2 * bytes * (ranks - 1)) / ranks,
    rounds: 2 * (ranks - 1),
  };
}
export function overlapTime(compute, communication, hidden) {
  assert([compute, communication, hidden].every((v) => Number.isFinite(v) && v >= 0));
  assert(hidden <= Math.min(compute, communication));
  return {
    exposed: communication - hidden,
    total: compute + communication - hidden,
  };
}
export function byteOffset(rank, count, bytes) {
  assert([rank, count, bytes].every(Number.isInteger));
  assert(rank >= 0 && count >= 0 && bytes > 0);
  return rank * count * bytes;
}
export function transposeExchange(rows) {
  assert(rows.length > 0 && rows.every((row) => row.length === rows.length));
  return rows[0].map((_, j) => rows.map((row) => row[j]));
}
export function dependencyTrace(producer, read, writes, consumer) {
  return {
    inputReady: read >= producer,
    outputReady: consumer >= writes,
    first: read < producer ? 'input' : consumer < writes ? 'output' : null,
  };
}
