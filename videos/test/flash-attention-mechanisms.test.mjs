import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import {
  attentionInventory,
  tileInventory,
  attentionBackwardRow,
  causalTileClass,
  finiteAccumulatorExample,
  cachedBlend,
  advanceTileSlot,
  tilePipelinePrefix,
  draw,
} from '../animations/flash-attention.mjs';

registerLessonFonts();
const close = (a, b, tolerance = 1e-9) =>
  assert(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);

function paint(id, beat, phases = {}, beatP = 0.5) {
  const cues = Object.fromEntries(
    Object.entries(phases).map(([name, phase]) => [
      name,
      {
        id: name,
        phase,
        progress: phase === 'before' ? 0 : 1,
        strength: 0,
        targets: [`${id}-state-${beat}`],
      },
    ]),
  );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Inspect the computed state', beats: [{}, {}, {}, {}] },
    { beat, beatP, t: 10, duration: 50, opacity: 1, cues },
    draw,
  );
}
const words = (frame) => frame.labels.map((x) => x.text);

test('logical allocation and transfer accounting keep row statistics separate from score matrices', () => {
  const a = attentionInventory(8, 32, 8192);
  assert.equal(a.score, 32 * 2 ** 30);
  assert.equal(a.fourPasses, 128 * 2 ** 30);
  assert.equal(a.lse, 8 * 2 ** 20);
  const doubled = attentionInventory(8, 32, 16384);
  assert.equal(doubled.score / a.score, 4);
  assert.equal(doubled.lse / a.lse, 2);
  assert.throws(() => attentionInventory(8, 32, 0));
});

test('a rectangular tile counts distinct QK and value widths with FP32 output and scores', () => {
  const a = tileInventory(8, 16, 32, 24);
  assert.deepEqual(a, { q: 512, k: 1024, v: 768, o: 768, s: 512, total: 3584 });
  assert.equal(tileInventory(128, 128, 64).total, 144 * 1024);
  assert.throws(() => tileInventory(128, 128, 0));
});

test('the softmax row gradient matches independent central differences for arbitrary upstream signal', () => {
  const s = [-0.5, 0.8, 1.3],
    v = [7, -2, 4],
    upstream = -2.5;
  const actual = attentionBackwardRow(s, v, upstream);
  const objective = (scores, values) => {
    const e = scores.map((x) => Math.exp(x)),
      z = e.reduce((a, b) => a + b, 0);
    return upstream * e.reduce((a, x, i) => a + (x * values[i]) / z, 0);
  };
  const epsilon = 1e-5;
  for (let i = 0; i < s.length; i++) {
    const hi = [...s],
      lo = [...s];
    hi[i] += epsilon;
    lo[i] -= epsilon;
    close(actual.ds[i], (objective(hi, v) - objective(lo, v)) / (2 * epsilon), 1e-8);
    const vh = [...v],
      vl = [...v];
    vh[i] += epsilon;
    vl[i] -= epsilon;
    close(actual.dv[i], (objective(s, vh) - objective(s, vl)) / (2 * epsilon), 1e-8);
  }
  close(
    actual.ds.reduce((a, b) => a + b, 0),
    0,
  );
});

test('absolute ranges distinguish wholly past, partly causal and wholly future unequal tiles', () => {
  assert.equal(causalTileClass(128, 255, 0, 127), 'past');
  assert.equal(causalTileClass(128, 255, 128, 191), 'boundary');
  assert.equal(causalTileClass(128, 255, 256, 319), 'future');
  assert.equal(causalTileClass(5, 5, 5, 5), 'past');
});

test('finite inputs can overflow an unnormalized accumulator while their mean is representable', () => {
  const a = finiteAccumulatorExample();
  assert.equal(a.normalized, 1e308);
  assert.equal(a.numerator, Infinity);
  assert.equal(a.accepted, false);
  assert.equal(finiteAccumulatorExample(1e100).accepted, true);
});

test('cached absolute position and valid length exclude both future and unused keys', () => {
  const v = [2, 4, 6, 8, 10, 12, 1000, 1000];
  assert.deepEqual(cachedBlend(5, v, 6), {
    allowed: [true, true, true, true, true, true, false, false],
    m: 0,
    l: 6,
    u: 42,
    output: 7,
  });
  assert.equal(cachedBlend(5, v, 6, 'upper-left').output, 2);
  assert.equal(cachedBlend(5, v, 6, 'all').output, 255.25);
  assert.deepEqual(cachedBlend(3, v, 6).allowed, [
    true,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
  ]);
});

test('copy completion permits reading but only consumer release permits buffer reuse', () => {
  let s = { A: { status: 'free', tile: null }, B: { status: 'free', tile: null } };
  const initial = structuredClone(s);
  s = advanceTileSlot(s, { slot: 'A', kind: 'issue', tile: 0 });
  assert.deepEqual(initial.A, { status: 'free', tile: null });
  assert.throws(
    () => advanceTileSlot(s, { slot: 'A', kind: 'consume' }),
    /wait for copy completion/,
  );
  s = advanceTileSlot(s, { slot: 'A', kind: 'copy-complete' });
  assert.throws(
    () => advanceTileSlot(s, { slot: 'A', kind: 'issue', tile: 2 }),
    /overwrite a live slot/,
  );
  s = advanceTileSlot(s, { slot: 'A', kind: 'consume' });
  assert.throws(
    () => advanceTileSlot(s, { slot: 'A', kind: 'issue', tile: 2 }),
    /overwrite a live slot/,
  );
  s = advanceTileSlot(s, { slot: 'A', kind: 'release' });
  assert.deepEqual(advanceTileSlot(s, { slot: 'A', kind: 'issue', tile: 2 }).A, {
    status: 'copying',
    tile: 2,
  });
  assert.deepEqual(tilePipelinePrefix(8).slots, {
    A: { status: 'copying', tile: 2 },
    B: { status: 'reading', tile: 1 },
  });
});

test('drawn scale bars share a zero baseline and retain the fixed-M result before changing M', () => {
  const before = paint('complexity-ledger', 2, { 'fa-scale-memory': 'before' });
  const after = paint('complexity-ledger', 2, { 'fa-scale-memory': 'after' });
  const bars = (frame) => frame.shapes.filter((s) => s.kind === 'rect' && s.width === 400);
  assert.equal(bars(before).length, 3);
  for (const b of [...bars(before), ...bars(after)]) close(b.y + b.height, 790);
  assert.deepEqual(
    bars(before).map((x) => x.height),
    [360, 180, 360],
  );
  assert.deepEqual(
    bars(after).map((x) => x.height),
    [360, 180, 180],
  );
  assert(words(before).includes('IO at fixed M'));
  assert(
    words(before).includes('At doubled n and current M: IO 4.00×, dense FLOPs 4×, row state 2×'),
  );
  assert(
    words(after).includes('At doubled n and current M: IO 2.00×, dense FLOPs 4×, row state 2×'),
  );
});

test('the same cached picture visibly repairs the wrong upper-left allowed set', () => {
  const failure = words(paint('alignment-failure', 1, { 'fa-absolute-repair': 'before' }));
  const repair = words(paint('alignment-failure', 1, { 'fa-absolute-repair': 'after' }));
  assert.equal(failure.filter((x) => x === 'allowed').length, 1);
  assert(failure.includes('Upper-left output 10'));
  assert.equal(repair.filter((x) => x === 'allowed').length, 4);
  assert(repair.includes('Absolute valid-mask output 37.5'));
});

test('fresh prediction withholds both wrong answers and the earned seven until their clauses', () => {
  const p = words(paint('fresh-cache-repair', 0));
  assert(!p.some((x) => x.startsWith('Wrong blend') || x.startsWith('Output7')));
  const phases = {
    'fa-fresh-unmasked': 'before',
    'fa-fresh-repair': 'before',
    'fa-fresh-two': 'before',
    'fa-fresh-seven': 'before',
  };
  assert(words(paint('fresh-cache-repair', 1, phases)).includes('Predict this mask’s blend'));
  phases['fa-fresh-two'] = 'after';
  assert(words(paint('fresh-cache-repair', 1, phases)).includes('Wrong blend 2'));
  phases['fa-fresh-unmasked'] = 'after';
  phases['fa-fresh-255'] = 'before';
  assert(words(paint('fresh-cache-repair', 1, phases)).includes('Predict this mask’s blend'));
  phases['fa-fresh-255'] = 'after';
  assert(words(paint('fresh-cache-repair', 1, phases)).includes('Wrong blend 255.25'));
  phases['fa-fresh-repair'] = 'after';
  assert(
    !words(paint('fresh-cache-repair', 1, phases)).includes('Output 7 · dense and tiled agree'),
  );
  phases['fa-fresh-seven'] = 'after';
  assert(
    words(paint('fresh-cache-repair', 1, phases)).includes('Output 7 · dense and tiled agree'),
  );
});
