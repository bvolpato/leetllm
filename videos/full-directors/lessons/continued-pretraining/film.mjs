import assert from 'node:assert/strict';
import {
  adaptationSnapshot,
  checkpointTokenize,
  dependencyModel,
  centroidCoordinates,
  vocabularyMass,
  groupedSplit,
  manifestAdmission,
  normalizedFingerprint,
  packedCorpus,
  exactLearningRate,
  mixtureReduction,
  chooseCheckpoint,
} from '../../../films/continued-pretraining/model.mjs';
import {
  CHECKPOINTS,
  FRESH_CHECKPOINTS,
  DOMAIN_DOCUMENTS,
  CENTROID_INPUTS,
  WINDOW_ORDER,
} from '../../../films/continued-pretraining/fixtures.mjs';
import { notes, incident, diagnose, diagnosisState, teacherForcing } from './field.mjs';
import {
  gradient, shift, targets, fertility, split, tables, extensionEncoding, newInputRow, hindiStudy, mass, equalMass,
} from './tokens.mjs';
import {
  clean,
  screening,
  grouping,
  families,
  admit,
  manifest,
  overlap,
  heldout,
  candidate,
  pack,
  packingState,
  packingTokens,
  canAttend,
} from './corpus.mjs';
import {
  firstStep,
  optimizer,
  schedule,
  exact,
  scope,
  mixture,
  budgets,
  budget,
  targetMix,
} from './training.mjs';
import {
  evaluation,
  bytes,
  reports,
  pooled,
  documents,
  corpusPpl,
  abilities,
  selection,
  frontier,
  validateRows,
} from './evaluation.mjs';
import { adapterPath, parameters, practice, weighting, sampleReplies } from './practice.mjs';

const stages = [
  notes,
  incident,
  diagnose,
  gradient,
  shift,
  fertility,
  tables,
  mass,
  clean,
  grouping,
  admit,
  overlap,
  pack,
  teacherForcing,
  optimizer,
  schedule,
  exact,
  scope,
  mixture,
  budget,
  targetMix,
  evaluation,
  bytes,
  corpusPpl,
  abilities,
  selection,
  frontier,
  parameters,
  practice,
];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} differs from ${b}`);
function check() {
  for (const [beatIndex, start, answer, expected] of [
    [0, null, 'Retrieve the current note', 'Retrieve the current note'],
    [0, 'Now look at the held-out logs', 'Try continued pretraining', 'Continue next-token training'],
    [1, 'Here the incident reply', 'Test supervised fine-tuning', 'Use supervised tuning'],
    [1, 'Now compare two valid replies', 'Test preference training', 'Use preference training'],
  ]) {
    const spoken = new Set([start]);
    if (beatIndex === 1) spoken.add('Here the incident reply');
    const clock = { beat: { beatIndex }, reveal: phrase => Number(spoken.has(phrase)) };
    assert.equal(diagnosisState(clock).item.method, expected);
    assert.equal(diagnosisState(clock).answered, 0);
    spoken.add(answer);
    assert.equal(diagnosisState(clock).answered, 1);
  }
  near(equalMass(4, 3).increase, Math.log(4 / 3));
  validateRows([...CHECKPOINTS, ...FRESH_CHECKPOINTS]);
  for (const patch of [{ general: 0.8 }, { domain: Infinity }, { task: 101 }])
    assert.throws(() => validateRows([{ ...CHECKPOINTS[0], ...patch }]), RangeError);
  assert.deepEqual(adapterPath(0), { base: 6, adapter: 0, sum: 6 });
  assert.deepEqual(adapterPath(0.5), { base: 6, adapter: 1, sum: 7 });
  assert.deepEqual(
    DOMAIN_DOCUMENTS.filter((d) => screening(d, true) === 'retain').map((d) => d.id),
    ['D1'],
  );
  const before = adaptationSnapshot(0),
    after = adaptationSnapshot(1);
  assert.deepEqual(before.probabilities, [0.5, 0.5]);
  near(after.probabilities[0], 0.5621765);
  near(after.domainLoss, 0.5759394);
  near(after.broadLoss, 0.8259394);
  const d = dependencyModel();
  near(d.loss, 1.8619948);
  assert.deepEqual(d.inputGradients[0], d.inputGradients[1]);
  assert.notEqual(d.inputGradients[0][0], 0);
  assert.deepEqual(d.inputGradients[2], [0, 0]);
  assert.deepEqual(
    [targets(false), targets(true)].map((v) => v.filter(Boolean).length),
    [6, 4],
  );
  assert.deepEqual(split('AUTH_TIMEOUT'), ['AUTH', '_', 'T', 'I', 'M', 'E', 'O', 'U', 'T']);
  assert.deepEqual(split('timeout'), ['timeout']);
  assert.deepEqual(extensionEncoding(), [
    { piece: 'auth', id: 0 }, { piece: 'time', id: 1 }, { piece: 'out', id: 2 },
  ]);
  assert.deepEqual(extensionEncoding(true), [{ piece: 'authtimeout', id: 5 }]);
  const center = centroidCoordinates();
  assert.deepEqual(newInputRow, center);
  const { lengthWeighted, selected, meanAll } = hindiStudy;
  assert.ok(lengthWeighted.initialLoss < selected.initialLoss);
  assert.ok(selected.lossAt50 < lengthWeighted.lossAt50);
  near(selected.accuracyAt500 - meanAll.accuracyAt500, 25.01);
  assert.equal(center.length, 8);
  center.forEach((v, i) => near(v, CENTROID_INPUTS.reduce((s, row) => s + row[i], 0) / 3));
  assert.deepEqual(vocabularyMass(false).masses, [1, 1]);
  assert.deepEqual(vocabularyMass(true).probabilities, [1 / 3, 1 / 3, 1 / 3]);
  near(vocabularyMass(true).loss - vocabularyMass(false).loss, Math.log(3 / 2));
  assert.deepEqual(
    families.map(([id]) => groupedSplit(id).bucket),
    [1, 0, 2, 0],
  );
  assert.deepEqual(
    manifest.filter((r) => manifestAdmission(r).pass).map((r) => r.tokens),
    [800000],
  );
  for (const patch of [
    { tokens: true },
    { tokens: -1 },
    { scrubbed: 'true' },
    { evalOnly: true },
    { rights: false },
  ])
    assert.equal(manifestAdmission({ ...manifest[0], ...patch }).pass, false);
  assert.equal(normalizedFingerprint(heldout), normalizedFingerprint(candidate));
  assert.notEqual(normalizedFingerprint('retry'), normalizedFingerprint(heldout));
  const { blocks, remainder } = packedCorpus();
  assert.deepEqual(packingTokens.map(v => v.token), [...blocks.flat(), ...remainder].map(v => v.token));
  assert.deepEqual(packingTokens.map(v => v.owner),
    ['P1','P1','P1','P1','P2','P2','P2','P3','P3','P3','P3','P3','P4','P4']);
  assert.deepEqual([0,1,2,3,4,5].filter(key => canAttend(4, key, false)), [0,1,2,3,4]);
  assert.deepEqual([0,1,2,3,4,5].filter(key => canAttend(4, key, true)), [4]);
  assert.deepEqual(
    blocks.map((row) => row.map((v) => v.token)),
    [
      [11, 12, 13, 0, 21, 22],
      [0, 31, 32, 33, 34, 0],
    ],
  );
  assert.deepEqual(
    remainder.map((v) => v.token),
    [41, 0],
  );
  const tailAt = (t) => packingState({ beat: { beatIndex: 2 }, reveal: () => t }).slice(12);
  for (const t of [0, 0.5, 1]) {
    const [token, end] = tailAt(t);
    assert.equal(token.q, end.q);
    near(token.y, end.y);
    assert.ok(end.x > token.x);
  }
  assert.deepEqual(checkpointTokenize(DOMAIN_DOCUMENTS[0].text).slice(5), [' re', 'ef', '.']);
  const v = firstStep();
  near(v.m, -0.05);
  near(v.v, 0.00025);
  near(v.mhat, -0.5);
  near(v.vhat, 0.25);
  near(v.adam, 1);
  near(v.sgd, 0.5);
  assert.deepEqual(
    [0, 9, 49, 50, 999].map((i) => Number((1e6 * exactLearningRate(i)).toFixed(2))),
    [3.54, 8.4, 30, 30, 3],
  );
  assert.deepEqual(budgets(0.25), { domain: 1500000, replay: 500000 });
  assert.deepEqual(budgets(0.05), { domain: 1900000, replay: 100000 });
  assert.equal(new Set(WINDOW_ORDER).size, 20);
  const weights = mixtureReduction();
  assert.equal(weights.nr, 10);
  assert.equal(weights.nd, 90);
  near(weights.targetShare, 0.1);
  near(weights.pooledGradient, -0.4);
  near(weights.sourceGradient, -0.25);
  assert.ok(reports[0].ppl > reports[1].ppl);
  assert.ok(reports[0].bitsPerByte < reports[1].bitsPerByte);
  near(pooled(documents), Math.exp(220 / 60));
  assert.equal(chooseCheckpoint(CHECKPOINTS, 19.2, 1.5).label, 'CPT 4k');
  assert.ok(CHECKPOINTS[3].general > 20.7);
  assert.equal(
    chooseCheckpoint([{ label: 'on line', general: 20.7, domain: 20, task: 60 }], 19.2, 1.5).label,
    'on line',
  );
  assert.equal(chooseCheckpoint(FRESH_CHECKPOINTS, 18, 1).label, 'C');
  const w = (start, repair) =>
    weighting({
      beat: { beatIndex: 2 },
      reveal: (phrase) => (phrase.startsWith('Restore') ? repair : start),
    });
  for (const [state, share, gradient] of [
    [w(0, 0), 1 / 7, -5 / 14],
    [w(1, 0), 1 / 3, -1 / 6],
    [w(1, 1), 1 / 7, -5 / 14],
  ]) {
    near(state.share, share);
    near(state.gradient, gradient);
    near(12 * state.domainWeight + 2 * state.replayWeight, 1);
    near(2 * state.replayWeight, share);
  }
  assert.deepEqual(
    sampleReplies.map((r) => Number(r.jitter) + Number(r.sameToken)),
    [1, 2],
  );
}
export default {
  title: 'Teaching a Model a New Domain',
  check,
  draw(g, k) {
    stages[k.beat.chapterIndex](g, k);
  },
};
