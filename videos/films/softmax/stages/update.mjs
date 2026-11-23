import { updateCueState } from '../model.mjs';
import {
  bars,
  drawText,
  equation,
  header,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
export function paintSoftmaxOriginalUpdate(
  ctx,
  scene,
  state,
  api,
  C,
  b,
  p,
  cues,
  colors,
  xs,
  amount,
  starts,
) {
  const v = updateCueState(
    b,
    amount('logit-update-rule-b1-1'),
    amount('updated-probabilities-b2-1'),
    amount('updated-target-loss-b2-2'),
  );
  header(ctx, api, C, 'Observed target: slept');
  target(ctx, api, 'updated-target-loss', () =>
    drawText(ctx, api, C, 'Target loss: ' + v.loss.toFixed(3), 960, 365, 40, C.green, 'center'),
  );
  target(ctx, api, 'updated-probabilities', () => bars(ctx, api, colors, v.probabilities));
  target(ctx, api, 'logit-update-values', () =>
    drawText(
      ctx,
      api,
      C,
      'logits [' +
        v.logits.map((z) => z.toFixed(3)).join(', ') +
        '] · step ' +
        Math.round(v.amount * 100) +
        '%',
      960,
      915,
      32,
      C.ink,
      'center',
    ),
  );
  target(ctx, api, 'logit-update-rule', () =>
    equation(ctx, api, C, 'z(\\alpha)=z-\\alpha\\eta(p-y)\\quad\\eta=1.5', 960, 1020, 43, C.cyan),
  );
}
export function drawUpdateStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalUpdate);
}
export default {
  id: 'update',
  draw: drawUpdateStage,
  cues: ['logit-update-rule-b1-1', 'updated-probabilities-b2-1', 'updated-target-loss-b2-2'],
};
