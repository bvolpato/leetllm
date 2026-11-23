import test from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../animations/fsdp-zero.mjs';

function paint(gatherPhase, releasePhase, releaseProgress = 0, beat = 1) {
  const labels = [],
    copies = [];
  let target = null;
  const api = {
    C: {
      blue: 'blue',
      pink: 'pink',
      yellow: 'yellow',
      green: 'green',
      ink: 'white',
      muted: 'gray',
      bg: 'navy',
      panel: 'black',
    },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    phase: (v) => v,
    focus: {
      target: (id, fn) => {
        const previous = target;
        target = id;
        try {
          return fn();
        } finally {
          target = previous;
        }
      },
    },
    components: { card: () => {}, fade: (_opacity, fn) => fn() },
    text: (_ctx, value) => labels.push(value),
    math: () => {},
    rect: (_ctx, x, y, w, h) => {
      if (target === 'gathered-shards') copies.push({ x, y, w, h });
    },
    teaching: {},
  };
  draw(
    {},
    { id: 'zero3' },
    {
      beat,
      beatP: 0.46,
      cues: {
        'zero3-b2-1': { phase: gatherPhase, progress: gatherPhase === 'before' ? 0 : 1 },
        'zero3-b2-2': { phase: releasePhase, progress: releaseProgress },
      },
    },
    api,
  );
  return { labels, copies };
}

test('identified shard copies reach the wrapped unit at the gather cue and release at the next cue', () => {
  const before = paint('before', 'before').copies;
  const ready = paint('after', 'before').copies;
  assert.equal(before.length, 4);
  assert.deepEqual(
    ready.map((r) => r.x),
    [630, 800, 970, 1140],
  );
  assert(ready.every((r) => r.y === 535));
  assert(before.every((r) => r.y < 535));
  const releasing = paint('after', 'active', 0.5).copies;
  assert(releasing.every((r) => r.y > 490 && r.y < 535));
  assert.equal(paint('after', 'after', 1).copies.length, 0);
});

test('the released copy stays released through recap while all four local owners remain', () => {
  const current = paint('after', 'after', 1, 2);
  assert.equal(current.copies.length, 0);
  assert.ok(current.labels.includes('Gathered copy released · local shards retained'));
  assert.ok(current.labels.includes('W/G/O owner A'));
  assert.ok(current.labels.includes('W/G/O owner D'));
});
