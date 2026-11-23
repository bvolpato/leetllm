import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, containmentTrace } from '../animations/gpu-failure-operations.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/gpu-failure-operations.lesson.yaml', import.meta.url),
  root,
);
const index = lesson.scenes.findIndex((scene) => scene.id === 'contain'),
  scene = lesson.scenes[index];
const measured = (await loadMeasuredTimeline('gpu-failure-operations')).scenes[0];
const timing = {
  ...measured,
  visualCues: resolveSceneCues(scene, measured),
  cueTiming: 'provider-words',
};
const action = timing.visualCues.find((cue) => cue.id === 'contain-relaunch');
const unsafe = timing.visualCues.find((cue) => cue.id === 'contain-beat-2-focus-1');
const words = measured.sounds[1].words,
  preserve = words.find((word) => word.text === 'Preserve');
const preserveStart = timing.beats[1].start + preserve.start;
const canvas = createCanvas(1920, 1080),
  ctx = canvas.getContext('2d');
function paint(time) {
  const state = frameState(timing, time, index, lesson.scenes.length);
  const trace = containmentTrace(state.beat, state.beatP, state.cues);
  const audit = drawFrame(ctx, lesson, scene, state, draw);
  assert.deepEqual(layoutIssues(audit), [], `native geometry at ${time}s`);
  assert(audit.labels.some((label) => label.text === 'GPU-0 · ' + trace.process));
  for (const id of ['R1', 'R2']) {
    const owner = audit.labels.find((label) => label.text === `${id} · GPU-0/P17`);
    assert(owner);
    assert(
      audit.labels.some(
        (label) =>
          label.group === owner.group && label.text === 'unresolved · reconcile separately',
      ),
    );
  }
  const processCard = audit.targets.find((target) => target.id === 'contain-gpu-0-trace-process');
  assert(processCard && processCard.width > 500 && processCard.height >= 90);
  const pixels = ctx.getImageData(166, 481, 518, 60).data;
  return { trace, audit, processPixels: createHash('sha256').update(pixels).digest('hex') };
}

test('the unsafe process stays alive through measured evidence preservation', () => {
  for (const time of [
    unsafe.start + 0.08,
    (unsafe.start + unsafe.end) / 2,
    unsafe.end,
    preserveStart,
    (preserveStart + action.start) / 2,
    action.start - 0.02,
  ]) {
    const { trace, audit } = paint(time);
    assert.equal(
      trace.process,
      'P17 · unsafe',
      `preserve the old process until termination is narrated at ${time}s`,
    );
    assert.equal(trace.stopped, false);
    assert.equal(trace.relaunched, false);
    assert(!audit.labels.some((label) => label.text.startsWith('Old process ended')));
  }
});

test('native termination, relaunch and held quarantine follow their measured action', () => {
  const before = paint(action.start - 0.02).processPixels;
  for (const time of [
    action.start,
    action.start + 0.08,
    (action.start + action.end) / 2,
    action.end - 0.02,
  ]) {
    const { trace, processPixels } = paint(time);
    assert.equal(trace.process, 'P17 · terminated');
    assert.equal(trace.stopped, true);
    assert.equal(trace.relaunched, false);
    assert.notEqual(processPixels, before, 'the process-state change must actually be painted');
  }
  const terminated = paint(action.end - 0.02).processPixels;
  for (const time of [
    action.end,
    action.end + 2 / 30,
    action.end + action.linger + 0.2,
    timing.beats[1].end,
  ]) {
    const { trace, audit, processPixels } = paint(time);
    assert.equal(trace.process, 'P18 · quarantine');
    assert(trace.stopped && trace.relaunched);
    assert.notEqual(processPixels, terminated, 'the new process identity must actually be painted');
    assert(
      audit.labels.some(
        (label) => label.text === 'New process remains quarantined pending validation',
      ),
    );
    assert.deepEqual(
      trace.existing.map((request) => request.owner),
      ['GPU-0/P17', 'GPU-0/P17'],
    );
  }
});
