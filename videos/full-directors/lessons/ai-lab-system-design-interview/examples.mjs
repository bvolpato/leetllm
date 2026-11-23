import {
  memoryBudget,
  trafficBudget,
  queueAdmission,
  dualResourceAdmission,
  servingSnapshot,
  eligibleDocuments,
  releaseGate,
  canTransition,
  retryMode,
} from '../../../films/ai-lab-system-design-interview/model.mjs';
import { DOCS } from '../../../films/ai-lab-system-design-interview/fixtures.mjs';

export {
  memoryBudget,
  trafficBudget,
  dualResourceAdmission,
  DOCS,
  eligibleDocuments,
  releaseGate,
  canTransition,
  retryMode,
};
export const queue = { rate: 125000, budgetMs: 250, unit: 10000 };
export function arrival(units, quota = true) {
  const decision = queueAdmission(units * queue.unit, queue.rate, queue.budgetMs / 1000);
  return {
    wait: Math.round(1000 * decision.estimatedWait),
    units,
    status: !quota ? 429 : decision.admitted ? 'admit' : 503,
  };
}
export function service(ms, joined) {
  const at = Math.round(ms);
  const v = servingSnapshot(at / 1000, { joined });
  return {
    ...v,
    ms: at,
    wait: joined ? Math.min(at, 160) : null,
    service: Math.max(0, Math.min(at - 160, 40)),
    blocks: v.active === 'R-104' ? v.usedKv : 0,
  };
}
export const ledger = { total: 10000, reserve: 1800, actual: 1520 };
export function balance(reserved, confirmed) {
  return {
    available: ledger.total - (confirmed ? ledger.actual : reserved ? ledger.reserve : 0),
    pending: reserved && !confirmed ? ledger.reserve : 0,
    used: confirmed ? ledger.actual : 0,
  };
}
export const arrivals = [200, 210, 220, 500];
export function latency(stamps) {
  const gaps = stamps.slice(1).map((s, i) => s - stamps[i]);
  return {
    first: stamps[0],
    gaps,
    mean: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    max: gaps.length ? Math.max(...gaps) : null,
  };
}
export function claim(taken, freeKvBlocks = taken ? 0 : 16) {
  const available = {
    activeDecode: taken ? 64 : 63,
    maxDecode: 64,
    freeKvBlocks,
    neededKvBlocks: 16,
  };
  return { ...available, ...dualResourceAdmission(available) };
}
export const nextSequence = { id: 'R-203', pages: [2, 6] };
export function nextIteration(joined) {
  const { activeDecode, maxDecode, freeKvBlocks } = claim(false);
  const pages = joined ? nextSequence.pages : [];
  return {
    maxDecode,
    activeDecode: activeDecode + Number(joined),
    freeKvBlocks: freeKvBlocks - pages.length,
    neededKvBlocks: nextSequence.pages.length,
    owner: joined ? nextSequence.id : null,
    pages,
  };
}
export const expertScores = [0.10, 0.20, 0.15, 0.55];
export const selectedExpert = expertScores.indexOf(Math.max(...expertScores));
export const expertDevices = ['A', 'A', 'B', 'B'];
export function stageStatus(transfer) {
  if (transfer === 0) return ['Computing', 'Idle'];
  if (transfer < 1) return ['Sent activation', 'Waiting'];
  return ['Idle', 'Computing'];
}
export const draftTokens = ['Meet', 'at', 'noon'];
export const targetTokens = ['Meet', 'at', 'two'];
export function acceptedPrefixLength(proposed, greedy) {
  let length = 0;
  while (length < proposed.length && proposed[length] === greedy[length]) length++;
  return length;
}
export function freshness(age, limit) {
  return Number.isFinite(age) && age >= 0 && age <= limit;
}
export const cached = {
  tokens: '12 8 19',
  positions: '0 1 2',
  model: 'M7',
  adapter: 'L2',
  config: 'C3',
  tenant: 'T4',
  doc: 'D9',
};
export function reuse(request, grant) {
  return Object.keys(cached).every((k) => cached[k] === request[k]) && grant;
}
export function claimEdge(stored, expected, next) {
  return stored === expected && canTransition(stored, next);
}
export function canary(error, ms, leaks) {
  if (Number.isInteger(leaks) && leaks > 0) return 'Rollback';
  if (
    leaks !== 0 ||
    !Number.isFinite(error) ||
    error < 0 ||
    error > 1 ||
    !Number.isFinite(ms) ||
    ms < 0
  )
    return 'Hold';
  return error <= 0.01 && ms <= 900 ? 'Expand' : 'Hold';
}
export const windows = [
  [0.01, 900, 0],
  [0.011, 800, 0],
  [null, null, 1],
];
export const scored = {
  recall: 94,
  faithfulness: 93,
  recallMinimum: 92,
  faithfulnessMinimum: 95,
  sample: 100,
};
export function canaryPacket(leaks, changedEcho = false) {
  return {
    recall: 0.96,
    recallMinimum: changedEcho ? 0.90 : 0.92,
    faithfulness: 0.97,
    faithfulnessMinimum: 0.95,
    leaks,
  };
}
export function release(scores = scored, leaks = 0) {
  const n = scores.sample;
  return releaseGate({
    recall: scores.recall / n,
    faithfulness: scores.faithfulness / n,
    leaks,
    recallMinimum: scores.recallMinimum / n,
    faithfulnessMinimum: scores.faithfulnessMinimum / n,
  });
}
export function practice(refreshed) {
  const cap = dualResourceAdmission({
    prefillTokens: 25000,
    prefillRate: 125000,
    waitBudget: 0.25,
    activeDecode: 63,
    maxDecode: 64,
    freeKvBlocks: 16,
    neededKvBlocks: 16,
  });
  const age = refreshed ? 10 : 75,
    leaks = refreshed ? 0 : null;
  const gate = releaseGate(canaryPacket(leaks));
  return {
    cap,
    age,
    leaks,
    fresh: freshness(age, 60),
    gate,
    finance: eligibleDocuments().some((d) => d.id === 'finance-plan'),
  };
}
