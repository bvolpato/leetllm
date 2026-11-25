import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw as synthetic } from '../animations/synthetic-data.mjs';
registerLessonFonts();

function foreground(draw, id, cue) {
  const canvas = createCanvas(1920, 1080);
  const context = canvas.getContext('2d');
  drawFrame(
    context,
    {},
    { id, title: 'Continue the established experiment' },
    {
      beat: 2,
      beatP: 0,
      t: 55,
      duration: 90,
      opacity: 1,
      cues: { [cue]: { phase: 'before', progress: 0 } },
    },
    draw,
  );
  const { data } = context.getImageData(100, 200, 1720, 785);
  let visible = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] >= 48) visible++;
  }
  return visible / (1720 * 785);
}

for (const [draw, id, cue] of [
  [synthetic, 'downstream-trial', 'suite-slices'],
]) {
  test(`${id} retains visual premises before the next spoken construction`, () => {
    assert(
      foreground(draw, id, cue) > 0.001,
      'The teaching body became blank before its next cue.',
    );
  });
}
