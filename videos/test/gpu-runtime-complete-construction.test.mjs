import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  runtimeFreshState,
  bucketFor,
  sampleRuntimeChapter,
} from '../animations/gpu-runtime-execution-lab.mjs';
registerLessonFonts();
async function fixture(id) {
  const lesson = await readRepositoryLesson('videos/lessons/gpu-runtime-execution-lab.lesson.yaml'),
    index = lesson.scenes.findIndex((s) => s.id === id),
    scene = lesson.scenes[index],
    sounds = scene.beats.map((b) => {
      const words = b.say.split(/\s+/);
      return {
        duration: words.length / 2.5,
        words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { lesson, scene, index, timing };
}
function labels(f, time) {
  const c = createCanvas(1920, 1080),
    a = drawFrame(
      c.getContext('2d'),
      f.lesson,
      f.scene,
      frameState(f.timing, time, f.index, f.lesson.scenes.length),
      draw,
    );
  return a.labels.map((l) => l.text);
}
test('fresh graph storage changes content and mask without changing allocation identities', () => {
  const states = [
    runtimeFreshState(),
    runtimeFreshState({ copy: true }),
    runtimeFreshState({ copy: true, mask: true }),
  ];
  assert.deepEqual(
    states.map((s) => s.total),
    [164, 28, 27],
  );
  assert.deepEqual(
    states.map((s) => [s.allocation, s.maskAllocation, s.outputAllocation]),
    Array(3).fill(['A', 'M', 'O']),
  );
  assert.deepEqual(states[2].squares, [1, 1, 25, 1]);
});
test('capacity selection requires a fitting bucket rather than rounding beyond the retained pool', () => {
  assert.equal(bucketFor(6), 8);
  assert.equal(bucketFor(16), 16);
  assert.equal(bucketFor(17), null);
});
test('amortization equality cost waits for its complete numeric clause', async () => {
  const f = await fixture('amortization-rule'),
    cue = f.timing.visualCues.find((c) => c.id === 'gr-amortization-rule-b1-s2');
  assert(!labels(f, cue.end - 1 / 30).some((v) => v.includes('both 36 ms')));
  assert(labels(f, cue.end + 1 / 30).some((v) => v.includes('both 36 ms')));
});
test('legacy dependent interval is withheld until the full computed interval is spoken', async () => {
  const f = await fixture('default-streams'),
    cue = f.timing.visualCues.find((c) => c.id === 'gr-default-streams-b2-s1');
  assert(!labels(f, cue.end - 1 / 30).includes('3→5'));
  assert(labels(f, cue.end + 1 / 30).includes('3→5'));
});
test('fresh masked answer stays covered through its full sentence at arbitrary times', async () => {
  const f = await fixture('fresh-four-slot'),
    cue = f.timing.visualCues.find((c) => c.id === 'gr-fresh-four-slot-b2-s1');
  for (const p of [0, 0.1, 0.5, 0.99])
    assert(!labels(f, cue.start + (cue.end - cue.start) * p).includes('Valid sum 1 + 1 + 25 = 27'));
  assert(labels(f, cue.end + 1 / 30).includes('Valid sum 1 + 1 + 25 = 27'));
  const state = {
    beat: 2,
    beatP: 0.9,
    cues: {
      'gr-fresh-four-slot-b2-s0': { phase: 'after', progress: 1 },
      'gr-fresh-four-slot-b2-s1': { phase: 'before', progress: 0 },
    },
  };
  assert.equal(sampleRuntimeChapter('fresh-four-slot', state).maskedReady, false);
});
test('a CPU receipt waits for the complete device-completion instruction', async () => {
  const f = await fixture('pointers'),
    cue = f.timing.visualCues.find((c) => c.id === 'pointer-cpu-complete');
  assert(!labels(f, cue.end - 1 / 30).includes('CPU-1 read receipt: 4'));
  const read = labels(f, cue.end + 0.3);
  assert(read.includes('CPU-1 read receipt: 4'));
  assert(read.includes('Replay 2 eligible'));
  assert(!read.includes('Replay 2 waits for read'));
});
test('the missing wait and missing lifetime cases visibly change different edges', async () => {
  const f = await fixture('allocator-lifetime'),
    first = f.timing.visualCues.find((c) => c.id === 'gr-allocator-lifetime-b1-s0'),
    second = f.timing.visualCues.find((c) => c.id === 'gr-allocator-lifetime-b1-s1');
  const a = labels(f, first.end + 1 / 30);
  assert(a.includes('Producer wait missing'));
  assert(a.includes('Allocator retains A for side-stream use'));
  const b = labels(f, second.end - 1 / 30);
  assert(b.includes('Producer wait installed'));
  assert(b.includes('A released · lifetime protection missing'));
});
test('a missing captured branch join cannot claim a complete executable graph', async () => {
  const f = await fixture('capture-frontier'),
    cue = f.timing.visualCues.find((c) => c.id === 'gr-capture-frontier-b0-s2');
  const shown = labels(f, cue.end + 1 / 30);
  assert(shown.includes('Missing C join · capture invalid'));
  assert(!shown.some((v) => v.includes('Both event branches rejoined')));
});
test('publication does not identify a free slot as the old live request', async () => {
  const f = await fixture('persistent-publication'),
    cue = f.timing.visualCues.find((c) => c.id === 'gr-persistent-publication-b1-s1');
  const shown = labels(f, cue.end + 1 / 30);
  assert(shown.includes('Slot S0 · empty · last generation G1'));
  assert(!shown.includes('Slot S0 · generation G1 · request R1'));
});
test('capacity dispatch keeps its moving request copy clear of the request panel', async () => {
  const f = await fixture('compatible-dispatch'),
    cue = f.timing.visualCues.find((c) => c.id === 'gr-compatible-dispatch-b0-s1'),
    canvas = createCanvas(1920, 1080);
  for (let i = 0; i <= 120; i++) {
    const time = cue.start + ((cue.end - cue.start) * i) / 120,
      audit = drawFrame(
        canvas.getContext('2d'),
        f.lesson,
        f.scene,
        frameState(f.timing, time, f.index, f.lesson.scenes.length),
        draw,
      );
    assert.deepEqual(
      [...(audit.issues ?? []), ...layoutIssues(audit)],
      [],
      `Dispatch progress ${i}/120 crosses a panel`,
    );
  }
});
