import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  visionRoute,
  visionReplay,
  visionCaseAction,
  visionStencil,
  visionHead,
  visionMasked,
  visionFresh,
  visionFrame,
} from '../animations/capstone-damaged-package-vision-classifier.mjs';

const photo = {
  photo_id: 'fresh-a',
  case_id: 'fresh',
  capture_day: 20,
  source: 'phone',
  packaging: 'box',
};
const output = { damage_probability: 0.7, blur_score: 0.45, brightness: 0.2, box_visible: true };
const near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);

test('numeric boundary equality passes quality and the damage threshold while Boolean numbers are rejected', () => {
  assert.equal(visionRoute(photo, output).action, 'priority_damage_review');
  for (const key of ['damage_probability', 'blur_score', 'brightness'])
    for (const value of [true, false, NaN, Infinity, -0.01, 1.01])
      assert.throws(() => visionRoute(photo, { ...output, [key]: value }), /Invalid numeric/);
  assert.equal(visionRoute(photo, { ...output, brightness: 0.1999 }).reason, 'image_quality_gate');
  assert.equal(
    visionRoute(photo, { ...output, box_visible: false, brightness: 0.1 }).reason,
    'package_not_visible',
  );
});

test('the replay validates the full retained trace and does not consult an active policy', () => {
  const trace = visionRoute(photo, output);
  assert.equal(Object.keys(trace).length, 20);
  assert(visionReplay(trace, photo, output));
  for (const key of Object.keys(trace)) {
    const missing = { ...trace };
    delete missing[key];
    assert.equal(visionReplay(missing, photo, output), false, key);
    assert.equal(
      visionReplay(
        { ...trace, [key]: typeof trace[key] === 'number' ? true : 'changed' },
        photo,
        output,
      ),
      false,
      key,
    );
  }
  assert.equal(visionReplay({ ...trace, extra: true }, photo, output), false);
});

test('a change in contrast scales signed Laplacian responses linearly and population variance quadratically', () => {
  const original = visionStencil();
  for (const scale of [-2, -0.5, 0, 0.25, 0.5, 3]) {
    const changed = visionStencil(scale);
    changed.responses.forEach((v, i) => near(v, scale * original.responses[i]));
    near(changed.variance, original.variance * scale * scale);
  }
});

test('the head update follows finite-difference weight and bias gradients on a fresh feature vector', () => {
  const args = {
      features: [-2, 3, 0.5],
      weights: [0.2, -0.1, 0.4],
      bias: 0.3,
      target: 0,
      rate: 0.07,
    },
    h = visionHead(args),
    epsilon = 1e-5;
  args.weights.forEach((_, i) => {
    const a = args.weights.map((w, j) => w + (j === i ? epsilon : 0)),
      z = args.weights.map((w, j) => w - (j === i ? epsilon : 0));
    near(
      (visionHead({ ...args, weights: a }).loss - visionHead({ ...args, weights: z }).loss) /
        (2 * epsilon),
      h.gradients[i],
    );
  });
  near(
    (visionHead({ ...args, bias: args.bias + epsilon }).loss -
      visionHead({ ...args, bias: args.bias - epsilon }).loss) /
      (2 * epsilon),
    h.logitGradient,
  );
  assert(h.nextLoss < h.loss);
});

test('unknown category logits contribute neither loss nor gradient nor denominator weight', () => {
  const h = visionMasked([0.3, -0.7, 100], [1, 0, null]),
    changed = visionMasked([0.3, -0.7, -100], [1, 0, null]);
  near(h.mean, changed.mean);
  assert.deepEqual(h.gradients, changed.gradients);
  assert.equal(h.gradients[2], 0);
  near(h.mean, (h.losses[0] + h.losses[1]) / 2);
  assert.equal(visionMasked([0], [null]).mean, null);
});

test('case reduction retains priority precedence and delayed evidence reveals a miss without changing routes', () => {
  const make = (action) => ({ action });
  assert.equal(
    visionCaseAction([make('normal_review'), make('request_new_photo')]),
    'normal_review',
  );
  assert.equal(
    visionCaseAction([make('priority_damage_review'), make('normal_review')]),
    'priority_damage_review',
  );
  assert.throws(() => visionCaseAction([]));
  assert.throws(() => visionCaseAction([make('refund')]));
  const a = visionFresh(21),
    z = visionFresh(22);
  assert.deepEqual(a.traces, z.traces);
  assert.equal(a.complete, false);
  assert.equal(z.complete, true);
  assert.equal(a.recall, 1);
  near(z.recall, 2 / 3);
  assert.equal(a.servedActions['R-520'], 'normal_review');
  assert.equal(z.counts.FN, 1);
});

test('fresh route, delayed false negative and metric results wait for their separate completed spoken clauses', () => {
  const cue = (phase) => ({ phase, progress: phase === 'after' ? 1 : 0.99 });
  const frame = (beat, name, phase) =>
    visionFrame('fresh-parcel', {
      beat,
      cues: {
        ...(beat === 2 ? { 'dv-fresh-cutoff': cue('after') } : {}),
        ['dv-' + name]: cue(phase),
      },
    });
  assert.equal(frame(1, 'fresh-route', 'during').showRoutes, false);
  assert.equal(frame(1, 'fresh-route', 'after').showRoutes, true);
  assert.equal(frame(2, 'fresh-missed-case', 'during').showMiss, false);
  assert.equal(frame(2, 'fresh-missed-case', 'after').showMiss, true);
  assert.equal(frame(2, 'fresh-complete-metrics', 'during').showMetrics, false);
  assert.equal(frame(2, 'fresh-complete-metrics', 'after').showMetrics, true);
});

const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  root + 'videos/lessons/capstone-damaged-package-vision-classifier.lesson.yaml',
  root,
);
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
function painted(sceneId, beat, phases = {}) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    cues = Object.fromEntries(
      Object.entries(phases).map(([id, phase]) => [
        'dv-' + id,
        { phase, progress: phase === 'after' ? 1 : 0.99 },
      ]),
    );
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { t: 50, duration: 100, opacity: 1, beat, beatP: 0.5, cues },
    draw,
  ).labels.map((l) => l.text);
}

test('actual missing-evidence painting separates the baseline, derived join, completeness verdict, and restoration', () => {
  const baseline = painted('missing-evidence', 0);
  assert(baseline.some((s) => s.startsWith('Baseline:')));
  assert(!baseline.some((s) => s.includes('returns') || s.includes('HOLD')));
  const delay = { 'late-case-change': 'after' },
    pending = painted('missing-evidence', 0, delay);
  assert(pending.includes('Cutoff day 12 · joining eligible outcomes'));
  assert(!pending.some((s) => s.includes('HOLD') || s.includes('3 / 4')));
  const observed = painted('missing-evidence', 0, { ...delay, 'late-observed-metrics': 'after' });
  assert(observed.includes('Cutoff day 12 · 3 / 4 eligible outcomes'));
  assert(!observed.some((s) => s.includes('HOLD')));
  const held = painted('missing-evidence', 1, { 'late-completeness': 'after' });
  assert(held.some((s) => s.startsWith('Incomplete evidence → HOLD')));
  assert(!held.some((s) => s.includes('returns')));
  const restored = painted('missing-evidence', 1, { 'late-restored-metrics': 'after' });
  assert(restored.includes('Cutoff day 13 · 4 / 4 eligible outcomes'));
  assert(restored.some((s) => s.startsWith('The same damaged normal case returns.')));
});

test('actual threshold painting withholds missed cases until their own spoken result and returns to the chosen policy', () => {
  const first = painted('development-threshold', 1, { 'threshold-eight-counts': 'after' });
  assert(first.includes('1 / 1'));
  assert(!first.includes('1 / 1 / 3'));
  assert(!first.includes('3 · 0.50 / 0.25'));
  const firstComplete = painted('development-threshold', 1, {
    'threshold-eight-counts': 'after',
    'threshold-eight-recall': 'after',
  });
  assert(firstComplete.includes('3 · 0.50 / 0.25'));
  const second = painted('development-threshold', 1, {
    'threshold-eight-counts': 'after',
    'threshold-seven-counts': 'after',
  });
  assert(second.includes('3 / 1'));
  assert(!second.includes('3 / 1 / 1'));
  assert(!second.includes('1 · 0.75 / 0.75'));
  const secondComplete = painted('development-threshold', 1, {
    'threshold-eight-counts': 'after',
    'threshold-seven-counts': 'after',
    'threshold-seven-metrics': 'after',
  });
  assert(secondComplete.includes('1 · 0.75 / 0.75'));
  assert(
    painted('development-threshold', 2, { 'threshold-three-counts': 'after' }).includes('τ = 0.30'),
  );
  const choice = painted('development-threshold', 2, { 'threshold-choice': 'after' });
  assert(choice.includes('τ = 0.70'));
  assert(choice.includes('1 · 0.75 / 0.75'));
});

test('actual fresh-case footer and source-slice counts wait for their corresponding completed clauses', () => {
  const route = painted('fresh-parcel', 1, { 'fresh-route': 'after' });
  assert(route.includes('Case action: normal. Availability decision pending.'));
  assert(!route.some((s) => s.includes('cannot enter') || s.includes('4/5')));
  const availability = painted('fresh-parcel', 1, {
    'fresh-route': 'after',
    'fresh-incomplete-metrics': 'after',
  });
  assert(availability.some((s) => s.includes('4/5 outcomes → HOLD')));
  const pending = painted('fresh-parcel', 2, {
    'fresh-cutoff': 'after',
    'fresh-missed-case': 'during',
  });
  assert(!pending.some((s) => s.includes('false negative')));
  assert(!pending.includes('FN'));
  const joined = painted('fresh-parcel', 2, {
    'fresh-cutoff': 'after',
    'fresh-missed-case': 'after',
  });
  assert(joined.some((s) => s.includes('false negative')));
  assert(joined.includes('FN'));
  const slices = painted('source-slices', 0);
  assert(!slices.includes('TP 1'));
  assert(!slices.includes('FN 1'));
  const phone = painted('source-slices', 0, { 'phone-metrics': 'after' });
  assert(phone.includes('TP 1'));
  assert(!phone.includes('FN 1'));
  const warehouse = painted('source-slices', 0, {
    'phone-metrics': 'after',
    'warehouse-metrics': 'after',
  });
  assert(warehouse.includes('TN 1'));
  assert(warehouse.includes('FN 1'));
});
