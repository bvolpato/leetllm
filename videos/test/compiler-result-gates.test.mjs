import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/gpu-compilers-kernel-languages.mjs';
import { contracts } from './fixtures/result-contracts/compiler.mjs';
const lesson = await readLesson(
  new URL('../lessons/gpu-compilers-kernel-languages.lesson.yaml', import.meta.url).pathname,
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
  let spillInk, unfilledBackground;
  const receiver = (ctx, s, state, api) =>
    draw(ctx, s, state, {
      ...api,
      text(...args) {
        if (args[1] === 'spill storage') {
          spillInk = args[5];
          unfilledBackground = api.C.panel;
        }
        return api.text(...args);
      },
    });
  const audit = drawFrame(
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
    receiver,
  );
  return { ...audit, spillInk, unfilledBackground };
}
for (const c of contracts)
  test(`${c.scene}: ${c.cue} waits for the complete clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(c.has(paint(c, p)), false, `${c.cue} at ${p}`);
    assert.equal(c.has(paint(c, 1)), true, 'actual completed result is painted');
  });
test('spill storage remains readable before its blue backing reaches the label', () => {
  for (const p of [0.01, 0.1, 0.5]) {
    const a = paint({ scene: 'spill-workload', beat: 2, cue: 'shared-spill' }, p);
    assert(a.labels.some((l) => l.text === 'spill storage'));
    assert.notEqual(
      a.spillInk,
      a.unfilledBackground,
      'actual foreground must contrast with the unfilled panel',
    );
  }
});
test('the active total clause has a truthful pending focus before its numeric result', () => {
  const a = paint({ scene: 'spill-workload', beat: 0, cue: 'spill-total' }, 0.5, true);
  assert(!a.issues.some((i) => i.type === 'missing-focus-target'));
  assert(a.labels.some((l) => l.text === 'Requested byte total pending'));
  assert(!a.labels.some((l) => l.text.includes('=160')));
});
