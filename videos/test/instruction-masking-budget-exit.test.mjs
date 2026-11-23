import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, budgetRepairFrame } from '../animations/instruction-masking.mjs';
registerLessonFonts();
test('the whole 45-token exchange exits through a clear port while the input count retains its commit boundary', () => {
  for (const progress of [0.2173763440860277, ...Array.from({ length: 41 }, (_, i) => i / 40)]) {
    const state = {
      beat: 2,
      beatP: 0.99,
      opacity: 1,
      cues: {
        'im-fresh-budget-repair': {
          phase: progress === 1 ? 'after' : 'during',
          progress,
          active: true,
          strength: 1,
          targets: ['im-fresh-budget-repair'],
        },
        'im-fresh-overflow': { phase: 'after', progress: 1, active: false, strength: 0 },
      },
    };
    const canvas = createCanvas(1920, 1080),
      audit = drawFrame(
        canvas.getContext('2d'),
        {},
        {
          id: 'earned-contract',
          title: 'Repair one new shifted cell and preserve the other obligations',
        },
        state,
        draw,
      );
    assert.equal(audit.labels.filter((l) => l.text === '45').length, 1);
    assert.deepEqual(
      [...(audit.issues ?? []), ...layoutIssues(audit)],
      [],
      `transfer progress ${progress}`,
    );
    const model = budgetRepairFrame(state);
    assert.equal(model.prompt, progress === 1 ? 925 : 970);
    assert.equal(model.total, progress === 1 ? 1021 : 1066);
  }
});
