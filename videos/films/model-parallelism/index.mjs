import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import weightBudgetStage from './stages/weight-budget.mjs';
import inferenceContractStage from './stages/inference-contract.mjs';
import linearStage from './stages/linear.mjs';
import columnStage from './stages/column.mjs';
import rowStage from './stages/row.mjs';
import pairStage from './stages/pair.mjs';
import geluReferenceStage from './stages/gelu-reference.mjs';
import attentionShardsStage from './stages/attention-shards.mjs';
import collectiveStage from './stages/collective.mjs';
import headReplicationStage from './stages/head-replication.mjs';
import collectiveCountStage from './stages/collective-count.mjs';
import startupPayloadStage from './stages/startup-payload.mjs';
import pipelineStage from './stages/pipeline.mjs';
import pipelineFormulaStage from './stages/pipeline-formula.mjs';
import pipelineLatencyStage from './stages/pipeline-latency.mjs';
import topologyPlacementStage from './stages/topology-placement.mjs';
import contextBudgetStage from './stages/context-budget.mjs';
import ringPrefillStage from './stages/ring-prefill.mjs';
import ulyssesLayoutStage from './stages/ulysses-layout.mjs';
import decodeHistoryStage from './stages/decode-history.mjs';
import massMergeStage from './stages/mass-merge.mjs';
import expertDispatchStage from './stages/expert-dispatch.mjs';
import capacityStage from './stages/capacity.mjs';
import localFitStage from './stages/local-fit.mjs';
import replicaLayoutsStage from './stages/replica-layouts.mjs';
import phaseHandoffStage from './stages/phase-handoff.mjs';
import fitLatencyCostStage from './stages/fit-latency-cost.mjs';
import failureTraceStage from './stages/failure-trace.mjs';
import transferStage from './stages/transfer.mjs';
import freshLayoutStage from './stages/fresh-layout.mjs';
export {
  expertAssignments,
  historyOwnership,
  localPlacement,
  mergeMass,
  parallelMLP,
  pipeline,
  pipelineOccupancy,
  usefulCost,
  weightLedger,
} from './arithmetic.mjs';
export { B, W, X } from './fixtures.mjs';
export { columnTeachingState, introWeightLayout, shards } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'model-parallelism',
  validateModel,
  scenes: [
    introStage,
    weightBudgetStage,
    inferenceContractStage,
    linearStage,
    columnStage,
    rowStage,
    pairStage,
    geluReferenceStage,
    attentionShardsStage,
    collectiveStage,
    headReplicationStage,
    collectiveCountStage,
    startupPayloadStage,
    pipelineStage,
    pipelineFormulaStage,
    pipelineLatencyStage,
    topologyPlacementStage,
    contextBudgetStage,
    ringPrefillStage,
    ulyssesLayoutStage,
    decodeHistoryStage,
    massMergeStage,
    expertDispatchStage,
    capacityStage,
    localFitStage,
    replicaLayoutsStage,
    phaseHandoffStage,
    fitLatencyCostStage,
    failureTraceStage,
    transferStage,
    freshLayoutStage,
  ],
});
export const draw = definition.draw;
export default definition;
