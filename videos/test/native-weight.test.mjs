import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { lessonFont, registerLessonFonts } from '../lib/fonts.mjs';

registerLessonFonts();

for (const weight of [525, 530, 550, 650]) {
  test(`Canvas keeps the requested pixel size at weight ${weight}`, () => {
    const ctx = createCanvas(180, 48).getContext('2d');
    const measure = (fontWeight, size) => {
      ctx.font = lessonFont(size, 'sans', fontWeight);
      return ctx.measureText('Hello');
    };
    const reference = measure(500, 24);
    const small = measure(weight, 12);
    const full = measure(weight, 24);
    assert.ok(
      full.width > reference.width * 0.7 && full.width < reference.width * 1.4,
      `width ${full.width}, reference ${reference.width}`,
    );
    assert.ok(
      full.actualBoundingBoxAscent > 8 && full.actualBoundingBoxAscent < 25,
      `24px ascent ${full.actualBoundingBoxAscent}`,
    );
    assert.ok(
      full.width > small.width * 1.8 && full.width < small.width * 2.2,
      `12px width ${small.width}, 24px width ${full.width}`,
    );

    ctx.fillText('Hello', 12, 32);
    const pixels = ctx.getImageData(0, 0, 180, 48).data;
    let top = 48,
      right = -1;
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 180; x++) {
        if (pixels[(y * 180 + x) * 4 + 3]) {
          top = Math.min(top, y);
          right = Math.max(right, x);
        }
      }
    }
    assert.ok(
      top >= 7 && top < 25 && right > 40 && right < 100,
      `painted bounds top ${top}, right ${right}`,
    );
  });
}
