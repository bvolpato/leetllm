import { publicationInput } from './fixtures.mjs';
import { corpus } from './model.mjs';
import { createHash } from 'node:crypto';
export function payloadFingerprint(input) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        input.workspace,
        input.previous,
        input.document,
        input.source,
        input.title,
        input.effective,
        input.chunks.map((row) => [row.id, row.document, row.text]),
        input.grants,
      ]),
    )
    .digest('hex');
}
export function createPublicationLedger() {
  return {
    data: corpus(),
    requests: new Map(),
  };
}
export function publishOnce(ledger, key, input = publicationInput) {
  const fingerprint = payloadFingerprint(input),
    saved = ledger.requests.get(key);
  if (saved)
    return {
      status: saved.fingerprint === fingerprint ? 'reused' : 'changed input rejected',
      document: saved.document,
      fingerprint,
    };
  const draft = structuredClone(ledger.data),
    previous = draft.documents.find((row) => row.id === input.previous && row.to === null);
  if (!previous || previous.workspace !== input.workspace)
    return {
      status: 'stale publication',
      fingerprint,
    };
  previous.to = input.effective;
  if (draft.documents.some((row) => row.id === input.document))
    return {
      status: 'duplicate document',
      fingerprint,
    };
  draft.documents.push({
    id: input.document,
    workspace: input.workspace,
    source: input.source,
    title: input.title,
    from: input.effective,
    to: null,
  });
  for (const row of input.chunks) {
    if (
      !draft.documents.some((document) => document.id === row.document) ||
      draft.chunks.some((child) => child.id === row.id)
    )
      return {
        status: 'foreign key or identity rejected',
        fingerprint,
      };
    draft.chunks.push({
      ...row,
    });
  }
  for (const grant of input.grants) {
    if (
      !draft.chunks.some((row) => row.id === grant[0]) ||
      draft.permissions.some((row) => row[0] === grant[0] && row[1] === grant[1])
    )
      return {
        status: 'grant rejected',
        fingerprint,
      };
    draft.permissions.push([...grant]);
  }
  ledger.data = draft;
  ledger.requests.set(key, {
    fingerprint,
    document: input.document,
  });
  return {
    status: 'inserted',
    document: input.document,
    fingerprint,
  };
}
