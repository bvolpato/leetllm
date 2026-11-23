import { createHash } from 'node:crypto';
import { report, AB_VISUAL_FIXTURES } from '../../../films/ab-testing/fixtures.mjs';
import { standardError, requiredN } from '../../../films/ab-testing/arithmetic.mjs';
import {
  groundingPacket,
  incidentOutcome,
  clusterDesignEffect,
  planningPower,
  mixtureEvidence,
  alphaSpend,
  cupedVariance,
  pairedContrastVariance,
  receiptMismatches,
} from '../../../films/ab-testing/model.mjs';
export {
  report,
  AB_VISUAL_FIXTURES as sim,
  standardError,
  requiredN,
  groundingPacket,
  incidentOutcome,
  clusterDesignEffect,
  planningPower,
  mixtureEvidence,
  alphaSpend,
  cupedVariance,
  pairedContrastVariance,
  receiptMismatches,
};
export const shortcutEnrollment = Math.ceil(
  requiredN(0.38, 0.02, 1.959963984540054, 0.8416212335729143),
);
export const version = 'incident-query-rewrite:v1';
export function assign(id) {
  const byte = createHash('sha256')
    .update(version + ':' + id)
    .digest()
    .readBigUInt64BE();
  const bucket = Number(byte % 100n);
  return { id, bucket, arm: bucket < 50 ? 'Rewrite' : 'Control' };
}
export function meter(copies = 1) {
  const arms = [report.control, report.treatment].map((a) => ({
    n: a.n * copies,
    resolved: a.resolved * copies,
    rate: a.resolved / a.n,
  }));
  const [a, b] = arms;
  const delta = 100 * (b.rate - a.rate),
    se = 100 * standardError(a.rate, b.rate, a.n, b.n);
  return { arms, delta, se, low: delta - 1.96 * se, high: delta + 1.96 * se };
}
export function split(counts) {
  const expected = (counts[0] + counts[1]) / 2,
    parts = counts.map((n) => (n - expected) ** 2 / expected),
    total = parts[0] + parts[1];
  return { counts, expected, parts, total, alert: total > 10.83 };
}
export const locked = {
  index: 'runbooks-2026-05-01',
  generator: 'incident-generator-v7',
  prompt: 'incident-generator-prompt-v3',
  decoder: 'greedy / incident-answer-v2',
};
export function gate({
  p95 = report.treatment.p95,
  target = 2,
  alert = false,
  failures = report.treatment.groundingFailures,
} = {}) {
  if (alert) return { alert };
  const { delta, low } = meter(),
    audit = groundingPacket(failures),
    ms = p95 - report.control.p95;
  const pages =
    100 * (report.treatment.pages / report.treatment.n - report.control.pages / report.control.n);
  return {
    delta,
    low,
    ms,
    p95,
    target,
    audit,
    pages,
    speed: ms <= 150,
    benefit: low > 0 && delta >= target,
    launch: low > 0 && delta >= target && ms <= 150 && pages <= 0.5 && audit.passes,
  };
}
