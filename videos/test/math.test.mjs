import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { math } from '../lib/scene.mjs';

test('a formula is visible on its first frame and matches cached draws', () => {
  const canvas = createCanvas(600, 240);
  const ctx = canvas.getContext('2d');
  const formula = String.raw`\frac{\partial L}{\partial W_x} + x^2`;
  const metrics = math(ctx, formula, 40, 140, 52, '#63deec');
  const first = Buffer.from(canvas.data());
  assert.ok(
    first.some((value, index) => index % 4 === 3 && value > 0),
    'first render must contain visible glyph pixels',
  );
  assert.ok(metrics.width > 100 && metrics.baseline > 0 && metrics.baseline <= metrics.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  math(ctx, formula, 40, 140, 52, '#63deec');
  assert.deepEqual(Buffer.from(canvas.data()), first);
});
