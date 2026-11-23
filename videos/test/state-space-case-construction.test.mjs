import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';

import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
const model = await import(process.env.SSM_TEST_MODULE ?? '../animations/state-space-models.mjs');
const lesson = await readRepositoryLesson('videos/lessons/state-space-models.lesson.yaml');
registerLessonFonts();
const before = { phase: 'before', progress: 0, strength: 0 },
  during = { phase: 'during', progress: 0.8, strength: 0 },
  after = { phase: 'after', progress: 1, strength: 0 };
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [c.id, i < beat ? after : before]),
      ),
    );
  Object.assign(cues, overrides);
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.75, opacity: 1, t: 10, duration: 30, cues },
    model.draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return {
    frame,
    text: frame.labels
      .filter((l) => l.alpha > 0.25)
      .map((l) => l.text.normalize('NFKC').replaceAll(' ', '')),
  };
}

test('settled finite-step write coefficients wait for their complete clauses', () => {
  const cues = {
    'exact-write': during,
    'mamba-write': during,
    'ssm-delta-exact': during,
    'ssm-delta-mamba': during,
  };
  const pending = paint('delta', 1, cues).text;
  assert(!pending.some((x) => x.startsWith('exactwrite≈') || x.startsWith('Mambawrite=')));
  const done = paint('delta', 1, {
    ...cues,
    'ssm-delta-exact': after,
    'ssm-delta-mamba': after,
  }).text;
  assert(done.some((x) => x.startsWith('exactwrite≈')));
  assert(done.some((x) => x.startsWith('Mambawrite=')));
});

test('settled selective readout waits independently from the computed state', () => {
  const cues = {
    'selective-readout': during,
    'ssm-selective-state': after,
    'ssm-selective-readout': during,
  };
  assert(!paint('selection', 1, cues).text.some((x) => x.startsWith('C×new=')));
  assert(
    paint('selection', 1, { ...cues, 'ssm-selective-readout': after }).text.some(
      (x) => x === 'C×new=1.764',
    ),
  );
});

test('settled collision equality follows the complete answer rather than the answer beat', () => {
  assert(
    !paint('collision', 1, { 'ssm-collision-equality': during }).text.some((x) =>
      x.startsWith('h_A=h_B='),
    ),
  );
  assert(paint('collision', 1, { 'ssm-collision-equality': after }).text.includes('h_A=h_B=1.25'));
});

test('settled reference equality is separate from an already applied correction', () => {
  const cues = {
    'restore-checkpoint': after,
    'apply-correction': after,
    'ssm-checkpoint-reference': during,
  };
  assert(!paint('checkpoint', 1, cues).text.some((x) => x.includes('·directreference')));
  assert(
    paint('checkpoint', 1, { ...cues, 'ssm-checkpoint-reference': after }).text.some((x) =>
      x.includes('·directreference27.0625'),
    ),
  );
});

test('settled first affine prefixes are earned separately', () => {
  assert(!paint('prefix-construction', 0).text.includes('h1=2'));
  const first = paint('prefix-construction', 0, { 'ssm-prefix-first': after }).text;
  assert(first.includes('h1=2'));
  assert(!first.includes('h2=1.4'));
  assert(
    paint('prefix-construction', 0, {
      'ssm-prefix-first': after,
      'ssm-prefix-second': after,
    }).text.includes('h2=1.4'),
  );
});

test('reverse order moves the original affine map to the second position', () => {
  const { frame, text } = paint('prefix-construction', 1, {
    'ssm-prefix-composite': after,
    'ssm-prefix-reverse': after,
  });
  const second = frame.labels.find((x) => /^×0\.50?\s*\+2/.test(x.text.replaceAll(' ', '')));
  assert(second && second.x > 1000);
  assert(text.includes('h2=2.5'));
});

test('buffer restoration holds the saved boundary before applying either suffix input', () => {
  const pending = paint('complete-buffers', 1, { 'complete-buffers-b2': after }).text;
  assert(!pending.includes('h=4.3875'));
  assert(!pending.includes('h=3.7375'));
  const first = paint('complete-buffers', 1, { 'ssm-buffer-first': after }).text;
  assert(first.includes('h=3.9750'));
  assert(!first.includes('h=4.3875'));
  const second = paint('complete-buffers', 1, {
    'ssm-buffer-first': after,
    'ssm-buffer-second': after,
  }).text;
  assert(second.includes('h=4.3875'));
  assert(!second.includes('h=3.7375'));
});

test('settled snapshot totals retain separate permissions', () => {
  assert(
    !paint('complete-buffers', 0).text.some((x) => x.includes('=45MiB') || x.includes('=325MiB')),
  );
  const first = paint('complete-buffers', 0, { 'ssm-snapshots45': after }).text;
  assert(first.some((x) => x.includes('=45MiB')));
  assert(!first.some((x) => x.includes('=325MiB')));
});

test('settled fresh timing outputs and crossing stay neutral throughout the question', () => {
  const text = paint('earned-transfer', 1, { 'earned-transfer-b2': after }).text;
  assert(!text.includes('936ms'));
  assert(!text.includes('609ms'));
  assert(!text.some((x) => x.includes('win:23')));
  assert(text.includes('Predictthetotalsandwhichmodelwins'));
});

test('trapezoid interpolation keeps its caption consistent with the moving write weights', () => {
  const id = 'ssm-trapezoid-half';
  const scene = lesson.scenes.find((scene) => scene.id === 'ssd-and-refinement');
  const beat = scene.beats.findIndex((entry) => entry.visual_cues?.some((cue) => cue.id === id));
  assert(paint(scene.id, beat, { [id]: before }).text.includes('Current-endpointEulerreference'));
  const moving = paint(scene.id, beat, { [id]: during }).text;
  assert(moving.includes('Interpolatingendpointweights'));
  assert(!moving.includes('Current-endpointEulerreference'));
  assert(paint(scene.id, beat, { [id]: after }).text.includes('Bothintervalendpointscontribute'));
});

test('new construction fixtures preserve ordered arithmetic and shared state', () => {
  assert.deepEqual(model.orderedAffineFixture().states, [2, 1.4]);
  assert.deepEqual(model.orderedAffineFixture(true).states, [1, 2.5]);
  const chunk = model.chunkStateFixture();
  const reference = [0.6, 0.74, 1.466, 1.7194];
  chunk.flatMap((r) => r.outputs).forEach((v, i) => assert(Math.abs(v - reference[i]) < 1e-12));
  model.orderedPrefixTree().outputs.forEach((v, i) => assert(Math.abs(v - reference[i]) < 1e-12));
  for (const weight of [0, 0.25, 0.5, 0.75, 1]) {
    const f = model.trapezoidWriteFixture(weight);
    assert(Math.abs(f.output - (Math.exp(-1) + (1 - weight) * Math.exp(-1) * 2 + weight)) < 1e-12);
  }
  assert.throws(() => model.trapezoidWriteFixture(-1), RangeError);
  for (const inputs of [
    [2, 3],
    [-1, 4],
    [0, 0],
  ]) {
    const f = model.multiDirectionFixture(inputs);
    assert.deepEqual(f.state, inputs);
    assert.deepEqual(f.outputs, [inputs[0] + inputs[1], inputs[0] - inputs[1]]);
  }
});
