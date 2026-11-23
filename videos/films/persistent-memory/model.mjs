import { ARCHIVED_TURNS, RECENT_TURNS, WINDOW_SUMMARY, WINDOW_TRACK } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function retrievalCandidates() {
  const weights = {
    similarity: 0.5,
    recency: 0.3,
    importance: 0.2,
  };
  const halfLifeHours = 168;
  const candidates = [
    {
      id: 'current replay',
      similarity: 0.9,
      ageHours: 24,
      importance: 0.8,
    },
    {
      id: 'older similar retry',
      similarity: 0.95,
      ageHours: 336,
      importance: 0.3,
    },
  ];
  return candidates.map((candidate) => {
    const recency = 2 ** (-candidate.ageHours / halfLifeHours);
    const contributions = {
      similarity: weights.similarity * candidate.similarity,
      recency: weights.recency * recency,
      importance: weights.importance * candidate.importance,
    };
    return {
      ...candidate,
      recency,
      contributions,
      score: Object.values(contributions).reduce((sum, value) => sum + value, 0),
    };
  });
}
export function retrievalScoreSnapshot(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * 12.534;
  const count =
    beat === 0 ? 0 : beat > 1 ? 3 : [2.025, 2.9875, 4.275].filter((at) => elapsed >= at).length;
  return retrievalCandidates().map((candidate) => {
    const terms = Object.entries(candidate.contributions).slice(0, count);
    return {
      ...candidate,
      terms,
      complete: count === 3,
      accumulated: terms.reduce((sum, [, value]) => sum + value, 0),
    };
  });
}
export function eligibleMemories(records, session) {
  return records.filter(
    (record) =>
      record.tenant === session.tenant &&
      record.repository === session.repository &&
      record.sourceAccess === true &&
      record.expired === false &&
      record.superseded === false &&
      record.projectionVersion === record.sourceVersion,
  );
}
export function memoryAccessFixture() {
  const session = {
    tenant: 'billing',
    repository: 'webhook',
  };
  const records = [
    {
      id: 'current replay',
      tenant: 'billing',
      repository: 'webhook',
      sourceAccess: true,
      expired: false,
      superseded: false,
      sourceVersion: 2,
      projectionVersion: 2,
      similarity: 0.9,
    },
    {
      id: 'older similar retry',
      tenant: 'billing',
      repository: 'webhook',
      sourceAccess: true,
      expired: false,
      superseded: false,
      sourceVersion: 1,
      projectionVersion: 1,
      similarity: 0.95,
    },
    {
      id: 'payments incident',
      tenant: 'payments',
      repository: 'webhook',
      sourceAccess: true,
      expired: false,
      superseded: false,
      sourceVersion: 1,
      projectionVersion: 1,
      similarity: 0.99,
    },
    {
      id: 'old command',
      tenant: 'billing',
      repository: 'webhook',
      sourceAccess: true,
      expired: false,
      superseded: true,
      sourceVersion: 2,
      projectionVersion: 1,
      similarity: 0.95,
    },
    {
      id: 'expired review',
      tenant: 'billing',
      repository: 'webhook',
      sourceAccess: true,
      expired: true,
      superseded: false,
      sourceVersion: 1,
      projectionVersion: 1,
      similarity: 0.92,
    },
    {
      id: 'revoked note',
      tenant: 'billing',
      repository: 'webhook',
      sourceAccess: false,
      expired: false,
      superseded: false,
      sourceVersion: 1,
      projectionVersion: 1,
      similarity: 0.91,
    },
  ];
  return {
    session,
    records,
    eligible: eligibleMemories(records, session),
  };
}
export function sourceProjectionState({
  sourceVersion,
  projectionVersion,
  grant,
  tombstone,
  queuedRefresh,
  expired = false,
}) {
  const accessible = grant && !tombstone && !expired;
  const readable = accessible && sourceVersion === projectionVersion;
  const refreshAdmitted = accessible && queuedRefresh;
  return {
    readable,
    refreshAdmitted,
    versionMatches: sourceVersion === projectionVersion,
  };
}
export function projectionLifecycle(beat, progress) {
  const seconds = progress * [11.35, 11.814, 12.55][beat],
    q = Math.max(0, Math.min(1, progress));
  const updated = beat > 0 || seconds >= 8.4;
  const refreshing = beat === 1 && seconds >= 9.34;
  const refreshProgress =
    beat > 1 ? 1 : beat === 1 ? Math.max(0, Math.min(1, (seconds - 9.34) / (10.55 - 9.34))) : 0;
  const refreshed = refreshProgress === 1;
  const revoked = beat === 2 && seconds >= 1.55;
  const lateRefresh = beat === 2 && seconds >= 5.16;
  const sourceVersion = updated ? 2 : 1,
    projectionVersion = refreshed ? 2 : 1;
  return {
    q,
    seconds,
    refreshProgress,
    updated,
    refreshing,
    refreshed,
    revoked,
    lateRefresh,
    sourceVersion,
    projectionVersion,
    ...sourceProjectionState({
      sourceVersion,
      projectionVersion,
      grant: !revoked,
      tombstone: revoked,
      queuedRefresh: refreshing || lateRefresh,
    }),
  };
}
export function admitMemoryWrite({ tenant, source, field, content, retentionDays }) {
  const allowedFields = new Set(['verification_command', 'preferred_package_manager']);
  const authorizationFields = new Set(['merge_approved', 'role', 'permission', 'access_granted']);
  if (!tenant) return 'blocked: missing authenticated scope';
  if (!['developer_statement', 'retained_source_record'].includes(source))
    return 'blocked: source not admitted';
  if (authorizationFields.has(field)) return 'blocked: authorization field';
  if (!allowedFields.has(field)) return 'blocked: field not pinnable';
  if (!content.trim() || content.length > 500) return 'blocked: content limit';
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365)
    return 'blocked: retention policy';
  return 'admitted';
}
export function memoryWriteSnapshot(beat, p) {
  const checks =
      beat === 0 ? 0 : beat === 1 ? Math.min(5, Math.floor(Math.max(0, p - 0.04) / 0.1)) : 5,
    candidate = {
      tenant: 'billing',
      source: 'developer_statement',
      field: 'verification_command',
      content: 'pnpm test --run billing',
      retentionDays: 90,
    },
    verdict = admitMemoryWrite(candidate),
    stored = checks === 5 && verdict === 'admitted',
    rejected =
      beat >= 1 &&
      (beat > 1 || p > 0.72) &&
      admitMemoryWrite({
        ...candidate,
        field: 'merge_approved',
        content: 'true',
      }) === 'blocked: authorization field';
  return {
    checks,
    stored,
    rejected,
    verdict,
    records: stored ? [candidate] : [],
  };
}
export function validateModel() {
  assert.equal(memoryWriteSnapshot(0, 0.99).records.length, 0);
  assert.equal(memoryWriteSnapshot(1, 0.4).checks, 3);
  assert.equal(memoryWriteSnapshot(1, 0.65).records.length, 1);
  assert.equal(memoryWriteSnapshot(1, 0.9).records.length, 1);
  assert.equal(memoryWriteSnapshot(1, 0.9).rejected, true);
  assert.equal(projectionLifecycle(0, 0.1).readable, true);
  assert.equal(projectionLifecycle(0, 0.9).readable, false);
  assert.equal(projectionLifecycle(1, 0.95).readable, true);
  assert.equal(projectionLifecycle(1, 8.96 / 11.814).readable, false);
  assert.equal(projectionLifecycle(1, 10.54 / 11.814).readable, false);
  assert.equal(projectionLifecycle(1, 10.56 / 11.814).readable, true);
  assert.equal(projectionLifecycle(2, 1.6 / 12.55).readable, false);
  assert.equal(projectionLifecycle(2, 0.9).readable, false);
  assert.equal(projectionLifecycle(2, 0.9).refreshAdmitted, false);
  const start = WINDOW_TRACK.sample({
    beat: 0,
    beatP: 1,
  });
  const preFold = WINDOW_TRACK.sample({
    beat: 1,
    beatP: 0.29,
  });
  const folded = WINDOW_TRACK.sample({
    beat: 1,
    beatP: 0.3,
  });
  const beatBoundary = WINDOW_TRACK.sample({
    beat: 1,
    beatP: 1,
  });
  const packed = WINDOW_TRACK.sample({
    beat: 2,
    beatP: 0.3,
  });
  assert.equal(start.id, 'window-uncompressed');
  assert.equal(preFold.id, 'window-uncompressed');
  assert.equal(folded.id, 'window-folded-overflow');
  assert.equal(beatBoundary.id, 'window-folded-overflow');
  assert.equal(packed.id, 'window-packed-prompt');
  assert.equal(start.snapshot.recent.length, 5);
  assert.deepEqual(
    folded.snapshot.recentIds,
    RECENT_TURNS.map((turn) => turn.id),
  );
  assert.deepEqual(
    folded.snapshot.recent,
    RECENT_TURNS.map((turn) => turn.text),
  );
  assert.deepEqual(
    folded.snapshot.archivedIds,
    ARCHIVED_TURNS.map((turn) => turn.id),
  );
  assert.deepEqual(
    folded.snapshot.archive,
    ARCHIVED_TURNS.map((turn) => turn.text),
  );
  assert.equal(folded.snapshot.summary[0], WINDOW_SUMMARY);
  const ranking = retrievalCandidates();
  assert(Math.abs(ranking[0].score - 0.8817) < 0.0001);
  assert(Math.abs(ranking[1].score - 0.61) < 1e-10);
  assert(ranking[0].score > ranking[1].score);
  const [replay, retry] = ranking.map(({ contributions }) => contributions);
  assert(replay.similarity < retry.similarity);
  assert(replay.similarity + replay.recency > retry.similarity + retry.recency);
  assert.deepEqual(
    ranking.map((row) => row.score.toFixed(3)),
    ['0.882', '0.610'],
  );
  for (const p of [0, 0.5, 1])
    assert(retrievalScoreSnapshot(0, p).every((row) => row.accumulated === 0));
  for (const [seconds, terms] of [
    [2, 0],
    [2.5, 1],
    [3.5, 2],
    [4.9, 3],
  ])
    for (const row of retrievalScoreSnapshot(1, seconds / 12.534)) {
      assert.equal(row.terms.length, terms);
      assert.equal(
        row.accumulated,
        row.terms.reduce((total, [, value]) => total + value, 0),
      );
    }
  for (const row of retrievalScoreSnapshot(1, 0.8)) assert.equal(row.accumulated, row.score);
  const access = memoryAccessFixture();
  assert.deepEqual(
    access.eligible.map(({ id, similarity }) => [id, similarity]),
    ranking.map(({ id, similarity }) => [id, similarity]),
  );
  const expired = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 2,
    grant: true,
    tombstone: false,
    expired: true,
    queuedRefresh: true,
  });
  assert.equal(expired.readable, false);
  assert.equal(expired.refreshAdmitted, false);
  const currentProjection = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 2,
    grant: true,
    tombstone: false,
    queuedRefresh: false,
  });
  const staleProjection = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 1,
    grant: true,
    tombstone: false,
    queuedRefresh: true,
  });
  const revokedProjection = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 2,
    grant: false,
    tombstone: true,
    queuedRefresh: false,
  });
  const revokedRefresh = sourceProjectionState({
    sourceVersion: 2,
    projectionVersion: 2,
    grant: false,
    tombstone: true,
    queuedRefresh: true,
  });
  assert.equal(currentProjection.readable, true);
  assert.equal(staleProjection.readable, false);
  assert.equal(staleProjection.refreshAdmitted, true);
  assert.equal(revokedProjection.readable, false);
  assert.equal(revokedRefresh.refreshAdmitted, false);
  assert.equal(
    admitMemoryWrite({
      tenant: 'billing',
      source: 'developer_statement',
      field: 'verification_command',
      content: 'pnpm test --run billing',
      retentionDays: 90,
    }),
    'admitted',
  );
  assert.equal(
    admitMemoryWrite({
      tenant: 'billing',
      source: 'developer_statement',
      field: 'merge_approved',
      content: 'true',
      retentionDays: 90,
    }),
    'blocked: authorization field',
  );
  assert.equal(
    admitMemoryWrite({
      tenant: '',
      source: 'developer_statement',
      field: 'verification_command',
      content: 'pnpm test',
      retentionDays: 90,
    }),
    'blocked: missing authenticated scope',
  );
}
