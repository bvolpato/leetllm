import test from 'node:test';
import assert from 'node:assert/strict';
import { draw, sampleModel } from '../animations/deep-dive-deepspeed.mjs';
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
function paint(beat, beatP, cues) {
  const grids = [],
    texts = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    focus: { target: (_, fn) => fn() },
    teaching: {
      grid: (options) => {
        grids.push(options);
        return options;
      },
    },
    components: { particle() {} },
    text: (_, value) => texts.push(value),
    path() {},
  };
  draw({}, { id: 'gather' }, { beat, beatP, cues }, api);
  return { grids, texts };
}
test('the first paragraph owns a complete full view by the coexistence clause', () => {
  const cues = { 'gather-layer-zero': after };
  const state = sampleModel('gather', { beat: 0, beatP: 0.8, cues });
  assert.equal(state.resident, 8);
  assert.equal(state.gathered, 8);
  assert.equal(state.total, 16);
  const view = paint(0, 0.8, cues);
  assert.deepEqual(
    view.grids[1].labels[0],
    Array.from({ length: 8 }, (_, i) => `L0p${i}`),
  );
});
test('the completed layer buffer is retained unchanged into the second paragraph', () => {
  const cues = { 'gather-layer-zero': after };
  assert.deepEqual(paint(0, 0.99, cues).grids, paint(1, 0, cues).grids);
  assert.equal(sampleModel('gather', { beat: 1, beatP: 0, cues }).total, 16);
});
test('a required full-view outline does not count as allocated storage before the gather starts', () => {
  const state = sampleModel('gather', { beat: 0, beatP: 0, cues: { 'gather-layer-zero': before } });
  assert.equal(state.gathered, 0);
  assert.equal(state.total, 8);
});
