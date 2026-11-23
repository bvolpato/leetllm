import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw } from '../animations/inference-clocks.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/inference-clocks.lesson.yaml', import.meta.url),
  root,
);
const index = lesson.scenes.findIndex((scene) => scene.id === 'first-clock'),
  scene = lesson.scenes[index];
const measured = (await loadMeasuredTimeline('inference-clocks')).scenes[0];
const timing = {
  ...measured,
  visualCues: resolveSceneCues(scene, measured),
  cueTiming: 'provider-words',
};
const canvas = createCanvas(1920, 1080),
  ctx = canvas.getContext('2d');
function paint(time) {
  const audit = drawFrame(
    ctx,
    lesson,
    scene,
    frameState(timing, time, index, lesson.scenes.length),
    draw,
  );
  assert.deepEqual(layoutIssues(audit), [], `native layout at ${time}s`);
  return audit;
}
const spanRects = (audit) =>
  audit.shapes.filter((shape) => shape.kind === 'rect' && shape.height === 65);

test('the native first-token status agrees with the painted trace through measured completion and hold', () => {
  const construction = timing.visualCues.find((cue) => cue.id === 'construct-first-clock');
  const endpoint = timing.visualCues.find((cue) => cue.id === 'first-token-endpoint');
  const fullWidths = [70, 10, 230, 10].map((ms) => (ms * 1090) / 410);
  for (const time of [
    construction.start - 0.04,
    construction.start + 0.08,
    (construction.start + construction.end) / 2,
    construction.end - 0.04,
    construction.end,
    construction.end + 2 / 30,
    construction.end + construction.linger + 0.2,
    endpoint.start + 0.08,
    endpoint.end + endpoint.linger + 0.2,
    timing.beats[0].end,
  ]) {
    const audit = paint(time),
      spans = spanRects(audit);
    const complete =
      spans.length === 4 && spans.every((span, i) => Math.abs(span.width - fullWidths[i]) < 1e-6);
    const pending = audit.labels.some((label) => label.text.includes('first token pending'));
    assert.equal(pending, !complete, `status must follow actual painted completion at ${time}s`);
    if (time >= construction.end) {
      assert(complete, 'all four dependent spans must reach their full durations');
      assert(
        audit.labels.some((label) => label.text === 'Server first token: 320 ms after arrival'),
      );
      const last = spans.at(-1),
        pixel = ctx.getImageData(Math.floor(last.x + last.width / 2), 727, 1, 1).data;
      assert(
        pixel[1] > pixel[0] && pixel[2] > 100,
        'the final cyan work span must actually be painted',
      );
    } else {
      assert(!complete, 'the construction must remain partial before its measured endpoint');
    }
  }
});

test('queue removal and client boundaries retain a completed first-token result', () => {
  for (const [id, expected] of [
    ['remove-queue', 250],
    ['client-boundaries', 320],
  ]) {
    const cue = timing.visualCues.find((cue) => cue.id === id);
    for (const time of [cue.end, cue.end + cue.linger + 0.2]) {
      const audit = paint(time),
        spans = spanRects(audit);
      assert.equal(spans.length, id === 'remove-queue' ? 3 : 4);
      assert(!audit.labels.some((label) => label.text.includes('first token pending')));
      assert(
        audit.labels.some(
          (label) => label.text === `Server first token: ${expected} ms after arrival`,
        ),
      );
      const total = spans.reduce((sum, span) => sum + (span.width * 410) / 1090, 0);
      assert(Math.abs(total - expected) < 1e-6);
    }
  }
});
