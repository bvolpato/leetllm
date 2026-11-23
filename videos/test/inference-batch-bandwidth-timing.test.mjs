import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  draw,
  bandwidthPoint,
  sampleModel,
  validateModel,
} from '../animations/inference-batch-capacity.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = new URL('../../', import.meta.url).pathname;
async function bandwidthLabels(beat, beatP, overrides) {
  registerLessonFonts();
  const lesson = await readLesson(
    root + 'videos/lessons/inference-batch-capacity.lesson.yaml',
    root,
  );
  const scene = lesson.scenes.find((scene) => scene.id === 'bandwidth');
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      b.visual_cues.map((cue) => [
        cue.id,
        {
          ...cue,
          phase: i < beat ? 'after' : 'before',
          progress: i < beat ? 1 : 0,
          strength: 0,
          reveal: 1,
        },
      ]),
    ),
  );
  for (const [id, cue] of Object.entries(overrides))
    cues[id] = { ...cues[id], ...cue, strength: 0 };
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { beat, beatP, t: 0, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  ).labels;
}

test('batch eight is reached during its clause and retained through the explanation', async () => {
  for (const beatP of [0.01, 0.5, 0.99]) {
    const labels = await bandwidthLabels(1, beatP, {
      'batch-eight': { phase: 'during', progress: 0.98 },
    });
    assert(
      labels.some((label) => label.text === 'B = 8 · 32.0 ms / iteration · 250.0 tokens/s'),
      'Both computed markers and the readout must use B8 after the batch-eight cue.',
    );
  }
});

test('the larger sweep crosses forty milliseconds by the crosses clause, then holds', async () => {
  for (const beatP of [0.01, 0.5, 0.99]) {
    const labels = await bandwidthLabels(2, beatP, {
      'larger-batch-crossing': { phase: 'after', progress: 1 },
    });
    assert(labels.some((label) => label.text === 'B = 24 · 48.0 ms / iteration · 500.0 tokens/s'));
    assert(labels.some((label) => label.text === '8 ms over the limit'));
  }
});

test('the byte model, page rounding and selected operating point remain consistent', () => {
  validateModel();
  assert.equal(bandwidthPoint(16).ms, 40);
  assert.equal(bandwidthPoint(16).tps, 400);
  assert.equal(sampleModel('operating-point', { beat: 2, beatP: 0.9 }).selected.batch, 16);
  assert.equal(sampleModel('pages', { beat: 2, beatP: 0.9 }).waste, 18);
});
