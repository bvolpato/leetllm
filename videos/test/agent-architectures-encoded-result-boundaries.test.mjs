import assert from 'node:assert/strict';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const { draw } = await import(
  process.env.AGENT_RESULT_SOURCE
    ? pathToFileURL(process.env.AGENT_RESULT_SOURCE)
    : new URL('../animations/agent-architectures.mjs', import.meta.url)
);
const lesson = await readLesson(
  process.env.AGENT_RESULT_LESSON ??
    new URL('../lessons/agent-architectures.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function fixture(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    sounds = scene.beats.map((b, beatIndex) => {
      const words = b.say.trim().split(/\s+/);
      return {
        beatIndex,
        duration: words.length * 0.4,
        words: words.map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    );
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { scene, timing, sounds };
}
function clause(f, beat, phrase) {
  const s = structuredClone(f.scene);
  s.beats.forEach((b) => delete b.visual_cues);
  s.beats[beat].visual_cues = [{ id: 'independent-clause', phrase, targets: ['fixture'] }];
  return resolveSceneCues(s, f.timing, f.sounds)[0];
}
function paint(f, time) {
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    f.scene,
    frameState(f.timing, time, 0, 1),
    draw,
  );
  return a.labels.filter((l) => l.alpha > 0.1).map((l) => l.text);
}
const has = (labels, text) => labels.some((l) => l.includes(text));
test('CI conclusion waits for its whole actual conclusion, retaining completed read facts', () => {
  const f = fixture('ci-policy'),
    c = clause(f, 0, 'review migration semantics; no write performed'),
    before = paint(f, c.end - 0.001),
    after = paint(f, c.end + 0.001);
  assert(!has(before, 'Review migration semantics · no write performed'));
  assert(has(before, 'fact: migration failed') && has(before, 'fact: unguarded add'));
  assert(has(after, 'Review migration semantics · no write performed'));
});
test('existence-only PASS waits for its false-pass clause, then the strict evaluator still rejects', () => {
  const f = fixture('reflexion-feedback'),
    c = clause(f, 1, 'existence-only evaluator falsely passes it'),
    strict = clause(f, 1, 'revision-aware evaluator fails that same selection'),
    before = paint(f, c.end - 0.001);
  assert(!has(before, 'exists-only: PASS'));
  assert(has(before, 'old-run · c1841'));
  assert(has(paint(f, c.end + 0.001), 'exists-only: PASS'));
  assert(has(paint(f, strict.end + 0.001), 'revision-aware: FAIL'));
});
test('changed release is a distinct same-key attempt beside the preserved accepted record', () => {
  const f = fixture('lost-reply'),
    input = clause(f, 1, 'Reusing that key for an approved R twenty ninety-nine payload'),
    conflict = clause(f, 1, 'mismatch conflict'),
    count = clause(f, 1, 'proposal count is one');
  assert(!has(paint(f, input.start - 0.001), 'R2099'));
  const during = paint(f, (input.start + input.end) / 2);
  assert(has(during, 'New attempt · R2099'));
  assert(has(during, 'release-bot · R2099 · c1841'));
  assert(has(during, 'RB2041 · R1842 · c1841'));
  assert(has(during, 'Attempt: same operation-17'));
  assert(!has(during, 'same key → conflict'));
  const before = paint(f, conflict.end - 0.001);
  assert(has(before, 'pending'));
  assert(!has(before, 'same key → conflict'));
  const after = paint(f, conflict.end + 0.001);
  assert(has(after, 'Changed approved payload + same key → conflict'));
  assert(has(after, 'RB2041 · R1842 · c1841'));
  assert(has(paint(f, count.end + 0.001), 'Proposal ledger count = 1'));
});
