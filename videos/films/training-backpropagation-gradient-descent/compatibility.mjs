import { cueProgress, sampleModel } from './model.mjs';
import { paintOpening } from './stages/opening.mjs';
import { paintForward } from './stages/forward.mjs';
import { paintSensitivity } from './stages/sensitivity.mjs';
import { paintReverseMode } from './stages/reverse-mode.mjs';
import { paintOneUpdate } from './stages/one-update.mjs';
import { paintGradientCheck } from './stages/gradient-check.mjs';
import { paintAutogradBuffer } from './stages/autograd-buffer.mjs';
import { paintLocalRules } from './stages/local-rules.mjs';
import { paintNonlinearRequest } from './stages/nonlinear-request.mjs';
import { paintTrainingLoop } from './stages/training-loop.mjs';
import { paintBatches } from './stages/batches.mjs';
import { paintLearningRate } from './stages/learning-rate.mjs';
import { paintDeepGradients } from './stages/deep-gradients.mjs';
import { paintInitialization } from './stages/initialization.mjs';
import { paintDiagnosis } from './stages/diagnosis.mjs';
import { paintValidation } from './stages/validation.mjs';
import { paintNetworkTransfer } from './stages/network-transfer.mjs';
import { paintNextLoss } from './stages/next-loss.mjs';
export function draw(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat),
    D = (id, beat = 0) => P(id, beat) === 1;
  switch (scene.id) {
    case 'nonlinear-request':
    case 'network-transfer':
      return paintNetworkTransfer(ctx, scene, state, api, s);
    case 'diagnosis':
      return paintDiagnosis(ctx, scene, state, api);
    case 'next-loss':
      return paintNextLoss(ctx, scene, state, api);
    case 'opening':
      return paintOpening(ctx, scene, state, api, C, P);
    case 'forward':
      return paintForward(ctx, scene, state, api, C, c, P, D);
    case 'sensitivity':
      return paintSensitivity(ctx, scene, state, api, C, t, P, D);
    case 'reverse-mode':
      return paintReverseMode(ctx, scene, state, api, C, c, P);
    case 'one-update':
      return paintOneUpdate(ctx, scene, state, api, C, c, b, s, D);
    case 'gradient-check':
      return paintGradientCheck(ctx, scene, state, api, C, t, D);
    case 'autograd-buffer':
      return paintAutogradBuffer(ctx, scene, state, api, C, c, b, s);
    case 'local-rules':
      return paintLocalRules(ctx, scene, state, api, C, c, b, P);
    case 'training-loop':
      return paintTrainingLoop(ctx, scene, state, api, C, c, b, P);
    case 'batches':
      return paintBatches(ctx, scene, state, api, C, c, b, s, P);
    case 'learning-rate':
      return paintLearningRate(ctx, scene, state, api, C, t, b, P);
    case 'deep-gradients':
      return paintDeepGradients(ctx, scene, state, api, C, c, t, b, s);
    case 'initialization':
      return paintInitialization(ctx, scene, state, api, C, c, b, s);
    case 'validation':
      return paintValidation(ctx, scene, state, api, C, c, t, b, s);
    default:
      throw new Error(`Unknown training scene: ${scene.id}`);
  }
}
