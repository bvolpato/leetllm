import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteLine,
  drawCompleteNote,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteWeightedReduction(
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
  drawCompleteHead(ctx, api, C, 'Same binary predictions and labels · a different mean contract');
  if (b === 0) {
    drawCompleteBox(ctx, api, C, 'integer indices', 500, 420, 580, 100, C.blue, 38);
    drawCompleteBox(ctx, api, C, 'float one-hot', 1400, 420, 580, 100, C.green, 38);
    drawCompleteArrow(ctx, api, C, 500, 500, 500, 650, C.blue);
    drawCompleteArrow(ctx, api, C, 1400, 500, 1400, 650, C.green);
    drawCompleteText(ctx, api, C, 'weighted numerator', 500, 730, 34, C.ink, 'center');
    drawCompleteText(ctx, api, C, 'weighted numerator', 1400, 730, 34, C.ink, 'center');
    drawCompleteLine(ctx, api, C, 220, 780, 780, 780, C.blue, 3);
    drawCompleteLine(ctx, api, C, 1120, 780, 1680, 780, C.green, 3);
    if (started('weighted-contract')) {
      drawCompleteText(ctx, api, C, 'sum of target-class weights', 500, 845, 30, C.blue, 'center');
      drawCompleteText(ctx, api, C, 'number of positions', 1400, 845, 30, C.green, 'center');
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'Integer formula here uses no smoothing and non-ignored targets.',
    );
  } else if (b === 1) {
    ['target A · weight 2', 'target B · weight 4'].forEach((s, i) => {
      const x = i ? 1400 : 500;
      drawCompleteText(ctx, api, C, s, x, 365, 34, colors[i], 'center');
      api.rect(ctx, x - 220, 420, 220, 60, C.blue);
      api.rect(ctx, x, 420, 220, 60, C.green);
      drawCompleteText(ctx, api, C, 'p = [½, ½]', x, 545, 32, C.ink, 'center');
      if (started('weighted-numerator'))
        drawCompleteText(ctx, api, C, [2, 4][i] + ' × ln 2', x, 650, 38, colors[i], 'center');
    });
    if (started('weighted-numerator'))
      drawCompleteEquation(ctx, api, C, 'S=2\\ln2+4\\ln2=6\\ln2', 960, 765, 40, C.yellow);
    if (started('weighted-integer')) {
      drawCompleteBox(
        ctx,
        api,
        C,
        'integer: S / 6 = ' + m.integerWeighted.toFixed(6),
        500,
        900,
        730,
        100,
        C.blue,
        31,
      );
    }
    if (started('weighted-float')) {
      drawCompleteBox(
        ctx,
        api,
        C,
        'float: S / 2 = ' + m.floatWeighted.toFixed(6),
        1400,
        900,
        730,
        100,
        C.green,
        31,
      );
    }
  } else {
    drawCompleteText(ctx, api, C, 'microbatch A', 500, 365, 34, C.blue, 'center');
    drawCompleteText(ctx, api, C, 'microbatch B', 1400, 365, 34, C.green, 'center');
    drawCompleteBox(ctx, api, C, '(2 ln2, weight2)', 500, 485, 620, 100, C.blue, 36);
    drawCompleteBox(ctx, api, C, '(4 ln2, weight4)', 1400, 485, 620, 100, C.green, 36);
    if (started('weighted-combine')) {
      drawCompleteArrow(ctx, api, C, 500, 550, 760, 680, C.blue);
      drawCompleteArrow(ctx, api, C, 1400, 550, 1160, 680, C.green);
      drawCompleteBox(ctx, api, C, '(6 ln2, weight6)', 960, 760, 650, 100, C.cyan, 38);
      drawCompleteText(
        ctx,
        api,
        C,
        'combine numerator and matching denominator',
        960,
        920,
        35,
        C.yellow,
        'center',
      );
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'Recheck the exact API for smoothing, class weights and probability-target objectives.',
    );
  }
}
export function drawWeightedReductionStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteWeightedReduction);
}
export default {
  id: 'weighted-reduction',
  draw: drawWeightedReductionStage,
  cues: [
    'weighted-reduction-0',
    'weighted-contract',
    'weighted-reduction-1',
    'weighted-numerator',
    'weighted-integer',
    'weighted-float',
    'weighted-reduction-2',
    'weighted-combine',
  ],
};
