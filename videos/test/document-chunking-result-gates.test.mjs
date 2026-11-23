import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/document-chunking.mjs';
import { contracts } from './fixtures/result-contracts/chunking.mjs';
const lesson = await readLesson(
    new URL('../lessons/document-chunking.lesson.yaml', import.meta.url).pathname,
    new URL('../..', import.meta.url).pathname,
  ),
  scene = lesson.scenes.find((s) => s.id === 'earned-transfer');
registerLessonFonts();
function paint(c, p) {
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      (b.visual_cues ?? []).map((q) => [
        q.id,
        {
          ...q,
          phase: i < 1 ? 'after' : 'before',
          progress: i < 1 ? 1 : 0,
          strength: 0,
          active: false,
        },
      ]),
    ),
  );
  const operation =
    c.cue === 'fresh-insufficient-result'
      ? 'fresh-budget-cut'
      : c.cue === 'fresh-parent-result'
        ? 'fresh-parent-repair'
        : null;
  if (operation) cues[operation] = { phase: 'after', progress: 1, strength: 0, active: false };
  cues[c.cue] = {
    phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
    progress: p,
    strength: 0,
    active: false,
  };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    {
      t: 35,
      duration: 100,
      opacity: 1,
      beat: 1,
      beatP: 0.75,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    draw,
  );
}
for (const c of contracts)
  test(`${c.cue}: supplied construction remains while verdict waits for the full qualification`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(c.has(paint(c, p)), false, `${c.cue} at ${p}`);
    assert.equal(c.has(paint(c, 1)), true);
  });
