import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import phaseRoofline from './stages/phase-roofline.mjs';
import oneToken from './stages/one-token.mjs';
import architectureResidency from './stages/architecture-residency.mjs';
import partition from './stages/partition.mjs';
import decimalBudget from './stages/decimal-budget.mjs';
import growth from './stages/growth.mjs';
import pages from './stages/pages.mjs';
import livePageOwnership from './stages/live-page-ownership.mjs';
import continuousSchedule from './stages/continuous-schedule.mjs';
import bandwidth from './stages/bandwidth.mjs';
import operatingPoint from './stages/operating-point.mjs';
import prefixSharing from './stages/prefix-sharing.mjs';
import promptChunks from './stages/prompt-chunks.mjs';
import phaseHandoff from './stages/phase-handoff.mjs';
import speculativeContract from './stages/speculative-contract.mjs';
import speculativeRate from './stages/speculative-rate.mjs';
import weightCompression from './stages/weight-compression.mjs';
import cachePrecision from './stages/cache-precision.mjs';
import requestShards from './stages/request-shards.mjs';
import measurement from './stages/measurement.mjs';
import freshResource from './stages/fresh-resource.mjs';
export {
  bandwidthPoint,
  prefixPageState,
  reservation,
  revisedCapacityRows,
  scheduleRequests,
  speculativeAcceptance,
  speculativeExpectation,
} from './arithmetic.mjs';
export { sampleModel } from './construction.mjs';
export { architecture, bytesPerToken, hardware } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'inference-batch-capacity',
  validateModel,
  scenes: [
    intro,
    phaseRoofline,
    oneToken,
    architectureResidency,
    partition,
    decimalBudget,
    growth,
    pages,
    livePageOwnership,
    continuousSchedule,
    bandwidth,
    operatingPoint,
    prefixSharing,
    promptChunks,
    phaseHandoff,
    speculativeContract,
    speculativeRate,
    weightCompression,
    cachePrecision,
    requestShards,
    measurement,
    freshResource,
  ],
});
export const draw = definition.draw;
export default definition;
