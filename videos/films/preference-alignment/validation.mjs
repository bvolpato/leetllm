import { wordCount } from './arithmetic.mjs';
import { CONTROLLED_CASES, EXAMPLE, SHORTCUT_PAIRS } from './fixtures.mjs';
import {
  alignmentBudget,
  alignmentClipping,
  alignmentGae,
  alignmentGroup,
  alignmentReduction,
  alignmentRelease,
  alignmentTilt,
  alignmentTokenScores,
  dpoExample,
  twoLogitTrace,
} from './model.mjs';
import {
  alignmentFreshStep,
  comparisonLoss,
  evaluationState,
  introState,
  methodState,
  pairLayout,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModelWithPainter(draw) {
  validateAlignmentExtension();
  assert(SHORTCUT_PAIRS.every((row) => wordCount(row.chosen) < wordCount(row.other)));
  assert(CONTROLLED_CASES.every((row) => wordCount(row.good) === 8 && wordCount(row.bad) === 8));
  assert.equal(evaluationState(2, 1).shortcutCorrect, 1);
  assert.equal(evaluationState(2, 1).updatedCorrect, 2);
  assert.equal(introState(0, 0).replies, 0);
  assert.equal(introState(2, 1).clear, 1);
  assert.equal(methodState(1, 1).ppoUpdate, true);
  const d = dpoExample();
  assert(Math.abs(d.chosenRatio - 0.6) < 1e-12);
  assert(Math.abs(d.rejectedRatio + 0.4) < 1e-12);
  assert(Math.abs(d.margin - 1) < 1e-12);
  assert(Math.abs(d.probability - 0.6224593312018546) < 1e-12);
  assert(Math.abs(d.loss - 0.4740769841801067) < 1e-12);
  assert(Math.abs(-Math.log(0.5) - Math.log(2)) < 1e-15);
  const trace = twoLogitTrace();
  assert.equal(trace.length, 7);
  assert.equal(EXAMPLE.beta, 0.5);
  assert(Math.abs(trace[0].margin) < 1e-12);
  assert(Math.abs(trace[0].gradient[0] + 0.25) < 1e-12);
  assert(Math.abs(trace[0].gradient[1] - 0.25) < 1e-12);
  assert(Math.abs(trace[1].logits[0] - 0.1) < 1e-12);
  assert(Math.abs(trace[1].logits[1] + 0.1) < 1e-12);
  assert(Math.abs(trace[1].margin - 0.2) < 1e-12);
  assert(Math.abs(trace[1].gradient[0]) < Math.abs(trace[0].gradient[0]));
  assert(
    Math.abs(trace[3].preferenceProbability - trace[3].probabilities[0]) > 0.05,
    'DPO pair preference and policy continuation probabilities are distinct quantities',
  );
  for (const [index, state] of trace.entries()) {
    assert(Math.abs(state.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    if (index > 0) {
      assert(state.logits[0] > trace[index - 1].logits[0]);
      assert(state.logits[1] < trace[index - 1].logits[1]);
      assert(state.gradient[0] > trace[index - 1].gradient[0]);
    }
  }
  assert.equal(dpoExample().margin, 1);
  const beforeSwap = pairLayout(0),
    crossing = pairLayout(0.5),
    afterSwap = pairLayout(1);
  assert(beforeSwap.preferredX < beforeSwap.detourX);
  assert.equal(crossing.preferredX, crossing.detourX);
  assert(crossing.preferredY < crossing.detourY);
  assert(afterSwap.preferredX > afterSwap.detourX);
  for (const layout of [beforeSwap, crossing, afterSwap])
    assert.equal(layout.voteId, layout.preferredId);
  const smooth = (value) => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  };
  for (const time of [201.33333333333334, 206.03333333333333]) {
    const beatP = (time - 182.3 - 17.534) / (29.964 - 17.534);
    const progress = smooth((beatP - 0.05) / (0.93 - 0.05));
    const current = comparisonLoss(progress);
    let displayed;
    draw(
      {},
      {
        id: 'loss',
      },
      {
        beat: 1,
        beatP,
      },
      {
        C: {},
        focus: {
          target: (_id, fn) => fn(),
          reveal: (_id, fn) => fn(),
          progress: (_id, p) => p,
        },
        components: {},
        teaching: {
          bars: (options) => {
            displayed = options;
          },
        },
        text() {},
        math() {},
        clamp: (value) => Math.max(0, Math.min(1, value)),
        phase: (value, from, until) => smooth((value - from) / (until - from)),
      },
    );
    assert.deepEqual(displayed.values, [current.probability, 1 - current.probability]);
    assert.equal(displayed.max, 1);
    assert.equal(
      displayed.progress,
      1,
      'Current probability must be drawn at its full measured height',
    );
    assert(Math.abs(displayed.values.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
    assert.equal(current.loss, -Math.log(displayed.values[0]));
    assert(displayed.height * displayed.values[0] > 140);
  }
  return true;
}
export function validateAlignmentExtension() {
  assert.deepEqual(alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, 0.5).advantages, [0.25, 0.5, 1]);
  assert.equal(alignmentClipping(0.5, -1).surrogate, -0.8);
  assert.equal(alignmentBudget().total, 2520);
  assert.equal(alignmentBudget(70e9, false).total, 1400);
  assert(alignmentReduction().margin > 0);
  assert(alignmentReduction(1).margin < 0);
  assert(alignmentTilt().probabilities.every((v, i) => Math.abs(v - [0.75, 0.25][i]) < 1e-12));
  assert.equal(alignmentRelease(222, 400, 20).eligible, false);
  assert.equal(alignmentRelease(222, 400, 19).eligible, true);
  const token = alignmentTokenScores();
  assert(Math.abs(token.chosen + 0.9929937503541225) < 1e-6);
  assert(alignmentTokenScores(1).loss < token.loss);
  assert.equal(alignmentTokenScores(0, 1000).loss, token.loss);
  const fresh = alignmentFreshStep();
  assert(Math.abs(fresh.probabilities[0] - 0.3473781098499247) < 1e-12);
  assert.equal(fresh.logits[1], fresh.updated[1]);
  assert(fresh.probabilities[1] !== fresh.start[1]);
  assert.deepEqual(alignmentGroup([1, 1, 1]).advantages, [0, 0, 0]);
  return true;
}
