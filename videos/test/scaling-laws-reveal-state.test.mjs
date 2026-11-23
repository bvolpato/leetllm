import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/scaling-laws.mjs';
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname,
  lesson = await readLesson(root + 'videos/lessons/scaling-laws.lesson.yaml', root);
function paint(id, beat, p = 1) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          {
            id: c.id,
            phase: i < beat ? 'after' : i > beat ? 'before' : p === 1 ? 'after' : 'during',
            progress: i < beat ? 1 : i > beat ? 0 : p,
            active: false,
            strength: 0,
            targets: [],
          },
        ]),
      ),
    );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 30, duration: 80, opacity: 1, beat, beatP: p, cues, cueTiming: 'provider-words' },
    draw,
  );
}
test('fresh plotted answers wait for complete spoken calculation and constraint construction', () => {
  const prediction = paint('fresh-allocation', 0);
  assert(!prediction.labels.some((l) => l.text.includes('loss 2.549')));
  const calculating = paint('fresh-allocation', 1, 0.5);
  assert(!calculating.labels.some((l) => l.text.includes('loss 2.549')));
  assert(paint('fresh-allocation', 1).labels.some((l) => l.text.includes('loss 2.549')));
  assert(!paint('fresh-allocation', 2, 0.5).labels.some((l) => l.text.includes('loss 2.581')));
  assert(paint('fresh-allocation', 2).labels.some((l) => l.text.includes('loss 2.581')));
});
test('the throughput probe preserves the completed residual and partial bars say what is partial', () => {
  assert(paint('mid-scale-gate', 0, 0.5).labels.some((l) => l.text === 'Observation pending'));
  assert(
    !paint('mid-scale-gate', 0, 0.5).labels.some((l) => l.text.startsWith('Absolute residual ')),
  );
  assert(paint('mid-scale-gate', 1, 0.5).labels.some((l) => l.text.startsWith('Gap bar drawn ')));
  assert(
    !paint('mid-scale-gate', 1, 0.5).labels.some((l) => l.text.startsWith('Absolute residual ')),
  );
  assert(paint('mid-scale-gate', 2, 0.2).labels.some((l) => l.text === 'Absolute residual 0.040'));
});

test('the coefficient allocation labels use the same full counts as its endpoint', () => {
  for (const p of [0, 0.2, 0.5, 0.8, 1]) {
    const n = 2000 / (2 + 6 * p),
      d = 1e6 / n,
      a = paint('general-allocation', 3, p);
    assert(
      a.labels.some((l) => l.text === `N ${n.toFixed(2)}`),
      'Rectangle parameter label must report its full count',
    );
    assert(
      a.labels.some((l) => l.text === `D ${d.toFixed(2)}`),
      'Rectangle presentation label must report its full count',
    );
    assert(
      a.shapes.some(
        (s) =>
          s.x === 260 &&
          Math.abs(s.width - n * 0.12) < 1e-9 &&
          Math.abs(s.height - d * 0.12) < 1e-9,
      ),
      'The existing area-preserving rectangle geometry must remain',
    );
  }
});
