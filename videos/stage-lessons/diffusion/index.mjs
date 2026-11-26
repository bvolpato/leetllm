// Diffusion: How Noise Becomes an Image: 33-scene Cinematic Stage Lesson
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyDiffusionInvariants } from './shared.mjs';
import { coefficients, forward, forwardSchedule, intro, training } from './scenes/act1-forward.mjs';
import {
  reverse,
  reversePosterior,
  reverseTrace,
  trainingTargets,
} from './scenes/act2-reverse.mjs';
import { ddimContract, samplers, score, transport } from './scenes/act3-manifold.mjs';
import {
  architectures,
  conditioning,
  crossRead,
  flowPaths,
  guidance,
  timeConditioning,
} from './scenes/act4-architecture.mjs';
import {
  cfgApi,
  cfgTraining,
  gemmaSystem,
  latent,
  latentContract,
  textCanvas,
} from './scenes/act5-latent-text.mjs';
import {
  compute,
  controlsFast,
  freshRelease,
  productLanes,
  publication,
  recap,
  releaseEvidence,
  reproducibility,
} from './scenes/act6-systems-recap.mjs';

export default cinematicLesson({
  id: 'diffusion',
  accent: COSMOS.cyan,
  invariants: verifyDiffusionInvariants,
  scenes: {
    intro,
    forward,
    coefficients,
    'forward-schedule': forwardSchedule,
    training,
    'reverse-posterior': reversePosterior,
    'training-targets': trainingTargets,
    reverse,
    'reverse-trace': reverseTrace,
    score,
    transport,
    samplers,
    'ddim-contract': ddimContract,
    architectures,
    'time-conditioning': timeConditioning,
    'flow-paths': flowPaths,
    conditioning,
    'cross-read': crossRead,
    guidance,
    'cfg-training': cfgTraining,
    'cfg-api': cfgApi,
    latent,
    'latent-contract': latentContract,
    'text-canvas': textCanvas,
    'gemma-system': gemmaSystem,
    'controls-fast': controlsFast,
    compute,
    'product-lanes': productLanes,
    reproducibility,
    publication,
    'release-evidence': releaseEvidence,
    'fresh-release': freshRelease,
    recap,
  },
});
