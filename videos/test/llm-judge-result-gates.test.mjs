import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/llm-judge.mjs';
import { contracts } from './fixtures/result-contracts/judge.mjs';
const lesson = await readLesson(
  new URL('../lessons/llm-judge.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(c, progress) {
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
  if (c.cue === 'fresh-identity')
    for (const id of ['fresh-tie', 'fresh-tie-complete'])
      cues[id] = { phase: 'before', progress: 0, strength: 0, active: false };
  cues[c.cue] = {
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    progress,
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
      beat: c.beat,
      beatP: 0.75,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    draw,
  );
}
for (const c of contracts)
  test(`${c.scene}: ${c.cue} waits for the completed relevant clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(c.has(paint(c, p)), false, `${c.cue} at ${p}`);
    assert.equal(
      c.has(paint(c, 1)),
      true,
      'complete numeric result or decision is actually painted',
    );
  });
test('the complete hypothetical tie clause has a visible neutral target before its later tie input', () => {
  const scene = lesson.scenes.find((s) => s.id === 'fresh-decision'),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((q) => [
          q.id,
          { ...q, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  cues['fresh-tie-complete'] = {
    phase: 'during',
    progress: 0.15,
    strength: 1,
    active: true,
    targets: ['fresh-tie'],
    color: 'pink',
  };
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    {
      t: 35,
      duration: 100,
      opacity: 1,
      beat: 0,
      beatP: 0.7,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    draw,
  );
  assert(!a.issues.some((i) => i.type === 'missing-focus-target'));
  assert(!a.labels.some((l) => l.text === 'Change reversed verdict only to tie → unresolved'));
});
