// Cinematic Vizmatic 0.10.0 stage film for `training-loop`
// ("How a PyTorch Training Loop Changes a Model": 26 scenes).
// All numerical values derive from videos/films/training-loop/ and pass build-time invariant checks.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTrainingLoopInvariants } from './shared.mjs';
import { intro, lossContract, phases, scores, tensors } from './scenes/act1-forward-backward.mjs';
import {
  accumulation,
  batching,
  fitBatch,
  microbatchDenominators,
  noneAndMomentum,
} from './scenes/act2-gradients-batches.mjs';
import {
  atomicCheckpoint,
  layerModes,
  resumptionState,
  validation,
} from './scenes/act3-modes-checkpoints.mjs';
import {
  ampPolicy,
  compileContract,
  globalClipping,
  inferenceFeatureBoundary,
  numericalTriage,
  scaleAndStep,
} from './scenes/act4-stability-amp-compile.mjs';
import {
  bigramFloor,
  bigramSelection,
  bigramState,
  freshStaleGradient,
  runReceipt,
  transfer,
} from './scenes/act5-bigram-and-transfer.mjs';

export default cinematicLesson({
  id: 'training-loop',
  accent: COSMOS.cyan,
  invariants: verifyTrainingLoopInvariants,
  scenes: {
    intro,
    tensors,
    'loss-contract': lossContract,
    scores,
    phases,
    'none-and-momentum': noneAndMomentum,
    accumulation,
    'microbatch-denominators': microbatchDenominators,
    batching,
    'fit-batch': fitBatch,
    'layer-modes': layerModes,
    validation,
    'resumption-state': resumptionState,
    'atomic-checkpoint': atomicCheckpoint,
    'numerical-triage': numericalTriage,
    'global-clipping': globalClipping,
    'inference-feature-boundary': inferenceFeatureBoundary,
    'amp-policy': ampPolicy,
    'scale-and-step': scaleAndStep,
    'compile-contract': compileContract,
    'bigram-state': bigramState,
    'bigram-floor': bigramFloor,
    'bigram-selection': bigramSelection,
    'run-receipt': runReceipt,
    transfer,
    'fresh-stale-gradient': freshStaleGradient,
  },
});
