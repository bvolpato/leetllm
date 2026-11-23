import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  formatTrainingNumber,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintForward(ctx, scene, state, api, C, c, P, D) {
  withTrainingFocus(ctx, api, 'affine-product', () => {
    drawTrainingMath(ctx, api, C, 'x=2', 260, 365, 48, C.blue);
    drawTrainingMath(ctx, api, C, 'w=1', 260, 485, 48, C.blue);
    drawTrainingArrow(ctx, api, C, 420, 420, 610, 420, C.blue);
    drawTrainingPanel(ctx, api, C, c, 640, 340, 300, 160, C.blue, () =>
      drawTrainingMath(ctx, api, C, 'wx=2', 790, 440, 52, C.blue),
    );
  });
  withTrainingFocus(ctx, api, 'affine-bias', () => {
    drawTrainingArrow(ctx, api, C, 970, 420, 1130, 420);
    drawTrainingPanel(ctx, api, C, c, 1160, 340, 520, 160, C.cyan, () =>
      drawTrainingMath(ctx, api, C, String.raw`\hat y=2+0=2\text{ ms}`, 1420, 440, 46, C.cyan),
    );
    drawTrainingMath(ctx, api, C, 'b=0', 1030, 570, 39, C.cyan);
  });
  withTrainingFocus(ctx, api, 'signed-residual', () => {
    drawTrainingMath(
      ctx,
      api,
      C,
      D('forward-error', 1) ? String.raw`e=\hat y-y=2-6=-4\text{ ms}` : String.raw`e=\hat y-y`,
      690,
      755,
      48,
      C.pink,
    );
  });
  withTrainingFocus(ctx, api, 'error-area', () =>
    c.fade(P('forward-square', 1), () => {
      const x = 1390,
        y = 655,
        side = 220,
        half = P('forward-half', 1);
      c.panel({
        x,
        y,
        width: side,
        height: side,
        fill: C.pink,
        stroke: C.pink,
        radius: 0,
      });
      if (half > 0)
        c.panel({
          x: x + side * (1 - half / 2),
          y,
          width: (side * half) / 2,
          height: side,
          fill: C.panel,
          stroke: C.panel,
          radius: 0,
        });
      drawTrainingText(ctx, api, C, '4 ms', x + side / 2, y + side + 48, 29, C.pink, 'center');
      if (D('forward-half', 1))
        drawTrainingMath(ctx, api, C, String.raw`L=8\text{ ms}^2`, 1500, 1010, 43, C.yellow);
      else
        drawTrainingText(
          ctx,
          api,
          C,
          'Current area ' + formatTrainingNumber(ctx, api, 16 * (1 - half / 2), 2) + ' ms²',
          1500,
          1010,
          31,
          C.yellow,
          'center',
        );
    }),
  );
  drawTrainingMath(ctx, api, C, String.raw`L=\tfrac12(\hat y-y)^2`, 680, 950, 52, C.yellow);
  return;
}
export function drawForwardStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat),
    D = (id, beat = 0) => P(id, beat) === 1;
  return paintForward(ctx, scene, state, api, C, c, P, D);
}
export default {
  id: 'forward',
  draw: drawForwardStage,
  cues: ['forward-weight', 'forward-bias', 'forward-error', 'forward-square', 'forward-half'],
};
