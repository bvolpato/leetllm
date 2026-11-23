import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, checkExpression } from '../animations/reasoning-search.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();

const ctx = createCanvas(1920, 1080).getContext('2d');
function paint(beat, beatP) {
  const frame = drawFrame(
    ctx,
    {},
    { id: 'heuristic-pruning', title: 'A narrow beam can prune the only solvable branch' },
    { t: 1, duration: 35, opacity: 1, beat, beatP },
    draw,
  );
  assert.deepEqual(
    [...frame.issues, ...layoutIssues(frame)],
    [],
    `beam comparison must stay readable at ${beat}/${beatP}`,
  );
  return frame.labels;
}

test('the same B candidate leaves the retained frontier and returns when the beam widens', () => {
  const before = paint(2, 0.02).find((label) => label.text.startsWith('B ·'));
  const pruned = paint(2, 0.45).find((label) => label.text.startsWith('B ·'));
  const restored = paint(2, 0.7).find((label) => label.text.startsWith('B ·'));
  assert(before && pruned && restored, 'candidate identity remains inspectable');
  assert(
    pruned.center.x > 1000 && pruned.center.y > 780,
    'B must visibly occupy the pruned lane at width one',
  );
  assert(
    restored.center.x > 1000 && restored.center.y < 650,
    'the same B returns to the retained frontier at width two',
  );
  assert(before.center.x < pruned.center.x - 400);
  assert(paint(2, 0.82).some((label) => label.text === '6 − 4 = 2'));
  const final = paint(2, 0.98).map((label) => label.text);
  assert(final.some((text) => text.includes('2 × 12 = 24')));
  assert(
    checkExpression({
      op: '×',
      left: { op: '-', left: { leaf: 6 }, right: { leaf: 4 } },
      right: { op: '+', left: { leaf: 5 }, right: { leaf: 7 } },
    }).valid,
  );
});
