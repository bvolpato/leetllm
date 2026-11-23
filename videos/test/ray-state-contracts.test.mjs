import test from 'node:test';
import assert from 'node:assert/strict';
const R = await import(process.env.LEETLLM_RAY_SOURCE ?? '../animations/deep-dive-ray.mjs');
const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
const state = (beat, changes = {}) => ({
  beat,
  beatP: 0.99,
  cues: Object.fromEntries(Object.entries(changes).map(([id, value]) => ['ray-' + id, value])),
});
function paint(id, s) {
  const texts = [],
    rectangles = [],
    grids = [];
  R.draw({}, { id }, s, {
    C: new Proxy({}, { get: (_, k) => String(k) }),
    focus: { target: (_, fn) => fn() },
    teaching: {
      grid: (o) => {
        grids.push(o);
        texts.push(...o.labels.flat().map(String));
        return {};
      },
      transfer: () => {},
    },
    components: {
      panel: (o) => o,
      card: (o) => {
        texts.push(o.label);
        return o;
      },
    },
    text: (_, v) => texts.push(String(v)),
    rect: (_, x, y, width, height, fill, stroke) =>
      rectangles.push({ x, y, width, height, fill, stroke }),
    line() {},
    arrow() {},
    circle() {},
    path() {},
  });
  return { texts, rectangles, grids };
}
test('durable batch replay returns its own recorded result after later batches', () => {
  const initial = { count: 7, records: {} },
    a = R.rayApplyBatch(initial, 'B92', 3),
    r = R.rayApplyBatch(a.ledger, 'B92', 3),
    z = R.rayApplyBatch(r.ledger, 'B93', 2),
    old = R.rayApplyBatch(z.ledger, 'B92', 3);
  assert.deepEqual([a.result, r.result, z.result, old.result], [10, 10, 12, 10]);
  assert.equal(old.ledger.count, 12);
  assert.equal(old.changed, false);
  assert.deepEqual(initial, { count: 7, records: {} });
});
test('resource sums do not satisfy same-node or distinct-node bundle constraints', () => {
  assert.equal(R.rayResources(4, [1, 1]).free, 2);
  assert.equal(R.rayResources(2, [1, 1]).childFits, false);
  assert.equal(R.rayPlacement([3, 3], [1, 1, 1, 1], 'PACK').ready, true);
  assert.equal(R.rayPlacement([3, 3], [1, 1, 1, 1], 'STRICT_SPREAD').ready, false);
  assert.equal(R.rayPlacement([3, 3], [4], 'PACK').ready, false);
  assert.deepEqual(R.rayPlacement([2, 2], [1, 1, 1, 1], 'STRICT_PACK').assignment, []);
});
test('ready but unconsumed results retain the bounded admission slots', () => {
  const full = R.rayBackpressure(3),
    consumed = R.rayBackpressure(4);
  assert.equal(full.ready.length, 3);
  assert.equal(full.submitted, 3);
  assert.equal(full.consumed.length, 0);
  assert.equal(consumed.submitted, 4);
  assert.equal(consumed.consumed.length, 1);
  for (let t = 0; t < 50; t++) {
    const s = R.rayBackpressure(t);
    assert(s.pending.length <= 3);
    assert.equal(s.submitted - s.consumed.length, s.pending.length);
  }
});
test('fresh owner, ledger reply and new result have independent completed clauses', () => {
  for (const p of [0, 0.5, 1]) {
    const x = R.rayChapterState('fresh-owner', { beat: 0, beatP: p, cues: {} });
    assert.equal(x.ownerVerdict, false);
    assert.equal(x.ledgerVerdict, false);
    assert.equal(x.newReference, false);
  }
  const owner = R.rayChapterState(
    'fresh-owner',
    state(1, { 'fresh-owner-error': after, 'fresh-batch-result': before }),
  );
  assert.equal(owner.ownerVerdict, true);
  assert.equal(owner.ledgerVerdict, false);
  const ready = R.rayChapterState('fresh-owner', state(2, { 'fresh-newref': after }));
  assert.equal(ready.oldReference, 'X');
  assert.equal(ready.newReference, true);
  assert.equal(ready.storedResult, 5);
});
test('a revealed feature tuple retains the complete input sum used to derive it', () => {
  const x = paint('primitive-contract', state(0, { 'feature-values': after }));
  for (const s of [
    'partial sum 500',
    'partial sum 673',
    'partial sum 527',
    '[5, 96]',
    '[6, 67]',
    '[5, 22]',
  ])
    assert(x.texts.includes(s), s);
});
test('the admitted child consumes the actor slot that was actually released', () => {
  const x = paint('actor-resource', state(1, { 'actor-release': after }));
  assert(x.texts.includes('Child task · CPU1'));
  assert(x.texts.includes('2 −1 actor −1 child =0 free'));
  assert(!x.texts.includes('2 − 1 reserved = 1 free'));
});
test('reconstruction restores an actual payload and withholds its completion beforehand', () => {
  const base = { 'copy-survives': after, 'all-copies': after, 'reconstruct': before },
    waiting = paint('lost-result', state(0, base));
  assert(waiting.texts.includes('Node A · no copy'));
  assert(!waiting.texts.includes('Same task output reconstructed'));
  const restored = paint('lost-result', state(0, { ...base, reconstruct: after }));
  assert(restored.texts.includes('Node A · bytes'));
  assert(restored.texts.includes('Same task output reconstructed'));
});
test('the freed array remains freed when a separate spill example begins', () => {
  const x = paint('memory-lifetime', state(2, { 'eligible-spill': after }));
  assert(x.texts.includes('array view released'));
  assert(x.texts.includes('ref variable deleted'));
  assert.equal(x.grids[0].labels[0].filter((v) => v === 'free').length, 8);
  assert(!x.texts.includes('NumPy view → same allocation'));
});
test('durable publication exposes neither count nor batch record before commit', () => {
  const pending = paint(
    'durable-restore',
    state(1, { 'batch-pending': after, 'transaction-after': before }),
  );
  assert(pending.texts.includes('Published count 3'));
  assert(pending.texts.includes('Pending: count5 + B18→5'));
  assert(!pending.texts.includes('B18 →5'));
  const committed = paint(
    'durable-restore',
    state(1, { 'batch-pending': after, 'transaction-after': after }),
  );
  assert(committed.texts.includes('Published count 5'));
  assert(committed.texts.includes('B18 →5'));
});
test('actor restoration waits for the existing completed restore clause', () => {
  assert.equal(
    R.sampleModel('restart', {
      beat: 2,
      beatP: 0.99,
      cues: { 'restart-load-durable-ledger': before },
    }).count,
    0,
  );
  assert.equal(
    R.sampleModel('restart', {
      beat: 2,
      beatP: 0.99,
      cues: { 'restart-load-durable-ledger': after },
    }).count,
    3,
  );
});
test('payload sum and store capacity share one byte scale', () => {
  const x = paint(
      'granularity-pressure',
      state(1, { 'payload-total': after, 'store-exceeded': after }),
    ),
    payload = x.rectangles.filter((v) => v.y === 460),
    cap = x.rectangles.find((v) => v.y === 700);
  assert.equal(payload.length, 3);
  assert.deepEqual(
    payload.map((v) => v.x),
    [200, 520, 840],
  );
  assert.equal(payload[0].width / cap.width, 64 / 80);
  assert.equal(payload.reduce((n, v) => n + v.width, 0) / cap.width, 192 / 80);
});
test('doubling replicas duplicates the actual worker grid while retaining the first', () => {
  const one = paint(
      'engine-boundary',
      state(1, { 'engine-eight': after, 'engine-double': before }),
    ),
    two = paint('engine-boundary', state(1, { 'engine-eight': after, 'engine-double': after }));
  assert.equal(one.grids.length, 1);
  assert.equal(two.grids.length, 2);
  assert.deepEqual(one.grids[0], two.grids[0]);
  assert.equal(two.grids.flatMap((x) => x.labels.flat()).length, 16);
});
