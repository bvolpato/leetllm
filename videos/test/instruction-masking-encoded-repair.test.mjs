import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
const m = await import(
  process.env.INSTRUCTION_ANIMATION_PATH
    ? pathToFileURL(process.env.INSTRUCTION_ANIMATION_PATH)
    : new URL('../animations/instruction-masking.mjs', import.meta.url)
);
registerLessonFonts();
const lesson = parse(
  fs.readFileSync(new URL('../lessons/instruction-masking.lesson.yaml', import.meta.url), 'utf8'),
);
function paint(id, beat, patch = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  scene.beats.forEach((b, i) =>
    (b.visual_cues ?? []).forEach((c) => {
      const x =
        patch[c.id] ??
        (i < beat ? { phase: 'after', progress: 1 } : { phase: 'before', progress: 0 });
      cues[c.id] = {
        ...c,
        ...x,
        reveal: x.phase === 'after' ? 1 : x.phase === 'during' ? x.progress : 0,
        strength: 0,
        active: false,
      };
    }),
  );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.5, t: 1, duration: 80, opacity: 1, cues, cueTiming: 'provider-words' },
    m.draw,
  );
}
test('a revealed negative logarithm always equals its unchanged probability, including intermediate bar states', () => {
  const expected = m.lossTerms().terms.map((v) => '−ln(p) = ' + v.toFixed(3));
  for (const q of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
    const phase = q === 0 ? 'before' : q === 1 ? 'after' : 'during',
      f = paint('loss-construction', 1, { 'im-loss-probabilities': { phase, progress: q } });
    for (const label of f.labels.filter((x) => x.text.startsWith('−ln(p) ='))) {
      const column = Math.round((label.x - 210) / 560);
      assert.equal(label.text, expected[column]);
    }
  }
});
test('the held lexical prediction shows premises without completed checks or a pass conclusion', () => {
  const f = paint('source-review', 0);
  assert(
    !f.labels.some(
      (x) =>
        x.text.includes('✓') ||
        x.text.includes('lexical screen: PASS') ||
        x.text.includes('can pass every required substring'),
    ),
  );
  assert(f.labels.some((x) => x.text.includes('Required: fourteen days')));
  assert(f.labels.some((x) => x.text.includes('Row 005')));
});
test('lexical checks are constructed during the answer and PASS waits for the completed verdict', () => {
  const partial = paint('source-review', 1, {
    'source-review-lexical-result': { phase: 'during', progress: 0.5 },
  });
  assert(partial.labels.some((x) => x.text.includes('✓')));
  assert(!partial.labels.some((x) => x.text === 'lexical screen: PASS'));
  const complete = paint('source-review', 1, {
    'source-review-lexical-result': { phase: 'after', progress: 1 },
  });
  assert.equal(complete.labels.filter((x) => x.text.includes('✓')).length, 3);
  assert(complete.labels.some((x) => x.text === 'lexical screen: PASS'));
});
