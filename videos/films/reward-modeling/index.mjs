import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introduction from './stages/introduction.mjs';
import likelihoodIsntPreference from './stages/likelihood-isnt-preference.mjs';
import humanComparisons from './stages/human-comparisons.mjs';
import policyAndJudge from './stages/policy-and-judge.mjs';
import pairContract from './stages/pair-contract.mjs';
import formatLengthBoundary from './stages/format-length-boundary.mjs';
import promptGroups from './stages/prompt-groups.mjs';
import groupWeightSoftTarget from './stages/group-weight-soft-target.mjs';
import transformerScoreHead from './stages/transformer-score-head.mjs';
import paddingAndArtifact from './stages/padding-and-artifact.mjs';
import marginToProbability from './stages/margin-to-probability.mjs';
import pairwiseLikelihood from './stages/pairwise-likelihood.mjs';
import stableLossAndMargins from './stages/stable-loss-and-margins.mjs';
import scoreGradients from './stages/score-gradients.mjs';
import fitTheHead from './stages/fit-the-head.mjs';
import offsetAndScale from './stages/offset-and-scale.mjs';
import centeringAndKl from './stages/centering-and-kl.mjs';
import shortcutsAndCalibration from './stages/shortcuts-and-calibration.mjs';
import lengthMarginCounterexample from './stages/length-margin-counterexample.mjs';
import freshPolicyEvaluation from './stages/fresh-policy-evaluation.mjs';
import ensembleDisagreement from './stages/ensemble-disagreement.mjs';
import benchmarksAndFreshGates from './stages/benchmarks-and-fresh-gates.mjs';
import signalSpectrum from './stages/signal-spectrum.mjs';
import trainerArtifactAndDiagnosis from './stages/trainer-artifact-and-diagnosis.mjs';
import freshScorerScreen from './stages/fresh-scorer-screen.mjs';
import rlhfAndDpo from './stages/rlhf-and-dpo.mjs';
export { finalUnmasked, rewardEnsemble, rewardHeadFit, stablePairLoss } from './arithmetic.mjs';
export { FINAL_RULE_FIXTURE, LIKELIHOOD_FIXTURE } from './fixtures.mjs';
export {
  approvalRuleCheck,
  calibrationConstruction,
  finalRuleConstruction,
  likelihoodConstruction,
  preferenceMargin,
  proxyOptimizationProgress,
  rewardFreshScreen,
  scoreHeadConstruction,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'reward-modeling',
  validateModel,
  scenes: [
    introduction,
    likelihoodIsntPreference,
    humanComparisons,
    policyAndJudge,
    pairContract,
    formatLengthBoundary,
    promptGroups,
    groupWeightSoftTarget,
    transformerScoreHead,
    paddingAndArtifact,
    marginToProbability,
    pairwiseLikelihood,
    stableLossAndMargins,
    scoreGradients,
    fitTheHead,
    offsetAndScale,
    centeringAndKl,
    shortcutsAndCalibration,
    lengthMarginCounterexample,
    freshPolicyEvaluation,
    ensembleDisagreement,
    benchmarksAndFreshGates,
    signalSpectrum,
    trainerArtifactAndDiagnosis,
    freshScorerScreen,
    rlhfAndDpo,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((stage) => stage.id === scene.id)) {
    throw new Error('Unknown reward-modeling scene: ' + scene.id);
  }
  definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
