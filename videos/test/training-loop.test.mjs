import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, modelSnapshot, oneTrainingStep } from '../animations/training-loop.mjs';

registerLessonFonts();
function numbersInTarget(frame, id) {
  const region = frame.targets.find((target) => target.id === id);
  if (!region) return [];
  return frame.labels
    .filter(
      (label) =>
        /^[−-]?\d+(?:\.\d+)?$/.test(label.text) &&
        label.x + label.width / 2 >= region.x &&
        label.x + label.width / 2 <= region.x + region.width &&
        label.y + label.height / 2 >= region.y &&
        label.y + label.height / 2 <= region.y + region.height,
    )
    .map((label) => Number(label.text.replace('−', '-')));
}
test('the painted parameter state changes only at step while the stored derivative remains owned', () => {
  const expectedStages = ['forward and loss', 'backward', 'optimizer step'],
    gradient = oneTrainingStep().gradient.flat();
  for (let beat = 0; beat < 3; beat++)
    for (const beatP of [0.05, 0.18, 0.5, 0.98]) {
      const state = { beat, beatP, t: 10, duration: 40, opacity: 1 },
        snapshot = modelSnapshot('phases', state),
        frame = drawFrame(
          createCanvas(1920, 1080).getContext('2d'),
          {},
          { id: 'phases', title: 'Backward fills gradients before the update' },
          state,
          draw,
        );
      assert.equal(snapshot.stage, expectedStages[beat]);
      assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
      assert.deepEqual(
        numbersInTarget(frame, 'phases-weight-matrix'),
        snapshot.weights.flat().map((v) => Number(v.toFixed(3))),
      );
      assert.deepEqual(numbersInTarget(frame, 'phases-gradient-matrix'), beat ? gradient : []);
      if (beat < 2) assert(snapshot.weights.flat().every((v) => v === 0));
    }
});
