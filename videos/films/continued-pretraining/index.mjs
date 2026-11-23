import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import incidentControls from './stages/incident-controls.mjs';
import diagnose from './stages/diagnose.mjs';
import promptGradient from './stages/prompt-gradient.mjs';
import scoredObjective from './stages/scored-objective.mjs';
import fertilityCost from './stages/fertility-cost.mjs';
import vocabularyShapes from './stages/vocabulary-shapes.mjs';
import vocabularyDenominator from './stages/vocabulary-denominator.mjs';
import corpus from './stages/corpus.mjs';
import groupedHoldout from './stages/grouped-holdout.mjs';
import manifestGate from './stages/manifest-gate.mjs';
import normalizedOverlap from './stages/normalized-overlap.mjs';
import packedRemainder from './stages/packed-remainder.mjs';
import objective from './stages/objective.mjs';
import optimizerRestart from './stages/optimizer-restart.mjs';
import schedule from './stages/schedule.mjs';
import exactSchedule from './stages/exact-schedule.mjs';
import daptTapt from './stages/dapt-tapt.mjs';
import replay from './stages/replay.mjs';
import fixedBudget from './stages/fixed-budget.mjs';
import targetWeighting from './stages/target-weighting.mjs';
import evaluation from './stages/evaluation.mjs';
import byteNormalization from './stages/byte-normalization.mjs';
import corpusReduction from './stages/corpus-reduction.mjs';
import retainedOutcomes from './stages/retained-outcomes.mjs';
import select from './stages/select.mjs';
import selectionAndStopping from './stages/selection-and-stopping.mjs';
import objectiveAndParameters from './stages/objective-and-parameters.mjs';
import earnedAdaptation from './stages/earned-adaptation.mjs';
export {
  CENTROID_INPUTS,
  CHECKPOINTS,
  DOMAIN_DOCUMENTS,
  FRESH_CHECKPOINTS,
  PACKED_DOCUMENTS,
  RETAINED_CHECKS,
  WINDOW_ORDER,
} from './fixtures.mjs';
export {
  adaptationSnapshot,
  byteReport,
  centroidCoordinates,
  checkpointTokenize,
  chooseCheckpoint,
  controlledSgd,
  corpusSnapshot,
  dependencyModel,
  evaluationSnapshot,
  exactLearningRate,
  freshReductionFrame,
  groupedSplit,
  learningRate,
  manifestAdmission,
  mixtureReduction,
  normalizedFingerprint,
  packedCorpus,
  packingOwners,
  replayCueFraction,
  replayGradient,
  selectedPackage,
  selectionSnapshot,
  shuffleOwners,
  vocabularyMass,
  wordOverlap,
} from './model.mjs';
export { validateExtension, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'continued-pretraining',
  validateModel,
  scenes: [
    intro,
    incidentControls,
    diagnose,
    promptGradient,
    scoredObjective,
    fertilityCost,
    vocabularyShapes,
    vocabularyDenominator,
    corpus,
    groupedHoldout,
    manifestGate,
    normalizedOverlap,
    packedRemainder,
    objective,
    optimizerRestart,
    schedule,
    exactSchedule,
    daptTapt,
    replay,
    fixedBudget,
    targetWeighting,
    evaluation,
    byteNormalization,
    corpusReduction,
    retainedOutcomes,
    select,
    selectionAndStopping,
    objectiveAndParameters,
    earnedAdaptation,
  ],
});
export const draw = definition.draw;
export default definition;
