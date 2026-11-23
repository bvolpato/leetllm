import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function chain(blocks, scope = 'tenant A', revision = 'model 7') {
  let parent = hash([scope, revision]);
  return blocks.map((tokens) => (parent = hash([parent, tokens])));
}
export function reusableTokens(stored, request, blockSize = 4) {
  const a = chain(
    Array.from(
      {
        length: Math.floor(stored.length / blockSize),
      },
      (_, i) => stored.slice(i * blockSize, (i + 1) * blockSize),
    ),
  );
  const b = chain(
    Array.from(
      {
        length: Math.floor(request.length / blockSize),
      },
      (_, i) => request.slice(i * blockSize, (i + 1) * blockSize),
    ),
  );
  let count = 0;
  while (count < Math.min(a.length, b.length) && a[count] === b[count]) count++;
  return count * blockSize;
}
export function commonPrefix(a, b) {
  let count = 0;
  while (count < Math.min(a.length, b.length) && a[count] === b[count]) count++;
  return count;
}
export function fullBlockPrefix(common, blockSize) {
  if (
    !Number.isSafeInteger(common) ||
    common < 0 ||
    !Number.isSafeInteger(blockSize) ||
    blockSize < 1
  )
    throw new RangeError('Invalid prefix or block size');
  return Math.floor(common / blockSize) * blockSize;
}
export function longestLookup(entries, markers, window = 20) {
  return Math.max(
    0,
    ...entries.filter((entry) =>
      markers.some((marker) => entry <= marker && entry > marker - window),
    ),
  );
}
export function priceInput(
  rows,
  rates = {
    read: 0.1,
    write: 1.25,
    ordinary: 1,
  },
) {
  return rows.reduce(
    (sum, row) =>
      sum + row.read * rates.read + row.write * rates.write + row.ordinary * rates.ordinary,
    0,
  );
}
export function ownershipAfter({ total, referenced, cached, free }, allocation) {
  assert.equal(referenced + cached + free, total);
  if (!Number.isSafeInteger(allocation) || allocation < 0 || allocation > cached + free)
    throw new RangeError('Allocation exceeds available blocks');
  const uncachedUsed = Math.min(free, allocation),
    evicted = allocation - uncachedUsed;
  return {
    total,
    referenced: referenced + allocation,
    cached: cached - evicted,
    free: free - uncachedUsed,
    evicted,
    available: cached + free - allocation,
  };
}
export function guideWork(guide, tail, blockSize, firstChanged = guide + 1) {
  const reused = fullBlockPrefix(Math.min(guide, firstChanged - 1), blockSize);
  return {
    guide,
    tail,
    reused,
    fresh: guide + tail - reused,
  };
}
