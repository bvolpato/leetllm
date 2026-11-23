import { mpA, mpB, mpBias } from './fixtures.mjs';
export function pipeline(items = 4, stages = 3) {
  return Array.from(
    {
      length: stages,
    },
    (_, stage) =>
      Array.from(
        {
          length: items + stages - 1,
        },
        (_, tick) => (tick >= stage && tick < stage + items ? tick - stage + 1 : null),
      ),
  );
}
export const mpClamp = (n) => Math.max(0, Math.min(1, n));
export const mpSum = (values) => values.reduce((a, b) => a + b, 0);
export function mpErf(x) {
  const n = 2048,
    sign = Math.sign(x),
    end = Math.abs(x),
    h = end / n;
  let value = 1 + Math.exp(-end * end);
  for (let i = 1; i < n; i++) value += (i % 2 ? 4 : 2) * Math.exp(-((i * h) ** 2));
  return (((sign * 2) / Math.sqrt(Math.PI)) * value * h) / 3;
}
function project(input, weights) {
  return weights[0].map((_, j) => mpSum(input.map((value, i) => value * weights[i][j])));
}
const gelu = (x) => 0.5 * x * (1 + mpErf(x / Math.SQRT2));

export function denseMLP(input) {
  return project(project(input, mpA).map(gelu), mpB).map((value, i) => value + mpBias[i]);
}

export function parallelMLP(input = [1, 2], reduction = 'sum', duplicateBias = false) {
  const expansions = [0, 1].map((rank) =>
    project(
      input,
      mpA.map((row) => row.slice(2 * rank, 2 * rank + 2)),
    ),
  );
  const activated = expansions.map((slice) => slice.map(gelu));
  const partials = activated.map((slice, rank) =>
    project(slice, mpB.slice(2 * rank, 2 * rank + 2)),
  );
  const output = mpBias.map(
    (bias, j) =>
      mpSum(partials.map((p) => p[j])) / (reduction === 'mean' ? 2 : 1) +
      bias * (duplicateBias ? 2 : 1),
  );
  return {
    input,
    expansion: expansions.flat(),
    hidden: activated.flat(),
    partials,
    output,
    A: mpA,
    B: mpB,
    bias: mpBias,
  };
}
export function weightLedger(
  parameters = 35e9,
  bytes = 2,
  capacity = 80e9,
  reserve = 16e9,
  ranks = 1,
) {
  if (!Number.isInteger(ranks) || ranks < 1 || typeof ranks === 'boolean')
    throw Error('positive integer rank count required');
  const payload = parameters * bytes,
    weight = payload / ranks,
    free = capacity - reserve - weight;
  return {
    payload,
    weight,
    free,
    capacity,
    reserve,
    ranks,
    minimumRanks: Math.ceil(payload / (capacity - reserve)),
    fits: free >= 0,
  };
}
export function pipelineOccupancy(stages = 3, items = 4) {
  if ([stages, items].some((n) => typeof n !== 'number' || !Number.isInteger(n) || n < 1))
    throw Error('positive integer stage and item counts required');
  const ticks = items + stages - 1,
    occupied = items * stages,
    total = stages * ticks;
  return {
    stages,
    items,
    ticks,
    occupied,
    total,
    idle: total - occupied,
    utilization: items / ticks,
    idleFraction: (stages - 1) / ticks,
    overhead: (stages - 1) / items,
    layout: pipeline(items, stages),
  };
}
export function historyOwnership({ tp = 8, heads = 2, lanes = 4, positions = 32 } = {}) {
  if (tp !== heads * lanes || positions % lanes) throw Error('incompatible head/lane ownership');
  const ranks = Array.from(
    {
      length: tp,
    },
    (_, rank) => ({
      rank,
      head: Math.floor(rank / lanes),
      lane: rank % lanes,
      positions: Array.from(
        {
          length: positions,
        },
        (_, i) => i,
      ).filter((i) => i % lanes === rank % lanes),
    }),
  );
  return {
    ranks,
    plainPairs: tp * positions,
    uniquePairs: heads * positions,
    physicalPairs: mpSum(ranks.map((r) => r.positions.length)),
    perRank: positions / lanes,
  };
}
export function mergeMass(shards) {
  const valid = shards.filter((s) => s.scores.length),
    maximum = Math.max(...valid.flatMap((s) => s.scores));
  if (!valid.length) throw Error('query has no valid key positions');
  const parts = valid.map((s) => {
    const m = Math.max(...s.scores),
      weights = s.scores.map((score) => Math.exp(score - m));
    return {
      m,
      l: mpSum(weights),
      u: mpSum(weights.map((w, i) => w * s.values[i])),
    };
  });
  const mass = mpSum(parts.map((s) => Math.exp(s.m - maximum) * s.l)),
    numerator = mpSum(parts.map((s) => Math.exp(s.m - maximum) * s.u));
  return {
    maximum,
    parts,
    mass,
    numerator,
    output: numerator / mass,
    wrongMean: mpSum(parts.map((s) => s.u / s.l)) / parts.length,
  };
}
export function expertAssignments() {
  const routes = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ],
    gates = [0.75, 0.25],
    owners = [0, 0, 1, 1];
  const assignments = routes.flatMap((experts, token) =>
    experts.map((expert, j) => ({
      token,
      input: token + 1,
      expert,
      owner: owners[expert],
      gate: gates[j],
      raw: (expert + 1) * (token + 1),
      weighted: gates[j] * (expert + 1) * (token + 1),
    })),
  );
  const loads = [0, 1].map((rank) => assignments.filter((a) => a.owner === rank).length),
    outputs = routes.map((_, i) =>
      mpSum(assignments.filter((a) => a.token === i).map((a) => a.weighted)),
    );
  return {
    routes,
    assignments,
    loads,
    outputs,
    skew: Math.max(...loads) / (assignments.length / 2),
  };
}
export function localPlacement(values, capacity = 29) {
  return {
    values,
    capacity,
    groupTotal: mpSum(values),
    groupCapacity: values.length * capacity,
    free: values.map((v) => capacity - v),
    fits: values.every((v) => v <= capacity),
  };
}
export function usefulCost(hourly, usefulRate) {
  return (hourly / (usefulRate * 3600)) * 1e6;
}
