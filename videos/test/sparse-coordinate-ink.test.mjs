import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, validateModel } from '../animations/sparse-autoencoders.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { createTextInkAudit } from '../lib/text-ink-audit.mjs';

test('the changing raw-coordinate readout paints visible centered glyphs in both scenes', async () => {
  validateModel();
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/sparse-autoencoders.lesson.yaml', root);
  const canvas = createCanvas(1920, 1080),
    ink = createTextInkAudit(canvas.getContext('2d'));
  for (const id of ['intro', 'dictionary']) {
    const scene = lesson.scenes.find((scene) => scene.id === id),
      timing = makeSceneTimeline(
        scene,
        scene.beats.map(() => 10),
      );
    for (const time of [2, (timing.beats[1].start + timing.beats[1].end) / 2]) {
      ink.beginFrame({ scene: id, time });
      drawFrame(
        ink.ctx,
        lesson,
        scene,
        frameState(timing, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
        draw,
      );
      const label = ink
        .finishFrame()
        .labels.find((label) => label.text.startsWith('raw coordinate 1 ='));
      assert.equal(
        label.status,
        'visible',
        `${id} raw-coordinate readout must paint discernible ink`,
      );
      assert.equal(label.textAlign, 'center');
      assert(label.bounds.x + label.bounds.width < 1820);
    }
  }
});
