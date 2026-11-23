import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSelection } from '../assemble-delivery.mjs';

const collection = {
  version: 1,
  id: 'fixture',
  title: 'Fixture',
  lessons: [
    { id: 'alpha', group: 'Foundations', title: 'Alpha', source: 'foundations/alpha/content.md' },
    { id: 'beta', group: 'Foundations', title: 'Beta', source: 'foundations/beta/content.md' },
  ],
};
const row = (id) => ({ id, sourceDirectory: `build/exports/${id}`, movieSha256: 'a'.repeat(64) });

test('mixed export selections retain canonical order', () => {
  assert.deepEqual(
    orderSelection(collection, { lessons: [row('beta'), row('alpha')] }).map((x) => x.id),
    ['alpha', 'beta'],
  );
});

test('partial, duplicate and unknown selections cannot become complete deliveries', () => {
  assert.throws(
    () => orderSelection(collection, { lessons: [row('alpha')] }),
    /Incomplete delivery selection: beta/,
  );
  assert.throws(
    () => orderSelection(collection, { lessons: [row('alpha'), row('alpha'), row('beta')] }),
    /Duplicate selected lesson: alpha/,
  );
  assert.throws(
    () => orderSelection(collection, { lessons: [row('alpha'), row('beta'), row('gamma')] }),
    /Unknown selected lesson: gamma/,
  );
});

test('selection requires an explicit movie identity and delivery directory', () => {
  assert.throws(
    () =>
      orderSelection(collection, { lessons: [{ ...row('alpha'), movieSha256: '' }, row('beta')] }),
    /exact movieSha256 is required/,
  );
  assert.throws(
    () =>
      orderSelection(collection, {
        lessons: [{ ...row('alpha'), sourceDirectory: '' }, row('beta')],
      }),
    /sourceDirectory is required/,
  );
});
