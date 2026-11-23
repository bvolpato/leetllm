import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, sampleModel, networkTrace } from '../animations/design-agent-sandbox-platform.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/design-agent-sandbox-platform.lesson.yaml', import.meta.url),
  root,
);
const index = lesson.scenes.findIndex((scene) => scene.id === 'network'),
  scene = lesson.scenes[index];
const measured = (await loadMeasuredTimeline('design-agent-sandbox-platform')).scenes[0];
const timing = {
  ...measured,
  visualCues: resolveSceneCues(scene, measured),
  cueTiming: 'provider-words',
};
const canvas = createCanvas(1920, 1080),
  ctx = canvas.getContext('2d');
function paint(time) {
  const state = frameState(timing, time, index, lesson.scenes.length);
  const model = sampleModel('network', state),
    trace = networkTrace(model.step, state.beatP);
  const audit = drawFrame(ctx, lesson, scene, state, draw);
  assert.deepEqual(layoutIssues(audit), [], `native geometry at ${time}s`);
  return { trace, audit };
}

test('the authenticated J4/R2 operation and audit survive the measured final hold and fade', () => {
  const final = timing.beats.at(-1),
    labels = [];
  for (const time of [
    final.end,
    final.until - 0.04,
    final.until,
    final.until + 1 / 30,
    timing.duration - 2 / 30,
    timing.duration - 1 / 30,
  ]) {
    const { trace, audit } = paint(time);
    assert(
      Number.isFinite(trace.seconds),
      `the terminal trace must retain a finite elapsed time at ${time}s`,
    );
    assert.equal(trace.request, 'J4/R2');
    assert(trace.opaque && trace.scoped && trace.injected && trace.connected && trace.audited);
    const texts = audit.labels.map((label) => label.text);
    for (const expected of [
      'Opaque reference cap-J4',
      'cap-J4 scope verified',
      'Proxy injects scoped credential',
      'Authenticated operation runs outside the guest',
      'Restricted audit: J4/R2 recorded',
    ])
      assert(texts.includes(expected));
    assert(!texts.includes('Credential injection pending'));
    assert(
      audit.connectors.length >= 4,
      'the actual broker, scope and proxy transfers must stay painted',
    );
    const pixel = ctx.getImageData(1290, 965, 1, 1).data;
    assert(pixel[1] > pixel[0], 'the recorded-audit green outline must stay visible through fade');
    labels.push(texts);
  }
  for (const texts of labels.slice(1))
    assert.deepEqual(texts, labels[0], 'the held operation must not reset');
});

test('address rejection and credential scope remain separate progressive operations', () => {
  const publicAttempt = paint(timing.beats[0].start + 20);
  assert(
    publicAttempt.trace.connected && !publicAttempt.trace.rebound && !publicAttempt.trace.injected,
  );
  const rebound = paint(timing.beats[0].until - 0.2);
  assert(rebound.trace.rebound && !rebound.trace.connected && !rebound.trace.injected);
  assert.equal(rebound.trace.request, 'J4/R1');
  assert(
    rebound.audit.labels.some((label) => label.text === 'Prior public connection stays pinned'),
  );
  for (const [seconds, scoped, injected, audited] of [
    [12.4, false, false, false],
    [15.1, true, false, false],
    [16.1, true, true, false],
    [22.1, true, true, true],
  ]) {
    const { trace, audit } = paint(timing.beats[1].start + seconds);
    assert.equal(trace.request, 'J4/R2');
    assert.equal(trace.scoped, scoped);
    assert.equal(trace.injected, injected);
    assert.equal(trace.audited, audited);
    assert.equal(
      audit.labels.some((label) => label.text === 'Proxy injects scoped credential'),
      injected,
    );
    assert.equal(
      audit.labels.some((label) => label.text === 'Restricted audit: J4/R2 recorded'),
      audited,
    );
  }
});
