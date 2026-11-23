import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePosition, cacheBytes, KV_EXAMPLE } from '../animations/kv-cache.mjs';

test('paged address lookup preserves logical positions across a noncontiguous boundary', () => {
  assert.deepEqual(
    [0, 3, 4, 7, 8].map((i) => resolvePosition(i)),
    [
      { logical: 0, physical: 7, offset: 0 },
      { logical: 0, physical: 7, offset: 3 },
      { logical: 1, physical: 2, offset: 0 },
      { logical: 1, physical: 2, offset: 3 },
      { logical: 2, physical: 5, offset: 0 },
    ],
  );
  for (const position of [-1, 5, 6, 7, 1.5])
    assert.throws(() => resolvePosition(position, [7, 2], 5), RangeError);
});

test('cache payload counts KV heads and scales with live positions and requests', () => {
  assert.equal(cacheBytes(KV_EXAMPLE, 1), 128 * 1024);
  assert.equal(cacheBytes(KV_EXAMPLE, 4096), 512 * 1024 ** 2);
  assert.equal(cacheBytes(KV_EXAMPLE, 4096, 4), 2 * 1024 ** 3);
  assert.equal(cacheBytes({ ...KV_EXAMPLE, queryHeads: 64 }, 4096), cacheBytes(KV_EXAMPLE, 4096));
  assert.equal(cacheBytes({ ...KV_EXAMPLE, kvHeads: 32 }, 4096), 2 * 1024 ** 3);
});

test('the worked position-four address stays fixed throughout its spoken mapping', async () => {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { draw } = await import('../animations/kv-cache.mjs');
  const canvas = createCanvas(960, 540);
  for (const beatP of [0, 0.04, 0.25, 0.4, 0.55, 0.75, 0.99]) {
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'mapping', title: 'Mapping' },
      { beat: 1, beatP, opacity: 1, t: 5, duration: 20 },
      draw,
    );
    const readout = frame.labels.find((label) =>
      /^i=\d+\s+j=\d+\s+physical=\d+\s+offset=\d+$/.test(label.text),
    );
    assert.ok(readout, `address readout missing at ${beatP}`);
    assert.deepEqual(
      readout.text.match(/\d+/g).map(Number),
      [4, 1, 2, 0],
      `worked address changed while position four is being explained at ${beatP}`,
    );
  }
});

test('persistent prompt tiles stay disjoint while two rows collapse into cache storage', async () => {
  const { readFile } = await import('node:fs/promises');
  const { parse } = await import('yaml');
  const { createCanvas } = await import('@napi-rs/canvas');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { draw } = await import('../animations/kv-cache.mjs');
  const lesson = parse(
    await readFile(new URL('../lessons/kv-cache.lesson.yaml', import.meta.url), 'utf8'),
  );
  const scene = lesson.scenes.find((item) => item.id === 'intro');
  const canvas = createCanvas(960, 540);
  for (let step = 0; step <= 100; step++) {
    const beatP = step / 100;
    const frame = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      { beat: 1, beatP, opacity: 1, t: 15, duration: 30, p: 0.5 },
      draw,
    );
    const tokens = frame.shapes.filter(
      (shape) =>
        shape.kind === 'rect' &&
        shape.strokeAlpha === 0 &&
        shape.fillAlpha > 0.5 &&
        shape.height >= 63.99 &&
        shape.height <= 66.01,
    );
    assert.equal(tokens.length, 22, `prompt tiles changed identity count at ${beatP}`);
    for (let i = 0; i < tokens.length; i++)
      for (let j = i + 1; j < tokens.length; j++) {
        const a = tokens[i],
          b = tokens[j];
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        assert.ok(
          overlapX <= 0.01 || overlapY <= 0.01,
          `prompt tiles ${i} and ${j} overlap at progress ${beatP}`,
        );
      }
  }
});
