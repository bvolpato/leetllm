import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, eventOrder } from '../animations/multimodal-fusion.mjs';
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/multimodal-fusion.lesson.yaml', root);
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => {
          const progress = overrides[c.id] ?? (i < beat ? 1 : i > beat ? 0 : 0.5);
          return [
            c.id,
            {
              id: c.id,
              phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
              progress,
              active: false,
              strength: 0,
              targets: c.targets,
            },
          ];
        }),
      ),
    );
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 30, duration: 80, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'provider-words' },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame.labels.map((l) => l.text);
}
test('fresh capacity answers follow their own completed calculation while the prediction stays covered', () => {
  const prediction = paint('fresh-incident', 0, { 'mm-fresh-incident-0': 1 });
  assert(!prediction.some((s) => /6,152|2,184|273 MiB/.test(s)));
  const direct = paint('fresh-incident', 1, {
    'mm-fresh-direct': 1,
    'mm-fresh-reduced': 0,
    'mm-fresh-cache': 0,
  });
  assert(direct.includes('6,152 · REJECT'));
  assert(!direct.some((s) => s.includes('2,184') || s.includes('273 MiB')));
  const reduced = paint('fresh-incident', 1, {
    'mm-fresh-direct': 1,
    'mm-fresh-reduced': 1,
    'mm-fresh-cache': 0,
  });
  assert(reduced.includes('2,184 · FIT'));
  assert(!reduced.some((s) => s.includes('273 MiB')));
  assert(
    paint('fresh-incident', 1, {
      'mm-fresh-direct': 1,
      'mm-fresh-reduced': 1,
      'mm-fresh-cache': 1,
    }).includes('Full reduced logical KV: 273 MiB'),
  );
});
test('capacity fit does not reveal the repaired chronology before restored evidence completes', () => {
  const missing = paint('fresh-incident', 2, { 'mm-fresh-order': 0.99 });
  assert(missing.includes('Required legend absent'));
  assert(missing.includes('Budget success still leaves the answer unsupported'));
  assert(!missing.some((s) => s.includes('220 < 221')));
  const restored = paint('fresh-incident', 2, { 'mm-fresh-order': 1 });
  assert(restored.includes('Legend restored by verified extraction'));
  assert(restored.includes('220 < 221 → chart rise follows deploy'));
});
test('the shared-softmax result and masking repair are distinct completed operations', () => {
  const constructing = paint('zero-insertion', 1, {
    'mm-shared-result': 0.99,
    'mm-mask-repair': 0,
  });
  assert(!constructing.includes('0.5 × 2 + 0.5 × 0 = 1'));
  const shared = paint('zero-insertion', 1, { 'mm-shared-result': 1, 'mm-mask-repair': 0 });
  assert(shared.includes('0.5 × 2 + 0.5 × 0 = 1'));
  const masked = paint('zero-insertion', 1, { 'mm-shared-result': 1, 'mm-mask-repair': 1 });
  assert(masked.includes('Mask restores the text read: 2'));
  assert(masked.includes('weight 1.0') && masked.includes('weight 0.0'));
});
test('inclusive event bounds require a strict gap in either direction', () => {
  for (const shift of [-1000, 0, 5000]) {
    assert.equal(eventOrder([10 + shift, 20 + shift], [20 + shift, 30 + shift]), 'unresolved');
    assert.equal(eventOrder([10 + shift, 20 + shift], [21 + shift, 30 + shift]), 'after');
    assert.equal(eventOrder([21 + shift, 30 + shift], [10 + shift, 20 + shift]), 'before');
    assert.equal(eventOrder([10 + shift, 30 + shift], [15 + shift, 20 + shift]), 'unresolved');
  }
});

test('patch copies can leave the open sampling grid at the measured provider boundary', () => {
  const scene = lesson.scenes.find((s) => s.id === 'patches');
  for (const beatP of [0.05, 0.15, 0.2976587199863281, 0.3, 0.45, 0.6, 0.7, 0.8253012048192772]) {
    const frame = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      { t: 33.266666666666664, duration: 44.53333333333333, opacity: 1, beat: 2, beatP },
      draw,
    );
    assert.deepEqual(layoutIssues(frame), []);
    const copies = frame.shapes.filter((s) => s.kind === 'circle' && s.width === 12);
    assert.equal(copies.length, 3);
    if (beatP >= 0.7)
      copies.forEach((copy, index) => {
        assert(Math.abs(copy.center.x - (1300 + index * 160)) < 1e-9);
        assert(Math.abs(copy.center.y - 841) < 1e-9);
      });
  }
});
