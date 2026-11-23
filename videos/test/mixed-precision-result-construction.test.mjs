import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { drawFrame } from '../lib/scene.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import {
  partialSumConstruction,
  saturationFixture,
  spikeScaleFixture,
} from '../films/mixed-precision/construction.mjs';

registerLessonFonts();
const root = fileURLToPath(new URL('../../', import.meta.url));
const entry = process.env.MIXED_ENTRY
  ? pathToFileURL(resolve(process.env.MIXED_ENTRY))
  : new URL('../animations/mixed-precision.mjs', import.meta.url);
const { draw } = await import(entry);
const lesson = await readLesson(
  process.env.MIXED_LESSON ?? new URL('../lessons/mixed-precision.lesson.yaml', import.meta.url),
  root,
);
const before = { phase: 'before', progress: 0 };
const during = (progress) => ({ phase: 'during', progress });
const after = { phase: 'after', progress: 1 };
const canvas = createCanvas(1920, 1080);
const ctx = canvas.getContext('2d');

function paint(id, beat, changes = {}) {
  const scene = lesson.scenes.find((scene) => scene.id === id);
  const cues = Object.fromEntries(
    scene.beats.flatMap((row, i) =>
      (row.visual_cues ?? []).map((cue) => [cue.id, i < beat ? after : before]),
    ),
  );
  Object.assign(cues, changes);
  const audit = drawFrame(
    ctx,
    lesson,
    scene,
    {
      beat,
      beatP: 0.75,
      p: 0.75,
      t: 10,
      opacity: 1,
      duration: 30,
      cues,
    },
    draw,
  );
  return {
    labels: audit.labels.filter((label) => label.alpha > 0.25).map((label) => label.text),
    issues: layoutIssues(audit),
    rgba: createHash('sha256')
      .update(ctx.getImageData(0, 0, 1920, 1080).data)
      .digest('hex'),
  };
}
const has = (frame, text) => frame.labels.some((label) => label.includes(text));

test('the supplied numerical models distinguish finite paths from actual saturation and overflow', () => {
  assert.deepEqual(saturationFixture(200), { input: 200, maximum: 448, stored: 200, error: 0 });
  assert.deepEqual(saturationFixture(500), { input: 500, maximum: 448, stored: 448, error: 52 });
  assert.deepEqual(
    spikeScaleFixture(112, 7).map((row) => row.restored),
    [112, 7],
  );
  const final = { cues: { 'partial-final': after } };
  assert.equal(partialSumConstruction(final).fp16, Infinity);
  assert.equal(partialSumConstruction(final).fp32, 40000);
  assert.equal(partialSumConstruction(final, [20000, 20000, -20000]).fp16, 20000);
});

test('FP8 value packets stay entirely inside the gaps between panels', () => {
  for (const cue of ['fp8-current-result', 'fp8-delayed-result']) {
    for (const progress of [0.001, 1 / 3 + 0.001, 2 / 3 + 0.001, 0.999]) {
      assert.deepEqual(paint('fp8-contract', 1, { [cue]: during(progress) }).issues, []);
    }
  }
});

test('underflow cast and recovery wait for their complete result clauses', () => {
  assert(!has(paint('underflow', 0, { 'underflow-zero-result': during(1) }), 'Stored 0'));
  assert(has(paint('underflow', 0, { 'underflow-zero-result': after }), 'Stored 0'));
  assert(!has(paint('underflow', 1, { 'underflow-stored-result': during(1) }), 'Stored 3.81'));
  assert(has(paint('underflow', 1, { 'underflow-stored-result': after }), 'Stored 3.81'));
  assert(!has(paint('underflow', 2, { 'underflow-recovered-result': during(1) }), 'Recovered '));
  assert(has(paint('underflow', 2, { 'underflow-recovered-result': after }), 'Recovered '));
});

test('the separate log-axis transfer also holds completed cast and recovery cards', () => {
  assert(!has(paint('transfer', 0, { 'tiny-gradient': during(1) }), 'FP16 cast → 0'));
  assert(has(paint('transfer', 0, { 'tiny-gradient': after }), 'FP16 cast → 0'));
  assert(!has(paint('transfer', 1, { 'scaled-storage': during(1) }), 'FP16 stores'));
  assert(has(paint('transfer', 1, { 'scaled-storage': after }), 'FP16 stores'));
  assert(!has(paint('transfer', 2, { 'recovered-gradient': during(1) }), 'Recovered g'));
  assert(has(paint('transfer', 2, { 'recovered-gradient': after }), 'Recovered g'));
});

test('finite loss and backward gradient have independent result permissions', () => {
  const held = paint('controller', 3, { 'finite-loss': during(1), 'finite-gradient': during(1) });
  assert(!has(held, 'Loss = 4 + Inf = Inf'));
  assert(!has(held, 'Gradient = 2 × 2 = 4'));
  const loss = paint('controller', 3, { 'finite-loss': after });
  assert(has(loss, 'Loss = 4 + Inf = Inf'));
  assert(!has(loss, 'Gradient = 2 × 2 = 4'));
  assert(has(paint('controller', 3, { 'finite-gradient': after }), 'Gradient = 2 × 2 = 4'));
});

test('two optimizer decisions finish separately before the shared update', () => {
  const held = paint('controller', 4, { 'optimizer-a': during(1), 'optimizer-b': before });
  assert(!has(held, '= 0.9'));
  assert(!has(held, 'SKIP · weight remains 1'));
  const a = paint('controller', 4, { 'optimizer-a': after });
  assert(has(a, '= 0.9'));
  assert(!has(a, 'SKIP · weight remains 1'));
  assert(!has(a, 'scale 256 → 128'));
  const both = { 'optimizer-a': after, 'optimizer-b': after };
  assert(
    !has(
      paint('controller', 4, { ...both, 'optimizer-shared-scale': during(1) }),
      'scale 256 → 128',
    ),
  );
  assert(
    has(paint('controller', 4, { ...both, 'optimizer-shared-scale': after }), 'scale 256 → 128'),
  );
});

test('unequal token reductions preserve current partials and hold both final means', () => {
  const partial = paint('ordering', 3, { 'unequal-group': during(0.5) });
  assert(has(partial, 'B partial sum -2 · 1/3 arrived'));
  assert(!has(partial, '= −1'));
  assert(!has(partial, '= 0 · wrong token weighting'));
  assert(has(paint('ordering', 3, { 'unequal-mean': after }), '= −1'));
  assert(has(paint('ordering', 3, { 'unequal-means': after }), '= 0 · wrong token weighting'));
});

test('the actual activation contraction settles with the full one-third clause', () => {
  assert(has(paint('memory', 1, { 'memory-contraction': during(0.5) }), '4.0 GB'));
  assert(has(paint('memory', 1, { 'memory-contraction': after }), '3.2 GB'));
});

test('static byte parts assemble before the completed total is stated', () => {
  const parts = { 'memory-fp32-parts': after };
  const held = paint('memory', 3, { ...parts, 'memory-fp32-total': during(1) });
  assert(!held.labels.includes('16 B'));
  assert(paint('memory', 3, { ...parts, 'memory-fp32-total': after }).labels.includes('16 B'));
});

test('reduction rounding and the fixed-draw policy actions wait for their own clauses', () => {
  assert(!has(paint('communication', 1, { 'reduction-bf16-round': during(1) }), '257 is halfway'));
  assert(has(paint('communication', 1, { 'reduction-bf16-round': after }), '257 is halfway'));
  const held = paint('policy-mismatch', 1, { 'policy-wide-probability': after });
  assert(has(held, 'P(action 0) = 0.499500'));
  assert(!has(held, 'select action'));
  assert(has(paint('policy-mismatch', 1, { 'policy-wide-action': after }), 'select action 1'));
  assert(has(paint('policy-mismatch', 1, { 'policy-rounded-action': after }), 'select action 0'));
});

test('FP8 spike restore, MX total and finite saturation error have distinct completed results', () => {
  assert(!has(paint('fp8-contract', 1, { 'fp8-current-result': during(1) }), 'restored 512'));
  assert(has(paint('fp8-contract', 1, { 'fp8-current-result': after }), 'restored 512'));
  assert(!has(paint('fp8-contract', 1, { 'fp8-delayed-result': during(1) }), 'restored 8'));
  assert(has(paint('fp8-contract', 1, { 'fp8-delayed-result': after }), 'restored 8'));
  assert(!has(paint('fp8-contract', 2, { 'mx-total': during(1) }), '33 bytes'));
  assert(has(paint('fp8-contract', 2, { 'mx-total': after }), '33 bytes'));
  assert(!has(paint('fp8-contract', 3, { 'fp8-error': during(1) }), '500 − 448 = 52'));
  assert(has(paint('fp8-contract', 3, { 'fp8-error': after }), '500 − 448 = 52'));
});

test('the spoken quality question and pause stay neutral; answers are earned separately', () => {
  const question = paint('earned-transfer', 1);
  assert(!has(question, 'FAIL POLICY'));
  assert(!has(question, 'PASS BOTH'));
  assert(!has(question, 'Only B enters'));
  const a = paint('earned-transfer', 2, { 'quality-a': after });
  assert(has(a, 'FAIL POLICY'));
  assert(!has(a, 'PASS BOTH'));
  assert(!has(a, 'Only B enters'));
  assert(
    has(
      paint('earned-transfer', 2, {
        'quality-a': after,
        'quality-b': after,
        'quality-speed': after,
      }),
      'Only B enters',
    ),
  );
});

test('the two partial accumulators commit the supplied operations in order', () => {
  const first = { 'partial-first': after };
  const second = { ...first, 'partial-second': after };
  const held = paint('earned-transfer', 4, { ...first, 'partial-second': during(1) });
  assert(!held.labels.includes('Inf'));
  assert(!held.labels.includes('80000'));
  const overflow = paint('earned-transfer', 4, second);
  assert(overflow.labels.includes('Inf'));
  assert(overflow.labels.includes('80000'));
  const final = paint('earned-transfer', 4, { ...second, 'partial-final': after });
  assert(final.labels.includes('Inf'));
  assert(final.labels.includes('40000'));
});

for (const [id, beat, cue] of [
  ['formats', 3, 'autocast-matmul'],
  ['controller', 3, 'finite-gradient'],
  ['ordering', 3, 'unequal-group'],
  ['memory', 3, 'memory-master-parts'],
  ['policy-mismatch', 1, 'policy-wide-probability'],
  ['fp8-contract', 1, 'fp8-current-result'],
  ['fp8-contract', 2, 'mx-elements'],
  ['fp8-contract', 3, 'fp8-saturation'],
  ['earned-transfer', 4, 'partial-second'],
]) {
  test(`${id}/${cue} constructs a visibly changing operation before its result`, () => {
    const prior = cue === 'partial-second' ? { 'partial-first': after } : {};
    assert.notEqual(
      paint(id, beat, { ...prior, [cue]: during(0.2) }).rgba,
      paint(id, beat, { ...prior, [cue]: during(0.8) }).rgba,
    );
  });
}
