import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draw,
  flashinferExtensionFrame,
  mergeReference,
} from '../animations/deep-dive-flashinfer.mjs';
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
const names = ['length', 'plan', 'lease', 'refresh', 'complete'];
const cues = (changed) =>
  Object.fromEntries(names.map((n) => ['fi-fresh-tail-' + n, changed[n] ?? before]));
test('fresh question withholds new length, plan verdict and reuse verdict through its hold', () => {
  for (const beatP of [0, 0.5, 0.99, 1]) {
    const s = flashinferExtensionFrame('fresh-tail', { beat: 0, beatP, cues: cues({}) });
    assert.equal(s.lengthReady, false);
    assert.equal(s.planVerdictReady, false);
    assert.equal(s.leaseVerdictReady, false);
  }
});
test('fresh outcomes follow their separate completed clauses rather than paragraph progress', () => {
  const state = (changed) => ({ beat: 1, beatP: 0.99, cues: cues(changed) });
  const length = flashinferExtensionFrame('fresh-tail', state({ length: after }));
  assert.equal(length.newLength, 16);
  assert.equal(length.lengthReady, true);
  assert.equal(length.planVerdictReady, false);
  assert.equal(length.leaseVerdictReady, false);
  const plan = flashinferExtensionFrame('fresh-tail', state({ length: after, plan: after }));
  assert.equal(plan.oldPlan, 15);
  assert.equal(plan.planVerdictReady, true);
  assert.equal(plan.leaseVerdictReady, false);
  const lease = flashinferExtensionFrame(
    'fresh-tail',
    state({ length: after, plan: after, lease: after }),
  );
  assert.equal(lease.currentTick, 12);
  assert.equal(lease.complete, false);
  assert.equal(lease.leaseVerdictReady, true);
});
test('refreshing the plan does not complete the independent reader event', () => {
  const s = flashinferExtensionFrame('fresh-tail', {
    beat: 2,
    beatP: 0.99,
    cues: cues({ refresh: after }),
  });
  assert.equal(s.refreshed, true);
  assert.equal(s.complete, false);
  assert.equal(s.currentTick, 12);
  const completed = flashinferExtensionFrame('fresh-tail', {
    beat: 2,
    beatP: 0.99,
    cues: cues({ refresh: after, complete: after }),
  });
  assert.equal(completed.currentTick, 14);
  assert.equal(completed.complete, true);
});
test('page-list permutation changes the actual lookup and restoration repairs the same slot', () => {
  const wrong = flashinferExtensionFrame('page-permutation', {
    beat: 0,
    beatP: 0.99,
    cues: { 'fi-page-permutation-sort': after, 'fi-page-permutation-wrongpage': after },
  });
  assert.deepEqual(wrong.pages, [3, 6, 14]);
  assert.equal(wrong.page, 6);
  assert.equal(wrong.slot, 1);
  assert.equal(wrong.invalidTail, true);
  const repaired = flashinferExtensionFrame('page-permutation', {
    beat: 1,
    beatP: 0.99,
    cues: { 'fi-page-permutation-repair': after },
  });
  assert.deepEqual(repaired.pages, [3, 14, 6]);
  assert.equal(repaired.page, 14);
  assert.equal(repaired.slot, 1);
  assert.equal(repaired.invalidTail, false);
});
test('CPU empty-state branch and scale-before-sum protect finite merge inputs', () => {
  assert.deepEqual(mergeReference([0, 0], -Infinity, [2, 4], 3), { output: [2, 4], b: 3 });
  assert.deepEqual(mergeReference([0, 0], -Infinity, [0, 0], -Infinity), {
    output: [0, 0],
    b: -Infinity,
  });
  assert.equal(mergeReference([1e308], 0, [1e308], 0).output[0], 1e308);
  assert(
    Math.abs(mergeReference([1.6e308], 1, [1.2e308], 0).output[0] / 1e308 - 1.4666666666666666) <
      1e-14,
  );
  assert.throws(() => mergeReference([2], -Infinity, [4], 0), RangeError);
  assert.throws(() => mergeReference([1], NaN, [2], 0), RangeError);
  assert.throws(() => mergeReference([1, 2], 0, [2], 0), RangeError);
});

function paint(id, state) {
  const rectangles = [],
    texts = [];
  draw({}, { id }, state, {
    C: new Proxy({}, { get: (_, k) => String(k) }),
    focus: { target: (_, fn) => fn() },
    teaching: { grid: () => ({}) },
    components: { card: (o) => o },
    text: (_, v) => texts.push(String(v)),
    rect: (_, x, y, width, height, fill, stroke) =>
      rectangles.push({ x, y, width, height, fill, stroke }),
    line() {},
    circle() {},
    path() {},
  });
  return { rectangles, texts };
}
test('a deliberately wrong mask never changes the query position arithmetic', () => {
  for (const [progress, count] of [
    [0.2, 1],
    [0.5, 9],
    [0.9, 6],
  ]) {
    const state = {
      beat: 2,
      beatP: progress,
      cues: { 'fi-causal-rule-2': { phase: 'during', progress } },
    };
    const s = flashinferExtensionFrame('causal-rule', state);
    assert.equal(s.position, 5);
    assert.equal(s.visible, count);
    assert(paint('causal-rule', state).texts.includes('i=0; K−Q+i =9−4+0 =5'));
  }
});
test('schedule geometry uses the same cost scale for a chunk and the dependent merge', () => {
  for (const [beat, start] of [
    [0, 680],
    [1, 980],
    [2, 980],
  ]) {
    const picture = paint('split-schedule', { beat, beatP: 1 });
    const chunk = picture.rectangles.find(
      (r) => r.x === 380 && r.y === 390 && r.stroke === 'muted',
    );
    const merge = picture.rectangles.find(
      (r) => r.x === start && r.y === 390 && r.stroke === 'muted',
    );
    assert.equal(chunk.width, 300);
    assert.equal(merge.width, 75);
    assert.equal(chunk.width / merge.width, 4);
  }
  assert.equal(flashinferExtensionFrame('split-schedule', { beat: 2, beatP: 1 }).finish, 9);
});
