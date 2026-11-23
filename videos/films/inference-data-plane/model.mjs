import { digest, eligibleWorker, sameLayout } from './arithmetic.mjs';
import { compatible, expectedBlockIds, trustedDigests } from './fixtures.mjs';
export function localityRouteSnapshot(progress, prefix = 'P7') {
  const checked = Math.max(0, Math.min(1, progress));
  const candidates = [
    {
      id: 'A',
      worker: compatible.workerA,
      prefix: 'P7',
      locality: 'local',
      rate: 12,
      setup: 0.2,
      cached: 0,
    },
    {
      id: 'B',
      worker: compatible.workerB,
      prefix: 'P7',
      locality: 'local',
      rate: 24,
      setup: 0.1,
      cached: 48,
    },
    {
      id: 'C',
      worker: {
        ...compatible.workerA,
        freeBlocks: 64,
      },
      prefix: 'P7',
      locality: 'rack 2',
      rate: 6,
      setup: 0.8,
      cached: 36,
    },
  ];
  const rows = candidates.map((candidate) => {
    const eligible = eligibleWorker(compatible.source, candidate.worker, 48);
    const reused =
        eligible && candidate.prefix === prefix ? Math.floor(candidate.cached * checked) : 0,
      missing = 48 - reused;
    return {
      ...candidate,
      eligible,
      reused,
      missing,
      cost: eligible ? candidate.setup + missing / candidate.rate : null,
    };
  });
  return {
    request: 'R4219',
    prefix,
    required: 48,
    rows,
    selected: rows
      .filter((row) => row.eligible)
      .reduce((best, row) => (row.cost < best.cost ? row : best)),
  };
}
export function completeUniqueCoverage(attempt) {
  const received = new Set(attempt.received);
  return (
    received.size === attempt.received.length &&
    received.size === expectedBlockIds.length &&
    attempt.expected.length === expectedBlockIds.length &&
    expectedBlockIds.every((block) => received.has(block) && attempt.expected.includes(block))
  );
}
export function mayCommit(attempt) {
  return (
    attempt.state === 'transferring' &&
    sameLayout(compatible.source, attempt.manifest) &&
    completeUniqueCoverage(attempt) &&
    attempt.visibility === 'ready' &&
    attempt.expected.every(
      (id) => attempt.segmentData[id] && digest(attempt.segmentData[id]) === trustedDigests[id],
    )
  );
}
export function mayReclaim(attempt) {
  return attempt.state === 'retired' && attempt.transportQuiescent && attempt.consumersQuiescent;
}
export function acceptCompletion(owner, receipt) {
  return (
    ['request', 'operation', 'generation', 'model', 'reservation'].every(
      (key) => owner[key] === receipt[key],
    ) && mayCommit(receipt)
  );
}
