import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import evidencePath from './stages/evidence-path.mjs';
import atomicClaims from './stages/atomic-claims.mjs';
import supportGraph from './stages/support-graph.mjs';
import citationBinding from './stages/citation-binding.mjs';
import omittedPoint from './stages/omitted-point.mjs';
import aggregation from './stages/aggregation.mjs';
import transfer from './stages/transfer.mjs';
import policyReplay from './stages/policy-replay.mjs';
import traceIntegrity from './stages/trace-integrity.mjs';
import rankAdmission from './stages/rank-admission.mjs';
import policyLedger from './stages/policy-ledger.mjs';
import reviewBoundary from './stages/review-boundary.mjs';
import abstentionMatrix from './stages/abstention-matrix.mjs';
import regressionDiagnosis from './stages/regression-diagnosis.mjs';
import sliceRelease from './stages/slice-release.mjs';
import judgeCalibration from './stages/judge-calibration.mjs';
import releaseTransfer from './stages/release-transfer.mjs';
export { rankPrecision } from './arithmetic.mjs';
export { BYPASS_TEXT, CLAIMS, POLICY_ID, POLICY_TEXT, SLICE_OUTCOMES } from './fixtures.mjs';
export {
  abstentionOutcome,
  admissiblePolicy,
  aggregationSnapshot,
  citationSnapshot,
  evidenceSnapshot,
  metrics,
  omissionSnapshot,
  policyEvaluation,
  policyFixture,
  policyTransferSnapshot,
  policyVariants,
  recordDigest,
  reorderPositions,
  sliceGate,
} from './model.mjs';
export { validateModel, validatePolicyModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'rag-evaluation',
  validateModel,
  scenes: [
    subjectIntro,
    evidencePath,
    atomicClaims,
    supportGraph,
    citationBinding,
    omittedPoint,
    aggregation,
    transfer,
    policyReplay,
    traceIntegrity,
    rankAdmission,
    policyLedger,
    reviewBoundary,
    abstentionMatrix,
    regressionDiagnosis,
    sliceRelease,
    judgeCalibration,
    releaseTransfer,
  ],
});
export const draw = definition.draw;
export default definition;
