import { rewardHeadFit } from './arithmetic.mjs';
import { FINAL_RULE_FIXTURE, LIKELIHOOD_FIXTURE, TRAINING_PAIRS } from './fixtures.mjs';
import { cueProgress, motion } from './construction.mjs';
export function likelihoodConstruction(state) {
  const beat = state.beat ?? 0;
  const pieceProgress = ['first', 'second', 'third'].map((name, i) =>
    beat > 0
      ? 1
      : cueProgress(
          state,
          `likelihood-${name}-piece`,
          motion(state, 0.12 + i * 0.23, 0.28 + i * 0.23),
        ),
  );
  const resultProgress =
    beat > 0 ? cueProgress(state, 'likelihood-product-result', motion(state, 0.04, 0.2)) : 0;
  const humanProgress =
    beat > 0 ? cueProgress(state, 'likelihood-rule-choice', motion(state, 0.35, 0.5)) : 0;
  return {
    pieceProgress,
    resultProgress,
    humanProgress,
    productReady: resultProgress >= 1,
    humanReady: humanProgress >= 1,
    answers: LIKELIHOOD_FIXTURE.answers.map((answer) => ({
      ...answer,
      product: answer.probabilities.reduce((product, probability) => product * probability, 1),
      prefixProducts: answer.probabilities.map((_, i) =>
        answer.probabilities
          .slice(0, i + 1)
          .reduce((product, probability) => product * probability, 1),
      ),
    })),
  };
}
export function scoreHeadConstruction(state) {
  const beat = state.beat ?? 0,
    candidate = beat >= 3 ? 'B' : 'A',
    vector = candidate === 'A' ? [2, 0.8] : [1, 0.2],
    weights = [0.5, 1];
  const prefix = candidate === 'A' ? 'head-a' : 'head-b';
  const progress = [
    cueProgress(state, prefix + '-first', motion(state, 0.08, 0.3)),
    cueProgress(state, prefix + '-second', motion(state, 0.34, 0.57)),
  ];
  const sum = cueProgress(state, prefix + '-sum', motion(state, 0.64, 0.82));
  const products = vector.map((v, i) => v * weights[i]);
  const resultCue = state.cues?.[prefix + '-result'];
  const resultReady = resultCue ? resultCue.phase !== 'before' : sum >= 1;
  return {
    candidate,
    vector,
    weights,
    products,
    progress,
    sum,
    score: products.reduce((a, b) => a + b, 0),
    scoreVisible: resultReady && progress.every((p) => p >= 1),
  };
}
export function preferenceMargin(state) {
  if ((state.beat ?? 0) !== 2) return 1.1;
  const equal = state.cues?.['equal-score-chance'],
    resume = state.cues?.['restore-score'] ?? state.cues?.['check-human-judgments'];
  if (equal && resume) {
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const enter = state.t >= equal.start ? 1 : clamp((state.t - (equal.start - 0.28)) / 0.28);
    const restore = clamp(
      (state.t - resume.start) / (state.cues['restore-score'] ? resume.end - resume.start : 0.28),
    );
    return 1.1 * (1 - enter + restore);
  }
  return 1.1 * (1 - motion(state, 0.36, 0.46) + motion(state, 0.56, 0.66));
}
export function calibrationConstruction(state) {
  const progress = cueProgress(state, 'calibration-build', motion(state, 0.05, 0.6)),
    average = cueProgress(state, 'calibration-average', motion(state, 0.67, 0.86));
  const votes = [1, 1, 1, 0];
  const count = Math.min(votes.length, Math.floor(progress * (votes.length + 0.999)));
  return {
    votes,
    count,
    average,
    forecasts: [0.75, 0.99].map((q) => {
      const errors = votes.map((y) => (q - y) ** 2);
      return {
        q,
        errors,
        sum: errors.slice(0, count).reduce((a, b) => a + b, 0),
        brier: errors.reduce((a, b) => a + b, 0) / votes.length,
      };
    }),
  };
}
export function proxyOptimizationProgress(state) {
  const cues = state.cues;
  if (!cues?.['optimization-first-phase']) return motion(state, 0.04, 0.86);
  const progress = (id) => {
    const cue = cues[id];
    return !cue || cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
  };
  return (
    0.6 * progress('optimization-first-phase') +
    0.2 * progress('fresh-policy-evaluation-b3-1') +
    0.2 * progress('fresh-policy-evaluation-b3-2')
  );
}
export function headScore(weights, features) {
  return weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
}
export const REWARD_FITS = Object.fromEntries(
  Object.entries(TRAINING_PAIRS).map(([name, pairs]) => [
    name,
    rewardHeadFit(pairs.map(([chosen, rejected]) => chosen.map((v, i) => v - rejected[i]))),
  ]),
);

export function approvalRuleCheck(answer, ticket) {
  const grantNow = answer.grantsAdmin;
  const approved = ticket.status === 'approved';
  return {
    passes: !grantNow || approved,
    reason: grantNow
      ? approved
        ? 'Approved grant'
        : 'Admin granted before approval'
      : 'No grant at this step',
  };
}

// Each reply starts from the same pending ticket. Approval is a supplied event in the replay.
export function replayApproval(answer, approvalArrives = true) {
  return [0, 1, 2].map((step) => {
    const approved = approvalArrives && step >= 1;
    const grantNow =
      (step === 0 && answer.grantsAdmin) ||
      (step === 2 && approved && Boolean(answer.grantAfterApproval));
    const ticket = { ...FINAL_RULE_FIXTURE.ticket, status: approved ? 'approved' : 'pending' };
    return { approved, grantNow, ...approvalRuleCheck({ grantsAdmin: grantNow }, ticket) };
  });
}
export function finalRuleConstruction(state) {
  const beat = state.beat ?? 0;
  const progress = (id, onBeat, from, to) => {
    if (state.cues) return cueProgress(state, id);
    return beat > onBeat ? 1 : beat < onBeat ? 0 : motion(state, from, to);
  };
  const scoreProgress = progress('final-shortcut-score', 2, 0.63, 0.68);
  const checkProgress = progress('final-rule-check', 3, 0.08, 0.32);
  const passProgress = progress('final-pass', 5, 0.48, 0.7);
  const original = replayApproval(FINAL_RULE_FIXTURE.verbose);
  const revision = replayApproval(FINAL_RULE_FIXTURE.revised);
  const fitted = REWARD_FITS.confounded.weights;
  const weights = fitted.map((weight) => weight / fitted[0]);
  const checked = checkProgress >= 1;
  const stopped = checked && !original[0].passes && progress('final-stop', 3, 0.65, 0.83) > 0;
  const revised = stopped && progress('final-revise', 4, 0.04, 0.12) > 0;
  return {
    original,
    revision,
    weights,
    revised,
    stopped,
    checkProgress,
    checking: progress('final-check-start', 3, 0.01, 0.08) > 0 || checkProgress > 0,
    scored: scoreProgress >= 1,
    fittedVisible: progress('final-fitted-weights', 2, 0.35, 0.44) > 0,
    scaled: progress('final-weights', 2, 0.45, 0.51) >= 1,
    reviewScored: progress('final-review-score', 2, 0.53, 0.56) >= 1,
    checked,
    passed: revised && passProgress >= 1 && revision.every((step) => step.passes),
    originalAction: progress('final-action', 2, 0.18, 0.25),
    originalApproval: progress('final-approval', 2, 0.27, 0.35),
    hold: progress('final-replay', 5, 0.02, 0.1),
    approval: progress('final-replay-approval', 5, 0.1, 0.18),
    grant: progress('final-replay-grant', 5, 0.19, 0.35),
    answer: revised ? FINAL_RULE_FIXTURE.revised : FINAL_RULE_FIXTURE.verbose,
    reward: headScore(weights, FINAL_RULE_FIXTURE.verbose.features),
    reviewReward: headScore(weights, FINAL_RULE_FIXTURE.reviewFirst.features),
  };
}
export function rewardFreshScreen(state) {
  const b = state.beat ?? 0,
    done = (id) => {
      const c = state.cues?.[id];
      return c ? c.phase === 'after' : (state.beatP ?? 0) >= 1;
    };
  return {
    pair: b > 1 || (b === 1 && done('fresh-pair-result')),
    ensemble: b > 1 || (b === 1 && done('fresh-ensemble-result')),
    source: b > 1 || (b === 1 && done('fresh-source-result')),
    hold: b >= 2,
  };
}
