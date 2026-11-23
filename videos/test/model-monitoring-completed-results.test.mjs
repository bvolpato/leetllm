import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/model-monitoring.mjs';
const lesson = await readLesson(
  new URL('../lessons/model-monitoring.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cases = [
  {
    'scene': 'request-gate',
    'id': 'm-request-gate-four',
    'label': '4 pass / 6 supplied requests',
  },
  {
    'scene': 'drift-diagnostic',
    'id': 'm-drift-diagnostic-total',
    'label': 'PSI = 0.370',
  },
  {
    'scene': 'psi-derive',
    'id': 'm-psi-derive-subtract',
    'label': 'a − e = -0.20',
  },
  {
    'scene': 'psi-derive',
    'id': 'm-psi-derive-log',
    'label': 'ln(a/e) = -0.511',
  },
  {
    'scene': 'psi-derive',
    'id': 'm-psi-derive-product',
    'label': '0.102',
  },
  {
    'scene': 'psi-derive',
    'id': 'm-psi-derive-terms',
    'label': '0.208',
  },
  {
    'scene': 'psi-derive',
    'id': 'm-psi-derive-share',
    'label': '24 h+ supplies 56.2% of the total; every positive-share term is nonnegative.',
  },
  {
    'scene': 'drift-continuous',
    'id': 'm-drift-continuous-gap',
    'label': 'D = 0.5',
  },
  {
    'scene': 'drift-continuous',
    'id': 'm-drift-continuous-move',
    'label': 'W1 = ½×2 + ½×2 = 2 h',
  },
  {
    'scene': 'drift-taxonomy',
    'id': 'm-drift-taxonomy-result',
    'label': '0.8×0.1 + 0.2×0.4 = 0.16',
  },
  {
    'scene': 'parity-probe',
    'id': 'm-parity-probe-rates',
    'label': '20 / 50 = 0.40',
  },
  {
    'scene': 'as-of-cohorts',
    'id': 'm-as-of-cohorts-coverage',
    'label': '4 joined / 5 mature = 0.80',
  },
  {
    'scene': 'decision-quality',
    'id': 'm-decision-quality-precision',
    'label': 'precision 2 / 3',
  },
  {
    'scene': 'decision-quality',
    'id': 'm-decision-quality-recall',
    'label': 'recall 2 / 2',
  },
  {
    'scene': 'decision-quality',
    'id': 'm-decision-quality-cost',
    'label': '2×1 + 10×0 = 2',
  },
  {
    'scene': 'calibration',
    'id': 'm-calibration-low',
    'label': 'mean score 0.235',
  },
  {
    'scene': 'calibration',
    'id': 'm-calibration-high',
    'label': 'mean score 0.790',
  },
  {
    'scene': 'calibration',
    'id': 'm-calibration-extra',
    'label': 'misses 3 / 4 = 0.750',
  },
  {
    'scene': 'evidence-triage',
    'id': 'm-evidence-triage-cost',
    'label': '(2×10 + 10×2) × 1,000 / 500 = 80 > 50',
  },
  {
    'scene': 'evidence-triage',
    'id': 'm-evidence-triage-proposal',
    'label': 'PROPOSAL: return to v3 · no traffic sent',
  },
  {
    'scene': 'release-gates',
    'id': 'm-release-gates-stable',
    'label': 'cost 60 / 1,000 · recall 0.8',
  },
  {
    'scene': 'release-gates',
    'id': 'm-release-gates-candidate',
    'label': 'cost 40 / 1,000 · recall 0.9',
  },
  {
    'scene': 'release-gates',
    'id': 'm-release-gates-health',
    'label': 'pass',
  },
  {
    'scene': 'rollback-conditions',
    'id': 'm-rollback-conditions-hold',
    'label': 'insufficient evidence',
  },
  {
    'scene': 'rollback-conditions',
    'id': 'm-rollback-conditions-invalid',
    'label': 'invalid metric',
  },
  {
    'scene': 'rollback-conditions',
    'id': 'm-rollback-conditions-strict',
    'label': 'keep candidate',
  },
  {
    'scene': 'rollback-conditions',
    'id': 'm-rollback-conditions-eighty',
    'label': '(2×10 + 10×2) / 500 × 1,000 = 80',
  },
  {
    'scene': 'fresh-monitoring',
    'id': 'm-fresh-monitoring-coverage',
    'label': '380 / 400 = 0.95',
  },
  {
    'scene': 'fresh-monitoring',
    'id': 'm-fresh-monitoring-hold',
    'label': 'insufficient evidence · count < 500 and incomplete labels',
  },
  {
    'scene': 'fresh-monitoring',
    'id': 'm-fresh-monitoring-cost',
    'label': '2×8 + 10×2 = 36',
  },
  {
    'scene': 'fresh-monitoring',
    'id': 'm-fresh-monitoring-normalized',
    'label': '36 × 1,000 / 800 = 45',
  },
  {
    'scene': 'fresh-monitoring',
    'id': 'm-fresh-monitoring-keep',
    'label': '45 ≤ 50 · keep candidate in this simulation',
  },
];
function paint(sceneId, id, p, extra = {}, forcedBeat) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    beat = forcedBeat ?? scene.beats.findIndex((b) => b.visual_cues?.some((c) => c.id === id)),
    all = scene.beats.flatMap((b, i) => (b.visual_cues ?? []).map((c) => ({ ...c, beat: i }))),
    target = all.findIndex((c) => c.id === id);
  const cues = Object.fromEntries(
    all.map((c, i) => {
      const q = c.beat < beat || (c.beat === beat && i < target) ? 1 : 0;
      return [
        c.id,
        { ...c, phase: q ? 'after' : 'before', progress: q, strength: 0, active: false },
      ];
    }),
  );
  for (const [k, q] of Object.entries({ ...extra, [id]: p }))
    cues[k] = {
      ...cues[k],
      phase: q === 1 ? 'after' : q === 0 ? 'before' : 'during',
      progress: q,
      strength: 0,
      active: false,
    };
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  );
  assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  return a.labels.filter((l) => l.alpha > 0.1).map((l) => l.text);
}
for (const c of cases)
  test(c.id + ' earns its fixed output after the complete clause', () => {
    const has = (a) =>
      c.id === 'm-fresh-monitoring-coverage'
        ? a.some((x) => x.startsWith(c.label))
        : a.includes(c.label);
    for (const p of [0, 0.5, 0.999])
      assert(!has(paint(c.scene, c.id, p)), c.id + ' pending at ' + p);
    assert(has(paint(c.scene, c.id, 1)), c.id + ' earned');
  });
test('fresh missing count follows its own clause after coverage', () => {
  const has = (a) => a.some((x) => x.includes('20 mature outcomes missing'));
  for (const p of [0, 0.5, 0.999])
    assert(
      !has(
        paint(
          'fresh-monitoring',
          'm-fresh-monitoring-missing-result',
          p,
          { 'm-fresh-monitoring-coverage': 1 },
          1,
        ),
      ),
    );
  assert(
    has(
      paint(
        'fresh-monitoring',
        'm-fresh-monitoring-missing-result',
        1,
        { 'm-fresh-monitoring-coverage': 1 },
        1,
      ),
    ),
  );
});
test('computed eighty stays separate from the later proposed return', () => {
  for (const p of [0, 0.5, 0.999]) {
    const a = paint(
      'rollback-conditions',
      'm-rollback-conditions-return-result',
      p,
      { 'm-rollback-conditions-eighty': 1 },
      1,
    );
    assert(a.includes('(2×10 + 10×2) / 500 × 1,000 = 80'));
    assert(!a.includes('propose rollback'));
  }
  assert(
    paint(
      'rollback-conditions',
      'm-rollback-conditions-return-result',
      1,
      { 'm-rollback-conditions-eighty': 1 },
      1,
    ).includes('propose rollback'),
  );
});
test('the first fresh answer retires its prediction instruction', () => {
  const a = paint('fresh-monitoring', 'm-fresh-monitoring-hold', 1, {
    'm-fresh-monitoring-coverage': 1,
    'm-fresh-monitoring-missing-result': 1,
  });
  assert(a.some((x) => x.startsWith('insufficient evidence')));
  assert(!a.includes('Predict the next action before the quality result appears.'));
});
test('the false-alert cost contribution waits with its computed total', () => {
  for (const p of [0, 0.5, 0.999])
    assert(!paint('decision-quality', 'm-decision-quality-cost', p).includes('false alert: +2'));
  assert(paint('decision-quality', 'm-decision-quality-cost', 1).includes('false alert: +2'));
});
