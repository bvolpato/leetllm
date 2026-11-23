import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  normalizeReleaseVector,
  pythonReleaseDigest,
  releaseFingerprintFixture,
  temporalReleaseJoin,
  RELEASE_RULES,
  ReleaseMetricSample,
  releaseTelemetry,
  combineReleaseActions,
  sustainedReleaseTrace,
  guardedReleaseTransition,
  freshReleaseState,
  draw,
} from '../animations/advanced-mlops-devops-ai.mjs';

const near = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test('release fingerprints use the actual sorted Python separator contract', () => {
  const f = releaseFingerprintFixture();
  assert.equal(f.left.digest.slice(0, 10), '89b2794cde');
  assert.equal(f.right.digest.slice(0, 10), '7c6edf0ae2');
  const exact =
    '{"adapter": "lora@1.9", "base": "base@42", "feature_view": "releases@4", "prompt": "support@2.8", "serving_image": "image@7"}';
  assert.equal(f.left.serialized, exact);
  assert.equal(f.left.digest, createHash('sha256').update(exact).digest('hex'));
  assert.notEqual(
    f.left.digest,
    createHash('sha256').update(JSON.stringify(f.baseline)).digest('hex'),
  );
  assert.equal(
    pythonReleaseDigest(Object.fromEntries(Object.entries(f.baseline).reverse())).digest,
    f.left.digest,
  );
});

test('scaled normalization preserves signed directions at extreme finite magnitudes', () => {
  assert.deepEqual(normalizeReleaseVector([-3, 4]), [-0.6, 0.8]);
  for (const scale of [1e300, 1e-300]) {
    const v = normalizeReleaseVector([3 * scale, 4 * scale]);
    near(v[0], 0.6);
    near(v[1], 0.8);
  }
  for (const bad of [[], [0, 0], [true, 1], [Infinity, 1], [NaN], ['3', 4]])
    assert.throws(() => normalizeReleaseVector(bad));
});

test('the already entity-scoped temporal join checks both inclusive time boundaries', () => {
  const rows = [
    { event: 11, available: 11, value: 2 },
    { event: 12, available: 12, value: 5 },
    { event: 13.5, available: 14 + 1 / 6, value: 9 },
  ];
  assert.equal(temporalReleaseJoin(rows, 14, 2).value, 5);
  assert.equal(temporalReleaseJoin(rows, 14, 1), null);
  assert.equal(temporalReleaseJoin(rows, 14 + 1 / 6, 1).value, 9);
  assert.equal(temporalReleaseJoin([{ event: 14, available: 14, value: 7 }], 14, 0).value, 7);
});

test('telemetry validates domains and identity before threshold and precedence', () => {
  const rule = RELEASE_RULES[0],
    base = new ReleaseMetricSample({
      value: 850,
      release: 'release-a91',
      window: '5m',
      count: 100,
      age: 120,
    });
  assert.equal(releaseTelemetry(rule, { ...base }).valid, false);
  assert.equal(releaseTelemetry(rule, base).action, 'continue');
  assert.equal(
    releaseTelemetry(rule, new ReleaseMetricSample({ ...base, value: 850.001 })).action,
    'rollback',
  );
  for (const patch of [
    { value: false },
    { value: NaN },
    { value: Infinity },
    { count: 99 },
    { count: true },
    { count: 100.5 },
    { age: NaN },
    { age: -1 },
    { age: 121 },
    { window: '15m' },
    { release: 'other' },
  ])
    assert.equal(
      releaseTelemetry(rule, new ReleaseMetricSample({ ...base, ...patch })).valid,
      false,
    );
  const q = RELEASE_RULES[1],
    quality = new ReleaseMetricSample({ ...base, value: 0.82, window: '15m' });
  assert.equal(releaseTelemetry(q, quality).action, 'continue');
  assert.equal(
    releaseTelemetry(q, new ReleaseMetricSample({ ...quality, value: 0.819 })).action,
    'review',
  );
  assert.equal(
    releaseTelemetry(q, new ReleaseMetricSample({ ...quality, value: 1.01 })).valid,
    false,
  );
  assert.equal(combineReleaseActions(['continue', 'review', 'rollback']), 'rollback');
  assert.equal(combineReleaseActions(['continue', 'review']), 'review');
});

test('strict breaches reset at equality and latch without reading subsequent windows', () => {
  assert.deepEqual(
    sustainedReleaseTrace([910, 850, 930, 905, 906, 790, NaN]).map((r) => [r.count, r.latched]),
    [
      [1, false],
      [0, false],
      [1, false],
      [2, false],
      [3, true],
      [3, true],
      [3, true],
    ],
  );
  assert.throws(() => sustainedReleaseTrace([910, NaN]));
});

test('compare-and-swap rejects an old generation and an audit fault preserves both outputs', () => {
  const current = { release: 'C', generation: 3 },
    old = { release: 'C', generation: 1 };
  const stale = guardedReleaseTransition(current, old, 'B');
  assert.equal(stale.committed, false);
  assert.deepEqual(stale.pointer, current);
  assert.equal(stale.audit, null);
  const fault = guardedReleaseTransition(current, current, 'B', true);
  assert.deepEqual(fault.pointer, current);
  assert.equal(fault.audit, null);
  const success = guardedReleaseTransition(current, current, 'B');
  assert.deepEqual(success.pointer, { release: 'B', generation: 4 });
  assert.deepEqual(success.audit, { from: 'C', to: 'B', generation: 4 });
  assert.deepEqual(current, { release: 'C', generation: 3 });
});

const lesson = await readRepositoryLesson('videos/lessons/advanced-mlops-devops-ai.lesson.yaml');
function cuesFor(id, beat = 0, index = -1, progress = 1) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  for (const [b, part] of scene.beats.entries())
    for (const cue of part.visual_cues ?? []) {
      const suffix = new RegExp('^' + id + '-s' + b + '-(\\d+)$').exec(cue.id),
        n = suffix ? Number(suffix[1]) : -1,
        completed = b < beat || (b === beat && n < index),
        active = b === beat && n === index;
      cues[cue.id] = {
        phase: completed ? 'after' : active ? (progress >= 1 ? 'after' : 'during') : 'before',
        progress: completed ? 1 : active ? progress : 0,
      };
    }
  return cues;
}
async function paint(beat, cues, id = 'fresh-request') {
  const { createCanvas } = await import('@napi-rs/canvas'),
    { drawFrame } = await import('../lib/scene.mjs');
  const scene = lesson.scenes.find((s) => s.id === id);
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.5, t: 1, duration: 60, opacity: 1, cues },
    draw,
  );
}

test('the new request withholds normalized scores and HOLD until their complete spoken operations', async () => {
  let cues = cuesFor('fresh-request', 0);
  let s = freshReleaseState({ beat: 0, cues });
  assert.equal(s.reveal, false);
  assert.deepEqual(s.eligible.vector, [-3, 4]);
  let frame = await paint(0, cues);
  assert(!frame.labels.some((l) => /HOLD|score 0/.test(l.text)));
  frame = await paint(1, cuesFor('fresh-request', 1, 1, 1));
  assert(!frame.labels.some((l) => l.text.includes('correction remains unavailable')));
  frame = await paint(1, cuesFor('fresh-request', 1, 2, 1));
  assert(frame.labels.some((l) => l.text.includes('correction remains unavailable')));
  cues = cuesFor('fresh-request', 1, 4, 0.999);
  s = freshReleaseState({ beat: 1, cues });
  assert.equal(s.unit, false);
  cues = cuesFor('fresh-request', 1, 5, 0.999);
  frame = await paint(1, cues);
  assert(!frame.labels.some((l) => l.text.startsWith('offline score')));
  cues = cuesFor('fresh-request', 1, 5, 1);
  frame = await paint(1, cues);
  assert(frame.labels.some((l) => l.text === 'offline score 0.10'));
  assert(!frame.labels.some((l) => l.text.startsWith('online score')));
  cues = cuesFor('fresh-request', 1, 7, 0.999);
  frame = await paint(1, cues);
  assert(!frame.labels.some((l) => l.text.startsWith('HOLD')));
  cues = cuesFor('fresh-request', 1, 7, 1);
  frame = await paint(1, cues);
  assert(frame.labels.some((l) => l.text === 'HOLD · computed parity fails'));
});

test('same-input repair changes the online operands before its success label', async () => {
  const halfway = cuesFor('fresh-request', 2, 0, 0.5),
    s = freshReleaseState({ beat: 2, cues: halfway });
  near(s.onlineScore, 0.3);
  assert.deepEqual(s.eligible.vector, [-3, 4]);
  let frame = await paint(2, cuesFor('fresh-request', 2, 0, 1));
  assert(!frame.labels.some((l) => l.text === 'Fixture parity repaired'));
  assert(!frame.labels.some((l) => l.text === 'HOLD · computed parity fails'));
  assert(frame.labels.some((l) => l.text === 'Replay in progress'));
  frame = await paint(2, cuesFor('fresh-request', 2, 1, 1));
  assert(frame.labels.some((l) => l.text === 'Fixture parity repaired'));
});

test('normal commit and audit-fault rollback wait for their distinct spoken clauses', async () => {
  let f = await paint(1, cuesFor('atomic-publication', 1, 0, 0.5), 'atomic-publication');
  assert(
    !f.labels.some((l) => l.text === 'COMMIT both writes' || l.text === 'ROLL BACK both writes'),
  );
  f = await paint(1, cuesFor('atomic-publication', 1, 1, 1), 'atomic-publication');
  assert(f.labels.some((l) => l.text === 'COMMIT both writes'));
  assert(!f.labels.some((l) => l.text === 'ROLL BACK both writes'));
  f = await paint(1, cuesFor('atomic-publication', 1, 2, 1), 'atomic-publication');
  assert(f.labels.some((l) => l.text === 'ROLL BACK both writes'));
  assert(f.labels.some((l) => l.text === 'R / generation 4'));
});

test('the artifact workflow follows verification then evaluation then approval', async () => {
  const f = await paint(1, cuesFor('gitops-contract', 2), 'gitops-contract'),
    at = (text) => f.labels.find((l) => l.text === text);
  const verified = at('verified digests in manifest'),
    evaluate = at('evaluate this candidate'),
    approve = at('approve these same bytes');
  assert(evaluate.x > approve.x);
  assert(evaluate.y > verified.y);
});
