import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, freshAuditReveal } from '../animations/benchmark-audits.mjs';

registerLessonFonts();

test('reported audit percentages match the actual filled fraction throughout their reveal', () => {
  for (const [id, cue, x, y, width, height, rate] of [
    ['math-frontier', 'ba-math-frontier-versions', 460, 815, 1000, 60, 0.42],
    ['benchmark-audit', 'ba-benchmark-audit-pro', 310, 730, 1300, 75, 0.3],
  ])
    for (const progress of [0.01, 0.25, 0.5, 0.999, 1]) {
      const frame = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        {},
        { id, title: '', beats: [] },
        {
          beat: 1,
          beatP: 0.9,
          p: 0.9,
          opacity: 1,
          cues: { [cue]: { phase: progress === 1 ? 'after' : 'active', progress } },
        },
        draw,
      );
      const fill = frame.shapes.find(
        (s) => s.x === x + 3 && s.y === y + 3 && s.height === height - 6,
      );
      assert(fill, 'A visible percentage claim needs its corresponding quantitative bar');
      assert.ok(
        Math.abs(fill.width / (width - 6) - rate) < 1e-12,
        'The reported percentage must describe the actual bar, including intermediate cue times',
      );
    }
});

test('fresh paired evidence, critical comparison and disposition wait for separate completed clauses', () => {
  const cases = [
    ['ba-fresh-report-pvalue', 'paired', 1],
    ['ba-fresh-report-bound', 'bound', 1],
    ['ba-fresh-report-hold', 'hold', 2],
  ];
  for (const [id, key, beat] of cases) {
    const cues = Object.fromEntries(cases.map(([id]) => [id, { phase: 'before', progress: 0 }]));
    for (const progress of [0.01, 0.5, 0.999]) {
      cues[id] = { phase: 'active', progress };
      assert.equal(freshAuditReveal({ beat, beatP: 0.99, cues })[key], false, id);
    }
    cues[id] = { phase: 'after', progress: 1 };
    assert.equal(freshAuditReveal({ beat, beatP: 0.99, cues })[key], true, id);
  }
});
