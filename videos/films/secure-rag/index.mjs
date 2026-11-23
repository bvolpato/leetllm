import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import permissionModels from './stages/permission-models.mjs';
import resolvePrincipal from './stages/resolve-principal.mjs';
import externalJoin from './stages/external-join.mjs';
import filterBeforeRank from './stages/filter-before-rank.mjs';
import copyLeak from './stages/copy-leak.mjs';
import typedPolicy from './stages/typed-policy.mjs';
import grantPaths from './stages/grant-paths.mjs';
import metadataReceipt from './stages/metadata-receipt.mjs';
import runtimeRls from './stages/runtime-rls.mjs';
import recallTradeoff from './stages/recall-tradeoff.mjs';
import annBackends from './stages/ann-backends.mjs';
import keepGrantsCurrent from './stages/keep-grants-current.mjs';
import syncTwoChunks from './stages/sync-two-chunks.mjs';
import snapshotClock from './stages/snapshot-clock.mjs';
import tenantAndScope from './stages/tenant-and-scope.mjs';
import tenantLayouts from './stages/tenant-layouts.mjs';
import reportProvenance from './stages/report-provenance.mjs';
import rewriteScope from './stages/rewrite-scope.mjs';
import externalFetch from './stages/external-fetch.mjs';
import verifiedToken from './stages/verified-token.mjs';
import directoryIdentity from './stages/directory-identity.mjs';
import taskHmac from './stages/task-hmac.mjs';
import jitApproval from './stages/jit-approval.mjs';
import draftReauthorize from './stages/draft-reauthorize.mjs';
import outputChecks from './stages/output-checks.mjs';
import destinationPolicy from './stages/destination-policy.mjs';
import readVsAction from './stages/read-vs-action.mjs';
import auditReceipt from './stages/audit-receipt.mjs';
import threatSurfaces from './stages/threat-surfaces.mjs';
import embeddingRisk from './stages/embedding-risk.mjs';
import regressionMatrix from './stages/regression-matrix.mjs';
import transfer from './stages/transfer.mjs';
import freshRelease from './stages/fresh-release.mjs';
export {
  authorize,
  freshSecureState,
  localOutputCheck,
  readAuthorizationInputs,
  reconcileChunks,
  reportAdmission,
  retrieve,
  secureEligibility,
  secureRepairTransfer,
  snapshotAdmission,
  sourceRecord,
  taskScopeCheck,
} from './arithmetic.mjs';
export {
  derivedScopeState,
  filterConstructionState,
  principalResolutionState,
  recallComparison,
} from './construction.mjs';
export { CANDIDATES, POLICY, PRINCIPAL, RECALL_CUES, SECURE_SOURCES } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'secure-rag',
  validateModel,
  scenes: [
    subjectIntro,
    permissionModels,
    resolvePrincipal,
    externalJoin,
    filterBeforeRank,
    copyLeak,
    typedPolicy,
    grantPaths,
    metadataReceipt,
    runtimeRls,
    recallTradeoff,
    annBackends,
    keepGrantsCurrent,
    syncTwoChunks,
    snapshotClock,
    tenantAndScope,
    tenantLayouts,
    reportProvenance,
    rewriteScope,
    externalFetch,
    verifiedToken,
    directoryIdentity,
    taskHmac,
    jitApproval,
    draftReauthorize,
    outputChecks,
    destinationPolicy,
    readVsAction,
    auditReceipt,
    threatSurfaces,
    embeddingRisk,
    regressionMatrix,
    transfer,
    freshRelease,
  ],
});
export const draw = definition.draw;
export default definition;
