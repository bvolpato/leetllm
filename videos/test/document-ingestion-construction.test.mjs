import test from 'node:test';
import assert from 'node:assert/strict';
import {
  versionDiff,
  lateInteraction,
  freshIngestion,
  sourceGate,
} from '../animations/document-ingestion.mjs';

test('a shared source can change text and access while another source stays unchanged', () => {
  const before = [
    { id: 'a', text: 'old', access: ['ops', 'security'] },
    { id: 'b', text: 'same', access: ['ops'] },
    { id: 'c', text: 'gone', access: ['ops'] },
  ];
  const after = [
    { id: 'a', text: 'new', access: ['commanders'] },
    { id: 'b', text: 'same', access: ['ops'] },
    { id: 'd', text: 'added', access: ['ops'] },
  ];
  assert.deepEqual(versionDiff(before, after), {
    added: ['d'],
    removed: ['c'],
    changed: ['a'],
    access: ['a'],
  });
});

test('reviewed quality and unchanged text do not grant a revoked reader access', () => {
  assert.equal(freshIngestion(0).indexable, false);
  assert.equal(freshIngestion(1).readable, true);
  const revoked = freshIngestion(2);
  assert.equal(revoked.quality, 'ready');
  assert.equal(revoked.indexable, true);
  assert.equal(revoked.readable, false);
  assert.equal(revoked.record.text, freshIngestion(1).record.text);
  assert.equal(
    sourceGate(
      { ...revoked.record, text: revoked.record.text.replace('25', '250') },
      'incident-commanders',
    ).indexable,
    false,
  );
});

test('late interaction can select different patches for different query vectors', () => {
  assert.equal(
    lateInteraction([
      [0.7, 0.5, 0.2],
      [0.1, 0.6, 0.3],
    ]),
    1.2999999999999998,
  );
  assert.equal(
    lateInteraction([
      [0.2, 0.91, 0.05],
      [0.1, 0.88, 0.12],
    ]),
    1.79,
  );
});
