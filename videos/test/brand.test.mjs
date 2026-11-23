import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawBrandMark } from '../lib/brand.mjs';

test('an animated logo reveal preserves the reusable complete mark', () => {
  const canvas = createCanvas(240, 240),
    ctx = canvas.getContext('2d');
  drawBrandMark(ctx, 0, 0, 240);
  const complete = Buffer.from(canvas.data());
  assert.ok(complete.some((value, index) => index % 4 === 3 && value));
  ctx.clearRect(0, 0, 240, 240);
  drawBrandMark(ctx, 0, 0, 240, 0.35);
  assert.notDeepEqual(Buffer.from(canvas.data()), complete);
  ctx.clearRect(0, 0, 240, 240);
  drawBrandMark(ctx, 0, 0, 240);
  assert.deepEqual(Buffer.from(canvas.data()), complete);
});
