import { publicationInput } from './fixtures.mjs';
import { authorizedMatches, semanticCandidates, sourceCounts } from './model.mjs';
import { createPublicationLedger, publishOnce } from './protocols.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(authorizedMatches(), ['c7a', 'c7b']);
  assert.deepEqual(
    authorizedMatches({
      published: true,
    }),
    ['c7c', 'c7d', 'c7e'],
  );
  assert.deepEqual(
    sourceCounts().map((row) => row.count),
    [2, 1],
  );
  assert.deepEqual(
    sourceCounts(true).map((row) => row.count),
    [3, 1],
  );
  assert.deepEqual(
    semanticCandidates()
      .filter((row) => row.allowed)
      .map((row) => row.chunk),
    ['c7c', 'c7d', 'c7e'],
  );
  const ledger = createPublicationLedger(),
    first = publishOnce(ledger, 'p');
  assert.equal(first.status, 'inserted');
  assert.equal(publishOnce(ledger, 'p').status, 'reused');
  assert.equal(ledger.requests.size, 1);
  const changed = structuredClone(publicationInput);
  changed.chunks[2].text += ' Changed.';
  assert.equal(publishOnce(ledger, 'p', changed).status, 'changed input rejected');
  const broken = structuredClone(publicationInput);
  broken.chunks[0].document = 'missing';
  const empty = createPublicationLedger();
  assert.equal(publishOnce(empty, 'bad', broken).status, 'foreign key or identity rejected');
  assert.equal(empty.requests.size, 0);
  assert.equal(empty.data.documents.find((row) => row.id === 'd7').to, null);
  return true;
}
