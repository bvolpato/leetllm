import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame, C } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import * as model from '../animations/algorithm-complexity.mjs';
registerLessonFonts();
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  active: false,
  strength: 0,
  targets: [],
});
function frame(scene, beat, cues, draw = model.draw) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id: scene, title: scene },
    { beat, beatP: 0.5, t: 10, duration: 50, opacity: 1, cues },
    draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], scene + ' native geometry');
  return {
    audit,
    canvas,
    labels: audit.labels.map((l) => l.text),
    pixels: ctx.getImageData(0, 0, 1920, 1080).data,
  };
}
function changedFraction(a, b, { x, y, width, height }) {
  let changed = 0;
  for (let row = y; row < y + height; row++)
    for (let column = x; column < x + width; column++) {
      const i = (row * 1920 + column) * 4;
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
    }
  return changed / (width * height);
}
function colorAt(bytes, x, y) {
  const index = (y * 1920 + x) * 4;
  return [...bytes.slice(index, index + 3)].join(',');
}
function gridCellColors(rendered, rows, columns) {
  const rgb = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(',');
  const blue = rgb(C.blue),
    cyan = rgb(C.cyan);
  const colors = [];
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      colors.push(colorAt(rendered.pixels, 460 + column * 72 + 31, 360 + row * 72 + 31));
    }
  return {
    blue: colors.filter((color) => color === blue).length,
    cyan: colors.filter((color) => color === cyan).length,
  };
}
const greenPixels = (bytes) => {
  let n = 0;
  for (let i = 0; i < bytes.length; i += 4)
    if (bytes[i + 1] > 100 && bytes[i + 1] > bytes[i] + 30 && bytes[i + 1] > bytes[i + 2] + 15) n++;
  return n;
};

test('the first passage stays neutral until actual comparisons earn a result', async () => {
  const draw = process.env.COMPLEXITY_BEFORE_ANIMATION
    ? (await import(pathToFileURL(process.env.COMPLEXITY_BEFORE_ANIMATION).href)).draw
    : model.draw;
  const pending = frame(
    'opening',
    0,
    {
      'opening-open': cue(0),
      'opening-terms': cue(0),
      'opening-rest': cue(0),
      'opening-result': cue(0),
    },
    draw,
  );
  assert.equal(
    greenPixels(pending.pixels),
    0,
    'an unread note must not already be painted as the winning answer',
  );
  assert(
    pending.labels.includes('Why did the login test fail after the identity-provider update?'),
  );
  assert(!pending.labels.includes('Can the first result explain the failed login test?'));
  if (!process.env.COMPLEXITY_BEFORE_ANIMATION) {
    const held = frame('opening', 1, {
      'opening-open': cue(1),
      'opening-terms': cue(1),
      'opening-rest': cue(1),
      'opening-result': cue(1),
    });
    assert(greenPixels(held.pixels) > 1000);
    assert(held.labels.includes('4 / 4 candidates inspected'));
  }
});

test('dense scoring counts zero products and exposes only completed partial sums', () => {
  const expected = model.DOCS.flatMap((doc, row) => {
    let sum = 0;
    return doc.vector.map((x, column) => {
      const product = x * [1, 0, 0][column];
      sum += product;
      return { row, column, product, sum };
    });
  });
  assert.deepEqual(
    model.SCORE_TRACE.map(({ row, column, product, sum }) => ({ row, column, product, sum })),
    expected,
  );
  assert.equal(expected.length, 12);
  assert.equal(expected.filter((e) => e.product === 0).length, 9);
  assert.throws(() => model.scoreTrace(model.DOCS, [1, 0]), RangeError);
  const partial = frame('vector-score', 0, { 'vector-first': cue(0.5) });
  assert(partial.labels.includes('1 / 12 coordinate products completed'));
  assert(partial.labels.includes('1.0 running'));
  const complete = frame('vector-score', 1, {
    'vector-first': cue(1),
    'vector-rest': cue(1),
    'vector-size': cue(0),
    'vector-both': cue(0),
  });
  assert(complete.labels.includes('12 / 12 coordinate products completed'));
  assert(complete.labels.some((label) => label.includes('Issuer note score = 0.8')));
});

test('dense scoring connects n to candidate rows and d to coordinate columns', () => {
  const base = frame('vector-score', 1, {
    'vector-rest': cue(1),
    'vector-n': cue(0),
    'vector-d': cue(0),
    'vector-size': cue(0),
    'vector-both': cue(0),
  });
  const rows = frame('vector-score', 1, {
    'vector-rest': cue(1),
    'vector-n': cue(0.7),
    'vector-d': cue(0),
    'vector-size': cue(0),
    'vector-both': cue(0),
  });
  assert(rows.labels.includes('candidate rows'));
  assert(
    changedFraction(base.pixels, rows.pixels, { x: 430, y: 330, width: 300, height: 330 }) > 0.004,
    'the n cue outlines the candidate rows in the matrix',
  );
  const columns = frame('vector-score', 1, {
    'vector-rest': cue(1),
    'vector-n': cue(0),
    'vector-d': cue(0.7),
    'vector-size': cue(0),
    'vector-both': cue(0),
  });
  assert(columns.labels.includes('coordinate columns'));
  assert(
    changedFraction(base.pixels, columns.pixels, { x: 430, y: 330, width: 300, height: 330 }) >
      0.004,
    'the d cue outlines coordinate columns in the matrix',
  );
  const doubled = frame('vector-score', 1, {
    'vector-rest': cue(1),
    'vector-n': cue(1),
    'vector-d': cue(1),
    'vector-size': cue(1),
    'vector-both': cue(1),
  });
  assert(doubled.labels.includes('n = 8 candidate rows'));
  assert(doubled.labels.includes('d = 6 coordinate columns'));
  assert(doubled.labels.includes('48 required products'));
});

test('expanded dense-score grids label only the current n times d work', () => {
  for (const { sizeProgress, dProgress, rows, columns, products, addedCells } of [
    { sizeProgress: 0.5, dProgress: 0, rows: 6, columns: 3, products: 18, addedCells: 6 },
    { sizeProgress: 1, dProgress: 0.5, rows: 8, columns: 4, products: 32, addedCells: 20 },
    { sizeProgress: 1, dProgress: 1, rows: 8, columns: 6, products: 48, addedCells: 36 },
  ]) {
    const expanded = frame('vector-score', 1, {
      'vector-rest': cue(1),
      'vector-n': cue(1),
      'vector-d': cue(1),
      'vector-size': cue(sizeProgress),
      'vector-both': cue(dProgress),
    });
    assert(expanded.labels.includes(`n = ${rows} candidate rows`));
    assert(expanded.labels.includes(`d = ${columns} coordinate columns`));
    assert(expanded.labels.includes(`${products} required products`));
    assert(
      !expanded.labels.includes('12 / 12 coordinate products completed'),
      'the original worked-example counter must disappear when the expanded grid is shown',
    );
    assert(
      !expanded.labels.some((label) => label.includes('Issuer note score =')),
      'the original note score must not appear to describe the generalized grid',
    );
    assert.deepEqual(
      gridCellColors(expanded, rows, columns),
      { blue: 12, cyan: addedCells },
      'the rendered grid must contain one retained blue cell per original product and one cyan cell per added product',
    );
  }
});

test('selected question terms use real passage membership and leave an unseen better match possible', async () => {
  const terms = ['login', 'test', 'fail'],
    first = model.DOCS[0].words;
  const s = model.openingSnapshot({
    beat: 1,
    cues: { 'opening-terms': cue(1), 'opening-rest': cue(0), 'opening-result': cue(1) },
  });
  assert.deepEqual(model.TERMS, terms);
  assert.equal(s.matches, terms.filter((term) => new Set(first).has(term)).length);
  assert.equal(s.matches, 2);
  assert(s.matches < terms.length);
  assert.equal(s.inspected, 1);
  assert.equal(s.winnerReady, false);
  const draw = process.env.COMPLEXITY_BEFORE_ANIMATION
    ? (await import(pathToFileURL(process.env.COMPLEXITY_BEFORE_ANIMATION).href)).draw
    : model.draw;
  const f = frame(
    'opening',
    1,
    {
      'opening-open': cue(1),
      'opening-terms': cue(1),
      'opening-rest': cue(0),
      'opening-result': cue(0),
    },
    draw,
  );
  assert(f.labels.includes('login ✓'));
  assert(f.labels.includes('test ✓'));
  assert(f.labels.includes('fail ×'));
  assert(f.labels.includes('2 / 3 selected query terms match'));
  assert(f.labels.includes('1 / 4 candidates inspected'));
  const second = frame('opening', 1, {
    'opening-open': cue(1),
    'opening-terms': cue(1),
    'opening-rest': cue(0.5),
    'opening-result': cue(0),
  });
  assert(second.labels.includes('1 matching query term'));
  assert(!second.labels.includes('1 matching query terms'));
});

test('halving searches find actual keys and count the final singleton comparison', () => {
  for (let n = 1; n <= 128; n++)
    for (const target of [-1, ...Array.from({ length: n }, (_, i) => i), n]) {
      const trace = model.binarySearchTrace(
        Array.from({ length: n }, (_, i) => i),
        target,
      );
      assert.equal(trace.at(-1).found, target >= 0 && target < n);
      assert(trace.length <= Math.floor(Math.log2(n)) + 1);
      for (const row of trace) {
        assert(row.mid >= row.lo && row.mid < row.hi);
        if (!row.found) assert(row.nextHi - row.nextLo < row.hi - row.lo);
      }
    }
  assert.equal(
    model.binarySearchTrace(
      Array.from({ length: 65536 }, (_, i) => i),
      0,
    ).length,
    17,
  );
  assert.deepEqual(
    model.BINARY_TRACE.map((s) => s.mid),
    [4, 2, 3],
  );
});

test('doubling arrays pay every copy and append and maintain a linear prefix bill', () => {
  for (let n = 1; n <= 80; n++) {
    let capacity = 2,
      writes = 0;
    for (let i = 0; i < n; i++) {
      if (i === capacity) {
        writes += i;
        capacity *= 2;
      }
      writes++;
    }
    assert.equal(model.appendTrace(n).at(-1).totalWrites, writes);
    assert(writes < 3 * n);
  }
  assert.equal(model.APPEND_EVENTS.length, 12);
  const copying = model.appendSnapshot({ beat: 0, cues: { 'append-resize': cue(0.5) } });
  assert.equal(copying.totalWrites, 3);
  assert.equal(copying.blocks.at(-1).values.length, 1);
  assert.equal(copying.active.value, 2);
  const held = model.appendSnapshot({ beat: 1, cues: { 'append-sequence': cue(1) } });
  assert.equal(held.totalWrites, 14);
  assert.deepEqual(held.blocks[0].values, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('every heap prefix matches an independent sort including ties and zero capacity', () => {
  let seed = 7;
  const rows = Array.from({ length: 40 }, (_, i) => {
    seed = (seed * 48271) % 2147483647;
    return { id: 'key-' + String(i).padStart(2, '0'), score: seed % 7 };
  });
  for (const k of [0, 1, 2, 3, 8, 50])
    model.boundedHeapTrace(rows, k).forEach((event, i) => {
      const expected = rows
        .slice(0, i + 1)
        .sort((a, b) => b.score - a.score || b.id.localeCompare(a.id))
        .slice(0, k);
      assert.deepEqual(
        [...event.heap].sort((a, b) => b.score - a.score || b.id.localeCompare(a.id)),
        expected,
      );
      event.heap.forEach((v, j) => {
        if (j) {
          const p = event.heap[Math.floor((j - 1) / 2)];
          assert(p.score < v.score || (p.score === v.score && p.id <= v.id));
        }
      });
    });
  assert.deepEqual(
    model.HEAP_TRACE.map((e) => e.action),
    ['insert', 'insert', 'replace', 'reject'],
  );
  const old = model.heapSnapshot({
    beat: 1,
    cues: { 'heap-replace': cue(0.5), 'heap-reject': cue(0) },
  });
  assert.equal(old.completed, 2);
  const done = model.heapSnapshot({
    beat: 1,
    cues: { 'heap-replace': cue(1), 'heap-reject': cue(1) },
  });
  assert.equal(done.completed, 4);
  assert.deepEqual(
    done.heap.map((r) => r.id),
    ['issuer-check', 'token-fixture'],
  );
});

test('the rejected top-k candidate moves on its cue while the retained heap stays fixed', () => {
  const state = (progress) => ({
    beat: 1,
    cues: { 'heap-first': cue(1), 'heap-replace': cue(1), 'heap-reject': cue(progress) },
  });
  const before = frame('top-k', 1, state(0).cues),
    during = frame('top-k', 1, state(0.5).cues),
    held = frame('top-k', 1, state(1).cues);
  const candidate = { x: 750, y: 700, width: 500, height: 260 };
  assert(
    changedFraction(before.pixels, during.pixels, candidate) > 0.002,
    'incoming rejected note appears in its declared cue region',
  );
  assert(
    changedFraction(during.pixels, held.pixels, candidate) > 0.002,
    'incoming rejected note reaches its held position',
  );
  const retained = [0, 0.5, 1].map((progress) =>
    model.heapSnapshot(state(progress)).heap.map((doc) => doc.id),
  );
  assert.deepEqual(retained, [
    ['issuer-check', 'token-fixture'],
    ['issuer-check', 'token-fixture'],
    ['issuer-check', 'token-fixture'],
  ]);
});

test('adding one item creates n new unordered pairs and exact keys preserve different wording', () => {
  for (let n = 1; n <= 32; n++) {
    const pairs = model.unorderedPairs(n),
      keys = new Set(pairs.map((p) => p.left + ':' + p.right));
    assert.equal(keys.size, (n * (n - 1)) / 2);
    assert(pairs.every((p) => p.left < p.right));
    assert.equal(model.unorderedPairs(n + 1).length - pairs.length, n);
  }
  assert.equal(model.DEDUP.length, 5);
  assert.equal(model.DEDUP.at(-1).unique.length, 3);
  assert.equal(
    model.exactDedupTrace(['expired login fixture', 'expired login test fixture']).at(-1).unique
      .length,
    2,
  );
});

test('the displayed hash computes the actual bucket for each original note key', () => {
  for (const doc of model.DOCS)
    assert.equal(model.hashKey(doc.id), [...Buffer.from(doc.id)].reduce((n, x) => n + x, 0) % 8);
  assert.equal(
    model.hashKey('issuer-check'),
    [...Buffer.from('issuer-check')].reduce((n, x) => n + x, 0) % 8,
  );
  assert(!model.DOCS.some((doc) => doc.id === model.COLLISION_QUERY));
  assert.equal(model.collisionChainChecks(), model.DOCS.length);
  const route = model.issuerHashRouteGeometry(),
    bounds = model.hashBucketGeometry(route.bucket);
  assert.equal(route.bucket, model.hashKey('issuer-check'));
  const routed = frame('hash-lookup', 0, {
    'hash-route': cue(1),
    'hash-equality': cue(0),
    'hash-collide': cue(0),
  });
  const arrow = routed.audit.connectors.findLast((connector) => connector.kind === 'arrow');
  assert.deepEqual(
    arrow.to,
    route.destination,
    'the painted route tip lands at its computed bucket',
  );
  assert.deepEqual(
    arrow.head[0],
    route.destination,
    'the terminal arrowhead remains triangular at that bucket',
  );
  assert(route.destination.x > bounds.x && route.destination.x < bounds.x + bounds.width);
  assert.equal(route.destination.y, bounds.y);
  const formula = routed.audit.labels.find((label) =>
    label.text.startsWith('sum of character codes mod 8'),
  );
  const routeSegments = routed.audit.connectors.filter(
    (connector) => connector.kind === 'line' || connector.kind === 'arrow',
  );
  assert.equal(routeSegments.length, route.points.length - 1);
  for (const segment of routeSegments) {
    const halfStroke = segment.strokeWidth / 2;
    const left = Math.min(segment.from.x, segment.to.x) - halfStroke,
      right = Math.max(segment.from.x, segment.to.x) + halfStroke;
    const top = Math.min(segment.from.y, segment.to.y) - halfStroke,
      bottom = Math.max(segment.from.y, segment.to.y) + halfStroke;
    assert(
      right < formula.x ||
        left > formula.x + formula.width ||
        bottom < formula.y ||
        top > formula.y + formula.height,
      'the route stays in clear space around the hash formula',
    );
  }
});

test('a radix tree compares the shared English prefix once and returns exact matches', () => {
  assert.deepEqual(model.PREFIX_WORDS, ['play', 'place', 'planet', 'plaza']);
  assert.equal(model.naivePrefixComparisonCount(), 12);
  const trace = model.radixPrefixTrace();
  assert.equal(trace.matched, 'pla');
  assert.equal(trace.complete, true);
  assert.equal(trace.comparisons, 3);
  assert.deepEqual(trace.branches, ['y', 'ce', 'net', 'za']);
  assert.deepEqual(trace.completions, ['play', 'place', 'planet', 'plaza']);
  assert.deepEqual(model.radixPrefixTrace('plaz').completions, ['plaza']);
  assert.deepEqual(model.radixPrefixTrace('zzz').completions, []);
  const partial = frame('radix-prefix', 1, {
    'prefix-edge': cue(0),
    'prefix-walk': cue(0.5),
    'prefix-branch': cue(0),
    'prefix-count': cue(0),
  });
  assert(partial.labels.includes('1 / 3 shared letters read'));
  const held = frame('radix-prefix', 1, {
    'prefix-edge': cue(1),
    'prefix-walk': cue(1),
    'prefix-branch': cue(1),
    'prefix-count': cue(1),
  });
  assert(held.labels.includes('Naive scan: 4 × 3 = 12 character comparisons'));
  assert(held.labels.includes('Shared radix edge: 3 comparisons'));
  assert(held.labels.includes('Then return the 4 matching words'));
});

test('attention decode focuses the current key and resolves the login-test retrieval choice', () => {
  const trace = model.decodeCostTrace(8, 3, 64);
  assert.deepEqual(trace.rows, [
    { step: 1, keysRead: 9, coordinateTerms: 576, cacheAfter: 9 },
    { step: 2, keysRead: 10, coordinateTerms: 640, cacheAfter: 10 },
    { step: 3, keysRead: 11, coordinateTerms: 704, cacheAfter: 11 },
  ]);
  assert.equal(trace.keyReads, 30);
  assert.equal(trace.coordinateTerms, 1920);
  assert.equal(trace.cacheAfter, 11);
  assert.throws(() => model.decodeCostTrace(0, 3, 64), RangeError);
  const cues = (rows, sum = 0, general = 0, cache = 0) => ({
    'attention-decode': cue(1),
    'attention-rows': cue(rows),
    'attention-sum': cue(sum),
    'attention-general': cue(general),
    'attention-cache': cue(cache),
  });
  const focused = frame('attention', 1, { ...cues(0), 'attention-decode': cue(0.5) });
  assert(focused.labels.includes('Comparing key 5 / 9'));
  assert(focused.labels.includes('new query'));
  const oneStep = frame('attention', 1, { ...cues(0), 'attention-decode': cue(0.5) });
  assert(oneStep.labels.some((label) => label.includes('one\\ decode\\ step')));
  assert(!oneStep.labels.some((label) => label.includes('decode\\ total')));
  const growing = frame('attention', 1, cues(0.4));
  const growingSnapshot = model.decodeSequenceSnapshot({ beat: 1, cues: cues(0.4) });
  assert(growing.labels.includes('Step 1 · 9 keys'));
  assert(growing.labels.includes('Step 2 · 10 keys'));
  assert.equal(growingSnapshot.completedRows, 1);
  assert.equal(growingSnapshot.cachePositions, 10);
  const complete = frame('attention', 1, cues(1, 1, 1, 1));
  assert(complete.labels.includes('Step 3 · 11 keys'));
  assert(
    complete.labels.some((label) => label.includes('9+10+11)d_k=30d_k')),
    'the exact row sum keeps the head-width multiplier',
  );
  assert(complete.labels.some((label) => label.includes('Gt+\\frac{G(G+1)}{2}')));
  assert(complete.labels.some((label) => label.includes('\\Theta((Gt+G^2)d_k)')));
  assert(complete.labels.includes('Cache after current input append: 11 positions'));
  assert(complete.labels.includes('K/V 11'));
  assert(
    changedFraction(oneStep.pixels, growing.pixels, { x: 100, y: 320, width: 1780, height: 650 }) >
      0.002,
    'the cue builds the longer rows and cache in the declared attention region',
  );
  const held = frame('shortlist-payoff', 2, { 'shortlist-choice': cue(1) });
  assert(held.labels.includes('Login-test retrieval · k = 3'));
  assert(held.labels.includes('2 / 2 full-read reference winners'));
});

test('reducing k cannot release excessive score work or reveal a decision before counting', () => {
  assert.equal(model.budgetFor(2500, 384, 2).products, 960000);
  assert.equal(model.budgetFor(4000, 384, 1).products, 1536000);
  assert.equal(model.budgetFor(4000, 384, 1).within, false);
  const pending = model.budgetSnapshot({
    beat: 0,
    cues: { 'budget-count': cue(0.5), 'budget-check': cue(1), 'budget-run': cue(1) },
  });
  assert.equal(pending.check, 0);
  assert.equal(pending.scored, 0);
  const over = frame('work-budget', 1, {
    'budget-k': cue(1),
    'budget-over': cue(1),
    'budget-stop': cue(1),
  });
  assert(over.labels.includes('Over budget: reroute before scoring'));
  assert(over.labels.includes('Exact-score pass held: zero products executed'));
});

test('one additional contextual read recovers the missing reference identity', () => {
  const a = model.shortlist(2),
    z = model.shortlist(3);
  assert.deepEqual(
    model.DOCS.map((d) => d.cheap),
    [2 / 3, 1 / 3, 0, 0],
  );
  assert.equal(model.DOCS.find((d) => d.id === 'issuer-check').refine, 0.95);
  assert.deepEqual(
    a.selected.map((d) => d.id),
    ['token-fixture', 'ci-clock'],
  );
  assert.deepEqual(
    a.winners.map((d) => d.id),
    ['token-fixture', 'ci-clock'],
  );
  assert.deepEqual(
    z.winners.map((d) => d.id),
    ['issuer-check', 'token-fixture'],
  );
  assert.equal(a.hits, 1);
  assert.equal(z.hits, 2);
  assert.equal(z.refineReads, 3);
  assert.equal(z.cheapReads, 4);
  const pending = frame('shortlist-payoff', 0, { 'shortlist-two': cue(1) });
  assert(!pending.labels.includes('Old issuer config · 0.95'));
  assert(pending.labels.includes('Reference withheld'));
  const moving = frame('shortlist-payoff', 1, {
    'shortlist-reference': cue(1),
    'shortlist-three': cue(0.5),
    'shortlist-payoff': cue(0),
  });
  assert(moving.labels.includes('Checking expanded'));
  assert(moving.labels.includes('shortlist'));
  const held = frame('shortlist-payoff', 2, { 'shortlist-choice': cue(1) });
  assert(held.labels.includes('Recovered 2 / 2'));
  assert(held.labels.includes('reference winners'));
  assert(held.labels.includes('Login-test retrieval · k = 3'));
});

test('the issuer mismatch and lexical omission appear on their spoken cues', () => {
  const before = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(0),
    'shortlist-expected': cue(0),
    'shortlist-match': cue(0),
    'shortlist-zero': cue(0),
    'shortlist-reference': cue(0),
    'shortlist-three': cue(0),
    'shortlist-payoff': cue(0),
  });
  const provider = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(0.8),
    'shortlist-expected': cue(0),
    'shortlist-match': cue(0),
    'shortlist-zero': cue(0),
    'shortlist-reference': cue(0),
    'shortlist-three': cue(0),
    'shortlist-payoff': cue(0),
  });
  assert(provider.labels.includes('Identity provider'));
  assert(provider.labels.includes('sends NEW issuer'));
  assert(provider.labels.includes('Old issuer config · illustrative value mismatch'));
  assert(
    changedFraction(before.pixels, provider.pixels, { x: 100, y: 300, width: 1000, height: 300 }) >
      0.004,
    'the changed issuer is drawn as narration reaches the cause',
  );
  assert(
    changedFraction(before.pixels, provider.pixels, { x: 1100, y: 480, width: 400, height: 100 }) >
      0.01,
    'the excluded issuer note is foregrounded while the failure is explained',
  );
  const mismatch = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(1),
    'shortlist-expected': cue(0.8),
    'shortlist-match': cue(0),
    'shortlist-zero': cue(0),
    'shortlist-reference': cue(0),
    'shortlist-three': cue(0),
    'shortlist-payoff': cue(0),
  });
  assert(mismatch.labels.includes('Verifier config'));
  assert(mismatch.labels.includes('expects OLD issuer'));
  assert(mismatch.labels.includes('Login test fails'));
  const words = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(1),
    'shortlist-expected': cue(1),
    'shortlist-match': cue(0.8),
    'shortlist-zero': cue(0),
    'shortlist-reference': cue(0),
    'shortlist-three': cue(0),
    'shortlist-payoff': cue(0),
  });
  assert(words.labels.includes('Question words'));
  assert(words.labels.includes('Issuer note words'));
  const score = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(1),
    'shortlist-expected': cue(1),
    'shortlist-match': cue(1),
    'shortlist-zero': cue(0.8),
    'shortlist-reference': cue(0),
    'shortlist-three': cue(0),
    'shortlist-payoff': cue(0),
  });
  assert(score.labels.includes('0 / 3 · score 0.00'));
  const ranked = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(1),
    'shortlist-expected': cue(1),
    'shortlist-match': cue(1),
    'shortlist-zero': cue(1),
    'shortlist-reference': cue(1),
    'shortlist-three': cue(0),
    'shortlist-payoff': cue(0),
  });
  assert(ranked.labels.includes('#1  Old issuer config · 0.95'));
  assert(ranked.labels.includes('Exact-word shortlist · k = 2'));
  const expanded = frame('shortlist-payoff', 1, {
    'shortlist-cause': cue(1),
    'shortlist-expected': cue(1),
    'shortlist-match': cue(1),
    'shortlist-zero': cue(1),
    'shortlist-reference': cue(1),
    'shortlist-three': cue(1),
    'shortlist-payoff': cue(0),
  });
  assert(expanded.labels.includes('Exact-word shortlist · k = 3'));
  assert(expanded.labels.includes('Passes 3 / 4 notes'));
  assert(
    changedFraction(ranked.pixels, expanded.pixels, { x: 1060, y: 300, width: 500, height: 450 }) >
      0.001,
    'the third-note gate moves when the shortlist grows',
  );
});

test('fixed summaries wait for complete result clauses while current work stays visible', async (t) => {
  const draw = process.env.COMPLEXITY_BEFORE_ANIMATION
    ? (await import(pathToFileURL(process.env.COMPLEXITY_BEFORE_ANIMATION).href)).draw
    : model.draw;
  const cases = [
    {
      name: 'fifth-note total',
      scene: 'unique-pairs',
      beat: 0,
      cues: { 'pairs-first': cue(1), 'pairs-add': cue(0.9), 'pairs-formula': cue(0) },
      result: (text) => text.includes('P(5)'),
      current: '9 unique comparisons',
      after: 'pairs-add',
    },
    {
      name: 'decode coordinate total',
      scene: 'attention',
      beat: 1,
      cues: { 'attention-rows': cue(1), 'attention-sum': cue(0.9), 'attention-general': cue(0) },
      result: (text) => text.includes('=30d_k'),
      current: '30 key reads accumulated',
      after: 'attention-sum',
    },
    {
      name: 'general decode formula',
      scene: 'attention',
      beat: 1,
      cues: { 'attention-rows': cue(1), 'attention-sum': cue(1), 'attention-general': cue(0.9) },
      result: (text) => text.includes('Gt+\\frac{G(G+1)}{2}'),
      current: '30 key reads accumulated',
      after: 'attention-general',
    },
    {
      name: 'kibibyte conversion',
      scene: 'cache-volume',
      beat: 0,
      cues: { 'cache-token': cue(1), 'cache-token-kibi': cue(0.9) },
      result: (text) => text === '128 KiB / token',
      current: '131,072 bytes',
      after: 'cache-token-kibi',
    },
    {
      name: 'context endpoint comparison',
      scene: 'cache-volume',
      beat: 2,
      cues: { 'cache-grow': cue(1), 'cache-endpoint-comparison': cue(0.9) },
      result: (text) => text.startsWith('4× context'),
      current: '8.00 GiB raw KV',
      after: 'cache-endpoint-comparison',
    },
  ];
  for (const c of cases)
    await t.test(c.name, () => {
      const pending = frame(c.scene, c.beat, c.cues, draw);
      assert(pending.labels.includes(c.current), 'the honest current calculation remains painted');
      assert(
        !pending.labels.some(c.result),
        'a completed fixed summary must wait for its complete clause',
      );
      const completed = frame(c.scene, c.beat, { ...c.cues, [c.after]: cue(1) }, draw);
      assert(
        completed.labels.some(c.result),
        'the same summary appears when the result clause completes',
      );
      assert(
        changedFraction(pending.pixels, completed.pixels, {
          x: 100,
          y: c.scene === 'unique-pairs' ? 940 : 620,
          width: 1720,
          height: c.scene === 'unique-pairs' ? 100 : 400,
        }) > 0.00005,
        'completion changes actual painted result ink',
      );
    });
});
