import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/active-labeling.mjs';

const lesson = await readLesson(
  new URL('../lessons/active-labeling.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cases = [
  ['preference-loss', 0, 'reward-probability', (a) => a.labels.some((l) => l.text === 'P = 0.881')],
  ['preference-loss', 2, 'loss-margin', (a) => a.labels.some((l) => l.text.includes('=\\log 2'))],
  ['preference-loss', 2, 'loss-result', (a) => a.labels.some((l) => l.text.includes('0.405465'))],
  ['reviewer-agreement', 1, 'kappa-result', (a) => a.labels.some((l) => l.text.includes('=0.835'))],
  ['agreement-models', 0, 'base-rate', (a) => a.labels.some((l) => l.text.includes('=.8192'))],
  ['agreement-models', 0, 'small-kappa', (a) => a.labels.some((l) => l.text.includes('=.115044'))],
  [
    'agreement-models',
    1,
    'fleiss-result',
    (a) => a.labels.some((l) => l.text.includes('=.489362')),
  ],
  [
    'selector-trial',
    1,
    'score-gain',
    (a) => a.labels.some((l) => l.text === '+3 pp' || l.text === '+7 pp'),
  ],
  [
    'selector-trial',
    1,
    'label-efficiency',
    (a) => a.labels.some((l) => l.text.includes('133.3 labels') || l.text.includes('57.1 labels')),
  ],
  ['fresh-release', 1, 'fresh-kappa', (a) => a.labels.some((l) => l.text.includes('=.6<.65'))],
  [
    'fresh-release',
    1,
    'fresh-overlap',
    (a) => a.labels.some((l) => l.text === 'Independent family-overlap blocker'),
  ],
  [
    'fresh-release',
    1,
    'fresh-disagreements',
    (a) => a.labels.some((l) => l.text.startsWith('Review 16 disagreements')),
  ],
  [
    'fresh-release',
    2,
    'fresh-rebuild',
    (a) => a.labels.some((l) => l.text === 'Rebuilt snapshot → new digest'),
  ],
  [
    'fresh-release',
    2,
    'fresh-gate',
    (a) =>
      a.labels.some(
        (l) =>
          l.text === 'Current audit pending → CLOSED' ||
          l.text === 'Agreement still κ = .60 → CLOSED',
      ),
  ],
];
function paint(id, beat, result, progress, beatP = 0.8) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          {
            phase: i <= beat ? 'after' : 'before',
            progress: i <= beat ? 1 : 0,
            strength: 0,
            active: false,
            targets: [],
          },
        ]),
      ),
    );
  cues['undefined-kappa'] = {
    phase: 'before',
    progress: 0,
    strength: 0,
    active: false,
    targets: [],
  };
  if (result)
    cues[result] = {
      phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
      progress,
      strength: 0,
      active: false,
      targets: [],
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 35, duration: 100, opacity: 1, beat, beatP, cueTiming: 'explicit-test-cues', cues },
    draw,
  );
}
for (const [id, beat, cue, has] of cases)
  test(`${id}: ${cue} waits for the complete clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(has(paint(id, beat, cue, p)), false, `${cue} at ${p}`);
    assert.equal(has(paint(id, beat, cue, 1)), true, 'completed result is actually painted');
  });
test('the current diagonal count is explicitly partial until all three matching cells contribute', () => {
  for (const [p, count] of [
    [0, 0],
    [0.82, 42],
    [0.9, 80],
  ]) {
    const a = paint('reviewer-agreement', 0, null, 0, p);
    assert(a.labels.some((l) => l.text === 'Partial diagonal sum'));
    assert(a.labels.some((l) => l.text === `${count} / 120`));
  }
  const a = paint('reviewer-agreement', 0, null, 0, 0.98);
  assert(a.labels.some((l) => l.text === 'Matching decisions'));
  assert(a.labels.some((l) => l.text === '107 / 120'));
});
