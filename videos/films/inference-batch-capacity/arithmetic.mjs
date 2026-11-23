import { GiB, bytesPerToken, hardware, pool, referencePoolBytes } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function referenceHistory(positions) {
  const bytes = positions * bytesPerToken;
  const count = Math.floor(referencePoolBytes / bytes);
  return {
    positions,
    gib: bytes / GiB,
    count,
    occupied: (count * bytes) / GiB,
    free: (referencePoolBytes - count * bytes) / GiB,
  };
}
export function reservation(prompt, output) {
  assert(Number.isInteger(prompt) && prompt > 0 && Number.isInteger(output) && output >= 0);
  const logical = prompt + output;
  const blocks = Math.ceil(logical / hardware.pageTokens);
  return {
    prompt,
    output,
    logical,
    blocks,
    slots: blocks * hardware.pageTokens,
    bytes: blocks * hardware.pageTokens * bytesPerToken,
  };
}
export function bandwidthPoint(batch) {
  const kvRead = batch * 4096 * bytesPerToken;
  const bytes = hardware.weights + kvRead;
  const seconds = bytes / hardware.bandwidth;
  return {
    batch,
    kvRead,
    bytes,
    ms: seconds * 1000,
    tps: batch / seconds,
    reserved: batch * reservation(4096, 1024).bytes,
  };
}
export function scheduleRequests(lengths, slots, continuous) {
  assert(lengths.every((n) => Number.isInteger(n) && n > 0));
  assert(Number.isInteger(slots) && slots > 0);
  const remaining = [...lengths],
    owners = Array(slots).fill(null),
    frames = [];
  let next = 0;
  while (next < lengths.length || owners.some((id) => id !== null)) {
    if (continuous || owners.every((id) => id === null))
      for (let slot = 0; slot < slots && next < lengths.length; slot++)
        if (owners[slot] === null) owners[slot] = next++;
    const slotOwners = [...owners],
      before = slotOwners.filter((id) => id !== null).sort((a, b) => a - b),
      emitted = before.map((id) => ({
        id,
        position: lengths[id] - remaining[id] + 1,
      }));
    for (const id of before) remaining[id]--;
    for (let slot = 0; slot < slots; slot++)
      if (owners[slot] !== null && remaining[owners[slot]] === 0) owners[slot] = null;
    frames.push({
      iteration: frames.length + 1,
      before,
      slots: slotOwners,
      emitted,
      survivors: owners.filter((id) => id !== null).sort((a, b) => a - b),
      remaining: [...remaining],
      next,
    });
  }
  return {
    frames,
    tokens: lengths.reduce((a, b) => a + b, 0),
    reads: frames.length,
    tokensPerRead: lengths.reduce((a, b) => a + b, 0) / frames.length,
  };
}
export function prefixPageState(stage) {
  assert(Number.isInteger(stage) && stage >= 0 && stage <= 3);
  const pages = [
    {
      id: 7,
      values: ['p', 'q', 'r', stage === 3 ? 'a' : null],
      references: stage < 2 ? 2 : 1,
    },
  ];
  if (stage >= 1)
    pages.push({
      id: 12,
      values: ['p', 'q', 'r', stage === 3 ? 'b' : null],
      references: stage < 2 ? 0 : 1,
    });
  return {
    pages,
    A: 7,
    B: stage >= 2 ? 12 : 7,
    stage,
  };
}
export function speculativeExpectation(gamma, alpha, c, v) {
  assert(Number.isInteger(gamma) && gamma > 0 && alpha >= 0 && alpha <= 1 && c >= 0 && v > 0);
  const masses = Array.from(
      {
        length: gamma + 1,
      },
      (_, i) => alpha ** i,
    ),
    expected = masses.reduce((a, b) => a + b, 0),
    cost = gamma * c + v;
  return {
    gamma,
    alpha,
    c,
    v,
    masses,
    expected,
    cost,
    rate: expected / cost,
    timePerToken: cost / expected,
  };
}
export function speculativeAcceptance(p, q, token, u) {
  assert(p.length === q.length && p.every((x) => x >= 0) && q.every((x) => x >= 0));
  assert(
    Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-9 &&
      Math.abs(q.reduce((a, b) => a + b, 0) - 1) < 1e-9,
  );
  assert(q[token] > 0 && u >= 0 && u < 1);
  const threshold = Math.min(1, p[token] / q[token]),
    accepted = u < threshold,
    raw = p.map((x, i) => Math.max(0, x - q[i])),
    mass = raw.reduce((a, b) => a + b, 0);
  return {
    threshold,
    accepted,
    residual: mass ? raw.map((x) => x / mass) : null,
  };
}
export function revisedCapacityRows() {
  return [16, 24, 32, 48, 64].map((batch) => {
    const kvRead = (batch * reservation(4096, 0).bytes) / (2 * GiB);
    const reserved = (batch * reservation(4096, 1024).bytes) / (2 * GiB);
    const ms = ((hardware.weights + kvRead * GiB) / hardware.bandwidth) * 1000;
    const memoryPass = reserved * GiB <= pool;
    const timePass = ms <= 38;
    return {
      batch,
      kvRead,
      reserved,
      ms,
      tps: batch / (ms / 1000),
      memoryPass,
      timePass,
      eligible: memoryPass && timePass,
      costPerMillion: (2 / ((batch / (ms / 1000)) * 3600)) * 1e6,
    };
  });
}
