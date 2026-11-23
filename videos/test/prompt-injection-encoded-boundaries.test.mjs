import assert from 'node:assert/strict';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const { draw, localPromotionCases } = await import(
  process.env.PINJ_RESULT_SOURCE
    ? pathToFileURL(process.env.PINJ_RESULT_SOURCE)
    : new URL('../animations/prompt-injection.mjs', import.meta.url)
);
const lesson = await readLesson(
  new URL('../lessons/prompt-injection.lesson.yaml', import.meta.url).pathname,
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
  assert.deepEqual(a.issues, []);
  return a.labels.filter((l) => l.alpha > 0.25).map((l) => l.text);
}
const has = (labels, text) => labels.some((l) => l.includes(text));
test('missing approval retains the original candidate while its denial is pending', () => {
  const f = fixture('host-policy'),
    c = clause(f, 1, 'and C17 stays in shadow at revision three');
  for (const time of [f.timing.beats[1].start + 0.5, c.end - 0.001]) {
    const l = paint(f, time);
    assert(!has(l, 'DENY · missing approval'));
    assert(!has(l, 'Denied attempt retained; no candidate state changed'));
    assert(has(l, 'Required checks pending'));
    assert(has(l, 'C17 · shadow'));
    assert(has(l, 'Revision 3'));
    assert(has(l, 'Committed traffic: 0%'));
  }
  const l = paint(f, c.end + 0.001);
  assert(has(l, 'DENY · missing approval'));
  assert(has(l, 'Denied attempt retained; no candidate state changed'));
});
test('earlier approval checks cannot introduce either later target case', () => {
  const f = fixture('approval-bindings'),
    c = clause(
      f,
      1,
      'Switching to staging passes this fixture’s target allowlist but fails the approval’s target binding',
    );
  for (let time = f.timing.beats[1].start + 0.5; time < c.start; time += 0.3) {
    const l = paint(f, time);
    assert(!l.includes('staging'));
    assert(!l.includes('prod-100pct'));
    assert(!has(l, 'Staging target'));
    assert(!has(l, 'Disallowed 100% target'));
  }
});
test('staging is a current input before its own complete approval-binding diagnosis', () => {
  const f = fixture('approval-bindings'),
    c = clause(
      f,
      1,
      'Switching to staging passes this fixture’s target allowlist but fails the approval’s target binding',
    ),
    during = paint(f, (c.start + c.end) / 2);
  assert(during.includes('staging'));
  assert(!during.includes('prod-100pct'));
  assert(has(during, 'check pending'));
  assert(!has(during, 'first failed check'));
  const after = paint(f, c.end + 0.001);
  assert(has(after, 'first failed check: approval'));
  assert(after.includes('staging'));
});
test('the 100% target starts at its own input clause and earns its own target failure', () => {
  const f = fixture('approval-bindings'),
    c = clause(f, 1, 'Switching to a hundred-percent target fails the allowlist itself'),
    before = paint(f, c.start - 0.001),
    during = paint(f, (c.start + c.end) / 2);
  assert(!before.includes('prod-100pct'));
  assert(during.includes('prod-100pct'));
  assert(has(during, 'check pending'));
  assert(!has(during, 'first failed check'));
  assert(has(paint(f, c.end + 0.001), 'first failed check: target'));
});
test('the eight reference decisions and matching/replay ledger remain unchanged', () => {
  assert.deepEqual(
    localPromotionCases().map((c) => c.decision),
    ['approval', 'ownership', 'evaluation', 'approval', 'approval', 'target', 'approval', 'allow'],
  );
  const f = fixture('approval-bindings'),
    c = clause(
      f,
      2,
      'The matching tuple executes once into the local ledger and consumes its approval',
    ),
    r = clause(f, 2, 'A later replay finds no matching record and adds nothing');
  assert(has(paint(f, c.end + 0.001), 'Local ledger: 1 entry · APR-9 consumed'));
  assert(has(paint(f, r.end + 0.001), 'no second append'));
});
