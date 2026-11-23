import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingCode,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintTrainingLoop(ctx, scene, state, api, C, c, b, P) {
  const cues = ['loop-clear', 'loop-forward', 'loop-loss', 'loop-backward', 'loop-step'];
  const labels = ['zero_grad', 'forward', 'loss', 'backward', 'step'],
    symbols = [
      String.raw`\varnothing`,
      String.raw`\hat y`,
      'L',
      String.raw`\nabla L`,
      String.raw`\theta'`,
    ];
  const colors = [C.blue, C.cyan, C.pink, C.yellow, C.green];
  cues.forEach((id, i) =>
    withTrainingFocus(ctx, api, 'loop-stage-' + i, () => {
      const x = 140 + i * 335,
        p = P(id, i < 4 ? 0 : 1);
      drawTrainingPanel(ctx, api, C, c, x, 350, 290, 190, p > 0 ? colors[i] : C.muted, () => {
        drawTrainingMath(ctx, api, C, symbols[i], x + 145, 435, 58, p > 0 ? colors[i] : C.muted);
        drawTrainingCode(ctx, api, C, labels[i], x + 145, 505, 30, p > 0 ? colors[i] : C.muted);
      });
      if (i < 4) drawTrainingArrow(ctx, api, C, x + 302, 445, x + 322, 445, C.muted, 4);
    }),
  );
  const updated = P('loop-step', 1) > 0,
    cleared = P('loop-next', 1) > 0 || P('loop-backward') === 0;
  drawTrainingMath(
    ctx,
    api,
    C,
    updated ? String.raw`\theta=(1.8,0.4)` : String.raw`\theta=(1,0)`,
    570,
    650,
    45,
    updated ? C.green : C.blue,
  );
  drawTrainingMath(
    ctx,
    api,
    C,
    cleared ? String.raw`\text{grad buffer: cleared}` : String.raw`\text{grad buffer: }(-8,-4)`,
    1410,
    650,
    38,
    cleared ? C.blue : C.yellow,
  );
  if (b === 0 && P('loop-none') > 0) {
    withTrainingFocus(ctx, api, 'loop-buffer-contract', () => {
      drawTrainingPanel(ctx, api, C, c, 150, 760, 740, 220, C.blue, () => {
        drawTrainingText(
          ctx,
          api,
          C,
          'Toy SGD momentum · u = 1 · rate = 0.1',
          520,
          810,
          29,
          C.muted,
          'center',
        );
        drawTrainingText(ctx, api, C, 'None → skip u → 1.000', 520, 880, 33, C.blue, 'center');
        if (P('loop-zero'))
          drawTrainingText(
            ctx,
            api,
            C,
            'Zero + momentum 0.9 × 0.5 → u = 0.955',
            520,
            945,
            29,
            C.yellow,
            'center',
          );
      });
      drawTrainingPanel(ctx, api, C, c, 1030, 760, 740, 220, C.cyan, () => {
        drawTrainingText(ctx, api, C, 'Saved forward tensors', 1400, 815, 32, C.cyan, 'center');
        drawTrainingText(
          ctx,
          api,
          C,
          P('loop-release') ? 'Released after backward' : 'x = 2 · residual = −4',
          1400,
          885,
          31,
          C.ink,
          'center',
        );
        if (P('loop-release'))
          drawTrainingText(
            ctx,
            api,
            C,
            'Build a fresh forward graph before backward',
            1400,
            945,
            27,
            C.yellow,
            'center',
          );
      });
    });
  } else if (b < 2)
    drawTrainingText(
      ctx,
      api,
      C,
      updated
        ? 'Parameters changed; gradient buffers remain until cleared'
        : 'Parameters stay fixed while the gradient is computed',
      960,
      900,
      34,
      C.muted,
      'center',
    );
  else {
    withTrainingFocus(ctx, api, 'evaluation-behavior', () =>
      drawTrainingPanel(ctx, api, C, c, 250, 760, 650, 210, C.green, () => {
        drawTrainingText(ctx, api, C, 'model.eval()', 575, 820, 38, C.green, 'center');
        drawTrainingText(
          ctx,
          api,
          C,
          'Dropout passes every activation',
          575,
          900,
          30,
          C.ink,
          'center',
        );
      }),
    );
    withTrainingFocus(ctx, api, 'evaluation-recording', () =>
      drawTrainingPanel(ctx, api, C, c, 1020, 760, 650, 210, C.blue, () => {
        drawTrainingCode(ctx, api, C, 'torch.no_grad()', 1345, 820, 38, C.blue);
        drawTrainingText(
          ctx,
          api,
          C,
          'Reverse-mode tape stays off',
          1345,
          900,
          30,
          C.ink,
          'center',
        );
      }),
    );
  }
  return;
}
export function drawTrainingLoopStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat);
  return paintTrainingLoop(ctx, scene, state, api, C, c, b, P);
}
export default {
  id: 'training-loop',
  draw: drawTrainingLoopStage,
  cues: [
    'loop-clear',
    'loop-forward',
    'loop-loss',
    'loop-backward',
    'loop-none',
    'loop-zero',
    'loop-release',
    'loop-step',
    'loop-next',
    'loop-eval',
    'loop-no-grad',
  ],
};
