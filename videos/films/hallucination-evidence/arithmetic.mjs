import { EVIDENCE } from './fixtures.mjs';

const fieldLabels = {
  service: 'Service',
  status: 'Recorded status',
  last_event: 'Last event',
  last_event_at: 'Event time',
  recovery_eta: 'Recorded recovery estimate',
};
export function verifyClaim(claim, sources = { [EVIDENCE.sourceId]: EVIDENCE }) {
  const source = sources[claim.sourceId];
  return { claimId: claim.id, verdict: source ? checkedIncidentClaim(claim, source) : 'no_source' };
}
export function renderSupported(claim, record = EVIDENCE) {
  if (checkedIncidentClaim(claim, record) !== 'supported')
    throw new Error('Only verified fields may be rendered');
  return fieldLabels[claim.field] + ': ' + claim.value + '.';
}
export function safeAnswer(claims) {
  const { route, text, verdicts } = renderIncident(claims);
  return {
    route,
    answer: text,
    blocked: claims.filter((_, i) => verdicts[i] !== 'supported').map((c) => c.id),
  };
}
export function disagreement(samples) {
  const counts = new Map();
  for (const sample of samples) counts.set(sample, (counts.get(sample) ?? 0) + 1);
  return 1 - Math.max(...counts.values()) / samples.length;
}
export function smoothPhase(value, start, end) {
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}
export function checkedIncidentClaim(claim, record = EVIDENCE) {
  if (
    !claim ||
    typeof claim.id !== 'string' ||
    !claim.id.trim() ||
    typeof claim.field !== 'string' ||
    typeof claim.value !== 'string'
  )
    throw new TypeError('Claim identities,field and value must be nonempty text');
  if (
    !claim.field.trim() ||
    !claim.value.trim() ||
    !['service', 'status', 'last_event', 'last_event_at', 'recovery_eta'].includes(claim.field)
  )
    throw new TypeError('Declared field and nonempty value required');
  if (claim.sourceId !== record.sourceId) return 'no_source';
  if (claim.version !== record.version) return 'version_mismatch';
  if (!(claim.field in record.facts)) return 'not_supported';
  if (claim.value === record.facts[claim.field]) return 'supported';
  return claim.field === 'status' &&
    ['investigating', 'mitigated', 'resolved'].includes(claim.value)
    ? 'contradicted'
    : 'not_supported';
}
export function renderIncident(claims, record = EVIDENCE) {
  const ids = new Set(),
    fields = new Set();
  for (const claim of claims) {
    if (ids.has(claim.id) || fields.has(claim.field))
      throw new Error('Duplicate claim identity or field');
    ids.add(claim.id);
    fields.add(claim.field);
  }
  if (!claims.length)
    return {
      route: 'abstain',
      text: 'No verifiable claims were supplied.',
      verdicts: [],
    };
  const verdicts = claims.map((claim) => checkedIncidentClaim(claim, record));
  const stops = [
    [
      'contradicted',
      'The draft conflicts with the incident record. Please review the latest runbook state.',
    ],
    ['no_source', 'Incident details are unavailable right now.'],
    ['version_mismatch', 'The cited version is not the admitted snapshot.'],
  ];
  for (const [verdict, text] of stops) {
    if (verdicts.includes(verdict)) return { route: 'abstain', text, verdicts };
  }
  const sentences = claims
    .filter((_, i) => verdicts[i] === 'supported')
    .map((c) => renderSupported(c, record));
  if (sentences.length === claims.length)
    return { route: 'serve', text: sentences.join(' '), verdicts };
  const route = sentences.length ? 'shorten' : 'abstain';
  const missing = claims.filter((_, i) => verdicts[i] === 'not_supported');
  sentences.push(
    missing.every((c) => c.field === 'recovery_eta')
      ? 'The admitted record provides no support for that recovery estimate.'
      : 'Some requested details are not supported by the admitted record.',
  );
  return { route, text: sentences.join(' '), verdicts };
}
export function semanticSampleStats(labels) {
  if (!labels.length) throw new Error('Samples required');
  const counts = new Map();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  const masses = [...counts.values()].map((n) => n / labels.length);
  return {
    counts: [...counts.values()],
    masses,
    entropy: masses.reduce((n, p) => n + p * Math.log(1 / p), 0),
    disagreement: 1 - Math.max(...counts.values()) / labels.length,
  };
}
export function dolaDistribution(final, early, beta) {
  const cutoff = beta * Math.max(...final),
    weights = final.map((p, i) => (p >= cutoff ? p / early[i] : 0)),
    sum = weights.reduce((a, b) => a + b, 0);
  return {
    cutoff,
    weights,
    probabilities: weights.map((v) => v / sum),
  };
}
export function cadDistribution(context, prior, alpha) {
  const weights = context.map((p, i) => p * (p / prior[i]) ** alpha),
    sum = weights.reduce((a, b) => a + b, 0);
  return {
    weights,
    sum,
    probabilities: weights.map((v) => v / sum),
  };
}
export function releaseEvidence(requirements) {
  const names = ['regressions', 'versions', 'holdout', 'owner'];
  if (names.some((k) => typeof requirements[k] !== 'boolean'))
    throw new TypeError('Every release requirement must be an actual boolean');
  return names.every((k) => requirements[k]);
}
