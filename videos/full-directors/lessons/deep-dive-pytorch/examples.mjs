import assert from 'node:assert/strict';

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const address = ([r, c], [rs, cs], offset = 0) => offset + r * rs + c * cs;
export const sizes = [2, 3],
  strides = [3, 1];
export const ySizes = [...sizes].reverse(),
  yStrides = [...strides].reverse();
export const storage = BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]);
export const order = Array.from(storage, (_, i) =>
  address([Math.floor(i / ySizes[1]), i % ySizes[1]], yStrides),
);
export const flat = BigInt64Array.from(order, (i) => storage[i]);
export const marked = address([1, 0], strides);
export const afterWrite = storage.slice();
afterWrite[address([0, 1], yStrides)] = 30n;

export function backward({ clone, write }) {
  const leaf = 1.5,
    factor = 2;
  const value = leaf * factor;
  const src = { value, version: 0 };
  const saved = { ref: src, expected: src.version };
  const target = clone ? { ...src } : src;
  if (write) {
    target.value++;
    target.version++;
  }
  const valid = saved.expected === saved.ref.version;
  return {
    leaf,
    factor,
    value,
    loss: value ** 2,
    src,
    saved,
    target,
    valid,
    dy: valid ? 2 * src.value : null,
    dx: valid ? 2 * src.value * factor : null,
  };
}

export const keys = [
    [1, 0],
    [0, 1],
  ],
  query = [1, 0],
  values = [
    [10, 0],
    [0, 20],
  ];
export function attention(allow) {
  const scores = keys.map((key) => sum(key.map((k, i) => k * query[i])) / Math.sqrt(query.length));
  const max = Math.max(...scores.filter((_, i) => allow[i]));
  const weights = scores.map((n, i) => (allow[i] ? Math.exp(n - max) : 0));
  const probs = weights.map((w) => w / sum(weights));
  return {
    scores,
    probs,
    out: values[0].map((_, d) => sum(values.map((v, i) => v[d] * probs[i]))),
  };
}
export const causalMask = (position) => keys.map((_, i) => i <= position);
export const scoreShape = { batch: 1, heads: 2, positions: 8192, bytesPerScore: 2 };
export const scoreCount = scoreShape.batch * scoreShape.heads * scoreShape.positions ** 2;
export const scoreBytes = scoreCount * scoreShape.bytesPerScore;
export const padValues = [4, 8, 1000],
  padding = [false, false, true];
export function padTest(invert) {
  const allow = padding.map((v) => (invert ? !v : v));
  const passed = padValues.filter((_, i) => allow[i]);
  return { allow, out: sum(passed) / passed.length };
}

export const calls = [
  { x: [1, 2], scale: 2 },
  { x: [2, 3], scale: 2 },
  { x: [2, 3], scale: 3 },
  { x: [2, 3], scale: 2 },
].map((c) => ({ ...c, dtype: 'float64', stride: 1 }));
export function runCache(inputs) {
  const variants = [];
  return inputs.map((call) => {
    const key = [call.dtype, call.stride, call.scale].join('/');
    const hit = variants.includes(key);
    if (!hit) variants.push(key);
    return {
      ...call,
      hit,
      graph: String.fromCharCode(65 + variants.indexOf(key)),
      variants: [...variants],
      out: call.x.map((x) => x * x * call.scale),
    };
  });
}
export const events = runCache(calls);
export const partials = [
  [1, 2],
  [10, 20],
];
export const logical = partials[0].map((_, i) => sum(partials.map((row) => row[i])));
export const destinations = (sharded) =>
  partials.map((_, r) => (sharded ? [logical[r]] : [...logical]));
export const micro = [2, 4, 6];
export function microResult(manual) {
  const contributions = micro.map((n) => n / (manual ? micro.length : 1));
  return { contributions, sum: sum(contributions), mean: sum(contributions) / micro.length };
}
export const shards = Array.from({ length: 4 }, (_, r) => [2 * r + 1, 2 * r + 2]);
export const full = shards.flat();
export function allocations(prefetch) {
  const parameter = 16;
  const rows = [parameter / 4, parameter, 12, prefetch ? 8 : 0];
  return { rows, total: sum(rows), room: 36 - sum(rows) };
}
export function split(length, ranks) {
  assert.equal(length % ranks, 0);
  const size = length / ranks;
  return Array.from({ length: ranks }, (_, rank) =>
    Array.from({ length: size }, (_, i) => size * rank + i),
  );
}
export const restart = { length: 12, saved: 80, failed: 87, old: split(12, 3), dest: split(12, 2) };
export const opt = { b1: 0.9, b2: 0.999, eps: 1e-8, lr: 0.01 };
export const nextGradient = -0.25;
export function firstMoment(oldMoment, grad) {
  const history = opt.b1 * oldMoment;
  const incoming = (1 - opt.b1) * grad;
  return { history, incoming, next: history + incoming };
}
export function adam(state, grad, rate = opt.lr) {
  const t = state.t + 1;
  const m = firstMoment(state.m, grad).next;
  const v = opt.b2 * state.v + (1 - opt.b2) * grad * grad;
  const direction = m / (1 - opt.b1 ** t) / (Math.sqrt(v / (1 - opt.b2 ** t)) + opt.eps);
  return { w: state.w - rate * direction, m, v, t, direction };
}
export const saved = adam({ w: 1, m: 0, v: 0, t: 0 }, 0.5);
export const fresh = { ...saved, m: 0, v: 0, t: 0 };
export const results = [
  adam(saved, nextGradient),
  adam({ ...saved }, nextGradient),
  adam(fresh, nextGradient),
  adam(saved, nextGradient, opt.lr / 2),
];

export function check() {
  assert.deepEqual(ySizes, [3, 2]);
  assert.deepEqual(yStrides, [1, 3]);
  assert.equal(marked, address([0, 1], yStrides));
  assert.equal(storage.BYTES_PER_ELEMENT * marked, 24);
  assert.deepEqual(order, [0, 3, 1, 4, 2, 5]);
  assert.deepEqual(
    order.slice(1).map((n, i) => n - order[i]),
    [3, -2, 3, -2, 3],
  );
  assert.notStrictEqual(flat.buffer, storage.buffer);
  assert.equal(afterWrite[marked], 30n);
  assert.equal(flat[1], 3n);
  const bad = backward({ clone: false, write: true }),
    good = backward({ clone: true, write: true });
  assert.deepEqual(
    [bad.loss, bad.saved.expected, bad.target.version, bad.src.value, bad.valid, bad.dx],
    [9, 0, 1, 4, false, null],
  );
  assert.strictEqual(bad.target, bad.src);
  assert.notStrictEqual(good.target, good.src);
  assert.deepEqual(
    [good.target.value, good.src.value, good.src.version, good.dy, good.dx],
    [4, 3, 0, 6, 12],
  );
  assert.deepEqual(causalMask(0), [true, false]);
  assert.deepEqual(causalMask(1), [true, true]);
  assert.deepEqual(attention(causalMask(0)).out, [10, 0]);
  assert.deepEqual(
    attention(causalMask(1)).out.map((v) => v.toFixed(2)),
    ['6.70', '6.60'],
  );
  assert.deepEqual([padTest(false).out, padTest(true).out], [1000, 6]);
  assert.deepEqual([scoreCount, scoreBytes, scoreBytes / 2 ** 20], [134217728, 268435456, 256]);
  assert.deepEqual(
    events.map((e) => [e.hit, e.graph, e.variants.length, e.out]),
    [
      [false, 'A', 1, [2, 8]],
      [true, 'A', 1, [8, 18]],
      [false, 'B', 2, [12, 27]],
      [true, 'A', 2, [8, 18]],
    ],
  );
  assert.equal(runCache([...calls, { ...calls[0], stride: 2 }]).at(-1).variants.length, 3);
  assert.deepEqual(destinations(false), [
    [11, 22],
    [11, 22],
  ]);
  assert.deepEqual(destinations(true), [[11], [22]]);
  assert.deepEqual(microResult(false), { contributions: [2, 4, 6], sum: 12, mean: 4 });
  assert.equal(microResult(true).mean, 4 / 3);
  assert.deepEqual(full, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(
    shards.map((row) => row.map((w) => w * 2)).flat(),
    full.map((w) => w * 2),
  );
  assert.deepEqual(allocations(true), { rows: [4, 16, 12, 8], total: 40, room: -4 });
  assert.equal(allocations(false).room, 4);
  assert.deepEqual(restart.old.flat(), restart.dest.flat());
  assert.equal(restart.dest[1][0], 6);
  assert.equal(restart.failed - restart.saved, 7);
  assert.deepEqual(results[0], results[1]);
  for (const [initial, expected] of [[saved, ['0.045', '-0.025', '0.020']], [fresh, ['0.000', '-0.025', '-0.025']]]) {
    const { history, incoming, next } = firstMoment(initial.m, nextGradient);
    assert.deepEqual([history, incoming, next].map((x) => x.toFixed(3)), expected);
  }
  assert.deepEqual(
    results.map((r) => r.w.toFixed(6)),
    ['0.987337', '0.987337', '1.000000', '0.988668'],
  );
  assert.deepEqual(
    results.map((r) => r.t),
    [2, 2, 1, 2],
  );
  assert.deepEqual(
    results.map((r) => r.m.toFixed(3)),
    ['0.020', '0.020', '-0.025', '0.020'],
  );
}
