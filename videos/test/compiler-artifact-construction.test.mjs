import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  liveSlots,
  tailSummary,
  recipeDigest,
  coldPhases,
} from '../animations/gpu-compilers-kernel-languages.mjs';

const lesson = await readLesson(
  new URL('../lessons/gpu-compilers-kernel-languages.lesson.yaml', import.meta.url),
  new URL('../../', import.meta.url).pathname,
);
registerLessonFonts();
function paint(id, beat, after = []) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats
        .flatMap((b) => b.visual_cues ?? [])
        .map((cue) => [
          cue.id,
          {
            phase: after.includes(cue.id) ? 'after' : 'before',
            progress: after.includes(cue.id) ? 1 : 0,
          },
        ]),
    );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.5, opacity: 1, t: 1, duration: 100, cues },
    draw,
  );
}
test('extending one lifetime raises actual simultaneous demand rather than counting virtual names', () => {
  assert.deepEqual(liveSlots().counts, [1, 1, 2, 2, 2, 2, 2, 1]);
  assert.deepEqual(liveSlots(true).counts, [1, 1, 2, 2, 3, 3, 2, 1]);
  assert.equal(Math.max(...liveSlots().counts), 2);
  assert.equal(Math.max(...liveSlots(true).counts), 3);
});
test('safe tail arithmetic handles an empty launch and the signed-int32 overflow boundary without allocation', () => {
  assert.deepEqual(tailSummary(0, 128), {
    n: 0,
    block: 128,
    blocks: 0,
    positions: 0,
    valid: 0,
    masked: 0,
    lastValid: 0,
  });
  const fresh = tailSummary(769, 128);
  assert.equal(fresh.blocks, 7);
  assert.equal(fresh.positions, 896);
  assert.equal(fresh.lastValid, 1);
  assert.equal(fresh.masked, 127);
  const limit = tailSummary(2147483647, 256);
  assert.equal(limit.blocks, 8388608);
  assert.equal(limit.positions, 2147483648);
  assert.equal(limit.masked, 1);
  assert.throws(() => tailSummary(1, 0));
  assert.throws(() => tailSummary(-1, 128));
});
test('removing JIT preserves all remaining cold phases on the same clock', () => {
  const cold = coldPhases(),
    native = coldPhases(true);
  assert.equal(cold.at(-1).end, 78);
  assert.equal(native.at(-1).end, 18);
  assert.deepEqual(
    native.map((p) => p.id),
    cold.filter((p) => p.id !== 'PTX JIT').map((p) => p.id),
  );
  for (const phases of [cold, native])
    for (let i = 0; i < phases.length; i++) {
      assert.equal(phases[i].end - phases[i].start, phases[i].duration);
      assert.equal(phases[i].start, i ? phases[i - 1].end : 0);
    }
});
test('a cooperating recheck visibly removes the second compilation instead of changing only its caption', () => {
  const before = paint('cache-cooperation', 1, ['duplicate-builds']),
    after = paint('cache-cooperation', 1, ['duplicate-builds', 'recheck-key']);
  assert.equal(before.labels.filter((l) => l.text === 'compile complete bytes').length, 2);
  assert.equal(after.labels.filter((l) => l.text === 'compile complete bytes').length, 1);
  assert(after.labels.some((l) => l.text === 'wait for cooperating lock'));
  assert(after.labels.some((l) => l.text === 'recheck → HIT'));
});
test('native sum and fresh tail answers are withheld until their own operations', () => {
  const before = paint('captured-native', 1, ['capture-inputs', 'load-r4']),
    after = paint('captured-native', 1, ['capture-inputs', 'load-r4', 'add-r9']);
  assert(!before.labels.some((l) => l.text === 'R9 = -1.75'));
  assert(after.labels.some((l) => l.text === 'R9 = -1.75'));
  const held = paint('first-failing-boundary', 2, ['fresh-premises']),
    revealed = paint('first-failing-boundary', 2, ['fresh-premises', 'fresh-seven']);
  assert(!held.labels.some((l) => l.text.includes('896 positions')));
  assert(revealed.labels.some((l) => l.text === '7 × 128 = 896 positions'));
});
test('complete recipe identity distinguishes ordered flags and equal-count changed addressing', () => {
  const baseline = recipeDigest();
  assert.equal(recipeDigest({ shape: [1000] }), baseline);
  assert.notEqual(recipeDigest({ stride: [2] }), baseline);
  assert.notEqual(recipeDigest({ flags: ['-lineinfo', '-O3'] }), baseline);
  assert.notEqual(recipeDigest({ target: 'sm_90' }), baseline);
});
