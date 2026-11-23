import test from 'node:test';
import assert from 'node:assert/strict';
import { pathBounds, unionBounds } from 'vizmatic/stage';
import { readLesson } from '../lib/lesson.mjs';
import { compileStageLesson, estimatedTimeline } from '../lib/stage-lesson.mjs';
import definition from '../stage-lessons/kv-cache.film.mjs';
import { requestBudgetState } from '../films/kv-cache/stages/budget-requests.mjs';
import { DROPPED_POSITIONS, retentionState } from '../films/kv-cache/stages/position-retention.mjs';
import { kernelReadState } from '../films/kv-cache/stages/kernel.mjs';

const videos = new URL('../', import.meta.url);
const lesson = await readLesson(
  new URL('stage-lessons/kv-cache.lesson.yaml', videos),
  new URL('../', videos).pathname,
);
const timeline = estimatedTimeline(lesson);
const { compiled } = await compileStageLesson(definition, lesson, timeline);
const scene = (id) => timeline.scenes.find((scene) => scene.id === id);
const cue = (id, name) => scene(id).visualCues.find((cue) => cue.id === name);

/** Measure the visible text, including glyphs inside a dynamic construction. */
function labelsAt(id, seconds) {
  const labels = new Map();
  for (const op of compiled.frame(scene(id).start + seconds).ops) {
    if (op.kind !== 'path' || (op.fillAlpha ?? 0) < 0.5) continue;
    for (let node = op.node; node; node = node.parent) {
      if (typeof node.source === 'string') {
        const bounds = unionBounds(labels.get(node.source) ?? null, pathBounds(op.path));
        if (bounds) labels.set(node.source, bounds);
      }
    }
  }
  return labels;
}

test('ran appears as output after the choice, then joins the input row when fed back', () => {
  const picked = cue('hook', 'ran');
  const feed = cue('hook', 'feed-back');
  const before = labelsAt('hook', picked.end - 1 / timeline.fps);
  assert(!before.has('ran'), 'the chosen token appeared before its spoken reveal');
  const output = labelsAt('hook', picked.end + 0.3);
  assert(output.has('ran'));
  assert(output.has('Next token'));
  assert(output.get('ran').y > output.get('(2, 1)').y + output.get('(2, 1)').height);
  assert.deepEqual(labelsAt('hook', feed.start - 1 / timeline.fps).get('ran'), output.get('ran'));
  const question = labelsAt('hook', cue('hook', 'ask').end + 1);
  assert(!question.has('Next token'));
  const ran = question.get('ran');
  const fox = question.get('fox');
  assert.deepEqual(labelsAt('hook', feed.end).get('ran'), ran);
  assert(ran.x > fox.x + fox.width && ran.y < fox.y + fox.height && ran.y + ran.height > fox.y);
  assert(ran.y + ran.height < question.get('(1, 0)').y, 'a copy of ran remained below the cache');
  assert(question.has('Which tokens need a fresh key and value?'));

  const append = cue('hook', 'new-pair');
  const waiting = labelsAt('hook', append.end - 1 / timeline.fps);
  const filled = labelsAt('hook', append.end + 1);
  const mixed = labelsAt('hook', cue('hook', 'mix').end + 0.5);
  for (const value of ['(1, 0)', '(2, 1)', '(0, 1)', '(0, 3)']) {
    assert(before.has(value));
    for (const frame of [output, question, waiting, filled, mixed]) {
      assert.deepEqual(frame.get(value), before.get(value), `cached ${value} moved or disappeared`);
    }
  }
  for (const value of ['(1, 1)', '(4, 2)']) {
    for (const frame of [output, question, waiting]) assert(!frame.has(value));
    assert(filled.has(value));
    assert.deepEqual(mixed.get(value), filled.get(value));
  }
  assert(mixed.has('Weighted mix   (2.46, 1.90)'));
});

test('packing preserves the live payload and cannot recover enough space', () => {
  assert.equal(requestBudgetState().total, 1600);
  const trimmed = requestBudgetState(0);
  assert.equal(trimmed.recovered, 3 * 24);
  assert.equal(trimmed.total, 1528);
  assert.equal(trimmed.over, 568);
  const reduced = requestBudgetState(0, 930 / 1528);
  assert.equal(reduced.total, 930);
  assert.equal(reduced.over, 0);
  assert(labelsAt('shrink', cue('shrink', 'smaller').start + 1.5).has('1528 / 960 units'));
  assert(labelsAt('shrink', cue('shrink', 'batching').start + 1.6).has('1528 / 960 units'));
  assert(labelsAt('shrink', cue('shrink', 'fewer').start + 1.3).has('930 / 960 units'));
});

test('eviction releases complete positions and conserves retained plus removed bytes', () => {
  assert.equal(new Set(DROPPED_POSITIONS).size, 8);
  assert(DROPPED_POSITIONS.includes(9));
  for (let count = 0; count <= 8; count++) {
    const state = retentionState(count);
    assert.equal(state.kib + state.savedKib, 6400);
    assert.equal(state.kib, state.retained * 320);
  }
  const before = labelsAt('shrink', cue('shrink', 'evicting').start - 0.05);
  assert(before.has('20 × 320 KiB = 6,400 KiB'));
  assert(before.has('FP16 baseline. The selected positions are illustrative.'));
  assert(!before.has('12 × 320 KiB = 3,840 KiB'));
  const after = labelsAt('shrink', cue('shrink', 'evicting').start + 2.6);
  assert(after.has('12 × 320 KiB = 3,840 KiB'));
  assert(after.has('2,560 KiB removed'));
});

test('the table walk loads A in logical order and an owned unused slot corrupts attention', () => {
  const correct = kernelReadState();
  assert.deepEqual(
    correct.reads.map((read) => [read.block, read.slot]),
    [
      [7, 0],
      [7, 1],
      [7, 2],
      [7, 3],
      [2, 0],
      [2, 1],
    ],
  );
  assert(Math.abs(correct.output[0] - 1.9108031644776926) < 1e-12);
  assert(Math.abs(correct.output[1] - 1.5321731867143422) < 1e-12);
  assert(Math.abs(correct.reads.reduce((sum, read) => sum + read.weight, 0) - 1) < 1e-12);
  const extra = kernelReadState(7);
  assert.deepEqual(
    [extra.reads.at(-1).block, extra.reads.at(-1).slot, extra.reads.at(-1).valid],
    [2, 2, false],
  );
  assert.deepEqual(extra.output, [999, 999]);
  assert.equal(kernelReadState(0).output, null);
  assert.throws(() => kernelReadState(9));
  assert(!labelsAt('kernel', cue('kernel', 'same').end - 1 / 30).has('paged: (1.91, 1.53)'));
  assert(labelsAt('kernel', cue('kernel', 'same').end + 0.8).has('paged: (1.91, 1.53)'));
  assert(!labelsAt('kernel', cue('kernel', 'garbage').end - 1 / 30).has('paged: (999.00, 999.00)'));
  assert(labelsAt('kernel', cue('kernel', 'garbage').end + 0.8).has('paged: (999.00, 999.00)'));
});
