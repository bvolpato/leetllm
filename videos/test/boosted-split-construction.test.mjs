import test from 'node:test';
import assert from 'node:assert/strict';
import {
  splitConstruction,
  freshSplitState,
  sliceResult,
  twoFeatureCredits,
} from '../animations/boosted-trees.mjs';
const close = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} differs from ${b}`);

test('a split pays one extra leaf charge and retains its child totals', () => {
  const uncharged = splitConstruction([1, 1, 0, 0], 1, 0);
  const charged = splitConstruction([1, 1, 0, 0], 1, 0.25);
  for (const [i, cut] of charged.cuts.entries()) {
    close(cut.gain, uncharged.cuts[i].gain - 0.25);
    close(cut.GL + cut.GR, charged.G);
    close(cut.HL + cut.HR, charged.H);
    close(cut.leftWeight, uncharged.cuts[i].leftWeight);
    close(cut.rightWeight, uncharged.cuts[i].rightWeight);
  }
  close(uncharged.cuts[0].gain, 6 / 35);
  close(uncharged.cuts[1].gain, 2 / 3);
  assert.equal(charged.best.cut, 2);
});

test('the changed alternating labels fail then split without clearing the action miss', () => {
  const blocked = splitConstruction([1, 0, 1, 0], 1, 0.2);
  assert.equal(blocked.best, null);
  const repaired = splitConstruction([1, 0, 1, 0], 1, 0.1);
  assert.equal(repaired.best.cut, 1);
  close(repaired.best.gain, 1 / 14);
  const out = freshSplitState({ beat: 3, beatP: 1 });
  assert.deepEqual(out.alerts, [true, false, false, false]);
  assert.equal(out.model.rows[2].label, 1);
  assert.equal(out.alerts[2], false);
});

test('fresh-cut, logit, probability and action reveals have separate ownership', () => {
  const ids = ['fresh-gamma', 'fresh-cut', 'fresh-logits', 'fresh-probabilities', 'fresh-actions'];
  const cues = Object.fromEntries(ids.map((id) => [id, { phase: 'before', progress: 0 }]));
  const state = { beat: 2, beatP: 0.9, cues };
  assert.equal(freshSplitState(state).selected, null);
  cues['fresh-gamma'] = { phase: 'after', progress: 1 };
  assert.equal(freshSplitState(state).selected, null);
  cues['fresh-cut'] = { phase: 'after', progress: 1 };
  const selected = freshSplitState(state);
  assert.equal(selected.selected.cut, 1);
  assert.equal(selected.logitsVisible, false);
  assert.equal(selected.probabilitiesVisible, false);
  assert.equal(selected.actionsVisible, false);
  cues['fresh-logits'] = { phase: 'after', progress: 1 };
  assert.equal(freshSplitState(state).logitsVisible, true);
  assert.equal(freshSplitState(state).probabilitiesVisible, false);
  cues['fresh-probabilities'] = { phase: 'during', progress: 0.1 };
  assert.equal(freshSplitState(state).probabilitiesVisible, false);
  assert.equal(freshSplitState(state).actionsVisible, false);
  cues['fresh-probabilities'] = { phase: 'after', progress: 1 };
  assert.equal(freshSplitState(state).probabilitiesVisible, true);
  cues['fresh-actions'] = { phase: 'during', progress: 0.1 };
  assert.equal(freshSplitState(state).actionsVisible, false);
  cues['fresh-actions'] = { phase: 'after', progress: 1 };
  assert.equal(freshSplitState(state).actionsVisible, true);
});

test('slice support and local-credit arithmetic preserve their distinct denominators', () => {
  assert.deepEqual(sliceResult(0, 0, 0.9), {
    positives: 0,
    caught: 0,
    recall: null,
    passed: false,
  });
  assert.equal(sliceResult(9, 9, 0.9).passed, false);
  assert.equal(sliceResult(20, 18, 0.9).passed, true);
  assert.equal(sliceResult(20, 17, 0.9).passed, false);
  assert.deepEqual(twoFeatureCredits([1, 3, 2, 8]), { base: 1, A: 4, B: 3, output: 8 });
});

test('the complete staged fixture retains the first true validation minimum and exact tree additions', async () => {
  const { STAGE_SERIES, APRIL_TREE_TRACE } = await import('../animations/boosted-trees.mjs');
  assert.equal(STAGE_SERIES.length, 160);
  assert.equal(STAGE_SERIES.reduce((a, b) => (a.validation <= b.validation ? a : b)).round, 50);
  assert(STAGE_SERIES.at(-1).train < STAGE_SERIES[49].train);
  assert(STAGE_SERIES.at(-1).validation > STAGE_SERIES[49].validation);
  let raw = APRIL_TREE_TRACE.initialLogit;
  for (const stage of APRIL_TREE_TRACE.stages) {
    raw += stage.delta;
    close(raw, stage.raw);
    close(1 / (1 + Math.exp(-raw)), stage.probability);
  }
  close(1 / (1 + Math.exp(-raw)), APRIL_TREE_TRACE.finalScore);
});

test('May cost components and threshold event deltas remain tied to actual row decisions', async () => {
  const { MAY_EVIDENCE, thresholdSnapshot, evaluateAprilThreshold } =
    await import('../animations/boosted-trees.mjs');
  for (const policy of MAY_EVIDENCE) {
    assert.equal(policy.tp + policy.fp + policy.fn + policy.tn, 140);
    assert.equal(policy.fnStandard + policy.fnPriority, policy.fn);
    assert.equal(policy.cost, policy.fp * 8 + policy.fnStandard * 60 + policy.fnPriority * 150);
  }
  for (const [beat, progress] of [
    [0, 0.2],
    [0, 0.51],
    [0, 0.7],
    [0, 0.99],
    [2, 0.3],
  ]) {
    const current = thresholdSnapshot(beat, progress),
      reference = evaluateAprilThreshold(current.referenceThreshold);
    assert.equal(current.referenceCost + current.costDelta, current.cost);
    assert.deepEqual(
      current.changedIds,
      current.outcomes.filter((r, i) => r.alert !== reference.outcomes[i].alert).map((r) => r.id),
    );
  }
});
