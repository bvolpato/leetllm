import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import pairedDesign from './stages/paired-design.mjs';
import protocolIdentity from './stages/protocol-identity.mjs';
import fortyTasks from './stages/forty-tasks.mjs';
import nullModel from './stages/null-model.mjs';
import nullContract from './stages/null-contract.mjs';
import pValue from './stages/p-value.mjs';
import errorsAndPower from './stages/errors-and-power.mjs';
import search from './stages/search.mjs';
import varianceConstruction from './stages/variance-construction.mjs';
import pairedUncertainty from './stages/paired-uncertainty.mjs';
import intervalContract from './stages/interval-contract.mjs';
import usefulLift from './stages/useful-lift.mjs';
import passAtKStage from './stages/pass-at-k.mjs';
import passkTarget from './stages/passk-target.mjs';
import estimatorBias from './stages/estimator-bias.mjs';
import macroConstruction from './stages/macro-construction.mjs';
import protocolRepair from './stages/protocol-repair.mjs';
import reportContract from './stages/report-contract.mjs';
import holdout from './stages/holdout.mjs';
export {
  BOOTSTRAP_BIN_EDGES,
  binomialMasses,
  bootstrap,
  bootstrapBins,
  estimatorExpectation,
  estimatorFactors,
  exactRightTail,
  exactSignPower,
  jointDifferenceMoments,
  orderedTaskResamples,
  passAtK,
  peekSequence,
  percentileInterval,
  random,
  repeatedStudies,
  subsets,
  usefulLiftDecision,
  waldMeanDifference,
} from './arithmetic.mjs';
export {
  assignmentFrame,
  bootstrapFrame,
  holdoutFrame,
  studyFrame,
  trimmedBootstrapBins,
} from './construction.mjs';
export {
  candidateSubsets,
  developmentBootstrap,
  holdoutBootstrap,
  holdoutRows,
  macroTaskInterval,
  macroTaskResamples,
  macroTaskScores,
  paired,
  pairedIntervalStudies,
  passingCandidates,
  peeking,
  studies,
  taskRows,
  variantStudies,
} from './fixtures.mjs';
export {
  completedHypothesisResult,
  cueProgress,
  joinTaskResults,
  pairedDifferenceFocusTarget,
  pairedOutcomeFocusTarget,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'hypothesis-testing',
  validateModel,
  scenes: [
    intro,
    pairedDesign,
    protocolIdentity,
    fortyTasks,
    nullModel,
    pValue,
    nullContract,
    errorsAndPower,
    search,
    varianceConstruction,
    pairedUncertainty,
    intervalContract,
    usefulLift,
    passAtKStage,
    passkTarget,
    estimatorBias,
    macroConstruction,
    protocolRepair,
    reportContract,
    holdout,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((stage) => stage.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
