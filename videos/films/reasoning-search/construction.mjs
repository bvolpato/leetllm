import {
  beamWidthAt,
  checkExpression,
  evaluateTree,
  frontierControlFixture,
  unitPhase,
  valueLabel,
} from './arithmetic.mjs';
import {
  ANSWER_ALIASES,
  COMPLETE_B_TREE,
  DEAD_END_TRACE,
  FRESH_FRACTION_TREE,
  FRESH_LEAVES,
  FRESH_WRONG_TREE,
  PRUNING_BRANCHES,
  opTree,
} from './fixtures.mjs';
export function pruningSnapshot(beat, progress) {
  const p = Math.max(0, Math.min(1, progress));
  const checked = beat > 0 ? 1 : unitPhase(p, 0.49, 0.68);
  const trace =
    DEAD_END_TRACE[
      Math.min(DEAD_END_TRACE.length - 1, Math.floor(checked * DEAD_END_TRACE.length))
    ];
  const proofStep =
    beat < 1 ? 0 : beat === 1 ? (p < 0.6 ? 0 : p < 0.88 ? 1 : 2) : p < 0.76 ? 0 : p < 0.88 ? 1 : 2;
  const keepA = unitPhase(p, 0.08, 0.25),
    pruneB = unitPhase(p, 0.27, 0.44),
    restoreB = unitPhase(p, 0.5, 0.65);
  const ease = (amount) => amount * amount * (3 - 2 * amount);
  const move = ease(pruneB),
    restore = ease(restoreB);
  return {
    branchA: PRUNING_BRANCHES.branchA,
    branchB: PRUNING_BRANCHES.branchB,
    scoreA: beat > 0 ? 0.95 : 0.95 * unitPhase(p, 0.08, 0.24),
    scoreB: beat === 0 ? null : beat > 1 ? 0.4 : 0.4 * unitPhase(p, 0.03, 0.23),
    aTrace: trace,
    aExhausted: checked === 1,
    aSearchStarted: beat > 0 || p >= 0.49,
    proofStep,
    bRemaining:
      proofStep === 0 ? PRUNING_BRANCHES.branchB.remaining : proofStep === 1 ? [12, 2] : [24],
    width: beamWidthAt(beat, p),
    aPosition: {
      x: 140 + 910 * ease(keepA),
      y: 390,
    },
    bPosition: {
      x: 140 + 910 * move,
      y: 560 + 230 * move - 240 * restore,
    },
    bPruned: pruneB === 1 && restoreB === 0,
    bRetained: restoreB === 1,
    completionValid: proofStep === 2 && checkExpression(COMPLETE_B_TREE).valid,
  };
}
export function frontierSnapshot(depthFirst, progress) {
  const children = frontierControlFixture().children;
  const pushed = children.slice(0, progress < 0.2 ? 0 : progress < 0.4 ? 1 : 2),
    pending = [...pushed];
  const expanded = progress >= 0.65 ? (depthFirst ? pending.pop() : pending.shift()) : null;
  return {
    pending,
    expanded,
    pushed: pushed.length,
  };
}
export function canonicalAction(text) {
  const normalized = text.toLowerCase().replaceAll('-', ' ').trim().replace(/\s+/g, ' ');
  return Object.hasOwn(ANSWER_ALIASES, normalized) ? ANSWER_ALIASES[normalized] : null;
}
export function canonicalVote(samples, threshold = 0.6) {
  if (
    typeof threshold !== 'number' ||
    !Number.isFinite(threshold) ||
    threshold <= 0.5 ||
    threshold > 1
  )
    throw new TypeError('Minimum share must be finite and in (.5,1]');
  if (!Array.isArray(samples) || samples.some((s) => typeof s !== 'string'))
    throw new TypeError('Samples must be final-action strings');
  const counts = {};
  for (const s of samples) {
    const a = canonicalAction(s);
    if (a) counts[a] = (counts[a] ?? 0) + 1;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]),
    count = ranked[0]?.[1] ?? 0,
    share = samples.length ? count / samples.length : 0,
    tied = ranked.length > 1 && ranked[0][1] === ranked[1][1];
  return {
    counts,
    share,
    total: samples.length,
    rejected: samples.filter((s) => !canonicalAction(s)).length,
    decision: !count || tied || share < threshold ? 'abstain' : ranked[0][0],
  };
}
export function occurrenceExpressionCheck(tree) {
  const leaves = [];
  const walk = (t) => (Object.hasOwn(t, 'leaf') ? leaves.push(t) : [walk(t.left), walk(t.right)]);
  walk(tree);
  const ids = leaves.map((t) => t.occurrence),
    occurrencesValid =
      ids.length === 4 &&
      new Set(ids).size === 4 &&
      leaves.every((t) =>
        FRESH_LEAVES.some((i) => i.occurrence === t.occurrence && i.leaf === t.leaf),
      );
  return {
    ...checkExpression(tree, [3, 3, 8, 8]),
    occurrencesValid,
    valid: occurrencesValid && checkExpression(tree, [3, 3, 8, 8]).valid,
    occurrences: ids,
  };
}
export function freshFractionTrace(step) {
  const a = opTree('÷', FRESH_LEAVES[2], FRESH_LEAVES[0]),
    b = opTree('-', FRESH_LEAVES[1], a),
    states = [
      FRESH_LEAVES,
      [FRESH_LEAVES[1], FRESH_LEAVES[3], a],
      [FRESH_LEAVES[3], b],
      [FRESH_FRACTION_TREE],
    ],
    items = states[Math.max(0, Math.min(3, step))];
  return {
    items: items.map((tree) => ({
      tree,
      ...evaluateTree(tree),
      label: valueLabel(evaluateTree(tree).value),
    })),
    complete: step >= 3,
    check: step >= 3 ? occurrenceExpressionCheck(FRESH_FRACTION_TREE) : null,
    wrong: occurrenceExpressionCheck(FRESH_WRONG_TREE),
  };
}
export function narratedPruningSnapshot(beat, p, cues) {
  const cp = (id) => {
      const c = cues?.[id];
      return c ? (c.phase === 'before' ? 0 : c.phase === 'after' ? 1 : c.progress) : null;
    },
    begun = (id) => cues?.[id] && cues[id].phase !== 'before';
  if (!cues?.['pruning-score-a']) return pruningSnapshot(beat, p);
  if (beat === 0) {
    const frame = pruningSnapshot(beat, p),
      done = cp('pruning-exhaust');
    frame.scoreA = 0.95 * cp('pruning-score-a');
    frame.aSearchStarted = begun('pruning-exhaust');
    frame.aExhausted = done >= 1;
    frame.aTrace =
      DEAD_END_TRACE[Math.min(DEAD_END_TRACE.length - 1, Math.floor(done * DEAD_END_TRACE.length))];
    return frame;
  }
  if (beat === 1) {
    const frame = pruningSnapshot(beat, p);
    frame.scoreB = 0.4 * cp('pruning-score-b');
    frame.proofStep = begun('pruning-b-product') ? 2 : begun('pruning-b-subtract') ? 1 : 0;
    return frame;
  }
  const widening = begun('pruning-widen-b'),
    mapped = widening ? 0.5 + 0.15 * cp('pruning-widen-b') : 0.27 + 0.17 * cp('pruning-drop-b'),
    frame = pruningSnapshot(beat, mapped);
  frame.proofStep = frame.bRetained ? 2 : 0;
  frame.bRemaining = frame.proofStep === 2 ? [24] : frame.branchB.remaining;
  frame.completionValid = frame.proofStep === 2 && checkExpression(COMPLETE_B_TREE).valid;
  return frame;
}
