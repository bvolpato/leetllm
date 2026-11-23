import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  PREDICTIONS,
  ACTUALS,
  RESIDUALS,
  calibrationScoresState,
} from '../animations/conformal.mjs';
import { drawFrame } from '../lib/scene.mjs';
registerLessonFonts();
const paint = (beat, p) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'scores', title: 'One residual per request' },
    { t: 10, duration: 20, opacity: 1, beat, beatP: p },
    draw,
  );
test('paired observations preserve their identities and absolute ms errors in the painted ledger', () => {
  const frame = paint(1, 0.5);
  for (let i = 0; i < 9; i++) {
    const y = 350 + i * 69;
    for (const [value, x, yy] of [
      [PREDICTIONS[i], 400 + PREDICTIONS[i] * 10, y - 19],
      [ACTUALS[i], 400 + ACTUALS[i] * 10, y + 29],
    ])
      assert(
        frame.labels.some(
          (label) =>
            label.text === String(value) &&
            Math.abs(label.center.x - x) < 30 &&
            Math.abs(label.center.y - yy) < 30,
        ),
      );
    assert(
      frame.labels.some(
        (label) => label.text === `|${ACTUALS[i]} − ${PREDICTIONS[i]}| = ${RESIDUALS[i]} ms`,
      ),
    );
  }
  assert.equal(RESIDUALS[1], RESIDUALS[2]);
  assert.notEqual(PREDICTIONS[1], PREDICTIONS[2]);
});
test('the first explanation constructs rows and later interpretations preserve all nine data pairs', () => {
  assert.equal(calibrationScoresState(0, 0).visibleCount, 0);
  assert.equal(calibrationScoresState(0, 1).visibleCount, 9);
  for (const b of [1, 2]) assert.equal(calibrationScoresState(b, 0).visibleCount, 9);
  const first = paint(0, 0),
    last = paint(2, 1);
  assert.equal(
    first.labels.filter((x) => x.text.includes(' ms') && x.text.startsWith('|')).length,
    0,
  );
  assert.equal(
    last.labels.filter((x) => x.text.includes(' ms') && x.text.startsWith('|')).length,
    9,
  );
});
