import { answerChecks, corpusLoss, freshReport, shiftedTargetCount } from './arithmetic.mjs';
import {
  ANSWERS,
  ANSWER_CONTRACT,
  FRESH_ANSWERS,
  FRESH_CONTRACT,
  nll,
  ppl,
  freshPieces,
  scoredRuns,
  stable,
  text,
  total,
  windows,
} from './fixtures.mjs';
import { aggregationSnapshot, logSpaceSnapshot, meanSnapshot, surpriseSnapshot } from './model.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export function validateModel() {
  validateExtendedModel();
  assert.ok(Math.abs(ppl - 2.924017738) < 1e-8);
  assert.ok(Math.abs(Math.exp(1.7) - 5.473947392) < 1e-8);
  assert.equal(Buffer.byteLength(freshPieces.join(''), 'utf8'), freshReport().bytes);
  assert.equal(freshReport().sum.toFixed(3), '4.605');
  assert.equal(Buffer.byteLength(text, 'utf8'), 14);
  for (const run of scoredRuns) assert.equal(run.pieces.join(''), text);
  assert.deepEqual(
    scoredRuns.map((run) => run.pieces.length),
    [4, 14],
  );
  assert.deepEqual(
    scoredRuns.map((run) => Math.exp(run.nats / run.pieces.length).toFixed(2)),
    ['8.17', '1.90'],
  );
  assert.deepEqual(
    scoredRuns.map((run) => (run.nats / (Buffer.byteLength(text) * Math.LN2)).toFixed(3)),
    ['0.866', '0.927'],
  );
  assert.equal(
    windows.reduce((a, v) => a + v[3] - v[2], 0),
    9,
  );
  assert.deepEqual(
    windows.flatMap((v) =>
      Array.from(
        {
          length: v[3] - v[2],
        },
        (_, i) => v[2] + i,
      ),
    ),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  assert.ok(Math.abs(stable[0] - stableSoftmax([0, -2, -3])[0]) < 1e-12);
  assert.ok(Math.exp(8.4 / 4) > Math.exp(9 / 14));
  assert.ok(8.4 / (14 * Math.LN2) < 9 / (14 * Math.LN2));
  assert.equal(logSpaceSnapshot(0.99).product, 0);
  assert(Number.isFinite(logSpaceSnapshot(0.99).sum));
  assert.ok(Math.abs(logSpaceSnapshot(0.99).mean + Math.log(stable[0])) < 1e-12);
  assert.equal(aggregationSnapshot(0, 11.24 / 17.904).mean, null);
  assert.deepEqual(
    [aggregationSnapshot(0, 13.85 / 17.904).count, aggregationSnapshot(0, 13.85 / 17.904).sum],
    [5, 7],
  );
  assert.equal(aggregationSnapshot(0, 16.5 / 17.904).count, 10);
  assert.deepEqual([aggregationSnapshot(1, 0).count, aggregationSnapshot(1, 0).sum], [10, 17]);
  assert.equal(aggregationSnapshot(1, 0.99).mean, 1.7);
  assert.equal(surpriseSnapshot(0, 0.99).probability, 0.8);
  assert.equal(surpriseSnapshot(1, 0.09 / 17.738).probability, 0.8);
  assert.ok(Math.abs(surpriseSnapshot(1, 3.275 / 17.738).probability - 0.1) < 1e-12);
  assert.ok(Math.abs(surpriseSnapshot(1, 6.35 / 17.738).probability - 0.02) < 1e-12);
  assert.equal(surpriseSnapshot(2, 0).probability, 0.02);
  assert.equal(surpriseSnapshot(1, 0.12).bitsOpacity, 0);
  assert.equal(surpriseSnapshot(1, 0.99).bitsOpacity, 1);
  assert.ok(Math.abs(surpriseSnapshot(2, 0.5).bits - -Math.log2(0.02)) < 1e-12);
  for (let beat = 0; beat < 3; beat++)
    for (let index = 0; index <= 100; index++) {
      const snapshot = meanSnapshot(beat, index / 100);
      assert.equal(
        snapshot.sum,
        nll.slice(0, snapshot.count).reduce((sum, loss) => sum + loss, 0),
      );
      if (snapshot.mean !== null)
        assert.ok(Math.abs(Math.log(snapshot.perplexity) - snapshot.sum / 3) < 1e-12);
      if (beat > 0) assert.deepEqual([snapshot.count, snapshot.mean], [3, total / 3]);
    }
  assert.equal(meanSnapshot(0, 0.2).count, 0);
  assert.equal(meanSnapshot(0, 0.9).exponentiated, false);
  assert.equal(meanSnapshot(1, 0.3).exponentiated, true);
  for (let i = 0; i <= 100; i++) {
    const probe = surpriseSnapshot(1, i / 100);
    assert.ok(probe.probability >= 0.02 - 1e-12 && probe.probability <= 0.8);
    assert.ok(Math.abs(Math.exp(-probe.surprise) - probe.probability) < 1e-12);
    for (let beat = 0; beat < 3; beat++) {
      const current = aggregationSnapshot(beat, i / 100);
      assert.equal(
        current.sum,
        current.all.slice(0, current.count).reduce((sum, loss) => sum + loss, 0),
      );
      if (current.count)
        assert.ok(Math.abs(Math.log(current.perplexity) - current.sum / current.count) < 1e-12);
      if (beat > 0) assert.deepEqual([current.count, current.sum, current.mean], [10, 17, 1.7]);
    }
  }
  return true;
}
export function validateExtendedModel() {
  assert.equal(
    shiftedTargetCount([
      [-100, 1, 2],
      [-100, -100, 3],
    ]),
    3,
  );
  assert.equal(
    shiftedTargetCount([
      [-100, -100, 1, 2],
      [-100, 3, 4, -100],
    ]),
    4,
  );
  assert(
    Math.abs(
      corpusLoss([
        {
          loss: 0.2,
          count: 2,
        },
        {
          loss: 2,
          count: 1,
        },
      ]).mean - 0.8,
    ) < 1e-12,
  );
  assert.deepEqual(
    ANSWERS.map((r) => answerChecks(r, ANSWER_CONTRACT)),
    [
      [true, false, false],
      [true, true, true],
    ],
  );
  assert.deepEqual(
    FRESH_ANSWERS.map((r) => answerChecks(r, FRESH_CONTRACT)),
    [
      [true, false, false],
      [true, true, true],
    ],
  );
  assert(Math.abs(freshReport().ppl - Math.sqrt(10)) < 1e-12);
  assert(Math.abs(freshReport().bpb - 0.41524101186092033) < 1e-12);
  assert.equal(Buffer.byteLength('Ａ  a'), 6);
  assert.equal(Buffer.byteLength('a a'), 3);
  assert(Math.abs(-Math.log(0.2) + Math.log(0.8) - Math.log(4)) < 1e-12);
}
