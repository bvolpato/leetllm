import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModelWithPainter } from './validation.mjs';
import { drawUnrecognizedScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import pairStage from './stages/pair.mjs';
import policyContractStage from './stages/policy-contract.mjs';
import btJudgeStage from './stages/bt-judge.mjs';
import methodsStage from './stages/methods.mjs';
import roleOwnershipStage from './stages/role-ownership.mjs';
import tokenReturnStage from './stages/token-return.mjs';
import ppoClippingStage from './stages/ppo-clipping.mjs';
import stateBudgetStage from './stages/state-budget.mjs';
import optimalPolicyStage from './stages/optimal-policy.mjs';
import rewardCancellationStage from './stages/reward-cancellation.mjs';
import referenceStage from './stages/reference.mjs';
import probabilityStage from './stages/probability.mjs';
import lossStage from './stages/loss.mjs';
import updateStage from './stages/update.mjs';
import summedTokenScoresStage from './stages/summed-token-scores.mjs';
import reductionConventionStage from './stages/reduction-convention.mjs';
import betaDoubleRoleStage from './stages/beta-double-role.mjs';
import likelihoodDisplacementStage from './stages/likelihood-displacement.mjs';
import unseenProbabilityStage from './stages/unseen-probability.mjs';
import referenceCacheStage from './stages/reference-cache.mjs';
import truncationAuditStage from './stages/truncation-audit.mjs';
import trainingContractStage from './stages/training-contract.mjs';
import pairDataStage from './stages/pair-data.mjs';
import evaluationStage from './stages/evaluation.mjs';
import proxyControlsStage from './stages/proxy-controls.mjs';
import releaseIntervalStage from './stages/release-interval.mjs';
import onlineRefreshStage from './stages/online-refresh.mjs';
import ipoTargetStage from './stages/ipo-target.mjs';
import ktoDirectionStage from './stages/kto-direction.mjs';
import referenceFreeLossesStage from './stages/reference-free-losses.mjs';
import groupAdvantageStage from './stages/group-advantage.mjs';
import groupTokenRatiosStage from './stages/group-token-ratios.mjs';
import aiFeedbackStage from './stages/ai-feedback.mjs';
import freshTransferStage from './stages/fresh-transfer.mjs';
import freshReleaseStage from './stages/fresh-release.mjs';
export { CONTROLLED_CASES, ROUTE_FIXTURE, SHORTCUT_PAIRS } from './fixtures.mjs';
export {
  alignmentBudget,
  alignmentClipping,
  alignmentGae,
  alignmentGroup,
  alignmentReduction,
  alignmentRelease,
  alignmentSoftmax,
  alignmentTilt,
  alignmentTokenScores,
  alignmentWilson,
  dpoExample,
  twoLogitState,
  twoLogitTrace,
} from './model.mjs';
export {
  alignmentFreshFrame,
  alignmentFreshStep,
  alignmentMissingPair,
  comparisonLoss,
  evaluationState,
  introState,
  lossPresentation,
  methodState,
  pairLayout,
} from './construction.mjs';
export { validateAlignmentExtension } from './validation.mjs';
export function validateModel() {
  return validateModelWithPainter(draw);
}
const definition = defineCanvasLesson({
  id: 'preference-alignment',
  validateModel,
  scenes: [
    introStage,
    pairStage,
    policyContractStage,
    btJudgeStage,
    methodsStage,
    roleOwnershipStage,
    tokenReturnStage,
    ppoClippingStage,
    stateBudgetStage,
    optimalPolicyStage,
    rewardCancellationStage,
    referenceStage,
    probabilityStage,
    lossStage,
    updateStage,
    summedTokenScoresStage,
    reductionConventionStage,
    betaDoubleRoleStage,
    likelihoodDisplacementStage,
    unseenProbabilityStage,
    referenceCacheStage,
    truncationAuditStage,
    trainingContractStage,
    pairDataStage,
    evaluationStage,
    proxyControlsStage,
    releaseIntervalStage,
    onlineRefreshStage,
    ipoTargetStage,
    ktoDirectionStage,
    referenceFreeLossesStage,
    groupAdvantageStage,
    groupTokenRatiosStage,
    aiFeedbackStage,
    freshTransferStage,
    freshReleaseStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
