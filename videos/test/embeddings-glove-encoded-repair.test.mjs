import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/embeddings.mjs';

registerLessonFonts();
function weights(progress, phase = 'active') {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'glove-fit', title: '' },
    {
      beat: 2,
      beatP: 0.9,
      p: 0.9,
      opacity: 1,
      cues: {
        'emb-glove-weights': { phase: progress === 1 ? 'after' : 'active', progress },
        'emb-glove-weight-values': { phase, progress: phase === 'after' ? 1 : 0.5 },
      },
    },
    draw,
  );
}

test('fixed GloVe counts never receive a progress-scaled numeric weight', () => {
  for (const progress of [0.1, 0.356, 0.5, 0.999, 1]) {
    const frame = weights(progress),
      labels = frame.labels.filter((l) => /^weight /.test(l.text));
    for (const label of labels) {
      const row = Math.round((label.center.y - 555) / 190),
        value = Number(label.text.slice(7));
      if (Number.isFinite(value))
        assert.ok(
          Math.abs(value - Math.min(1, ([3, 30, 300][row] / 100) ** 0.75)) < 0.00051,
          'A numeric weight must describe the fixed observed count',
        );
    }
    assert.equal(
      labels.some((l) => Number.isFinite(Number(l.text.slice(7)))),
      false,
      'Completed weights wait for their own complete values clause',
    );
  }
});

test('completed fixed weights have matching quantitative bar widths', () => {
  const frame = weights(1, 'after');
  for (const [i, count] of [3, 30, 300].entries()) {
    const expected = Math.min(1, (count / 100) ** 0.75),
      label = frame.labels.find(
        (l) => l.text === 'weight ' + Number(expected.toFixed(3)).toString(),
      ),
      fill = frame.shapes.find((s) => s.x === 1280 && s.y === 440 + i * 190 + 50);
    assert(label, 'Every completed weight remains visible');
    assert(fill);
    assert.ok(
      Math.abs(fill.width / 420 - expected) < 1e-12,
      'Bar width agrees with the completed numeric weight',
    );
  }
});

test('fresh comparison captions follow the visible scores through query alignment', () => {
  for (const sample of [
    { scores: false, query: 0, wrong: false, repaired: false },
    { scores: true, query: 0, wrong: false, repaired: false },
    { scores: true, query: 0.5, wrong: true, repaired: false },
    { scores: true, query: 1, wrong: true, repaired: false },
    { scores: true, query: 1, wrong: true, repaired: true },
  ]) {
    const cue = (progress) => ({
      phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'active',
      progress,
    });
    const frame = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'fresh-representation', title: '' },
      {
        beat: 1,
        beatP: 0.5,
        p: 0.5,
        opacity: 1,
        cues: {
          'emb-fresh-docs': cue(1),
          'emb-fresh-scores': cue(sample.scores ? 1 : 0),
          'emb-fresh-query': cue(sample.query),
          'emb-fresh-wrong': cue(sample.wrong ? 1 : 0),
          'emb-fresh-repaired': cue(sample.repaired ? 1 : 0),
        },
      },
      draw,
    );
    const labels = frame.labels.map((label) => label.text),
      scoresVisible = labels.some((text) => text.startsWith('river dot '));
    assert.equal(scoresVisible, sample.scores);
    assert.equal(
      labels.includes('Predict before revealing scores'),
      !scoresVisible,
      'A prediction instruction must end when the scores are already displayed',
    );
    if (scoresVisible && !sample.repaired && (!sample.wrong || sample.query > 0))
      assert(labels.includes('Compare the displayed scores'));
  }
});
