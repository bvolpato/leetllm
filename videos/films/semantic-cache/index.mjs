import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import requestContractStage from './stages/request-contract.mjs';
import exactBytesStage from './stages/exact-bytes.mjs';
import currentAuthorizationStage from './stages/current-authorization.mjs';
import geometryStage from './stages/geometry.mjs';
import numericGeometryStage from './stages/numeric-geometry.mjs';
import retrievalScopeStage from './stages/retrieval-scope.mjs';
import routeOrderStage from './stages/route-order.mjs';
import indexContractStage from './stages/index-contract.mjs';
import thresholdStage from './stages/threshold.mjs';
import shadowPopulationStage from './stages/shadow-population.mjs';
import unseparableExceptionStage from './stages/unseparable-exception.mjs';
import evidenceStage from './stages/evidence.mjs';
import heldoutReportStage from './stages/heldout-report.mjs';
import gatesStage from './stages/gates.mjs';
import distributedCutoverStage from './stages/distributed-cutover.mjs';
import admissionStage from './stages/admission.mjs';
import quarantineWriteStage from './stages/quarantine-write.mjs';
import economicsStage from './stages/economics.mjs';
import breakEvenStage from './stages/break-even.mjs';
import largeWindowTailStage from './stages/large-window-tail.mjs';
import promotionEvidenceStage from './stages/promotion-evidence.mjs';
import decisionTraceStage from './stages/decision-trace.mjs';
import cacheTiersStage from './stages/cache-tiers.mjs';
import diagnosticRepairStage from './stages/diagnostic-repair.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshPopulationStage from './stages/fresh-population.mjs';
export { ARTICLE_RECORD, SHADOW_ROWS, probes } from './fixtures.mjs';
export {
  canonicalPythonJson,
  population,
  scaledCosine,
  servingWindow,
  wilsonLower,
} from './arithmetic.mjs';
export {
  answerDigest,
  check,
  economicsState,
  eligible,
  exactIdentity,
  freshCacheFrame,
  reportDecision,
  sampleModel,
  select,
  shadowReplay,
  validateModel,
  validateSemanticConstructions,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'semantic-cache',
  validateModel,
  scenes: [
    introStage,
    requestContractStage,
    exactBytesStage,
    currentAuthorizationStage,
    geometryStage,
    numericGeometryStage,
    retrievalScopeStage,
    routeOrderStage,
    indexContractStage,
    thresholdStage,
    shadowPopulationStage,
    unseparableExceptionStage,
    evidenceStage,
    heldoutReportStage,
    gatesStage,
    distributedCutoverStage,
    admissionStage,
    quarantineWriteStage,
    economicsStage,
    breakEvenStage,
    largeWindowTailStage,
    promotionEvidenceStage,
    decisionTraceStage,
    cacheTiersStage,
    diagnosticRepairStage,
    synthesisStage,
    freshPopulationStage,
  ],
});
export const draw = definition.draw;
export default definition;
