import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import contract from './stages/contract.mjs';
import goldContract from './stages/gold-contract.mjs';
import checker from './stages/checker.mjs';
import ragStage from './stages/rag-stage.mjs';
import ragMetrics from './stages/rag-metrics.mjs';
import knowledgeContract from './stages/knowledge-contract.mjs';
import mathFrontier from './stages/math-frontier.mjs';
import codeContract from './stages/code-contract.mjs';
import benchmarkAudit from './stages/benchmark-audit.mjs';
import preferenceRatings from './stages/preference-ratings.mjs';
import slices from './stages/slices.mjs';
import candidates from './stages/candidates.mjs';
import sampleEstimator from './stages/sample-estimator.mjs';
import judgeControls from './stages/judge-controls.mjs';
import exposure from './stages/exposure.mjs';
import exposureScreen from './stages/exposure-screen.mjs';
import uncertainty from './stages/uncertainty.mjs';
import wilsonConstruction from './stages/wilson-construction.mjs';
import pairedDiagnosis from './stages/paired-diagnosis.mjs';
import gates from './stages/gates.mjs';
import finiteReport from './stages/finite-report.mjs';
import reproduciblePackage from './stages/reproducible-package.mjs';
import synthesis from './stages/synthesis.mjs';
import freshReport from './stages/fresh-report.mjs';
export {
  binomialChoose,
  exactPairedP,
  preferenceProbability,
  rankedPrecision,
  strictMetricRecord,
  subsetCoverage,
  wilsonInterval,
} from './arithmetic.mjs';
export { CASES, PAIRS, PROGRAMS, RELEASES } from './fixtures.mjs';
export {
  casePosition,
  checkProbe,
  freshAuditDecision,
  freshAuditReveal,
  releaseResult,
  sampleModel,
  scoreCases,
} from './model.mjs';
export { validateAuditExpansion, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'benchmark-audits',
  validateModel,
  scenes: [
    intro,
    contract,
    goldContract,
    checker,
    ragStage,
    ragMetrics,
    knowledgeContract,
    mathFrontier,
    codeContract,
    benchmarkAudit,
    preferenceRatings,
    slices,
    candidates,
    sampleEstimator,
    judgeControls,
    exposure,
    exposureScreen,
    uncertainty,
    wilsonConstruction,
    pairedDiagnosis,
    gates,
    finiteReport,
    reproduciblePackage,
    synthesis,
    freshReport,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
