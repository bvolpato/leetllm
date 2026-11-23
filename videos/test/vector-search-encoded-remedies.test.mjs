import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draw,
  encodeChunks,
  collisionFixture,
  referenceChangeState,
  releasePredictionState,
} from '../animations/vector-search.mjs';

const after = { phase: 'after', progress: 1 },
  before = { phase: 'before', progress: 0 };

test('two real subvectors choose their nearest centroids and retain the actual IDs', () => {
  const q = encodeChunks([1.8, 0.2, 0.1, 1.7]);
  assert.deepEqual(q.ids, [1, 2]);
  assert.deepEqual(q.reconstructed, [2, 0, 0, 2]);
  assert.ok(Math.abs(q.error2 - 0.18) < 1e-12);
  assert.deepEqual(encodeChunks([1, 0, 0, 1]).ids, [0, 0]);
});

test('a code collision hides the order which original-vector reranking recovers', () => {
  const f = collisionFixture();
  assert.deepEqual(
    f.originals.map((p) => p.code),
    [
      [0, 0],
      [0, 0],
    ],
  );
  assert.deepEqual(
    f.adcOrder.map((p) => p.id),
    ['A', 'B'],
  );
  assert.deepEqual(
    f.originalOrder.map((p) => p.id),
    ['B', 'A'],
  );
  assert.ok(Math.abs(f.originalOrder[0].trueDistance2 - 0.04) < 1e-12);
  assert.ok(Math.abs(f.originalOrder[1].trueDistance2 - 2.56) < 1e-12);
  const shortlist = f.adcOrder.slice(0, 1);
  assert.deepEqual(
    shortlist.sort((a, b) => a.trueDistance2 - b.trueDistance2).map((p) => p.id),
    ['A'],
  );
  assert.deepEqual(encodeChunks(f.database.map((v, i) => v - f.coarse[i])).ids, [0, 0]);
  assert.deepEqual(
    f.query.map((v, i) => v - f.coarse[i]),
    [0, 0, 0, 0],
  );
});

test('the exact reference follows the same filter and then deletion', () => {
  const original = referenceChangeState({ beat: 0 });
  assert.deepEqual(original.reference, ['A', 'B']);
  assert.deepEqual(original.result, ['A', 'C']);
  const filtered = referenceChangeState({
    beat: 1,
    cues: { 'transfer-filter-reference': after, 'transfer-delete-reference': before },
  });
  assert.deepEqual(filtered.eligible, ['A', 'C', 'E']);
  assert.deepEqual(filtered.reference, ['A', 'C']);
  assert.deepEqual(filtered.result, ['A', 'C']);
  const deleted = referenceChangeState({
    beat: 1,
    cues: { 'transfer-filter-reference': after, 'transfer-delete-reference': after },
  });
  assert.deepEqual(deleted.reference, ['C', 'E']);
  assert.deepEqual(deleted.result, ['C']);
  assert.deepEqual(referenceChangeState({ beat: 0 }), original);
});

function paintRelease(state) {
  const text = [],
    colors = [],
    api = {
      C: {
        ink: 'white',
        muted: 'gray',
        panel: 'navy',
        cyan: 'cyan',
        yellow: 'yellow',
        green: 'green',
        red: 'red',
        blue: 'blue',
        pink: 'pink',
      },
      components: {},
      clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
      phase: (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a))),
      focus: { target: (_, f) => f(), progress: () => 1 },
      text: (_, v) => text.push(v),
      circle: (_ctx, _x, _y, _r, c) => colors.push(c),
      math: () => {},
    };
  draw({}, { id: 'earned-transfer' }, state, api);
  return { text, colors };
}

test('question and partial numeric clause paint no answer or outcome colors', () => {
  for (const state of [
    { beat: 0, beatP: 0.99 },
    { beat: 1, beatP: 0.2, cues: { 'earned-transfer-result': { phase: 'active', progress: 0.7 } } },
  ]) {
    const p = paintRelease(state);
    assert.equal(
      p.text.some((v) => v.includes('HOLD') || v.includes('80%')),
      false,
    );
    assert.equal(p.colors.includes('green') || p.colors.includes('red'), false);
  }
  const complete = { beat: 1, cues: { 'earned-transfer-result': after } },
    p = paintRelease(complete);
  assert.ok(p.text.includes('4 / 5 = 80% · HOLD'));
  assert.ok(p.colors.includes('red'));
  assert.equal(releasePredictionState(complete).recall, 0.8);
  assert.equal(releasePredictionState({ beat: 0, beatP: 1 }).decision, null);
});

test('original reranking updates the main rows and their active distance operands', () => {
  const labels = [],
    api = {
      C: {
        ink: 'white',
        muted: 'gray',
        panel: 'navy',
        cyan: 'cyan',
        yellow: 'yellow',
        green: 'green',
        red: 'red',
        blue: 'blue',
        pink: 'pink',
      },
      components: {},
      clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
      phase: () => 1,
      focus: { target: (_, f) => f(), progress: () => 1 },
      text: (_, v, x, y) => labels.push({ v, x, y }),
      arrow: () => {},
      math: () => {},
    };
  draw(
    {},
    { id: 'adc-lookup' },
    {
      beat: 2,
      cues: {
        'adc-original-order': after,
        'adc-overfetch-originals': after,
        'adc-database-residual': before,
      },
    },
    api,
  );
  assert.equal(labels.find((x) => x.v.startsWith('B =')).y, 400);
  assert.equal(labels.find((x) => x.v.startsWith('A =')).y, 585);
  assert.ok(labels.some((x) => x.v === 'true d² = 0.04' && x.y === 400));
  assert.ok(labels.some((x) => x.v === 'true d² = 2.56' && x.y === 585));
  assert.equal(
    labels.some((x) => x.v === 'ADC = 0'),
    false,
  );
});
