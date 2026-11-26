// Cinematic Vizmatic 0.10.0 stage film for Model Parallelism for LLM Inference (31 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyModelParallelInvariants } from './parts.mjs';
import attentionShards from './scenes/attention-shards.mjs';
import capacity from './scenes/capacity.mjs';
import collectiveCount from './scenes/collective-count.mjs';
import collective from './scenes/collective.mjs';
import column from './scenes/column.mjs';
import contextBudget from './scenes/context-budget.mjs';
import decodeHistory from './scenes/decode-history.mjs';
import expertDispatch from './scenes/expert-dispatch.mjs';
import failureTrace from './scenes/failure-trace.mjs';
import fitLatencyCost from './scenes/fit-latency-cost.mjs';
import freshLayout from './scenes/fresh-layout.mjs';
import geluReference from './scenes/gelu-reference.mjs';
import headReplication from './scenes/head-replication.mjs';
import inferenceContract from './scenes/inference-contract.mjs';
import intro from './scenes/intro.mjs';
import linear from './scenes/linear.mjs';
import localFit from './scenes/local-fit.mjs';
import massMerge from './scenes/mass-merge.mjs';
import pair from './scenes/pair.mjs';
import phaseHandoff from './scenes/phase-handoff.mjs';
import pipelineFormula from './scenes/pipeline-formula.mjs';
import pipelineLatency from './scenes/pipeline-latency.mjs';
import pipeline from './scenes/pipeline.mjs';
import replicaLayouts from './scenes/replica-layouts.mjs';
import ringPrefill from './scenes/ring-prefill.mjs';
import row from './scenes/row.mjs';
import startupPayload from './scenes/startup-payload.mjs';
import topologyPlacement from './scenes/topology-placement.mjs';
import transfer from './scenes/transfer.mjs';
import ulyssesLayout from './scenes/ulysses-layout.mjs';
import weightBudget from './scenes/weight-budget.mjs';

export default cinematicLesson({
  id: 'model-parallelism',
  accent: COSMOS.cyan,
  invariants: verifyModelParallelInvariants,
  scenes: {
    intro,
    'weight-budget': weightBudget,
    'inference-contract': inferenceContract,
    linear,
    column,
    row,
    pair,
    'gelu-reference': geluReference,
    'attention-shards': attentionShards,
    collective,
    'head-replication': headReplication,
    'collective-count': collectiveCount,
    'startup-payload': startupPayload,
    pipeline,
    'pipeline-formula': pipelineFormula,
    'pipeline-latency': pipelineLatency,
    'topology-placement': topologyPlacement,
    'context-budget': contextBudget,
    'ring-prefill': ringPrefill,
    'ulysses-layout': ulyssesLayout,
    'decode-history': decodeHistory,
    'mass-merge': massMerge,
    'expert-dispatch': expertDispatch,
    capacity,
    'local-fit': localFit,
    'replica-layouts': replicaLayouts,
    'phase-handoff': phaseHandoff,
    'fit-latency-cost': fitLatencyCost,
    'failure-trace': failureTrace,
    transfer,
    'fresh-layout': freshLayout,
  },
});
