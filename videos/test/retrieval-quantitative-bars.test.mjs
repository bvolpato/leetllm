import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, bm25, RANKING } from '../animations/retrieval-indexing.mjs';
registerLessonFonts();
const render = (id, progress) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: '', beats: [] },
    { beat: 0, beatP: progress, p: progress, opacity: 1 },
    draw,
  );
test('a labeled BM25 contribution keeps its exact proportional height while appearing', () => {
  for (const progress of [0.15, 0.35, 0.55, 0.95]) {
    const audit = render('bm25', progress),
      bar = audit.shapes.find((s) => s.x === 370 && s.width === 1220 && s.height > 0);
    assert(bar);
    assert.ok(Math.abs((bar.height / 185) * 1.2 - bm25('d1').contributions.make) < 1e-12);
  }
});
test('ranking bars keep complete score proportions while appearing', () => {
  for (const progress of [0.15, 0.35, 0.55, 0.95]) {
    const audit = render('ranking', progress),
      bar = audit.shapes.find((s) => s.x === 260 && s.width === 283.75 && s.height > 0);
    assert(bar);
    assert.ok(Math.abs((bar.height / 390) * 1.8 - RANKING[0].score) < 1e-12);
  }
});
