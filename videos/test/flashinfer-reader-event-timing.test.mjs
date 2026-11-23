import test from 'node:test';
import assert from 'node:assert/strict';
import { draw, sampleModel } from '../animations/deep-dive-flashinfer.mjs';
const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };
const during = (progress) => ({ phase: 'during', progress });
const state = (event) => ({
  beat: 1,
  beatP: 0.99,
  cues: {
    'synthesis-reader-active': after,
    'synthesis-reader-event': event,
  },
});
function paint(current) {
  const texts = [],
    paths = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    focus: { target: (_, fn) => fn() },
    components: {
      card: (options) => {
        texts.push(options.label);
        return options;
      },
    },
    teaching: { bars() {} },
    text: (_, value) => texts.push(value),
    math() {},
    path: (_, points, style) => paths.push({ points, style }),
    circle() {},
  };
  draw({}, { id: 'synthesis' }, current, api);
  return { texts, paths };
}
test('an advanced paragraph position cannot release the page before the measured reader event', () => {
  const pending = sampleModel('synthesis', state(before));
  assert.equal(pending.time, 9);
  assert.equal(pending.lease, true);
  assert.equal(pending.complete, false);
  const picture = paint(state(before));
  assert(picture.texts.includes('Page 14: IN USE'));
  assert(picture.texts.includes('Read event: pending'));
});
test('the completion event releases the page within its own clause and the recap holds that result', () => {
  const event = sampleModel('synthesis', state(during(0.5)));
  assert.equal(event.time, 10.5);
  assert.equal(event.complete, true);
  assert.equal(event.lease, false);
  assert(paint(state(during(0.5))).texts.includes('Page 14: REUSABLE'));
  const recap = sampleModel('synthesis', { beat: 2, beatP: 0 });
  assert.equal(recap.time, 12);
  assert.equal(recap.complete, true);
});
