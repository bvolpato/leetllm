import { WORDS } from '../fixtures.mjs';
import { card, drawText, target, withSoftmaxOriginalFrame } from '../defaults.mjs';
export function paintSoftmaxOriginalIntro(
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
  card(ctx, api, C, 'The dog …', 960, 370, C.cyan, 650, 110, 49);
  WORDS.forEach((word, i) => card(ctx, api, C, word, xs[i], 610, colors[i], 330, 110, 48));
  if (b > 1 || (b === 1 && starts('intro-favorite')))
    target(ctx, api, 'model-favorite', () => {
      api.line(ctx, xs[0] - 135, 697, xs[0] + 135, 697, C.blue, 6);
      drawText(ctx, api, C, 'Model favorite', xs[0], 770, 33, C.blue, 'center');
    });
  if (b > 1 || (b === 1 && starts('intro-observed')))
    target(ctx, api, 'observed-word', () => {
      api.line(ctx, xs[1] - 135, 697, xs[1] + 135, 697, C.green, 6);
      drawText(ctx, api, C, 'Observed target', xs[1], 770, 33, C.green, 'center');
    });
  drawText(
    ctx,
    api,
    C,
    b === 0
      ? 'Choose a continuation.'
      : b === 1
        ? 'Train on what happened.'
        : 'How much should slept gain?',
    960,
    960,
    41,
    C.yellow,
    'center',
  );
}
export function drawIntroStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalIntro);
}
export default {
  id: 'intro',
  draw: drawIntroStage,
  cues: ['intro-favorite', 'intro-observed'],
};
