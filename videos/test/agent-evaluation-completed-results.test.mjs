import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/agent-evaluation.mjs';
const lesson = await readLesson(
  new URL('../lessons/agent-evaluation.lesson.yaml', import.meta.url).pathname,
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
  for (const [id, p] of Object.entries(values))
    cues[id] = {
      ...cues[id],
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
  )
    .labels.filter((l) => l.alpha > 0.1)
    .map((l) => l.text);
}
const has = (s) => (v) => v.some((x) => x.includes(s));
const contracts = [
  [
    'successful episode',
    'hard-gates',
    1,
    'checked-verdict',
    {},
    has('PASS · verified authorized hold'),
  ],
  [
    'forbidden attempt veto',
    'hard-gates',
    2,
    'forbidden-override',
    { 'forbidden-attempt': 1 },
    has('FAIL · forbidden attempt in trace'),
  ],
  [
    'run-level fraction',
    'repeatability',
    0,
    'run-rate',
    { 'other-trials': 1 },
    has('7 / 9 individual runs pass'),
  ],
  [
    'grouped task fraction',
    'repeatability',
    1,
    'group-fraction',
    { 'group-checks': 1 },
    has('1 / 3 task tokens'),
  ],
  [
    'cost quotient',
    'economics',
    0,
    'cost-quotient',
    { 'add-costs': 1, 'successful-denominator': 1 },
    has('= $0.029'),
  ],
  [
    'sample p95',
    'economics',
    1,
    'sample-quantile',
    { 'place-durations': 1 },
    has('sample p95: 8 seconds'),
  ],
  [
    'patch hit estimate',
    'metric-estimators',
    1,
    'patch-result',
    { 'patch-subsets': 1 },
    has('= 0.90'),
  ],
  ['three required successes', 'metric-estimators', 2, 'power-cube', {}, has('0.343')],
  [
    'failure complement',
    'metric-estimators',
    2,
    'failure-complement',
    { 'power-cube': 1 },
    has('=0.657'),
  ],
  ['heterogeneous task mean', 'metric-estimators', 2, 'heterogeneous', {}, has('= 0.5')],
  [
    'pooled shortcut counterexample',
    'metric-estimators',
    2,
    'pooled-wrong',
    { 'heterogeneous': 1 },
    has('= 0.125'),
  ],
  [
    'small Wilson endpoints',
    'uncertainty',
    1,
    'small-interval',
    {},
    (v) => v.includes('0.208') || v.includes('0.939'),
  ],
  [
    'large Wilson endpoints',
    'uncertainty',
    1,
    'large-interval',
    { 'small-interval': 1 },
    (v) => v.includes('0.744') || v.includes('0.965'),
  ],
  [
    'lower-bound veto',
    'uncertainty',
    1,
    'lower-gate',
    { 'small-interval': 1, 'large-interval': 1 },
    has('BLOCK · lower endpoint'),
  ],
  ['judge accuracy', 'judge-calibration', 0, 'forward-score', {}, has('Accuracy: 3 / 4 = 0.75')],
  [
    'judge order flips',
    'judge-calibration',
    0,
    'flip-score',
    { 'forward-score': 1, 'swap-remap': 1 },
    has('Order flips: 2 / 4 = 0.50'),
  ],
  [
    'judge advisory screen',
    'judge-calibration',
    0,
    'judge-screen',
    { 'forward-score': 1, 'swap-remap': 1, 'flip-score': 1 },
    has('→ ADVISORY'),
  ],
  ['promotion CPST', 'release-report', 1, 'promotion-input', {}, has('$0.111 / 2 = $0.0555')],
  [
    'promotion blocked',
    'release-report',
    1,
    'promotion-verdict',
    { 'promotion-input': 1, 'promotion-gates': 1 },
    has('BLOCK · cost cannot compensate'),
  ],
  [
    'three repaired rows',
    'repair-evidence',
    0,
    'repair-passes',
    { 'repair-action': 1 },
    has('3 / 3 regression rows pass'),
  ],
  [
    'separate repaired cost',
    'repair-evidence',
    0,
    'repair-cost-result',
    { 'repair-action': 1, 'repair-passes': 1 },
    has('Repaired-row cost $0.061'),
  ],
  [
    'wrong-order regression',
    'repair-evidence',
    0,
    'repair-variants-result',
    { 'repair-action': 1, 'repair-passes': 1, 'repair-cost-result': 1, 'repair-variants': 1 },
    has('Wrong order → FAIL'),
  ],
  [
    'over-budget regression',
    'repair-evidence',
    0,
    'repair-variants-result',
    {
      'repair-action': 1,
      'repair-passes': 1,
      'repair-cost-result': 1,
      'repair-variants': 1,
      'repair-overbudget-input': 1,
    },
    has('$0.09 cost → FAIL'),
  ],
  [
    'NaN domain regression',
    'repair-evidence',
    0,
    'repair-variants-result',
    {
      'repair-action': 1,
      'repair-passes': 1,
      'repair-cost-result': 1,
      'repair-variants': 1,
      'repair-overbudget-input': 1,
      'repair-nan': 1,
    },
    has('NaN cost → INVALID'),
  ],
  [
    'new independent trials',
    'repair-evidence',
    1,
    'repair-not-trial',
    {},
    has('New independent agent trials: 0'),
  ],
  ['fresh chosen read repair', 'fresh-library', 1, 'fresh-repair', {}, has('Independent read')],
  [
    'fresh verified hold',
    'fresh-library',
    1,
    'fresh-outcome',
    { 'fresh-repair': 1 },
    has('Verified: one intended hold'),
  ],
];
for (const [name, id, beat, cue, setup, visible] of contracts)
  test(name + ' waits for its completed clause', () => {
    for (const p of [0.01, 0.5, 0.999])
      assert.equal(visible(paint(id, beat, { ...setup, [cue]: p })), false, name + '/' + p);
    assert.equal(visible(paint(id, beat, { ...setup, [cue]: 1 })), true, name + '/after');
  });
test('the previously taught task-average recap and fresh saved write remain visible', () => {
  assert(has('= 1/3')(paint('metric-estimators', 0, { 'task-average': 0.5, 'all-k-rule': 1 })));
  const labels = paint('fresh-library', 1, { 'fresh-repair': 0.5 });
  assert(has('op-17 · B7 · hold-17 · v3')(labels));
});
for (const [probe, setup, input] of [
  ['wrong book', { 'checked-verdict': 1, 'wrong-book-probe': 1 }, 'Book: B8'],
  [
    'stale version',
    { 'checked-verdict': 1, 'wrong-book-probe': 1, 'stale-version-probe': 1 },
    'Read v2',
  ],
])
  test(probe + ' input remains visible while its final verdict waits', () => {
    for (const progress of [0, 0.5, 0.999]) {
      const labels = paint('hard-gates', 1, { ...setup, 'counterfactual-verdict': progress });
      assert(has(input)(labels));
      assert(has('Scoring returned evidence')(labels));
      assert(!has('FAIL · returned state mismatch')(labels));
    }
    const completed = paint('hard-gates', 1, { ...setup, 'counterfactual-verdict': 1 });
    assert(has(input)(completed));
    assert(has('FAIL · returned state mismatch')(completed));
    assert(
      has('PASS · verified authorized hold')(paint('hard-gates', 1, { 'checked-verdict': 1 })),
    );
  });
