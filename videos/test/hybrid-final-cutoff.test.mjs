import { createTextInkAudit } from '../lib/text-ink-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw, lowerLayerSearch, newQuerySnapshot } from '../animations/hybrid-search.mjs';

test('the final spoken cutoff change recovers the same already retrieved book and holds it', () => {
  const cue = (phase, progress) => ({ 'expand-final-cutoff': { phase, progress } });
  const before = newQuerySnapshot(2, 0.5, cue('before', 0)),
    during = newQuerySnapshot(2, 0.5, cue('during', 0.75)),
    after = newQuerySnapshot(2, 1, cue('after', 1));
  assert.deepEqual(after.lanes, before.lanes);
  assert.deepEqual(after.result, before.result);
  assert.equal(before.budget, 1);
  assert.equal(
    before.result.slice(0, before.budget).some((row) => row.id === 'Slow bread'),
    false,
  );
  for (const snapshot of [during, after]) {
    assert.equal(snapshot.budget, 2);
    assert.equal(
      snapshot.result.slice(0, snapshot.budget).some((row) => row.id === 'Slow bread'),
      true,
    );
  }
});

test('a wider lower-layer search preserves the bridge needed to reach the exact neighbor', () => {
  const narrow = lowerLayerSearch(1),
    wide = lowerLayerSearch(3);
  assert.deepEqual(narrow.expanded, ['S', 'A', 'B']);
  assert.equal(narrow.best[0], 'B');
  assert.deepEqual(wide.expanded, ['S', 'A', 'B', 'D', 'C']);
  assert.equal(wide.best[0], 'C');
});

test('the fresh fused answer waits for its cue and is ordered before the cutoff is applied', () => {
  const paint = (beat, reveal, order) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'policy-transfer', title: 'Fresh ranks' },
      {
        beat,
        beatP: 0.5,
        t: 1,
        opacity: 1,
        duration: 70,
        cues: Object.fromEntries(
          [
            ['transfer-fusion', reveal],
            ['transfer-order', order],
            ['transfer-retain', 0],
          ].map(([id, progress]) => [
            id,
            { phase: progress === 1 ? 'after' : 'before', progress, strength: 0 },
          ]),
        ),
      },
      draw,
    ).labels;
  const values = (labels) => labels.filter((x) => /0\.091$|0\.154$/.test(x.text));
  assert.equal(values(paint(0, 0, 0)).length, 0);
  const ordered = values(paint(1, 1, 1));
  assert.equal(ordered.length, 2);
  const required = ordered.find((x) => x.text.endsWith('0.091'));
  const distractor = ordered.find((x) => x.text.endsWith('0.154'));
  assert(distractor.y < required.y, 'higher fused distractor must occupy the retained top row');
});

test('pooled sparse values paint visible ink outside their filled bars', () => {
  registerLessonFonts();
  for (const beat of [0, 1]) {
    const canvas = createCanvas(1920, 1080),
      ink = createTextInkAudit(canvas.getContext('2d'));
    ink.beginFrame();
    const cues = Object.fromEntries(
      ['sparse-rule', 'sparse-second', 'sparse-pool', 'weighted-index'].map((id) => [
        id,
        { phase: 'after', progress: 1, strength: 0 },
      ]),
    );
    drawFrame(
      ink.ctx,
      {},
      { id: 'sparse-expansion', title: 'Sparse coordinate' },
      { beat, beatP: 1, t: 1, opacity: 1, duration: 70, cues },
      draw,
    );
    const report = ink.finishFrame(),
      values = report.labels.filter((label) => label.text === '1.386');
    assert(values.length > 0);
    assert(
      values.every((label) => label.status === 'visible' && label.changedPixels > 0),
      'computed sparse weights need discernible native ink',
    );
  }
});
