import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { draw } = await import(
  process.env.PROBABILITY_ANIMATION
    ? pathToFileURL(process.env.PROBABILITY_ANIMATION).href
    : new URL('../animations/probability.mjs', import.meta.url).href
);

function capture(scene, cues) {
  const bars = [],
    labels = [],
    math = [],
    opacities = [],
    stack = [];
  const ctx = {
    globalAlpha: 1,
    save() {
      stack.push(this.globalAlpha);
    },
    restore() {
      this.globalAlpha = stack.pop();
    },
  };
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    components: {},
    focus: { target: (_, paint) => paint() },
    teaching: {
      bars: (o) => {
        bars.push(o.values);
        opacities.push(ctx.globalAlpha);
      },
    },
    rect() {},
    text: (_, v) => labels.push(v),
    math: (_, v) => math.push(v),
  };
  draw(
    ctx,
    { id: scene },
    {
      beat: 2,
      beatP: 0.5,
      cues: Object.fromEntries(Object.entries(cues).map(([id, progress]) => [id, { progress }])),
    },
    api,
  );
  return { bars, labels, math, opacities };
}

test('double-softmax reveal changes opacity while every displayed distribution remains normalized', () => {
  const settled = capture('log-loss', { 'loss-library': 1 });
  for (const progress of [0, 0.1, 0.437, 0.5, 0.9, 1]) {
    const frame = capture('log-loss', { 'loss-library': progress });
    assert.deepEqual(frame.bars[1], settled.bars[1]);
    assert(Math.abs(frame.bars[1].reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.equal(frame.opacities[1], progress);
  }
});

test('planning width always agrees with the displayed current sample count, including the returned failure state', () => {
  for (const progress of [0, 0.1, 0.25, (7182 - 3200) / 9600, 0.5, 0.9, 1]) {
    const frame = capture('rate-gap', { 'planning-first': 1, 'planning-count': progress });
    const label = frame.labels.find((v) => /^(Current n = |n≈)/.test(v)),
      n = Number(label.match(/^(?:Current n = |n≈)(\d+)/)[1]);
    const width = Number(frame.math[0].match(/approx([\d.]+)$/)[1]);
    assert(Math.abs(width - 2 * Math.sqrt((2 * 0.8 * 0.2) / n)) <= 0.0000051, { n, width });
  }
  const empty = capture('rate-gap', { 'planning-first': 0, 'planning-count': 0 });
  assert(empty.math[0].endsWith('approx?'));
});
