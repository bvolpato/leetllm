import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, parentPackingFixture } from '../animations/production-retrieval.mjs';

registerLessonFonts();
const frame = (id, beat, cues) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: '', beats: [] },
    { beat, beatP: 0.8, p: 0.8, opacity: 1, cues },
    draw,
  );
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'active',
  progress,
});

test('rendered context quantity and bar agree with the complete labeled bytes during measurement', () => {
  const rendered = parentPackingFixture()
    .packed.map((e) => '[' + e.sourceId + '] ' + e.parentId + ' (' + e.version + '): ' + e.text)
    .join('\n');
  for (const progress of [0.01, 0.25, 0.5, 0.999, 1]) {
    const actual = frame('context-budget', 1, {
      'pr-characters': cue(progress),
      'pr-dedup': cue(0),
      'pr-skip': cue(0),
    });
    assert(
      actual.labels.some(
        (l) => l.text === `Rendered labeled context: ${rendered.length} / 400 characters`,
      ),
    );
    const bar = actual.shapes.find(
      (s) => s.x === 1080 && s.y === 650 && s.height === 30 && s.width < 690,
    );
    assert(bar, 'The exact context quantity needs its proportional bar');
    assert.ok(Math.abs(bar.width / 690 - rendered.length / 400) < 1e-12);
  }
});

test('permitted age counterfactual has a neutral result until its completed clause', () => {
  const cues = {
    'pr-deletion': cue(1),
    'pr-freshrollback': cue(1),
    'pr-discard': cue(1),
    'pr-counterfactual-input': cue(1),
    'pr-newage': cue(0),
  };
  for (const progress of [0.01, 0.5, 0.999]) {
    const actual = frame('fresh-evidence', 1, { ...cues, 'pr-newage': cue(progress) });
    assert(
      actual.labels.some(
        (l) => l.text === 'Permitted counterfactual · 16 stale days · signal 47 hours',
      ),
    );
    assert(actual.labels.some((l) => l.text === 'Counterfactual decision pending'));
    assert(!actual.labels.some((l) => l.text === 'If permitted but age 16: ineligible · E1'));
  }
  assert(
    frame('fresh-evidence', 1, { ...cues, 'pr-newage': cue(1) }).labels.some(
      (l) => l.text === 'If permitted but age 16: ineligible · E1',
    ),
  );
  const original = frame('fresh-evidence', 1, { ...cues, 'pr-counterfactual-input': cue(0) });
  assert(original.labels.some((l) => l.text === 'Tombstone persists through rollback → abstain'));
  assert(!original.labels.some((l) => l.text.includes('ineligible')));
});
