import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, trainingFreshState } from '../animations/training-run-operations.mjs';

registerLessonFonts();
function render(id, beat, beatP, cues) {
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: '' },
    { beat, beatP, p: beatP, opacity: 1, cues },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame;
}

test('staging status stays outside the changing fill through pending, partial and complete copies', () => {
  for (const beatP of [0.01, 0.3, 0.5, 0.9]) {
    const frame = render('checkpoint-ownership', 1, beatP, {});
    const status = frame.labels.find((l) => /^(COPY PENDING|STAGING COMPLETE)$/.test(l.text));
    assert(status);
    assert(
      status.y >= 465 && status.y + status.height < 585,
      'The status needs a stable contrasting area between the two progress tracks',
    );
  }
});

test('a completed base-weight floor caption agrees with its numerical-axis width', () => {
  for (const progress of [0.1, 0.3, 0.8, 1]) {
    const frame = render('adaptation-and-memory', 1, 0.99, {
      'memory-gib': { phase: 'after', progress: 1 },
      'adaptation-floor': { phase: 'after', progress: 1 },
      'adaptation-smaller': { phase: progress === 1 ? 'after' : 'during', progress },
    });
    const bar =
      frame.shapes.find((s) => s.kind === 'panel' && s.x === 300 && s.y === 665) ??
      frame.shapes.find((s) => s.x === 300 && s.y === 665);
    assert(bar);
    const caption = frame.labels.find(
      (l) => l.center.y > 690 && l.center.y < 745 && l.text.startsWith('Floor: '),
    );
    if (caption) {
      const value = Number(/Floor: ([\d.]+)/.exec(caption.text)[1]);
      assert(
        Math.abs(value - bar.width / (1250 / 48)) <= 0.051,
        'A final GiB value cannot label a partial bar',
      );
    }
    if (progress === 1) assert(caption, 'The completed width still needs its final numeric floor');
  }
});

test('fresh cost, failure, checkpoint, count, range and owner wait for six separate completed clauses', () => {
  const cases = [
    ['fresh-cost', 'cost', 1],
    ['fresh-fails', 'failed', 1],
    ['fresh-retain', 'retained', 1],
    ['fresh-restore-step-2', 'count', 1],
    ['fresh-range', 'range', 2],
    ['fresh-restore-step-3', 'owner', 2],
  ];
  for (const [id, key, beat] of cases) {
    const cues = Object.fromEntries(cases.map(([id]) => [id, { phase: 'before', progress: 0 }]));
    for (const progress of [0.01, 0.5, 0.999]) {
      cues[id] = { phase: 'during', progress };
      assert.equal(trainingFreshState({ beat, beatP: 0.99, cues })[key], false, id);
    }
    cues[id] = { phase: 'after', progress: 1 };
    assert.equal(trainingFreshState({ beat, beatP: 0.99, cues })[key], true, id);
  }
});
