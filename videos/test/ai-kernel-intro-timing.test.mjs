import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { draw, rms, sampleModel } from '../animations/ai-generated-kernel-engineering.mjs';

registerLessonFonts();
const paint = (elapsed) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'intro', title: 'Weighted RMS' },
    { t: 21.186 + elapsed, duration: 45, opacity: 1, beat: 1, beatP: elapsed / 23.498 },
    draw,
  );

test('mean, epsilon and reciprocal are visible during their measured spoken clauses', () => {
  assert(
    paint(2.5).labels.some(
      (label) => label.kind === 'math' && label.text.includes('(9+16)/2=12.5'),
    ),
  );
  assert(
    paint(4.3).labels.some((label) => label.kind === 'math' && label.text.includes('12.50001')),
  );
  assert(
    paint(6.4).labels.some((label) => label.kind === 'math' && label.text.includes('0.282843')),
  );
});

test('one common scale drives both normalized bars before independent feature weighting', () => {
  const normalized = paint(8.95),
    complete = paint(14),
    reference = rms([3, 4], [1, 2], 1e-5);
  const bars = (frame, y) =>
    frame.shapes.filter((shape) => shape.kind === 'rect' && shape.y === y && shape.height === 12);
  const input = bars(normalized, 418),
    scaled = bars(normalized, 598);
  assert.equal(input.length, 2);
  assert.equal(scaled.length, 2);
  for (let i = 0; i < 2; i++)
    assert(Math.abs(scaled[i].width / input[i].width - reference.scale) < 1e-9);
  assert.equal(bars(normalized, 778).length, 0);
  const weighted = bars(complete, 778);
  assert.equal(weighted.length, 2);
  assert(Math.abs(weighted[0].width - scaled[0].width) < 1e-9);
  assert(Math.abs(weighted[1].width - scaled[1].width * 2) < 1e-9);
  assert(complete.labels.some((label) => label.text === reference.outputs[1].toFixed(4)));
});

test('tail padding caption follows the displayed contributions and mean in both phases', () => {
  const paintTail = (beat, beatP) => {
    const state = { t: beat === 0 ? 10 : 30, duration: 45.767, opacity: 1, beat, beatP };
    const frame = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'tail', title: 'Reduction padding needs the correct identity' },
      state,
      draw,
    );
    return { model: sampleModel('tail', state), labels: frame.labels.map((label) => label.text) };
  };
  const line = (labels, prefix) => labels.find((text) => text.startsWith(prefix));
  const wrong = paintTail(0, 0.9);
  assert.deepEqual(wrong.model.terms.slice(5), [1, 1, 1]);
  assert.equal(
    line(wrong.labels, 'Mean '),
    `Mean ${wrong.model.mean.toFixed(2)} · reference ${wrong.model.correct}`,
  );
  assert.equal(
    line(wrong.labels, 'Wrong padding: '),
    `Wrong padding: invalid lane contributions [${wrong.model.terms.slice(5).join(', ')}] · mean ${wrong.model.mean.toFixed(2)} vs reference ${wrong.model.correct.toFixed(2)}`,
  );

  const corrected = paintTail(1, 0.9);
  assert.deepEqual(corrected.model.terms.slice(5), [0, 0, 0]);
  assert.equal(
    line(corrected.labels, 'Mean '),
    `Mean ${corrected.model.mean.toFixed(2)} · reference ${corrected.model.correct}`,
  );
  assert.equal(
    line(corrected.labels, 'Invalid lanes contribute zero'),
    'Invalid lanes contribute zero · divisor remains the logical width',
  );
});
