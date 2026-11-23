import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draw,
  packingActors,
  firstFit,
  attentionFrame,
  makeAttentionMasks,
  attendedMean,
  eosLabels,
  lossTerms,
  freshContract,
  typedGate,
  CHECKPOINT,
  budgetRepairFrame,
  COLLATED,
  ASSISTANT_TARGETS,
} from '../animations/instruction-masking.mjs';
const C = {
  ink: '#fff',
  panel: '#111',
  muted: '#777',
  blue: '#07f',
  cyan: '#0ff',
  yellow: '#ff0',
  green: '#0f0',
  pink: '#f0f',
  bg: '#000',
};
function paintedPacking(progress) {
  const rectangles = [];
  const api = {
    C,
    focus: { target: (_id, fn) => fn() },
    text: () => {},
    math: () => {},
    rect: (_ctx, x, y, width, height, fill, stroke) =>
      rectangles.push({ x, y, width, height, fill, stroke }),
    line: () => {},
    circle: () => {},
  };
  draw(
    {},
    { id: 'packing' },
    {
      beat: 0,
      beatP: progress,
      cues: { 'packing-placement': { phase: progress === 1 ? 'after' : 'during', progress } },
    },
    api,
  );
  return rectangles.filter((r) => [C.blue, C.cyan, C.yellow, C.green].includes(r.stroke));
}
test('packing paints one colored actor for each of the 27 token owners throughout relocation', () => {
  for (let k = 0; k <= 100; k++) {
    const actors = packingActors(k / 100),
      paint = paintedPacking(k / 100);
    assert.equal(actors.length, 27);
    assert.equal(new Set(actors.map((a) => a.id)).size, 27);
    assert.equal(paint.length, 27);
    for (let i = 0; i < actors.length; i++) {
      assert.equal(paint[i].x, actors[i].x);
      assert.equal(paint[i].y, actors[i].y);
    }
  }
});
test('first-fit scans existing windows before opening another, including a fresh packing case', () => {
  assert.deepEqual(firstFit([9, 6, 7, 5]).contents, [
    [0, 1],
    [2, 3],
  ]);
  assert.deepEqual(firstFit([8, 5, 4, 3]).bins, [16, 4]);
  assert.throws(() => firstFit([17]));
});
test('ordinary and isolated attention coexist across the scene transition instead of resetting one state', () => {
  const end = attentionFrame({ beat: 0, beatP: 1 }),
    start = attentionFrame({ beat: 1, beatP: 0 });
  assert.deepEqual(end.causal, start.causal);
  assert.deepEqual(end.isolated, start.isolated);
  assert.equal(start.ordinary, 7.2);
  assert.equal(start.restricted, 15);
});
test('perturbing every A value cannot affect isolated B1 but changes the causal control', () => {
  const { causal, isolated } = makeAttentionMasks(),
    base = [1, 2, 3, 10, 20, 30],
    changed = [1001, 1002, 1003, 10, 20, 30];
  assert.equal(attendedMean(isolated, 4, base), 15);
  assert.equal(attendedMean(isolated, 4, changed), 15);
  assert.equal(attendedMean(causal, 4, changed), 607.2);
  assert.equal(causal[4][5], 0);
  assert.equal(isolated[4][5], 0);
});
test('position validity preserves a genuine shared-ID ending and excludes padding after exactly one shift', () => {
  const bad = eosLabels({ idOnly: true }),
    good = eosLabels();
  assert.equal(bad.labels[4], -100);
  assert.equal(good.labels[4], 5);
  assert.deepEqual(good.predictorLabels, [2, 3, 4, 5, -100, -100]);
  assert.equal(good.labels[5], -100);
  assert.equal(good.labels[6], -100);
});
test('three supplied probabilities produce the checked mean and target-logit derivatives', () => {
  const l = lossTerms(),
    epsilon = 1e-5;
  assert(Math.abs(l.sum - Math.log(10)) < 1e-12);
  assert(Math.abs(l.mean - Math.log(10) / 3) < 1e-12);
  for (let i = 0; i < 3; i++) {
    const z = Math.log(l.probabilities[i] / (1 - l.probabilities[i])),
      loss = (x) => Math.log1p(Math.exp(-x)) / 3,
      finite = (loss(z + epsilon) - loss(z - epsilon)) / (2 * epsilon);
    assert(Math.abs(finite - l.targetLogitGradients[i]) < 1e-9);
  }
});
test('the fresh repair restores only the missing predecessor cell while keeping padding ignored', () => {
  const bad = freshContract(),
    good = freshContract(true);
  assert.deepEqual(good.labels, [-100, -100, 19, 23, -100]);
  assert.deepEqual(
    good.labels.map((v, i) => (v === bad.labels[i] ? null : i)).filter((v) => v !== null),
    [2],
  );
  assert.equal(good.ids[4], good.ids[5]);
  assert.notEqual(good.valid[4], good.valid[5]);
});
test('the release rule rejects invalid numeric types before inclusive threshold comparisons', () => {
  assert.equal(typedGate({ parity: true, rate: 0.98, critical: 0, latency: 700 }).pass, true);
  for (const patch of [
    { rate: true },
    { rate: NaN },
    { rate: '0.99' },
    { critical: false },
    { critical: 0.5 },
    { latency: Infinity },
    { parity: 'yes' },
  ])
    assert.equal(
      typedGate({ parity: true, rate: 0.99, critical: 0, latency: 620, ...patch }).pass,
      false,
    );
});
test('the pinned closed answer and open prefill preserve the actual 44-ID context prefix', () => {
  assert.equal(CHECKPOINT.prefixIds.length, 44);
  assert.equal(CHECKPOINT.answerIds.length, 9);
  assert.equal(CHECKPOINT.prefillIds.length, 8);
  assert.equal(CHECKPOINT.answerIds.at(-1), 2);
  assert.notEqual(CHECKPOINT.prefillIds.at(-1), 2);
  assert.deepEqual(CHECKPOINT.prefixIds.slice(-4), [733, 28748, 16289, 28793]);
});
test('predictor connectors reach the next-token target owner in the aligned target view', () => {
  const texts = [],
    arrows = [];
  const api = {
    C,
    focus: { target: (_id, fn) => fn() },
    text: (_ctx, value, x, y) => texts.push({ value: String(value), x, y }),
    math: () => {},
    rect: () => {},
    line: (_ctx, x1, y1, x2, y2) => arrows.push({ x1, y1, x2, y2 }),
    circle: () => {},
  };
  draw({}, { id: 'transfer' }, { beat: 0, beatP: 1, cues: {} }, api);
  const targets = texts.filter((t) => t.y > 640 && t.y < 710),
    connectors = arrows.filter((a) => a.y1 === 495 && a.y2 === 620),
    destinations = connectors.map(
      (a) =>
        targets.reduce((best, t) => (Math.abs(t.x - a.x2) < Math.abs(best.x - a.x2) ? t : best))
          .value,
    );
  assert.deepEqual(destinations, ['She', 'is', 'playing.', '<EOS>']);
});

test('a whole-message capacity edit commits only after its 45-token owner finishes moving', () => {
  for (const progress of [0, 0.1, 0.5, 0.999]) {
    const f = budgetRepairFrame({
      beat: 2,
      cues: { 'im-fresh-budget-repair': { phase: 'during', progress } },
    });
    assert.equal(f.prompt, 970);
    assert.equal(f.total, 1066);
    assert.equal(f.exchangeTokens, 45);
  }
  const f = budgetRepairFrame({
    beat: 2,
    cues: { 'im-fresh-budget-repair': { phase: 'after', progress: 1 } },
  });
  assert.equal(f.prompt, 925);
  assert.equal(f.total, 1021);
  assert.equal(f.total <= f.limit, true);
});

test('message role remains separate from whether that position is selected as a target', () => {
  assert.equal(COLLATED[0].role, 'user');
  assert.equal(COLLATED[5].role, 'assistant');
  assert.equal(ASSISTANT_TARGETS[5], false);
  assert.equal(ASSISTANT_TARGETS[6], true);
  assert.equal(COLLATED[10].role, 'user');
});

test('moving packing owners clear already placed and waiting token rectangles', () => {
  for (let step = 0; step <= 1000; step++) {
    const actors = packingActors(step / 1000);
    for (let i = 0; i < actors.length; i++)
      for (let j = i + 1; j < actors.length; j++) {
        const a = actors[i],
          b = actors[j],
          width = Math.min(a.x + 38, b.x + 38) - Math.max(a.x, b.x),
          height = Math.min(a.y + 58, b.y + 58) - Math.max(a.y, b.y);
        assert(
          width <= 1e-7 || height <= 1e-7,
          `${a.id} crosses ${b.id} at transfer progress ${step / 1000}`,
        );
      }
  }
});
