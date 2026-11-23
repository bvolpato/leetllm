import test from 'node:test';
import assert from 'node:assert/strict';
import {
  meshCoordinate,
  largerMlp,
  ownedSgd,
  momentumReceipt,
  expertCapacityReceipt,
  draw,
} from '../animations/deep-dive-megatron.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-12);

test('mixed-radix coordinates preserve all rank identities under different legal worlds', () => {
  for (const shape of [
    { tp: 2, dp: 2, pp: 2 },
    { tp: 4, cp: 2, dp: 4, pp: 2 },
    { etp: 1, ep: 64, edp: 1, pp: 4 },
  ]) {
    const world = Object.values(shape).reduce((a, b) => a * b, 1),
      seen = new Set();
    for (let rank = 0; rank < world; rank++) {
      const c = meshCoordinate(rank, shape);
      let rebuilt = 0,
        stride = 1;
      for (const [k, n] of Object.entries(shape)) {
        rebuilt += c[k] * stride;
        stride *= n;
      }
      assert.equal(rebuilt, rank);
      seen.add(JSON.stringify(c));
    }
    assert.equal(seen.size, world);
  }
  assert.deepEqual(meshCoordinate(27, { tp: 4, cp: 2, dp: 4, pp: 2 }), {
    tp: 3,
    cp: 0,
    dp: 3,
    pp: 0,
  });
  assert.throws(() => meshCoordinate(8, { tp: 2, dp: 2, pp: 2 }));
});

test('actual H8/I16 partial outputs reproduce the serial tanh-GeLU reference', () => {
  const r = largerMlp();
  assert.equal(r.partials.length, 4);
  assert.equal(r.partials[0].length, 8);
  r.output.forEach((v, i) => near(v, r.serial[i]));
  assert.deepEqual(
    r.output.map((v) => Number(v.toFixed(4))),
    [-0.1782, -0.2062, -0.1582, -0.1862, 0, -0.1782, -0.2062, -0.1582],
  );
});

test('owned gradient slices reconstruct the same complete SGD update', () => {
  const r = ownedSgd();
  assert.deepEqual(r.owned.flat(), r.gradient);
  assert.deepEqual(r.gradient, [2, 4, 6, 8]);
  r.updated.forEach((v, i) => near(v, [0.8, 1.6, 2.4, 3.2][i]));
});

test('dropping overflowing expert assignments retains each affected token other path', () => {
  const r = expertCapacityReceipt(4);
  assert.equal(r.kept.length + r.dropped.length, 16);
  assert.equal(r.dropped.length, 4);
  assert.equal(r.affectedTokens.length, 4);
  for (const token of r.affectedTokens) {
    assert(r.kept.some((v) => v.token === token));
    assert.equal(r.dropped.filter((v) => v.token === token).length, 1);
  }
  assert.equal(expertCapacityReceipt(8).dropped.length, 0);
});

test('next-update equivalence needs both saved velocity and the correct next example', () => {
  const full = momentumReceipt(1.5, 0.8, 2, 2),
    reset = momentumReceipt(1.5, 0, 2, 2),
    stale = momentumReceipt(1.5, 0.8, 1, 2);
  near(full.nextWeight, 1.26);
  near(reset.nextWeight, 1.3);
  near(stale.nextWeight, 1.51);
  assert.equal(full.prediction, reset.prediction);
  assert.notEqual(full.nextWeight, reset.nextWeight);
});

function labels(beat, cues = {}) {
  const out = [],
    noop = () => {},
    api = {
      C: {
        ink: 'white',
        muted: 'gray',
        panel: 'black',
        blue: 'blue',
        cyan: 'cyan',
        green: 'green',
        pink: 'pink',
        yellow: 'yellow',
        bg: 'black',
      },
      text: (_, s) => out.push(String(s)),
      math: (_, s) => out.push(String(s)),
      line: noop,
      rect: noop,
      arrow: noop,
      circle: noop,
      teaching: { grid: (o) => out.push(...o.labels.flat().map(String)) },
      focus: {
        target: (_, paint) => paint(),
        progress: (id, fallback) => cues[id]?.progress ?? fallback,
      },
    };
  draw({}, { id: 'earned-return' }, { beat, beatP: 0.999, cues }, api);
  return out;
}
test('painted fresh next weights wait for their own completed result clauses', () => {
  assert(!labels(0).some((s) => s.includes('1.26') || s.includes('1.30') || s.includes('1.51')));
  assert(
    !labels(1, {
      'mg-fresh-full': { progress: 0.999 },
      'mg-fresh-reset': { progress: 0.999 },
    }).some((s) => s.includes('1.26') || s.includes('1.30')),
  );
  assert(labels(1, { 'mg-fresh-full': { progress: 1 } }).some((s) => s.includes('1.26')));
  assert(!labels(2).some((s) => s.includes('1.26') || s.includes('1.51')));
  assert(
    !labels(3, {
      'mg-fresh-stale-result': { progress: 0.999 },
      'mg-fresh-cursor-repair': { progress: 0.999 },
    }).some((s) => s.includes('1.51') || s.includes('1.26')),
  );
  assert(labels(3, { 'mg-fresh-stale-result': { progress: 1 } }).some((s) => s.includes('1.51')));
  assert(labels(3, { 'mg-fresh-cursor-repair': { progress: 1 } }).some((s) => s.includes('1.26')));
});

function painted(scene, beat, cues = {}) {
  const grids = [],
    rectangles = [],
    equations = [],
    noop = () => {},
    api = {
      C: {
        ink: 'white',
        muted: 'gray',
        panel: 'black',
        blue: 'blue',
        cyan: 'cyan',
        green: 'green',
        pink: 'pink',
        yellow: 'yellow',
        bg: 'black',
      },
      text: noop,
      math: (_, s) => equations.push(String(s)),
      line: noop,
      rect: (_, x, y, w, h) => rectangles.push({ x, y, w, h }),
      arrow: noop,
      circle: noop,
      teaching: { grid: (o) => grids.push(o.labels) },
      focus: {
        target: (_, paint) => paint(),
        progress: (id, fallback) => cues[id]?.progress ?? fallback,
      },
    };
  draw({}, { id: scene }, { beat, beatP: 0.5, cues }, api);
  return { grids, rectangles, equations };
}
test('completed rank-population equation has all 64 visible rank cells', () => {
  const r = painted('small-lattice', 1, { 'mg-world-sixty-four': { progress: 1 } });
  assert.equal(r.rectangles.length, 64);
  assert(r.equations.some((v) => v.includes('=64')));
  const partial = painted('small-lattice', 1, { 'mg-world-sixty-four': { progress: 0.999 } });
  assert.equal(partial.rectangles.length, 63);
  assert(!partial.equations.some((v) => v.includes('=64')));
});
test('hierarchical optimizer domains repeat the same owned slices across outer replicas', () => {
  const r = painted('data-ownership', 1, { 'mg-optimizer-domains': { progress: 1 } });
  assert.deepEqual(r.grids[0], r.grids[6]);
  assert.deepEqual(r.grids[3], r.grids[9]);
  assert.deepEqual(r.grids[0], [['O0', 'O1', '·', '·']]);
  assert.deepEqual(r.grids[3], [['·', '·', 'O2', 'O3']]);
});
test('repairing the next-example cursor changes the actual painted input premise', () => {
  const pending = painted('earned-return', 3, { 'mg-fresh-cursor-repair': { progress: 0.999 } }),
    fixed = painted('earned-return', 3, { 'mg-fresh-cursor-repair': { progress: 1 } });
  assert.deepEqual(pending.grids[1][1], [1.5, 0.8, 1, 2]);
  assert.deepEqual(fixed.grids[1][1], [1.5, 0.8, 2, 2]);
});
test('training schedule respects each microbatch forward and reverse-stage dependencies', () => {
  const rows = painted('microbatch-budget', 2, {
    'mg-microbatch-budget-b2': { progress: 1 },
  }).grids[0].slice(1);
  for (let i = 0; i < 4; i++) {
    const f0 = rows[0].indexOf('F' + i),
      f1 = rows[1].indexOf('F' + i),
      b1 = rows[1].indexOf('B' + i),
      b0 = rows[0].indexOf('B' + i);
    assert(f0 > 0 && f1 > f0 && b1 > f1 && b0 > b1);
  }
});
