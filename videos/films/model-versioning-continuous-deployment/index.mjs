import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import identity from './stages/identity.mjs';
import bundleContract from './stages/bundle-contract.mjs';
import providerContract from './stages/provider-contract.mjs';
import registry from './stages/registry.mjs';
import gateArithmetic from './stages/gate-arithmetic.mjs';
import traceReplay from './stages/trace-replay.mjs';
import offline from './stages/offline.mjs';
import reportIntegrity from './stages/report-integrity.mjs';
import shadow from './stages/shadow.mjs';
import shadowEvidence from './stages/shadow-evidence.mjs';
import sticky from './stages/sticky.mjs';
import assignmentShare from './stages/assignment-share.mjs';
import windowPolicy from './stages/window-policy.mjs';
import live from './stages/live.mjs';
import zeroRisk from './stages/zero-risk.mjs';
import recovery from './stages/recovery.mjs';
import capacity from './stages/capacity.mjs';
import auditLineage from './stages/audit-lineage.mjs';
import stackContract from './stages/stack-contract.mjs';
import freshRelease from './stages/fresh-release.mjs';
export { bucket, requestExposure, routeF1, zeroFailureUpper } from './arithmetic.mjs';
export { presentationCue, sampleModel, stickySnapshot } from './construction.mjs';
export {
  Registry,
  authorize,
  enqueue,
  freshDecision,
  liveGate,
  liveInventory,
  liveSummary,
  offlineGate,
  recoveryReady,
  replayRecordedTool,
  route,
  validMetric,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'model-versioning-continuous-deployment',
  validateModel,
  scenes: [
    opening,
    identity,
    bundleContract,
    providerContract,
    registry,
    gateArithmetic,
    traceReplay,
    offline,
    reportIntegrity,
    shadow,
    shadowEvidence,
    sticky,
    assignmentShare,
    windowPolicy,
    live,
    zeroRisk,
    recovery,
    capacity,
    auditLineage,
    stackContract,
    freshRelease,
  ],
});
export const draw = definition.draw;
export default definition;
