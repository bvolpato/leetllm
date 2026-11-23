import test from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../animations/kv-cache.mjs';

const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };
const during = (progress) => ({ phase: 'during', progress });
function paint(scene, state) {
  const labels = [],
    connections = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    clamp: (value) => Math.max(0, Math.min(1, value)),
    lerp: (a, b, progress) => a + (b - a) * progress,
    phase: (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start))),
    focus: { target: (_, fn) => fn(), reveal: (_, fn) => fn() },
    components: {
      card: (options) => {
        labels.push(String(options.label));
        return { x: options.x, y: options.y, width: options.width, height: options.height };
      },
      fade: (alpha, fn) => alpha > 0 && fn(),
    },
    rect: (_, x, y, width, height) => ({ x, y, width, height }),
    container: (_, __, fn) => fn(),
    text: (_, value) => labels.push(String(value)),
    math() {},
    line() {},
    circle() {},
    connect: (_, source, target) => connections.push({ source, target }),
  };
  draw({}, { id: scene }, state, api);
  return { labels, connections };
}

test('the fifth gather and completed sum occur during their measured clauses', () => {
  const state = {
    beat: 1,
    beatP: 0.1,
    cues: {
      'first-block-gather': after,
      'second-block-gather': during(0.5),
      'gather-result': before,
    },
  };
  const fifth = paint('valid-length', state);
  assert(fifth.labels.includes('3.25'));
  assert(fifth.labels.includes('0.30 × 5'));
  assert.equal(fifth.connections[0].source.y, 700);
  const result = paint('valid-length', {
    ...state,
    beatP: 0.2,
    cues: {
      'first-block-gather': after,
      'second-block-gather': after,
      'gather-result': during(0.5),
    },
  });
  assert(result.labels.includes('complete blend'));
  assert(result.labels.includes('3.25'));
});

test('request completion precedes narrated admission and stays visible next paragraph', () => {
  const waiting = paint('batching', {
    beat: 0,
    beatP: 0.9,
    cues: {
      'live-boundaries': after,
      'request-finish': before,
      'admit-new': before,
    },
  });
  assert(!waiting.labels.includes('EOS'));
  const finished = paint('batching', {
    beat: 0,
    beatP: 0.1,
    cues: {
      'live-boundaries': after,
      'request-finish': during(0.6),
      'admit-new': before,
    },
  });
  assert(finished.labels.includes('EOS'));
  assert(!finished.labels.includes('prefill'));
  const admitted = paint('batching', {
    beat: 0,
    beatP: 0.1,
    cues: {
      'live-boundaries': after,
      'request-finish': after,
      'admit-new': during(0.5),
    },
  });
  assert(admitted.labels.includes('EOS'));
  assert(admitted.labels.includes('prefill'));
  assert(paint('batching', { beat: 1, beatP: 0 }).labels.includes('prefill'));
});

test('external fragmentation uses genuinely free holes and a derived contiguous limit', () => {
  const holes = paint('reservations', {
    beat: 1,
    beatP: 0.05,
    cues: {
      'fragmented-holes': after,
      'contiguous-failure': during(0.5),
      'uniform-blocks': before,
    },
  });
  assert.equal(holes.labels.filter((value) => value === 'free hole').length, 8);
  assert(!holes.labels.includes('reserved tail'));
  assert(
    holes.labels.some(
      (value) =>
        value.includes('free: 8') &&
        value.includes('largest run: 4') &&
        value.includes('C needs: 6'),
    ),
  );
  const paged = paint('reservations', {
    beat: 1,
    beatP: 0.05,
    cues: {
      'fragmented-holes': after,
      'contiguous-failure': after,
      'uniform-blocks': after,
    },
  });
  assert.equal(paged.labels.filter((value) => value === 'C').length, 6);
  assert(
    paged.labels.some(
      (value) =>
        value.includes('A: 2') &&
        value.includes('B: 2') &&
        value.includes('C: 6') &&
        value.includes('free: 2'),
    ),
  );
});
