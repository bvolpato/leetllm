import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import paperTriage from './stages/paper-triage.mjs';
import question from './stages/question.mjs';
import lockedContract from './stages/locked-contract.mjs';
import planHistory from './stages/plan-history.mjs';
import publicBoundary from './stages/public-boundary.mjs';
import environmentRuntime from './stages/environment-runtime.mjs';
import shapingStage from './stages/shaping.mjs';
import telescoping from './stages/telescoping.mjs';
import timeLimit from './stages/time-limit.mjs';
import update from './stages/update.mjs';
import actualUpdate from './stages/actual-update.mjs';
import indexedTapes from './stages/indexed-tapes.mjs';
import controls from './stages/controls.mjs';
import covariance from './stages/covariance.mjs';
import pilotEvaluation from './stages/pilot-evaluation.mjs';
import ablationMatrix from './stages/ablation-matrix.mjs';
import experimentLedger from './stages/experiment-ledger.mjs';
import seeds from './stages/seeds.mjs';
import uncertainty from './stages/uncertainty.mjs';
import reportedBootstrap from './stages/reported-bootstrap.mjs';
import pointVersusBound from './stages/point-versus-bound.mjs';
import competence from './stages/competence.mjs';
import frozenPolicy from './stages/frozen-policy.mjs';
import resourceAxis from './stages/resource-axis.mjs';
import dataProvenance from './stages/data-provenance.mjs';
import artifactLayers from './stages/artifact-layers.mjs';
import hashCounterexample from './stages/hash-counterexample.mjs';
import exporterChain from './stages/exporter-chain.mjs';
import negativeReport from './stages/negative-report.mjs';
import limitationsNext from './stages/limitations-next.mjs';
import reviewMilestones from './stages/review-milestones.mjs';
import talkDefense from './stages/talk-defense.mjs';
import outsiderTerms from './stages/outsider-terms.mjs';
import synthesis from './stages/synthesis.mjs';
import freshInterpretation from './stages/fresh-interpretation.mjs';
export { potential, qUpdate, quantile, shaping } from './arithmetic.mjs';
export { researchEvent } from './construction.mjs';
export {
  bootstrap,
  bootstrapSamples,
  controlledRun,
  researchConstructionModel,
  sampleModel,
  shapingSnapshot,
  trajectory,
  visibleControlRows,
} from './model.mjs';
export { validateModel, validateResearchConstruction } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-reproducible-research-study',
  validateModel,
  scenes: [
    intro,
    paperTriage,
    question,
    lockedContract,
    planHistory,
    publicBoundary,
    environmentRuntime,
    shapingStage,
    telescoping,
    timeLimit,
    update,
    actualUpdate,
    indexedTapes,
    controls,
    covariance,
    pilotEvaluation,
    ablationMatrix,
    experimentLedger,
    seeds,
    uncertainty,
    reportedBootstrap,
    pointVersusBound,
    competence,
    frozenPolicy,
    resourceAxis,
    dataProvenance,
    artifactLayers,
    hashCounterexample,
    exporterChain,
    negativeReport,
    limitationsNext,
    reviewMilestones,
    talkDefense,
    outsiderTerms,
    synthesis,
    freshInterpretation,
  ],
});
export const draw = definition.draw;
export default definition;
