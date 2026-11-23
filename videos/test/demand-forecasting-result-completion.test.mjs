import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  capacityLoss,
  featureProducts,
} from '../animations/capstone-demand-forecasting-alerts.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
const before = { phase: 'before', progress: 0, active: false, strength: 0 },
  during = { phase: 'active', progress: 0.99, active: true, strength: 1 },
  after = { phase: 'after', progress: 1, active: false, strength: 0 };
const lesson = await readLesson(
  root + 'videos/lessons/capstone-demand-forecasting-alerts.lesson.yaml',
  root,
);
function paint(id, beat, overrides) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) => (b.visual_cues ?? []).map((c) => [c.id, { ...c, ...before }])),
    );
  for (const [id, phase] of Object.entries(overrides)) cues[id] = { ...cues[id], ...phase };
  const audit = drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { t: 5, duration: 100, opacity: 1, beat, beatP: 0.8, cueTiming: 'provider-words', cues },
    draw,
  );
  return audit.labels.filter((l) => l.alpha > 0.25).map((l) => l.text);
}
test('expected cost uses all scenario terms and waits for its complete result clause', () => {
  for (const [a, id] of [
    [100, 'forecast-cost100'],
    [160, 'forecast-cost160'],
    [240, 'forecast-cost240'],
  ]) {
    const pending = paint('cost-quantile', 2, { [id]: during });
    assert(!pending.some((s) => s.startsWith('Expected cost ')));
    const ready = paint('cost-quantile', 2, { [id]: after });
    assert(ready.includes('Expected cost ' + capacityLoss(a).toFixed(1)));
    assert(!ready.includes('Expected cost 0.0'));
  }
});
test('CDF selection and median wait independently while distribution ticks remain visible', () => {
  const level = { 'forecast-cost-level': after };
  const pending = paint('cost-quantile', 1, { ...level, 'forecast-cost-cdf': during });
  assert(!pending.includes('First CDF ≥ τ: 160'));
  const selected = paint('cost-quantile', 1, {
    ...level,
    'forecast-cost-cdf': after,
    'forecast-cost-median': during,
  });
  assert(selected.includes('First CDF ≥ τ: 160'));
  assert(!selected.some((s) => s.startsWith('Median 100')));
  assert(
    paint('cost-quantile', 1, {
      ...level,
      'forecast-cost-cdf': after,
      'forecast-cost-median': after,
    }).some((s) => s.startsWith('Median 100')),
  );
});
test('each fitted contribution and the final prediction have distinct completed-result permissions', () => {
  const ids = [
    'forecast-fit-friday-result',
    'forecast-fit-trend-result',
    'forecast-fit-campaign-result',
  ];
  const terms = featureProducts().terms.filter((v) => v !== 0);
  for (let i = 0; i < ids.length; i++) {
    const pending = paint('fit-construction', 1, {
      'forecast-fit-products': during,
      [ids[i]]: during,
    });
    assert(!pending.includes(terms[i].toFixed(6)));
    assert(paint('fit-construction', 1, { [ids[i]]: after }).includes(terms[i].toFixed(6)));
  }
  const answer = featureProducts().forecast.toFixed(6) + ' parcels';
  assert(!paint('fit-construction', 1, { 'forecast-fit-result': during }).includes(answer));
  assert(paint('fit-construction', 1, { 'forecast-fit-result': after }).includes(answer));
});
test('Wednesday, counterfactual readiness and invariance verdicts wait for complete clauses', () => {
  for (const [scene, beat, cue, needle] of [
    ['evaluation-contract', 1, 'forecast-eval-wed', '145<150:peak cost0'],
    [
      'receipt-contract',
      1,
      'forecast-receipt-counterfactual',
      'Decision hold · live readiness false',
    ],
    ['failure-construction', 1, 'forecast-failure-invariant', '163.284 = 163.284'],
  ]) {
    assert(!paint(scene, beat, { [cue]: during }).includes(needle));
    assert(paint(scene, beat, { [cue]: after }).includes(needle));
  }
});
test('fresh partial error, tolerance, signal ratios and completeness are revealed separately', () => {
  const mean = { 'forecast-fresh-partial': after };
  const a = paint('earned-forecast-transfer', 1, mean);
  assert(a.some((s) => s.includes('MAE (1+0)/2 = 0.5')));
  assert(
    !a.some(
      (s) => s.includes('Tolerance 2/2') || s.includes('precision 1') || s.includes('incomplete'),
    ),
  );
  for (const [cue, needle] of [
    ['forecast-fresh-partial-tolerance', 'Tolerance 2/2'],
    ['forecast-fresh-partial-signal', 'precision 1 · recall 1'],
    ['forecast-fresh-incomplete', 'incomplete'],
  ]) {
    assert(
      !paint('earned-forecast-transfer', 1, { ...mean, [cue]: during }).some((s) =>
        s.includes(needle),
      ),
    );
    assert(
      paint('earned-forecast-transfer', 1, { ...mean, [cue]: after }).some((s) =>
        s.includes(needle),
      ),
    );
  }
});
test('fresh full mean, tolerance, recall and peak use their own completed clauses', () => {
  const ready = { 'forecast-fresh-arrive': after, 'forecast-fresh-mean': after };
  assert(paint('earned-forecast-transfer', 2, ready).some((s) => s.includes('MAE 8/3 = 2.667')));
  assert(!paint('earned-forecast-transfer', 2, ready).some((s) => s.includes('tolerance 2/3')));
  for (const [cue, needle] of [
    ['forecast-fresh-tolerance', 'tolerance 2/3'],
    ['forecast-fresh-recall', 'recall 0.5'],
    ['forecast-fresh-peak', 'selective peak 0'],
  ]) {
    assert(
      !paint('earned-forecast-transfer', 2, { ...ready, [cue]: during }).some((s) =>
        s.includes(needle),
      ),
    );
    assert(
      paint('earned-forecast-transfer', 2, { ...ready, [cue]: after }).some((s) =>
        s.includes(needle),
      ),
    );
  }
});
test('the supplied fitting objective does not reveal the computed rank early', () => {
  const objective = { 'forecast-fit-weights': after };
  assert(
    !paint('fit-construction', 0, { ...objective, 'forecast-fit-rank': during }).includes(
      'rank9 · no added intercept',
    ),
  );
  assert(
    paint('fit-construction', 0, { ...objective, 'forecast-fit-rank': after }).includes(
      'rank9 · no added intercept',
    ),
  );
});
test('the independent late-plan invariance claim waits even after count invariance is earned', () => {
  const counts = { 'forecast-failure-invariant': after };
  assert(
    !paint('failure-construction', 1, { ...counts, 'forecast-failure-late-plan': during }).some(
      (s) => s.startsWith('Late plan likewise'),
    ),
  );
  assert(
    paint('failure-construction', 1, { ...counts, 'forecast-failure-late-plan': after }).some((s) =>
      s.startsWith('Late plan likewise'),
    ),
  );
});
