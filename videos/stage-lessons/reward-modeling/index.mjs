// Cinematic Vizmatic 0.10.0 stage film for Reward Modeling (26 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyRewardInvariants } from './parts.mjs';
import benchmarksAndFreshGates from './scenes/benchmarks-and-fresh-gates.mjs';
import centeringAndKl from './scenes/centering-and-kl.mjs';
import ensembleDisagreement from './scenes/ensemble-disagreement.mjs';
import fitTheHead from './scenes/fit-the-head.mjs';
import formatLengthBoundary from './scenes/format-length-boundary.mjs';
import freshPolicyEvaluation from './scenes/fresh-policy-evaluation.mjs';
import freshScorerScreen from './scenes/fresh-scorer-screen.mjs';
import groupWeightSoftTarget from './scenes/group-weight-soft-target.mjs';
import humanComparisons from './scenes/human-comparisons.mjs';
import introduction from './scenes/introduction.mjs';
import lengthMarginCounterexample from './scenes/length-margin-counterexample.mjs';
import likelihoodIsntPreference from './scenes/likelihood-isnt-preference.mjs';
import marginToProbability from './scenes/margin-to-probability.mjs';
import offsetAndScale from './scenes/offset-and-scale.mjs';
import paddingAndArtifact from './scenes/padding-and-artifact.mjs';
import pairContract from './scenes/pair-contract.mjs';
import pairwiseLikelihood from './scenes/pairwise-likelihood.mjs';
import policyAndJudge from './scenes/policy-and-judge.mjs';
import promptGroups from './scenes/prompt-groups.mjs';
import rlhfAndDpo from './scenes/rlhf-and-dpo.mjs';
import scoreGradients from './scenes/score-gradients.mjs';
import shortcutsAndCalibration from './scenes/shortcuts-and-calibration.mjs';
import signalSpectrum from './scenes/signal-spectrum.mjs';
import stableLossAndMargins from './scenes/stable-loss-and-margins.mjs';
import trainerArtifactAndDiagnosis from './scenes/trainer-artifact-and-diagnosis.mjs';
import transformerScoreHead from './scenes/transformer-score-head.mjs';

export default cinematicLesson({
  id: 'reward-modeling',
  accent: COSMOS.gold,
  invariants: verifyRewardInvariants,
  scenes: {
    introduction,
    'likelihood-isnt-preference': likelihoodIsntPreference,
    'human-comparisons': humanComparisons,
    'policy-and-judge': policyAndJudge,
    'pair-contract': pairContract,
    'format-length-boundary': formatLengthBoundary,
    'prompt-groups': promptGroups,
    'group-weight-soft-target': groupWeightSoftTarget,
    'transformer-score-head': transformerScoreHead,
    'padding-and-artifact': paddingAndArtifact,
    'margin-to-probability': marginToProbability,
    'pairwise-likelihood': pairwiseLikelihood,
    'stable-loss-and-margins': stableLossAndMargins,
    'score-gradients': scoreGradients,
    'fit-the-head': fitTheHead,
    'offset-and-scale': offsetAndScale,
    'centering-and-kl': centeringAndKl,
    'shortcuts-and-calibration': shortcutsAndCalibration,
    'length-margin-counterexample': lengthMarginCounterexample,
    'fresh-policy-evaluation': freshPolicyEvaluation,
    'ensemble-disagreement': ensembleDisagreement,
    'benchmarks-and-fresh-gates': benchmarksAndFreshGates,
    'signal-spectrum': signalSpectrum,
    'trainer-artifact-and-diagnosis': trainerArtifactAndDiagnosis,
    'fresh-scorer-screen': freshScorerScreen,
    'rlhf-and-dpo': rlhfAndDpo,
  },
});
