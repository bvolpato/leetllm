import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { draw, sampleModel } = await import(
  process.env.DEEPSPEED_ANIMATION
    ? pathToFileURL(process.env.DEEPSPEED_ANIMATION).href
    : new URL('../animations/deep-dive-deepspeed.mjs', import.meta.url).href
);

function capture(progress) {
  const labels = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    components: { card() {} },
    teaching: {},
    focus: { target: (_, paint) => paint(), progress: () => progress },
    text: (_, value) => labels.push(value),
    math() {},
    rect() {},
    line() {},
    circle() {},
  };
  draw({}, { id: 'checkpoint' }, { beat: 1, beatP: 0.5 }, api);
  return labels;
}

test('checkpoint update displays computed Adam states rather than interpolated numbers', () => {
  const model = sampleModel('checkpoint', { beat: 1, beatP: 0.5 });
  for (const progress of [0.5, 0.1, 0, 0.9, 0.999, 1]) {
    const labels = capture(progress),
      done = progress === 1;
    const expected = done ? [model.full, model.weightsOnly] : [model.saved, [model.saved[0], 0, 0]];
    assert.deepEqual(
      labels.filter((value) => value.startsWith('w = ')),
      expected.map((value) => 'w = ' + value[0].toFixed(8)),
    );
    assert.deepEqual(
      labels.filter((value) => value.startsWith('m = ')),
      expected.map((value) => 'm = ' + value[1].toFixed(6) + ' · v = ' + value[2].toFixed(6)),
    );
    assert(
      labels.includes(
        done ? 'Next-update gap ≈ ' + model.gap.toFixed(8) : 'Next-update gap: pending',
      ),
    );
  }
});
