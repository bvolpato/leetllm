import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  attentionPairConstruction,
  attentionSlicePrediction,
  draw,
} from '../animations/tensor-shapes.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

test('the migrate query accumulates real feature products against each key', () => {
  const partial = attentionPairConstruction(1, 0.5);
  assert.equal(partial.queryToken, 'migrate');
  assert.deepEqual(partial.query, [4, 5, 6, 7]);
  assert.equal(partial.completedFeatures, 2);
  assert.deepEqual(partial.partialSums, [5, 41, 77]);

  const complete = attentionPairConstruction(1, 1);
  assert.deepEqual(
    complete.keys.map((key) => key.products.map((item) => item.product)),
    [
      [0, 5, 12, 21],
      [16, 25, 36, 49],
      [32, 45, 60, 77],
    ],
  );
  assert.deepEqual(
    complete.keys.map((key) => key.score),
    [38, 126, 214],
  );
});

test('the built query row fills first and its slice preserves one query axis', () => {
  const rowBuilt = attentionPairConstruction(2, 0.38);
  const matrixBuilt = attentionPairConstruction(2, 0.92);
  assert.deepEqual(
    rowBuilt.matrixCells.map((cell) => [cell.row, cell.column, cell.value]),
    [
      [1, 0, 38],
      [1, 1, 126],
      [1, 2, 214],
    ],
  );
  assert.equal(matrixBuilt.completedMatrixCells, 9);
  assert.deepEqual(attentionSlicePrediction(), {
    expression: 'scores[0, 1:2, :]',
    queryToken: 'migrate',
    keyToken: 'south',
    score: 214,
    row: [38, 126, 214],
    shape: [1, 3],
  });
});

test('measured attention phrases construct actual query cells, products, and score rows', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/tensor-shapes.lesson.yaml', import.meta.url),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'attention');
  const scene = lesson.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('tensor-shapes')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const canvas = createCanvas(1920, 1080);
  for (const [id, targetId, columns, rows] of [
    ['query-migrate-b1-1', 'query-migrate', ['4', '5', '6', '7'].map((value) => [value]), 1],
    [
      'query-products-b2-1',
      'component-products',
      [
        ['4 × 0 = 0', '4 × 4 = 16', '4 × 8 = 32'],
        ['5 × 1 = 5', '5 × 5 = 25', '5 × 9 = 45'],
        ['6 × 2 = 12', '6 × 6 = 36', '6 × 10 = 60'],
        ['7 × 3 = 21', '7 × 7 = 49', '7 × 11 = 77'],
      ],
      3,
    ],
  ]) {
    const cue = timing.visualCues.find((cue) => cue.id === id);
    assert(cue, `measured phrase ${id} must resolve`);
    for (const [time, expectedColumns] of [
      [cue.start - 0.04, 0],
      [cue.start + 0.08, 1],
      [cue.start + 0.6 * (cue.end - cue.start), 3],
      [cue.end + cue.linger / 2, 4],
    ]) {
      const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
      const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
      assert.deepEqual(layoutIssues(audit), [], `${id} at ${time}s`);
      const targets = audit.targets.filter((target) => target.id === targetId);
      const labels = audit.labels.filter((label) =>
        targets.some(
          (target) =>
            label.x >= target.x &&
            label.y >= target.y &&
            label.x + label.width <= target.x + target.width + 1 &&
            label.y + label.height <= target.y + target.height + 1,
        ),
      );
      const expected = columns.slice(0, expectedColumns).flat();
      assert.equal(
        targets.reduce((count, target) => count + target.markCounts.shapes, 0),
        expectedColumns * rows,
        `${id} must bind painted vector/product cards`,
      );
      assert.deepEqual(labels.map((label) => label.text).sort(), expected.sort());
      if (state.cues[id].strength > 0.9) assert(labels.every((label) => label.alpha > 0.9));
    }
  }
  const rowCue = timing.visualCues.find((cue) => cue.id === 'migrate-score-row-b3-1');
  const shapeCue = timing.visualCues.find((cue) => cue.id === 'pair-grid-shape-b3-2');
  for (const [time, expectedRow] of [
    [rowCue.end + rowCue.linger / 2, ['38', '126', '214']],
    [rowCue.start - 0.04, []],
    [rowCue.start + 0.5 * (rowCue.end - rowCue.start), ['38']],
    [rowCue.end, ['38', '126', '214']],
  ]) {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `migrate row at ${time}s`);
    const row = audit.labels
      .filter((label) => label.x >= 650 && label.x < 1265 && label.y >= 530 && label.y < 627)
      .map((label) => label.text);
    assert.deepEqual(
      row,
      expectedRow,
      'the spoken migrate row must be complete by its phrase end and held state',
    );
    const laterRows = audit.labels.filter(
      (label) =>
        label.x >= 650 &&
        label.x < 1265 &&
        label.y >= 425 &&
        label.y < 732 &&
        !(label.y >= 530 && label.y < 627),
    );
    assert.equal(laterRows.length, 0, 'other query rows must wait for their later construction');
  }
  const otherPairsStart = rowCue.end + rowCue.linger;
  for (const [time, count] of [
    [otherPairsStart + 0.6 * (shapeCue.start - otherPairsStart), 6],
    [shapeCue.start, 9],
  ]) {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `remaining query rows at ${time}s`);
    const cells = audit.labels.filter(
      (label) => label.x >= 650 && label.x < 1265 && label.y >= 425 && label.y < 732,
    );
    assert.equal(
      cells.length,
      count,
      'remaining pairs must build gradually before the output-shape cue',
    );
  }
});
