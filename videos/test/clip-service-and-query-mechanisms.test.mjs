import test from 'node:test';
import assert from 'node:assert/strict';
import {
  patchAttention,
  workerSchedule,
  IMAGE_REQUEST,
  imageFingerprint,
  ingestImage,
  cachedImageAllowed,
  activateImageGeneration,
} from '../animations/vision-language-clip.mjs';

test('one query change recomputes normalized patch weights and its own value slot', () => {
  const first = patchAttention([Math.sqrt(2), 0]);
  const vent = patchAttention([0, Math.sqrt(2)]);
  const changed = patchAttention([-Math.sqrt(2), 0]);
  assert.deepEqual(first.scores, [1, 0, -1]);
  assert(Math.abs(first.weights.reduce((a, b) => a + b) - 1) < 1e-12);
  assert(Math.abs(first.output[0] - 1.3304819115496436) < 1e-12);
  assert(Math.abs(first.output[1] - 0.4894569421095953) < 1e-12);
  assert(Math.abs(vent.output[0] - 0.4238831152341709) < 1e-12);
  assert(Math.abs(vent.output[1] - 1.1522337695316582) < 1e-12);
  assert(Math.abs(changed.weights[0] - 0.09003057317038046) < 1e-12);
  assert(Math.abs(changed.output[0] - 0.18006114634076092) < 1e-12);
  assert.deepEqual(patchAttention([0, Math.sqrt(2)]), vent);
  assert.throws(() => patchAttention([NaN, 0]));
});

test('admission replays identical arrivals with conserved work and no slot overlap', () => {
  for (const cap of [1, 2]) {
    const jobs = workerSchedule(cap);
    assert.equal(
      jobs.reduce((sum, j) => sum + j.end - j.start, 0),
      2200,
    );
    for (const worker of [0, 1]) {
      const lane = jobs.filter((j) => j.worker === worker).sort((a, b) => a.start - b.start);
      for (let i = 1; i < lane.length; i++) assert(lane[i].start >= lane[i - 1].end);
    }
    const ends = Object.fromEntries(jobs.map((j) => [j.id, j.end]));
    assert.deepEqual([ends.S1, ends.S2], cap === 1 ? [100, 200] : [1100, 1100]);
    assert.equal(Math.max(ends.A1, ends.A2), cap === 1 ? 2000 : 1000);
  }
});

test('scoped replay, metadata conflicts, generation commit and revoked cached access remain distinct', () => {
  const ledger = new Map();
  const actor = { tenant: 'Ops', sites: ['East'] };
  const first = ingestImage(ledger, IMAGE_REQUEST, actor);
  assert.equal(first.status, 'accepted');
  assert.equal(ingestImage(ledger, IMAGE_REQUEST, actor).receipt, first.receipt);
  const changed = {
    ...IMAGE_REQUEST,
    metadata: { ...IMAGE_REQUEST.metadata, description: 'changed metadata' },
  };
  assert.notEqual(imageFingerprint(changed), imageFingerprint(IMAGE_REQUEST));
  assert.equal(ingestImage(ledger, changed, actor).status, 'conflict');
  assert.equal(
    ingestImage(ledger, { ...IMAGE_REQUEST, bytes: [...IMAGE_REQUEST.bytes, 0] }, actor).status,
    'conflict',
  );
  assert.equal(ledger.size, 1);
  assert.equal(
    ingestImage(ledger, IMAGE_REQUEST, { tenant: 'Other', sites: ['East'] }).status,
    'denied',
  );
  assert.equal(cachedImageAllowed(actor, IMAGE_REQUEST), true);
  assert.equal(cachedImageAllowed({ tenant: 'Ops', sites: [] }, IMAGE_REQUEST), false);
  const complete = { preprocess: true, pairedEncoders: true, normalization: true, index: true };
  for (const key of Object.keys(complete))
    assert.equal(activateImageGeneration('G12', 'G13', { ...complete, [key]: false }), 'G12');
  assert.equal(activateImageGeneration('G12', 'G13', complete), 'G13');
});
