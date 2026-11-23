import { logged, pieces } from './fixtures.mjs';
import {
  adamFork,
  categoricalFixture,
  corpusCounts,
  decoderMiniature,
  localProbe,
  lossStep,
  maskedPredictionFixture,
  samplerWindow,
  tiedOutput,
} from './arithmetic.mjs';
import {
  checkpointSnapshot,
  lossConstruction,
  sampleModel,
  transferSnapshot,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateChapters();
  assert.equal(lossConstruction(0.2).count, 2);
  assert.equal(lossConstruction(0.2).normalized, false);
  assert.equal(lossConstruction(0.7).normalized, true);
  assert.equal(lossConstruction(0.4).lossVisible, false);
  assert.equal(lossConstruction(0.9).lossVisible, true);
  const s = sampleModel('loss', {
      beat: 0,
      beatP: 1,
    }),
    a = sampleModel('loss', {
      beat: 1,
      beatP: 1,
    });
  assert(Math.abs(s.probabilities.reduce((x, y) => x + y, 0) - 1) < 1e-12);
  assert(a.probabilities[1] > s.probabilities[1]);
  assert.deepEqual(s.mask[2], [1, 1, 1, 0]);
  assert.equal(
    sampleModel('mask', {
      beat: 1,
      beatP: 1,
    }).prefixDelta,
    0,
  );
  assert.equal(17485 * 96, 1678560);
  assert.equal(pieces.slice(1)[0], 'sing');
  assert.equal(logged.at(-1).y, 5.55);
  const original = maskedPredictionFixture(4);
  for (const future of [4, 4.5, 5, 6, 7]) {
    const changed = maskedPredictionFixture(future);
    for (let query = 0; query < 3; query++) {
      assert.deepEqual(changed.rows[query].logits, original.rows[query].logits);
      assert.deepEqual(changed.rows[query].probabilities, original.rows[query].probabilities);
    }
    if (future !== 4)
      assert.notDeepEqual(changed.rows[3].probabilities, original.rows[3].probabilities);
    for (const row of changed.rows) {
      assert(Math.abs(row.probabilities.reduce((sum, v) => sum + v, 0) - 1) < 1e-12);
      for (let key = row.query + 1; key < 4; key++) assert.equal(row.weights[key], 0);
    }
  }
  const miniature = decoderMiniature();
  assert.deepEqual(miniature.input, [2, 3]);
  assert.deepEqual(miniature.hidden, [1, 2]);
  assert.deepEqual(miniature.logits, [0, 1, 2, -1]);
  assert.equal(miniature.tokens[miniature.positionIndex + 1], miniature.target);
  for (const causal of [true, false]) {
    const source = decoderMiniature({ causal });
    const copy = decoderMiniature({ causal, fourth: '·sir' });
    assert.equal(source.rows[2].logits[1], causal ? 1 : 2);
    assert.equal(copy.rows[2].logits[1], causal ? 1 : 1.5);
    const prefix = (head) => head.rows.slice(0, 3).map((row) => row.logits);
    if (causal) assert.deepEqual(prefix(source), prefix(copy));
    else assert.notDeepEqual(prefix(source), prefix(copy));
  }
  const before = lossStep(),
    after = lossStep(1);
  assert.equal(before.loss.toFixed(3), '1.440');
  assert(after.loss < before.loss);
  assert(after.probabilities[after.targetIndex] > before.probabilities[before.targetIndex]);
  const at = (seconds) =>
    checkpointSnapshot({
      beat: 0,
      t: 0.4 + seconds,
    });
  assert.equal(at(3.34).textCheckpoint, null);
  assert.equal(at(3.35).textCheckpoint.x, 81);
  assert.equal(at(10.69).curveEndpoint.x, 81);
  assert.equal(at(11).curveEndpoint.x, 161);
  assert.equal(at(12).curveEndpoint.x, 241);
  assert.equal(at(13.276).curveEndpoint.x, 321);
  assert.equal(at(19).textCheckpoint.x, 81);
  for (const beat of [0, 1])
    for (let i = 0; i <= 600; i++) {
      const current = sampleModel('checkpoints', {
        beat,
        beatP: i / 600,
      });
      assert.deepEqual(current.curveEndpoint, current.logged.at(-1));
      if (current.textCheckpoint) {
        assert(
          current.logged.some(
            (row) => row.x === current.textCheckpoint.x && row.y === current.textCheckpoint.y,
          ),
        );
        assert.equal(current.textCheckpoint.x, beat ? 321 : 81);
      }
      if (beat === 1) {
        assert.equal(current.curveEndpoint.x, 321);
        assert.equal(current.curveEndpoint.y, 5.55);
        assert.deepEqual(current.textCheckpoint, current.curveEndpoint);
      }
    }
  return true;
}
export function validateChapters() {
  const counts = corpusCounts();
  assert.equal(counts.scored, 184896);
  assert.equal(counts.validationScored, 4608);
  assert.equal(counts.validation, 125526);
  const head = tiedOutput(),
    cut = tiedOutput(0);
  assert.equal(head.fullWeights, 4824672);
  assert.equal(head.compactWeights, 1678560);
  assert.equal(head.fullTotal, 5053152);
  assert(Math.abs(head.gradientUnused[0] - 0.4223187982515182) < 1e-12);
  assert(cut.probabilities[1] > head.probabilities[1]);
  assert(cut.loss < head.loss);
  const edge = samplerWindow(49, 48);
  assert.equal(edge.lastStart, 0);
  assert.equal(edge.input.at(-1), 47);
  assert.equal(edge.target.at(-1), 48);
  assert.throws(() => samplerWindow(48, 48));
  const choice = categoricalFixture();
  assert.equal(choice.localId, 1);
  assert.equal(choice.originalId, 461);
  assert.equal(new TextDecoder().decode(Uint8Array.from(choice.bytes)), 'ak');
  const fork = adamFork();
  assert(Math.abs(fork.restored.weight - 0.8142857142857143) < 1e-12);
  assert(Math.abs(fork.reset.weight - 0.9) < 1e-12);
  const before = localProbe(),
    after = localProbe(14);
  for (let i = 0; i < 3; i++) assert.deepEqual(before.rows[i], after.rows[i]);
  assert.notDeepEqual(before.rows[3].logits, after.rows[3].logits);
  const hidden = transferSnapshot({
    beat: 0,
    beatP: 1,
  });
  assert(!hidden.targetRevealed);
  assert(!hidden.prefixRevealed);
  assert(!hidden.invarianceRevealed);
  return true;
}
