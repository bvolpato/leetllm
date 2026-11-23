import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintOneUpdate(ctx, scene, state, api, C, c, b, s, D) {
  withTrainingFocus(ctx, api, 'optimizer-rule', () =>
    drawTrainingMath(
      ctx,
      api,
      C,
      String.raw`\theta' = \theta-\eta\nabla L`,
      960,
      300,
      54,
      C.yellow,
    ),
  );
  drawTrainingText(
    ctx,
    api,
    C,
    'Original gradients stay tied to the original forward pass',
    960,
    395,
    29,
    C.muted,
    'center',
  );
  drawTrainingMath(
    ctx,
    api,
    C,
    String.raw`g_w=-8\qquad g_b=-4\qquad\eta=0.1`,
    960,
    475,
    46,
    C.yellow,
  );
  withTrainingFocus(ctx, api, 'updated-parameters', () => {
    drawTrainingPanel(ctx, api, C, c, 230, 550, 650, 145, s.updated ? C.green : C.blue, () =>
      drawTrainingMath(
        ctx,
        api,
        C,
        s.updated ? String.raw`w:1\longrightarrow1.8` : 'w=1',
        555,
        640,
        52,
        s.updated ? C.green : C.blue,
      ),
    );
    drawTrainingPanel(ctx, api, C, c, 1040, 550, 650, 145, s.updated ? C.green : C.cyan, () =>
      drawTrainingMath(
        ctx,
        api,
        C,
        s.updated ? String.raw`b:0\longrightarrow0.4` : 'b=0',
        1365,
        640,
        52,
        s.updated ? C.green : C.cyan,
      ),
    );
  });
  if (b > 0) {
    withTrainingFocus(ctx, api, 'prediction-contributions', () => {
      drawTrainingText(
        ctx,
        api,
        C,
        'Prediction gain from the two parameter changes',
        960,
        775,
        31,
        C.ink,
        'center',
      );
      const x = 430,
        y = 815,
        scale = 400;
      c.panel({
        x,
        y,
        width: Math.max(1, scale * s.weightGain),
        height: 65,
        fill: C.blue,
        stroke: C.blue,
        radius: 0,
      });
      c.panel({
        x: x + 640,
        y,
        width: Math.max(1, scale * s.biasGain),
        height: 65,
        fill: C.cyan,
        stroke: C.cyan,
        radius: 0,
      });
      drawTrainingMath(ctx, api, C, String.raw`\Delta w\,x=1.6\text{ ms}`, 750, 940, 35, C.blue);
      drawTrainingMath(ctx, api, C, String.raw`\Delta b=0.4\text{ ms}`, 1150, 940, 35, C.cyan);
    });
    withTrainingFocus(ctx, api, 'updated-request', () => {
      const ready = D('update-payoff', 1);
      drawTrainingText(
        ctx,
        api,
        C,
        ready ? 'Re-evaluated' : 'Re-evaluating',
        1600,
        790,
        29,
        ready ? C.green : C.muted,
        'center',
      );
      drawTrainingMath(
        ctx,
        api,
        C,
        ready ? String.raw`\hat y:2\to4` : String.raw`\hat y=?`,
        1600,
        855,
        37,
        ready ? C.green : C.muted,
      );
      drawTrainingMath(
        ctx,
        api,
        C,
        ready ? String.raw`L:8\to2` : 'L=?',
        1600,
        925,
        37,
        ready ? C.green : C.muted,
      );
    });
  }
  return;
}
export function drawOneUpdateStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat),
    D = (id, beat = 0) => P(id, beat) === 1;
  return paintOneUpdate(ctx, scene, state, api, C, c, b, s, D);
}
export default {
  id: 'one-update',
  draw: drawOneUpdateStage,
  cues: [
    'update-rule',
    'update-apply',
    'update-weight-contribution',
    'update-bias-contribution',
    'update-payoff',
  ],
};
