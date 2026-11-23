import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { FRESH_PROPOSAL, PROPOSAL, RELEASE_WINDOW } from './fixtures.mjs';
// The lesson's deployment table has one row per service within the selected tenant.
export function deploymentRow(revision, trafficPercent) {
  return { service: PROPOSAL.service, revision, trafficPercent };
}
export function conditionalWrite(row, proposal) {
  if (row.service !== proposal.service || row.revision !== proposal.revision)
    return { rows: 0, row };
  return {
    rows: 1,
    row: { ...row, trafficPercent: proposal.trafficPercent, revision: row.revision + 1 },
  };
}
export const WORKED_SQL = [
  'UPDATE deployment',
  `SET traffic = ${PROPOSAL.trafficPercent}, revision = revision + 1`,
  `WHERE service = '${PROPOSAL.service}' AND revision = ${PROPOSAL.revision};`,
];
export function operationTarget(initialRevision = 3, initialShare = 0) {
  const saved = new Map();
  let effects = 0,
    live = deploymentRow(initialRevision, initialShare);
  return {
    apply(id, payload) {
      assert.equal(id, payload.operationId, 'dispatch identity matches reviewed action');
      const body = canonical(payload);
      if (saved.has(id)) {
        assert.equal(saved.get(id).body, body, 'operation identity binds one payload');
        return saved.get(id).receipt;
      }
      const write = conditionalWrite(live, payload);
      assert.equal(write.rows, 1, 'compare revision inside the write');
      live = write.row;
      const receipt = Object.freeze({
        operationId: id,
        status: 'executed',
        revision: live.revision,
        trafficPercent: live.trafficPercent,
        effectCount: ++effects,
      });
      saved.set(id, {
        body,
        receipt,
      });
      return receipt;
    },
    query: (id) => saved.get(id)?.receipt ?? null,
    get row() {
      return { ...live };
    },
    get effects() {
      return effects;
    },
  };
}
function envelope(proposal) {
  return {
    schema: 1,
    serialization: 'local-json-v1',
    tool: proposal.action,
    tenant: proposal.tenant,
    service: proposal.service,
    resource: proposal.model,
    proposalVersion: proposal.version,
    arguments: {
      from: proposal.from,
      to: proposal.to,
      trafficPercent: proposal.trafficPercent,
    },
    preconditions: {
      generation: proposal.revision,
    },
    baselineTraffic: proposal.fromTraffic,
    evidence: [...proposal.evidence].sort(),
    operationId: proposal.operationId,
  };
}
export const canonical = (proposal) => JSON.stringify(envelope(proposal));
export const digest = (proposal) => createHash('sha256').update(canonical(proposal)).digest('hex');
export function envelopeFixture(trafficPercent = PROPOSAL.trafficPercent) {
  const proposal = { ...PROPOSAL, trafficPercent };
  return {
    value: envelope(proposal),
    bytes: canonical(proposal),
    digest: digest(proposal),
  };
}
export function decisionStore() {
  const records = new Map(),
    eligible = new Set(['casey']);
  return {
    decide(
      id,
      proposal,
      reviewer,
      decision,
      expiresAt,
      decidedAt = 100,
      executeBefore = expiresAt,
    ) {
      assert.ok(eligible.has(reviewer), 'reviewer is in trusted release policy');
      assert.ok(['approve', 'reject'].includes(decision));
      assert.ok(!records.has(id), 'decision record is immutable');
      assert.ok(decidedAt < expiresAt, 'review window is open');
      const record = Object.freeze({
        id,
        digest: digest(proposal),
        revision: proposal.revision,
        operationId: proposal.operationId,
        reviewer,
        decision,
        expiresAt,
        decidedAt,
        executeBefore,
      });
      records.set(id, record);
      return record;
    },
    permits(id, current, liveRevision, now) {
      const record = records.get(id);
      return Boolean(
        record &&
        eligible.has(record.reviewer) &&
        record.decision === 'approve' &&
        record.decidedAt <= now &&
        now < record.executeBefore &&
        record.digest === digest(current) &&
        record.revision === current.revision &&
        record.revision === liveRevision &&
        record.operationId === current.operationId,
      );
    },
  };
}
export function buildRegisteredDecisions() {
  const store = decisionStore();
  for (const [id, proposal] of [
    ['review-17', PROPOSAL],
    ['review-18', FRESH_PROPOSAL],
  ]) {
    store.decide(
      id,
      proposal,
      'casey',
      'approve',
      RELEASE_WINDOW.reviewBefore,
      100,
      RELEASE_WINDOW.executeBefore,
    );
  }
  return {
    store,
  };
}
export const { store } = buildRegisteredDecisions();
