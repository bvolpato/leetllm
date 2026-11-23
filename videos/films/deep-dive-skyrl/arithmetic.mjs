import { mask } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export function maskedNll(logprobs) {
  const selected = logprobs.filter((_, i) => mask[i]);
  return -sum(selected) / selected.length;
}
export function advantages(reward) {
  const mean = sum(reward) / reward.length;
  return {
    mean,
    centered: reward.map((v) => v - mean),
  };
}
export function actionMeanNll(logprobs, actionMask) {
  assert.equal(logprobs.length, actionMask.length);
  const selected = logprobs.filter((_, i) => actionMask[i] === 1);
  assert(selected.length > 0 && selected.every(Number.isFinite));
  return -sum(selected) / selected.length;
}
export function stampTurnRewards(endpoints, length, { eos = false, custom = false } = {}) {
  assert(Number.isInteger(length) && length > 0);
  if (custom) return endpoints.at(-1)[0];
  const out = Array(length).fill(0);
  for (const [i, [reward, index]] of endpoints.entries()) {
    if (index >= length) break;
    if (eos && i === endpoints.length - 1) out[length - 1] = reward;
    else out[index] += reward;
  }
  return out;
}
export function admissionReceipt({ B, S, step, accepted, running, workers }) {
  const consumed = (step - 1) * B,
    limit = (S + step) * B,
    budget = B * (S + 1),
    outstanding = accepted + running - consumed,
    capacityMargin = limit - accepted - running,
    workerMargin = workers - running;
  return {
    B,
    S,
    step,
    accepted,
    running,
    workers,
    consumed,
    limit,
    budget,
    outstanding,
    charged: accepted + running,
    capacityMargin,
    workerMargin,
    available: Math.max(0, Math.min(capacityMargin, workerMargin)),
  };
}
export function liveRewardDecision(reward, live, tolerance = 1e-6) {
  assert.equal(reward.length, live.length);
  const selected = reward.filter((_, i) => live[i]),
    mean = selected.length ? sum(selected) / selected.length : 0,
    spread = selected.length ? Math.max(...selected) - Math.min(...selected) : 0;
  return {
    selected,
    mean,
    spread,
    keep: selected.length <= 1 || spread > tolerance,
    centered: selected.map((v) => v - mean),
  };
}
export function ppoReceipt(ratio, advantage, epsilon = 0.2) {
  const clipped = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio)),
    raw = ratio * advantage,
    bounded = clipped * advantage;
  return {
    ratio,
    advantage,
    epsilon,
    clipped,
    raw,
    bounded,
    surrogate: Math.min(raw, bounded),
    loss: -Math.min(raw, bounded),
  };
}
export function criticPairGate(values, returns, weights) {
  if (values == null || returns == null) return values == null && returns == null;
  return values.length === weights.length && returns.length === weights.length;
}
export function normalizedClip(low, high) {
  return {
    eps_clip_low: 1 - low,
    eps_clip_high: high - 1,
  };
}
export function scalarResume(saved, gradient, { weightOnly = false, mu = 0.75, eta = 0.1 } = {}) {
  const serialized = JSON.stringify(
      weightOnly
        ? {
            weight: saved.weight,
          }
        : saved,
    ),
    restored = JSON.parse(serialized),
    velocity = mu * (restored.velocity ?? 0) + gradient;
  return {
    serialized,
    restored,
    gradient,
    velocity,
    weight: restored.weight - eta * velocity,
  };
}
export function fleetReady(versions, target, finished, probes) {
  return (
    versions.length > 0 &&
    versions.every((v) => v === target) &&
    finished &&
    probes.length === versions.length &&
    probes.every(Boolean)
  );
}
export function stickyReplica(session, routes, loads) {
  if (routes[session] !== undefined) return routes[session];
  return loads.indexOf(Math.min(...loads));
}
