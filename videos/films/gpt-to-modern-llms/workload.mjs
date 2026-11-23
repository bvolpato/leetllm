import { labels, referenceLabel } from './fixtures.mjs';

export function checkReply(reply) {
  return {
    allowed: labels.includes(reply),
    correct: reply === referenceLabel,
  };
}

// The same 100 held-out notes, fixed serving load and two licensed configurations.
export const runs = [
  { id: 'A', verified: 90, p95: 600, gb: 8 },
  { id: 'B', verified: 94, p95: 1200, gb: 16 },
];
export const live = { p95: 750, gb: 12 };
export const overnight = { p95: 1500, gb: 12 };
export const largerWorker = { p95: 1500, gb: 16 };

export function chooseRun(limits) {
  const eligible = runs.filter((run) => run.p95 <= limits.p95 && run.gb <= limits.gb);
  return eligible.reduce((best, run) => (!best || run.verified > best.verified ? run : best), null);
}

export function routeExperts(logits) {
  const top = logits
    .map((score, id) => ({ score, id }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const terms = top.map(({ score }) => Math.exp(score - top[0].score));
  const total = terms[0] + terms[1];
  return top.map((expert, i) => ({ ...expert, share: terms[i] / total }));
}
export const expertInputs = [
  { token: 'import', logits: [2.4, 0.3, 0.5, -0.2] },
  { token: 'assertion', logits: [0.1, 2.2, 0.7, 0] },
];
