import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dcg } from '../../../films/capstone-product-ranking-recommendation/arithmetic.mjs';
import {
  buildCurrentSlate,
  evaluatedRanking,
  exposureFrame,
  fitPairwise,
  meanPairGradient,
  rankingResponse,
  weightedClickExpectation,
} from '../../../films/capstone-product-ranking-recommendation/model.mjs';
import {
  REQUIRED_GATES,
  rankingFeatures,
} from '../../../films/capstone-product-ranking-recommendation/fixtures.mjs';
import { TRAINING_PAIRS } from '../../../films/capstone-product-ranking-recommendation/training-data.mjs';

export {
  buildCurrentSlate,
  dcg,
  evaluatedRanking,
  exposureFrame,
  meanPairGradient,
  rankingResponse,
  rankingFeatures,
  REQUIRED_GATES,
  TRAINING_PAIRS,
};
export const printers = [
  ['P8', 0.98, 0.99, 3, false, false, true],
  ['P11', 0.97, 0.97, 2, true, true, false],
  ['P5', 0.93, 0.96, 3, true, true, true],
  ['P6', 0.86, 0.84, 2, true, true, true],
  ['P4', 0.74, 0.45, 1, true, true, true],
].map(([id, match, score, grade, approved, stock, ships]) => ({
  id,
  match,
  score,
  grade,
  approved,
  stock,
  ships,
  seller: 'S' + id.slice(1),
}));
export const byId = Object.fromEntries(printers.map((p) => [p.id, p]));
export const reason = (p) =>
  !p.approved
    ? 'Policy block'
    : !p.stock
      ? 'Sold out'
      : !p.ships
        ? 'Outside delivery region'
        : null;
export const eligible = printers.filter((p) => !reason(p));
export const control = ['P4', 'P5', 'P6'].map((id) => byId[id]);
export const ids = (rows) => rows.map((r) => r.id);
export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
export function measure(rows, universe = eligible) {
  const relevant = universe.filter((p) => p.grade >= 2);
  const gains = rows.map((p, i) => (2 ** p.grade - 1) / Math.log2(i + 2));
  const ideal = dcg(universe.map((p) => p.grade).sort((a, b) => b - a));
  const found = relevant.filter((p) => rows.some((r) => r.id === p.id)).length;
  return {
    gains,
    observed: sum(gains),
    ideal,
    ndcg: ideal ? sum(gains) / ideal : 0,
    found,
    total: relevant.length,
  };
}
export const mmr = (p, selected) => {
  const similarity = selected ? ({ P6: 0.9, P4: 0.1 }[p.id] ?? 0) : 0;
  const reward = 0.6 * p.score,
    penalty = 0.4 * similarity;
  return { similarity, reward, penalty, value: reward - penalty };
};
export const latencies = [11, 13, 12, 15, 14, 16, 13, 12, 17, 18];
export const percentile = (a, q) => [...a].sort((x, y) => x - y)[Math.ceil(a.length * q) - 1];
const csv = readFileSync(new URL('./temporal-ranking.csv', import.meta.url), 'utf8')
  .trim()
  .split(/\r?\n/);
const day = (s) => (Date.parse(s) - Date.UTC(2026, 4, 1)) / 86400000 + 1;
export const requests = [];
for (const line of csv.slice(1)) {
  const [id, served, feature, label, , product, x, y, g] = line.split(',');
  let r = requests.find((r) => r.id === id);
  if (!r) {
    r = { id, served: day(served), products: [], labelTimes: [], features: [] };
    requests.push(r);
  }
  r.products.push([product, +x, +y, +g]);
  r.labelTimes.push(day(label));
  r.features.push(day(feature));
}
export function split(r) {
  const freeze = r.served < 5 ? 5 : r.served < 7 ? 7 : 10;
  if (r.features.some((t) => t > r.served)) return 'Invalid feature';
  if (Math.max(...r.labelTimes) >= freeze) return 'Pending';
  if (r.served < 1 || r.served >= 9) return 'Outside window';
  return freeze === 5 ? 'Train' : freeze === 7 ? 'Validation' : 'Test';
}
export function pending(early, lateFeature) {
  const base = requests[3];
  return {
    ...base,
    labelTimes: early ? [4.75, 4.75, 4.75] : base.labelTimes,
    features: lateFeature ? [4.625, ...base.features.slice(1)] : base.features,
  };
}
export const fits = [0, 0.1].map((lambda) => {
  const fit = fitPairwise(lambda);
  const metric = (group) =>
    sum(
      requests.filter((r) => split(r) === group).map((r) => evaluatedRanking(r, fit.weights).ndcg),
    ) / 2;
  return { ...fit, lambda, valid: metric('Validation'), test: metric('Test') };
});
export const selectedFit = [...fits].sort((a, b) => b.valid - a.valid || b.lambda - a.lambda)[0];
export const exposure = exposureFrame(1);
export function clickRow(examination, cap, count = 100) {
  const { weight, raw, weighted } = weightedClickExpectation(examination, 0.5, 1, cap);
  return {
    examination,
    relevance: 0.5,
    count,
    looks: examination * count,
    clicks: raw * count,
    raw,
    weight,
    weighted,
  };
}
export const lamps = [
  ['J1', 'lantern', 'B', 0.8, 0.2],
  ['J2', 'globe', 'A', 0.7, 0.9],
  ['J3', 'mushroom', 'A', 0.6, 0.6],
  ['J5', 'pleats', 'A', 0.5, 0.3],
].map(([id, shape, seller, match, quality]) => ({
  id,
  shape,
  seller,
  match,
  quality,
  score: dot([-0.1, 1.2], [match, quality]),
  stock: true,
  allowed: true,
}));
export const proposed = buildCurrentSlate(lamps);
export const currentLamps = lamps.map((l) => ({ ...l, stock: l.id !== 'J3' }));
export const returned = buildCurrentSlate(currentLamps);
export const arm = (shopper) =>
  ['treatment', 'control'][
    createHash('sha256')
      .update('ranking-ab-2026-05:' + shopper)
      .digest()
      .readUInt32BE() % 2
  ];
export const responses = [
  { id: 'REQ-500', shopper: 'SHOP-100', served: 0, rows: control },
  { id: 'REQ-501', shopper: 'SHOP-200', served: 5, rows: eligible },
  { id: 'L17', shopper: null, served: 0, rows: returned },
];
export function saveProposal(rows, catalog) {
  const valid = rows.every((p) => {
    const current = catalog.find((q) => q.id === p.id);
    return current && !reason(current);
  });
  return valid ? rows : [];
}
export const event = (id, request, product, time, kind = 'click') => ({
  id,
  request,
  product,
  time,
  kind,
});
export const events = [
  event('EVT-900', 'REQ-501', 'P5', 8),
  event('EVT-901', 'REQ-501', 'P5', 258, 'purchase'),
];
export function join(e, prior = []) {
  const prev = prior.find((v) => v.id === e.id),
    reply = responses.find((r) => r.id === e.request);
  const rank = reply?.rows.findIndex((row) => row.id === e.product) ?? -1;
  if (prev && ['request', 'product', 'time', 'kind'].some((k) => prev[k] !== e[k]))
    return 'ID conflict';
  if (rank < 0) return 'Absent from response';
  if (e.time < reply.served) return 'Before serving';
  return prev ? 'Replay, count once' : 'Position ' + (rank + 1);
}
export function returnsRule(controlPurchases, treatmentPurchases) {
  const rates = [
    controlPurchases ? 0 / controlPurchases : null,
    treatmentPurchases ? 1 / treatmentPurchases : null,
  ];
  const verdict = rates.includes(null)
    ? 'Hold comparison'
    : rates[1] - rates[0] > 0.01
      ? 'Stop treatment'
      : 'Continue';
  return { rates, verdict };
}
