import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import requestLimits from './stages/request-limits.mjs';
import boundary from './stages/boundary.mjs';
import kvmDescriptors from './stages/kvm-descriptors.mjs';
import jailerSurfaces from './stages/jailer-surfaces.mjs';
import cleanTemplate from './stages/clean-template.mjs';
import cow from './stages/cow.mjs';
import articlePageRun from './stages/article-page-run.mjs';
import faultHandler from './stages/fault-handler.mjs';
import clockRefresh from './stages/clock-refresh.mjs';
import rngWindow from './stages/rng-window.mjs';
import namespaceIdentity from './stages/namespace-identity.mjs';
import freshness from './stages/freshness.mjs';
import filesystem from './stages/filesystem.mjs';
import overlayWhiteout from './stages/overlay-whiteout.mjs';
import network from './stages/network.mjs';
import egressAddresses from './stages/egress-addresses.mjs';
import vsockWire from './stages/vsock-wire.mjs';
import boundedAck from './stages/bounded-ack.mjs';
import capacity from './stages/capacity.mjs';
import capacityArithmetic from './stages/capacity-arithmetic.mjs';
import groupBudget from './stages/group-budget.mjs';
import readonlyData from './stages/readonly-data.mjs';
import stateMachine from './stages/state-machine.mjs';
import retirement from './stages/retirement.mjs';
import referenceRetirement from './stages/reference-retirement.mjs';
import reconciliationTable from './stages/reconciliation-table.mjs';
import endpointClock from './stages/endpoint-clock.mjs';
import freshGeneration from './stages/fresh-generation.mjs';
export {
  capacitySnapshot,
  cloneReadiness,
  cowSnapshot,
  networkDecision,
  networkTrace,
  overlay,
  sandboxAck,
  sandboxCapacity,
  sandboxPages,
  sandboxReadiness,
  sandboxReconcile,
  sandboxRetirement,
} from './arithmetic.mjs';
export { sampleModel, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'design-agent-sandbox-platform',
  validateModel,
  scenes: [
    intro,
    requestLimits,
    boundary,
    kvmDescriptors,
    jailerSurfaces,
    cleanTemplate,
    cow,
    articlePageRun,
    faultHandler,
    clockRefresh,
    rngWindow,
    namespaceIdentity,
    freshness,
    filesystem,
    overlayWhiteout,
    network,
    egressAddresses,
    vsockWire,
    boundedAck,
    capacity,
    capacityArithmetic,
    groupBudget,
    readonlyData,
    stateMachine,
    retirement,
    referenceRetirement,
    reconciliationTable,
    endpointClock,
    freshGeneration,
  ],
});
export const draw = definition.draw;
export default definition;
