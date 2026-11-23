import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCE,
  CURRENT_RECORD,
  checkedIncidentClaim,
  renderIncident,
  freshIncidentFrame,
  dolaDistribution,
  cadDistribution,
  releaseEvidence,
} from '../animations/hallucination-evidence.mjs';
test('current-field equality cannot bypass the cited version and repaired rendering discards supplied prose', () => {
  const before = freshIncidentFrame(false),
    after = freshIncidentFrame(true);
  assert.equal(before.route, 'abstain');
  assert.equal(before.verdicts[0], 'version_mismatch');
  assert.equal(after.route, 'serve');
  assert.equal(after.text.includes('Fully recovered'), false);
  assert.equal(after.text.includes('15:10 UTC'), true);
  assert.equal(after.text.includes('mitigated'), true);
});
test('the field contract distinguishes unknown source,exclusive status and missing evidence,with duplicate protection', () => {
  const c = {
    id: 'x',
    sourceId: EVIDENCE.sourceId,
    version: EVIDENCE.version,
    field: 'recovery_eta',
    value: '15:10 UTC',
  };
  assert.equal(checkedIncidentClaim(c), 'not_supported');
  assert.equal(checkedIncidentClaim({ ...c, sourceId: 'unknown' }), 'no_source');
  assert.equal(checkedIncidentClaim({ ...c, field: 'status', value: 'resolved' }), 'contradicted');
  assert.equal(
    checkedIncidentClaim({ ...c, version: CURRENT_RECORD.version }, CURRENT_RECORD),
    'supported',
  );
  assert.throws(() => renderIncident([c, { ...c }]), /Duplicate/);
  assert.equal(renderIncident([]).route, 'abstain');
});
test('DoLa masks before normalization while CAD uses a nonnegative normalized ratio rather than probability subtraction', () => {
  const d = dolaDistribution([0.6, 0.3, 0.1], [0.2, 0.6, 0.2], 0.5);
  for (const [i, p] of [6 / 7, 1 / 7, 0].entries())
    assert.ok(Math.abs(d.probabilities[i] - p) < 1e-12);
  const c = cadDistribution([0.6, 0.3, 0.1], [0.2, 0.6, 0.2], 1);
  for (const [i, p] of [0.9, 0.075, 0.025].entries())
    assert.ok(Math.abs(c.probabilities[i] - p) < 1e-12);
});
test('release evidence rejects missing and truthy substitutes', () => {
  assert.equal(
    releaseEvidence({ regressions: true, versions: true, holdout: false, owner: true }),
    false,
  );
  assert.throws(
    () => releaseEvidence({ regressions: true, versions: true, holdout: 'false', owner: true }),
    /actual boolean/,
  );
  assert.throws(
    () => releaseEvidence({ regressions: true, versions: true, owner: true }),
    /actual boolean/,
  );
});
