import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw as drawGui } from '../animations/gui-agent-loop.mjs';

registerLessonFonts();
const paint = (draw, id, beat, elapsed, interval) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'A checked proposal' },
    { t: 1, duration: 20, opacity: 1, beat, beatP: elapsed / interval },
    draw,
  )
    .labels.filter((label) => label.alpha >= 0.8)
    .map((label) => label.text);

test('a stale frame sends no failure click; a current control passes resolution and actionability before dispatch', () => {
  const stale = paint(drawGui, 'observation-freshness', 1, 8, 10.758);
  assert(stale.some((text) => text.includes('frame-2 · version 2')));
  assert(stale.includes('stale-observation'));
  assert(stale.some((text) => text.startsWith('Failure clicks sent: 0')));
  const resolved = paint(drawGui, 'observation-freshness', 2, 4, 9.934);
  assert(resolved.includes('Unique match · Failed tests · RUN-78432'));
  assert(resolved.includes('Actionability check pending'));
  assert(!resolved.some((text) => text.startsWith('Click sent')));
  const dispatched = paint(drawGui, 'observation-freshness', 2, 9, 9.934);
  assert(dispatched.includes('Click sent · failure-open · frame-3 / v3'));
  assert(dispatched.some((text) => text.startsWith('Failure clicks sent: 1')));
});
