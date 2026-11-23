import {
  attendedMean,
  eosLabels,
  freshContract,
  lossTerms,
  makeAttentionMasks,
  typedGate,
} from './arithmetic.mjs';
import { ASSISTANT_TARGETS, CHECKPOINT, COLLATED, TOKENS, TOKEN_IDS, packed } from './fixtures.mjs';
import { attentionFrame, packingActors } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(TOKENS.length, 17);
  assert.equal(COLLATED[5].label, TOKEN_IDS[6]);
  assert.equal(COLLATED[9].label, -100);
  assert.equal(TOKEN_IDS[2], TOKEN_IDS[7]);
  assert.equal(TOKEN_IDS[7], TOKEN_IDS[14]);
  assert.deepEqual(
    [2, 7, 14].map((i) => ASSISTANT_TARGETS[i]),
    [false, true, true],
  );
  assert.deepEqual(
    COLLATED.flatMap((row) => (row.label < 0 ? [] : [row.position])),
    [5, 6, 7, 8, 12, 13, 14, 15],
  );
  assert.equal(CHECKPOINT.prefixIds.length, 44);
  assert.equal(CHECKPOINT.answerIds.length, 9);
  assert.equal(CHECKPOINT.answerIds.at(-1), 2);
  assert.deepEqual(packed.bins, [15, 12]);
  for (let k = 0; k <= 1000; k++) {
    const actors = packingActors(k / 1000);
    assert.equal(actors.length, 27);
    assert.equal(new Set(actors.map((o) => o.id)).size, 27);
    for (const o of actors) assert(o.column < 16);
  }
  const { causal, isolated } = makeAttentionMasks();
  assert.equal(attendedMean(causal, 4, [1, 2, 3, 10, 20, 30]), 7.2);
  assert.equal(attendedMean(isolated, 4, [1001, 1002, 1003, 10, 20, 30]), 15);
  assert.equal(
    attentionFrame({
      beat: 0,
      beatP: 1,
    }).ordinary,
    attentionFrame({
      beat: 1,
      beatP: 0,
    }).ordinary,
  );
  assert.equal(
    eosLabels({
      idOnly: true,
    }).labels[4],
    -100,
  );
  assert.equal(eosLabels().labels[4], 5);
  assert.deepEqual(eosLabels().predictorLabels, [2, 3, 4, 5, -100, -100]);
  assert(Math.abs(lossTerms().mean - 0.7675283643313485) < 1e-12);
  assert.deepEqual(freshContract(true).labels, [-100, -100, 19, 23, -100]);
  assert.deepEqual(freshContract(true, true).labels, [-100, -100, 19, 31, 23, -100]);
  assert.equal(970 + 96 - 1024, 42);
  assert.equal(970 - 45 + 96, 1021);
  assert.equal(
    typedGate({
      parity: true,
      rate: 0.99,
      critical: 0,
      latency: 620,
    }).pass,
    true,
  );
  for (const rate of [true, NaN, '0.99'])
    assert.equal(
      typedGate({
        parity: true,
        rate,
        critical: 0,
        latency: 620,
      }).pass,
      false,
    );
  return true;
}
