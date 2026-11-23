import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/prefix-reuse.mjs';
import { contracts } from './fixtures/result-contracts/prefix.mjs';
const lesson = await readLesson(
  new URL('../lessons/prefix-reuse.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(c, progress, active = false) {
  const scene = lesson.scenes.find((s) => s.id === c.scene),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((q) => [
          q.id,
          {
            ...q,
            phase: i <= c.beat ? 'after' : 'before',
            progress: i <= c.beat ? 1 : 0,
            strength: 0,
            active: false,
          },
        ]),
      ),
    );
  for (const id of c.reset ?? [])
    cues[id] = { phase: 'before', progress: 0, strength: 0, active: false };
  cues[c.cue] = {
    ...cues[c.cue],
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    progress,
    strength: active ? 1 : 0,
    active,
  };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    {
      t: 35,
      duration: 100,
      opacity: 1,
      beat: c.beat,
      beatP: 0.75,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    draw,
  );
}
for (const c of contracts)
  test(`${c.scene}: ${c.cue} waits for its complete clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(c.has(paint(c, p)), false, `${c.cue} at ${p}`);
    assert.equal(c.has(paint(c, 1)), true, 'actual completed result is painted');
  });
test('withheld results retain actual geometry for their active declared targets', () => {
  for (const c of contracts) {
    const a = paint(c, 0.5, true);
    assert(!a.issues.some((i) => i.type === 'missing-focus-target'), c.cue);
  }
});
