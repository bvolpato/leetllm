import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/model-versioning-continuous-deployment.mjs';
const lesson = await readLesson(
  new URL('../lessons/model-versioning-continuous-deployment.lesson.yaml', import.meta.url)
    .pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  for (const [name, p] of Object.entries(values))
    cues[name] = {
      ...cues[name],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  ).labels.filter((l) => l.alpha > 0.1);
}
const includes = (s) => (a) => a.some((l) => l.text.includes(s));
test('reprinting after a Git revert uses the loaded release', () => {
  const afterRevert = { 'revert-template': 1, 'print-again': 1, 'reveal-current': 1 };
  const first = paint('opening', 1, afterRevert);
  assert(includes('12-hour')(first));
  assert(includes('R2   17:30')(first));
  const loading = { ...afterRevert, 'load-stable': 1, 'print-stable': 1 };
  assert(!includes('5:30 PM')(paint('opening', 1, { ...loading, 'reveal-stable': 0.99 })));
  const second = paint('opening', 1, { ...loading, 'reveal-stable': 1 });
  assert(includes('R2   17:30')(second));
  assert(includes('R1   5:30 PM')(second));
});
const cases = [
  [
    'obsolete registry writer',
    'registry',
    1,
    'reject-stale-writer',
    { 'promote-production': 1, 'restore-stable': 1, 'mv-registry-expected': 1 },
    includes('REJECT · current is STABLE / r3'),
    includes('production → STABLE · r3'),
  ],
  [
    'offline eligibility',
    'offline',
    0,
    'offline-eligibility',
    {},
    includes('ELIGIBLE ·'),
    includes('Coverage: 200 cases'),
  ],
  [
    'offline evaluator rejection',
    'offline',
    1,
    'offline-rejection',
    { 'change-evaluator': 1 },
    includes('REJECT · evaluator mismatch'),
    includes('Evaluator: claim-eval-v3'),
  ],
  [
    'incomplete live window',
    'live',
    0,
    'hold-window',
    {},
    includes('HOLD · coverage or volume incomplete'),
    includes('599 / 600 reviewed'),
  ],
  [
    'complete live window',
    'live',
    1,
    'pass-window',
    { 'experience-gate': 1, 'usefulness-gate': 1 },
    includes('PASS · current inventory clears policy'),
    includes('Useful supported 752 / 800'),
  ],
  [
    'unsafe live window',
    'live',
    2,
    'critical-abort',
    {},
    includes('ABORT · confirmed unsupported serve'),
    includes('1 confirmed unsupported serve'),
  ],
  [
    'insufficient recovery capacity',
    'capacity',
    0,
    'capacity-gap',
    {},
    includes('Capacity gap 10 requests/s'),
    includes('Readiness receipt READY-1'),
  ],
  [
    'sufficient recovery capacity',
    'capacity',
    1,
    'ready-workers',
    {},
    includes('Ready for all 100 supplied requests/s'),
    includes('Readiness receipt READY-2'),
  ],
  [
    'finite metric type rejection',
    'report-integrity',
    2,
    'mv-report-integrity-invalid',
    {},
    (a) => a.some((l) => l.text === 'REJECT' && l.y < 800),
    includes('Boolean'),
  ],
  [
    'huge metric rejection',
    'report-integrity',
    2,
    'mv-report-integrity-huge',
    { 'mv-report-integrity-invalid': 1 },
    (a) => a.some((l) => l.text === 'REJECT' && l.x > 1100 && l.x < 1300 && l.y > 800),
    includes('huge'),
  ],
  [
    'agreement on wrong routes',
    'shadow-evidence',
    1,
    'mv-shadow-evidence-wrong',
    {},
    includes('both routes wrong'),
    includes('supplied support = false'),
  ],
  [
    'fresh incompatible state',
    'fresh-release',
    2,
    'mv-fresh-release-capacity',
    {},
    includes('state incompatible · capacity alone cannot recover'),
    includes('ready capacity 160'),
  ],
];
for (const [name, id, beat, cue, setup, result, input] of cases)
  test(name + ' retains evidence while its verdict waits', () => {
    for (const p of [0.01, 0.5, 0.999]) {
      const labels = paint(id, beat, { ...setup, [cue]: p });
      assert(input(labels), name + ' input remains');
      assert(!result(labels), name + ' result waits at ' + p);
    }
    const after = paint(id, beat, { ...setup, [cue]: 1 });
    assert(input(after));
    assert(result(after), name + ' completed result');
  });
