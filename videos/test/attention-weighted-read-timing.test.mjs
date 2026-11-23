import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, attention, EXAMPLE } from '../animations/attention.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 1 ? 'after' : progress === 0 ? 'before' : 'during',
  progress,
  reveal: progress,
  active: false,
  strength: 0,
  targets: [],
});
const paint = (addition, beat = 0) => {
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'value-mixture', title: 'A weighted read moves through value space' },
    {
      t: 9,
      duration: 38,
      opacity: 1,
      beat,
      beatP: beat ? 0.02 : 0.9,
      cueTiming: 'provider-words',
      cues: {
        'value-mixture-first-weighted-value-b1-1': cue(1),
        'value-mixture-add-weighted-values': cue(addition),
        'value-mixture-first-weighted-value-b2-1': cue(0),
      },
    },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame;
};
const result = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V);
const shownVector = (values) => `[${values.map((value) => value.toFixed(2)).join(', ')}]`;

test('the spoken addition draws its real partial second vector and matching running sum in paragraph one', () => {
  const frame = paint(0.5),
    weights = result.weights[1];
  const expected = EXAMPLE.V[0].map(
    (value, d) => value * weights[0] + 0.5 * EXAMPLE.V[1][d] * weights[1],
  );
  assert(
    frame.targets.some(
      (target) => target.id === 'second-weighted-value' && target.markCounts.connectors > 0,
    ),
  );
  assert(frame.labels.some((label) => label.text === shownVector(expected)));
  assert(frame.labels.some((label) => label.text === 'Running weighted sum'));
});

test('both contributions and the yellow endpoint are complete by the paragraph-one output clause', () => {
  const frame = paint(1),
    output = result.output[1];
  assert(frame.labels.some((label) => label.text === shownVector(output)));
  assert(frame.labels.some((label) => label.text === 'Full contextual mixture'));
  const point = frame.targets.find((target) => target.id === 'contextual-mixture-point');
  assert(point);
  assert(Math.abs(point.x + point.width / 2 - (240 + output[0] * 225)) < 0.01);
  assert(Math.abs(point.y + point.height / 2 - (840 - output[1] * 225)) < 0.01);
});

test('the next paragraph inspects the established head-to-tail sum without replaying its construction', () => {
  const frame = paint(1, 1);
  assert(frame.labels.some((label) => label.text === shownVector(result.output[1])));
  assert(frame.labels.some((label) => label.text === 'Full contextual mixture'));
  assert(
    frame.targets.some(
      (target) => target.id === 'second-weighted-value' && target.markCounts.connectors > 0,
    ),
  );
});
