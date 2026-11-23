import { regularizedHistory } from '../arithmetic.mjs';
import { history } from '../fixtures.mjs';
import {
  drawArrow,
  drawBox,
  drawEquation,
  drawMatrix,
  drawText,
  footer,
  mark,
} from '../defaults.mjs';
export function drawRegularizer(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-regularizer-b' + currentBeat);
  const paint = () => {
    const h = regularizedHistory(),
      known = currentBeat > 0 || resultComplete('penalty-half');
    drawText(
      ctx,
      api,
      'Weight-only penalty · bias remains unregularized',
      960,
      270,
      34,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      drawMatrix(ctx, api, [2, -1], 250, 410, {
        cw: 180,
        ch: 100,
        color: themeColors.blue,
        label: 'exact unregularized weights',
      });
      drawMatrix(ctx, api, [4, 1], 900, 410, {
        cw: 180,
        ch: 100,
        color: themeColors.pink,
        label: 'squared weights',
      });
      drawArrow(ctx, api, 660, 460, 860, 460);
      if (known) drawEquation(ctx, api, '0.1(4+1)=0.5', 960, 680, 48);
      drawMatrix(ctx, api, [0.4, -0.2], 330, 850, {
        cw: 200,
        ch: 90,
        color: themeColors.green,
        known: resultComplete('penalty-gradient'),
        label: 'weight gradient 2λw',
      });
      drawBox(ctx, api, 'bias gradient 0', 1180, 850, 540, 90, themeColors.green);
    } else if (currentBeat === 1) {
      const plot = teaching.axes({
          x: 240,
          y: 430,
          width: 1080,
          height: 390,
          xDomain: [0, 80],
          yDomain: [0, 4],
          xTicks: [0, 20, 40, 60, 80],
          yTicks: [0, 1, 2, 3, 4],
          xLabel: 'actual computed updates',
          yLabel: 'objective value',
          fontSize: 26,
        }),
        count = resultComplete('regularized-final') ? 80 : Math.floor(U * 80);
      teaching.curve({
        plot,
        points: h.slice(0, count + 1).map((v, i) => ({
          x: i,
          y: v.objective,
        })),
        color: themeColors.pink,
        width: 5,
      });
      teaching.curve({
        plot,
        points: history.slice(0, count + 1).map((v, i) => ({
          x: i,
          y: v.loss,
        })),
        color: themeColors.cyan,
        width: 5,
      });
      drawText(ctx, api, 'regularized objective', 1550, 420, 29, themeColors.pink);
      if (resultComplete('regularized-final'))
        drawText(ctx, api, '0.399595', 1550, 500, 40, themeColors.pink);
      drawText(ctx, api, 'unregularized MSE', 1550, 670, 29, themeColors.cyan);
      if (resultComplete('unregularized-final'))
        drawText(ctx, api, '0.007605', 1550, 750, 40, themeColors.cyan);
      drawText(ctx, api, 'Different objective definitions', 960, 940, 34, themeColors.yellow);
    } else {
      drawEquation(ctx, api, 'R(w)=\\lambda\\sum_j w_j^2', 960, 420, 54);
      drawEquation(ctx, api, '\\nabla_wR=2\\lambda w', 960, 610, 54, themeColors.green);
      drawBox(ctx, api, 'same named gradient paths', 220, 820, 650, 90, themeColors.blue);
      drawBox(ctx, api, 'finite difference + dtype step', 1080, 820, 650, 90, themeColors.cyan);
    }
    footer(
      ctx,
      api,
      'Regularization changes the objective; lower unregularized fit error is not guaranteed',
    );
  };
  mark(ctx, api, 'jx-regularizer-mechanism', paint);
}
export default {
  id: 'regularizer',
  draw: drawRegularizer,
  cues: [
    'jx-regularizer-b0',
    'penalty-half',
    'penalty-gradient',
    'jx-regularizer-b1',
    'regularized-final',
    'unregularized-final',
    'jx-regularizer-b2',
  ],
};
