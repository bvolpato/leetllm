import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url),
  Y = require('yaml');
const source =
  process.env.MP_SOURCE_OVERRIDE ??
  new URL('../animations/model-parallelism.mjs', import.meta.url).pathname;
const {
  parallelMLP,
  weightLedger,
  pipelineOccupancy,
  historyOwnership,
  mergeMass,
  expertAssignments,
  localPlacement,
  usefulCost,
  draw,
} = await import(pathToFileURL(source));
const lesson = Y.parse(
  fs.readFileSync(new URL('../lessons/model-parallelism.lesson.yaml', import.meta.url), 'utf8'),
);
const close = (a, b, tolerance = 1e-9) =>
  assert(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);

test('GeLU shards reconstruct the independent dense scalar result; mean and repeated bias remain wrong', () => {
  const ordinary = parallelMLP(),
    fresh = parallelMLP([-1, 3]);
  ordinary.output.forEach((v, i) => close(v, [-2.6585285689641216, 8.341091376133873][i]));
  fresh.output.forEach((v, i) => close(v, [-5.658656681269786, 15.499871869935749][i]));
  assert.notDeepEqual(parallelMLP([-1, 3], 'mean').output, fresh.output);
  parallelMLP([-1, 3], 'sum', true).output.forEach((v, i) =>
    close(v - fresh.output[i], [0.5, -0.5][i]),
  );
});
test('weight-only fit subtracts a reserve on every rank before computing the lower bound', () => {
  const one = weightLedger(),
    two = weightLedger(35e9, 2, 80e9, 16e9, 2),
    four = weightLedger(35e9, 2, 80e9, 16e9, 4);
  assert.equal(one.minimumRanks, 2);
  assert.equal(one.free, -6e9);
  assert.equal(two.free, 29e9);
  assert.equal(four.free, 46.5e9);
  assert.throws(() => weightLedger(35e9, 2, 80e9, 16e9, true));
});
test('pipeline occupancy counts hardware stage slots without multiplying a single-request path', () => {
  for (const items of [1, 4, 12]) {
    const m = pipelineOccupancy(3, items);
    assert.equal(m.layout.flat().filter((v) => v !== null).length, 3 * items);
    assert.equal(m.total, 3 * (items + 2));
    close(m.utilization, items / (items + 2));
    for (let item = 1; item <= items; item++)
      assert.deepEqual(
        m.layout.map((row) => row.indexOf(item)),
        [item - 1, item, item + 1],
      );
  }
  for (const invalid of [true, 0, -1, 1.5]) assert.throws(() => pipelineOccupancy(3, invalid));
});
test('existing DCP ranks cover every head-position pair exactly once', () => {
  const h = historyOwnership(),
    pairs = h.ranks.flatMap((r) => r.positions.map((t) => r.head + ':' + t));
  assert.equal(h.ranks.length, 8);
  assert.equal(pairs.length, 64);
  assert.equal(new Set(pairs).size, 64);
  assert.equal(h.plainPairs, 256);
  assert(h.ranks.every((r) => r.positions.length === 8));
});
test('shared maxima preserve unequal attention mass and permit empty contributions', () => {
  const m = mergeMass([
    { scores: [1000, 1000], values: [0, 0] },
    { scores: [1000], values: [9] },
    { scores: [], values: [] },
  ]);
  close(m.wrongMean, 4.5);
  close(m.output, 3);
  assert.equal(m.numerator, 9);
  assert.equal(m.mass, 3);
  close(
    mergeMass([
      { scores: [0], values: [0] },
      { scores: [1000], values: [9] },
    ]).output,
    9,
  );
  assert.throws(() => mergeMass([{ scores: [], values: [] }]));
});
test('expert dispatch weights each assignment once and preserves token origins', () => {
  const m = expertAssignments();
  assert.deepEqual(m.loads, [8, 4]);
  assert.deepEqual(m.outputs, [1.25, 2.5, 3.75, 6, 12.5, 19.5]);
  assert.deepEqual(
    m.assignments.filter((a) => a.token === 3).map((a) => a.weighted),
    [3, 3],
  );
  close(m.skew, 4 / 3);
});
test('group totals cannot hide a local deficit; useful cost uses the billed hourly denominator', () => {
  const wrong = localPlacement([31, 15]),
    fixed = localPlacement([23, 23]);
  assert.equal(wrong.groupTotal, 46);
  assert.equal(wrong.fits, false);
  assert.deepEqual(wrong.free, [-2, 14]);
  assert.equal(fixed.fits, true);
  assert.deepEqual(fixed.free, [6, 6]);
  close(usefulCost(6, 620), 2.6881720430107525);
});

function paint(sceneId, beat, cueStates = {}) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    texts = [],
    rects = [];
  const cues = Object.fromEntries(
    scene.beats
      .flatMap((b) => b.visual_cues ?? [])
      .map((c) => [c.id, { phase: 'before', progress: 0 }]),
  );
  for (const [name, value] of Object.entries(cueStates)) cues['mp-' + sceneId + '-' + name] = value;
  const api = {
    C: new Proxy({}, { get: (_, k) => String(k) }),
    rect: (_, x, y, width, height, fill, stroke) => {
      const r = { x, y, width, height, fill, stroke };
      rects.push(r);
      return r;
    },
    text: (_, s) => texts.push(String(s)),
    line() {},
    arrow() {},
    focus: { target: (_, f) => f() },
    clamp: (v) => Math.max(0, Math.min(1, v)),
    lerp: (a, b, q) => a + (b - a) * q,
    teaching: {},
    components: {},
  };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { texts, rects };
}
const after = { phase: 'after', progress: 1 };
test('the fresh prediction withholds result values and deficits until their own completed cues', () => {
  const question = paint('fresh-layout', 0);
  assert(
    !question.texts.some(
      (s) => s.includes('-5.6587') || s.includes('2 GB deficit') || s.includes('6 GB free'),
    ),
  );
  const early = paint('fresh-layout', 1, {
    reject: after,
    sum: after,
    result: { phase: 'during', progress: 0.99 },
  });
  assert(!early.texts.some((s) => s.includes('-5.6587')));
  const answer = paint('fresh-layout', 1, {
    reject: after,
    sum: after,
    result: after,
    deficit: after,
  });
  assert(answer.texts.some((s) => s.includes('-5.6587') && s.includes('15.4999')));
  assert(answer.texts.includes('2 GB deficit'));
});
test('the compatible placement repair carries the actual eight-GB ownership difference', () => {
  const transfer = paint('fresh-layout', 2, {
    reject: after,
    sum: after,
    result: after,
    deficit: after,
    repair: { phase: 'during', progress: 0.5 },
  });
  assert(transfer.texts.includes('8 GB in transfer'));
  assert(
    !transfer.texts.includes('23 GB'),
    'the final placement value waits for its completed supplied-placement clause',
  );
  assert(transfer.rects.some((r) => r.width === 250 && r.height === 23 * 11));
  assert(transfer.rects.some((r) => r.width === 250 && r.height === 15 * 11));
  assert(transfer.rects.some((r) => r.width === 250 && r.height === 8 * 11));
  const finished = paint('fresh-layout', 2, {
    reject: after,
    sum: after,
    result: after,
    deficit: after,
    repair: after,
    six: after,
  });
  assert.equal(finished.texts.filter((s) => s === '23 GB').length, 2);
  assert.equal(finished.texts.filter((s) => s === '6 GB free').length, 2);
  assert(!finished.texts.includes('8 GB in transfer'));
});
test('the handoff moves the same eight KV blocks continuously from their source cells to destination cells', () => {
  const cells = (q) =>
    paint('phase-handoff', 1, { move: { phase: q === 1 ? 'after' : 'during', progress: q } })
      .rects.filter((r) => r.width === 102 && r.height === 80)
      .map(({ x, y }) => ({ x, y }))
      .sort((a, b) => a.y - b.y || a.x - b.x);
  const expected = (q) =>
    Array.from({ length: 8 }, (_, i) => ({
      x: 230 + (i % 4) * 122 + 990 * q,
      y: 520 + Math.floor(i / 4) * 125,
    }));
  for (const q of [0, 0.125, 0.5, 0.875, 1]) assert.deepEqual(cells(q), expected(q));
});
