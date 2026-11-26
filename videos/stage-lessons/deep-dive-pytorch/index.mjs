// Deep Dive - PyTorch: Full-bleed cinematic Vizmatic 0.10.0 stage film (28 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPytorchInvariants } from './parts.mjs';

import intro from './scenes/intro.mjs';
import strides from './scenes/strides.mjs';
import tensorContract from './scenes/tensor-contract.mjs';
import dispatchLayers from './scenes/dispatch-layers.mjs';
import tapeLifecycle from './scenes/tape-lifecycle.mjs';
import autograd from './scenes/autograd.mjs';
import attention from './scenes/attention.mjs';
import attentionSelector from './scenes/attention-selector.mjs';
import maskModes from './scenes/mask-modes.mjs';
import compile from './scenes/compile.mjs';
import compilerRegions from './scenes/compiler-regions.mjs';
import autocastBoundary from './scenes/autocast-boundary.mjs';
import placement from './scenes/placement.mjs';
import processGroups from './scenes/process-groups.mjs';
import meshShapes from './scenes/mesh-shapes.mjs';
import tensorSplit from './scenes/tensor-split.mjs';
import pipelineSchedule from './scenes/pipeline-schedule.mjs';
import pipelineScaling from './scenes/pipeline-scaling.mjs';
import residency from './scenes/residency.mjs';
import fsdpHooks from './scenes/fsdp-hooks.mjs';
import livePeak from './scenes/live-peak.mjs';
import recovery from './scenes/recovery.mjs';
import dcpLoad from './scenes/dcp-load.mjs';
import elasticIdentity from './scenes/elastic-identity.mjs';
import optimizerCounter from './scenes/optimizer-counter.mjs';
import ownersDebug from './scenes/owners-debug.mjs';
import projectSource from './scenes/project-source.mjs';
import freshCounter from './scenes/fresh-counter.mjs';

export default cinematicLesson({
  id: 'deep-dive-pytorch',
  accent: COSMOS.blue,
  invariants: verifyPytorchInvariants,
  scenes: {
    intro,
    strides,
    'tensor-contract': tensorContract,
    'dispatch-layers': dispatchLayers,
    'tape-lifecycle': tapeLifecycle,
    autograd,
    attention,
    'attention-selector': attentionSelector,
    'mask-modes': maskModes,
    compile,
    'compiler-regions': compilerRegions,
    'autocast-boundary': autocastBoundary,
    placement,
    'process-groups': processGroups,
    'mesh-shapes': meshShapes,
    'tensor-split': tensorSplit,
    'pipeline-schedule': pipelineSchedule,
    'pipeline-scaling': pipelineScaling,
    residency,
    'fsdp-hooks': fsdpHooks,
    'live-peak': livePeak,
    recovery,
    'dcp-load': dcpLoad,
    'elastic-identity': elasticIdentity,
    'optimizer-counter': optimizerCounter,
    'owners-debug': ownersDebug,
    'project-source': projectSource,
    'fresh-counter': freshCounter,
  },
});
