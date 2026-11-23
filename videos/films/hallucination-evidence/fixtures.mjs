export const EVIDENCE = Object.freeze({
  sourceId: 'incident-INC-48291',
  version: 'runbook-feed/2026-05-27T10:00:00Z',
  facts: Object.freeze({
    service: 'embedding-api',
    status: 'investigating',
    last_event: 'database failover completed',
    last_event_at: 'May 26 at 08:14 UTC',
  }),
});
const citation = { sourceId: EVIDENCE.sourceId, version: EVIDENCE.version };
export const draftClaims = Object.freeze([
  {
    ...citation,
    id: 'service',
    field: 'service',
    value: 'embedding-api',
    text: 'Service: embedding-api.',
  },
  {
    ...citation,
    id: 'event',
    field: 'last_event',
    value: 'database failover completed',
    text: 'Last event: database failover completed.',
  },
  {
    ...citation,
    id: 'event_time',
    field: 'last_event_at',
    value: 'May 26 at 08:14 UTC',
    text: 'Event time: May 26 at 08:14 UTC.',
  },
  {
    ...citation,
    id: 'eta',
    field: 'recovery_eta',
    value: '14:30 UTC',
    text: 'Full recovery is expected by 14:30 UTC.',
  },
]);
export const resolvedClaim = Object.freeze({
  ...citation,
  id: 'resolved',
  field: 'status',
  value: 'resolved',
  text: 'Incident INC-48291 is resolved.',
});
export const cases = Object.freeze([
  {
    id: 'clean_update',
    claims: draftClaims.slice(0, 3),
  },
  {
    id: 'invented_eta',
    claims: draftClaims,
  },
  {
    id: 'wrong_status',
    claims: [resolvedClaim],
  },
  {
    id: 'unadmitted_source',
    claims: [
      {
        id: 'service',
        ...citation,
        sourceId: 'missing-feed',
        field: 'service',
        value: 'embedding-api',
        text: 'Service: embedding-api.',
      },
    ],
  },
]);
export const CURRENT_RECORD = Object.freeze({
  sourceId: EVIDENCE.sourceId,
  version: 'runbook-feed/v2',
  facts: Object.freeze({
    ...EVIDENCE.facts,
    status: 'mitigated',
    recovery_eta: '15:10 UTC',
  }),
});
