import assert from 'node:assert/strict';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const x = clamp((p - 0.08) / 0.68);
  return x * x * (3 - 2 * x);
};
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function sequentialOffload(fraction) {
  const hostBytes = 16e9 * fraction;
  const residentBytes = 16e9 - hostBytes;
  const residentMs = (residentBytes / 3.35e12) * 1000;
  const hostMs = (hostBytes / 64e9) * 1000;
  const total = residentMs + hostMs;
  return {
    fraction,
    residentBytes,
    hostBytes,
    residentMs,
    hostMs,
    total,
    ratio: total / (16 / 3.35),
  };
}
export function projection(rows, compute = 200e12) {
  const k = 4096,
    n = 11008,
    flops = 2 * rows * k * n,
    bytes = 2 * (rows * k + k * n + rows * n);
  return {
    rows,
    flops,
    bytes,
    intensity: flops / bytes,
    computeMs: (1000 * flops) / compute,
    memoryMs: bytes / 1e9,
    floorMs: Math.max((1000 * flops) / compute, bytes / 1e9),
  };
}
export function traversal(order, count = 4, activationKiB = 1, weightKiB = 4) {
  assert([0, 1].includes(order));
  assert(Number.isInteger(count) && count >= 0 && count <= 4);
  let i0 = null,
    j0 = null,
    xLoads = 0,
    wLoads = 0;
  const events = [];
  const route =
    order === 0
      ? [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ]
      : [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ];
  for (const [i, j] of route.slice(0, count)) {
    const xLoad = i !== i0,
      wLoad = j !== j0;
    xLoads += xLoad;
    wLoads += wLoad;
    events.push({
      i,
      j,
      xLoad,
      wLoad,
      addedKiB: Number(xLoad) * activationKiB + Number(wLoad) * weightKiB,
      kib: xLoads * activationKiB + wLoads * weightKiB,
    });
    i0 = i;
    j0 = j;
  }
  return {
    route,
    events,
    current: events.at(-1) ?? null,
    xLoads,
    wLoads,
    kib: xLoads * activationKiB + wLoads * weightKiB,
    count,
  };
}
export function product2x2State(completed) {
  assert(Number.isInteger(completed) && completed >= 0 && completed <= 8);
  const A = [
      [1, 2],
      [3, 4],
    ],
    B = [
      [5, 6],
      [7, 8],
    ],
    terms = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let k = 0; k < 2; k++)
        terms.push({
          i,
          j,
          k,
          a: A[i][k],
          w: B[k][j],
          value: A[i][k] * B[k][j],
        });
  const sums = [
      [0, 0],
      [0, 0],
    ],
    counts = [
      [0, 0],
      [0, 0],
    ];
  for (const t of terms.slice(0, completed)) {
    sums[t.i][t.j] += t.value;
    counts[t.i][t.j]++;
  }
  return {
    A,
    B,
    terms,
    sums,
    counts,
    completed,
  };
}
export function localMemorySpills({ psumLive, sbufLive, psumCapacity = 4, sbufCapacity = 8 }) {
  assert(
    [psumLive, sbufLive, psumCapacity, sbufCapacity].every((n) => Number.isFinite(n) && n >= 0),
  );
  const psumToSbuf = Math.max(0, psumLive - psumCapacity),
    sbufTotal = sbufLive + psumToSbuf,
    sbufToHbm = Math.max(0, sbufTotal - sbufCapacity);
  return {
    psumLive,
    sbufLive,
    psumCapacity,
    sbufCapacity,
    psumToSbuf,
    sbufTotal,
    sbufToHbm,
  };
}
export function ringTraffic(payloadBytes, ranks) {
  assert(
    Number.isSafeInteger(payloadBytes) &&
      payloadBytes > 0 &&
      Number.isSafeInteger(ranks) &&
      ranks > 1,
  );
  return {
    payloadBytes,
    ranks,
    chunkBytes: payloadBytes / ranks,
    sends: 2 * (ranks - 1),
    sentPerRank: ((2 * (ranks - 1)) / ranks) * payloadBytes,
  };
}
export function sharedBound(usableBytes, perBlockBytes) {
  assert(
    Number.isFinite(usableBytes) &&
      usableBytes >= 0 &&
      Number.isFinite(perBlockBytes) &&
      perBlockBytes > 0,
  );
  return Math.floor(usableBytes / perBlockBytes);
}
export function nearestRank(values, p = 0.95) {
  assert(values.length > 0 && values.every(Number.isFinite) && p > 0 && p <= 1);
  return [...values].sort((a, b) => a - b)[Math.ceil(p * values.length) - 1];
}
export function waveReduction(size, consumed) {
  assert(Number.isSafeInteger(size) && size > 0);
  assert(consumed === 32 || consumed === 64);
  const waves = [];
  for (let start = 0; start < size; start += 64) {
    const values = Array.from(
      { length: Math.min(consumed, size - start) },
      (_, i) => start + i + 1,
    );
    const halves = [sum(values.slice(0, 32)), sum(values.slice(32))];
    waves.push({ halves, total: sum(halves) });
  }
  return { waves, total: sum(waves.map((wave) => wave.total)) };
}

export function serviceTrace(lateGenerationId = 2) {
  const requests = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    firstMs: i === 0 ? 500 : 100,
    laterMs: i + 1 === lateGenerationId ? 60 : 20,
    tokens: 100,
  }));
  const first = requests.filter((r) => r.firstMs < 450);
  const later = requests.filter((r) => r.laterMs < 45);
  const joint = first.filter((r) => r.laterMs < 45);
  return {
    requests,
    first,
    later,
    joint,
    eligibleTokens: sum(joint.map((r) => r.tokens)),
    p95First: nearestRank(requests.map((r) => r.firstMs)),
    p95Later: nearestRank(requests.map((r) => r.laterMs)),
    seconds: 10,
  };
}

export function hardwareDecision() {
  const A = {
      id: 'A',
      first: [...Array(9).fill(200), 400],
      later: Array(10).fill(20),
      tokens: 400,
      seconds: 8,
      cost: 0.01,
    },
    B = {
      id: 'B',
      first: Array(10).fill(250),
      later: Array(10).fill(20),
      tokens: 400,
      seconds: 10,
      cost: 0.02,
    };
  return [A, B].map((r) => {
    const p95First = nearestRank(r.first);
    const p95Later = nearestRank(r.later);
    const eligible = p95First <= 300 && p95Later <= 30;
    const requestEligibleTokens =
      r.first.filter((v, i) => v <= 300 && r.later[i] <= 30).length * 40;
    return {
      ...r,
      p95First,
      p95Later,
      eligible,
      requestEligibleTokens,
      raw: r.tokens / r.seconds,
      eligibleGoodput: eligible ? requestEligibleTokens / r.seconds : 0,
      tokensPerDollar: eligible ? requestEligibleTokens / r.cost : null,
    };
  });
}
export function pallasOwnershipTrace(order) {
  assert(['consecutive', 'interleaved'].includes(order));
  const route =
    order === 'consecutive'
      ? [
          ['Y00', 0, 1],
          ['Y00', 1, 2],
          ['Y01', 0, 3],
          ['Y01', 1, 4],
        ]
      : [
          ['Y00', 0, 1],
          ['Y01', 0, 3],
          ['Y00', 1, 2],
          ['Y01', 1, 4],
        ];
  let current = null,
    parts = [],
    sum = 0;
  const trace = [];
  for (const [output, k, value] of route) {
    const lost = current !== null && current !== output && parts.length < 2;
    if (current !== output) {
      current = output;
      parts = [];
      sum = 0;
    }
    parts.push(k);
    sum += value;
    trace.push({
      output,
      k,
      value,
      lost,
      parts: [...parts],
      sum,
      complete: parts.length === 2,
    });
  }
  return trace;
}
