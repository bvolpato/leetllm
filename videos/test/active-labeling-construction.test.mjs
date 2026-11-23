import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  agreementConstruction,
  mappedJudgeConstruction,
  draw,
} from '../animations/active-labeling.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

test('agreement and chance readouts accumulate exactly the inspected cells and marginal products', () => {
  assert.equal(agreementConstruction({ beat: 0, beatP: 0.73 }).matched, 0);
  assert.equal(agreementConstruction({ beat: 0, beatP: 0.82 }).matched, 42);
  const partial = agreementConstruction({ beat: 1, beatP: 0.25 });
  assert.equal(partial.matched, 107);
  assert.equal(partial.terms, 1);
  assert.equal(partial.partialChance, (46 * 48) / 120 ** 2);
  assert.equal(partial.kappaReady, false);
  const complete = agreementConstruction({ beat: 1, beatP: 0.5 });
  assert.deepEqual(complete.rows, [46, 44, 30]);
  assert.deepEqual(complete.cols, [48, 42, 30]);
  assert.ok(Math.abs(complete.partialChance - complete.expected) < 1e-12);
  assert.equal(complete.kappaReady, true);
});

test('answer-order flip counts include only completed mappings back to original identities', () => {
  for (const [p, completed, changed] of [
    [0.21, 0, 0],
    [0.36, 1, 1],
    [0.5, 2, 1],
    [0.6, 3, 2],
  ]) {
    const frame = mappedJudgeConstruction(p);
    assert.equal(frame.completed, completed);
    assert.equal(frame.changed, changed);
  }
});

test('the excluded source row physically leaves the dataset while its current audit stays pending', () => {
  registerLessonFonts();
  const ctx = createCanvas(1920, 1080).getContext('2d');
  const paint = (beatP) => {
    const frame = drawFrame(
      ctx,
      {},
      { id: 'dataset-release', title: 'Bind the audit to the rebuilt dataset' },
      { t: 1, duration: 54, opacity: 1, beat: 2, beatP },
      draw,
    );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
    return frame.labels;
  };
  const before = paint(0).find((label) => label.text === 'attack-014-copy');
  const after = paint(0.2).find((label) => label.text === 'attack-014-copy');
  assert(before && after, 'the actual derivative row remains identifiable');
  assert(
    before.center.x < 800 && after.center.x > 1400,
    'the derivative moves into the excluded lane',
  );
  assert(
    paint(0.2).some((label) => label.text === 'WAIT'),
    'the rebuilt snapshot still needs its current audit',
  );
  assert(!paint(0.8).some((label) => label.text === 'WAIT'));
});
