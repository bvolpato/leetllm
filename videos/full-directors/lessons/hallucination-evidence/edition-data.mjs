import assert from 'node:assert/strict';
import {
  EVIDENCE,
  CURRENT_RECORD,
  draftClaims,
  resolvedClaim,
  cases,
} from '../../../films/hallucination-evidence/fixtures.mjs';
import {
  checkedIncidentClaim,
  renderIncident,
  semanticSampleStats,
  dolaDistribution,
  cadDistribution,
  releaseEvidence,
} from '../../../films/hallucination-evidence/arithmetic.mjs';
import {
  baselineReview,
  candidateReview,
  relabeledReview,
  silentReview,
} from '../../../films/hallucination-evidence/case-review.mjs';

export {
  EVIDENCE,
  CURRENT_RECORD,
  draftClaims,
  resolvedClaim,
  cases,
  checkedIncidentClaim,
  renderIncident,
  semanticSampleStats,
  baselineReview,
  candidateReview,
  relabeledReview,
  silentReview,
};
export const [service, event, eventTime, eta] = draftClaims;
export const v1 = EVIDENCE.facts,
  v2 = CURRENT_RECORD.facts;
export const fieldNames = {
  service: 'Service',
  last_event: 'Last event',
  last_event_at: 'Event time',
  recovery_eta: 'Recovery estimate',
  status: 'Recorded status',
};
export const shortTime = (value) => value.match(/\d\d:\d\d UTC/)[0];
export const version = (name) =>
  name === EVIDENCE.version ? 'v1' : name === CURRENT_RECORD.version ? 'v2' : 'unknown';
export const draftAddition = 'Fully recovered.';
export const checkedService = { ...service, text: service.text + ' ' + draftAddition };
export const conflicts = [service, event, eventTime, resolvedClaim];
export const stale = { ...service, version: 'previous' };
export const missing = cases[3].claims[0];
export const finished = { ...event, value: 'database failover finished' };
export function fresh(repair) {
  const claims = [
    { ...eta, version: repair ? CURRENT_RECORD.version : EVIDENCE.version, value: v2.recovery_eta },
    {
      ...resolvedClaim,
      value: v2.status,
      version: CURRENT_RECORD.version,
      text: 'Fully recovered.',
    },
  ];
  return { claims, ...renderIncident(claims, CURRENT_RECORD) };
}
export const votes = [v1.status, v1.status, 'mitigated', 'resolved'];
export const editedVotes = [votes[0], votes[1], v1.status, votes[3]];
export const etaForms = ['14:30 UTC', '2:30 PM UTC', '14:30 UTC', '2:30 PM UTC'];
export const etaMeanings = etaForms.map((time) => (time === '2:30 PM UTC' ? eta.value : time));
export function samplingRoute(claims, samples) {
  const { route } = renderIncident(claims);
  if (route !== 'serve') return route;
  return !samples.length || semanticSampleStats(samples).disagreement > 0.25 ? 'review' : 'serve';
}
export const tokens = ['investigating', 'resolved', 'unknown'];
export const final = [0.7, 0.2, 0.1],
  earlier = [
    [0.4, 0.3, 0.3],
    [0.2, 0.3, 0.5],
  ],
  prior = [0.1, 0.8, 0.1];
const entropy = (probs) => probs.reduce((sum, p) => (p ? sum - p * Math.log(p) : sum), 0);
export const js = earlier.map(
  (row) => entropy(row.map((p, i) => (p + final[i]) / 2)) - (entropy(row) + entropy(final)) / 2,
);
export const selected = js.indexOf(Math.max(...js));
export const dola = dolaDistribution(final, earlier[selected], 0.2);
export const cad = (alpha) => cadDistribution(final, prior, alpha);
export const selfCheck = [
  [0.4, 0.1, 0.5],
  [0.6, 0.2, 0.2],
];
export const nliScores = selfCheck.map(([e, c]) => c / (e + c));
export const mass = [0.5, 0.25, 0.25];
export const terms = mass.map((p) => -p * Math.log(p));
export const tokenEntropy = terms.reduce((sum, term) => sum + term, 0);
export const points = Array.from({ length: 10 }, (_, i) => (i < 8 ? 'right' : 'wrong'));
export const selective = points.map((answer, i) => (i < 7 ? answer : 'pass'));
export const score = (answers) => ({
  points: answers.filter((x) => x === 'right').length,
  answered: answers.filter((x) => x !== 'pass').length,
  errors: answers.filter((x) => x === 'wrong').length,
});
export const release = { regressions: true, versions: true, holdout: false, owner: false };
export const released = releaseEvidence(release);
export const safeFacts = (claims) =>
  claims.flatMap((c, i) => (renderIncident(claims).verdicts[i] === 'supported' ? [c] : []));
export const support = cases
  .flatMap((c) => c.claims)
  .filter((c) => checkedIncidentClaim(c) === 'supported').length;
export const total = cases.reduce((n, c) => n + c.claims.length, 0);
export function check() {
  assert.deepEqual(renderIncident(draftClaims).verdicts, [
    'supported',
    'supported',
    'supported',
    'not_supported',
  ]);
  assert.deepEqual(safeFacts(draftClaims), [service, event, eventTime]);
  assert.equal(v1[eta.field], undefined);
  assert.equal(shortTime(v1.last_event_at), '08:14 UTC');
  assert.equal(renderIncident([checkedService]).text, 'Service: embedding-api.');
  assert.equal(renderIncident(conflicts).route, 'abstain');
  assert.equal(checkedIncidentClaim(stale), 'version_mismatch');
  assert.equal(checkedIncidentClaim(missing), 'no_source');
  assert.equal(checkedIncidentClaim(finished), 'not_supported');
  assert.throws(() => renderIncident([service, service]), /Duplicate/);
  assert.equal(renderIncident([]).route, 'abstain');
  const old = fresh(false),
    now = fresh(true);
  assert.deepEqual(old.verdicts, ['version_mismatch', 'supported']);
  assert.deepEqual(now.verdicts, ['supported', 'supported']);
  assert.equal(old.claims[0].value, now.claims[0].value);
  assert.equal(now.text, 'Recorded recovery estimate: 15:10 UTC. Recorded status: mitigated.');
  assert.deepEqual(
    [score(points), score(selective)],
    [
      { points: 8, answered: 10, errors: 2 },
      { points: 7, answered: 7, errors: 0 },
    ],
  );
  const statusClaim = { ...resolvedClaim, value: v1.status };
  for (const [samples, H, D, route] of [
    [votes, '1.040', 0.5, 'review'],
    [editedVotes, '0.562', 0.25, 'serve'],
  ]) {
    const stat = semanticSampleStats(samples);
    assert.equal(stat.entropy.toFixed(3), H);
    assert.equal(stat.disagreement, D);
    assert.equal(samplingRoute([statusClaim], samples), route);
  }
  assert.equal(semanticSampleStats(etaMeanings).entropy, 0);
  assert.equal(semanticSampleStats(etaForms).counts.length, 2);
  assert.equal(samplingRoute(draftClaims, etaMeanings), 'shorten');
  assert.equal(samplingRoute([statusClaim], []), 'review');
  assert.equal(tokenEntropy.toFixed(3), '1.040');
  assert.deepEqual(
    nliScores.map((s) => s.toFixed(2)),
    ['0.20', '0.25'],
  );
  assert.equal(((nliScores[0] + nliScores[1]) / 2).toFixed(3), '0.225');
  assert.equal(selected, 1);
  assert.equal(dola.cutoff.toFixed(2), '0.14');
  assert.deepEqual(
    dola.probabilities.map((p) => Math.round(100 * p)),
    [84, 16, 0],
  );
  assert.deepEqual(
    cad(0).probabilities.map((p) => p.toFixed(2)),
    final.map((p) => p.toFixed(2)),
  );
  assert.equal(cad(1).sum.toFixed(2), '5.05');
  assert.deepEqual(
    cad(1).probabilities.map((p) => p.toFixed(3)),
    ['0.970', '0.010', '0.020'],
  );
  const equalRuns = cadDistribution(final, final, 1);
  equalRuns.probabilities.forEach((p, i) => assert.ok(Math.abs(p - final[i]) < 1e-12));
  assert.deepEqual(
    [
      support,
      total,
      baselineReview.unsafe,
      baselineReview.served,
      candidateReview.unsafe,
      candidateReview.served,
    ],
    [6, 9, 3, 4, 0, 2],
  );
  assert.equal(relabeledReview.unsafe, 3);
  assert.equal(silentReview.unsafeRate, null);
  assert.equal(released, false);
  assert.throws(() => releaseEvidence({ ...release, holdout: 'false' }), /boolean/);
  return true;
}
