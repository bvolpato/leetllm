import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingDot,
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingRuler,
  drawTrainingText,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintOpening(ctx, scene, state, api, C, P) {
  const predict = P('open-predict'),
    observe = P('open-observe');
  drawTrainingText(ctx, api, C, 'Extra time for one request', 960, 300, 40, C.ink, 'center');
  drawTrainingRuler(ctx, api, C, 570, 2 * predict);
  withTrainingFocus(ctx, api, 'request-prediction', () => {
    drawTrainingDot(ctx, api, C, 270 + 440 * predict, 570, C.blue, 18);
    drawTrainingText(ctx, api, C, 'predicted · 2 ms', 710, 460, 36, C.blue, 'center');
  });
  withTrainingFocus(ctx, api, 'request-observation', () => {
    drawTrainingDot(ctx, api, C, 1590, 570, C.pink, 18);
    drawTrainingText(
      ctx,
      api,
      C,
      observe > 0 ? 'measured · 6 ms' : 'measured · ?',
      1590,
      460,
      36,
      C.pink,
      'center',
    );
  });
  if (observe > 0) {
    drawTrainingLine(ctx, api, C, 710, 655, 1590, 655, C.yellow, 5);
    drawTrainingLine(ctx, api, C, 710, 638, 710, 672, C.yellow);
    drawTrainingLine(ctx, api, C, 1590, 638, 1590, 672, C.yellow);
    drawTrainingText(
      ctx,
      api,
      C,
      '4 ms missing from the prediction',
      1150,
      725,
      36,
      C.yellow,
      'center',
    );
  }
  withTrainingFocus(ctx, api, 'learning-question', () => {
    drawTrainingMath(ctx, api, C, String.raw`\hat y=wx+b`, 960, 865, 56, C.cyan);
    drawTrainingText(
      ctx,
      api,
      C,
      'Which adjustment helps this request?',
      960,
      965,
      34,
      C.muted,
      'center',
    );
  });
  return;
}
export function drawOpeningStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat);
  return paintOpening(ctx, scene, state, api, C, P);
}
export default {
  id: 'opening',
  draw: drawOpeningStage,
  cues: ['open-predict', 'open-observe', 'open-question'],
};
