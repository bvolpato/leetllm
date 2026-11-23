import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as animation from '../animations/design-multi-tenant-llm-serving-platform.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(
  root + 'videos/lessons/design-multi-tenant-llm-serving-platform.lesson.yaml',
  root,
);
const scene = lesson.scenes.find((s) => s.id === 'recovery');
const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
  phase,
  progress,
  strength: 0,
  reveal: 1,
});
function state(beat, beatP, overrides = {}) {
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      b.visual_cues.map((c) => [c.id, { ...c, ...cue(i < beat ? 'after' : 'before') }]),
    ),
  );
  for (const [id, value] of Object.entries(overrides)) cues[id] = { ...cues[id], ...value };
  return { beat, beatP, t: 0, opacity: 1, cues, cueTiming: 'provider-words' };
}
function paint(s) {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    s,
    animation.draw,
  ).labels.map((l) => l.text);
}

test('the unknown old attempt and fenced retry share the held reservation with focus disabled', () => {
  const s = state(0, 0.99, {
    'recovery-old-attempt': cue('after'),
    'recovery-retry-fence': cue('after'),
    'recovery-beat-1-focus-1': cue('during', 0.5),
  });
  const labels = paint(s);
  assert(labels.some((t) => t.includes('A-1') && t.includes('reservation')));
  assert(labels.some((t) => t.includes('attempt-1') && t.includes('UNKNOWN')));
  assert(labels.some((t) => t.includes('attempt-2') && t.includes('BLOCKED')));
  assert(labels.some((t) => t === 'Available 300 + held 700 + settled 0 = 1,000'));
});

test('the completion boundary precedes release and the actual settled result holds afterward', () => {
  const boundary = state(1, 0.99, {
    'recovery-quiescence': cue('after'),
    'recovery-release-unused': cue('before'),
  });
  const before = paint(boundary);
  assert(before.some((t) => t.includes('attempt-1') && t.includes('RETIRED')));
  assert(before.some((t) => t.includes('Trusted usage 300 + 120')));
  assert(before.some((t) => t === 'Available 300 + held 700 + settled 0 = 1,000'));
  const mid = animation.sampleModel(
    'recovery',
    state(1, 0.01, {
      'recovery-quiescence': cue('after'),
      'recovery-release-unused': cue('during', 0.5),
    }),
  );
  assert(mid.held > 0 && mid.held < 700 && mid.settled > 0 && mid.settled < 420);
  assert.equal(mid.available + mid.held + mid.settled, 1000);
  for (const beatP of [0.01, 0.5, 0.99]) {
    const labels = paint(
      state(1, beatP, {
        'recovery-quiescence': cue('after'),
        'recovery-release-unused': cue('after'),
      }),
    );
    assert(labels.some((t) => t === 'Available 580 + held 0 + settled 420 = 1,000'));
    assert(labels.some((t) => t.includes('unused 280 released')));
  }
});

test('settlement requires matching authoritative attempt evidence and quiescence', () => {
  assert.equal(typeof animation.reconcileRecovery, 'function');
  const initial = { balance: animation.quota(1), receipt: null };
  const evidence = animation.recoveryCompletionEvidence();
  assert.equal(
    animation.recoveryRetryDecision({ ...evidence, quiescent: false }, evidence).allowed,
    false,
  );
  assert.equal(animation.recoveryRetryDecision(evidence, evidence).allowed, true);
  assert.equal(
    animation.recoveryRetryDecision(evidence, { ...evidence, request: 'A-2' }).allowed,
    false,
  );
  for (const change of [
    { quiescent: false },
    { trustedUsage: false },
    { attempt: 'attempt-2' },
    { request: 'A-2' },
    { fingerprint: 'changed' },
    { reservation: 'other' },
  ]) {
    const rejected = animation.reconcileRecovery(initial, { ...evidence, ...change });
    assert.equal(rejected.accepted, false);
    assert.deepEqual(rejected.ledger, initial);
    assert.equal(rejected.retryDispatched, false);
  }
  const complete = animation.reconcileRecovery(initial, evidence);
  assert(complete.accepted);
  assert.deepEqual(complete.ledger.balance, { available: 580, held: 0, settled: 420 });
  const duplicate = animation.reconcileRecovery(complete.ledger, evidence);
  assert(duplicate.ledger.duplicate);
  assert.deepEqual(duplicate.ledger.balance, complete.ledger.balance);
  assert.deepEqual(initial.balance, animation.quota(1));
  animation.validateModel();
});
