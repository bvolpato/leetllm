import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import { rect, paper, night } from './drawing.mjs';
import { opening, actor, shared, eventOrder, vector, head, context } from './forward.mjs';
import { backward, chain, matrixBound, detach } from './credit.mjs';
import { lstm, learnedLSTM, direct, gru, resetOrder, geometry } from './gates.mjs';
import { suffix, boundary } from './batch.mjs';
import { ending } from './rolls.mjs';
import {
  m,
  dog,
  cat,
  verb,
  counts,
  inputs,
  scalar,
  states,
  stackedTerms,
  sum,
  norm,
  fullRun,
  cutRun,
  cell,
  hidden,
  learnedCell,
  resetBiasTerms,
  blend,
  retained,
  identityGRU,
  torchBlocks,
  bRows,
  fillers,
  packedIncident,
  allowed,
  rolls,
  rollInputs,
  rollTraces,
  validTrace,
  fillerEnd,
  flagged,
  addresses,
  segments,
  combined,
} from './examples.mjs';

const chapters = [
  opening,
  actor,
  shared,
  eventOrder,
  vector,
  head,
  context,
  backward,
  chain,
  matrixBound,
  detach,
  lstm,
  learnedLSTM,
  direct,
  gru,
  resetOrder,
  geometry,
  suffix,
  boundary,
  ending,
];
function draw(ctx, clock) {
  const i = clock.beat.chapterIndex;
  rect(ctx, 0, 0, 1920, 1080, i >= 7 && i <= 10 ? night : paper);
  chapters[i](ctx, clock);
}
function check() {
  const near = (value, reference, epsilon = 1e-6) =>
    assert.ok(
      Math.abs(value - reference) < epsilon,
      'Expected ' + reference + ', received ' + value,
    );
  assert.deepEqual(counts(dog.words), counts(cat.words));
  near(dog.final, -cat.final);
  assert.ok(dog.final > dog.padded && dog.padded > 0);
  near(verb[3], Math.tanh(0.8));
  assert.ok(verb[5] > 0 && cat.final < 0);
  const chronologicalTerms = stackedTerms([0, 1, 2], 2);
  const reversedTerms = stackedTerms([2, 1, 0], 2);
  near(chronologicalTerms[0], 0.36);
  near(reversedTerms[2], 1);
  near(sum(chronologicalTerms), 1.5);
  near(sum(reversedTerms), 1.564);
  assert.equal(sum(inputs), 2.3);
  near(scalar[3], 0.764316);
  assert.deepEqual(
    states[3].map((x) => Number(x.toFixed(3))),
    m.roundedState,
  );
  near(m.logits[1], 0.368);
  near(sum(m.probabilities), 1);
  assert.equal(Math.max(...m.probabilities), m.probabilities[1]);
  assert.equal(new Set(addresses).size, 16);
  assert.ok(addresses.every((v) => v.length === 4));
  assert.equal(allowed(8), 36);
  for (const start of [-2, 0, 3])
    near(
      combined[0] * start + combined[1],
      segments.reduce((h, [scale, offset]) => scale * h + offset, start),
    );
  near(m.sensitivities[3], 0.019517);
  near(m.weightGradient, 0.331003);
  assert.deepEqual(fullRun.trace, cutRun.trace);
  assert.deepEqual(cutRun.gradients.slice(0, 2), [0, 0]);
  fullRun.gradients.forEach((v, i) => near(v, m.inputGradient[i]));
  near(cutRun.gradients[2], fullRun.gradients[2]);
  near(fullRun.weight, m.weightGradient);
  fullRun.weightTerms.forEach((term, j) => near(term, m.weightTerms[j]));
  assert.deepEqual(cutRun.weightTerms.slice(0, 2), [0, 0]);
  near(cutRun.weightTerms[2], fullRun.weightTerms[2]);
  near(cutRun.weight, 0.238277);
  near(norm(m.clippedGradient), 5);
  assert.ok(norm(m.rawGradient) > 70);
  near(m.rawGradient[0] * m.clippedGradient[1] - m.rawGradient[1] * m.clippedGradient[0], 0);
  near(retained(0.6, 12), 0.002177);
  assert.ok(retained(1.4, 12) > 50);
  assert.ok(norm(m.matrixPowers[1]) > 1 && norm(m.matrixPowers[2]) < norm(m.matrixPowers[1]));
  near(norm(m.matrixPowers[9]), 0.03521, 0.00001);
  assert.equal(Math.fround(1 - Math.fround(0.6 ** 50)), 1);
  near(cell, 0.8399);
  near(hidden, 0.8 * Math.tanh(cell));
  assert.ok(0.1 * Math.tanh(cell) < 0.07);
  learnedCell.hOld.forEach((h, j) => {
    const previousGate = h / Math.tanh(learnedCell.cOld[j]);
    assert.ok(previousGate > 0 && previousGate < 1);
    near(
      learnedCell.nextCell[j],
      learnedCell.f[j] * learnedCell.cOld[j] + learnedCell.i[j] * learnedCell.candidate[j],
    );
    near(learnedCell.nextHidden[j], learnedCell.o[j] * Math.tanh(learnedCell.nextCell[j]));
  });
  near(learnedCell.written[1], 0);
  near(learnedCell.nextCell[0], 0.7493375);
  near(learnedCell.nextHidden[0], 0.50780285);
  near(resetBiasTerms[0], 0.1);
  near(resetBiasTerms[1], 0.5);
  assert.ok(retained(0.98, 30) > 0.5 && retained(0.5, 30) < 1e-9);
  near(blend(0.95), 0.75);
  near(blend(0.5), 0.3);
  near(blend(0.05), -0.15);
  assert.deepEqual(identityGRU.before, identityGRU.after);
  assert.ok(m.gru.beforeHidden[1] < 0 && m.gru.afterHidden[1] > 0);
  assert.equal(sum(torchBlocks(3, 2)), 42);
  assert.equal(sum(torchBlocks(4, 3)), 81);
  assert.deepEqual(packedIncident(bRows, 2), states[2]);
  for (const fill of fillers) {
    assert.deepEqual(packedIncident([...bRows, fill], 2), states[2]);
    assert.notDeepEqual(packedIncident([...bRows, fill], 3), states[2]);
  }
  assert.ok(m.resetNext < m.leakedNext);
  assert.deepEqual(rollInputs, [
    [0.2, 0.8, 0],
    [0.2, 0.8],
  ]);
  assert.deepEqual(rollTraces[0].slice(0, 3), rollTraces[1]);
  near(rollTraces[0][3], 0.29884);
  near(rollTraces[1][2], 0.616491);
  for (const fill of [0, 0.9])
    assert.deepEqual(validTrace([...rollInputs[1], fill], rolls[1].length), rollTraces[1]);
  assert.equal(flagged(fillerEnd(0)), false);
  assert.equal(flagged(fillerEnd(0.9)), true);
  assert.deepEqual(
    rollTraces.map((r) => flagged(r.at(-1))),
    [false, true],
  );
  return true;
}
export default { title: 'How a Sequence Model Carries a Memory', preparePicture: prepareCaptions, draw, check };
