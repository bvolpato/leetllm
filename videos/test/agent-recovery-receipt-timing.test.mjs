import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as animation from '../animations/agent-recovery.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../../', import.meta.url).pathname;
const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
  phase,
  progress,
  strength: 0,
  active: phase === 'during',
  reveal: progress,
});
async function paint(sceneId, beat, beatP, overrides, time = 0) {
  registerLessonFonts();
  const lesson = await readLesson(root + 'videos/lessons/agent-recovery.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === sceneId);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, index) =>
      (b.visual_cues ?? []).map((c) => [c.id, { ...c, ...cue(index < beat ? 'after' : 'before') }]),
    ),
  );
  for (const [id, value] of Object.entries(overrides)) Object.assign(cues[id], value);
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { beat, beatP, t: time, opacity: 1, cues, cueTiming: 'provider-words' },
    animation.draw,
  );
}

test('the healthy receipt closes the breaker and releases its probe during the spoken clause', async () => {
  const before = await paint('circuit-breaker', 1, 0.4, { 'half-open-probe': cue('after') });
  assert(before.labels.some((label) => label.text.includes('slot occupied')));
  const closed = await paint('circuit-breaker', 1, 0.4, {
    'half-open-probe': cue('after'),
    'healthy-probe': cue('during', 0.5),
  });
  assert(
    closed.labels.some((label) => label.text === 'State: CLOSED · generation 3'),
    'The actual state must close during the healthy-response cue, regardless of beat progress.',
  );
  assert(
    closed.labels.some(
      (label) =>
        label.text.includes('healthy receipt accepted') && label.text.includes('slot released'),
    ),
  );
  const race = animation.breakerRace();
  assert.equal(race.stateAfterOldSuccess, 'open');
  assert.equal(race.currentGeneration, 4);
  assert.equal(race.oldResultReturned, true);
});

test('the report paints the observed job, state and time during queued-when-checked and holds them', async () => {
  const progress = {
    'reconcile-controller': cue('after'),
    'current-status': cue('after'),
    'bounded-claim': cue('during', 0.5),
  };
  const report = await paint('resume-with-evidence', 1, 0.01, progress);
  assert(report.labels.some((label) => label.text.includes('job-1 was queued when checked')));
  assert(
    report.labels.some(
      (label) => label.text.includes('10s ago') && label.text.includes('observed at 990'),
    ),
  );
  const held = await paint('resume-with-evidence', 2, 0.01, {});
  assert(held.labels.some((label) => label.text.includes('job-1 was queued when checked')));
  assert(
    held.labels.some((label) => label.text.includes('Deployment completion remains unobserved')),
  );
});

test('a bounded claim requires the matching controller identity and a fresh observation', () => {
  const observation = animation.recoveryObservation();
  const claim = animation.boundedRecoveryClaim(observation);
  assert.equal(claim.jobId, animation.commitScenario('after-commit').job.id);
  assert.equal(claim.operationKey, animation.commitScenario('after-commit').ledger);
  assert.equal(claim.state, 'queued');
  assert.equal(claim.age, 10);
  for (const change of [
    { jobId: 'job-2' },
    { operationKey: 'other-operation' },
    { runId: 'RUN-843' },
    { source: 'model' },
    { observedAt: 100 },
    { observedAt: 1001 },
  ])
    assert.equal(animation.boundedRecoveryClaim({ ...observation, ...change }), null);
  const pending = animation.recoveryDisplay(1, 0.99, {
    'current-status': cue('before'),
    'bounded-claim': cue('before'),
  });
  assert.equal(pending.observation, null);
  assert.equal(pending.claim, null);
  const observed = animation.recoveryDisplay(1, 0.01, {
    'current-status': cue('during', 0.5),
    'bounded-claim': cue('before'),
  });
  assert.equal(observed.observation.jobId, 'job-1');
  assert.equal(observed.claim, null);
});

test('a changed-payload conflict waits for the completed changed-target clause and conserves the original job', async () => {
  const before = await paint('operation-identity', 2, 0.99, {
    'same-key-replay': cue('after'),
    'changed-target': cue('before'),
  });
  assert(
    !before.labels.some((label) => /conflict/i.test(label.text)),
    'The replay premise must not disclose the changed-target verdict.',
  );
  const after = await paint('operation-identity', 2, 0.01, {
    'same-key-replay': cue('after'),
    'changed-target': cue('after'),
  });
  assert(after.labels.some((label) => /conflict/i.test(label.text)));
  assert(after.labels.some((label) => label.text === 'Retained: RUN-842 · rev 17'));
  assert(after.labels.some((label) => label.text === 'Proposed: RUN-842 · rev 18'));
  assert(after.labels.some((label) => label.text === 'Jobs: 1'));
});

test('the retry floor constructs planned waits before the combined deadline exposes rejection', async () => {
  const before = await paint('retry-clock', 1, 0.99, {
    'retry-after-floor': cue('after'),
    'combined-deadline': cue('before'),
  });
  assert(
    !before.labels.some((label) => /BLOCKED/.test(label.text)),
    'A supplied wait is an operand before the deadline comparison completes.',
  );
  const after = await paint('retry-clock', 1, 0.01, {
    'retry-after-floor': cue('after'),
    'combined-deadline': cue('after'),
  });
  assert(after.labels.some((label) => /BLOCKED/.test(label.text)));
  assert(after.labels.some((label) => label.text === '3.1 s · total 7.8'));
});

test('the fresh deadline worksheet keeps premise bars separate until the spoken comparison completes', async () => {
  const bars = (audit) =>
    audit.shapes.filter((shape) => shape.kind === 'rect' && shape.height === 85);
  for (const [phase, progress, time] of [
    ['before', 0, 9],
    ['during', 0.99, 9.99],
  ]) {
    const audit = await paint(
      'recovery-transfer',
      1,
      0.99,
      {
        'transfer-wait': cue('after'),
        'transfer-stop': { ...cue(phase, progress), end: 10 },
      },
      time,
    );
    const [minimum, jitter] = bars(audit);
    assert.equal(minimum.width, 960);
    assert.equal(jitter.width, 240);
    assert.notEqual(
      minimum.y,
      jitter.y,
      'The geometric sum must remain concealed along with the verdict.',
    );
    assert(!audit.labels.some((label) => label.text.includes('wait 1.5s')));
  }
  const audit = await paint(
    'recovery-transfer',
    1,
    0.99,
    {
      'transfer-wait': cue('after'),
      'transfer-stop': { ...cue('after'), end: 10 },
    },
    10.5,
  );
  const [minimum, jitter] = bars(audit);
  assert.equal(jitter.y, minimum.y);
  assert.equal(jitter.x, minimum.x + minimum.width);
  assert(
    jitter.x + jitter.width > 1420,
    'The completed sum must visibly exceed the actual deadline.',
  );
  assert(audit.labels.some((label) => label.text === 'wait 1.5s > 1.4s → stop'));
});
