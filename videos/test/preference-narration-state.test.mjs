import test from 'node:test';
import assert from 'node:assert/strict';
import { preferenceMargin } from '../animations/reward-modeling.mjs';
import { draw, lossPresentation } from '../animations/preference-alignment.mjs';

test('equal-score explanation holds both scores equal throughout its measured phrase', () => {
  const cues = {
    'equal-score-chance': { start: 10, end: 13 },
    'check-human-judgments': { start: 14, end: 16 },
  };
  for (const t of [10, 10.1, 11.5, 13, 13.9])
    assert.equal(preferenceMargin({ beat: 2, t, cues }), 0);
  assert.equal(preferenceMargin({ beat: 2, t: 9, cues }), 1.1);
  assert.equal(preferenceMargin({ beat: 2, t: 15, cues }), 1.1);
});

test('confident mistake has lower chosen-label probability and larger loss than an even guess', () => {
  const wrong = lossPresentation(2, 1, 0),
    right = lossPresentation(2, 1, 1);
  assert(wrong.probability < 0.1);
  assert(wrong.loss > Math.log(2));
  assert(right.probability > 0.9);
  assert(right.loss < Math.log(2));
  assert.equal(wrong.loss, -Math.log(wrong.probability));
  assert(lossPresentation(1, 1).probability > 0.5);
});

test('loss labels distinguish equal, lower, and higher preference odds', () => {
  const paint = (beat, beatP) => {
    const labels = [];
    const clamp = (value) => Math.max(0, Math.min(1, value));
    draw(
      {},
      { id: 'loss' },
      { beat, beatP },
      {
        C: {},
        components: {},
        teaching: { bars() {} },
        focus: { target: (_id, fn) => fn(), progress: () => 0 },
        clamp,
        phase: (value, start, end) => clamp((value - start) / (end - start)),
        text: (_ctx, value) => labels.push(value),
        math() {},
      },
    );
    return labels.find((label) => label.startsWith('Scaled margin'));
  };

  assert.match(paint(0, 0), /βm = 0\.00 · at even odds$/);
  assert.match(paint(1, 0.06), /near even odds$/);
  assert.match(paint(1, 1), /chosen above even odds$/);
  assert.match(paint(2, 0), /chosen below even odds$/);
});
