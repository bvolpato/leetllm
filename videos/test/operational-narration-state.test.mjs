import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { guardedDispatch } from '../animations/observability-monitoring-llm-systems.mjs';
import { enqueue } from '../animations/design-conversational-ai-support-bot.mjs';
import { replanSnapshot } from '../animations/agent-architectures.mjs';
import { sampleModel as sglangModel } from '../animations/deep-dive-sglang.mjs';
import { draw as drawRunOperations } from '../animations/training-run-operations.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

test('a changed marker cannot bypass spending or elapsed-time gates', () => {
  const observations = [
    ['lookup', '42', '17'],
    ['lookup', '42', '18'],
  ];
  let calls = 0;
  assert.equal(
    guardedDispatch(observations, 3, 5, () => ++calls, { spent: 0.008, next: 0.003, limit: 0.01 })
      .reason,
    'spending budget',
  );
  assert.equal(
    guardedDispatch(observations, 5, 5, () => ++calls, { spent: 0, next: 0, limit: 0.01 }).reason,
    'deadline',
  );
  assert.equal(calls, 0);
  assert(
    guardedDispatch(observations, 3, 5, () => ++calls, { spent: 0.006, next: 0.003, limit: 0.01 })
      .executed,
  );
  assert.equal(calls, 1);
});

test('a different ticket key cannot duplicate an invoice item credit', () => {
  const store = [],
    value = { invoice: 'A10234', item: 'gpu-usage', amount: 3500 };
  assert.equal(enqueue(store, 'credit:48291', value).status, 'INSERTED');
  assert.equal(enqueue(store, 'credit:49302', value).status, 'DUPLICATE INVOICE');
  assert.equal(store.length, 1);
  assert.equal(store[0].key, 'credit:48291');
});

test('replacement travel is requested during its phrase and attached only when completed', () => {
  const pending = replanSnapshot(1, 0.3, { 'replan-b2-1': { phase: 'during', progress: 0.5 } });
  assert(pending.travelPending);
  assert(!pending.journeyValid);
  assert.equal(pending.journey, 'Art');
  const complete = replanSnapshot(1, 0.3, { 'replan-b2-1': { phase: 'after', progress: 1 } });
  assert(!complete.travelPending);
  assert(complete.journeyValid);
  assert.equal(complete.journey, 'History');
});

test('overlap narration prepares B during GPU A and retains the completed comparison', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 };
  const cues = {
    'overlap-beat-2-focus-2': { phase: 'during', progress: 0.5 },
    'overlap-b-ready': before,
    'overlap-beat-2-focus-1': before,
  };
  const prepare = sglangModel('overlap', { beat: 1, beatP: 0, cues });
  assert.equal(prepare.time, 1.5);
  const gpuA = prepare.intervals.find((v) => v.id === 'gpuA'),
    planB = prepare.intervals.find((v) => v.id === 'planB');
  assert(gpuA.start < prepare.time && prepare.time < gpuA.end);
  assert(planB.start < prepare.time && prepare.time < planB.end);
  const ready = sglangModel('overlap', {
    beat: 1,
    beatP: 0,
    cues: { ...cues, 'overlap-beat-2-focus-2': after, 'overlap-b-ready': after },
  });
  assert.equal(ready.time, 5);
  assert(planB.end <= ready.intervals.find((v) => v.id === 'gpuB').start);
  const completed = sglangModel('overlap', {
    beat: 1,
    beatP: 0,
    cues: {
      ...cues,
      'overlap-beat-2-focus-2': after,
      'overlap-b-ready': after,
      'overlap-beat-2-focus-1': after,
    },
  });
  assert.equal(completed.time, 9);
  for (const beatP of [0, 0.02, 0.5, 1])
    assert.equal(sglangModel('overlap', { beat: 2, beatP, cues: {} }).time, 9);
  assert.equal(
    sglangModel('overlap', { beat: 0, beatP: 0.95, cues: { 'overlap-beat-1-focus-2': after } })
      .time,
    10,
  );
});

test('restart clauses paint the named weights-only or full packet with matching retained fields', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/training-run-operations.lesson.yaml', import.meta.url),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'intro'),
    scene = lesson.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('training-run-operations')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const names = ['Weights', 'Adam moments', 'Scheduler phase', 'Consumed cursor'];
  for (const [time, full] of [
    [10.6, false],
    [25.2, false],
    [25.8, true],
    [27.3, false],
    [29.3, true],
    [32.266666666666666, true],
    [34.833333333333336, true],
    [41.5, true],
  ]) {
    const audit = drawFrame(
      ctx,
      lesson,
      scene,
      frameState(timing, time, sceneIndex, lesson.scenes.length),
      drawRunOperations,
    );
    const missing = audit.labels.filter((label) => label.text === 'RESET / MISSING');
    assert.equal(
      missing.length,
      full ? 0 : 3,
      `actual restart statuses at ${measured.start + time}s must match the narrated packet`,
    );
    assert(
      audit.labels.some(
        (label) =>
          label.text === (full ? 'Full continuation' : 'Weights-only initialization') &&
          label.alpha > 0.5,
      ),
    );
    for (let i = 0; i < names.length; i++) {
      const x = 180 + (i % 2) * 850,
        y = 395 + Math.floor(i / 2) * 230;
      assert(
        audit.labels.some((label) => label.text === names[i] && label.x >= x && label.x < x + 720),
      );
      const status = audit.labels.find(
        (label) => label.y >= y + 130 && label.y < y + 180 && label.x >= x && label.x < x + 720,
      );
      assert.equal(
        status?.text,
        full || i === 0 ? 'RESTORED' : 'RESET / MISSING',
        `${names[i]} retains its identity`,
      );
      assert(status.alpha > 0.5, 'a matched field status must actually be painted');
    }
    assert.deepEqual(layoutIssues(audit), [], `restart geometry at ${time}s`);
  }
  for (const time of [32.266666666666666, 34.833333333333336, 41.5]) {
    const state = frameState({ ...timing, visualCues: [] }, time, sceneIndex, lesson.scenes.length);
    for (const cues of [{}, { 'intro-b2-1': { phase: 'after', progress: 1 } }]) {
      const audit = drawFrame(ctx, lesson, scene, { ...state, cues }, drawRunOperations);
      assert(
        audit.labels.some((label) => label.text === 'Full continuation'),
        'unrelated or empty cue maps retain the full-packet preview fallback',
      );
      assert.equal(audit.labels.filter((label) => label.text === 'RESTORED').length, 4);
      assert.deepEqual(layoutIssues(audit), []);
    }
    const cueDirected = drawFrame(
      ctx,
      lesson,
      scene,
      {
        ...state,
        cues: {
          'intro-full-packet': { phase: 'before', progress: 0 },
        },
      },
      drawRunOperations,
    );
    assert(
      cueDirected.labels.some((label) => label.text === 'Weights-only initialization'),
      'named provider cues take priority over the fallback clock',
    );
    assert.equal(cueDirected.labels.filter((label) => label.text === 'RESET / MISSING').length, 3);
  }
});
