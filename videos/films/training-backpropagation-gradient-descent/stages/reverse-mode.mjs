import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintReverseMode(ctx, scene, state, api, C, c, P) {
  const centers = [420, 850, 1260, 1660],
    y = 405;
  withTrainingFocus(ctx, api, 'forward-graph', () => {
    const nodes = [
      String.raw`m=wx=2`,
      String.raw`\hat y=m+b=2`,
      String.raw`e=\hat y-y=-4`,
      String.raw`L=\tfrac12e^2=8`,
    ];
    nodes.forEach((value, i) => {
      drawTrainingPanel(
        ctx,
        api,
        C,
        c,
        centers[i] - 165,
        y - 70,
        330,
        140,
        [C.blue, C.cyan, C.pink, C.green][i],
        () =>
          drawTrainingMath(
            ctx,
            api,
            C,
            value,
            centers[i],
            y + 17,
            39,
            [C.blue, C.cyan, C.pink, C.green][i],
          ),
      );
      if (i < 3) drawTrainingArrow(ctx, api, C, centers[i] + 175, y, centers[i + 1] - 175, y);
    });
    drawTrainingMath(ctx, api, C, String.raw`w=1,\ x=2`, 420, 280, 33, C.blue);
    drawTrainingMath(ctx, api, C, 'b=0', 850, 280, 33, C.cyan);
    drawTrainingMath(ctx, api, C, 'y=6', 1260, 280, 33, C.pink);
  });
  const grad = (id, x, tex, color) =>
    withTrainingFocus(ctx, api, id, () =>
      drawTrainingPanel(ctx, api, C, c, x - 160, 665, 320, 120, color, () =>
        drawTrainingMath(ctx, api, C, tex, x, 742, 43, color),
      ),
    );
  grad(
    'reverse-seed',
    1660,
    P('reverse-seed', 1) > 0 ? String.raw`\bar L=1` : String.raw`\bar L=?`,
    C.green,
  );
  grad(
    'reverse-residual',
    1260,
    P('reverse-residual', 1) === 1 ? String.raw`\bar e=-4` : String.raw`\bar e=?`,
    C.pink,
  );
  grad(
    'reverse-prediction',
    850,
    P('reverse-prediction', 1) === 1 ? String.raw`\bar{\hat y}=-4` : String.raw`\bar{\hat y}=?`,
    C.cyan,
  );
  grad(
    'reverse-product',
    420,
    P('reverse-branch', 2) === 1 ? String.raw`\bar m=-4` : String.raw`\bar m=?`,
    C.green,
  );
  const travel = (from, to, progress, color) => {
    if (progress > 0) {
      const end = from + (to - from) * progress;
      drawTrainingArrow(ctx, api, C, from, 725, end, 725, color, 5);
    }
  };
  travel(1480, 1440, P('reverse-residual', 1), C.pink);
  travel(1080, 1030, P('reverse-prediction', 1), C.cyan);
  drawTrainingMath(ctx, api, C, String.raw`\times e`, 1460, 600, 35, C.pink);
  drawTrainingMath(ctx, api, C, String.raw`\times1`, 1060, 600, 35, C.cyan);
  withTrainingFocus(ctx, api, 'reverse-branch', () => {
    const p = P('reverse-branch', 2);
    drawTrainingArrow(ctx, api, C, 670, 725, 590, 725, C.green);
    drawTrainingMath(
      ctx,
      api,
      C,
      p === 1 ? String.raw`g_b=-4` : String.raw`g_b=?`,
      790,
      930,
      43,
      C.green,
    );
    if (p > 0) {
      drawTrainingLine(ctx, api, C, 850, 800, 850, 845, C.green, 4);
      drawTrainingArrow(ctx, api, C, 850, 845, 790, 870, C.green);
    }
  });
  withTrainingFocus(ctx, api, 'reverse-weight', () => {
    const p = P('reverse-weight', 2);
    drawTrainingMath(
      ctx,
      api,
      C,
      p === 1 ? String.raw`g_w=(-4)\,2=-8` : String.raw`g_w=(-4)\,x`,
      375,
      930,
      43,
      C.blue,
    );
    if (p > 0) drawTrainingArrow(ctx, api, C, 420, 805, 420, 865, C.blue);
  });
  drawTrainingText(
    ctx,
    api,
    C,
    'A bar marks the derivative of the loss with respect to that value',
    960,
    1040,
    27,
    C.muted,
    'center',
  );
  return;
}
export function drawReverseModeStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat);
  return paintReverseMode(ctx, scene, state, api, C, c, P);
}
export default {
  id: 'reverse-mode',
  draw: drawReverseModeStage,
  cues: [
    'reverse-forward',
    'reverse-seed',
    'reverse-residual',
    'reverse-prediction',
    'reverse-branch',
    'reverse-weight',
  ],
};
