import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { pathToFileURL } from 'node:url';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname,
  lesson = await readLesson(root + 'videos/lessons/rag-evaluation.lesson.yaml', root),
  model = await import(
    pathToFileURL(
      root + (process.env.RAGEVAL_TEST_SOURCE ?? 'videos/animations/rag-evaluation.mjs'),
    )
  ),
  canvas = createCanvas(1920, 1080);
const cases = [
  ['support-graph', 'support-result', (a) => a.some((t) => t.includes('\\frac12'))],
  ['aggregation', 'average-rates', (a) => a.includes('\\frac{1+0}{2}=0.50')],
  [
    'trace-integrity',
    'integrity-answer',
    (a) => a.includes('Full record mismatch → admissibility FAIL'),
  ],
  ['policy-ledger', 'policy-unsafe-score', (a) => a.includes('Faithfulness 1/2')],
  ['policy-ledger', 'rageval-unsafe-citation', (a) => a.includes('Cited support 1/2')],
  ['policy-ledger', 'rageval-unsafe-completeness', (a) => a.includes('Required points 1/3')],
  ['review-boundary', 'miscited-score', (a) => a.some((t) => t.includes('support}=0/3=0'))],
  [
    'regression-diagnosis',
    'regression-results',
    (a) => a.some((t) => t.startsWith('Six specified decisions: one release')),
  ],
  ['slice-release', 'rageval-freeze-count', (a) => a.includes('1/2 = 50%')],
  ['slice-release', 'rageval-hotfix-count', (a) => a.includes('2/2 = 100%')],
  ['slice-release', 'rageval-migration-count', (a) => a.includes('0/1 = 0%')],
  ['slice-release', 'slice-overall', (a) => a.includes('Overall 3/5 = 60%')],
  ['slice-release', 'slice-block', (a) => a.includes('BLOCK RELEASE')],
  ['release-transfer', 'release-answer', (a) => a.includes('Faithful 3/3')],
  ['release-transfer', 'rageval-fresh-citations', (a) => a.includes('Cited 3/3')],
  ['release-transfer', 'rageval-fresh-completeness', (a) => a.includes('Complete 3/4')],
  [
    'release-transfer',
    'rageval-fresh-pass',
    (a) => a.some((t) => t.startsWith('This trace passes')),
  ],
];
function fixture(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    sounds = scene.beats.map((b, beatIndex) => ({
      beatIndex,
      words: b.say
        .split(/\s+/)
        .map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 - 0.005 })),
    })),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.words.at(-1).end),
    );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { scene, timing };
}
function paint(f, t) {
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    f.scene,
    frameState(f.timing, t, lesson.scenes.indexOf(f.scene), lesson.scenes.length),
    model.draw,
  )
    .labels.filter((v) => v.alpha > 0.25)
    .map((v) => v.text);
}
for (const [scene, cueId, result] of cases)
  test(`${scene} holds ${cueId} until its completed result clause`, () => {
    const f = fixture(scene),
      q = f.timing.visualCues.find((q) => q.id === cueId);
    assert.equal(result(paint(f, q.end - 0.01)), false, 'completed result arrived early');
    assert.equal(result(paint(f, q.end + 0.01)), true, 'completed result remains missing');
  });
test('the integrity question has a neutral title and a real hold before its answer', () => {
  const f = fixture('trace-integrity'),
    b = f.timing.beats[2];
  assert(b.hold >= 1.5);
  const labels = paint(f, (b.end + b.until) / 2);
  assert(!labels.some((t) => t.includes('admissibility FAIL') || t.includes('Reject an invalid')));
  assert(labels.some((t) => t.includes('changed source payload')));
});
test('adding the fourth claim invalidates old fractions while the final decision is pending', () => {
  const f = fixture('release-transfer'),
    input = f.timing.visualCues.find((q) => q.id === 'release-repair'),
    pass = f.timing.visualCues.find((q) => q.id === 'rageval-fresh-pass'),
    labels = paint(f, (input.end + pass.end) / 2);
  assert(labels.some((t) => t.includes('maintenance-window identifier is required')));
  assert(labels.includes('Added claim and citation retained · recomputed verdict pending'));
  assert(
    !labels.some(
      (t) =>
        t === 'Faithful 3/3' ||
        t === 'Cited 3/3' ||
        t === 'Complete 3/4' ||
        t.startsWith('This trace passes'),
    ),
  );
});
