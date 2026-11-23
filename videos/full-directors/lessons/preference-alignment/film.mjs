import assert from 'node:assert/strict';
import { base } from './art.mjs';
import { walk, walkState, swap, policy } from './wayfinding.mjs';
import {
  judge,
  judgeState,
  methods,
  roles,
  credit,
  returnExample,
  clipping,
  clipState,
  budget,
  tilt,
  cancel,
} from './rollouts.mjs';
import {
  reference,
  probability,
  loss,
  update,
  tokenScore,
  reduction,
  beta,
  displacement,
  displacementState,
} from './pair-scores.mjs';
import { missing, missingState, fresh, release, releaseState } from './exits.mjs';
import {
  cache,
  truncation,
  keptTokens,
  training,
  pairData,
  shortcut,
  proxy,
  refresh,
  refreshSampler,
} from './records.mjs';
import {
  ipo,
  ipoState,
  twoReplyPolicy,
  kto,
  ktoReference,
  ktoState,
  referenceFree,
  freeState,
  group,
  tokenRatios,
  ai,
} from './objectives.mjs';
import {
  alignmentBudget,
  alignmentClipping,
  alignmentGae,
  alignmentGroup,
  alignmentReduction,
  alignmentTilt,
  alignmentTokenScores,
  dpoExample,
  twoLogitTrace,
} from '../../../films/preference-alignment/model.mjs';
import { alignmentFreshStep } from '../../../films/preference-alignment/construction.mjs';
import { CONTROLLED_CASES, SHORTCUT_PAIRS } from '../../../films/preference-alignment/fixtures.mjs';
import { wordCount } from '../../../films/preference-alignment/arithmetic.mjs';

const painters = [
  walk,
  swap,
  policy,
  judge,
  methods,
  roles,
  credit,
  clipping,
  budget,
  tilt,
  cancel,
  reference,
  probability,
  loss,
  update,
  tokenScore,
  reduction,
  beta,
  displacement,
  missing,
  cache,
  truncation,
  training,
  pairData,
  shortcut,
  proxy,
  (c, k) => release(c, k, false),
  refresh,
  ipo,
  kto,
  referenceFree,
  group,
  tokenRatios,
  ai,
  fresh,
  (c, k) => release(c, k, true),
];
function draw(c, k) {
  c.save();
  try {
    base(c);
    painters[k.beat.chapterIndex](c, k);
  } finally {
    c.restore();
  }
}
function check() {
  const clock = (beatIndex, progress = 1) => ({
    beat: { beatIndex },
    reveal: () => progress,
    wordCue: () => ({ start: 0, end: 1 }),
  });
  const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, a + ' differs from ' + b);
  assert.equal(walkState(clock(0)).second, 0);
  assert.deepEqual([walkState(clock(2)).loop, walkState(clock(2)).vote], [1, false]);
  assert.equal(walkState(clock(3)).vote, true);
  const j = judgeState(clock(2)),
    swapped = judgeState(clock(3));
  near(j.a, swapped.b);
  near(j.b, swapped.a);
  near(j.loss, 0.287335325, 1e-8);
  near(swapped.loss, 1.387335325, 1e-8);
  for (const [beat, p, answers] of [
    [1, 0.3, [1.2, -1.5]],
    [4, 0.1, [0.5, -0.8]],
  ]) {
    const s = clipState(clock(beat));
    near(s.current, p);
    for (const [i, r] of s.rows.entries()) {
      near(r.ratio, p / 0.2);
      near(r.raw, (p / 0.2) * r.advantage);
      near(r.surrogate, answers[i]);
    }
  }
  const charged = returnExample();
  [0.275, 0.95, 1.7].forEach((v, i) => near(charged.advantages[i], v));
  assert.deepEqual(alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, 0.5).advantages, [0.25, 0.5, 1]);
  assert.deepEqual(
    alignmentBudget().roles.map((r) => r.gb),
    [1120, 1120, 140, 140],
  );
  near(alignmentBudget(70e9, false).total, 1400);
  assert.deepEqual(
    alignmentTilt().probabilities.map((v) => Math.round(v * 100)),
    [75, 25],
  );
  near(dpoExample().margin, 1);
  near(dpoExample().loss, 0.474076984, 1e-8);
  const steps = twoLogitTrace();
  assert.deepEqual(steps[0].gradient, [-0.25, 0.25]);
  assert(steps.at(-1).loss < steps[0].loss);
  const t = alignmentTokenScores();
  assert.deepEqual(t.selected, [false, false, true, true, true, false]);
  near(t.loss, 0.662, 5e-4);
  const boosted = alignmentTokenScores(1);
  const excluded = alignmentTokenScores(1, 1000);
  near(boosted.loss, 0.646, 5e-4);
  assert.deepEqual(excluded.chosenTerms, boosted.chosenTerms);
  near(excluded.chosen, boosted.chosen);
  near(excluded.loss, boosted.loss);
  assert(t.chosenRef < alignmentTokenScores(0, 0, false).chosenRef);
  near(alignmentReduction().margin, 0.1);
  near(alignmentReduction(1).margin, -0.05);
  for (const [q, a, b, m] of [
    [0, 0.3, -0.4, 0.7],
    [0.5, -0.15, -1.25, 1.1],
    [1, -0.6, -2.1, 1.5],
  ]) {
    const s = displacementState(q);
    near(s.delta[0], a);
    near(s.delta[1], b);
    near(s.margin, m);
  }
  for (let step = 0; step <= 8; step++) {
    const d = missingState(clock(3, step / 8)),
      n = d.probabilities.map((v) => Math.round(v * 100));
    assert.deepEqual(n, [40 - step * 4, 10 - step, 50 + step * 5]);
    near(d.odds, 4);
    near(d.loss, 0.62623, 0.00001);
  }
  const f = alignmentFreshStep(1);
  for (const [i, oldLogit] of f.logits.entries()) {
    near(f.updated[i], oldLogit - 0.4 * f.gradient[i]);
  }
  near(f.gradient[1], 0);
  assert(f.probabilities[1] > 0.1 && f.probabilities[2] > 0.5);
  assert(f.loss < f.beforeLoss);
  near(
    f.probabilities.reduce((a, b) => a + b, 0),
    1,
  );
  assert.deepEqual(keptTokens(['P', 'P', 'cite', 'P7', 'escalate'], 4, 2), ['cite', 'P7']);
  assert.deepEqual(keptTokens(['P', 'P', 'P'], 3, 3), []);
  assert.deepEqual(
    SHORTCUT_PAIRS.map((r) => [wordCount(r.chosen), wordCount(r.other)]),
    [
      [11, 12],
      [3, 10],
      [1, 9],
    ],
  );
  assert(CONTROLLED_CASES.every((r) => wordCount(r.good) === 8 && wordCount(r.bad) === 8));
  assert.deepEqual(
    CONTROLLED_CASES.map((r) => r.preferred),
    [1, 0],
  );
  const measured = releaseState(clock(2), true),
    replay = releaseState(clock(4), true);
  assert.deepEqual(
    [measured.eligible, replay.eligible, measured.growth, replay.growth],
    [false, true, 20, 19],
  );
  near(measured.lower, replay.lower);
  near(measured.upper, replay.upper);
  assert.deepEqual(
    [measured.wins, measured.total, replay.wins, replay.total],
    [222, 400, 222, 400],
  );
  const original = releaseState(clock(3), false);
  assert(!original.winPass && !original.lengthPass);
  near(original.rate, 0.46);
  near(refreshSampler(0).open, 0.9);
  near(refreshSampler(1).open, 0.5);
  const blended = refreshSampler();
  near(blended.currentWeight, 0.5);
  near(blended.referenceWeight, 0.5);
  near(blended.odds, 3);
  near(blended.open, 0.75);
  assert.deepEqual([ipoState(0).loss, ipoState(5).loss, ipoState(10).loss], [25, 0, 25]);
  assert(ipoState(7).slope > 0);
  for (const [m, a, kl, ipoLoss, dpoLoss] of [
    [0, 0.5, 0, 25, 0.693147],
    [5, 0.993307, 0.652968, 0, 0.474077],
    [10, 0.999955, 0.692648, 25, 0.313262],
  ]) {
    const policy = twoReplyPolicy(m);
    near(policy.a, a, 5e-7);
    near(policy.a + policy.b, 1);
    near(Math.log(policy.a / policy.b), m);
    near(policy.kl, kl, 5e-7);
    assert(policy.kl >= 0 && policy.kl < Math.LN2);
    assert.equal(policy.ipoLoss, ipoLoss);
    near(policy.dpoLoss, dpoLoss, 5e-7);
  }
  near(ktoReference().z, 0.2);
  near(ktoReference([-1, 1]).z, 0);
  near(ktoReference([-1, 0.5]).z, 0);
  assert(ktoState(2).bad > ktoState(1).bad && ktoState(2).good < ktoState(1).good);
  near(freeState().ratio, 2.25);
  near(freeState().z, -0.1);
  assert.deepEqual(alignmentGroup([1, 1, 1, 1]).advantages, [0, 0, 0, 0]);
  near(alignmentGroup().mean, 0.625);
  near(alignmentClipping(1.1 ** 2, 1).surrogate, 1.2);
  return true;
}
export default { title: 'Learning from Preferred Answers', draw, check };
