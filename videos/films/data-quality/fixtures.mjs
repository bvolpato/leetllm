import { createHash } from 'node:crypto';
export const records = [
  {
    id: 101,
    conversation: 'c-51',
    text: 'Build is still failing',
    label: 'escalate',
  },
  {
    id: 102,
    conversation: 'c-51',
    text: '  BUILD is still failing  ',
    label: 'escalate',
  },
  {
    id: 103,
    conversation: 'c-52',
    text: 'Where is the deploy policy?',
    label: 'standard',
  },
  {
    id: 104,
    conversation: 'c-53',
    text: 'SEV-123 timeline has no reviewed label',
    label: null,
  },
  {
    id: 107,
    conversation: 'c-54',
    text: 'Build is not failing',
    label: 'standard',
  },
  {
    id: 201,
    conversation: 'c-71',
    text: 'Migration blocked for 12 days',
    label: 'escalate',
  },
  {
    id: 202,
    conversation: 'c-71',
    text: ' migration blocked for 12 days ',
    label: 'escalate',
  },
  {
    id: 203,
    conversation: 'c-72',
    text: 'Migration blocked for 12 days',
    label: 'standard',
  },
];
export const normalize = (value) =>
  value.normalize('NFKC').toLocaleLowerCase('en-US').trim().replace(/\s+/g, ' ');
export const fingerprint = (value) =>
  createHash('sha256').update(normalize(value), 'utf8').digest('hex');
export const splitSeed = 'support-ticket-split-v1';
export const valid = (row) =>
  Number.isInteger(row.id) &&
  typeof row.conversation === 'string' &&
  Boolean(row.conversation) &&
  typeof row.text === 'string' &&
  row.text.trim().length > 0 &&
  ['standard', 'escalate'].includes(row.label);
export function splitHash(groupKey) {
  const input = `${splitSeed}:${groupKey}`;
  const digest = createHash('sha256').update(input, 'utf8').digest('hex');
  const prefix = digest.slice(0, 8);
  return {
    input,
    digest,
    prefix,
    bucket: Number.parseInt(prefix, 16) % 100,
  };
}
export const splitBucket = (groupKey) => splitHash(groupKey).bucket;
export const splitName = (bucket) => (bucket < 70 ? 'train' : bucket < 85 ? 'validation' : 'test');
export function grouped(recordsToSplit) {
  const result = new Map();
  for (const row of recordsToSplit) {
    result.set(row.conversation, splitName(splitBucket(row.conversation)));
  }
  return result;
}
export const referencePassage =
  'the library return box stays open on Sunday while the building is closed';
export const editedPassage = 'Use the outdoor returns slot when the library shuts.';
export function createOriginalDataPipeline() {
  const accepted = records.filter(valid);
  const fingerprintGroups = new Map();
  for (const row of accepted) {
    const key = fingerprint(row.text),
      group = fingerprintGroups.get(key) ?? [];
    group.push(row);
    fingerprintGroups.set(key, group);
  }
  const crossConversationReviewGroups = [...fingerprintGroups.values()].filter(
    (group) => group.length > 1 && new Set(group.map((row) => row.conversation)).size > 1,
  );
  const conflictGroups = [...fingerprintGroups.values()].filter(
    (group) => new Set(group.map((row) => row.label)).size > 1,
  );
  const conflictIds = new Set(conflictGroups.flatMap((group) => group.map((row) => row.id)));
  const quarantineIds = new Set(
    [...crossConversationReviewGroups, ...conflictGroups].flatMap((group) =>
      group.map((row) => row.id),
    ),
  );
  const sameConversationGroups = new Map();
  for (const row of accepted.filter((row) => !quarantineIds.has(row.id))) {
    const key = `${row.conversation}:${fingerprint(row.text)}`;
    const group = sameConversationGroups.get(key) ?? [];
    group.push(row);
    sameConversationGroups.set(key, group);
  }
  const sameConversationDuplicateGroups = [...sameConversationGroups.values()].filter(
    (group) => group.length > 1,
  );
  const deduplicatedIds = new Set(
    sameConversationDuplicateGroups.flatMap((group) => group.slice(1).map((row) => row.id)),
  );
  const releaseRows = accepted
    .filter((row) => !quarantineIds.has(row.id) && !deduplicatedIds.has(row.id))
    .sort((a, b) => a.id - b.id);
  const releasedPartitions = grouped(releaseRows);
  const releasedArtifact = {
    snapshot: 'support-ticket-demo-v1',
    rows: releaseRows.map((row) => ({
      ...row,
      split: releasedPartitions.get(row.conversation),
    })),
  };
  const releasedDigest = createHash('sha256')
    .update(JSON.stringify(releasedArtifact))
    .digest('hex');
  const changedArtifact = structuredClone(releasedArtifact);
  changedArtifact.rows.find((row) => row.id === 103).text = changedArtifact.rows
    .find((row) => row.id === 103)
    .text.replace('?', '!');
  const changedDigest = createHash('sha256').update(JSON.stringify(changedArtifact)).digest('hex');
  const excludedReleaseIds = records
    .filter((row) => !releaseRows.some((kept) => kept.id === row.id))
    .map((row) => row.id);
  const partitionRows = Object.fromEntries(
    ['train', 'validation', 'test'].map((split) => [
      split,
      releasedArtifact.rows.filter((row) => row.split === split),
    ]),
  );
  return {
    accepted,
    fingerprintGroups,
    crossConversationReviewGroups,
    conflictGroups,
    conflictIds,
    quarantineIds,
    sameConversationGroups,
    sameConversationDuplicateGroups,
    deduplicatedIds,
    releaseRows,
    releasedPartitions,
    releasedArtifact,
    releasedDigest,
    changedArtifact,
    changedDigest,
    excludedReleaseIds,
    partitionRows,
  };
}
export const {
  accepted,
  fingerprintGroups,
  crossConversationReviewGroups,
  conflictGroups,
  conflictIds,
  quarantineIds,
  sameConversationGroups,
  sameConversationDuplicateGroups,
  deduplicatedIds,
  releaseRows,
  releasedPartitions,
  releasedArtifact,
  releasedDigest,
  changedArtifact,
  changedDigest,
  excludedReleaseIds,
  partitionRows,
} = createOriginalDataPipeline();
export const leakageQuestions = [
  records[1],
  records[4],
  {
    id: 301,
    conversation: 'c-55',
    text: 'The migration is still blocked',
    label: 'escalate',
  },
];
export const referenceRows = Object.freeze([
  {
    ticket_id: 401,
    conversation_id: 'c-a',
    text: 'Build is still failing',
    label: 'escalate',
  },
  {
    ticket_id: 402,
    conversation_id: 'c-a',
    text: ' BUILD is still failing ',
    label: 'escalate',
  },
  {
    ticket_id: 403,
    conversation_id: 'c-i',
    text: 'Runbook page shows stale',
    label: 'standard',
  },
  {
    ticket_id: 404,
    conversation_id: 'c-c',
    text: 'SEV-123 timeline has no reviewed label',
    label: null,
  },
  {
    ticket_id: 405,
    conversation_id: 'c-002',
    text: 'Break-glass request will not open',
    label: 'standard',
  },
  {
    ticket_id: 406,
    conversation_id: 'c-e',
    text: 'Migration ran twice in production',
    label: 'escalate',
  },
  {
    ticket_id: 407,
    conversation_id: 'c-l',
    text: 'Deploy completed this morning',
    label: 'standard',
  },
  {
    ticket_id: 408,
    conversation_id: 'build-003',
    text: 'Build stalled after approval',
    label: 'escalate',
  },
  {
    ticket_id: 409,
    conversation_id: 'c-m',
    text: 'Access request pending review',
    label: 'standard',
  },
  {
    ticket_id: 410,
    conversation_id: 'c-m',
    text: 'Access request pending review',
    label: 'escalate',
  },
  {
    ticket_id: 411,
    conversation_id: 'c-x',
    text: 'Access policy page missing',
    label: 'standard',
  },
  {
    ticket_id: 412,
    conversation_id: 'c-y',
    text: 'Access policy page missing',
    label: 'standard',
  },
]);
export const freshRows = Object.freeze([
  {
    ticket_id: 701,
    conversation_id: 'incident-701',
    text: 'DEPLOY remains queued',
    label: 'standard',
  },
  {
    ticket_id: 702,
    conversation_id: 'incident-701',
    text: ' deploy remains queued ',
    label: 'standard',
  },
  {
    ticket_id: 703,
    conversation_id: 'incident-703',
    text: 'Rollback gate is stuck',
    label: 'escalate',
  },
  {
    ticket_id: true,
    conversation_id: 'incident-704',
    text: 'Cancel build',
    label: 'standard',
  },
]);
