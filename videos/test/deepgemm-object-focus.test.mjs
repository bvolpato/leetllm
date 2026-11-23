import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as deep from '../animations/deep-dive-deepgemm.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { readLesson } from '../lib/lesson.mjs';

registerLessonFonts();
const lesson = await readLesson(
  new URL('../lessons/deep-dive-deepgemm.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  reveal: progress,
  strength: 0,
  active: false,
  targets: [],
});
const paint = (id, beat, beatP, cues = {}) => {
  const scene = lesson.scenes.find((scene) => scene.id === id),
    declared = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [c.id, cue(i < beat ? 1 : i > beat ? 0 : beatP)]),
      ),
    );
  const state = {
    t: 6,
    duration: 56,
    opacity: 1,
    beat,
    beatP,
    cueTiming: 'explicit-test-cues',
    cues: { ...declared, ...cues },
  };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'DeepGEMM' },
    state,
    deep.draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { frame, model: deep.sampleDeepGemmVisual(id, state) };
};

test('scale focus contains the actual grouped bars and computed contributions', () => {
  const { frame, model } = paint('scales', 1, 0.2);
  for (const id of ['scales-contribution-0', 'scales-contribution-1']) {
    const target = frame.targets.find((target) => target.id === id);
    assert(target && target.markCounts.shapes >= 2);
    assert(target.y < 700 && target.y + target.height > 800);
  }
  assert.equal(model.contributions[1], 4.5);
  assert(frame.labels.some((label) => label.text.startsWith('4.50')));
});

test('a mathematically valid transposed descriptor can fail the explicit toy inner-stride rule', () => {
  const views = deep.copyLayoutViews();
  assert.deepEqual(views.base.shape, [2, 3]);
  assert.deepEqual(views.base.strides, [3, 1]);
  assert.equal(views.base.accepted, true);
  assert.deepEqual(views.transpose.shape, [3, 2]);
  assert.deepEqual(views.transpose.strides, [1, 3]);
  assert.equal(views.transpose.accepted, false);
  const { frame } = paint('movement', 0, 0.9, { 'movement-beat-1-focus-2': cue(1) });
  assert(
    frame.targets.some(
      (target) => target.id === 'movement-copy-descriptors' && target.markCounts.shapes >= 2,
    ),
  );
  assert(
    frame.labels.some(
      (label) => label.text.includes('inner stride 3') && label.text.includes('FAIL'),
    ),
  );
});

test('completion and actual output handoff follow the word cue and persist afterward', () => {
  const before = paint('movement', 2, 0.9, { 'dg-movement-2-0': cue(0) });
  assert.equal(before.model.complete, false);
  assert.equal(before.model.outputReleased, false);
  const middle = paint('movement', 2, 0.1, { 'dg-movement-2-0': cue(0.5) });
  assert.equal(middle.model.complete, true);
  assert(middle.model.releaseProgress > 0 && middle.model.releaseProgress < 1);
  const done = paint('movement', 2, 0.1, { 'dg-movement-2-0': cue(1) });
  assert.equal(done.model.outputReleased, true);
  assert(done.frame.labels.some((label) => label.text === 'Output received'));
  assert(
    done.frame.targets.some(
      (target) => target.id === 'movement-output-handoff' && target.markCounts.shapes > 0,
    ),
  );
});

test('indexer focus follows computed clipping and weighted terms rather than query headings', () => {
  const changed = deep.indexerReference([2, -1]);
  assert.deepEqual(changed.dots, [2, -1]);
  assert.deepEqual(changed.relu, [2, 0]);
  assert.equal(changed.score, 0.8);
  const { frame, model } = paint('indexer', 0, 0.5, {
    'dg-indexer-0-1': cue(1),
    'dg-indexer-0-2': cue(1),
  });
  assert.equal(model.score, 0.4);
  assert(frame.labels.some((label) => label.text === 'dot -0.5'));
  assert(frame.labels.some((label) => label.text === 'ReLU 0'));
  assert(
    frame.targets.some((target) => target.id === 'indexer-total' && target.markCounts.math > 0),
  );
  assert(
    frame.targets.some((target) => target.id === 'indexer-transform-1' && target.height > 100),
  );
});

test('padding preserves real rows, including a truly empty expert', () => {
  const first = deep.alignExpertRows([96, 257, 0], 128),
    second = deep.alignExpertRows(first.rows, 256);
  assert.deepEqual(first.capacities, [128, 384, 0]);
  assert.equal(first.useful, 353);
  assert.equal(first.padding, 159);
  assert.deepEqual(second.capacities, [256, 512, 0]);
  assert.equal(second.useful, first.useful);
  assert.equal(second.padding, 415);
  assert.equal(first.paddingShare, 159 / 512);
  assert.equal(first.overhead, 159 / 353);
  assert.throws(() => deep.alignExpertRows([1, -1], 128), RangeError);
});

test('compressed and sparse maps retain valid population and absolute token identity', () => {
  assert.deepEqual(deep.compressedKeySelection([-0.4, -0.2, 0], 40, 42), [
    { score: -0.2, column: 1, token: 41 },
  ]);
  assert.deepEqual(deep.compressedKeySelection([99], 40, 40), []);
  assert.deepEqual(deep.sparseCachePosition([3, 7, 1], 4, 5, 2), {
    blockIndex: 1,
    block: 7,
    offset: 1,
    token: 29,
  });
  assert.throws(() => deep.sparseCachePosition([3, 3], 4, 5), RangeError);
  assert.throws(() => deep.sparseCachePosition([3, 7], 4, 8), RangeError);
});

test('one leased slot delays the second dispatch through the last first-chunk consumer', () => {
  const one = deep.ringSchedule(1),
    two = deep.ringSchedule(2),
    get = (events, id) => events.find((e) => e.id === id);
  assert.equal(get(one, 'B dispatch').start, get(one, 'A combine').end);
  assert(get(two, 'B dispatch').start < get(two, 'A combine').end);
  assert.equal(Math.max(...one.map((e) => e.end)), 8);
  assert.equal(Math.max(...two.map((e) => e.end)), 6);
  for (const events of [one, two])
    for (const lane of [0, 1]) {
      const ordered = events.filter((e) => e.lane === lane).sort((a, b) => a.start - b.start);
      for (let i = 1; i < ordered.length; i++) assert(ordered[i].start >= ordered[i - 1].end);
    }
});

test('new alignment numbers and opening totals stay hidden through incomplete result clauses', () => {
  for (const p of [0, 0.1, 0.5, 0.99]) {
    const before = paint('fresh-contract', 2, 0.8, { 'dg-fresh-contract-2-1': cue(p) });
    assert(!before.frame.labels.some((l) => /^\d+ reserved$/.test(l.text)));
    const intro = paint('intro', 1, 0.8, { 'dg-intro-1-4': cue(1), 'dg-intro-1-5': cue(p) });
    assert.equal(intro.model.totalsReady, false);
    assert(!intro.frame.labels.some((l) => l.text.includes('reserved 640')));
  }
  const final = paint('fresh-contract', 2, 0.8, { 'dg-fresh-contract-2-1': cue(1) });
  assert(final.frame.labels.some((l) => l.text === '256 reserved'));
  assert(final.frame.labels.some((l) => l.text === '512 reserved'));
  assert(final.frame.labels.some((l) => l.text === '0 reserved'));
});
