import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as ranking from '../animations/capstone-product-ranking-recommendation.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();

test('binary recall derives the retained relevant identities under an explicit grade cutoff', () => {
  const before = ranking.relevantRecall(['P5', 'P6', 'P4']);
  const after = ranking.relevantRecall(['P5', 'P4']);
  assert.deepEqual(before.relevantIds, ['P5', 'P6']);
  assert.equal(before.value, 1);
  assert.deepEqual(after.retainedRelevantIds, ['P5']);
  assert.equal(after.numerator, 1);
  assert.equal(after.denominator, 2);
  assert.equal(after.value, 0.5);
  assert.equal(ranking.relevantRecall(['P5', 'P4'], ranking.ORDERING_PRODUCTS, 1).value, 2 / 3);
  assert(
    ranking.dcg([3, 1]) > ranking.dcg([3]),
    'grade1 retains positive graded gain independently of binary recall',
  );
});

test('the painted recall example states its cutoff and exact retained fraction', () => {
  const ctx = createCanvas(1920, 1080).getContext('2d');
  const frame = drawFrame(
    ctx,
    {},
    { id: 'recall', title: 'Expose the product retrieval dropped' },
    { t: 20, duration: 38, opacity: 1, beat: 1, beatP: 0.5 },
    ranking.draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  assert(frame.labels.some((label) => label.text.includes('grade ≥ 2')));
  assert(frame.labels.some((label) => label.text === 'Relevant recall (1/2)'));
});
