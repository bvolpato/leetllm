import assert from 'node:assert/strict';
import { press } from './art.mjs';
import {
  opening,
  targets,
  bytes,
  vocab,
  support,
  exposure,
  boundaries,
  splitExample,
} from './typecase.mjs';
import { shutter, maskPair, oneHead, loss, fullBlock, lab, checkpoints } from './decoder.mjs';
import {
  sampling,
  replay,
  starts,
  optimizer,
  architecture,
  diagnostics,
  finalBatch,
  auditFixture,
  cpuWeights,
  cpuDelta,
  diagnosticRow,
} from './continued.mjs';
import { prompt } from '../../../films/build-gpt-from-scratch-lab/prompt.mjs';
import {
  decoderMiniature,
  lossStep,
  corpusCounts,
  samplerWindow,
  categoricalFixture,
  adamFork,
  normComparison,
  bytePieceFixture,
  tiedOutput,
} from '../../../films/build-gpt-from-scratch-lab/arithmetic.mjs';
import {
  logged,
  ATTENTION_CPU_FIXTURE as cpu,
} from '../../../films/build-gpt-from-scratch-lab/fixtures.mjs';

const painters = [
  opening,
  targets,
  bytes,
  vocab,
  support,
  exposure,
  boundaries,
  shutter,
  oneHead,
  loss,
  fullBlock,
  checkpoints,
  sampling,
  replay,
  optimizer,
  architecture,
  diagnostics,
  finalBatch,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  painters[clock.beat.chapterIndex](press(ctx, clock));
  ctx.restore();
}
function check() {
  assert.deepEqual(
    prompt.map((t) => t.original),
    [10248, 15967, 11, 198, 5248, 461],
  );
  const byRow = new Map(prompt.map((t) => [t.local, t]));
  assert.deepEqual([byRow.get(2).original, byRow.get(2).piece], [11, ',']);
  const pieces = prompt.map((t) => t.piece);
  assert.deepEqual(pieces.slice(1), ['·sir', ',', '↵', 'Spe', 'ak']);
  const byte = bytePieceFixture();
  assert.deepEqual([byte.unicode, byte.replacementCount, byte.strictRejects], ['U+1F642', 3, true]);
  const full = tiedOutput(),
    cut = tiedOutput(0);
  assert.deepEqual([full.fullWeights, full.compactWeights], [4824672, 1678560]);
  assert.deepEqual([full.fullTotal, full.compactTotal], [5053152, 1907040]);
  assert.equal(full.gradientUnused[0].toFixed(6), '0.422319');
  assert.deepEqual(
    [full, cut].map((f) => f.probabilities[1].toFixed(3)),
    ['0.155', '0.269'],
  );
  assert.equal(cut.probabilities[2], 0);
  const f = corpusCounts();
  assert.deepEqual(
    [f.train, f.validation, f.targetsPerUpdate, f.scored, f.validationScored],
    [1129727, 125526, 576, 184896, 4608],
  );
  assert.equal((f.fraction * 100).toFixed(1), '16.4');
  const { train, validation, context } = splitExample;
  const last = samplerWindow(train, context, 11);
  assert.deepEqual(last.input, [11, 12, 13, 14]);
  assert.deepEqual(last.target, [12, 13, 14, 15]);
  assert.equal(last.lastStart, 11);
  assert.throws(() => samplerWindow(train, context, 12));
  assert.throws(() => samplerWindow(validation, context));
  assert.throws(() => samplerWindow(48, 48));
  assert.equal(samplerWindow(49, 48).target.at(-1), 48);
  for (const changed of [false, true])
    for (const open of [false, true]) {
      const [source, copy] = maskPair(changed, open);
      assert.equal(copy.tokens[3], changed ? '·sir' : '↵');
      assert.equal(copy.target, source.target);
      assert.deepEqual(
        copy.attention.map((w) => w > 0),
        [true, true, true, open],
      );
      assert.deepEqual([source.logits[1], copy.logits[1]], open ? [2, changed ? 1.5 : 2] : [1, 1]);
      if (!open)
        assert.deepEqual(
          source.rows.slice(0, 3).map((r) => r.logits),
          copy.rows.slice(0, 3).map((r) => r.logits),
        );
    }
  const h = decoderMiniature();
  assert.deepEqual(h.inputs, [
    [0, 1],
    [1, 2],
    [2, 3],
    [5, 2],
  ]);
  assert.deepEqual(h.hidden, [1, 2]);
  assert.deepEqual(h.logits, [0, 1, 2, -1]);
  assert.deepEqual(h.outputRows, [
    [0, 0],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]);
  for (const t of [0, 0.5, 1]) {
    const l = lossStep(t);
    l.weights.forEach((w, i) => assert.equal(w, Math.exp(l.logits[i])));
    assert.equal(
      l.sum,
      l.weights.reduce((a, b) => a + b, 0),
    );
    assert.equal(l.probabilities[1], l.weights[1] / l.sum);
    assert.equal(l.loss, -Math.log(l.probabilities[1]));
  }
  assert.equal(lossStep().loss.toFixed(3), '1.440');
  assert.equal(lossStep(1).loss.toFixed(3), '0.985');
  assert.equal(lossStep(1).probabilities[1].toFixed(4), '0.3736');
  assert.ok(lossStep(1).loss < lossStep(0.5).loss);
  assert.equal(lab.width / lab.heads, 24);
  assert.equal(((lab.batch * lab.time * lab.vocab * 4) / 1e6).toFixed(1), '40.3');
  assert.equal(logged[2].y - logged[5].y, 0.5);
  const sample = categoricalFixture();
  assert.equal(sample.cdf[0].toFixed(4), '0.8808');
  assert.deepEqual([sample.localId, sample.originalId], [1, 461]);
  assert.deepEqual([starts[0], starts[2]], [4, 9]);
  const a = adamFork();
  assert.deepEqual(
    [a.prefix, a.restored, a.reset].map((v) => [v.step, v.weight.toFixed(3)]),
    [
      [2, '0.800'],
      [3, '0.814'],
      [1, '0.900'],
    ],
  );
  assert.deepEqual(normComparison().layer, [-1, 1]);
  assert.ok(normComparison().rms.every((x) => x > 0));
  assert.equal(cpuDelta, cpu.maxAbsoluteDifference);
  const permitted = diagnosticRow(false);
  assert.deepEqual(permitted.scores, [0, 0, 0, -Infinity]);
  assert.deepEqual(permitted.normalized, [1 / 3, 1 / 3, 1 / 3, 0]);
  const blocked = diagnosticRow(true);
  assert.deepEqual(blocked.scores, Array(4).fill(-Infinity));
  assert.equal(blocked.sum, 0);
  assert.ok(blocked.normalized.every(Number.isNaN));
  cpuWeights.forEach((row, q) => {
    assert.ok(Math.abs(1 - row.reduce((a, b) => a + b, 0)) < 1e-12);
    row.slice(q + 1).forEach((w) => assert.equal(w, 0));
    cpu.v[0][q].forEach((_, col) => {
      const out = row.reduce((v, w, k) => v + w * cpu.v[0][k][col], 0);
      assert.ok(Math.abs(out - cpu.manual[0][q][col]) < 1e-6);
    });
  });
  const { before, after, source, prefixDeltas, delta } = auditFixture();
  assert.deepEqual(source, [2, 5, 8, 9, 12]);
  assert.deepEqual(before.inputs, source.slice(0, -1));
  assert.deepEqual(after.inputs, [...before.inputs.slice(0, -1), 14]);
  assert.deepEqual(prefixDeltas, [0, 0, 0]);
  assert.equal(delta, 0);
  assert.deepEqual(before.labels, source.slice(1));
  assert.deepEqual(after.labels, before.labels);
  assert.notDeepEqual(before.inputs, before.labels);
  assert.deepEqual(before.rows[2].allowed, [2, 5, 8]);
  return true;
}
export default { title: 'Build a Tiny GPT and Verify Every Training Contract', draw, check };
