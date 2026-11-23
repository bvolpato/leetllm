import { GRAD, LOGITS, PROBS } from '../fixtures.mjs';
import { lossTrace } from '../arithmetic.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteLossInputContract(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  drawCompleteHead(
    ctx,
    api,
    C,
    b === 2 ? 'Type, shape and alignment are separate checks' : 'Change only what enters the loss',
  );
  if (b < 2) {
    drawCompleteBox(ctx, api, C, 'logits [3, 1, 0]', 410, 440, 500, 100, C.blue, 37);
    const repaired = b === 1 && started('api-remove-extra'),
      second = b === 1 && started('api-extra-softmax') && !repaired;
    if (second) {
      drawCompleteArrow(ctx, api, C, 700, 440, 830, 440, C.pink);
      drawCompleteBox(ctx, api, C, 'softmax', 1000, 440, 270, 100, C.pink, 34);
      drawCompleteArrow(ctx, api, C, 1170, 440, 1300, 440, C.pink);
      drawCompleteBox(ctx, api, C, 'cross-entropy', 1510, 440, 340, 100, C.pink, 30);
      drawCompleteText(
        ctx,
        api,
        C,
        'new loss inputs [' + PROBS.map((v) => v.toFixed(3)).join(', ') + ']',
        960,
        635,
        32,
        C.pink,
        'center',
      );
    } else {
      drawCompleteArrow(ctx, api, C, 710, 440, 1230, 440, C.green);
      drawCompleteBox(ctx, api, C, 'cross-entropy', 1490, 440, 380, 100, C.green, 32);
    }
    const v = second ? m.second : lossTrace(LOGITS, 1),
      gradient = second ? m.wrongGradient[1] : GRAD[1];
    if (second ? started('api-extra-result') : b > 0 || started('api-direct-result')) {
      drawCompleteText(
        ctx,
        api,
        C,
        'loss ' + v.loss.toFixed(6),
        600,
        780,
        39,
        second ? C.pink : C.green,
        'center',
      );
      drawCompleteText(
        ctx,
        api,
        C,
        'upstream slept gradient ' + gradient.toFixed(6),
        1280,
        780,
        36,
        second ? C.pink : C.green,
        'center',
      );
    }
    if (repaired)
      drawCompleteText(
        ctx,
        api,
        C,
        'Repaired: raw logits enter the loss; original loss and gradient return.',
        960,
        930,
        32,
        C.green,
        'center',
      );
    drawCompleteNote(
      ctx,
      api,
      C,
      'Same scores, target and upstream parameters. A smaller printed loss does not prove improvement.',
    );
  } else {
    drawCompleteBox(ctx, api, C, '[B, S, V]', 420, 420, 420, 110, C.blue, 45);
    drawCompleteText(ctx, api, C, 'language-model output', 420, 535, 29, C.blue, 'center');
    if (started('api-class-axis')) {
      drawCompleteArrow(ctx, api, C, 680, 420, 1120, 420, C.cyan);
      drawCompleteBox(ctx, api, C, '[B, V, S]', 1430, 420, 460, 110, C.cyan, 45);
      drawCompleteText(
        ctx,
        api,
        C,
        'integer target [B, S] · long',
        1430,
        535,
        29,
        C.green,
        'center',
      );
    }
    if (started('api-flatten')) {
      drawCompleteArrow(ctx, api, C, 420, 590, 420, 700, C.blue);
      drawCompleteBox(ctx, api, C, '[B × S, V]', 420, 790, 440, 110, C.blue, 42);
      drawCompleteText(
        ctx,
        api,
        C,
        'target [B × S] · same token order',
        1180,
        790,
        32,
        C.green,
        'center',
      );
    }
    if (started('api-probability-target'))
      drawCompleteText(
        ctx,
        api,
        C,
        'float targets: same shape as logits + valid distribution on the class axis',
        960,
        960,
        30,
        C.yellow,
        'center',
      );
  }
}
export function drawLossInputContractStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteLossInputContract);
}
export default {
  id: 'loss-input-contract',
  draw: drawLossInputContractStage,
  cues: [
    'loss-input-contract-0',
    'api-direct-result',
    'loss-input-contract-1',
    'api-extra-softmax',
    'api-remove-extra',
    'api-extra-result',
    'loss-input-contract-2',
    'api-probability-target',
    'api-class-axis',
    'api-flatten',
  ],
};
