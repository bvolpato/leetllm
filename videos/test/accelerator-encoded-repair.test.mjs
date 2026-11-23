import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const { draw } = await import(
  process.env.ACCELERATOR_REPAIR_SOURCE ?? '../animations/accelerator-architecture-field-guide.mjs'
);
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  root + 'videos/lessons/accelerator-architecture-field-guide.lesson.yaml',
  root,
);
function paint(id, beat, overrides) {
  const scene = lesson.scenes.find((s) => s.id === id);
  const cues = Object.fromEntries(
    scene.beats
      .flatMap((b) => b.visual_cues ?? [])
      .map((c) => [
        c.id,
        {
          id: c.id,
          phase: 'after',
          progress: 1,
          reveal: 1,
          active: false,
          strength: 0,
          targets: [],
          ...overrides[c.id],
        },
      ]),
  );
  const canvas = createCanvas(1920, 1080);
  const result = drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    {
      t: 20,
      duration: 60,
      opacity: 1,
      beat,
      beatP: 0.99,
      cues,
      cueTiming: 'provider-words',
    },
    draw,
  );
  return { result, pixel: [...canvas.getContext('2d').getImageData(355, 415, 1, 1).data] };
}
test('joint request answer and colors wait for the complete intersection clause', () => {
  const id = 'gates-beat-2-focus-1';
  const before = paint('gates', 1, { [id]: { phase: 'before', progress: 0 } });
  const during = paint('gates', 1, { [id]: { phase: 'during', progress: 0.99 } });
  const after = paint('gates', 1, { [id]: { phase: 'after', progress: 1 } });
  for (const { result } of [before, during]) {
    assert(!result.labels.some((l) => l.text.includes('18 / 20') || l.text.includes('90%')));
    assert(!result.labels.some((l) => l.text === 'BOTH ON THE SAME REQUEST'));
  }
  assert(after.result.labels.some((l) => l.text === '18 / 20 = 90%'));
  assert.deepEqual(
    during.pixel,
    before.pixel,
    'R2 keeps its first-predicate color until the intersection completes',
  );
  assert.notDeepEqual(
    after.pixel,
    before.pixel,
    'R2 changes to its excluded joint state after completion',
  );
});
test('completed output physically returns through SBUF before HBM', () => {
  const id = 'ag-nki-lifetimes-store';
  const partial = paint('nki-lifetimes', 1, { [id]: { phase: 'during', progress: 0.5 } }).result;
  const staged = partial.shapes.find((s) => s.width === 330 && s.height === 85 && s.y === 835);
  assert(
    staged && staged.x >= 730 && staged.x + staged.width <= 1190,
    'completed Y must be inspectable under SBUF',
  );
  assert(partial.labels.some((l) => l.text === 'Completed Y'));
  const after = paint('nki-lifetimes', 1, { [id]: { phase: 'after', progress: 1 } }).result;
  const stored = after.shapes.find((s) => s.width === 330 && s.height === 85 && s.y === 835);
  assert(
    stored && stored.x >= 130 && stored.x + stored.width <= 590,
    'completed Y reaches HBM only after the store operation',
  );
});
