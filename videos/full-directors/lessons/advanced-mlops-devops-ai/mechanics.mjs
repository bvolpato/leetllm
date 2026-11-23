import {
  featureImpact,
  normalizeReleaseVector,
  temporalReleaseJoin,
  failureHistory,
} from '../../../films/advanced-mlops-devops-ai/features.mjs';
import {
  offlineReceipt,
  checkReceipt,
} from '../../../films/advanced-mlops-devops-ai/evaluation.mjs';
import {
  RELEASE_RULES,
  releaseTelemetry,
  ReleaseMetricSample,
  combineReleaseActions,
  sustainedReleaseTrace,
} from '../../../films/advanced-mlops-devops-ai/telemetry.mjs';
import {
  releaseFingerprintFixture,
  guardedReleaseTransition,
} from '../../../films/advanced-mlops-devops-ai/protocols.mjs';

export const replay = featureImpact(1);
export const mix = (start, end, fraction) => start * (1 - fraction) + end * fraction;
const docs = [replay.raw, [2, 0]];
export function vectorState(fraction) {
  return docs.map((raw) => {
    const unit = normalizeReleaseVector(raw);
    const point = raw.map((n, i) => mix(n, unit[i], fraction));
    return { point, score: point[0] };
  });
}
export const east = [{ event: 11.5, available: 11.75, value: 2 }];
export const history = [failureHistory, east];
export const noon = 12;
export const countAt = (region, ttl) =>
  temporalReleaseJoin(history[region], noon, ttl)?.value ?? null;

export const receipt = offlineReceipt;
export function budget(tokens) {
  const result = checkReceipt(receipt, tokens);
  return { ...result, tokens, over: Math.max(0, tokens - result.cap) };
}

export const pairs = [
  { scores: [0.82, 0.85], tokens: [600, 700] },
  { scores: [0.86, 0.88], tokens: [640, 760] },
  { scores: [0.84, 0.85], tokens: [620, 720] },
];
export function pairedSummary() {
  const totals = [0, 1].map((side) => pairs.reduce((n, row) => n + row.tokens[side], 0));
  const gain = pairs.reduce((n, row) => n + row.scores[1] - row.scores[0], 0) / pairs.length;
  const growth = 100 * (totals[1] / totals[0] - 1);
  return { totals, gain, growth, review: growth > 10 };
}
export function assigned(bucket, threshold, saved) {
  return saved ?? (bucket < threshold ? 'C' : 'B');
}

const rules = RELEASE_RULES.slice(0, 2);
export function readings(malformed) {
  const values = malformed ? [790, 0.83] : [910, 0.79];
  return rules.map((rule, i) => {
    const sample = new ReleaseMetricSample({
      release: 'release-a91',
      window: malformed ? '5m' : rule.window,
      count: malformed && i === 0 ? true : [2000, 300][i],
      age: 30,
      value: values[i],
    });
    return { rule, sample, ...releaseTelemetry(rule, sample, 'release-a91') };
  });
}
export const arbitrate = (rows) => combineReleaseActions(rows.map((r) => r.action));
export const threshold = 850;
export const streak = sustainedReleaseTrace([920, 910, 800, 901, 902, 903, 780], threshold, 3);
const print = releaseFingerprintFixture();
export const hashes = { B: print.left.digest, C: print.right.digest };
export const measured = { release: hashes.C, generation: 12 };
const restored = guardedReleaseTransition(measured, measured, hashes.B);
const redeployed = guardedReleaseTransition(restored.pointer, restored.pointer, hashes.C);
export const revisions = [measured, restored.pointer, redeployed.pointer];
export const stale = guardedReleaseTransition(redeployed.pointer, measured, hashes.B);
export const fail = guardedReleaseTransition(
  redeployed.pointer,
  redeployed.pointer,
  hashes.B,
  true,
);
export const retry = guardedReleaseTransition(redeployed.pointer, redeployed.pointer, hashes.B);
export const letter = (pointer) => (pointer.release === hashes.B ? 'B' : 'C');

export const releases = {
  B: { id: 'last-known-good', view: 'releases@4', corpus: 'corpus B', transform: 'L2' },
  C: { id: 'release-a91', view: 'releases@5', corpus: 'corpus C', transform: 'raw' },
};
export function syncBranch(desired, synced, probed) {
  const route = synced ? desired : 'B';
  return { desired, route, trace: probed ? releases[route] : null };
}
export const finalProbe = {
  event: 40,
  available: 55,
  request: 60,
  maxAge: 60,
  estimate: 13,
  actual: 12,
  tolerance: 2,
};
export function assessProbe(probe) {
  const age = probe.request - probe.event;
  const lead = probe.request - probe.available;
  const error = Math.abs(probe.estimate - probe.actual);
  return {
    age,
    lead,
    error,
    ok: !!temporalReleaseJoin([probe], probe.request, probe.maxAge) && error <= probe.tolerance,
  };
}
