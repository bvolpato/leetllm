import { route } from './arithmetic.mjs';
import { CHOICE_SCORES, MOE_ASSIGNMENTS, MOE_FRESH_ROUTES, MOE_INPUTS } from './fixtures.mjs';
export function moeValidatedRoute(hidden, gate, k) {
  if (!Number.isSafeInteger(k) || k < 1 || k > gate.length)
    throw Error('top_k must be between 1 and the expert count');
  if (
    !Array.isArray(hidden) ||
    !hidden.length ||
    !gate.length ||
    gate.some((row) => !Array.isArray(row) || row.length !== hidden.length)
  )
    throw Error('gate rows must match the nonempty hidden dimension');
  if ([...hidden, ...gate.flat()].some((x) => typeof x !== 'number' || !Number.isFinite(x)))
    throw Error('router values must be finite numbers');
  const logits = gate.map((row) => row.reduce((n, w, i) => n + w * hidden[i], 0));
  if (logits.some((x) => !Number.isFinite(x))) throw Error('router values must be finite numbers');
  return {
    logits,
    ...route(logits, k),
  };
}
export function moeScalarGate(p = 0.75, normalized = false) {
  const output = 2 * (normalized ? 1 : p),
    loss = 0.5 * (output - 1) ** 2;
  return {
    p,
    output,
    loss,
    gradient: normalized ? 0 : (output - 1) * 2 * p * (1 - p),
  };
}
export function moePacked(assignments = MOE_ASSIGNMENTS, inputs = MOE_INPUTS) {
  const factors = [2, -1, 0.5],
    packed = assignments
      .map((row, index) => ({
        ...row,
        index,
        input: [...inputs[row.token]],
      }))
      .sort((a, b) => a.expert - b.expert || a.index - b.index),
    outputs = inputs.map((x) => x.map(() => 0));
  for (const r of packed) {
    r.expertOutput = r.input.map((x) => x * factors[r.expert]);
    r.contribution = r.expertOutput.map((x) => x * r.gate);
    r.contribution.forEach((x, j) => (outputs[r.token][j] += x));
  }
  return {
    packed,
    outputs,
    groups: factors.map((_, e) => packed.filter((r) => r.expert === e)),
    factors,
  };
}
export function moeCapacity(tokens, k, experts, factor, loads) {
  if (
    ![tokens, k, experts].every((x) => Number.isSafeInteger(x) && x > 0) ||
    !Number.isFinite(factor) ||
    factor <= 0
  )
    throw Error('Invalid capacity inputs');
  const assignments = tokens * k,
    slots = Math.ceil((assignments / experts) * factor),
    overflow = loads.map((x) => Math.max(0, x - slots));
  return {
    tokens,
    k,
    experts,
    factor,
    assignments,
    slots,
    loads: [...loads],
    overflow,
    totalOverflow: overflow.reduce((a, b) => a + b, 0),
  };
}
export function moeFresh(factor = 1) {
  return {
    ...moeCapacity(
      6,
      2,
      4,
      factor,
      [0, 1, 2, 3].map((e) => MOE_FRESH_ROUTES.filter((r) => r.includes(e)).length),
    ),
    routes: MOE_FRESH_ROUTES.map((r) => [...r]),
  };
}
export function moeWire(
  gates = [0.6, 0.4],
  outputs = [
    [0, 3],
    [5, 0],
  ],
) {
  const weighted = outputs.map((v, i) => v.map((x) => x * gates[i]));
  return {
    gates,
    outputs,
    weighted,
    separate: weighted[0].map((x, j) => x + weighted[1][j]),
    destinationCombined: outputs[0].map((_, j) =>
      outputs.reduce((n, v, i) => n + v[j] * gates[i], 0),
    ),
    assignmentBytes: 2 * 2 * 4096 * 2,
    coalescedBytes: 2 * 4096 * 2,
  };
}
export function moeReplica(input = [1, 2, 3, 4]) {
  const weights = Array.from(
      {
        length: 4,
      },
      (_, i) =>
        Array.from(
          {
            length: 4,
          },
          (_, j) => (i === j ? 1 : 0),
        ),
    ),
    copy = structuredClone(weights),
    apply = (w) => w.map((row) => row.reduce((n, v, i) => n + v * input[i], 0));
  return {
    weights,
    copy,
    input,
    originalOutput: apply(weights),
    copyOutput: apply(copy),
  };
}
export function moeSelection(affinities = [0.6, 0.5, 0.4], bias = [0, 0, 0.3], k = 2) {
  const scores = affinities.map((x, i) => x + bias[i]),
    ids = scores
      .map((_, i) => i)
      .sort((a, b) => scores[b] - scores[a] || a - b)
      .slice(0, k),
    mass = ids.reduce((n, i) => n + affinities[i], 0);
  return {
    affinities,
    bias,
    scores,
    ids,
    weights: ids.map((i) => affinities[i] / mass),
    wrongWeights: ids.map((i) => scores[i] / ids.reduce((n, j) => n + scores[j], 0)),
  };
}
export function moeServing(limit = 60) {
  return [
    {
      id: 'Dense',
      quality: 0.82,
      latency: 48,
      throughput: 820,
    },
    {
      id: 'MoE',
      quality: 0.83,
      latency: 55,
      throughput: 1100,
    },
  ].map((x) => ({
    ...x,
    checks: [x.quality >= 0.82, x.latency <= limit, x.throughput >= 1000],
    accepted: x.quality >= 0.82 && x.latency <= limit && x.throughput >= 1000,
  }));
}
export function moeChoice(
  buckets = CHOICE_SCORES.map((row) =>
    row
      .map((_, token) => token)
      .sort((a, b) => row[b] - row[a])
      .slice(0, 2),
  ),
  tokens = CHOICE_SCORES[0].length,
) {
  return {
    buckets,
    loads: buckets.map((x) => x.length),
    coverage: Array.from(
      {
        length: tokens,
      },
      (_, t) => buckets.filter((x) => x.includes(t)).length,
    ),
  };
}
export function moeBalance(f = [0.6, 0.2, 0.15, 0.05], p = [0.55, 0.22, 0.15, 0.08]) {
  const products = f.map((x, i) => x * p[i]);
  return {
    f,
    p,
    products,
    sum: products.reduce((a, b) => a + b, 0),
    score: f.length * products.reduce((a, b) => a + b, 0),
    coefficients: f.map((x) => f.length * x),
  };
}
export function moeZ(shift = 0) {
  const logits = [Math.log(0.75) + shift, Math.log(0.25) + shift],
    peak = Math.max(...logits),
    partition = peak + Math.log(logits.map((x) => Math.exp(x - peak)).reduce((a, b) => a + b, 0));
  return {
    logits,
    p: route(logits, 1).probabilities,
    partition,
    loss: partition ** 2,
  };
}
