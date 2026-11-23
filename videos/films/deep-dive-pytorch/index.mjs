import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import strides from './stages/strides.mjs';
import tensorContract from './stages/tensor-contract.mjs';
import dispatchLayers from './stages/dispatch-layers.mjs';
import tapeLifecycle from './stages/tape-lifecycle.mjs';
import autograd from './stages/autograd.mjs';
import attention from './stages/attention.mjs';
import attentionSelector from './stages/attention-selector.mjs';
import maskModes from './stages/mask-modes.mjs';
import compile from './stages/compile.mjs';
import compilerRegions from './stages/compiler-regions.mjs';
import autocastBoundary from './stages/autocast-boundary.mjs';
import placement from './stages/placement.mjs';
import processGroups from './stages/process-groups.mjs';
import meshShapes from './stages/mesh-shapes.mjs';
import tensorSplit from './stages/tensor-split.mjs';
import pipelineSchedule from './stages/pipeline-schedule.mjs';
import pipelineScaling from './stages/pipeline-scaling.mjs';
import residency from './stages/residency.mjs';
import fsdpHooks from './stages/fsdp-hooks.mjs';
import livePeak from './stages/live-peak.mjs';
import recovery from './stages/recovery.mjs';
import dcpLoad from './stages/dcp-load.mjs';
import elasticIdentity from './stages/elastic-identity.mjs';
import optimizerCounter from './stages/optimizer-counter.mjs';
import ownersDebug from './stages/owners-debug.mjs';
import projectSource from './stages/project-source.mjs';
import freshCounter from './stages/fresh-counter.mjs';
export { adam, address, pipelineSlots, tpProjectionFixture } from './arithmetic.mjs';
export {
  attentionConstruction,
  autogradTrace,
  gatheredCount,
  recoveryConstruction,
  residencyState,
  sampleModel,
  sampleOriginalModel,
} from './construction.mjs';
export { validateModel, validateOriginalModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-pytorch',
  validateModel,
  scenes: [
    intro,
    strides,
    tensorContract,
    dispatchLayers,
    tapeLifecycle,
    autograd,
    attention,
    attentionSelector,
    maskModes,
    compile,
    compilerRegions,
    autocastBoundary,
    placement,
    processGroups,
    meshShapes,
    tensorSplit,
    pipelineSchedule,
    pipelineScaling,
    residency,
    fsdpHooks,
    livePeak,
    recovery,
    dcpLoad,
    elasticIdentity,
    optimizerCounter,
    ownersDebug,
    projectSource,
    freshCounter,
  ],
});
export const draw = definition.draw;
export default definition;
