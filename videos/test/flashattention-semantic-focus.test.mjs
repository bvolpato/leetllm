import test from 'node:test';
import assert from 'node:assert/strict';
import { draw, summary } from '../animations/deep-dive-flashattention.mjs';
function paint(scene, state) {
  const stack = [],
    grids = [],
    texts = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    components: { card: (options) => options },
    teaching: {
      grid: (options) => {
        grids.push({ ...options, targets: [...stack] });
        return options;
      },
      transfer() {},
    },
    focus: {
      target: (id, fn) => {
        stack.push(id);
        try {
          return fn();
        } finally {
          stack.pop();
        }
      },
    },
    text: (_, text) => texts.push({ text, targets: [...stack] }),
    math() {},
  };
  draw({}, { id: scene }, state, api);
  return { grids, texts };
}
test('working-tile focus selects the actual four-by-four allocation and its byte count', () => {
  const view = paint('intro', { beat: 1, beatP: 0.7 });
  const tile = view.grids.filter((grid) => grid.targets.includes('intro-live-tile'));
  assert.equal(tile.length, 1);
  assert.equal(tile[0].rows, 4);
  assert.equal(tile[0].columns, 4);
  assert(
    view.texts.some(
      (mark) => mark.targets.includes('intro-live-tile') && mark.text.includes('32 bytes'),
    ),
  );
});
test('the compact-summary focus contains the state derived from the current tile, with the query outside it', () => {
  const state = summary(2),
    view = paint('tiles', { beat: 0, beatP: 0.75 });
  const focused = view.texts.filter((mark) => mark.targets.includes('tiles-running-summary'));
  assert.deepEqual(
    focused.map((mark) => mark.text),
    [`m = ${state.m}     ℓ ≈ ${state.l.toFixed(4)}`],
  );
});
