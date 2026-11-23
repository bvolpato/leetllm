import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, rewardFreshScreen } from '../animations/reward-modeling.mjs';

registerLessonFonts();

function frame(scene, beat, cues) {
  const result = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: scene, title: '' },
    { beat, beatP: 0.99, p: 0.99, opacity: 1, cues },
    draw,
  );
  assert.deepEqual([...result.issues, ...layoutIssues(result)], []);
  return result;
}

test('the current group coefficient caption agrees with its quantitative bar while the raw baseline remains separate', () => {
  for (const progress of [0.1, 0.6, 0.9, 1]) {
    const result = frame('group-weight-soft-target', 0, {
      'group-pairs': { phase: 'after', progress: 1 },
      'group-weights': { phase: progress === 1 ? 'after' : 'during', progress },
    });
    const fill = result.shapes.find((s) => s.kind === 'rect' && s.x === 1123 && s.y === 658);
    const caption = result.labels.find((l) => l.text.startsWith('Current P = '));
    assert(caption, 'A moving coefficient needs its own current-value caption');
    const [, p, q] = /Current P = ([\d.]+) · Q = ([\d.]+)/.exec(caption.text);
    assert(Math.abs(Number(p) - fill.width / 614) <= 0.00051);
    assert(Math.abs(Number(p) + Number(q) - 1) <= 0.00001);
    assert(result.labels.some((l) => l.text === 'Raw baseline: P = 36/37 · Q = 1/37'));
  }
});

test('the actual moving score gap and its final target have distinct numerical captions', () => {
  for (const progress of [0.1, 0.5, 0.95, 1]) {
    const result = frame('stable-loss-and-margins', 2, {
      'stable-target': { phase: progress === 1 ? 'after' : 'during', progress },
    });
    const point = result.shapes.find(
      (s) => s.kind === 'circle' && s.width === 40 && s.center.y === 580,
    );
    assert(point);
    const caption = result.labels.find((l) => l.text.startsWith('Actual Δ = '));
    assert(caption, 'The current marker must have its actual score gap');
    const gap = Number(caption.text.split(' = ')[1]);
    assert(Math.abs(gap - (point.center.x - 280) / 330) <= 0.00051);
    assert(result.labels.some((l) => l.text === 'Target Δ = 1 + log(0.9 / 0.1) = 3.197'));
  }
});

test('each fresh completed answer waits through its own result clause independently', () => {
  const ids = ['fresh-pair-result', 'fresh-ensemble-result', 'fresh-source-result'];
  const cues = Object.fromEntries(ids.map((id) => [id, { phase: 'before', progress: 0 }]));
  for (const [index, id] of ids.entries()) {
    for (const progress of [0.01, 0.6, 0.999]) {
      cues[id] = { phase: 'during', progress };
      const state = rewardFreshScreen({ beat: 1, beatP: 0.99, cues });
      assert.deepEqual(
        [state.pair, state.ensemble, state.source],
        ids.map((_, i) => i < index),
      );
    }
    cues[id] = { phase: 'after', progress: 1 };
    const state = rewardFreshScreen({ beat: 1, beatP: 0.99, cues });
    assert.deepEqual(
      [state.pair, state.ensemble, state.source],
      ids.map((_, i) => i <= index),
    );
  }
});
