import { abClamp, abNormalCdf, groundingRate, rate, standardError } from './arithmetic.mjs';
import { report, srm } from './fixtures.mjs';
import { abStarted } from './construction.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
export const lift = rate(report.treatment) - rate(report.control);
export const seLift = standardError(
  rate(report.control),
  rate(report.treatment),
  report.control.n,
  report.treatment.n,
);
export const liftInterval = [lift - 1.96 * seLift, lift + 1.96 * seLift];
export const groundingDelta = groundingRate(report.treatment) - groundingRate(report.control);
export const groundingSe = standardError(
  groundingRate(report.control),
  groundingRate(report.treatment),
  report.control.n,
  report.treatment.n,
);
export const groundingUpper = groundingDelta + 1.96 * groundingSe;
export const srmChiSquare = (srm.control - 2000) ** 2 / 2000 + (srm.treatment - 2000) ** 2 / 2000;
export const assignedArm = (incidentId) =>
  createHash('sha256')
    .update('query-rewrite-07|' + incidentId)
    .digest()[0] % 2;
export function assignmentTrace(
  state,
  progress = (id, fallback) => state.cues?.[id]?.progress ?? fallback,
) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const phase = (id) => state.cues?.[id]?.phase;
  const reached = (id, fallback) => (phase(id) ? phase(id) !== 'before' : fallback);
  const hashProgress =
    beat > 0 ? 1 : progress('randomize-hash', Math.max(0, Math.min(1, (p - 0.2) / 0.23)));
  const armProgress =
    beat > 0 ? 1 : progress('randomize-arm', Math.max(0, Math.min(1, (p - 0.44) / 0.19)));
  const messageProgress =
    beat > 0 ? 1 : progress('randomize-inherit', Math.max(0, Math.min(1, (p - 0.65) / 0.2)));
  const incident = 'inc-17',
    hashByte = createHash('sha256')
      .update('query-rewrite-07|' + incident)
      .digest()[0];
  return {
    incident,
    hashByte,
    arm: hashByte % 2,
    hashProgress,
    armProgress,
    messageProgress,
    hashVisible: beat > 0 || reached('randomize-hash', p >= 0.2),
    armVisible: beat > 0 || reached('randomize-arm', p >= 0.44),
    messageVisible: beat > 0 || reached('randomize-inherit', p >= 0.65),
    laterMessageArm: assignedArm(incident),
    assignmentWrites: beat > 0 || reached('randomize-arm', p >= 0.44) ? 1 : 0,
  };
}
export function accumulatedOutcomes(arm, progress) {
  const n = Math.round(arm.n * Math.max(0, Math.min(1, progress)));
  const resolved = Math.floor((n * arm.resolved) / arm.n);
  return {
    n,
    resolved,
    rate: n ? resolved / n : null,
  };
}
export function projectedInterval(n) {
  const radius = 1.96 * standardError(rate(report.control), rate(report.treatment), n, n);
  return {
    n,
    low: lift - radius,
    high: lift + radius,
  };
}
export function incidentOutcome({
  observedMinutes,
  usableAt,
  newPageAt = null,
  telemetryComplete = true,
}) {
  if (!Number.isFinite(observedMinutes) || observedMinutes < 0)
    throw Error('valid observation age required');
  if (observedMinutes < 10) return 'pending';
  if (!telemetryComplete) return 'unknown telemetry';
  return usableAt !== null &&
    usableAt >= 0 &&
    usableAt <= 10 &&
    (newPageAt === null || newPageAt > 10)
    ? 'resolved'
    : 'unresolved';
}
export function clusterDesignEffect(size, correlation) {
  if (
    !Number.isInteger(size) ||
    size < 1 ||
    !Number.isFinite(correlation) ||
    correlation < 0 ||
    correlation > 1
  )
    throw Error('valid equal-cluster assumptions required');
  return 1 + (size - 1) * correlation;
}
export function groundingPacket(treatmentFailures = 23) {
  if (!Number.isInteger(treatmentFailures) || treatmentFailures < 0 || treatmentFailures > 2000)
    throw Error('valid audit count required');
  const control = 22 / 2000,
    treatment = treatmentFailures / 2000,
    delta = treatment - control,
    se = standardError(control, treatment, 2000, 2000),
    margin = 1.96 * se;
  return {
    control,
    treatment,
    treatmentFailures,
    delta,
    se,
    low: delta - margin,
    upper: delta + margin,
    passes: delta + margin < 0.005,
  };
}
export function freshGroundingReveal(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  return {
    delta: beat > 1 || (beat === 1 && abStarted(state, 'fresh-grounding-delta', p > 0.2)),
    upper: beat > 1 || (beat === 1 && abStarted(state, 'fresh-grounding-upper', p > 0.45)),
    pass: beat > 1 || (beat === 1 && abStarted(state, 'fresh-grounding-pass', p > 0.7)),
  };
}
export function mixtureEvidence(
  outcomes = [...Array(10).fill(1), ...Array(10).fill(0)],
  nullRate = 0.4,
  alternatives = [0.2, 0.6],
) {
  if (
    !Number.isFinite(nullRate) ||
    nullRate <= 0 ||
    nullRate >= 1 ||
    !alternatives.length ||
    alternatives.some((q) => !Number.isFinite(q) || q <= 0 || q >= 1) ||
    outcomes.some((y) => y !== 0 && y !== 1)
  )
    throw Error('valid common-support Bernoulli fixture required');
  let ratios = alternatives.map(() => 1),
    maximum = 1;
  const rows = [
    {
      n: 0,
      ratios: [...ratios],
      current: 1,
      maximum: 1,
      p: 1,
    },
  ];
  outcomes.forEach((y, i) => {
    ratios = ratios.map(
      (ratio, j) =>
        ratio * (y ? alternatives[j] / nullRate : (1 - alternatives[j]) / (1 - nullRate)),
    );
    const current = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    maximum = Math.max(maximum, current);
    rows.push({
      n: i + 1,
      ratios: [...ratios],
      current,
      maximum,
      p: Math.min(1, 1 / maximum),
    });
  });
  return rows;
}
export function cupedVariance(varY, varX, covariance, theta = covariance / varX) {
  if (
    ![varY, varX, covariance, theta].every(Number.isFinite) ||
    varX <= 0 ||
    varY < 0 ||
    covariance ** 2 > varX * varY + 1e-10
  )
    throw Error('valid covariance model required');
  return varY + theta ** 2 * varX - 2 * theta * covariance;
}
export function pairedContrastVariance(varControl, varTreatment, covariance) {
  if (
    ![varControl, varTreatment, covariance].every(Number.isFinite) ||
    varControl < 0 ||
    varTreatment < 0 ||
    covariance ** 2 > varControl * varTreatment + 1e-10
  )
    throw Error('valid covariance model required');
  return varControl + varTreatment - 2 * covariance;
}
export function planningPower(n) {
  if (!Number.isFinite(n) || n <= 0) throw Error('positive sample size required');
  const nullSe = Math.sqrt((2 * 0.39 * 0.61) / n),
    alternativeSe = Math.sqrt((0.38 * 0.62 + 0.4 * 0.6) / n),
    critical = 1.959963984540054 * nullSe;
  return {
    n,
    nullSe,
    alternativeSe,
    critical,
    power:
      1 -
      abNormalCdf((critical - 0.02) / alternativeSe) +
      abNormalCdf((-critical - 0.02) / alternativeSe),
  };
}
export function alphaSpend(fraction) {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
    throw Error('information fraction in [0,1] required');
  return fraction === 0 ? 0 : 2 * (1 - abNormalCdf(1.959963984540054 / Math.sqrt(fraction)));
}
export function receiptMismatches(control, treatment) {
  return ['index', 'generator', 'prompt', 'decoder'].filter(
    (key) => !isDeepStrictEqual(control[key], treatment[key]),
  );
}
export function abJoinProbe(progress) {
  const rows = [
    {
      id: 'C1',
      arm: 'control',
    },
    {
      id: 'C2',
      arm: 'control',
    },
    {
      id: 'T1',
      arm: 'treatment',
    },
    {
      id: 'T2',
      arm: 'treatment',
    },
  ].map((row) => ({
    ...row,
    joined: !(row.id === 'C2' && abClamp(progress) > 0.35),
  }));
  return {
    rows,
    control: rows.filter((r) => r.arm === 'control' && r.joined).length,
    treatment: rows.filter((r) => r.arm === 'treatment' && r.joined).length,
  };
}
export const abExtendedScenes = new Set([
  'intro',
  'unit-and-interference',
  'metric',
  'event-maturity',
  'independent-units',
  'power-and-decision',
  'peeking',
  'alpha-spending',
  'mixture-evidence',
  'cuped-adjustment',
  'bandit-routing',
  'paired-prompts',
  'evaluation-stack',
  'guardrails',
  'fresh-grounding',
]);
