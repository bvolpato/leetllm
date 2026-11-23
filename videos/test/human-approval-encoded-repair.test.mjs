import test from 'node:test';
import assert from 'node:assert/strict';
import { digest, FRESH_PROPOSAL } from '../animations/human-approval.mjs';
import { measuredScene, revealedAt } from './helpers/human-approval-frames.mjs';

test('durable record fields are pending until their commit', () => {
  const m = measuredScene('durable-pending'),
    before = m.labels(7.5);
  assert(!before.includes('Stored:'), 'writing fields claim committed storage');
  assert(before.includes('Pending fields:'));
  assert(m.labels(m.timing.beats[1].start + 0.1).includes('Stored:'));
});
for (const [phrase, result] of [
  ['one authorizes, one is blocked, and one outbox row commits', 'AUTHORIZED'],
  ['rolls back to pending with zero messages', 'PENDING restored'],
])
  test('transaction result waits: ' + result, () => {
    const p = measuredScene('decision-outbox').boundary(phrase, 1);
    assert(!p.before.includes(result), 'settled result before completed clause');
    assert(p.after.includes(result));
  });
test('the stale proposal repair constructs a new identity without granting a write', () => {
  const m = measuredScene('stale-version'),
    time = m.timing.beats[2].start + 10,
    labels = m.labels(time);
  assert(labels.includes('op-18'), 'new packet identity never constructed');
  assert(labels.includes('run-2026-105'));
  assert(labels.includes('eval-882'));
  assert(labels.includes(digest(FRESH_PROPOSAL).slice(0, 12)));
  assert(labels.includes('Review requested'));
  assert(labels.includes('decision pending'));
  assert(labels.includes('Old op-17 remains rejected'));
  assert(!labels.includes('Stored approval review-18'));
  assert(!labels.includes('Write applied'));
});
test('the repaired packet stays under construction before its rebuild clause completes', () => {
  const m = measuredScene('stale-version'),
    labels = m.labels(m.timing.beats[2].start + 0.1);
  assert(!labels.includes('Prepared revision-4 proposal'));
  assert(!labels.includes(digest(FRESH_PROPOSAL).slice(0, 12)));
  assert(!labels.includes('Review requested'));
});
for (const [beat, phrase, result] of [
  [0, 'The target applies the traffic change', 'Target committed'],
  [0, 'but the response disappears on the network', 'Reply lost'],
  [1, 'A timeout leaves the execution state unknown', 'Timeout · unknown'],
  [1, 'record its receipt', 'Executed · revision 5'],
])
  test('remote consequence waits: ' + result, () => {
    const p = measuredScene('execute-and-reconcile').boundary(phrase, beat);
    assert(!p.before.includes(result), 'remote consequence before completed clause');
    assert(p.after.includes(result));
  });
test('the new-case answer follows an inspectable prediction interval', () => {
  const { scene: s, timing: t } = measuredScene('fresh-packet');
  const q = s.beats.findIndex((b) =>
    b.say.includes('Predict whether that matching digest permits the write.'),
  );
  const a = s.beats.findIndex((b) => b.say.includes('It does not:'));
  assert(q >= 0 && a > q, 'the prediction must precede its answer');
  const interval = q === a ? 0 : t.beats[a].start - t.beats[q].end;
  assert(interval >= 1.5, `prediction interval ${interval}s`);
});
test('the stale revision rejection waits for the completed guarded-write result', () => {
  const p = measuredScene('stale-version').boundary(
    'A mismatch marks the old approval stale and stops the write',
    1,
  );
  assert(!p.before.includes('3 ≠ 4 → rejected'), 'stale consequence before completed clause');
  assert(p.after.includes('3 ≠ 4 → rejected · effects 0'));
});
test('the separate fresh reply remains in transit until its completed loss clause', () => {
  const p = measuredScene('fresh-packet').boundary('the network reply is lost', 2);
  assert(!p.before.includes('local UNKNOWN'), 'fresh loss before completed clause');
  assert(p.before.includes('response in transit'));
  assert(p.after.includes('reply lost · local UNKNOWN'));
});

test('the three policy tiers appear as the first paragraph explains their separate effects', () => {
  const s = measuredScene('choose-review');
  revealedAt(s, 'read this service’s evaluation metrics', /^Automatic read$/m);
  revealedAt(s, 'needs human review', /^Human review$/m);
  revealedAt(s, 'needs stronger review', /^Stronger review tier$/m);
  const settled = s.labels(s.timing.beats[0].end, 0.8).split('\n');
  for (const tier of ['Automatic read', 'Human review', 'Stronger review tier'])
    assert(settled.includes(tier));
  revealedAt(s, 'needs senior review', /^Senior review$/m);
});

test('the stored pending operation survives a restart and retains its original identity', () => {
  const s = measuredScene('durable-pending');
  const committed = revealedAt(s, 'commits the pending record', /Durable pending · committed/);
  assert.match(committed.before, /Pending fields:/);
  assert.doesNotMatch(committed.before, /Stored:/);
  assert.match(committed.after, /Stored:/);
  const recovered = s.boundary('reads that same row and recovers the original action');
  const firstRecoveredFrame = Math.ceil(recovered.end * 30) / 30;
  assert.match(
    s.labels(firstRecoveredFrame),
    /Recovered pending op-17 · revision 3 · pending · effects 0/,
  );
  assert.match(recovered.before, /Read pending record/);
  assert.doesNotMatch(recovered.before, /Recovered pending op-17/);
  const settled = s.labels(s.timing.beats[1].until - 1 / 30, 0.8).split('\n');
  for (const label of [
    'Original worker offline',
    'New worker',
    'Durable pending · committed',
    'Recovered pending op-17 · revision 3 · pending · effects 0',
  ]) {
    assert(settled.includes(label));
  }
});

test('the protected decision follows the packet digest, the reviewer click and the eligibility check', () => {
  const s = measuredScene('bind-decision');
  const hashed = revealedAt(s, 'hashes those bytes', /Digest [0-9a-f]{12}/);
  assert.match(hashed.after, /Stable proposal packet · op-17/);
  assert.doesNotMatch(hashed.after, /Casey · approve/);
  const clicked = revealedAt(s, 'Casey signs in and clicks Approve', /^Casey · approve$/m);
  assert.match(clicked.after, /Pending save/);
  const eligible = revealedAt(s, 'Once she qualifies', /Eligible reviewer · saving/);
  assert.doesNotMatch(eligible.after, /Casey · approve · saved/);
  const saved = revealedAt(s, 'saves her approval and the full digest', /Casey · approve · saved/);
  assert.match(saved.after, /Eligible reviewer · immutable decision stored/);
  revealedAt(s, 'gives a different digest', /The full digests differ/);
});
