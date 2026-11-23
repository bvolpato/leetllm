import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import {
  LIBRARY_RECORD,
  libraryEvidence,
  coordinateGeneration,
  coordinateFrame,
  draw,
} from '../animations/hybrid-search.mjs';
registerLessonFonts();
const cue = (p) => ({
    progress: p,
    phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
    strength: 0,
  }),
  near = (a, z) => assert(Math.abs(a - z) < 1e-12);

test('a fixed record retains its exact posting while the supplied paraphrase uses separate vector evidence', () => {
  assert.deepEqual(libraryEvidence('G-14').hits, [LIBRARY_RECORD.id]);
  assert.deepEqual(libraryEvidence('growing tomatoes').hits, []);
  assert.deepEqual(LIBRARY_RECORD.tokens, ['guide', 'vegetable', 'gardening']);
  assert(libraryEvidence('growing tomatoes').similarity > 0.99);
  assert.equal(libraryEvidence('G-14').queryVector, null);
  assert.equal(
    libraryEvidence('unprovided query').similarity,
    null,
    'a supplied worksheet does not invent an embedding for another query',
  );
});

test('query-only counterclockwise rotation changes the actual winner and matching passage rotation restores it', () => {
  for (const [q, d, scores, winner] of [
    [0, 0, [1, 0], 0],
    [90, 0, [0, 1], 1],
    [90, 90, [1, 0], 0],
  ]) {
    const r = coordinateGeneration(q, d);
    r.scores.forEach((v, i) => near(v, scores[i]));
    assert.equal(r.winner, winner);
    for (const v of [r.query, ...r.passages])
      near(
        v.reduce((a, x) => a + x * x, 0),
        1,
      );
  }
  assert.equal(
    coordinateGeneration(-90, 0).winner,
    0,
    'clockwise is a different case and cannot support the narrated wrong winner',
  );
});

test('numeric ranking waits for its separate result cue while vector geometry follows the displayed whole degrees', () => {
  const make = (q, d, wrong, fixed) => ({
    beat: 2,
    beatP: 0.8,
    cues: {
      'version-worksheet': cue(1),
      'version-query-rotate': cue(q),
      'version-passages-rotate': cue(d),
      'version-wrong-rank': cue(wrong),
      'version-fixed-rank': cue(fixed),
    },
  });
  assert.equal(coordinateFrame(make(0.5, 0, 0, 0)).scoreKnown, false);
  assert.equal(coordinateFrame(make(1, 0, 0, 0)).scoreKnown, false);
  assert.equal(coordinateFrame(make(1, 0, 1, 0)).winner, 1);
  assert.equal(
    coordinateFrame(make(1, 0.2, 1, 0)).scoreKnown,
    true,
    'completed wrong-rank result stays visible at the start of the next operation clause',
  );
  assert.equal(coordinateFrame(make(1, 0.2, 1, 0)).passageDegrees, 0);
  assert.equal(coordinateFrame(make(1, 0.5, 1, 0)).scoreKnown, false);
  const fixed = coordinateFrame(make(1, 1, 1, 1));
  assert.equal(fixed.scoreKnown, true);
  assert.equal(fixed.winner, 0);
  for (const state of [
    make(0, 0, 0, 0),
    make(0.5, 0, 0, 0),
    make(1, 0, 1, 0),
    make(1, 0.5, 1, 0),
    make(1, 1, 1, 1),
  ]) {
    const f = coordinateFrame(state),
      expected = coordinateGeneration(f.queryDegrees, f.passageDegrees);
    assert.deepEqual(f.query, expected.query);
    const canvas = createCanvas(1920, 1080),
      a = drawFrame(
        canvas.getContext('2d'),
        {},
        { id: 'embedding-contract', title: 'Encoder compatibility' },
        { ...state, t: 40, duration: 120, opacity: 1 },
        draw,
      );
    assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  }
});
