import { NEXT, OUTCOME_CANDIDATES, POLICY_LOGITS, POLICY_TOKENS } from './fixtures.mjs';
import {
  WIDTH_THREE,
  WIDTH_TWO,
  beamSearch,
  normalizedWinner,
  policyEase,
  rawWinner,
  retainedPolicy,
  stablePolicy,
} from './arithmetic.mjs';
import { categoricalSampling } from 'vizmatic';
export function widthWorkSnapshot(progress) {
  const step = Math.min(
    3,
    Math.floor(Math.max(0, Math.min(0.999999, (progress - 0.08) / 0.72)) * 4),
  );
  return [WIDTH_TWO, WIDTH_THREE].map((run) => ({
    width: run.width,
    step: step + 1,
    current: run.history[step],
    examined: run.history
      .slice(0, step + 1)
      .reduce((total, row) => total + row.expansions.length, 0),
  }));
}
export function constructionProgress(state, from = 0.02, to = 0.2) {
  if ((state.beat ?? 0) > 0) return 1;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - from) / (to - from)));
}
export function conditionalEdgeExperiment(progress) {
  const p = Math.max(0, Math.min(1, progress)),
    the = 0.5 - 0.3 * p,
    choices = [
      ['the', the],
      ['a', 0.8 - the],
      ['EOS', 0.2],
    ];
  const run = beamSearch(2, 4, {
    ...NEXT,
    opened: choices,
  });
  return {
    choices,
    run,
    frontier: run.history[1].active.map((row) => row.text),
    raw: rawWinner(run),
    normalized: normalizedWinner(run),
  };
}
export function policyCueProgress(sceneId, state, beat = state.beat ?? 0, from = 0.12, to = 0.7) {
  if ((state.beat ?? 0) > beat) return 1;
  if ((state.beat ?? 0) < beat) return 0;
  const cue = state.cues?.[`${sceneId}-build-${beat}`];
  return policyEase(cue ? cue.progress : ((state.beatP ?? 0) - from) / (to - from));
}
export function freshPolicyFrame(state) {
  const probabilities = [0.46, 0.32, 0.14, 0.08],
    filtered = retainedPolicy(probabilities, 'p', 0.75);
  const beat = state.beat ?? 0,
    progress = policyCueProgress('fresh-policy', state);
  const known = beat > 0 && progress === 1;
  const repaired = beat >= 2 && progress === 1;
  const selected = categoricalSampling({
    categories: ['backup', 'rotate', 'remove', 'quota'].map((label, i) => ({
      id: label,
      label,
      mass: repaired ? Number(i === 0) : filtered.probabilities[i],
    })),
    draws: [
      {
        id: 'u65',
        uniform: 0.65,
      },
    ],
    normalization: 'probabilities',
  });
  return {
    probabilities,
    filtered,
    known,
    repaired,
    progress,
    selected: known ? selected.draws[0].categoryId : null,
  };
}
export function greedyPolicyFrame(state) {
  const beat = state.beat ?? 0,
    progress = policyCueProgress('greedy-loop', state);
  const appendedCreate = beat > 0 || progress === 1;
  const appendedPeriod = beat > 0 && progress === 1;
  const logits = appendedCreate ? [4, 1.5, 0.5] : POLICY_LOGITS;
  return {
    progress,
    appendedCreate,
    appendedPeriod,
    prefix: appendedPeriod ? ['create', '.'] : appendedCreate ? ['create'] : [],
    logits,
    labels: appendedCreate ? ['period', 'then', 'after'] : POLICY_TOKENS,
    probabilities: stablePolicy(logits).probabilities,
  };
}
export const within = (value, start, end) => policyEase((value - start) / (end - start));
export function operationProgress(state, cueId, fallback) {
  const cue = state.cues?.[cueId];
  return cue
    ? policyEase(cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : (cue.progress ?? 0))
    : fallback;
}
export function logitConversionFrame(state) {
  const beat = state.beat ?? 0,
    progress = policyCueProgress('logit-shift', state);
  const policy = stablePolicy(),
    maximum = Math.max(...POLICY_LOGITS);
  const subtraction =
    beat === 0
      ? 0
      : beat > 1
        ? 1
        : operationProgress(state, 'logit-shift-subtract', within(progress, 0, 0.24));
  const shifted = POLICY_LOGITS.map((value) => value - maximum * subtraction);
  const exponentialProgress =
    beat === 0
      ? 0
      : beat > 1
        ? 1
        : operationProgress(state, 'logit-shift-exponentiate', within(progress, 0.25, 0.5));
  const weightsVisible = subtraction === 1 ? Math.min(4, Math.floor(exponentialProgress * 4)) : 0;
  const normalizationProgress =
    beat === 0
      ? 0
      : beat > 1
        ? 1
        : operationProgress(state, 'logit-shift-normalize', within(progress, 0.55, 1));
  const probabilitiesVisible =
    weightsVisible === 4 ? Math.min(4, Math.floor(normalizationProgress * 4)) : 0;
  return {
    inputs: [...POLICY_LOGITS],
    maximum,
    subtraction,
    removedOffset: maximum * subtraction,
    shifted,
    weights: policy.weights,
    weightsVisible,
    total: weightsVisible === 4 ? policy.total : null,
    probabilities: policy.probabilities,
    probabilitiesVisible,
  };
}
export function overflowRepairFrame(state) {
  const inputs = [1000, 999, 998],
    progress = policyCueProgress('logit-boundaries', state);
  const shiftedVisible = Math.min(3, Math.floor(progress * 3));
  const exponentialProgress = operationProgress(
    state,
    'logit-boundaries-exponentiate',
    within(progress, 0.6, 1),
  );
  const weightsVisible =
    shiftedVisible === 3 ? Math.min(3, Math.floor(exponentialProgress * 3)) : 0;
  const shifted = inputs.map((value) => value - 1000),
    weights = shifted.map((value) => Math.exp(value));
  return {
    inputs,
    maximum: 1000,
    rawWeights: inputs.map((value) => Math.exp(value)),
    shifted,
    shiftedVisible,
    weights,
    weightsVisible,
    probabilities: stablePolicy(inputs).probabilities,
  };
}
export function bestOfNFrame(state) {
  const progress = (state.beat ?? 0) > 0 ? 1 : policyCueProgress('best-of-n', state);
  const known = Math.min(3, Math.floor(Math.min(1, progress / 0.75) * 3));
  const maximum = OUTCOME_CANDIDATES.reduce((best, candidate) =>
    candidate.score > best.score ? candidate : best,
  );
  return {
    candidates: OUTCOME_CANDIDATES,
    known,
    progress,
    winner: progress === 1 ? maximum.id : null,
  };
}
export function mctsBackupFrame(state) {
  const progress =
    (state.beat ?? 0) > 2
      ? 1
      : (state.beat ?? 0) < 2
        ? 0
        : policyCueProgress('thought-search', state);
  const childUpdated = progress >= 0.4,
    parentUpdated = progress >= 0.85;
  const reward = 0.2,
    parentVisits = parentUpdated ? 11 : 10,
    parentReward = 8 * 0.4 + 2 * 0.6 + (parentUpdated ? reward : 0);
  const nodes = [
    {
      id: 'A',
      visits: 8,
      rewardSum: 8 * 0.4,
    },
    {
      id: 'B',
      visits: childUpdated ? 3 : 2,
      rewardSum: 2 * 0.6 + (childUpdated ? reward : 0),
    },
  ].map((node) => ({
    ...node,
    mean: node.rewardSum / node.visits,
    selectionScore:
      childUpdated && !parentUpdated
        ? null
        : node.rewardSum / node.visits + Math.sqrt(Math.log(parentVisits) / node.visits),
  }));
  return {
    progress,
    reward,
    childUpdated,
    parentUpdated,
    parent: {
      visits: parentVisits,
      rewardSum: parentReward,
      mean: parentReward / parentVisits,
    },
    nodes,
    phase:
      progress === 0
        ? 'selection'
        : !childUpdated
          ? 'reward-to-child'
          : !parentUpdated
            ? 'reward-to-parent'
            : 'backed-up',
  };
}
