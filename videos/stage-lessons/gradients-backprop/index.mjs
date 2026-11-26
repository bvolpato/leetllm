// Gradients and Backprop: 28-scene Cinematic Stage Lesson (Vizmatic 0.10.0)
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGradientsInvariants } from './shared.mjs';
import {
  derivativeLimit,
  parametersShapeLoss,
  probeNeighbor,
  subjectIntro,
  whyTrain,
} from './scenes/act1-foundations.mjs';
import {
  gradientGeometry,
  gradientVector,
  stableScale,
  stepSizeLimits,
  updateStep,
} from './scenes/act2-gradients-descent.mjs';
import {
  chainRule,
  forwardGraph,
  pathAccumulation,
  reluCorner,
  reluGate,
} from './scenes/act3-backprop-relu.mjs';
import {
  batchConditioning,
  gradientCheck,
  reverseMode,
  vectorSeed,
} from './scenes/act4-batch-vjp.mjs';
import {
  checkBackwardRule,
  expandedStorage,
  pytorchLoop,
  savedOutput,
} from './scenes/act5-pytorch-mechanics.mjs';
import {
  deepProducts,
  freshNonlinear,
  keepTheModelHonest,
  nonlinearForward,
  nonlinearUpdate,
} from './scenes/act6-nonlinear-mastery.mjs';

export default cinematicLesson({
  id: 'gradients-backprop',
  accent: COSMOS.cyan,
  invariants: verifyGradientsInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'why-train': whyTrain,
    'parameters-shape-loss': parametersShapeLoss,
    'probe-neighbor': probeNeighbor,
    'derivative-limit': derivativeLimit,
    'gradient-vector': gradientVector,
    'gradient-geometry': gradientGeometry,
    'update-step': updateStep,
    'step-size-limits': stepSizeLimits,
    'stable-scale': stableScale,
    'forward-graph': forwardGraph,
    'chain-rule': chainRule,
    'relu-gate': reluGate,
    'relu-corner': reluCorner,
    'path-accumulation': pathAccumulation,
    'batch-conditioning': batchConditioning,
    'reverse-mode': reverseMode,
    'vector-seed': vectorSeed,
    'gradient-check': gradientCheck,
    'check-backward-rule': checkBackwardRule,
    'pytorch-loop': pytorchLoop,
    'saved-output': savedOutput,
    'expanded-storage': expandedStorage,
    'nonlinear-forward': nonlinearForward,
    'nonlinear-update': nonlinearUpdate,
    'deep-products': deepProducts,
    'keep-the-model-honest': keepTheModelHonest,
    'fresh-nonlinear': freshNonlinear,
  },
});
