import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw as sqlDraw } from '../animations/sql-databases-data-modeling-ai.mjs';
import { draw as cudaDraw } from '../animations/cuda-execution.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
registerLessonFonts();
const canvas = createCanvas(1920, 1080),
  after = { phase: 'after', progress: 1 },
  during = { phase: 'during', progress: 0.99 },
  before = { phase: 'before', progress: 0 };
async function paint(id, sceneId, overrides) {
  const lesson = await readLesson(root + 'videos/lessons/' + id + '.lesson.yaml', root),
    scene = lesson.scenes.find((s) => s.id === sceneId);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b) =>
      (b.visual_cues ?? []).map((c) => [c.id, { ...c, ...before, active: false, strength: 0 }]),
    ),
  );
  for (const [id, state] of Object.entries(overrides))
    cues[id] = {
      ...cues[id],
      ...state,
      active: state.phase === 'during',
      strength: state.phase === 'during' ? 1 : 0,
    };
  const audit = drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { t: 5, duration: 100, opacity: 1, beat: 1, beatP: 0.8, cueTiming: 'provider-words', cues },
    id === 'cuda-execution' ? cudaDraw : sqlDraw,
  );
  return Object.assign(
    audit.labels.map((l) => l.text),
    { issues: audit.issues },
  );
}

test('the SQL returned citation waits for the entire spoken numerical clause while supplied candidates remain visible', async () => {
  const pending = await paint('sql-databases-data-modeling-ai', 'closing', {
    'reveal-final-citation': during,
  });
  assert(pending.includes('Return items within fourteen days.'));
  assert(!pending.includes('Return Policy · d7-next · c7c'));
  assert.deepEqual(pending.issues, []);
  const ready = await paint('sql-databases-data-modeling-ai', 'closing', {
    'reveal-final-citation': after,
  });
  assert(ready.includes('Return Policy · d7-next · c7c'));
});

test('CUDA keeps the earned denominator operation while withholding its completed answer and result color', async () => {
  const cues = {
    'final-tail': after,
    'final-sums': after,
    'final-divide': after,
    'final-report': before,
  };
  const pending = await paint('cuda-execution', 'transfer', {
    ...cues,
    'final-numeric-result': during,
  });
  assert(pending.includes('\\frac{10+11+6}{10}'));
  assert(!pending.some((s) => s.includes('=2.7')));
  const ready = await paint('cuda-execution', 'transfer', {
    ...cues,
    'final-numeric-result': after,
  });
  assert(ready.includes('\\frac{10+11+6}{10}=2.7'));
  assert(ready.includes('Python report awaits completion'));
});
