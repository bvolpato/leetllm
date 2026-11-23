import { euclidean, hash, normalized } from './arithmetic.mjs';
import { judgeRows, provenance, reviewMatrix, selectionItems, testRows } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function redact(text) {
  return text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL]');
}
export function judgePair(a, b) {
  if (!a.evidence || !b.evidence) return 'ADJUDICATE';
  if (!a.safe && !b.safe) return 'BOTH BAD';
  const accepted = [a, b].filter((item) => item.safe && item.correct);
  if (!accepted.length) return 'REWRITE';
  if (accepted.length === 1) return `CHOOSE ${accepted[0].id}`;
  return 'TIE';
}
export function cohenKappa(matrix = reviewMatrix) {
  assert(
    matrix.length > 0 &&
      matrix.every(
        (row) => row.length === matrix.length && row.every((n) => Number.isInteger(n) && n >= 0),
      ),
  );
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  assert(total > 0);
  const diagonal = matrix.reduce((sum, row, i) => sum + row[i], 0),
    rows = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  const cols = rows.map((_, i) => matrix.reduce((sum, row) => sum + row[i], 0));
  const expected = rows.reduce((sum, value, i) => sum + value * cols[i], 0) / total ** 2;
  return {
    total,
    observed: diagonal / total,
    expected,
    kappa: expected === 1 ? null : (diagonal / total - expected) / (1 - expected),
    disagreements: total - diagonal,
  };
}
export function hybridSteps(batchSize = 4, weight = 0.6) {
  assert(
    Number.isInteger(batchSize) &&
      batchSize > 0 &&
      batchSize <= selectionItems.length &&
      weight >= 0 &&
      weight <= 1,
  );
  const selected = [],
    steps = [];
  while (selected.length < batchSize) {
    const remaining = selectionItems.filter((item) => !selected.includes(item));
    const nearest = (item) =>
      selected.length ? Math.min(...selected.map((chosen) => euclidean(item.xy, chosen.xy))) : 0;
    const maxDistance = Math.max(...remaining.map(nearest));
    const ranked = remaining
      .map((item) => ({
        item,
        distance: nearest(item),
        score: selected.length
          ? weight * item.uncertainty +
            (1 - weight) * (maxDistance ? nearest(item) / maxDistance : 0)
          : item.uncertainty,
      }))
      .sort((a, b) => b.score - a.score);
    selected.push(ranked[0].item);
    steps.push({
      selected: [...selected],
      ranked,
      chosen: ranked[0],
    });
  }
  return steps;
}
export function hybridSelect(batchSize = 4, weight = 0.6) {
  return hybridSteps(batchSize, weight).at(-1).selected;
}
export function reviewJudgeOrder() {
  const rows = judgeRows.map((row) => ({
    ...row,
    mapped: row.swapped === 'A' ? 'B' : 'A',
  }));
  return {
    rows,
    flips: rows.filter((row) => row.original !== row.mapped),
    agreement: rows.filter((row) => row.original === row.human).length / rows.length,
  };
}
export function overlapFindings(training, tests = testRows) {
  const ids = new Set(tests.map((row) => row.id)),
    families = new Set(tests.map((row) => row.family)),
    texts = new Set(tests.map((row) => hash(normalized(row.text))));
  return training.flatMap((row) =>
    [
      ids.has(row.id) ? `${row.id}: ID` : null,
      texts.has(hash(normalized(row.text))) ? `${row.id}: content` : null,
      families.has(row.family) || row.parents.some((id) => ids.has(id))
        ? `${row.id}: lineage`
        : null,
    ].filter(Boolean),
  );
}
export function auditRelease(rows, completed = true, auditDigest = hash(rows)) {
  const digest = hash(rows),
    stats = cohenKappa(),
    manifest = {
      dataset: 'feedback-v12',
      sourceWindow: '2026-09',
      selector: 'hybrid-v1',
      redactor: provenance.redactor,
      rubric: provenance.rubric,
      evaluation: 'promotion-eval-v5',
      rowCount: rows.length,
      snapshot: digest,
    };
  const checks = {
    redaction: rows.every((row) => !/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(row.text)),
    leakage: completed && overlapFindings(rows).length === 0,
    agreement: Number.isFinite(stats.kappa) && stats.kappa >= 0.65,
    safeTargets: rows.every((row) => row.chosenSafe),
    resolved: rows.every((row) => ['A', 'B'].includes(row.choice)),
    provenance: rows.every((row) =>
      Object.keys(provenance).every((key) => row.provenance[key] === provenance[key]),
    ),
    snapshot:
      completed &&
      manifest.snapshot === digest &&
      manifest.rowCount === rows.length &&
      auditDigest === digest,
  };
  return {
    rows,
    manifest,
    digest,
    completed,
    findings: overlapFindings(rows),
    checks,
    open: Object.values(checks).every((value) => value === true),
  };
}
export function preferenceFixture() {
  const policy = [0.4, 0.1],
    reference = [0.2, 0.2],
    beta = 0.5,
    ratios = policy.map((p, i) => Math.log(p / reference[i])),
    margin = beta * (ratios[0] - ratios[1]),
    probability = 1 / (1 + Math.exp(-margin));
  return {
    policy,
    reference,
    beta,
    ratios,
    margin,
    probability,
    loss: -Math.log(probability),
  };
}
export function fleissFixture() {
  const rows = [
      [3, 0, 0],
      [0, 2, 1],
      [0, 3, 0],
      [1, 0, 2],
    ],
    m = 3,
    n = rows.length,
    agreements = rows.map((r) => r.reduce((s, x) => s + x * (x - 1), 0) / (m * (m - 1))),
    counts = rows[0].map((_, j) => rows.reduce((s, r) => s + r[j], 0)),
    mean = agreements.reduce((a, b) => a + b, 0) / n,
    chance = counts.reduce((s, c) => s + (c / (n * m)) ** 2, 0);
  return {
    rows,
    counts,
    agreements,
    mean,
    chance,
    kappa: (mean - chance) / (1 - chance),
  };
}
export function binaryMeasures(p) {
  assert(Number.isFinite(p) && p >= 0 && p <= 1);
  return {
    least: Math.min(p, 1 - p),
    margin: 1 - Math.abs(2 * p - 1),
    entropy: [p, 1 - p].reduce((s, q) => s - (q ? q * Math.log2(q) : 0), 0),
  };
}
export function releaseSummaryGate(value) {
  const numeric = (x, lo, hi) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
  return (
    value.redaction === true &&
    value.completed === true &&
    Array.isArray(value.findings) &&
    value.findings.length === 0 &&
    numeric(value.kappa, -1, 1) &&
    numeric(value.threshold, 0, 1) &&
    value.kappa >= value.threshold &&
    Number.isSafeInteger(value.unsafe) &&
    value.unsafe === 0 &&
    Number.isSafeInteger(value.unresolved) &&
    value.unresolved === 0
  );
}
