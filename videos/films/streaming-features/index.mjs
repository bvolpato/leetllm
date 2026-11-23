import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import availabilityClock from './stages/availability-clock.mjs';
import eventArrivalClocks from './stages/event-arrival-clocks.mjs';
import perRowJoins from './stages/per-row-joins.mjs';
import joinContract from './stages/join-contract.mjs';
import batchOnline from './stages/batch-online.mjs';
import revisionOrdering from './stages/revision-ordering.mjs';
import quarantineState from './stages/quarantine-state.mjs';
import watermarks from './stages/watermarks.mjs';
import windowGeometry from './stages/window-geometry.mjs';
import watermarkInputs from './stages/watermark-inputs.mjs';
import windowPublication from './stages/window-publication.mjs';
import idempotentUpdates from './stages/idempotent-updates.mjs';
import atomicCrash from './stages/atomic-crash.mjs';
import sourceProgress from './stages/source-progress.mjs';
import freshnessPolicy from './stages/freshness-policy.mjs';
import freshnessBoundary from './stages/freshness-boundary.mjs';
import parityReconciliation from './stages/parity-reconciliation.mjs';
import parityContract from './stages/parity-contract.mjs';
import diagnosticEvidence from './stages/diagnostic-evidence.mjs';
import wrap from './stages/wrap.mjs';
import freshRequest from './stages/fresh-request.mjs';
export {
  applyLatestState,
  applyUpdate,
  availableHeartbeat,
  eligibleEvents,
  eventRoute,
  freshnessMode,
  heartbeatAge,
  pointInTime,
  publishWindow,
  sourceFreshness,
  typedParity,
} from './arithmetic.mjs';
export { revisionRecords } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'streaming-features',
  validateModel,
  scenes: [
    intro,
    availabilityClock,
    eventArrivalClocks,
    perRowJoins,
    joinContract,
    batchOnline,
    revisionOrdering,
    quarantineState,
    watermarks,
    windowGeometry,
    watermarkInputs,
    windowPublication,
    idempotentUpdates,
    atomicCrash,
    sourceProgress,
    freshnessPolicy,
    freshnessBoundary,
    parityReconciliation,
    parityContract,
    diagnosticEvidence,
    wrap,
    freshRequest,
  ],
});
export const draw = definition.draw;
export default definition;
