import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { draw } from '../animations/scaling-laws.mjs';

test('the training compute estimate accounts for three visibly painted matrix multiplications', () => {
  registerLessonFonts();
  const canvas = createCanvas(1920, 1080);
  for (const [beat, beatP] of [
    [0, 0.99],
    [1, 0.4],
    [1, 0.9],
    [2, 0.15],
  ]) {
    const audit = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'budget', title: 'Count the work before choosing the shape' },
      { beat, beatP, t: 0, opacity: 1 },
      draw,
    );
    for (const text of ['Forward', 'Input gradient', 'Weight gradient']) {
      assert(
        audit.labels.some((label) => label.text === text && label.alpha >= 0.98),
        `${text} must be painted in accounting beat ${beat}`,
      );
    }
    assert.equal(
      audit.labels.filter((label) => label.text === '2N' && label.alpha >= 0.98).length,
      3,
      `All three accounted costs must be visible in beat ${beat}`,
    );
    for (const y of [320, 450, 580]) {
      assert(
        audit.shapes.some(
          (shape) =>
            shape.x === 650 &&
            shape.y === y &&
            shape.width === 700 &&
            shape.height === 64 &&
            shape.fillAlpha >= 0.98,
        ),
        `The counted strip at y=${y} must be painted`,
      );
    }
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  }
});
